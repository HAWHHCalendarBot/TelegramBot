import {Composer} from 'grammy'
import {getMenuOfPath, MenuTemplate, replyMenuToContext} from 'grammy-inline-menu'
import {html as format} from 'telegram-format'
import {StatelessQuestion} from '@grammyjs/stateless-question'
import type {Body} from 'grammy-inline-menu'
import type {MyContext, Userconfig} from '../lib/types.js'

async function getActualUserconfigContent(
	context: MyContext,
): Promise<Userconfig | undefined> {
	if (!context.userconfig.mine) {
		return undefined
	}

	const userconfig = await context.userconfig.load(context.from!.id)
	return userconfig?.config
}

const PRIVACY_SECTIONS = {
	telegram: 'Telegram',
	persistent: 'Persistent',
	tmp: 'Temporär',
} as const
type PrivacySection = keyof typeof PRIVACY_SECTIONS

async function menuBody(context: MyContext): Promise<Body> {
	const part = privacyInfoPart(context, context.session.privacySection ?? 'persistent')

	let text = context.t('privacy-overview')
	text += '\n\n'
	text += format.bold(part.title)
	text += '\n'
	text += part.text
	text += '\n'
	text += format.monospaceBlock(JSON.stringify(part.data, null, 1), 'json')

	return {text, parse_mode: format.parse_mode, disable_web_page_preview: true}
}

function privacyInfoPart(ctx: MyContext, section: PrivacySection) {
	const text = ctx.t('privacy-' + section)
	if (section === 'telegram') {
		return {text, title: 'Telegram User Info', data: ctx.from}
	}

	if (section === 'persistent') {
		return {text, title: 'Persistente Einstellungen im Bot', data: ctx.userconfig.mine}
	}

	return {text, title: 'Temporäre Daten des Bots', data: ctx.session}
}

const deleteConfirmString = 'Ja, ich will!'

const deleteQuestion = `Bist du dir sicher, das du deinen Kalender und alle Einstellungen löschen willst?\n\nWenn du wirklich alles löschen willst, antworte mit "${deleteConfirmString}"`

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

menu.select('section', PRIVACY_SECTIONS, {
	isSet: (ctx, key) => (ctx.session.privacySection ?? 'persistent') === key,
	set(ctx, key) {
		ctx.session.privacySection = key as PrivacySection
		return true
	},
})

menu.url('🦑 Quellcode', 'https://github.com/HAWHHCalendarBot')

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
