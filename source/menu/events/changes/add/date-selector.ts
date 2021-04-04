import {MenuTemplate} from 'telegraf-inline-menu'

import {BACK_BUTTON_TEXT} from '../../../../lib/inline-menu.js'
import {DAY_OPTIONS, generateMonthOptions, generateYearOptions, MONTH_NAMES} from '../../../../lib/event-creation-menu-options.js'
import {formatDateToStoredChangeDate} from '../../../../lib/calendar-helper.js'
import {MyContext} from '../../../../lib/types.js'

const menuText = 'Wann findet der Termin statt?'

function getCurrent(context: MyContext): Date {
	const {date} = context.session.generateChange!
	if (date) {
		return new Date(Date.parse(date + 'Z'))
	}

	return new Date()
}

export function createDatePickerButtons(menu: MenuTemplate<MyContext>, hide: (context: MyContext) => boolean): void {
	menu.submenu(context => getCurrent(context).getDate().toString(), 'd', dayMenu, {hide})
	menu.submenu(monthText, 'm', monthMenu, {hide, joinLastRow: true})
	menu.submenu(context => getCurrent(context).getFullYear().toString(), 'y', yearMenu, {hide, joinLastRow: true})
}

const dayMenu = new MenuTemplate<MyContext>(menuText)
const monthMenu = new MenuTemplate<MyContext>(menuText)
const yearMenu = new MenuTemplate<MyContext>(menuText)

function monthText(context: MyContext): string {
	const current = getCurrent(context)
	return MONTH_NAMES[current.getMonth()]!
}

dayMenu.select('', DAY_OPTIONS, {
	columns: 7,
	isSet: (context, date) => getCurrent(context).getDate() === Number(date),
	set: async (context, date) => {
		const current = getCurrent(context)
		current.setDate(Number(date))
		context.session.generateChange!.date = formatDateToStoredChangeDate(current)
		return '..'
	}
})

monthMenu.select('', generateMonthOptions(), {
	columns: 2,
	isSet: (context, month) => getCurrent(context).getMonth() + 1 === Number(month),
	set: async (context, month) => {
		const current = getCurrent(context)
		current.setMonth(Number(month) - 1)
		context.session.generateChange!.date = formatDateToStoredChangeDate(current)
		return '..'
	}
})

yearMenu.select('', generateYearOptions(), {
	isSet: (context, year) => getCurrent(context).getFullYear() === Number(year),
	set: async (context, year) => {
		const current = getCurrent(context)
		current.setFullYear(Number(year))
		context.session.generateChange!.date = formatDateToStoredChangeDate(current)
		return '..'
	}
})

dayMenu.navigate(BACK_BUTTON_TEXT, '..')
monthMenu.navigate(BACK_BUTTON_TEXT, '..')
yearMenu.navigate(BACK_BUTTON_TEXT, '..')
