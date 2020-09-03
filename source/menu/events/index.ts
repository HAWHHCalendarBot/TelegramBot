import {Composer} from 'telegraf'
import {MenuTemplate, Body} from 'telegraf-inline-menu'
import {html as format} from 'telegram-format'

import {backMainButtons} from '../../lib/inline-menu'
import {MyContext} from '../../lib/types'

import {menu as removeMenu} from './remove'
import * as addMenu from './add'
import * as changesMenu from './changes'

function menuBody(context: MyContext): Body {
	let text = format.bold('Veranstaltungen')
	text += '\n\n'

	const {events} = context.state.userconfig
	if (events.length > 0) {
		text += 'Du hast folgende Veranstaltungen im Kalender:'
		text += '\n'
		const eventLines = events
			.map(o => format.escape(o))
			.map(o => '- ' + o)
		text += eventLines.join('\n')
	} else {
		text += 'Du hast aktuell keine Veranstaltungen in deinem Kalender. 😔'
	}

	text += '\n\n'
	const additionalEventsLink = format.url('AdditionalEvents', 'https://github.com/HAWHHCalendarBot/AdditionalEvents')
	text += `Du bist Tutor und deine Veranstaltung fehlt im Kalenderbot? Wirf mal einen Blick auf ${additionalEventsLink} oder schreib @EdJoPaTo an. ;)`

	return {text, parse_mode: format.parse_mode}
}

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate(menuBody)

bot.use(addMenu.bot)
bot.use(changesMenu.bot)

menu.submenu('➕ Hinzufügen', 'a', addMenu.menu)
menu.submenu('🗑 Entfernen', 'r', removeMenu, {
	joinLastRow: true,
	hide: context => context.state.userconfig.events.length === 0
})

menu.submenu('✏️ Änderungen', 'c', changesMenu.menu, {
	hide: context => context.state.userconfig.events.length === 0
})

menu.manualRow(backMainButtons)
