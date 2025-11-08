import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	deleteMenuFromContext, getMenuOfPath, MenuTemplate, replyMenuToContext,
} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import {
	count as allEventsCount, directoryExists, find as allEventsFind, getEventName,
} from '../../lib/all-events.ts';
import {filterButtonText} from '../../lib/inline-menu-filter.ts';
import {BACK_BUTTON_TEXT} from '../../lib/inline-menu.ts';
import type {EventDirectory, EventId, MyContext} from '../../lib/types.ts';
import {typedKeys} from '../../lib/javascript-helper.js';

const MAX_RESULT_ROWS = 10;
const RESULT_COLUMNS = 1;

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(async ctx => {
	const total = allEventsCount();
	ctx.session.eventAdd ??= {eventPath: []};

	let text = format.bold('Veranstaltungen');
	text += '\nWelche Events möchtest du hinzufügen?';
	text += '\n\n';

	try {
		const filteredEvents = findEvents(ctx);

		const filter = ctx.session.eventfilter;
		if (filter === undefined) {
			text += `Ich habe ${total} Veranstaltungen. Nutze den Filter um die Auswahl einzugrenzen.`;
		} else {
			const eventCount = Object.keys(filteredEvents.events).length;

			text += `Mit deinem Filter konnte ich ${eventCount} passende Veranstaltungen finden.`;
		}
	} catch (error) {
		const errorText = error instanceof Error ? error.message : String(error);
		text += 'Filter Error: ';
		text += format.monospace(errorText);
	}

	return {text, parse_mode: format.parse_mode};
});

function findEvents(ctx: MyContext): Readonly<EventDirectory> {
	const filter = ctx.session.eventfilter;
	return allEventsFind(filter, ctx.session.eventAdd?.eventPath);
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
	hide: ctx => ctx.session.eventfilter === undefined,
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
			ctx.session.eventAdd ??= {eventPath: []};
			const filteredEvents = findEvents(ctx);
			const alreadySelected = Object.keys(ctx.userconfig.mine.events);

			ctx.session.eventAdd.eventDirectorySubDirectoryItems = Object.keys(filteredEvents.subDirectories);
			const subDirectoryItems = Object.entries(filteredEvents.subDirectories)
				.map(([name, directory], i) =>
					Object.keys(directory.subDirectories ?? {}).length > 0
					|| Object.keys(directory.events ?? {}).length > 0
						? ['d' + i, '🗂️ ' + name]
						: ['x' + i, '🚫 ' + name]);

			const eventItems = Object.entries(filteredEvents.events)
				.map(([eventId, name]) =>
					alreadySelected.includes(eventId)
						? ['e' + eventId, '✅ ' + name]
						: ['e' + eventId, '📅 ' + name]);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Object.fromEntries([
				...subDirectoryItems,
				...eventItems,
			]);
		} catch {
			return {};
		}
	},
	async do(ctx, key) {
		if (key.startsWith('e')) {
			const eventId = key.slice(1) as EventId;
			const eventName = getEventName(eventId);
			const isAlreadyInCalendar = typedKeys(ctx.userconfig.mine.events).includes(eventId);

			if (eventName === undefined) {
				await ctx.answerCallbackQuery(`Event mit Id ${eventId} existiert nicht!`);
				return true;
			}

			if (isAlreadyInCalendar) {
				await ctx.answerCallbackQuery(`${eventName} ist bereits in deinem Kalender!`);
				return true;
			}

			ctx.userconfig.mine.events[eventId] = {};
			await ctx.answerCallbackQuery(`${eventName} wurde zu deinem Kalender hinzugefügt.`);
			return true;
		}

		if (key.startsWith('d')) {
			if (ctx.session.eventAdd === undefined) {
				await ctx.answerCallbackQuery('Interner Zustand ungültig.');
				return true;
			}

			if (ctx.session.eventAdd.eventDirectorySubDirectoryItems !== undefined) {
				const chosenSubDirectory = ctx.session.eventAdd.eventDirectorySubDirectoryItems[Number(key.slice(1))];
				delete ctx.session.eventAdd.eventDirectorySubDirectoryItems;

				if (chosenSubDirectory !== undefined) {
					ctx.session.eventAdd.eventPath.push(chosenSubDirectory);

					if (directoryExists(ctx.session.eventAdd.eventPath)) {
						return true;
					}
				}
			}

			await ctx.answerCallbackQuery('Dieses Verzeichnis gibt es nicht mehr.');
			delete ctx.session.eventAdd;
			return true;
		}

		await ctx.answerCallbackQuery('Dieses Verzeichnis ist leer.');
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

		if (ctx.session.eventAdd?.eventPath === undefined
			|| ctx.session.eventAdd?.eventPath.length === 0) {
			delete ctx.session.eventAdd;
			return '..';
		}

		ctx.session.eventAdd.eventPath.pop();
		if (!directoryExists(ctx.session.eventAdd.eventPath)) {
			delete ctx.session.eventAdd;
		}

		return true;
	},
});
