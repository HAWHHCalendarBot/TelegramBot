import {Composer} from 'telegraf'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {backMainButtons} from '../../../lib/inline-menu.js'
import {generateShortChangeText} from '../../../lib/change-helper.js'
import {MyContext} from '../../../lib/types.js'

import {menu as removedStyleMenu} from './removed-style.js'
import * as changeDetails from './details.js'
import * as changeAdd from './add/index.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

bot.use(changeAdd.bot)

menu.submenu('➕ Änderung hinzufügen', 'a', changeAdd.menu)

menu.chooseIntoSubmenu('d', getChangesOptions, changeDetails.menu, {
	columns: 1,
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})

function getChangesOptions(context: MyContext): Record<string, string> {
	const {changes} = context.state.userconfig
	if (changes.length === 0) {
		return {}
	}

	const result: Record<string, string> = {}
	for (const change of changes) {
		const key = changeDetails.generateChangeAction(change)
		result[key] = generateShortChangeText(change)
	}

	return result
}

menu.submenu('⚙️ Anzeigeart entfernter Termine', 'showRemoved', removedStyleMenu, {
	hide: context => (context.state.userconfig.changes)
		.filter(c => c.remove)
		.length === 0
})

function menuBody(): Body {
	let text = '*Veranstaltungsänderungen*\n'

	text += '\nWenn sich eine Änderung an einer Veranstaltung ergibt, die nicht in den offiziellen Veranstaltungsplan eingetragen wird, kannst du diese hier nachtragen.'
	text += ' Dein Kalender wird dann automatisch aktualisiert und du hast die Änderung in deinem Kalender.'

	text += '\nAußerdem lassen sich die Änderungen teilen, sodass du auch anderen Leuten diese Änderung bereitstellen kannst.'

	text += '\n\n⚠️ Du bist in der Lage, unlogische Veranstaltungstermine zu kreieren. Beispielsweise kannst du einen Termin so verändern, dass er aufhört bevor er beginnt. Den Bot interessiert das nicht, der tut genau das, was du ihm sagst. Dein Kalenderprogramm ist damit dann allerdings häufig nicht so glücklich…'

	return {text, parse_mode: 'Markdown'}
}

menu.manualRow(backMainButtons)
