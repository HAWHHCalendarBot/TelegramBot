import {Composer} from 'telegraf'
import {html as format} from 'telegram-format'
import {MenuTemplate, Body, replyMenuToContext, deleteMenuFromContext, getMenuOfPath} from 'telegraf-inline-menu'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'

import {backMainButtons} from '../../lib/inline-menu.js'
import {MyContext} from '../../lib/types.js'

import * as changesMenu from './changes/index.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

bot.use(changesMenu.bot)

function getNameFromPath(path: string): string {
	const match = /\/d:([^/]+)\//.exec(path)!
	return match[1]!.replace(/;/, '/')
}

function menuBody(context: MyContext, path: string): Body {
	const name = getNameFromPath(path)
	const event = context.userconfig.mine.events[name]!
	const changes = context.userconfig.mine.changes.filter(o => o.name === name).length

	let text = format.bold('Veranstaltung')
	text += '\n'
	text += name
	text += '\n\n'

	if (changes > 0) {
		text += '✏️'
		text += 'Änderungen'
		text += ': '
		text += changes
		text += '\n\n'
	}

	if (event.notes) {
		text += '🗒'
		text += format.bold('Notizen')
		text += '\n'
		text += format.escape(event.notes)
		text += '\n\n'
	}

	return {text, parse_mode: format.parse_mode}
}

menu.submenu('✏️ Änderungen', 'c', changesMenu.menu, {
	hide: context => Object.keys(context.userconfig.mine.events).length === 0
})

const noteQuestion = new TelegrafStatelessQuestion<MyContext>('event-notes', async (context, path) => {
	const name = getNameFromPath(path)
	if ('text' in context.message) {
		const notes = context.message.text

		context.userconfig.mine.events[name]!.notes = notes
	}

	await replyMenuToContext(menu, context, path)
})

bot.use(noteQuestion.middleware())

menu.interact('🗒 Schreibe Notiz', 'set-notes', {
	do: async (context, path) => {
		await noteQuestion.replyWithMarkdown(context, 'Welche Infos möchtest du an den Kalendereinträgen stehen haben?', getMenuOfPath(path))
		await deleteMenuFromContext(context)
		return false
	}
})

menu.interact('Notiz löschen', 'remove-notes', {
	joinLastRow: true,
	hide: (context, path) => {
		const name = getNameFromPath(path)
		return !context.userconfig.mine.events[name]!.notes
	},
	do: (context, path) => {
		const name = getNameFromPath(path)
		delete context.userconfig.mine.events[name]!.notes
		return true
	}
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

menu.manualRow(backMainButtons)
