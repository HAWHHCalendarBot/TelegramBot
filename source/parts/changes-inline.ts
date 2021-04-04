import {Composer, Markup} from 'telegraf'
import {User, InlineQueryResultArticle} from 'typegram'

import {Change, MyContext} from '../lib/types.js'
import {generateChangeDescription, generateChangeText, generateChangeTextHeader, generateShortChangeText} from '../lib/change-helper.js'

export const bot = new Composer<MyContext>()

function generateInlineQueryResultFromChange(change: Change, from: User): InlineQueryResultArticle {
	const id = `${change.name}#${change.date}#${from.id}`
	return {
		description: generateChangeDescription(change),
		id,
		input_message_content: {
			message_text: generateChangeText(change),
			parse_mode: 'Markdown'
		},
		...Markup.inlineKeyboard([Markup.button.callback('zu meinem Kalender hinzufügen', 'c:a:' + id)]),
		title: generateShortChangeText(change),
		type: 'article'
	}
}

function escapeRegexSpecificChars(input: string): string {
	return input
		.replace('[', '\\[')
		.replace(']', '\\]')
		.replace('(', '\\(')
		.replace(')', '\\)')
}

bot.on('inline_query', async context => {
	const regex = new RegExp(escapeRegexSpecificChars(context.inlineQuery.query), 'i')

	const filtered = context.state.userconfig.changes
		.filter(o => regex.test(generateShortChangeText(o)))
	const results = filtered.map(c => generateInlineQueryResultFromChange(c, context.from))

	await context.answerInlineQuery(results, {
		cache_time: 20,
		is_personal: true,
		switch_pm_parameter: 'changes',
		switch_pm_text: 'Zum Bot'
	})
})

async function preAddMiddleware(context: MyContext, next: () => Promise<void>): Promise<void> {
	const name = context.match![1]!
	const date = context.match![2]!
	const fromId = Number(context.match![3]!)

	if (!context.state.userconfig.events.includes(name)) {
		await context.answerCbQuery('Du besuchst diese Veranstaltung garnicht. 🤔')
		return
	}

	try {
		const fromconfig = await context.userconfig.loadConfig(fromId)
		const searchedChange = fromconfig.changes.filter(o => o.name === name && o.date === date)

		if (searchedChange.length !== 1) {
			throw new Error('User does not have this change')
		}

		context.state.addChange = searchedChange[0]
		await next()
	} catch {
		await context.editMessageText('Die Veranstaltungsänderung existiert nicht mehr. 😔')
	}
}

bot.action(/^c:a:(.+)#(.+)#(.+)$/, preAddMiddleware, async context => {
	const name = context.match[1]!
	const date = context.match[2]!
	const fromId = context.match[3]!

	if (context.from?.id === Number(fromId)) {
		await context.answerCbQuery('Das ist deine eigene Änderung 😉')
		return
	}

	// Prüfen ob man bereits eine Änderung mit dem Namen und dem Datum hat.
	const myChangeToThisEvent = context.state.userconfig.changes
		.filter(o => o.name === name && o.date === date)

	if (myChangeToThisEvent.length > 0) {
		const warning = '⚠️ Du hast bereits eine Änderung zu diesem Termin in deinem Kalender.'
		await context.answerCbQuery(warning)

		const currentChange = myChangeToThisEvent[0]!

		let text = warning + '\n'
		text += generateChangeTextHeader(currentChange)

		text += '\nDiese Veränderung ist bereits in deinem Kalender:'
		text += '\n' + generateChangeDescription(currentChange)

		text += '\nDiese Veränderung wolltest du hinzufügen:'
		text += '\n' + generateChangeDescription(context.state.addChange!)

		const keyboardMarkup = Markup.inlineKeyboard([
			Markup.button.callback('Überschreiben', `c:af:${name}#${date}#${fromId}`),
			Markup.button.callback('Abbrechen', 'c:cancel')
		])

		await context.telegram.sendMessage(context.from!.id, text, {...keyboardMarkup, parse_mode: 'Markdown'})
		return
	}

	context.state.userconfig.changes.push(context.state.addChange!)
	await context.answerCbQuery('Die Änderung wurde hinzugefügt')
})

bot.action('c:cancel', async context => context.editMessageText('Ich habe nichts verändert. 🙂'))

// Action: change add force
bot.action(/^c:af:(.+)#(.+)#(.+)$/, preAddMiddleware, async context => {
	const name = context.match[1]
	const date = context.match[2]
	context.state.userconfig.changes = context.state.userconfig.changes
		.filter(o => o.name !== name || o.date !== date)
	context.state.userconfig.changes.push(context.state.addChange!)
	return context.editMessageText('Die Änderung wurde hinzugefügt.')
})
