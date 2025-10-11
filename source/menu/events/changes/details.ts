import {MenuTemplate} from 'grammy-inline-menu';
import {
	generateChangeText,
	generateShortChangeText,
} from '../../../lib/change-helper.ts';
import {backMainButtons} from '../../../lib/inline-menu.ts';
import type {Change, MyContext} from '../../../lib/types.ts';

export function generateChangeAction(change: Change): string {
	return change.date;
}

function getChangeFromContext(ctx: MyContext): Change | undefined {
	const eventId = ctx.match![1]!;
	const date = ctx.match![2]!;

	return ctx.userconfig.mine.changes.find(c =>
		c.eventId === eventId && c.date === date);
}

export const menu = new MenuTemplate<MyContext>(ctx => {
	const change = getChangeFromContext(ctx);
	if (!change) {
		return 'Change does not exist anymore';
	}

	const text = generateChangeText(ctx, change);
	return {text, parse_mode: 'HTML'};
});

menu.switchToChat({
	text: 'Teilen…',
	query: ctx => generateShortChangeText(ctx, getChangeFromContext(ctx)!),
	hide(ctx) {
		const change = getChangeFromContext(ctx);
		return !change;
	},
});
menu.interact('r', {
	text: '⚠️ Änderung entfernen',
	async do(ctx) {
		const change = getChangeFromContext(ctx);
		ctx.userconfig.mine.changes = ctx.userconfig.mine.changes.filter(o =>
			o.eventId !== change?.eventId || o.date !== change?.date);
		await ctx.answerCallbackQuery('Änderung wurde entfernt.');
		return '..';
	},
});

menu.manualRow(backMainButtons);
