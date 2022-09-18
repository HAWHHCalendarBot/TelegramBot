import {Bot, session} from 'grammy'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {useFluent} from '@grammyjs/fluent'
import {bot as menu} from './menu/index.js'
import {bot as migrateStuffBot} from './migrate-stuff.js'
import {Chatconfig} from './lib/chatconfig.js'
import {fluent, loadLocales} from './translation.js'
import * as changesInline from './parts/changes-inline.js'
import * as easterEggs from './parts/easter-eggs.js'
import type {MyContext, Session} from './lib/types.js'

process.title = 'calendarbot-tgbot'

const token = process.env['BOT_TOKEN']
if (!token) {
	throw new Error('You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)')
}

const bot = new Bot<MyContext>(token)

bot.use(useFluent({
	defaultLocale: 'de',
	fluent,
	localeNegotiator: ctx => ctx.from?.language_code ?? 'de',
}))

if (process.env['NODE_ENV'] !== 'production') {
	bot.use(generateUpdateMiddleware())
}

bot.use(async (ctx, next) => {
	try {
		if (next) {
			await next()
		}
	} catch (error: unknown) {
		if (error instanceof Error && error.message.includes('Too Many Requests')) {
			console.warn('grammY Too Many Requests error. Skip.', error)
			return
		}

		console.error(
			'try to send error to user',
			ctx.update,
			error,
			(error as any)?.on?.payload,
		)
		let text = '🔥 Da ist wohl ein Fehler aufgetreten…'
		text += '\n'
		text += 'Schreib mal @EdJoPaTo dazu an oder erstell ein [Issue auf GitHub](https://github.com/HAWHHCalendarBot/TelegramBot/issues). Dafür findet sich sicher eine Lösung. ☺️'

		text += '\n'
		text += '\nError: `'
		const errorText = error instanceof Error ? error.message : String(error)
		text += errorText.replace(token, '')
		text += '`'

		const target = (ctx.chat ?? ctx.from!).id
		await ctx.api.sendMessage(target, text, {
			parse_mode: 'Markdown',
			disable_web_page_preview: true,
		})
	}
})

bot.use(session<Session, MyContext>({
	initial() {
		return {}
	},
}))

const chatconfig = new Chatconfig('userconfig')
bot.use(chatconfig)

bot.use(migrateStuffBot)

bot.use(changesInline.bot)
bot.use(easterEggs.bot)

bot.use(menu)

bot.catch((error: any) => {
	// Should not occur as the error middleware is in place
	console.error('grammY Error', error)
})

async function startup() {
	await loadLocales()

	await bot.api.setMyCommands([
		{command: 'start', description: 'öffne das Menü'},
		{command: 'mensa', description: 'zeige das heutige Mensaessen deiner Mensa'},
		{command: 'settings', description: 'setze Einstellungen des Bots'},
	])

	await bot.start({
		onStart(botInfo) {
			console.log(new Date(), 'Bot starts as', botInfo.username)
		},
	})
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startup()
