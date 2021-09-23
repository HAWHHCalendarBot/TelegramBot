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

function stisysBody(context: MyContext): Body {
	const active = context.userconfig.mine.stisysUpdate

	let text = '*Einstellungen*\nStISys\n\n'
	text += 'Das StISys Update prüft alle 15 Minuten, ob sich etwas auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) geändert hat. Ist dies der Fall, kannst du vom Bot benachrichtigt werden.\n\n'
	text += 'Das StISys Update ist für dich aktuell ' + (active ? 'aktiv' : 'deaktiviert') + '.'

	return {text, parse_mode: 'Markdown'}
}

const stisysMenu = new MenuTemplate<MyContext>(stisysBody)
menu.submenu('StISys', 'stisys', stisysMenu)
stisysMenu.toggle('StISys Update', 'update', {
	set: (context, newState) => {
		context.userconfig.mine.stisysUpdate = newState
		return true
	},
	isSet: context => context.userconfig.mine.stisysUpdate === true,
})
stisysMenu.manualRow(backMainButtons)

menu.submenu('🍽 Mensa', 'm', mensaSettingsMenu)

menu.submenu('✏️ Anzeigeart entfernter Termine', 'showRemoved', removedStyleMenu)

menu.submenu('💾 Gespeicherte Daten über dich', 'data', dataMenu)

menu.manualRow(backMainButtons)
