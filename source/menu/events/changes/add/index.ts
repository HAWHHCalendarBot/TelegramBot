import {Composer} from 'telegraf'
import {MenuTemplate, replyMenuToContext, Body, deleteMenuFromContext, getMenuOfPath} from 'telegraf-inline-menu'
import arrayFilterUnique from 'array-filter-unique'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'

import {formatDateToHumanReadable, formatDateToStoredChangeDate} from '../../../../lib/calendar-helper'
import {loadEvents, generateChangeText} from '../../../../lib/change-helper'
import {MyContext, Change} from '../../../../lib/types'
import * as allEvents from '../../../../lib/all-events'

import * as changeDetails from '../details'

import {createTimeSelectionSubmenuButtons} from './time-selector'
import {createDatePickerButtons} from './date-selector'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

function changesOfEvent(context: MyContext, name: string) {
	const allChanges = context.state.userconfig.changes
	return allChanges.filter(o => o.name === name)
}

function menuBody(context: MyContext): Body {
	const {name, date, add} = context.session.generateChange ?? {}
	let text = ''
	if (!name) {
		return 'Zu welcher Veranstaltung willst du eine Änderung hinzufügen?'
	}

	if (!date) {
		text = 'Zu welchem Termin willst du eine Änderung hinzufügen?'
		const changes = changesOfEvent(context, name)
		if (changes.length > 0) {
			text += '\n\nFolgende Termine habe bereits eine Veränderung. Entferne die Veränderung zuerst, bevor du eine neue erstellen kannst.'
			text += '\n'

			const dates = changes.map(o => o.date)
			dates.sort()
			text += dates
				.map(o => formatDateToHumanReadable(o))
				.map(o => `- ${o}`)
				.join('\n')
		}
	}

	if (date) {
		text = generateChangeText(context.session.generateChange as Change)
		if (add) {
			text += '\nSpezifiziere den zusätzlichen Termin.'
		} else {
			text += '\nWelche Art von Änderung willst du vornehmen?'
		}
	}

	return {text, parse_mode: 'Markdown'}
}

function hidePickEventStep(context: MyContext): boolean {
	if (!context.session.generateChange) {
		context.session.generateChange = {}
	}

	return Boolean(context.session.generateChange.name)
}

function hidePickDateStep(context: MyContext): boolean {
	const {name, date} = context.session.generateChange ?? {}
	return !name || Boolean(date)
}

function hideGenerateChangeStep(context: MyContext): boolean {
	const {name, date} = context.session.generateChange ?? {}
	return !name || !date
}

function hideGenerateAddStep(context: MyContext): boolean {
	const {name, date, add} = context.session.generateChange ?? {}
	return !name || !date || !add
}

function generationDataIsValid(context: MyContext): boolean {
	const keys = Object.keys(context.session.generateChange ?? [])
	// Required (2): name and date
	// There have to be other changes than that in order to do something.
	return keys.length > 2
}

async function eventOptions(context: MyContext): Promise<Record<string, string>> {
	const result: Record<string, string> = {}
	for (const event of context.state.userconfig.events) {
		result[event.replace(/\//g, ';')] = event
	}

	return result
}

menu.choose('event', eventOptions, {
	columns: 2,
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	},
	hide: hidePickEventStep,
	do: async (context, key) => {
		const event = key.replace(/;/g, '/')
		if (await allEvents.exists(event)) {
			if (!context.session.generateChange) {
				context.session.generateChange = {}
			}

			context.session.generateChange.name = event
		} else {
			context.state.userconfig.events = context.state.userconfig.events
				.filter(o => o !== event)
			await context.answerCbQuery(`⚠️ Die Veranstaltung "${event}" existiert garnicht mehr!\nIch habe sie aus deinem Kalender entfernt.`, true)
		}

		return true
	}
})

menu.interact('➕ Zusätzlicher Termin', 'new-date', {
	hide: hidePickDateStep,
	do: context => {
		// Set everything that has to be set to be valid.
		// When the user dont like the data they can change it but they are not able to create invalid data.
		context.session.generateChange!.add = true
		// TODO: when setting the start time on add date, the date has to be changed
		context.session.generateChange!.date = formatDateToStoredChangeDate(new Date())
		context.session.generateChange!.endtime = '23:45'
		return true
	}
})

async function possibleTimesToCreateChangeToOptions(context: MyContext): Promise<Record<string, string>> {
	const {name, date} = context.session.generateChange ?? {}
	if (!name) {
		// No event selected for which events could be found
		return {}
	}

	if (date) {
		// Date already selected
		return {}
	}

	const existingChangeDates = new Set(changesOfEvent(context, name)
		.map(o => o.date))

	const events = await loadEvents(name)
	const dates = events
		.map(o => o.StartTime)
		.map(o => formatDateToStoredChangeDate(o))
		.filter(o => !existingChangeDates.has(o))
		.filter(arrayFilterUnique())
	const options: Record<string, string> = {}
	for (const date of dates) {
		options[date.replace(':', '!')] = formatDateToHumanReadable(date)
	}

	return options
}

menu.choose('date', possibleTimesToCreateChangeToOptions, {
	columns: 2,
	hide: hidePickDateStep,
	do: (context, key) => {
		context.session.generateChange!.date = key.replace('!', ':')
		return true
	},
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})

menu.interact('🚫 Entfällt', 'remove', {
	do: async context => {
		context.session.generateChange!.remove = true
		return finish(context)
	},
	hide: context => {
		if (hideGenerateChangeStep(context)) {
			return true
		}

		return Object.keys(context.session.generateChange!).length > 2
	}
})

createDatePickerButtons(menu, hideGenerateAddStep)

createTimeSelectionSubmenuButtons(menu, hideGenerateChangeStep)

const namesuffixQuestion = new TelegrafStatelessQuestion<MyContext>('change-add-suffix', async (context, path) => {
	const {text} = context.message
	context.session.generateChange!.namesuffix = text
	await replyMenuToContext(menu, context, path)
})

const roomQuestion = new TelegrafStatelessQuestion<MyContext>('change-add-room', async (context, path) => {
	const {text} = context.message
	context.session.generateChange!.room = text
	await replyMenuToContext(menu, context, path)
})

bot.use(namesuffixQuestion.middleware())
bot.use(roomQuestion.middleware())

function questionButtonText(property: 'namesuffix' | 'room', emoji: string, fallback: string): (context: MyContext) => string {
	return context => {
		const value = context.session.generateChange![property]
		const text = value ?? fallback
		return emoji + ' ' + text
	}
}

menu.interact(questionButtonText('namesuffix', '🗯', 'Namenszusatz'), 'namesuffix', {
	hide: hideGenerateChangeStep,
	do: async (context, path) => {
		await namesuffixQuestion.replyWithMarkdown(context, 'Welche Zusatzinfo möchtest du dem Termin geben? Dies sollte nur ein Wort oder eine kurze Info sein, wie zum Beispiel "Klausurvorbereitung". Diese Info wird dann dem Titel des Termins angehängt.', getMenuOfPath(path))
		await deleteMenuFromContext(context)
		return false
	}
})

menu.interact(questionButtonText('room', '📍', 'Raum'), 'room', {
	hide: hideGenerateChangeStep,
	do: async (context, path) => {
		await roomQuestion.replyWithMarkdown(context, 'In welchen Raum wurde der Termin verschoben?', getMenuOfPath(path))
		await deleteMenuFromContext(context)
		return false
	}
})

menu.interact('✅ Fertig stellen', 'finish', {
	do: finish,
	hide: context => !generationDataIsValid(context)
})

async function finish(context: MyContext): Promise<string | boolean> {
	const change = context.session.generateChange!

	if (!context.state.userconfig.changes) {
		context.state.userconfig.changes = []
	}

	const {name, date} = change
	if (context.state.userconfig.changes.some(o => o.name === name && o.date === date)) {
		// Dont do something when there is already a change for the date
		// This shouldn't occour but it can when the user adds a shared change
		// Also the user can add an additional date that they already have 'used'
		await context.answerCbQuery('Du hast bereits eine Veranstaltungsänderung für diesen Termin.')
		return true
	}

	context.state.userconfig.changes.push(change as Change)
	delete context.session.generateChange

	const actionPart = changeDetails.generateChangeAction(change as Change)
	return `../d:${actionPart}/`
}

menu.interact('🛑 Abbrechen', 'abort', {
	joinLastRow: true,
	do: context => {
		delete context.session.generateChange
		return '..'
	}
})
