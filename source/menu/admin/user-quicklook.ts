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
import {getUrl} from '../../lib/calendar-helper.js';
import {
	DEFAULT_FILTER,
	filterButtonText,
} from '../../lib/inline-menu-filter.js';
import {backMainButtons} from '../../lib/inline-menu.js';
import type {MyContext} from '../../lib/types.js';

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
export const menu = new MenuTemplate<MyContext>(async context => {
	if (!context.session.adminuserquicklook) {
		return 'Wähle einen Nutzer…';
	}

	const config = await context.userconfig.load(
		context.session.adminuserquicklook,
	);

	let text = '';
	text += 'URL: ';
	text += format.monospace(
		'https://' + getUrl(context.session.adminuserquicklook, config!.config),
	);
	text += '\n\n';
	text += format.monospaceBlock(JSON.stringify(config, null, 2), 'json');

	return {text, parse_mode: format.parse_mode};
});

menu.url({
	hide: context => !context.session.adminuserquicklook,
	text: 'Kalender',
	async url(context) {
		const config = await context.userconfig.loadConfig(
			context.session.adminuserquicklook!,
		);
		return `https://${getUrl(context.session.adminuserquicklook!, config)}`;
	},
});

const question = new StatelessQuestion<MyContext>(
	'admin-user-filter',
	async (context, path) => {
		if ('text' in context.message) {
			context.session.adminuserquicklookfilter = context.message.text;
			delete context.session.adminuserquicklook;
		}

		await replyMenuToContext(menu, context, path);
	},
);

bot.use(question.middleware());

menu.interact('filter', {
	text: filterButtonText(context => context.session.adminuserquicklookfilter),
	async do(context, path) {
		await question.replyWithHTML(
			context,
			'Wonach möchtest du die Nutzer filtern?',
			getMenuOfPath(path),
		);
		await deleteMenuFromContext(context);
		return false;
	},
});

menu.interact('filter-clear', {
	joinLastRow: true,
	text: 'Filter aufheben',
	hide(context) {
		return (context.session.adminuserquicklookfilter ?? DEFAULT_FILTER)
			=== DEFAULT_FILTER;
	},
	do(context) {
		delete context.session.adminuserquicklookfilter;
		delete context.session.adminuserquicklook;
		return true;
	},
});

menu.select('u', {
	maxRows: 5,
	columns: 2,
	async choices(context) {
		const filter = context.session.adminuserquicklookfilter ?? DEFAULT_FILTER;
		const filterRegex = new RegExp(filter, 'i');
		const allConfigs = await context.userconfig.all(
			config => filterRegex.test(JSON.stringify(config)),
		);
		const allChats = allConfigs.map(o => o.chat);
		allChats.sort((a, b) => {
			const nameA = nameOfUser(a);
			const nameB = nameOfUser(b);
			return nameA.localeCompare(nameB);
		});
		return Object.fromEntries(
			allChats.map(chat => [chat.id, nameOfUser(chat)]),
		);
	},
	isSet: (context, selected) =>
		context.session.adminuserquicklook === Number(selected),
	async set(context, selected) {
		context.session.adminuserquicklook = Number(selected);
		return true;
	},
	getCurrentPage: context => context.session.page,
	setPage(context, page) {
		context.session.page = page;
	},
});

menu.manualRow(backMainButtons);
