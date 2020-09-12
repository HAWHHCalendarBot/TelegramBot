import {Composer} from 'telegraf'
import {MenuTemplate, Body} from 'telegraf-inline-menu'
import {html as format} from 'telegram-format'

import {backMainButtons} from '../../lib/inline-menu'
import {MyContext} from '../../lib/types'
import * as allEvents from '../../lib/all-events'

import {menu as removeMenu} from './remove'
import * as addMenu from './add'
import * as changesMenu from './changes'

async function menuBody(context: MyContext): Promise<Body> {
	let text = format.bold('Veranstaltungen')
	text += '\n\n'

	const {events} = context.state.userconfig
	if (events.length > 0) {
		const nonExisting = new Set(await allEvents.nonExisting(events))
		text += 'Du hast folgende Veranstaltungen im Kalender:'
		text += '\n'
		text += events
			.map(o => {
				let line = '- '
				if (nonExisting.has(o)) {
					line += '⚠️ '
				}

				line += format.escape(o)
				return line
			})
			.join('\n')

		if (nonExisting.size > 0) {
			text += '\n\n'
			text += '⚠️ Du hast Veranstaltungen, die nicht mehr existieren.'
		}
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

menu.interact('🗑 Entferne nicht mehr Existierende', 'remove-old', {
	hide: async context => {
		const nonExisting = await allEvents.nonExisting(context.state.userconfig.events)
		return nonExisting.length === 0
	},
	do: async context => {
		const nonExisting = new Set(await allEvents.nonExisting(context.state.userconfig.events))
		context.state.userconfig.events = context.state.userconfig.events
			.filter(o => !nonExisting.has(o))

		// Only keep changes of events the user still has
		context.state.userconfig.changes = context.state.userconfig.changes
			.filter(o => context.state.userconfig.events.includes(o.name))

		return true
	}
})

menu.submenu('✏️ Änderungen', 'c', changesMenu.menu, {
	hide: context => context.state.userconfig.events.length === 0
})

menu.manualRow(backMainButtons)
