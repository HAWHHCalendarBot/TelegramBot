import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	getMenuOfPath,
	MenuTemplate,
	replyMenuToContext,
} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import type {MyContext, Userconfig} from '../lib/types.js';

async function getActualUserconfigContent(ctx: MyContext): Promise<Userconfig | undefined> {
	if (!ctx.userconfig.mine) {
		return undefined;
	}

	const userconfig = await ctx.userconfig.load(ctx.from!.id);
	return userconfig?.config;
}

const PRIVACY_SECTIONS = {
	telegram: 'Telegram',
	persistent: 'Persistent',
	tmp: 'Temporär',
} as const;
type PrivacySection = keyof typeof PRIVACY_SECTIONS;

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(async ctx => {
	const part = privacyInfoPart(ctx, ctx.session.privacySection ?? 'persistent');

	let text = ctx.t('privacy-overview');
	text += '\n\n';
	text += format.bold(part.title);
	text += '\n';
	text += part.text;
	text += '\n';
	text += format.monospaceBlock(JSON.stringify(part.data, null, 1), 'json');

	return {
		disable_web_page_preview: true,
		parse_mode: format.parse_mode,
		text,
	};
});

function privacyInfoPart(ctx: MyContext, section: PrivacySection) {
	const text = ctx.t('privacy-' + section);
	if (section === 'telegram') {
		return {text, title: 'Telegram User Info', data: ctx.from};
	}

	if (section === 'persistent') {
		return {
			text,
			title: 'Persistente Einstellungen im Bot',
			data: ctx.userconfig.mine,
		};
	}

	return {text, title: 'Temporäre Daten des Bots', data: ctx.session};
}

const deleteConfirmString = 'Ja, ich will!';
const deleteQuestion
	= `Bist du dir sicher, das du deinen Kalender und alle Einstellungen löschen willst?\n\nWenn du wirklich alles löschen willst, antworte mit "${deleteConfirmString}"`;

menu.select('section', {
	choices: PRIVACY_SECTIONS,
	isSet: (ctx, key) => (ctx.session.privacySection ?? 'persistent') === key,
	set(ctx, key) {
		ctx.session.privacySection = key as PrivacySection;
		return true;
	},
});

menu.url({text: '🦑 Quellcode', url: 'https://github.com/HAWHHCalendarBot'});

const deleteAllQuestion = new StatelessQuestion<MyContext>(
	'delete-everything',
	async (ctx, path) => {
		if (ctx.message.text === deleteConfirmString) {
			// @ts-expect-error delete readonly
			delete ctx.userconfig.mine;
			ctx.session = undefined;
			await ctx.reply('Deine Daten werden gelöscht…');
		} else {
			await ctx.reply('Du hast mir aber einen Schrecken eingejagt! 🙀');
			await replyMenuToContext(menu, ctx, path);
		}
	},
);

bot.use(deleteAllQuestion.middleware());

menu.interact('delete-all', {
	text: '⚠️ Alles löschen ⚠️',
	hide: async ctx => !(await getActualUserconfigContent(ctx)),
	async do(ctx, path) {
		await deleteAllQuestion.replyWithHTML(
			ctx,
			deleteQuestion,
			getMenuOfPath(path),
		);
		return false;
	},
});
