import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	deleteMenuFromContext,
	getMenuOfPath,
	MenuTemplate,
	replyMenuToContext,
} from 'grammy-inline-menu';
import type {User} from 'grammy/types';
import {html as format} from 'telegram-format';
import {getUrl} from '../../lib/calendar-helper.ts';
import {backMainButtons} from '../../lib/inline-menu.ts';
import type {MyContext} from '../../lib/types.ts';

function nameOfUser({first_name, last_name, username}: User): string {
	let name = first_name;
	if (last_name) {
		name += ' ' + last_name;
	}

	if (username) {
		name += ` (${username})`;
	}

	return name;
}

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(async ctx => {
	if (!ctx.session.adminuserquicklook) {
		return 'Wähle einen Nutzer…';
	}

	const config = await ctx.userconfig.load(ctx.session.adminuserquicklook);

	let text = '';
	text += 'URL: ';
	text += format.monospace('https://' + getUrl(ctx.session.adminuserquicklook, config!.config));
	text += '\n\n';
	text += format.monospaceBlock(JSON.stringify(config, null, 2), 'json');

	return {text, parse_mode: format.parse_mode};
});

menu.url({
	hide: ctx => !ctx.session.adminuserquicklook,
	text: 'Kalender',
	async url(ctx) {
		const config = await ctx.userconfig.loadConfig(ctx.session.adminuserquicklook!);
		return `https://${getUrl(ctx.session.adminuserquicklook!, config)}`;
	},
});

const question = new StatelessQuestion<MyContext>(
	'admin-user-filter',
	async (ctx, path) => {
		if (ctx.message.text) {
			ctx.session.adminuserquicklookfilter = ctx.message.text;
			delete ctx.session.adminuserquicklook;
		}

		await replyMenuToContext(menu, ctx, path);
	},
);

bot.use(question.middleware());

menu.interact('filter', {
	text(ctx) {
		return ctx.session.adminuserquicklookfilter
			? `🔎 Filter: ${ctx.session.adminuserquicklookfilter}`
			: '🔎 Filter';
	},
	async do(ctx, path) {
		await question.replyWithHTML(
			ctx,
			'Wonach möchtest du die Nutzer filtern?',
			getMenuOfPath(path),
		);
		await deleteMenuFromContext(ctx);
		return false;
	},
});

menu.interact('filter-clear', {
	joinLastRow: true,
	text: 'Filter aufheben',
	hide: ctx => ctx.session.adminuserquicklookfilter === undefined,
	do(ctx) {
		delete ctx.session.adminuserquicklookfilter;
		delete ctx.session.adminuserquicklook;
		return true;
	},
});

menu.select('u', {
	maxRows: 5,
	columns: 2,
	async choices(ctx) {
		const filter = ctx.session.adminuserquicklookfilter ?? '.+';
		const filterRegex = new RegExp(filter, 'i');
		const allConfigs = await ctx.userconfig.all(config =>
			filterRegex.test(JSON.stringify(config)));
		const allChats = allConfigs.map(o => o.chat);
		allChats.sort((a, b) => {
			const nameA = nameOfUser(a);
			const nameB = nameOfUser(b);
			return nameA.localeCompare(nameB);
		});
		return Object.fromEntries(allChats.map(chat => [chat.id, nameOfUser(chat)]));
	},
	isSet: (ctx, selected) => ctx.session.adminuserquicklook === Number(selected),
	set(ctx, selected) {
		ctx.session.adminuserquicklook = Number(selected);
		return true;
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.manualRow(backMainButtons);
