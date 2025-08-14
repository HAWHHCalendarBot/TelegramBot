import {MenuTemplate} from 'grammy-inline-menu';
import {formatDateToStoredChangeDate} from '../../../../lib/calendar-helper.ts';
import {
	DAY_OPTIONS,
	generateYearOptions,
	MONTH_NAMES,
	MONTH_OPTIONS,
} from '../../../../lib/event-creation-menu-options.ts';
import {BACK_BUTTON_TEXT} from '../../../../lib/inline-menu.ts';
import type {MyContext} from '../../../../lib/types.ts';

const menuText = 'Wann findet der Termin statt?';

function getCurrent(ctx: MyContext): Date {
	const {date} = ctx.session.generateChange!;
	if (date) {
		return new Date(Date.parse(date + 'Z'));
	}

	return new Date();
}

export function createDatePickerButtons(
	menu: MenuTemplate<MyContext>,
	hide: (ctx: MyContext) => boolean,
): void {
	menu.submenu('d', dayMenu, {
		hide,
		text: ctx => getCurrent(ctx).getDate().toString(),
	});
	menu.submenu('m', monthMenu, {
		joinLastRow: true,
		hide,
		text: ctx => MONTH_NAMES[getCurrent(ctx).getMonth()]!,
	});
	menu.submenu('y', yearMenu, {
		joinLastRow: true,
		hide,
		text: ctx => getCurrent(ctx).getFullYear().toString(),
	});
}

const dayMenu = new MenuTemplate<MyContext>(menuText);
const monthMenu = new MenuTemplate<MyContext>(menuText);
const yearMenu = new MenuTemplate<MyContext>(menuText);

dayMenu.select('', {
	columns: 7,
	choices: DAY_OPTIONS,
	isSet: (ctx, date) => getCurrent(ctx).getDate() === Number(date),
	async set(ctx, date) {
		const current = getCurrent(ctx);
		current.setDate(Number(date));
		ctx.session.generateChange!.date = formatDateToStoredChangeDate(current);
		return '..';
	},
});

monthMenu.select('', {
	columns: 2,
	choices: MONTH_OPTIONS,
	isSet: (ctx, month) => getCurrent(ctx).getMonth() + 1 === Number(month),
	async set(ctx, month) {
		const current = getCurrent(ctx);
		current.setMonth(Number(month) - 1);
		ctx.session.generateChange!.date = formatDateToStoredChangeDate(current);
		return '..';
	},
});

yearMenu.select('', {
	choices: generateYearOptions(),
	isSet: (ctx, year) => getCurrent(ctx).getFullYear() === Number(year),
	async set(ctx, year) {
		const current = getCurrent(ctx);
		current.setFullYear(Number(year));
		ctx.session.generateChange!.date = formatDateToStoredChangeDate(current);
		return '..';
	},
});

dayMenu.navigate('..', {text: BACK_BUTTON_TEXT});
monthMenu.navigate('..', {text: BACK_BUTTON_TEXT});
yearMenu.navigate('..', {text: BACK_BUTTON_TEXT});
