import {Composer} from 'telegraf'
import {html as format} from 'telegram-format'
import {MenuTemplate, replyMenuToContext, deleteMenuFromContext, Body, getMenuOfPath} from 'telegraf-inline-menu'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'

import {backMainButtons} from '../../lib/inline-menu.js'
import {filterButtonText, DEFAULT_FILTER} from '../../lib/inline-menu-filter.js'
import {MyContext} from '../../lib/types.js'
import * as allEvents from '../../lib/all-events.js'

const MAX_RESULT_ROWS = 10
const RESULT_COLUMNS = 2

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

async function menuBody(context: MyContext): Promise<Body> {
	const total = await allEvents.count()

	let text = format.bold('Veranstaltungen')
	text += '\nWelche Events möchtest du hinzufügen?'
	text += '\n\n'

	try {
		const filteredEvents = await findEvents(context)

		const filter = context.session.eventfilter ?? DEFAULT_FILTER
		text += filter === DEFAULT_FILTER ?
			`Ich habe ${total} Veranstaltungen. Nutze den Filter um die Auswahl einzugrenzen.` :
			`Mit deinem Filter konnte ich ${filteredEvents.length} passende Veranstaltungen finden.`
	} catch (error: unknown) {
		const errorText = error instanceof Error ? error.message : String(error)
		text += 'Filter Error: '
		text += format.monospace(errorText)
	}

	return {text, parse_mode: format.parse_mode}
}

async function findEvents(context: MyContext): Promise<readonly string[]> {
	const filter = context.session.eventfilter ?? DEFAULT_FILTER
	const ignore = context.userconfig.mine.events
	// This is not the array.find function which this eslint thingy trying to fix…
	// eslint-disable-next-line unicorn/no-array-callback-reference
	return allEvents.find(filter, ignore)
}

const question = new TelegrafStatelessQuestion<MyContext>('events-add-filter', async (context, path) => {
	if ('text' in context.message) {
		context.session.eventfilter = context.message.text
	}

	await replyMenuToContext(menu, context, path)
})

bot.use(question.middleware())

menu.interact(filterButtonText(context => context.session.eventfilter), 'filter', {
	do: async (context, path) => {
		await question.replyWithMarkdown(context, 'Wonach möchtest du die Veranstaltungen filtern?', getMenuOfPath(path))
		await deleteMenuFromContext(context)
		return false
	}
})

menu.interact('Filter aufheben', 'filter-clear', {
	joinLastRow: true,
	hide: context => (context.session.eventfilter ?? DEFAULT_FILTER) === DEFAULT_FILTER,
	do: context => {
		delete context.session.eventfilter
		return true
	}
})

async function eventOptions(context: MyContext): Promise<Record<string, string>> {
	try {
		const all = await findEvents(context)
		const result: Record<string, string> = {}
		for (const event of all) {
			result[event.replace(/\//g, ';')] = event
		}

		return result
	} catch {
		return {}
	}
}

menu.choose('a', eventOptions, {
	maxRows: MAX_RESULT_ROWS,
	columns: RESULT_COLUMNS,
	do: async (context, key) => {
		const event = key.replace(/;/g, '/')
		const isExisting = await allEvents.exists(event)
		const isAlreadyInCalendar = context.userconfig.mine.events
			.includes(event)

		if (!isExisting) {
			await context.answerCbQuery(`${event} existiert nicht!`)
			return true
		}

		if (isAlreadyInCalendar) {
			await context.answerCbQuery(`${event} ist bereits in deinem Kalender!`)
			return true
		}

		context.userconfig.mine.events.push(event)
		context.userconfig.mine.events.sort()
		await context.answerCbQuery(`${event} wurde zu deinem Kalender hinzugefügt.`)
		return true
	},
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})

menu.manualRow(backMainButtons)
