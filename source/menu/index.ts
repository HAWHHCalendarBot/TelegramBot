import {Composer} from 'telegraf'
import {MenuTemplate, MenuMiddleware} from 'telegraf-inline-menu'

import {MyContext} from '../lib/types.js'

import * as about from './about.js'
import * as admin from './admin/index.js'
import * as events from './events/index.js'
import * as mensa from './mensa.js'
import * as settings from './settings/index.js'
import * as subscribe from './subscribe/index.js'

export const bot = new Composer<MyContext>()
const menu = new MenuTemplate<MyContext>(context => `Hey ${context.from!.first_name}!`)

bot.use(admin.bot)
bot.use(events.bot)
bot.use(settings.bot)
bot.use(subscribe.bot)

menu.submenu('🏢 Veranstaltungen', 'e', events.menu)
menu.submenu('📲 Kalender abonnieren', 'subscribe', subscribe.menu, {
	hide: context => Object.keys(context.userconfig.mine.events).length === 0
})

menu.submenu('🍽 Mensa', 'mensa', mensa.menu)

menu.submenu('😇 Admin Area', 'admin', admin.menu, {
	hide: admin.hide
})

menu.submenu('⚙️ Einstellungen', 'settings', settings.menu)

menu.submenu('ℹ️📈 Über den Bot', 'about', about.menu)

const middleware = new MenuMiddleware('/', menu)

bot.command('start', async context => middleware.replyToContext(context))
bot.command('mensa', async context => middleware.replyToContext(context, '/mensa/'))
bot.command('settings', async context => middleware.replyToContext(context, '/settings/'))
bot.command('stop', async context => middleware.replyToContext(context, '/settings/data/'))

bot.use(middleware)
