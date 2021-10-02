import {Composer} from 'grammy'
import {MenuTemplate, Body} from 'grammy-inline-menu'

import {backMainButtons} from '../../lib/inline-menu.js'
import {MyContext} from '../../lib/types.js'

import {menu as dataMenu, bot as dataBot} from './data.js'
import {menu as mensaSettingsMenu} from './mensa-settings.js'
import {menu as removedStyleMenu} from './removed-style.js'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>({text: '*Einstellungen*', parse_mode: 'Markdown'})

bot.use(dataBot)

function websiteStalkerBody(ctx: MyContext): Body {
	const active = Boolean(ctx.userconfig.mine.websiteStalkerUpdate)

	let text = '*Einstellungen*\nWebsite Stalker\n\n'
	text += ctx.i18n.t('website-stalker.help').trim()
	text += '\n\n'
	text += 'Das Benachrichtigen durch den Bot ist für dich aktuell ' + (active ? 'aktiviert' : 'deaktiviert') + '.'

	return {text, parse_mode: 'Markdown'}
}

const websiteStalkerMenu = new MenuTemplate<MyContext>(websiteStalkerBody)
menu.submenu('Website Stalker', 'website-stalker', websiteStalkerMenu)
websiteStalkerMenu.toggle('Benachrichtigungen', 'alerts', {
	set: (ctx, newState) => {
		if (newState) {
			ctx.userconfig.mine.websiteStalkerUpdate = true
		} else {
			delete ctx.userconfig.mine.websiteStalkerUpdate
		}

		return true
	},
	isSet: ctx => Boolean(ctx.userconfig.mine.websiteStalkerUpdate),
})
websiteStalkerMenu.url('GitHub Repository', 'https://github.com/HAWHHCalendarBot/study-website-stalker')
websiteStalkerMenu.manualRow(backMainButtons)

menu.submenu('🍽 Mensa', 'm', mensaSettingsMenu)

menu.submenu('✏️ Anzeigeart entfernter Termine', 'showRemoved', removedStyleMenu)

menu.submenu('💾 Gespeicherte Daten über dich', 'data', dataMenu)

menu.manualRow(backMainButtons)
