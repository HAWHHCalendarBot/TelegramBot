import {Composer} from 'grammy';
import {MenuTemplate} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import {formatDateToHumanReadable} from '../../../lib/calendar-helper.js';
import {backMainButtons} from '../../../lib/inline-menu.js';
import type {MyContext} from '../../../lib/types.js';
import * as changeAdd from './add/index.js';
import * as changeDetails from './details.js';

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

menu.submenu('➕ Änderung hinzufügen', 'a', changeAdd.menu);

menu.chooseIntoSubmenu('d', getChangesOptions, changeDetails.menu, {
	columns: 1,
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

function getChangesOptions(ctx: MyContext): Record<string, string> {
	const event = ctx.match![1]!.replaceAll(';', '/');
	const changes = ctx.userconfig.mine.changes
		.filter(o => o.name === event);
	return Object.fromEntries(changes.map(change => [
		changeDetails.generateChangeAction(change),
		formatDateToHumanReadable(change.date),
	]));
}

menu.manualRow(backMainButtons);
