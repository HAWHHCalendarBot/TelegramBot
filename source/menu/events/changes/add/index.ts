import {StatelessQuestion} from '@grammyjs/stateless-question'
import {arrayFilterUnique} from 'array-filter-unique'
import {Composer} from 'grammy'
import {MenuTemplate, deleteMenuFromContext, getMenuOfPath, replyMenuToContext, type Body} from 'grammy-inline-menu'
import {formatDateToHumanReadable, formatDateToStoredChangeDate} from '../../../../lib/calendar-helper.js'
import {generateChangeText, loadEvents} from '../../../../lib/change-helper.js'
import type {Change, MyContext} from '../../../../lib/types.js'
import * as changeDetails from '../details.js'
import {createDatePickerButtons} from './date-selector.js'
import {createTimeSelectionSubmenuButtons} from './time-selector.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

function changesOfEvent(context: MyContext, name: string) {
	const allChanges = context.userconfig.mine.changes
	return allChanges.filter(o => o.name === name)
}

function menuBody(context: MyContext): Body {
	if (!context.session.generateChange) {
		context.session.generateChange = {}
	}

	if (context.match) {
		context.session.generateChange.name = context.match[1]!.replaceAll(';', '/')
	}

	const {name, date, add} = context.session.generateChange
	let text = ''

	if (!date) {
		text = 'Zu welchem Termin willst du eine Änderung hinzufügen?'
		const changes = changesOfEvent(context, name!)
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
		text += add
			? '\nSpezifiziere den zusätzlichen Termin.'
			: '\nWelche Art von Änderung willst du vornehmen?'
	}

	return {text, parse_mode: 'HTML'}
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

menu.interact('➕ Zusätzlicher Termin', 'new-date', {
	hide: hidePickDateStep,
	do(context) {
		// Set everything that has to be set to be valid.
		// When the user dont like the data they can change it but they are not able to create invalid data.
		context.session.generateChange!.add = true
		context.session.generateChange!.date = formatDateToStoredChangeDate(new Date())
		context.session.generateChange!.starttime = new Date().toLocaleTimeString(
			'de-DE',
			{hour12: false, hour: '2-digit', minute: '2-digit'},
		)
		context.session.generateChange!.endtime = '23:45'
		return true
	},
})

async function possibleTimesToCreateChangeToOptions(
	context: MyContext,
): Promise<Record<string, string>> {
	const name = context.match![1]!.replaceAll(';', '/')
	const {date} = context.session.generateChange ?? {}

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
	return Object.fromEntries(dates.map(date => [date, formatDateToHumanReadable(date)]))
}

menu.choose('date', possibleTimesToCreateChangeToOptions, {
	columns: 2,
	hide: hidePickDateStep,
	do(context, key) {
		context.session.generateChange!.date = key
		return true
	},
	getCurrentPage: context => context.session.page,
	setPage(context, page) {
		context.session.page = page
	},
})

menu.interact('🚫 Entfällt', 'remove', {
	async do(context) {
		context.session.generateChange!.remove = true
		return finish(context)
	},
	hide(context) {
		if (hideGenerateChangeStep(context)) {
			return true
		}

		return Object.keys(context.session.generateChange!).length > 2
	},
})

createDatePickerButtons(menu, hideGenerateAddStep)

createTimeSelectionSubmenuButtons(menu, hideGenerateChangeStep)

const namesuffixQuestion = new StatelessQuestion<MyContext>('change-add-suffix', async (context, path) => {
	if ('text' in context.message) {
		context.session.generateChange!.namesuffix = context.message.text
	}

	await replyMenuToContext(menu, context, path)
})

const roomQuestion = new StatelessQuestion<MyContext>('change-add-room', async (context, path) => {
	if ('text' in context.message) {
		context.session.generateChange!.room = context.message.text
	}

	await replyMenuToContext(menu, context, path)
})

bot.use(namesuffixQuestion.middleware())
bot.use(roomQuestion.middleware())

function questionButtonText(
	property: 'namesuffix' | 'room',
	emoji: string,
	fallback: string,
): (context: MyContext) => string {
	return context => {
		const value = context.session.generateChange![property]
		const text = value ?? fallback
		return emoji + ' ' + text
	}
}

menu.interact(questionButtonText('namesuffix', '🗯', 'Namenszusatz'), 'namesuffix', {
	hide: hideGenerateChangeStep,
	async do(context, path) {
		await namesuffixQuestion.replyWithMarkdown(
			context,
			'Welche Zusatzinfo möchtest du dem Termin geben? Dies sollte nur ein Wort oder eine kurze Info sein, wie zum Beispiel "Klausurvorbereitung". Diese Info wird dann dem Titel des Termins angehängt.',
			getMenuOfPath(path),
		)
		await deleteMenuFromContext(context)
		return false
	},
})

menu.interact(questionButtonText('room', '📍', 'Raum'), 'room', {
	hide: hideGenerateChangeStep,
	async do(context, path) {
		await roomQuestion.replyWithMarkdown(
			context,
			'In welchen Raum wurde der Termin verschoben?',
			getMenuOfPath(path),
		)
		await deleteMenuFromContext(context)
		return false
	},
})

menu.interact('✅ Fertig stellen', 'finish', {
	do: finish,
	hide: context => !generationDataIsValid(context),
})

async function finish(context: MyContext): Promise<string | boolean> {
	const change = context.session.generateChange!
	change.name = context.match![1]!.replaceAll(';', '/')

	if (change.add) {
		const date = new Date(Date.parse(change.date!))
		const [hour, minute] = change.starttime!.split(':').map(Number)
		date.setHours(hour!)
		date.setMinutes(minute!)
		change.date = formatDateToStoredChangeDate(date)
		delete change.starttime
	}

	if (!context.userconfig.mine.changes) {
		context.userconfig.mine.changes = []
	}

	const {name, date} = change
	if (context.userconfig.mine.changes.some(o => o.name === name && o.date === date)) {
		// Dont do something when there is already a change for the date
		// This shouldn't occour but it can when the user adds a shared change
		// Also the user can add an additional date that they already have 'used'
		await context.answerCallbackQuery({text: 'Du hast bereits eine Veranstaltungsänderung für diesen Termin.'})
		return true
	}

	context.userconfig.mine.changes.push(change as Change)
	delete context.session.generateChange

	const actionPart = changeDetails.generateChangeAction(change as Change)
	return `../d:${actionPart}/`
}

menu.interact('🛑 Abbrechen', 'abort', {
	joinLastRow: true,
	do(context) {
		delete context.session.generateChange
		return '..'
	},
})
