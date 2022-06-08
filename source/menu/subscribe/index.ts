import {Composer} from 'grammy'
import {MenuTemplate, Body} from 'grammy-inline-menu'

import {backMainButtons} from '../../lib/inline-menu.js'
import {getUrlFromContext} from '../../lib/calendar-helper.js'
import {MyContext} from '../../lib/types.js'

import * as suffixMenu from './suffix.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(generateBody('overview'))

bot.use(suffixMenu.bot)

const appleMenu = new MenuTemplate(generateBody('apple'))
appleMenu.url('Kalender abonnieren', ctx => `https://calendarbot.hawhh.de/ics.html?url=${getUrlFromContext(ctx)}`)
appleMenu.manualRow(backMainButtons)
menu.submenu('🍏 iOS / macOS', 'apple', appleMenu)

const exchangeMenu = new MenuTemplate(generateBody('exchange'))
exchangeMenu.url('HAW Mailer', 'https://www.haw-hamburg.de/online-services/haw-mailer.html')
exchangeMenu.manualRow(backMainButtons)
menu.submenu('🗂 HAW Mailer (Exchange)', 'exchange', exchangeMenu)

const googleMenu = new MenuTemplate(generateBody('google'))
menu.submenu('🍰 Google Kalender', 'google', googleMenu)
googleMenu.url('Google Calendar', 'https://calendar.google.com/')
googleMenu.url('Google Sync Settings', 'https://www.google.com/calendar/syncselect')
googleMenu.navigate('abonnieren mit dem HAW-Mailer (Exchange)', '../exchange/')
googleMenu.manualRow(backMainButtons)

const freestyleMenu = new MenuTemplate(generateBody('freestyle'))
freestyleMenu.url('Kalender abonnieren', ctx => `https://calendarbot.hawhh.de/ics.html?url=${getUrlFromContext(ctx)}`)
freestyleMenu.manualRow(backMainButtons)
menu.submenu('Freestyle 😎', 'freestyle', freestyleMenu)

menu.submenu('⚙️ URL Privacy', 'suffix', suffixMenu.menu)

menu.manualRow(backMainButtons)

function generateBody(resourceKeySuffix: string): (ctx: MyContext) => Body {
	return ctx => ({
		parse_mode: 'HTML',
		text: ctx.t('subscribe-' + resourceKeySuffix, {
			firstname: ctx.from!.first_name,
			url: getUrlFromContext(ctx),
		}),
	})
}
