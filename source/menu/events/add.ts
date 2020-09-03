import {Composer} from 'telegraf'
import {MenuTemplate, replyMenuToContext, deleteMenuFromContext, Body} from 'telegraf-inline-menu'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'

import {backMainButtons} from '../../lib/inline-menu'
import {filterButtonText, DEFAULT_FILTER} from '../../lib/inline-menu-filter'
import {MyContext} from '../../lib/types'
import * as allEvents from '../../lib/all-events'

const MAX_RESULT_ROWS = 10
const RESULT_COLUMNS = 2

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

async function menuBody(context: MyContext): Promise<Body> {
	const filteredEvents = await findEvents(context)
	const isFiltered = context.session.eventfilter !== DEFAULT_FILTER
	const total = await allEvents.count()

	let text = '*Veranstaltungen*'
	text += '\nWelche Events möchtest du hinzufügen?'
	text += '\n\n'
	if (isFiltered) {
		text += `Mit deinem Filter konnte ich ${filteredEvents.length} passende Veranstaltungen finden.`
	} else {
		text += `Ich habe ${total} Veranstaltungen. Nutze den Filter um die Auswahl einzugrenzen.`
	}

	return {text, parse_mode: 'Markdown'}
}

async function findEvents(context: MyContext): Promise<readonly string[]> {
	const filter = context.session.eventfilter ?? DEFAULT_FILTER
	const blacklist = context.state.userconfig.events
	// This is not the array.find function which this eslint thingy trying to fix…
	// eslint-disable-next-line unicorn/no-fn-reference-in-iterator
	return allEvents.find(filter, blacklist)
}

const question = new TelegrafStatelessQuestion<MyContext>('events-add-filter', async context => {
	context.session.eventfilter = context.message.text
	await replyMenuToContext(menu, context, '/e/a/')
})

bot.use(question.middleware())

menu.interact(filterButtonText(context => context.session.eventfilter), 'filter', {
	do: async context => {
		await question.replyWithMarkdown(context, 'Wonach möchtest du die Veranstaltungen filtern?')
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
	const all = await findEvents(context)
	const result: Record<string, string> = {}
	for (const event of all) {
		result[event.replace(/\//g, ';')] = event
	}

	return result
}

menu.choose('a', eventOptions, {
	maxRows: MAX_RESULT_ROWS,
	columns: RESULT_COLUMNS,
	do: async (context, key) => {
		const event = key.replace(/;/g, '/')
		const isExisting = await allEvents.exists(event)
		const isAlreadyInCalendar = context.state.userconfig.events
			.includes(event)

		if (!isExisting) {
			await context.answerCbQuery(`${event} existiert nicht!`)
			return true
		}

		if (isAlreadyInCalendar) {
			await context.answerCbQuery(`${event} ist bereits in deinem Kalender!`)
			return true
		}

		context.state.userconfig.events.push(event)
		context.state.userconfig.events.sort()
		await context.answerCbQuery(`${event} wurde zu deinem Kalender hinzugefügt.`)
		return true
	},
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})

menu.manualRow(backMainButtons)
