import {Composer} from 'telegraf'
import TelegrafInlineMenu from 'telegraf-inline-menu'

import {MyContext} from '../lib/types'

import * as about from './about'
import * as admin from './admin'
import * as events from './events'
import * as mensa from './mensa'
import * as settings from './settings/settings'
import * as stats from './stats'
import * as subscribe from './subscribe'

export const bot = new Composer<MyContext>()

const menu = new TelegrafInlineMenu(ctx => `Hey ${ctx.from!.first_name}!`)

menu.submenu('🏢 Veranstaltungen', 'e', events.menu)
menu.submenu('📲 Kalender abonnieren', 'url', subscribe.menu, {
	hide: ctx => (ctx as MyContext).state.userconfig.events.length === 0
})

menu.submenu('🍽 Mensa', 'mensa', mensa.menu)

menu.submenu('😇 Admin Area', 'admin', admin.menu, {
	hide: admin.hide as any
})

menu.submenu('⚙️ Einstellungen', 's', settings.menu)

menu.submenu('📈 Statistiken', 'stats', stats.menu)
menu.submenu('ℹ️ Über den Bot', 'about', about.menu, {joinLastRow: true})

menu.setCommand('start')

bot.use(menu.init({
	backButtonText: '🔙 zurück…',
	mainMenuButtonText: '🔝 zum Hauptmenü'
}))
