import {Composer} from 'grammy';
import {MenuTemplate} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import {getEventName} from '../../../lib/all-events.ts';
import {backMainButtons} from '../../../lib/inline-menu.ts';
import {typedKeys} from '../../../lib/javascript-helper.ts';
import type {EventId, MyContext} from '../../../lib/types.ts';
import * as changeAdd from './add/index.ts';
import * as changeDetails from './details.ts';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(ctx => {
	const eventId = ctx.match![1]! as EventId;

	let text = '';
	text += format.bold('Veranstaltungsänderungen');
	text += '\n';
	text += format.escape(getEventName(eventId));
	text += '\n\n';
	text += format.escape(ctx.t('changes-help'));

	return {text, parse_mode: format.parse_mode};
});

bot.use(changeAdd.bot);

menu.submenu('a', changeAdd.menu, {text: '➕ Änderung hinzufügen'});

menu.chooseIntoSubmenu('d', changeDetails.menu, {
	columns: 1,
	choices(ctx) {
		const eventId = ctx.match![1]! as EventId;
		return typedKeys(ctx.userconfig.mine.events[eventId]?.changes ?? {});
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.manualRow(backMainButtons);
