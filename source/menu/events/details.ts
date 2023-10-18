import {Composer} from 'grammy'
import {deleteMenuFromContext, getMenuOfPath, MenuTemplate, replyMenuToContext} from 'grammy-inline-menu'
import {html as format} from 'telegram-format'
import {StatelessQuestion} from '@grammyjs/stateless-question'
import type {Body} from 'grammy-inline-menu'
import {backMainButtons} from '../../lib/inline-menu.js'
import type {MyContext} from '../../lib/types.js'
import * as changesMenu from './changes/index.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

bot.use(changesMenu.bot)

function getNameFromPath(path: string): string {
	const match = /\/d:([^/]+)\//.exec(path)!
	return match[1]!.replaceAll(';', '/')
}

function menuBody(context: MyContext, path: string): Body {
	const name = getNameFromPath(path)
	const event = context.userconfig.mine.events[name]!
	const changes = context.userconfig.mine.changes.filter(o => o.name === name).length

	let text = format.bold('Veranstaltung')
	text += '\n'
	text += name
	text += '\n'

	if (changes > 0) {
		text += '\n'
		text += '✏️'
		text += 'Änderungen'
		text += ': '
		text += String(changes)
		text += '\n'
	}

	if (event.alertMinutesBefore !== undefined) {
		text += '\n'
		text += '⏰'
		text += 'Erinnerung'
		text += ': '
		text += `${event.alertMinutesBefore} Minuten vorher`
		text += '\n'
	}

	if (event.notes) {
		text += '\n'
		text += '🗒'
		text += format.bold('Notizen')
		text += '\n'
		text += format.escape(event.notes)
		text += '\n\n'
	}

	return {text, parse_mode: format.parse_mode, disable_web_page_preview: true}
}

menu.submenu('✏️ Änderungen', 'c', changesMenu.menu, {
	hide: context => Object.keys(context.userconfig.mine.events).length === 0,
})

const alertMenu = new MenuTemplate<MyContext>((_, path) => {
	const name = getNameFromPath(path)
	return `Wie lange im vorraus möchtest du an einen Termin der Veranstaltung ${name} erinnert werden?`
})

alertMenu.interact('🔕 Garnicht', 'nope', {
	do(context, path) {
		const name = getNameFromPath(path)
		delete context.userconfig.mine.events[name]!.alertMinutesBefore
		return '..'
	},
})

const alertChoices = {
	0: 'Beginn',
	5: '5 Minuten',
	10: '10 Minuten',
	15: '15 Minuten',
	30: '30 Minuten',
	45: '45 Minuten',
	60: '1 Stunde',
	120: '2 Stunden',
	1337: '1337 Minuten',
} as const

alertMenu.choose('t', alertChoices, {
	columns: 3,
	do(context, key) {
		if (!context.callbackQuery?.data) {
			throw new Error('how?')
		}

		const name = getNameFromPath(context.callbackQuery.data)
		const minutes = Number(key)
		context.userconfig.mine.events[name]!.alertMinutesBefore = minutes
		return '..'
	},
})

alertMenu.manualRow(backMainButtons)

menu.submenu('⏰ Erinnerung', 'alert', alertMenu)

const noteQuestion = new StatelessQuestion<MyContext>('event-notes', async (context, path) => {
	const name = getNameFromPath(path)
	if ('text' in context.message) {
		const notes = context.message.text

		context.userconfig.mine.events[name]!.notes = notes
	}

	await replyMenuToContext(menu, context, path)
})

bot.use(noteQuestion.middleware())

menu.interact('🗒 Schreibe Notiz', 'set-notes', {
	async do(context, path) {
		const name = getNameFromPath(path)
		const text = `Welche Notizen möchtest du an den Kalendereinträgen von ${format.escape(name)} stehen haben?`
		await noteQuestion.replyWithHTML(context, text, getMenuOfPath(path))
		await deleteMenuFromContext(context)
		return false
	},
})

menu.interact('Notiz löschen', 'remove-notes', {
	joinLastRow: true,
	hide(context, path) {
		const name = getNameFromPath(path)
		return !context.userconfig.mine.events[name]!.notes
	},
	do(context, path) {
		const name = getNameFromPath(path)
		delete context.userconfig.mine.events[name]!.notes
		return true
	},
})

function removeBody(context: MyContext): Body {
	const event = context.match![1]!.replaceAll(';', '/')
	return event + '\n\nBist du dir sicher, dass du diese Veranstaltung entfernen möchtest?'
}

const removeMenu = new MenuTemplate<MyContext>(removeBody)
removeMenu.interact('Ja ich will!', 'y', {
	async do(context) {
		const event = context.match![1]!.replaceAll(';', '/')
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete context.userconfig.mine.events[event]

		// Only keep changes of events the user still has
		context.userconfig.mine.changes = context.userconfig.mine.changes
			.filter(o => Object.keys(context.userconfig.mine.events).includes(o.name))

		await context.answerCallbackQuery({text: `${event} wurde aus deinem Kalender entfernt.`})
		return true
	},
})
removeMenu.navigate('🛑 Abbrechen', '..', {joinLastRow: true})

menu.submenu('🗑 Veranstaltung entfernen', 'r', removeMenu)

menu.manualRow(backMainButtons)
