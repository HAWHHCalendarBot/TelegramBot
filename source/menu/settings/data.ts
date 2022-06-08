import {Composer} from 'grammy'
import {MenuTemplate, Body, replyMenuToContext, getMenuOfPath} from 'grammy-inline-menu'
import {StatelessQuestion} from '@grammyjs/stateless-question'
import {html as format} from 'telegram-format'

import {backMainButtons} from '../../lib/inline-menu.js'
import {MyContext, Userconfig} from '../../lib/types.js'

async function getActualUserconfigContent(context: MyContext): Promise<Userconfig | undefined> {
	if (!context.userconfig.mine) {
		return undefined
	}

	const userconfig = await context.userconfig.load(context.from!.id)
	return userconfig?.config
}

async function menuBody(context: MyContext): Promise<Body> {
	const github = format.url('GitHub', 'https://github.com/HAWHHCalendarBot')

	let text = ''

	text += '\nAuf dem Server wird geloggt, wenn Aktionen von Nutzern zu einem neu Bauen von Kalendern oder ungewollten Fehlern führen. Diese Logs werden nicht persistent gespeichert und sind nur bis zum Neustart des Servers verfügbar.'
	text += `\nDer Quellcode dieses Bots ist auf ${github} verfügbar.`
	text += '\n'
	text += '\nDie folgenden Daten werden auf dem Server über dich gespeichert. Wenn du alle Daten über dich löschen lassen möchtest, wähle "Alles löschen".'

	text += '\n\n'
	text += format.bold('Telegram User Info')
	text += '\n'
	text += 'Jeder Telegram Bot kann diese User Infos abrufen, wenn du mit ihm interagierst.'
	text += ' Um dies zu verhindern, blockiere den Bot.'
	text += '\n'
	text += format.monospaceBlock(JSON.stringify(context.from, null, 2), 'json')

	text += '\n\n'
	text += format.bold('Persistente Einstellungen im Bot')
	text += '\n'
	text +=	'Damit dein Kalender generiert oder deine Mensa Einstellungen gespeichert werden können, werden einige Daten persistent auf dem Server hinterlegt.'
	text += '\n'
	text += format.monospaceBlock(JSON.stringify(context.userconfig.mine, null, 2), 'json')

	text += '\n\n'
	text += format.bold('Temporäre Daten des Bots')
	text += '\n'
	text += 'Diese Daten werden nur temporär gehalten und sind nur bis zum Neustart des Servers im RAM hinterlegt.'
	text += '\n'
	text += format.monospaceBlock(JSON.stringify(context.session, null, 2), 'json')

	return {text, parse_mode: format.parse_mode}
}

const deleteConfirmString = 'Ja, ich will!'

const deleteQuestion = `Bist du dir sicher, das du deinen Kalender und alle Einstellungen löschen willst?\n\nWenn du wirklich alles löschen willst, antworte mit "${deleteConfirmString}"`

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

const deleteAllQuestion = new StatelessQuestion<MyContext>('delete-everything', async (context, path) => {
	if ('text' in context.message && context.message.text === deleteConfirmString) {
		// @ts-expect-error delete readonly
		delete context.userconfig.mine
		context.session = undefined
		await context.reply('Deine Daten werden gelöscht…')
	} else {
		await context.reply('Du hast mir aber einen Schrecken eingejagt! 🙀')
		await replyMenuToContext(menu, context, path)
	}
})

bot.use(deleteAllQuestion.middleware())

menu.interact('⚠️ Alles löschen ⚠️', 'delete-all', {
	hide: async context => !(await getActualUserconfigContent(context)),
	async do(context, path) {
		await deleteAllQuestion.replyWithMarkdown(context, deleteQuestion, getMenuOfPath(path))
		return false
	},
})

menu.manualRow(backMainButtons)
