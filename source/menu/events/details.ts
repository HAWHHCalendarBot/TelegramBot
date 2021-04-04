import {Composer} from 'telegraf'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {backMainButtons} from '../../lib/inline-menu.js'
import {MyContext} from '../../lib/types.js'

import * as changesMenu from './changes/index.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

bot.use(changesMenu.bot)

menu.submenu('✏️ Änderungen', 'c', changesMenu.menu, {
	hide: context => Object.keys(context.userconfig.mine.events).length === 0
})

function removeBody(context: MyContext): Body {
	const event = context.match![1]!.replace(/;/, '/')
	return event + '\n\nBist du dir sicher, dass du diese Veranstaltung entfernen möchtest?'
}

const removeMenu = new MenuTemplate<MyContext>(removeBody)
removeMenu.interact('Ja ich will!', 'y', {
	do: async context => {
		const event = context.match![1]!.replace(/;/, '/')
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete context.userconfig.mine.events[event]

		// Only keep changes of events the user still has
		context.userconfig.mine.changes = context.userconfig.mine.changes
			.filter(o => Object.keys(context.userconfig.mine.events).includes(o.name))

		await context.answerCbQuery(`${event} wurde aus deinem Kalender entfernt.`)
		return true
	}
})
removeMenu.navigate('🛑 Abbrechen', '..', {joinLastRow: true})

menu.submenu('🗑 Entfernen', 'r', removeMenu)

function menuBody(context: MyContext): Body {
	const event = context.match![1]!.replace(/;/, '/')

	let text = '*Veranstaltung*\n'
	text += event

	return {text, parse_mode: 'Markdown'}
}

menu.manualRow(backMainButtons)
