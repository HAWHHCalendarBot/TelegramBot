import {MenuTemplate} from 'grammy-inline-menu';
import {
	generateChangeText,
	generateShortChangeText,
} from '../../../lib/change-helper.ts';
import {backMainButtons} from '../../../lib/inline-menu.ts';
import type {Change, MyContext, NaiveDateTime} from '../../../lib/types.ts';

function getChangeFromContext(ctx: MyContext): [string, NaiveDateTime, Change | undefined] {
	const name = ctx.match![1]!.replaceAll(';', '/');
	const date = ctx.match![2]! as NaiveDateTime;
	const details = ctx.userconfig.mine.events[name]?.changes?.[date];
	return [name, date, details];
}

export const menu = new MenuTemplate<MyContext>(ctx => {
	const [name, date, change] = getChangeFromContext(ctx);
	if (!change) {
		return 'Change does not exist anymore';
	}

	const text = generateChangeText(name, date, change);
	return {text, parse_mode: 'HTML'};
});

menu.switchToChat({
	text: 'Teilen…',
	query(ctx) {
		const [name, date] = getChangeFromContext(ctx);
		return generateShortChangeText(name, date);
	},
	hide(ctx) {
		const [_name, _date, change] = getChangeFromContext(ctx);
		return !change;
	},
});
menu.interact('r', {
	text: '⚠️ Änderung entfernen',
	async do(ctx) {
		const [name, date] = getChangeFromContext(ctx);
		delete ctx.userconfig.mine.events[name]?.changes?.[date];
		await ctx.answerCallbackQuery('Änderung wurde entfernt.');
		return '..';
	},
});

menu.manualRow(backMainButtons);
