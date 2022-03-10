import {Composer} from 'grammy'
import {html as format} from 'telegram-format'
import {MenuTemplate, Body} from 'grammy-inline-menu'

import {backMainButtons} from '../../../lib/inline-menu.js'
import {formatDateToHumanReadable} from '../../../lib/calendar-helper.js'
import {MyContext} from '../../../lib/types.js'

import * as changeDetails from './details.js'
import * as changeAdd from './add/index.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

bot.use(changeAdd.bot)

menu.submenu('➕ Änderung hinzufügen', 'a', changeAdd.menu)

menu.chooseIntoSubmenu('d', getChangesOptions, changeDetails.menu, {
	columns: 1,
	getCurrentPage: context => context.session.page,
	setPage(context, page) {
		context.session.page = page
	},
})

function getChangesOptions(context: MyContext): Record<string, string> {
	const event = context.match![1]!.replace(/;/, '/')
	const changes = context.userconfig.mine.changes
		.filter(o => o.name === event)

	const result: Record<string, string> = {}
	for (const change of changes) {
		const key = changeDetails.generateChangeAction(change)
		result[key] = formatDateToHumanReadable(change.date)
	}

	return result
}

function menuBody(context: MyContext): Body {
	const event = context.match![1]!.replace(/;/, '/')

	let text = ''
	text += format.bold('Veranstaltungsänderungen')
	text += '\n'
	text += format.escape(event)
	text += '\n\n'
	text += format.escape(context.i18n.t('changes.help'))

	return {text, parse_mode: format.parse_mode}
}

menu.manualRow(backMainButtons)
