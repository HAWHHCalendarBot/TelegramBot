import {Composer} from 'grammy';
import {MenuTemplate} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import * as allEvents from '../../lib/all-events.ts';
import {backMainButtons} from '../../lib/inline-menu.ts';
import type {MyContext} from '../../lib/types.ts';
import {getEventName} from '../../lib/all-events.ts';
import {typedEntries, typedKeys} from '../../lib/javascript-helper.js';
import * as gitHelper from '../../lib/git-helper.js';
import * as addMenu from './add.ts';
import * as detailsMenu from './details.ts';

setInterval(async () => gitHelper.pullEventFiles(), 1000 * 60 * 30); // Every 30 minutes
void gitHelper.pullEventFiles();

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(async ctx => {
	delete ctx.session.eventAdd;

	let text = format.bold('Veranstaltungen');
	text += '\n\n';

	const eventIds = typedKeys(ctx.userconfig.mine.events);
	if (eventIds.length > 0) {
		const nonExisting = new Set(allEvents.nonExisting(eventIds));
		text += 'Du hast folgende Veranstaltungen im Kalender:';
		text += '\n';
		text += eventIds
			.map(eventId => {
				let line = '- ';
				if (nonExisting.has(eventId)) {
					line += '⚠️ ';
				}

				line += format.escape(getEventName(eventId));
				return line;
			})
			.sort((a, b) => a.localeCompare(b))
			.join('\n');

		if (nonExisting.size > 0) {
			text += '\n\n';
			text += '⚠️ Du hast Veranstaltungen, die nicht mehr existieren.';
		}
	} else {
		text += 'Du hast aktuell keine Veranstaltungen in deinem Kalender. 😔';
	}

	text += '\n\n';
	const additionalEventsLink = format.url(
		'AdditionalEvents',
		'https://github.com/HAWHHCalendarBot/AdditionalEvents',
	);
	text
		+= `Du bist Tutor und deine Veranstaltung fehlt im Kalenderbot? Wirf mal einen Blick auf ${additionalEventsLink} oder schreib @EdJoPaTo an. ;)`;

	return {
		disable_web_page_preview: true,
		parse_mode: format.parse_mode,
		text,
	};
});

bot.use(addMenu.bot);
bot.use(detailsMenu.bot);

menu.interact('remove-old', {
	text: '🗑 Entferne nicht mehr Existierende',
	async hide(ctx) {
		const nonExisting = allEvents.nonExisting(typedKeys(ctx.userconfig.mine.events));
		return nonExisting.length === 0;
	},
	async do(ctx) {
		const nonExisting = allEvents.nonExisting(typedKeys(ctx.userconfig.mine.events));
		for (const eventId of nonExisting) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete ctx.userconfig.mine.events[eventId];
		}

		return true;
	},
});

menu.submenu('a', addMenu.menu, {text: '➕ Veranstaltung hinzufügen'});

menu.chooseIntoSubmenu('d', detailsMenu.menu, {
	columns: 1,
	choices(ctx) {
		const result: Record<string, string> = {};

		for (const [eventId, details] of typedEntries(ctx.userconfig.mine.events)) {
			let title = getEventName(eventId) + ' ';

			if (Object.keys(details.changes ?? {}).length > 0) {
				title += '✏️';
			}

			if (details.alertMinutesBefore !== undefined) {
				title += '⏰';
			}

			if (details.notes) {
				title += '🗒';
			}

			result[eventId] = title.trim();
		}

		return result;
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.manualRow(backMainButtons);
