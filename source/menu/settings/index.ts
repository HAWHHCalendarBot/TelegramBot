import {Composer} from 'grammy'
import {MenuTemplate} from 'grammy-inline-menu'
import type {Body} from 'grammy-inline-menu'
import {backMainButtons} from '../../lib/inline-menu.js'
import type {MyContext} from '../../lib/types.js'
import {bot as dataBot, menu as dataMenu} from './data.js'
import {menu as mensaSettingsMenu} from './mensa-settings.js'
import {menu as removedStyleMenu} from './removed-style.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>({
	text: '*Einstellungen*',
	parse_mode: 'Markdown',
})

bot.use(dataBot)

function websiteStalkerBody(ctx: MyContext): Body {
	let text = '*Einstellungen*\nWebsite Stalker\n\n'
	text += ctx.t('website-stalker-help')
	return {text, parse_mode: 'Markdown'}
}

const websiteStalkerMenu = new MenuTemplate<MyContext>(websiteStalkerBody)
menu.submenu('Website Stalker', 'website-stalker', websiteStalkerMenu)
websiteStalkerMenu.url('Telegram Channel', 'https://t.me/HAWHHWebsiteStalker')
websiteStalkerMenu.url('GitHub Repository', 'https://github.com/HAWHHCalendarBot/study-website-stalker')
websiteStalkerMenu.manualRow(backMainButtons)

menu.submenu('⚙️🍽 Mensa', 'm', mensaSettingsMenu)

menu.submenu('⚙️✏️ Anzeigeart entfernter Termine', 'showRemoved', removedStyleMenu)

menu.submenu('💾 Gespeicherte Daten über dich', 'data', dataMenu)

menu.manualRow(backMainButtons)
