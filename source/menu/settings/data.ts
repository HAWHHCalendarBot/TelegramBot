import {Composer} from 'telegraf'
import {MenuTemplate, Body, replyMenuToContext} from 'telegraf-inline-menu'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'
import {html as format} from 'telegram-format'

import {backMainButtons} from '../../lib/inline-menu'
import {MyContext, Userconfig} from '../../lib/types'

async function getActualUserconfigContent(context: MyContext): Promise<Userconfig | undefined> {
	if (!context.state.userconfig) {
		return undefined
	}

	const userconfig = await context.userconfig.load(context.from!.id)
	return userconfig?.config
}

async function menuBody(context: MyContext): Promise<Body> {
	const github = format.url('GitHub', 'https://github.com/HAWHHCalendarBot')

	let infotext = ''

	infotext += '\nAuf dem Server wird geloggt, wenn Aktionen von Nutzern zu einem neu Bauen von Kalendern oder ungewollten Fehlern führen. Diese Logs werden nicht persistent gespeichert und sind nur bis zum Neustart des Servers verfügbar.'
	infotext += `\nDer Quellcode dieses Bots ist auf ${github} verfügbar.`
	infotext += '\n'

	const userconfig = await getActualUserconfigContent(context)
	if (userconfig) {
		infotext += '\nDie folgenden Daten werden auf dem Server über dich gespeichert. Wenn du alle Daten über dich löschen lassen möchtest, wähle "Alles löschen".'
	} else {
		infotext += '\nAktuell speichert der Server keine Daten zu dir.'
	}

	const user = context.from
	let dataText = format.bold('Telegram User Info')
	dataText += '\nJeder Telegram Bot kann diese User Infos abrufen, wenn du mit ihm interagierst.'
	dataText += ' Um dies zu verhindern, blockiere den Bot.'
	dataText += '\n'
	dataText += format.monospaceBlock(JSON.stringify(user, null, 2), 'json')

	if (userconfig) {
		dataText += '\n\n'
		dataText += format.bold('Einstellungen im Bot')
		dataText += '\n'
		dataText += format.monospaceBlock(JSON.stringify(userconfig, null, 2), 'json')
	}

	const text = infotext + '\n\n' + dataText

	return {text, parse_mode: format.parse_mode}
}

const deleteConfirmString = 'Ja, ich will!'

const deleteQuestion = `Bist du dir sicher, das du deinen Kalender und alle Einstellungen löschen willst?\n\nWenn du wirklich alles löschen willst, antworte mit "${deleteConfirmString}"`

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

const deleteAllQuestion = new TelegrafStatelessQuestion<MyContext>('delete-everything', async context => {
	const answer = context.message.text
	if (answer !== deleteConfirmString) {
		await context.reply('Du hast mir aber einen Schrecken eingejagt! 🙀')
		await replyMenuToContext(menu, context, '/settings/data/')
		return
	}

	// @ts-expect-error
	delete context.state.userconfig
	await context.reply('Deine Daten werden gelöscht…')
})

menu.interact('⚠️ Alles löschen ⚠️', 'delete-all', {
	hide: async context => !(await getActualUserconfigContent(context)),
	do: async context => {
		await deleteAllQuestion.replyWithMarkdown(context, deleteQuestion)
		return false
	}
})

menu.manualRow(backMainButtons)

bot.use(deleteAllQuestion.middleware())
