import {MenuTemplate} from 'grammy-inline-menu';
import {formatDateToStoredChangeDate} from '../../../../lib/calendar-helper.js';
import {
	DAY_OPTIONS,
	generateYearOptions,
	MONTH_NAMES,
	MONTH_OPTIONS,
} from '../../../../lib/event-creation-menu-options.js';
import {BACK_BUTTON_TEXT} from '../../../../lib/inline-menu.js';
import type {MyContext} from '../../../../lib/types.js';

const menuText = 'Wann findet der Termin statt?';

function getCurrent(context: MyContext): Date {
	const {date} = context.session.generateChange!;
	if (date) {
		return new Date(Date.parse(date + 'Z'));
	}

	return new Date();
}

export function createDatePickerButtons(
	menu: MenuTemplate<MyContext>,
	hide: (context: MyContext) => boolean,
): void {
	menu.submenu('d', dayMenu, {
		hide,
		text: context => getCurrent(context).getDate().toString(),
	});
	menu.submenu('m', monthMenu, {
		joinLastRow: true,
		hide,
		text: context => MONTH_NAMES[getCurrent(context).getMonth()]!,
	});
	menu.submenu('y', yearMenu, {
		joinLastRow: true,
		hide,
		text: context => getCurrent(context).getFullYear().toString(),
	});
}

const dayMenu = new MenuTemplate<MyContext>(menuText);
const monthMenu = new MenuTemplate<MyContext>(menuText);
const yearMenu = new MenuTemplate<MyContext>(menuText);

dayMenu.select('', {
	columns: 7,
	choices: DAY_OPTIONS,
	isSet: (context, date) => getCurrent(context).getDate() === Number(date),
	async set(context, date) {
		const current = getCurrent(context);
		current.setDate(Number(date));
		context.session.generateChange!.date = formatDateToStoredChangeDate(
			current,
		);
		return '..';
	},
});

monthMenu.select('', {
	columns: 2,
	choices: MONTH_OPTIONS,
	isSet: (context, month) =>
		getCurrent(context).getMonth() + 1 === Number(month),
	async set(context, month) {
		const current = getCurrent(context);
		current.setMonth(Number(month) - 1);
		context.session.generateChange!.date = formatDateToStoredChangeDate(
			current,
		);
		return '..';
	},
});

yearMenu.select('', {
	choices: generateYearOptions(),
	isSet: (context, year) => getCurrent(context).getFullYear() === Number(year),
	async set(context, year) {
		const current = getCurrent(context);
		current.setFullYear(Number(year));
		context.session.generateChange!.date = formatDateToStoredChangeDate(
			current,
		);
		return '..';
	},
});

dayMenu.navigate('..', {text: BACK_BUTTON_TEXT});
monthMenu.navigate('..', {text: BACK_BUTTON_TEXT});
yearMenu.navigate('..', {text: BACK_BUTTON_TEXT});
