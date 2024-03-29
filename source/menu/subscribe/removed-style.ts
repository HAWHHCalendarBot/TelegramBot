import {MenuTemplate} from 'grammy-inline-menu';
import {backMainButtons} from '../../lib/inline-menu.js';
import type {MyContext, RemovedEventsDisplayStyle} from '../../lib/types.js';

const CHOICES = {
	cancelled: '👌 Standard',
	removed: '🗑 komplett entfernen',
	emoji: '🚫 erzwungen',
} as const satisfies Record<RemovedEventsDisplayStyle, string>;

export const menu = new MenuTemplate<MyContext>(ctx => ({
	parse_mode: 'HTML',
	text: ctx.t('subscribe-removed-setting'),
}));

menu.select('s', {
	columns: 1,
	choices: CHOICES,
	set(context, key) {
		context.userconfig.mine.removedEvents = key as RemovedEventsDisplayStyle;
		return true;
	},
	isSet: (context, key) =>
		(context.userconfig.mine.removedEvents ?? 'cancelled') === key,
});

menu.manualRow(backMainButtons);
