import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	deleteMenuFromContext,
	getMenuOfPath,
	MenuTemplate,
	replyMenuToContext,
} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import {
	count as allEventsCount,
	exists as allEventsExists,
	find as allEventsFind,
} from '../../lib/all-events.js';
import {
	DEFAULT_FILTER,
	filterButtonText,
} from '../../lib/inline-menu-filter.js';
import {backMainButtons} from '../../lib/inline-menu.js';
import type {MyContext} from '../../lib/types.js';

const MAX_RESULT_ROWS = 10;
const RESULT_COLUMNS = 2;

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(async ctx => {
	const total = await allEventsCount();

	let text = format.bold('Veranstaltungen');
	text += '\nWelche Events möchtest du hinzufügen?';
	text += '\n\n';

	try {
		const filteredEvents = await findEvents(ctx);

		const filter = ctx.session.eventfilter ?? DEFAULT_FILTER;
		text += filter === DEFAULT_FILTER
			? `Ich habe ${total} Veranstaltungen. Nutze den Filter um die Auswahl einzugrenzen.`
			: `Mit deinem Filter konnte ich ${filteredEvents.length} passende Veranstaltungen finden.`;
	} catch (error) {
		const errorText = error instanceof Error ? error.message : String(error);
		text += 'Filter Error: ';
		text += format.monospace(errorText);
	}

	return {text, parse_mode: format.parse_mode};
});

async function findEvents(ctx: MyContext): Promise<readonly string[]> {
	const filter = ctx.session.eventfilter ?? DEFAULT_FILTER;
	const ignore = Object.keys(ctx.userconfig.mine.events);
	return allEventsFind(filter, ignore);
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
			'Wonach möchtest du die Veranstaltungen filtern?',
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
			return Object.fromEntries(all.map(event => [event.replaceAll('/', ';'), event]));
		} catch {
			return {};
		}
	},
	async do(ctx, key) {
		const event = key.replaceAll(';', '/');
		const isExisting = await allEventsExists(event);
		const isAlreadyInCalendar = Object.keys(ctx.userconfig.mine.events)
			.includes(event);

		if (!isExisting) {
			await ctx.answerCallbackQuery(`${event} existiert nicht!`);
			return true;
		}

		if (isAlreadyInCalendar) {
			await ctx.answerCallbackQuery(`${event} ist bereits in deinem Kalender!`);
			return true;
		}

		ctx.userconfig.mine.events[event] = {};
		await ctx.answerCallbackQuery(`${event} wurde zu deinem Kalender hinzugefügt.`);
		return true;
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.manualRow(backMainButtons);
