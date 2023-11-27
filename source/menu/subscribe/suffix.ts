import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	type Body,
	deleteMenuFromContext,
	getMenuOfPath,
	MenuTemplate,
	replyMenuToContext,
} from 'grammy-inline-menu';
import {getUrlFromContext} from '../../lib/calendar-helper.js';
import {backMainButtons} from '../../lib/inline-menu.js';
import type {MyContext} from '../../lib/types.js';

function menuBody(context: MyContext): Body {
	const {calendarfileSuffix} = context.userconfig.mine;
	return {
		parse_mode: 'HTML',
		text: context.t('subscribe-suffix', {
			calendarfileSuffix,
			url: getUrlFromContext(context),
			userId: context.from!.id.toString(),
		})
			// Remove Isolate Characters which are inserted automatically by Fluent.
			// They are useful to prevent the variables from inserting annoying stuff but here they destroy the url
			.replaceAll(/[\u2068\u2069]+/g, ''),
	};
}

const SUFFIX_MAX_LENGTH = 15;
const SUFFIX_MIN_LENGTH = 3;

async function setSuffix(context: MyContext, value: string): Promise<void> {
	value = String(value)
		.replaceAll(/[^\w\d]/g, '')
		.slice(0, SUFFIX_MAX_LENGTH);
	if (value.length < SUFFIX_MIN_LENGTH) {
		return;
	}

	context.userconfig.mine.calendarfileSuffix = value;
	await sendHintText(context);
}

async function sendHintText(context: MyContext): Promise<void> {
	const hintText = '⚠️ Hinweis: Dein Kalender muss nun neu abonniert werden!';
	if (context.callbackQuery) {
		await context.answerCallbackQuery({text: hintText, show_alert: true});
		return;
	}

	await context.reply(hintText);
}

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(menuBody);

menu.interact('Generieren…', 'g', {
	async do(context) {
		// 10^8 -> 10 ** 8
		const fromTime = Date.now() % (10 ** 8);
		await setSuffix(context, String(fromTime));
		return true;
	},
});

const manualSuffixQuestion = new StatelessQuestion<MyContext>(
	'subscribe-suffix-manual',
	async (context, path) => {
		if (context.message.text) {
			await setSuffix(context, context.message.text);
		}

		await replyMenuToContext(menu, context, path);
	},
);

bot.use(manualSuffixQuestion.middleware());

menu.interact('Manuell setzen…', 's', {
	async do(context, path) {
		await manualSuffixQuestion.replyWithMarkdown(
			context,
			`Gib mir Tiernamen! 🦁🦇🐌🦍\nOder andere zufällige Buchstaben und Zahlen Kombinationen.\nSonderzeichen werden heraus gefiltert. Muss mindestens ${SUFFIX_MIN_LENGTH} Zeichen lang sein. Romane werden leider auf ${SUFFIX_MAX_LENGTH} Zeichen gekürzt.`,
			getMenuOfPath(path),
		);

		await deleteMenuFromContext(context);
		return false;
	},
});

menu.manualRow(backMainButtons);
