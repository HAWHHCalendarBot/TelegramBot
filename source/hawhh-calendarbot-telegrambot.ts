import {env} from 'node:process';
import {I18n} from '@grammyjs/i18n';
import {Bot, session} from 'grammy';
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time';
import {Chatconfig} from './lib/chatconfig.js';
import type {MyContext, Session} from './lib/types.js';
import {bot as menu} from './menu/index.js';
import {bot as migrateStuffBot} from './migrate-stuff.js';
import * as changesInline from './parts/changes-inline.js';
import * as easterEggs from './parts/easter-eggs.js';

const token = env['BOT_TOKEN'];
if (!token) {
	throw new Error('You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)');
}

const baseBot = new Bot<MyContext>(token);

if (env['NODE_ENV'] !== 'production') {
	baseBot.use(generateUpdateMiddleware());
}

const bot = baseBot.errorBoundary(async ({error, ctx}) => {
	if (error instanceof Error && error.message.includes('Too Many Requests')) {
		console.warn('grammY Too Many Requests error. Skip.', error);
		return;
	}

	console.error(
		'try to send error to user',
		ctx.update,
		error,
		(error as any)?.on?.payload,
	);
	let text = '🔥 Da ist wohl ein Fehler aufgetreten…';
	text += '\n';
	text += 'Schreib mal @EdJoPaTo dazu an oder erstell ein [Issue auf GitHub](https://github.com/HAWHHCalendarBot/TelegramBot/issues). Dafür findet sich sicher eine Lösung. ☺️';

	text += '\n';
	text += '\nError: `';
	const errorText = error instanceof Error ? error.message : String(error);
	text += errorText.replaceAll(token, '');
	text += '`';

	const target = (ctx.chat ?? ctx.from!).id;
	await ctx.api.sendMessage(target, text, {
		parse_mode: 'Markdown',
		disable_web_page_preview: true,
	});
});

export const i18n = new I18n({
	defaultLocale: 'de',
	directory: 'locales',
});
bot.use(i18n);

async function startMessage(ctx: MyContext) {
	const name = ctx.from?.first_name ?? 'du';
	let text = `Hey ${name}!`;
	text += '\n\n';
	text += ctx.t('help');
	await ctx.reply(text, {
		reply_markup: {inline_keyboard: [
			[{text: 'hawhh.de/calendarbot/', url: 'https://hawhh.de/calendarbot/'}],
			[{text: '🦑 Quellcode', url: 'https://github.com/HAWHHCalendarBot'}],
		]},
	});
}

bot.command(['start', 'help'], startMessage);

bot.use(session<Session, MyContext>({
	initial() {
		return {};
	},
}));

const chatconfig = new Chatconfig('userconfig');
bot.use(chatconfig);

bot.use(migrateStuffBot);

bot.use(changesInline.bot);
bot.use(easterEggs.bot);

bot.use(menu);

// Fallback for the old main menu
bot.callbackQuery(/^\//, async ctx => {
	await ctx.answerCallbackQuery();
	await startMessage(ctx);
});

const COMMANDS = {
	mensa: 'zeige das heutige Mensaessen deiner Mensa',
	events: 'verwalte deine aktuellen Veranstaltungen',
	subscribe: 'abboniere deinen persönlichen Kalender',
	help: 'kurze Beschreibung, was dieser Bot kann',
	about: 'Infos und Statistiken über den Bot',
	privacy: 'über dich gespeicherte Daten',
	stop: 'stoppe den Bot und lösche alle Daten über dich',
} as const;
await baseBot.api.setMyCommands(Object.entries(COMMANDS).map(([command, description]) => ({command, description})));

await baseBot.start({
	onStart(botInfo) {
		console.log(new Date(), 'Bot starts as', botInfo.username);
	},
});
