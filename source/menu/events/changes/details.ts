import {MenuTemplate} from 'grammy-inline-menu';
import {generateChangeText, generateShortChangeText} from '../../../lib/change-helper.js';
import {backMainButtons} from '../../../lib/inline-menu.js';
import type {Change, MyContext} from '../../../lib/types.js';

export function generateChangeAction(change: Change): string {
	return change.date;
}

function getChangeFromContext(context: MyContext): Change | undefined {
	const name = context.match![1]!.replaceAll(';', '/');
	const date = context.match![2]!;

	return context.userconfig.mine.changes
		.find(c => c.name === name && c.date === date);
}

export const menu = new MenuTemplate<MyContext>(context => {
	const change = getChangeFromContext(context);
	if (!change) {
		return 'Change does not exist anymore';
	}

	const text = generateChangeText(change);
	return {text, parse_mode: 'HTML'};
});

menu.switchToChat('Teilen…', context => generateShortChangeText(getChangeFromContext(context)!), {
	hide(context) {
		const change = getChangeFromContext(context);
		return !change;
	},
});
menu.interact('⚠️ Änderung entfernen', 'r', {
	async do(context) {
		const change = getChangeFromContext(context);
		context.userconfig.mine.changes = context.userconfig.mine.changes
			.filter(o => o.name !== change?.name || o.date !== change?.date);
		await context.answerCallbackQuery({text: 'Änderung wurde entfernt.'});
		return '..';
	},
});

menu.manualRow(backMainButtons);
