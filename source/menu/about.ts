import {MenuTemplate} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import * as allEvents from '../lib/all-events.ts';
import {getCanteenList} from '../lib/mensa-meals.ts';
import type {MyContext} from '../lib/types.ts';

export const menu = new MenuTemplate<MyContext>(async ctx => {
	const userIds = await ctx.userconfig.allIds();
	const userCount = userIds.length;

	const canteens = await getCanteenList();
	const canteenCount = canteens.length;
	const eventCount = await allEvents.count();

	const websiteLink = format.url(
		'hawhh.de/calendarbot/',
		'https://hawhh.de/calendarbot/',
	);
	const githubIssues = format.url(
		'GitHub',
		'https://github.com/HAWHHCalendarBot/telegrambot/issues',
	);

	let text = '';
	text
		+= `Ich habe aktuell ${eventCount} Veranstaltungen und ${canteenCount} Mensen, die ich ${userCount} begeisterten Nutzern 😍 zur Verfügung stelle.`;
	text += '\n\n';
	text
		+= 'Wenn ich für dich hilfreich bin, dann erzähl gern anderen von mir, denn ich will gern allen helfen, denen noch zu helfen ist. ☺️';
	text += '\n\n';
	text += `Wie ich funktioniere wird auf ${websiteLink} genauer beschrieben.`;
	text += '\n';
	text
		+= `Du hast Probleme, Ideen oder Vorschläge, was ich noch können sollte? Dann wende dich an @EdJoPaTo oder erstelle ein Issue auf ${githubIssues}.`;

	return {
		disable_web_page_preview: true,
		parse_mode: format.parse_mode,
		text,
	};
});

menu.url({
	text: 'hawhh.de/calendarbot/',
	url: 'https://hawhh.de/calendarbot/',
});

menu.url({
	text: '😌 PayPal Spende',
	url: 'https://www.paypal.com/donate?hosted_button_id=L2EMBSGTEXK42',
});

menu.url({
	text: '🦑 Quellcode',
	url: 'https://github.com/HAWHHCalendarBot',
});
menu.url({
	joinLastRow: true,
	text: '🦑 Änderungshistorie',
	url: 'https://github.com/HAWHHCalendarBot/TelegramBot/releases',
});
