import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {backMainButtons} from '../../../lib/inline-menu.js'
import {MyContext, RemovedEventsDisplayStyle} from '../../../lib/types.js'

const removedEventsOptions = {
	cancelled: 'Standard',
	removed: 'komplett entfernen',
	emoji: 'erzwungen'
}

function menuBody(): Body {
	let text = '*Entfernte Veranstaltungsänderungen*\n'
	text += '\nIn deinem Kalender hast du Änderungen, die Termine entfernen.'
	text += ' Diese ausfallenden Termine werden nach dem iCal Standard mit dem Status CANCELLED markiert.'
	text += ' Jedoch arbeiten nicht alle Kalendertools standardkonform 🙄.'
	text += '\n'

	text += '\nDer *iOS* und *macOS* Systemkalender halten sich an den Standard.'
	text += ' Hier solltest du _Standard_ wählen.'
	text += ' Veranstaltungen können in den jeweiligen Einstellungen vom Kalendertool ein- oder ausgeblendet werden.'

	text += '\nDer *Google* Kalender ist nicht in der Lage, entfernte Veranstaltungen einzublenden.'
	text += ' Sie werden immer ausgeblendet.'
	text += ' Um diese trotzdem anzuzeigen, wähle _erzwungen_ oder bleibe bei _Standard_.'

	text += '\nDer *Exchange* Kalender ignoriert den Status und zeigt die Veranstaltung an, als wäre nichts gewesen.'
	text += ' Du kannst diese Veranstaltungen _komplett entfernen_ oder _erzwingen_.'

	text += '\n'

	text += '\n👌 _Standard_: Der erzeugte Kalender wird standardkonform sein.'
	text += '\n🗑 _komplett entfernen_: Der erzeugte Kalender enthält keine entfernten Veranstaltungen mehr. Du kannst nur noch im Bot sehen, welche Veranstaltungen ausfallen.'
	text += '\n🚫 _erzwungen_: Die Veranstaltung wird auf jeden Fall angezeigt und der Name enthält den 🚫 Emoji.'

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<MyContext>(menuBody)

menu.select('s', removedEventsOptions, {
	columns: 1,
	set: (context, key) => {
		context.state.userconfig.removedEvents = key as RemovedEventsDisplayStyle
		return true
	},
	isSet: (context, key) => (context.state.userconfig.removedEvents ?? 'cancelled') === key
})

menu.manualRow(backMainButtons)
