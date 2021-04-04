import {Composer} from 'telegraf'
import {MenuTemplate} from 'telegraf-inline-menu'

import {backMainButtons} from '../../lib/inline-menu.js'
import {MyContext} from '../../lib/types.js'

import * as broadcastMenu from './broadcast.js'
import * as userMenu from './user-quicklook.js'

export function hide(context: MyContext) {
	return !context.userconfig.mine.admin
}

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>('Hey Admin!')

bot.use(broadcastMenu.bot)
bot.use(userMenu.bot)

menu.submenu('Broadcast', 'broadcast', broadcastMenu.menu)
menu.submenu('User Quicklook', 'u', userMenu.menu)

menu.manualRow(backMainButtons)
