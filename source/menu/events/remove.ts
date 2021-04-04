import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {backMainButtons} from '../../lib/inline-menu.js'
import {MyContext} from '../../lib/types.js'

function menuBody(): Body {
	let text = ''
	text += '*Veranstaltungen*'
	text += '\n'
	text += 'Welche Veranstaltungen möchtest du aus deinem Kalender entfernen?'

	return {text, parse_mode: 'Markdown'}
}

export const menu = new MenuTemplate<MyContext>(menuBody)

async function eventOptions(context: MyContext): Promise<Record<string, string>> {
	const result: Record<string, string> = {}
	for (const event of context.userconfig.mine.events) {
		result[event.replace(/\//g, ';')] = event
	}

	return result
}

menu.choose('r', eventOptions, {
	columns: 2,
	buttonText: (_, event) => '🗑 ' + event,
	do: async (context, key) => {
		const event = key.replace(/;/g, '/')
		context.userconfig.mine.events = context.userconfig.mine.events.filter(o => o !== event)

		// Only keep changes of events the user still has
		context.userconfig.mine.changes = context.userconfig.mine.changes
			.filter(o => context.userconfig.mine.events.includes(o.name))

		await context.answerCbQuery(`${event} wurde aus deinem Kalender entfernt.`)
		return true
	},
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})

menu.manualRow(backMainButtons)
