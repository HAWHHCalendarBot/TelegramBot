import {Composer} from 'telegraf'
import {MenuTemplate, Body, replyMenuToContext, deleteMenuFromContext} from 'telegraf-inline-menu'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'

import {backMainButtons} from '../../lib/inline-menu'
import {MyContext} from '../../lib/types'
import {getUrlFromContext} from '../../lib/calendar-helper'

function menuBody(context: MyContext): Body {
	const {calendarfileSuffix} = context.state.userconfig

	let text = 'Die Kalender liegen für jeden frei zugänglich im Internet. '
	text += `Wenn die URL nur aus deiner Telegram Nutzer ID (\`${context.from!.id}\`) bestehen würde, könnte jeder mit dieser ID deinen Kalender einsehen.`
	text += `\nWird der URL eine zufällige Zeichenkette angefügt (aktuell \`${calendarfileSuffix}\`), muss diese erraten werden und erhöht so deine Privatsphäre.`
	text += ' Eine Zeichenkette, die deiner Kalender URL angefügt wird, kannst du entweder generieren lassen (_Generieren…_) oder _Manuell setzen…_.'
	text += ' Jedoch musst du nach jedem Ändern dieser Einstellung deinen Kalender neu abonnieren, da sich die URL ändert.'

	text += '\n\n'
	text += `Deine Nutzer ID (\`${context.from!.id}\`) ist nicht deine Telefonnummer oder Teil deines Usernamens und innerhalb von Telegram eindeutig.`
	text += ' Wenn man eine Nachricht von dir hat oder in einer Gruppe mit dir ist, kann man deine Nutzer ID erhalten.'

	text += '\n\n'
	text += 'Deine URL lautet:'
	text += `\n\`https://${getUrlFromContext(context)}\``
	return {text, parse_mode: 'Markdown'}
}

const SUFFIX_MAX_LENGTH = 15
const SUFFIX_MIN_LENGTH = 3

async function setSuffix(context: MyContext, value: string): Promise<void> {
	value = String(value)
		.replace(/[^\w\d]/g, '')
		.slice(0, SUFFIX_MAX_LENGTH)
	if (value.length < SUFFIX_MIN_LENGTH) {
		return
	}

	context.state.userconfig.calendarfileSuffix = value
	await sendHintText(context)
}

async function sendHintText(context: MyContext): Promise<void> {
	const hintText = '⚠️ Hinweis: Dein Kalender muss nun neu abonniert werden!'
	if (context.updateType === 'callback_query') {
		await context.answerCbQuery(hintText, true)
		return
	}

	await context.reply(hintText)
}

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

menu.interact('Generieren…', 'g', {
	do: async context => {
		// 10^8 -> 10 ** 8
		const fromTime = Date.now() % (10 ** 8)
		await setSuffix(context, String(fromTime))
		return true
	}
})

const manualSuffixQuestion = new TelegrafStatelessQuestion<MyContext>('subscribe-suffix-manual', async context => {
	const {text} = context.message
	if (text) {
		await setSuffix(context, text)
	}

	await replyMenuToContext(menu, context, '/subscribe/suffix/')
})

bot.use(manualSuffixQuestion.middleware())

menu.interact('Manuell setzen…', 's', {
	do: async context => {
		await manualSuffixQuestion.replyWithMarkdown(
			context,
			`Gib mir Tiernamen! 🦁🦇🐌🦍\nOder andere zufällige Buchstaben und Zahlen Kombinationen.\nSonderzeichen werden heraus gefiltert. Muss mindestens ${SUFFIX_MIN_LENGTH} Zeichen lang sein. Romane werden leider auf ${SUFFIX_MAX_LENGTH} Zeichen gekürzt.`
		)

		await deleteMenuFromContext(context)
		return false
	}
})

menu.manualRow(backMainButtons)
