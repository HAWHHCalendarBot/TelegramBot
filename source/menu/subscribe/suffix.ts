import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	deleteMenuFromContext,
	getMenuOfPath,
	MenuTemplate,
	replyMenuToContext,
} from 'grammy-inline-menu';
import {getUrlFromContext} from '../../lib/calendar-helper.js';
import {backMainButtons} from '../../lib/inline-menu.js';
import type {MyContext} from '../../lib/types.js';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(ctx => {
	const {calendarfileSuffix} = ctx.userconfig.mine;
	return {
		parse_mode: 'HTML',
		text: ctx
			.t('subscribe-suffix', {
				calendarfileSuffix,
				url: getUrlFromContext(ctx),
				userId: ctx.from!.id.toString(),
			})
			// Remove Isolate Characters which are inserted automatically by Fluent.
			// They are useful to prevent the variables from inserting annoying stuff but here they destroy the url
			.replaceAll(/[\u2068\u2069]+/g, ''),
	};
});

const SUFFIX_MAX_LENGTH = 15;
const SUFFIX_MIN_LENGTH = 3;

async function setSuffix(ctx: MyContext, value: string): Promise<void> {
	value = String(value)
		.replaceAll(/[^\w\d]/g, '')
		.slice(0, SUFFIX_MAX_LENGTH);
	if (value.length < SUFFIX_MIN_LENGTH) {
		return;
	}

	ctx.userconfig.mine.calendarfileSuffix = value;
	await sendHintText(ctx);
}

async function sendHintText(ctx: MyContext): Promise<void> {
	const hintText = '⚠️ Hinweis: Dein Kalender muss nun neu abonniert werden!';
	if (ctx.callbackQuery) {
		await ctx.answerCallbackQuery({text: hintText, show_alert: true});
		return;
	}

	await ctx.reply(hintText);
}

menu.interact('g', {
	text: 'Generieren…',
	async do(ctx) {
		// 10^8 -> 10 ** 8
		const fromTime = Date.now() % (10 ** 8);
		await setSuffix(ctx, String(fromTime));
		return true;
	},
});

const manualSuffixQuestion = new StatelessQuestion<MyContext>(
	'subscribe-suffix-manual',
	async (ctx, path) => {
		if (ctx.message.text) {
			await setSuffix(ctx, ctx.message.text);
		}

		await replyMenuToContext(menu, ctx, path);
	},
);

bot.use(manualSuffixQuestion.middleware());

menu.interact('s', {
	text: 'Manuell setzen…',
	async do(ctx, path) {
		await manualSuffixQuestion.replyWithHTML(
			ctx,
			`Gib mir Tiernamen! 🦁🦇🐌🦍\nOder andere zufällige Buchstaben und Zahlen Kombinationen.\nSonderzeichen werden heraus gefiltert. Muss mindestens ${SUFFIX_MIN_LENGTH} Zeichen lang sein. Romane werden leider auf ${SUFFIX_MAX_LENGTH} Zeichen gekürzt.`,
			getMenuOfPath(path),
		);

		await deleteMenuFromContext(ctx);
		return false;
	},
});

menu.manualRow(backMainButtons);
