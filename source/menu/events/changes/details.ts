import {MenuTemplate} from 'telegraf-inline-menu'

import {backMainButtons} from '../../../lib/inline-menu.js'
import {Change, MyContext} from '../../../lib/types.js'
import {generateChangeText, generateShortChangeText} from '../../../lib/change-helper.js'

export function generateChangeAction(change: Change): string {
	return change.name.replace(/\//g, ';') + '#' + change.date.replace(/:/g, '&')
}

function getChangeFromContext(context: MyContext): Change | undefined {
	const complete = context.match![1]!
	const match = /^(.+)#(.+)$/.exec(complete)!
	const name = match[1]!.replace(/;/g, '/')
	const date = match[2]!.replace(/&/g, ':')

	return context.state.userconfig.changes
		.find(c => c.name === name && c.date === date)
}

export const menu = new MenuTemplate<MyContext>(context => {
	const change = getChangeFromContext(context)
	if (!change) {
		return 'Change does not exist anymore'
	}

	const text = generateChangeText(change)
	return {text, parse_mode: 'Markdown'}
})

menu.switchToChat('Teilen…', context => generateShortChangeText(getChangeFromContext(context)!), {
	hide: context => {
		const change = getChangeFromContext(context)
		return !change
	}
})
menu.interact('⚠️ Änderung entfernen', 'r', {
	do: async context => {
		const change = getChangeFromContext(context)
		context.state.userconfig.changes = context.state.userconfig.changes
			.filter(o => o.name !== change?.name || o.date !== change?.date)
		await context.answerCbQuery('Änderung wurde entfernt.')
		return '..'
	}
})

menu.manualRow(backMainButtons)
