import {Composer} from 'grammy';
import {MenuTemplate} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import * as allEvents from '../../lib/all-events.ts';
import {getEventName} from '../../lib/all-events.ts';
import {backMainButtons} from '../../lib/inline-menu.ts';
import {typedEntries, typedKeys} from '../../lib/javascript-helper.ts';
import type {MyContext} from '../../lib/types.ts';
import * as addMenu from './add.ts';
import * as detailsMenu from './details.ts';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(async ctx => {
	delete ctx.session.eventAdd;

	let text = format.bold('Veranstaltungen');
	text += '\n\n';

	const eventIds = typedKeys(ctx.userconfig.mine.events);
	if (eventIds.length > 0) {
		const nonExisting = new Set(eventIds.filter(eventId => !allEvents.exists(eventId)));
		text += 'Du hast folgende Veranstaltungen im Kalender:';
		text += '\n';
		text += eventIds
			.map(eventId => {
				let line = '- ';
				if (!allEvents.exists(eventId)) {
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
	hide: ctx =>
		typedKeys(ctx.userconfig.mine.events).every(eventId =>
			allEvents.exists(eventId)),
	do(ctx) {
		for (const eventId of typedKeys(ctx.userconfig.mine.events)) {
			if (!allEvents.exists(eventId)) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete ctx.userconfig.mine.events[eventId];
			}
		}

		return true;
	},
});

menu.submenu('a', addMenu.menu, {text: '➕ Veranstaltung hinzufügen'});

menu.chooseIntoSubmenu('d', detailsMenu.menu, {
	columns: 1,
	choices(ctx) {
		const entries = typedEntries(ctx.userconfig.mine.events)
			.filter(([eventId, _details]) => !eventId.includes('/')) // Skip legacy ids with /
			.map(([eventId, details]) => {
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

				return [eventId, title.trim()] as const;
			})
			.sort((a, b) => a[1]?.localeCompare(b[1]));
		return Object.fromEntries(entries);
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.manualRow(backMainButtons);
