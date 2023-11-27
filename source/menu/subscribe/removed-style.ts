import {MenuTemplate} from 'grammy-inline-menu';
import {backMainButtons} from '../../lib/inline-menu.js';
import type {MyContext, RemovedEventsDisplayStyle} from '../../lib/types.js';

const removedEventsOptions = {
	cancelled: '👌 Standard',
	removed: '🗑 komplett entfernen',
	emoji: '🚫 erzwungen',
} as const satisfies Record<RemovedEventsDisplayStyle, string>;

export const menu = new MenuTemplate<MyContext>(ctx => ({
	text: ctx.t('subscribe-removed-setting'),
	parse_mode: 'HTML',
}));

menu.select('s', removedEventsOptions, {
	columns: 1,
	set(context, key) {
		context.userconfig.mine.removedEvents = key as RemovedEventsDisplayStyle;
		return true;
	},
	isSet: (context, key) =>
		(context.userconfig.mine.removedEvents ?? 'cancelled') === key,
});

menu.manualRow(backMainButtons);
