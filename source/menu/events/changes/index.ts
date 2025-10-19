import {Composer} from 'grammy';
import {MenuTemplate} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import {backMainButtons} from '../../../lib/inline-menu.ts';
import type {MyContext} from '../../../lib/types.ts';
import * as changeAdd from './add/index.ts';
import * as changeDetails from './details.ts';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(ctx => {
	const event = ctx.match![1]!.replaceAll(';', '/');

	let text = '';
	text += format.bold('Veranstaltungsänderungen');
	text += '\n';
	text += format.escape(event);
	text += '\n\n';
	text += format.escape(ctx.t('changes-help'));

	return {text, parse_mode: format.parse_mode};
});

bot.use(changeAdd.bot);

menu.submenu('a', changeAdd.menu, {text: '➕ Änderung hinzufügen'});

menu.chooseIntoSubmenu('d', changeDetails.menu, {
	columns: 1,
	choices(ctx) {
		const event = ctx.match![1]!.replaceAll(';', '/');
		return Object.keys(ctx.userconfig.mine.events[event]?.changes ?? {});
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.manualRow(backMainButtons);
