import {MenuTemplate} from 'grammy-inline-menu';
import {backMainButtons} from '../../lib/inline-menu.ts';
import type {MyContext, RemovedEventsDisplayStyle} from '../../lib/types.ts';

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
	set(ctx, key) {
		ctx.userconfig.mine.removedEvents = key as RemovedEventsDisplayStyle;
		return true;
	},
	isSet: (ctx, key) =>
		(ctx.userconfig.mine.removedEvents ?? 'cancelled') === key,
});

menu.manualRow(backMainButtons);
