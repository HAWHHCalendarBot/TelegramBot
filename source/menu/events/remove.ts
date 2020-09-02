import TelegrafInlineMenu from 'telegraf-inline-menu'

import {MyContext} from '../../lib/types'

function overviewText(context: MyContext): string {
	const prefix = '*Veranstaltungen*\n'
	if (context.state.userconfig.events.length === 0) {
		return prefix + 'Du hast keine Veranstaltungen mehr in deinem Kalender, die ich entfernen könnte. 😔'
	}

	return prefix + 'Welche Veranstaltungen möchtest du aus deinem Kalender entfernen?'
}

export const menu = new TelegrafInlineMenu(overviewText as any)

function deleteDict(context: MyContext): Record<string, string> {
	const entries: Record<string, string> = {}
	for (const event of context.state.userconfig.events) {
		entries[event] = '🗑 ' + event
	}

	return entries
}

menu.select('r', deleteDict as any, {
	setFunc: remove as any,
	columns: 2,
	getCurrentPage: ctx => (ctx as MyContext).session.page,
	setPage: (ctx, page) => {
		(ctx as MyContext).session.page = page
	}
})

async function remove(context: MyContext, event: string): Promise<void> {
	context.state.userconfig.events = context.state.userconfig.events.filter(o => o !== event)

	// Remove changes to that event too
	context.state.userconfig.changes = context.state.userconfig.changes
		.filter(o => o.name !== event)

	await context.answerCbQuery(`${event} wurde aus deinem Kalender entfernt.`)
}
