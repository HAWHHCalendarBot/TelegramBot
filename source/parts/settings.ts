import TelegrafInlineMenu from 'telegraf-inline-menu'

import {MyContext, Userconfig} from '../lib/types'

import {menu as mensaSettingsMenu} from './mensa-settings'

export const menu = new TelegrafInlineMenu('*Einstellungen*')

menu.setCommand('settings')

function stisysText(context: MyContext): string {
	const active = context.state.userconfig.stisysUpdate

	let text = '*Einstellungen*\nStISys\n\n'
	text += 'Das StISys Update prüft alle 15 Minuten, ob sich etwas auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) geändert hat. Ist dies der Fall, kannst du vom Bot benachrichtigt werden.\n\n'
	text += 'Das StISys Update ist für dich aktuell ' + (active ? 'aktiv' : 'deaktiviert') + '.'

	return text
}

menu.submenu('StISys', 'stisys', new TelegrafInlineMenu(stisysText as any))
	.toggle('StISys Update', 'update', {
		setFunc: (ctx, newState) => {
			(ctx as MyContext).state.userconfig.stisysUpdate = newState
		},
		isSetFunc: ctx => (ctx as MyContext).state.userconfig.stisysUpdate === true
	})

menu.submenu('🍽 Mensa', 'm', mensaSettingsMenu)

async function getActualUserconfigContent(context: MyContext): Promise<Userconfig | undefined> {
	if (!context.state.userconfig) {
		return undefined
	}

	const userconfig = await context.userconfig.load(context.from!.id)
	return userconfig?.config
}

async function dataText(context: MyContext): Promise<string> {
	let infotext = ''

	infotext += '\nAuf dem Server wird geloggt, wenn Aktionen von Nutzern zu einem neu Bauen von Kalendern oder ungewollten Fehlern führen. Diese Logs werden nicht persistent gespeichert und sind nur bis zum Neustart des Servers verfügbar.'
	infotext += '\nDer Quellcode dieses Bots ist auf [GitHub](https://github.com/HAWHHCalendarBot) verfügbar.'
	infotext += '\n'

	const userconfig = await getActualUserconfigContent(context)
	if (userconfig) {
		infotext += '\nDie folgenden Daten werden auf dem Server über dich gespeichert. Wenn du alle Daten über dich löschen lassen möchtest, wähle "Alles löschen".'
	} else {
		infotext += '\nAktuell speichert der Server keine Daten zu dir.'
	}

	const user = context.from
	let dataText = '*Telegram User Info*'
	dataText += '\nJeder Telegram Bot kann diese User Infos abrufen, wenn du mit ihm interagierst.'
	dataText += ' Um dies zu verhindern, blockiere den Bot.'
	dataText += '\n```\n' + JSON.stringify(user, null, 2) + '\n```'

	if (userconfig) {
		dataText += '\n*Einstellungen im Bot*\n```\n' + JSON.stringify(userconfig, null, 2) + '\n```'
	}

	return infotext + '\n\n' + dataText
}

const deleteConfirmString = 'Ja, ich will!'

const deleteQuestion = `Bist du dir sicher, das du deinen Kalender und alle Einstellungen löschen willst?\n\nWenn du wirklich alles löschen willst, antworte mit "${deleteConfirmString}"`

async function deleteEverything(context: MyContext, answer: string): Promise<void> {
	if (answer !== deleteConfirmString) {
		await context.reply('Du hast mir aber einen Schrecken eingejagt! 🙀')
		return
	}

	// @ts-expect-error
	delete context.state.userconfig
	await context.reply('Deine Daten werden gelöscht…')
}

menu.submenu('💾 Gespeicherte Daten über dich', 'data', new TelegrafInlineMenu(dataText as any))
	.setCommand('stop')
	.question('⚠️ Alles löschen ⚠️', 'delete-all', {
		setFunc: deleteEverything as any,
		hide: async ctx => !(await getActualUserconfigContent(ctx as MyContext)),
		uniqueIdentifier: 'delete-everything',
		questionText: deleteQuestion
	})
