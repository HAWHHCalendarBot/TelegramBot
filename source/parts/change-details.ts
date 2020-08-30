import TelegrafInlineMenu from 'telegraf-inline-menu'

import {Change, MyContext} from '../lib/types'
import {generateChangeText, generateShortChangeText} from '../lib/change-helper'

export function generateChangeAction(change: Change): string {
	return change.name + '#' + change.date.replace(':', '.')
}

function getChangeFromCtx(context: MyContext): Change | undefined {
	const complete = context.match![1]
	const match = /^(.+)#(.+)$/.exec(complete)!
	const name = match[1]
	const date = match[2].replace('.', ':')

	return context.state.userconfig.changes
		.find(c => c.name === name && c.date === date)
}

export const menu = new TelegrafInlineMenu(ctx => {
	const change = getChangeFromCtx(ctx as MyContext)
	if (!change) {
		return 'Change does not exist anymore'
	}

	return generateChangeText(change)
})

menu.switchToChatButton('Teilen…', ctx => generateShortChangeText(getChangeFromCtx(ctx as MyContext)!), {
	hide: ctx => {
		const change = getChangeFromCtx(ctx as MyContext)
		return !change
	}
})
menu.simpleButton('⚠️ Änderung entfernen', 'r', {
	setParentMenuAfter: true,
	doFunc: async ctx => {
		const context = ctx as MyContext
		const change = getChangeFromCtx(context)
		context.state.userconfig.changes = context.state.userconfig.changes
			.filter(o => o.name !== change?.name || o.date !== change?.date)
		await context.answerCbQuery('Änderung wurde entfernt.')
	}
})

const replyMenuMiddleware = menu.replyMenuMiddleware()

module.exports = {
	generateChangeAction,
	setSpecific: replyMenuMiddleware.setSpecific,
	menu
}
