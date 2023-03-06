import {Composer} from 'grammy'
import {MenuTemplate} from 'grammy-inline-menu'
import type {Body} from 'grammy-inline-menu'
import {backMainButtons} from '../../lib/inline-menu.js'
import {getUrlFromContext} from '../../lib/calendar-helper.js'
import type {MyContext} from '../../lib/types.js'
import {menu as removedStyleMenu} from './removed-style.js'
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
menu.submenu('⚙️ Anzeigeart entfernter Termine', 'showRemoved', removedStyleMenu)

function generateBody(resourceKeySuffix: string): (ctx: MyContext) => Body {
	return ctx => ({
		parse_mode: 'HTML',
		text: ctx.t('subscribe-' + resourceKeySuffix, {
			firstname: ctx.from!.first_name,
			url: getUrlFromContext(ctx),
		})
			// Remove Isolate Characters which are inserted automatically by Fluent.
			// They are useful to prevent the variables from inserting annoying stuff but here they destroy the url
			.replace(/[\u2068\u2069]+/g, ''),
	})
}
