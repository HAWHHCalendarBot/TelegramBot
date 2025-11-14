import {MenuTemplate} from 'grammy-inline-menu';
import {
	generateChangeText,
	generateShortChangeText,
} from '../../../lib/change-helper.ts';
import {backMainButtons} from '../../../lib/inline-menu.ts';
import type {
	Change, EventId, MyContext, NaiveDateTime,
} from '../../../lib/types.ts';

function getChangeFromContext(ctx: MyContext): [EventId, NaiveDateTime, Change | undefined] {
	const eventId = ctx.match![1]! as EventId;
	const date = ctx.match![2]! as NaiveDateTime;
	const details = ctx.userconfig.mine.events[eventId]?.changes?.[date];
	return [eventId, date, details];
}

export const menu = new MenuTemplate<MyContext>(ctx => {
	const [eventId, date, change] = getChangeFromContext(ctx);
	if (!change) {
		return 'Change does not exist anymore';
	}

	const text = generateChangeText(eventId, date, change);
	return {text, parse_mode: 'HTML'};
});

menu.switchToChat({
	text: 'Teilen…',
	query(ctx) {
		const [eventId, date] = getChangeFromContext(ctx);
		return generateShortChangeText(eventId, date);
	},
	hide(ctx) {
		const [_eventId, _date, change] = getChangeFromContext(ctx);
		return !change;
	},
});
menu.interact('r', {
	text: '⚠️ Änderung entfernen',
	async do(ctx) {
		const [eventId, date] = getChangeFromContext(ctx);
		delete ctx.userconfig.mine.events[eventId]?.changes?.[date];
		await ctx.answerCallbackQuery('Änderung wurde entfernt.');
		return '..';
	},
});

menu.manualRow(backMainButtons);
