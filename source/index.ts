import {existsSync, readFileSync} from 'fs'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {Telegraf, Extra, Markup, session} from 'telegraf'

import {Chatconfig} from './lib/chatconfig'
import {hasStISysChanged} from './lib/has-stisys-changed'
import {MyContext} from './lib/types'

import {bot as migrateStuffBot} from './migrate-stuff'

import * as changesInline from './parts/changes-inline'
import * as easterEggs from './parts/easter-eggs'

import {bot as menu} from './menu'

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const token = readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf<MyContext>(token)

if (process.env.NODE_ENV !== 'production') {
	bot.use(generateUpdateMiddleware())
}

bot.use(async (ctx, next) => {
	try {
		if (next) {
			await next()
		}
	} catch (error) {
		if (error.message.includes('Too Many Requests')) {
			console.warn('Telegraf Too Many Requests error. Skip.', error)
			return
		}

		console.error('try to send error to user', ctx.update, error, error?.on?.payload)
		let text = '🔥 Da ist wohl ein Fehler aufgetreten…'
		text += '\n'
		text += 'Schreib mal @EdJoPaTo dazu an oder erstell ein [Issue auf GitHub](https://github.com/HAWHHCalendarBot/TelegramBot/issues). Dafür findet sich sicher eine Lösung. ☺️'

		text += '\n'
		text += '\nError: `'
		text += error.message
			.replace(token, '')
		text += '`'

		const target = (ctx.chat ?? ctx.from!).id
		await ctx.telegram.sendMessage(target, text, {parse_mode: 'Markdown', disable_web_page_preview: true})
	}
})

bot.use(session())
const chatconfig = new Chatconfig('userconfig')
bot.use(chatconfig)

bot.use(migrateStuffBot)

bot.use(changesInline.bot)
bot.use(easterEggs.bot)

bot.use(menu)

async function checkStISysChangeAndNotify() {
	try {
		const hasChanged = await hasStISysChanged()
		if (!hasChanged) {
			return
		}

		const text = 'Es hat sich eine Änderung auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) ergeben.'

		await chatconfig.broadcast(bot.telegram, text, Extra.markdown().markup(Markup.removeKeyboard()), user => Boolean(user.config.stisysUpdate))
	} catch (error) {
		console.error('checkStISysChangeAndNotify failed', error)
	}
}

bot.catch((error: any) => {
	// Should not occur as the error middleware is in place
	console.error('Telegraf Error', error)
})

async function startup() {
	await bot.telegram.setMyCommands([
		{command: 'start', description: 'öffne das Menü'},
		{command: 'mensa', description: 'zeige das heutige Mensaessen deiner Mensa'},
		{command: 'settings', description: 'setze Einstellungen des Bots'}
	])

	setInterval(checkStISysChangeAndNotify, 15 * 60 * 1000)
	await checkStISysChangeAndNotify()

	await bot.launch()
	console.log(new Date(), 'Bot started as', bot.options.username)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startup()
