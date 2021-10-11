import {Bot, session} from 'grammy'
import {generateUpdateMiddleware} from 'telegraf-middleware-console-time'
import {html as format} from 'telegram-format'
import {I18n} from '@grammyjs/i18n'

import {Chatconfig} from './lib/chatconfig.js'
import {MyContext, Session} from './lib/types.js'
import {startListenWebsiteStalkerWebhook} from './lib/study-website-stalker.js'

import {bot as migrateStuffBot} from './migrate-stuff.js'

import * as changesInline from './parts/changes-inline.js'
import * as easterEggs from './parts/easter-eggs.js'

import {bot as menu} from './menu/index.js'

process.title = 'calendarbot-tgbot'

const token = process.env['BOT_TOKEN']
if (!token) {
	throw new Error('You have to provide the bot-token from @BotFather via environment variable (BOT_TOKEN)')
}

const bot = new Bot<MyContext>(token)

const i18n = new I18n({
	defaultLanguage: 'de',
	defaultLanguageOnMissing: true,
	directory: 'locales',
})
bot.use(i18n.middleware())

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

		console.error('try to send error to user', ctx.update, error, (error as any)?.on?.payload)
		let text = '🔥 Da ist wohl ein Fehler aufgetreten…'
		text += '\n'
		text += 'Schreib mal @EdJoPaTo dazu an oder erstell ein [Issue auf GitHub](https://github.com/HAWHHCalendarBot/TelegramBot/issues). Dafür findet sich sicher eine Lösung. ☺️'

		text += '\n'
		text += '\nError: `'
		const errorText = error instanceof Error ? error.message : String(error)
		text += errorText.replace(token, '')
		text += '`'

		const target = (ctx.chat ?? ctx.from!).id
		await ctx.api.sendMessage(target, text, {parse_mode: 'Markdown', disable_web_page_preview: true})
	}
})

bot.use(session())
bot.use(async (ctx, next) => {
	if (!ctx.session) {
		const defaultSession: Session = {}
		// @ts-expect-error write to readonly
		ctx.session = defaultSession
	}

	await next()
})

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
	await bot.api.setMyCommands([
		{command: 'start', description: 'öffne das Menü'},
		{command: 'mensa', description: 'zeige das heutige Mensaessen deiner Mensa'},
		{command: 'settings', description: 'setze Einstellungen des Bots'},
	])

	startListenWebsiteStalkerWebhook(async summary => {
		let text = ''
		text += 'Es gab Webseitenänderungen:'
		text += '\n\n'
		text += summary.commitMessages.map(o => format.escape(o)).join('\n\n')
		text += '\n\n'
		text += format.url('Kompletter Diff', summary.compareUrl)

		await chatconfig.broadcast(
			bot.api,
			text,
			{
				disable_web_page_preview: true,
				parse_mode: format.parse_mode,
				reply_markup: {remove_keyboard: true},
			},
			user => Boolean(user.config.websiteStalkerUpdate) || Boolean(user.config.stisysUpdate),
		)
	})

	await bot.start({
		onStart: botInfo => {
			console.log(new Date(), 'Bot starts as', botInfo.username)
		},
	})
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
startup()
