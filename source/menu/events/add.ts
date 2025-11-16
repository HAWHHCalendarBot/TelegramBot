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
	directoryExists,
	directoryHasContent,
	exists as allEventsExists,
	find as allEventsFind,
	getEventName,
} from '../../lib/all-events.ts';
import {BACK_BUTTON_TEXT} from '../../lib/inline-menu.ts';
import {typedEntries, typedKeys} from '../../lib/javascript-helper.js';
import type {EventId, MyContext} from '../../lib/types.ts';

const MAX_RESULT_ROWS = 10;
const RESULT_COLUMNS = 1;

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(ctx => {
	ctx.session.eventAdd ??= {path: []};
	while (!directoryExists(ctx.session.eventAdd.path)) {
		ctx.session.eventAdd.path.pop();
	}

	let text = format.bold('Veranstaltungen');
	for (const segment of ctx.session.eventAdd.path) {
		text += '\n🗂️ ' + segment;
	}

	text += '\n\nWelche Events möchtest du hinzufügen?';
	text += '\n\n';

	try {
		if (ctx.session.eventAdd.filter) {
			const filteredEvents = allEventsFind(
				ctx.session.eventAdd.filter,
				ctx.session.eventAdd.path,
			);
			const eventCount = Object.keys(filteredEvents.events ?? {}).length;
			text += `Mit deinem Filter konnte ich ${eventCount} passende Veranstaltungen finden.`;
		} else if (ctx.session.eventAdd.path.length === 0) {
			const total = allEventsCount();
			text += `Ich habe ${total} Veranstaltungen. Nutze den Filter oder die Ordner um die Auswahl einzugrenzen.`;
		} else {
			text += 'Nutze den Filter oder die Ordner um die Auswahl einzugrenzen.';
		}
	} catch (error) {
		const errorText = error instanceof Error ? error.message : String(error);
		text += 'Filter Error: ';
		text += format.monospace(errorText);
	}

	return {text, parse_mode: format.parse_mode};
});

const question = new StatelessQuestion<MyContext>(
	'events-add-filter',
	async (ctx, path) => {
		if (ctx.message.text) {
			ctx.session.eventAdd ??= {path: []};
			ctx.session.eventAdd.filter = ctx.message.text;
		}

		await replyMenuToContext(menu, ctx, path);
	},
);

bot.use(question.middleware());

menu.interact('filter', {
	text(ctx) {
		return ctx.session.eventAdd?.filter
			? `🔎 Filter: ${ctx.session.eventAdd.filter}`
			: '🔎 Ab hier filtern';
	},
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
	joinLastRow: true,
	text: 'Filter aufheben',
	hide: ctx => ctx.session.eventAdd?.filter === undefined,
	do(ctx) {
		delete ctx.session.eventAdd?.filter;
		return true;
	},
});

menu.choose('list', {
	maxRows: MAX_RESULT_ROWS,
	columns: RESULT_COLUMNS,
	choices(ctx) {
		try {
			ctx.session.eventAdd ??= {path: []};
			const filteredEvents = allEventsFind(
				ctx.session.eventAdd.filter,
				ctx.session.eventAdd.path,
			);
			const alreadySelected = typedKeys(ctx.userconfig.mine.events);

			const subDirectoryItems = typedEntries(filteredEvents.subDirectories ?? {}).map(([name, directory], i) => {
				if (!directoryHasContent(directory)) {
					return ['x' + i, '🚫 ' + name];
				}

				return [
					'd' + i + ' ' + name.replaceAll('/', '').slice(0, 48),
					'🗂️ ' + name,
				];
			});

			const eventItems = typedEntries(filteredEvents.events ?? {}).map(([eventId, name]) =>
				alreadySelected.includes(eventId)
					? ['e' + eventId, '✅ ' + name]
					: ['e' + eventId, '📅 ' + name]);

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Object.fromEntries([...subDirectoryItems, ...eventItems]);
		} catch {
			return {};
		}
	},
	async do(ctx, key) {
		if (key.startsWith('e')) {
			const eventId = key.slice(1) as EventId;
			if (!allEventsExists(eventId)) {
				await ctx.answerCallbackQuery(`Event mit Id ${eventId} existiert nicht!`);
				return true;
			}

			const eventName = getEventName(eventId);
			const isAlreadyInCalendar = typedKeys(ctx.userconfig.mine.events).includes(eventId);
			if (isAlreadyInCalendar) {
				await ctx.answerCallbackQuery(`${eventName} ist bereits in deinem Kalender!`);
				return true;
			}

			ctx.userconfig.mine.events[eventId] = {};
			await ctx.answerCallbackQuery(`${eventName} wurde zu deinem Kalender hinzugefügt.`);
			return true;
		}

		if (key.startsWith('x')) {
			await ctx.answerCallbackQuery('Dieses Verzeichnis ist leer.');
			return false;
		}

		const directoryMatch = /^d(\d+) (.+)$/.exec(key);
		if (directoryMatch) {
			const index = Number(directoryMatch[1]);
			const prefix = directoryMatch[2];

			// Inline-menu choices() ensures that the clicked key still exists. As the name is included in the prefix part of the key this can only fail if an event with exactly the same prefix is placed on the same index. This will prevent clicks on not anymore existing choices like directory.json changed or ctx.session lost after bot restart.
			if (!ctx.session.eventAdd || !prefix) {
				// Will never happen as choices() is called first to ensure only existing choices are clicked
				return true;
			}

			const filteredEvents = allEventsFind(
				ctx.session.eventAdd.filter,
				ctx.session.eventAdd.path,
			);
			const filteredSubDirectories = typedEntries(filteredEvents.subDirectories ?? {});
			const chosenSubDirectory = filteredSubDirectories[index]?.[0];
			if (!chosenSubDirectory) {
				// Will never happen as choices() is called first to ensure only existing choices are clicked
				return true;
			}

			ctx.session.eventAdd.path.push(chosenSubDirectory);
			return true;
		}

		return true; // Unknown state
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.interact('back', {
	text: BACK_BUTTON_TEXT,
	do(ctx) {
		if (!ctx.session.eventAdd || ctx.session.eventAdd.path.length === 0) {
			delete ctx.session.eventAdd;
			return '..';
		}

		ctx.session.eventAdd.path.pop();
		return true;
	},
});

menu.interact('top', {
	joinLastRow: true,
	text: '🔝 zur Übersicht…',
	do(ctx) {
		delete ctx.session.eventAdd;
		return '..';
	},
});
