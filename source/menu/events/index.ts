import {Composer} from 'grammy';
import {MenuTemplate} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import * as allEvents from '../../lib/all-events.js';
import {backMainButtons} from '../../lib/inline-menu.js';
import type {MyContext} from '../../lib/types.js';
import * as addMenu from './add.js';
import * as detailsMenu from './details.js';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(async ctx => {
	let text = format.bold('Veranstaltungen');
	text += '\n\n';

	const events = Object.keys(ctx.userconfig.mine.events);
	events.sort();
	if (events.length > 0) {
		const nonExisting = new Set(await allEvents.nonExisting(events));
		text += 'Du hast folgende Veranstaltungen im Kalender:';
		text += '\n';
		text += events
			.map(o => {
				let line = '- ';
				if (nonExisting.has(o)) {
					line += '⚠️ ';
				}

				line += format.escape(o);
				return line;
			})
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
		const nonExisting = await allEvents.nonExisting(Object.keys(ctx.userconfig.mine.events));
		return nonExisting.length === 0;
	},
	async do(ctx) {
		const nonExisting = new Set(await allEvents.nonExisting(Object.keys(ctx.userconfig.mine.events)));
		for (const name of nonExisting) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete ctx.userconfig.mine.events[name];
		}

		// Only keep changes of events the user still has
		ctx.userconfig.mine.changes = ctx.userconfig.mine.changes.filter(o =>
			Object.keys(ctx.userconfig.mine.events).includes(o.name));

		return true;
	},
});

menu.submenu('a', addMenu.menu, {text: '➕ Veranstaltung hinzufügen'});

menu.chooseIntoSubmenu('d', detailsMenu.menu, {
	columns: 1,
	choices(ctx) {
		const {changes} = ctx.userconfig.mine;
		const result: Record<string, string> = {};

		for (const [name, details] of Object.entries(ctx.userconfig.mine.events)) {
			let title = name + ' ';

			if (changes.some(o => o.name === name)) {
				title += '✏️';
			}

			if (details.alertMinutesBefore !== undefined) {
				title += '⏰';
			}

			if (details.notes) {
				title += '🗒';
			}

			result[name.replaceAll('/', ';')] = title.trim();
		}

		return result;
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.manualRow(backMainButtons);
