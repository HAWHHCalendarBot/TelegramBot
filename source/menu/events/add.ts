import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	deleteMenuFromContext, getMenuOfPath, MenuTemplate, replyMenuToContext,
} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import {count as allEventsCount, exists as allEventsExists, find as allEventsFind} from '../../lib/all-events.ts';
import {DEFAULT_FILTER, filterButtonText} from '../../lib/inline-menu-filter.ts';
import {BACK_BUTTON_TEXT} from '../../lib/inline-menu.ts';
import type {EventDirectory, EventDirectoryEvent, MyContext} from '../../lib/types.ts';

const MAX_RESULT_ROWS = 10;
const RESULT_COLUMNS = 1;

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(async ctx => {
	const total = await allEventsCount();
	ctx.session.eventPath ??= [];

	let text = format.bold('Veranstaltungen');
	text += '\nWelche Events möchtest du hinzufügen?';
	text += '\n\n';

	try {
		const filteredEvents = await findEvents(ctx);

		const filter = ctx.session.eventfilter;
		text
			+= filter === undefined
				? `Ich habe ${total} Veranstaltungen. Nutze den Filter um die Auswahl einzugrenzen.`
				: `Mit deinem Filter konnte ich ${filteredEvents.length} passende Veranstaltungen finden.`;
	} catch (error) {
		const errorText = error instanceof Error ? error.message : String(error);
		text += 'Filter Error: ';
		text += format.monospace(errorText);
	}

	return {text, parse_mode: format.parse_mode};
});

async function findEvents(ctx: MyContext): Promise<ReadonlyArray<EventDirectoryEvent | [EventDirectory, number[]]>> {
	const filter = ctx.session.eventfilter;
	return allEventsFind(filter, [], ctx.session.eventPath);
}

const question = new StatelessQuestion<MyContext>(
	'events-add-filter',
	async (ctx, path) => {
		if (ctx.message.text) {
			ctx.session.eventfilter = ctx.message.text;
		}

		await replyMenuToContext(menu, ctx, path);
	},
);

bot.use(question.middleware());

menu.interact('filter', {
	text: filterButtonText(ctx => ctx.session.eventfilter),
	async do(ctx, path) {
		await question.replyWithHTML(
			ctx,
			'Wonach möchtest du die Veranstaltungen in diesem Verzeichnis filtern?',
			getMenuOfPath(path),
		);
		await deleteMenuFromContext(ctx);
		return false;
	},
});

menu.interact('filter-clear', {
	text: 'Filter aufheben',
	joinLastRow: true,
	hide: ctx => (ctx.session.eventfilter ?? DEFAULT_FILTER) === DEFAULT_FILTER,
	do(ctx) {
		delete ctx.session.eventfilter;
		return true;
	},
});

menu.choose('a', {
	maxRows: MAX_RESULT_ROWS,
	columns: RESULT_COLUMNS,
	async choices(ctx) {
		try {
			const all = await findEvents(ctx);
			const alreadySelected = Object.keys(ctx.userconfig.mine.events);

			return Object.fromEntries(all.map(element => {
				if ('Id' in element) {
					// Element is event
					const event = element;

					return alreadySelected.includes(event.Id) ? ['e:' + event.Id, '✅ ' + event.Name] : ['e:' + event.Id, '📅 ' + event.Name];
				}

				// Element is directory
				const [dir, path] = element;

				return dir.SubDirectories !== undefined || dir.Events !== undefined ? ['d:' + path.join(':'), '🗂️ ' + dir.Name] : ['dx:' + path.join(':'), '🚫 ' + dir.Name];
			}));
		} catch {
			return {};
		}
	},
	async do(ctx, key) {
		if (key.startsWith('e:')) {
			const eventId = key.slice(2);
			const event = await allEventsExists(eventId);
			const isAlreadyInCalendar = Object.keys(ctx.userconfig.mine.events).includes(eventId);

			if (event === undefined) {
				await ctx.answerCallbackQuery(`Event mit Id ${eventId} existiert nicht!`);
				return true;
			}

			if (isAlreadyInCalendar) {
				await ctx.answerCallbackQuery(`${event.Name} ist bereits in deinem Kalender!`);
				return true;
			}

			ctx.userconfig.mine.events[eventId] = {name: event.Name};
			await ctx.answerCallbackQuery(`${event.Name} wurde zu deinem Kalender hinzugefügt.`);
			return true;
		}

		if (key.startsWith('d:')) {
			ctx.session.eventPath = key.slice(2).split(':').map(Number);

			return true;
		}

		await ctx.answerCallbackQuery('Dieses Verzeichnis ist leer und wird nur aus Gründen der Vollständigkeit dargestellt.');

		return false;
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.interact('back', {
	text: BACK_BUTTON_TEXT,
	async do(ctx) {
		if (ctx.session.eventfilter !== undefined) {
			delete ctx.session.eventfilter;
			return true;
		}

		if (ctx.session.eventPath?.length === 0) {
			delete ctx.session.eventPath;
			return '..';
		}

		ctx.session.eventPath?.pop();
		return true;
	},
});
