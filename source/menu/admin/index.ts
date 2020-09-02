import TelegrafInlineMenu from 'telegraf-inline-menu'

import {MyContext} from '../../lib/types'

import {menu as broadcastMenu} from './broadcast'
import {menu as userMenu} from './user-quicklook'

export function hide(ctx: MyContext) {
	return !ctx.state.userconfig.admin
}

export const menu = new TelegrafInlineMenu('Hey Admin!')

menu.submenu('Broadcast', 'broadcast', broadcastMenu)
menu.submenu('User Quicklook', 'u', userMenu)
