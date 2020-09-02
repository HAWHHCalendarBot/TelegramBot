import TelegrafInlineMenu from 'telegraf-inline-menu'

import {MyContext} from '../../lib/types'

import addMenu from './add'
import {menu as removeMenu} from './remove'
import {menu as changesMenu} from './changes'

function overviewText(context: MyContext): string {
	let text = '*Veranstaltungen*'

	const {events} = context.state.userconfig
	if (events.length > 0) {
		text += '\n\nDu hast folgende Veranstaltungen im Kalender:\n'
		const eventLines = events
			.map(o => o.replace('_', '\\_'))
			.map(o => '- ' + o)
		text += eventLines.join('\n')
	} else {
		text += '\n\nDu hast aktuell keine Veranstaltungen in deinem Kalender. 😔'
	}

	text += '\n\nDu bist Tutor und deine Veranstaltung fehlt im Kalenderbot? Wirf mal einen Blick auf [AdditionalEvents](https://github.com/HAWHHCalendarBot/AdditionalEvents) oder schreib @EdJoPaTo an. ;)'

	return text
}

export const menu = new TelegrafInlineMenu(overviewText as any)

menu.submenu('➕ Hinzufügen', 'a', addMenu.menu)
menu.submenu('🗑 Entfernen', 'r', removeMenu, {
	joinLastRow: true,
	hide: ctx => (ctx as MyContext).state.userconfig.events.length === 0
})

menu.submenu('✏️ Änderungen', 'c', changesMenu, {
	hide: ctx => (ctx as MyContext).state.userconfig.events.length === 0
})
