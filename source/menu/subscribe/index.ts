import {Composer} from 'grammy';
import {type Body, MenuTemplate} from 'grammy-inline-menu';
import {getUrlFromContext} from '../../lib/calendar-helper.ts';
import {backMainButtons} from '../../lib/inline-menu.ts';
import type {MyContext} from '../../lib/types.ts';
import {menu as removedStyleMenu} from './removed-style.ts';
import * as suffixMenu from './suffix.ts';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate(generateBody('overview'));

bot.use(suffixMenu.bot);

const appleMenu = new MenuTemplate(generateBody('apple'));
appleMenu.url({
	text: 'Kalender abonnieren',
	url: ctx =>
		`https://calendarbot.hawhh.de/ics.html?url=${getUrlFromContext(ctx)}`,
});
appleMenu.manualRow(backMainButtons);
menu.submenu('apple', appleMenu, {text: '🍏 iOS / macOS'});

const exchangeMenu = new MenuTemplate(generateBody('exchange'));
exchangeMenu.url({
	text: 'Office.com',
	url: 'https://outlook.office.com/calendar',
});
exchangeMenu.manualRow(backMainButtons);
menu.submenu('exchange', exchangeMenu, {text: '🗂 Office.com (HAW Account)'});

const googleMenu = new MenuTemplate(generateBody('google'));
menu.submenu('google', googleMenu, {text: '🍰 Google Kalender'});
googleMenu.url({
	text: 'Google Calendar',
	url: 'https://calendar.google.com/',
});
googleMenu.url({
	text: 'Google Sync Settings',
	url: 'https://www.google.com/calendar/syncselect',
});
googleMenu.navigate('../exchange/', {
	text: 'abonnieren mit dem Office.com HAW Account',
});
googleMenu.manualRow(backMainButtons);

const freestyleMenu = new MenuTemplate(generateBody('freestyle'));
freestyleMenu.url({
	text: 'Kalender abonnieren',
	url: ctx =>
		`https://calendarbot.hawhh.de/ics.html?url=${getUrlFromContext(ctx)}`,
});
freestyleMenu.manualRow(backMainButtons);
menu.submenu('freestyle', freestyleMenu, {text: 'Freestyle 😎'});

menu.submenu('suffix', suffixMenu.menu, {text: '⚙️ URL Privacy'});
menu.submenu('showRemoved', removedStyleMenu, {
	text: '⚙️ Anzeigeart entfernter Termine',
});

function generateBody(resourceKeySuffix: string): (ctx: MyContext) => Body {
	return ctx => ({
		parse_mode: 'HTML',
		text: ctx
			.t('subscribe-' + resourceKeySuffix, {
				firstname: ctx.from!.first_name,
				url: getUrlFromContext(ctx),
			})
			// Remove Isolate Characters which are inserted automatically by Fluent.
			// They are useful to prevent the variables from inserting annoying stuff but here they destroy the url
			.replaceAll(/[\u2068\u2069]+/g, ''),
	});
}
