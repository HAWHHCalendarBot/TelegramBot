import {Composer} from 'telegraf'
import {html as format} from 'telegram-format'
import {MenuTemplate, replyMenuToContext, deleteMenuFromContext, Body, getMenuOfPath} from 'telegraf-inline-menu'
import {User} from 'typegram'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'

import {backMainButtons} from '../../lib/inline-menu'
import {DEFAULT_FILTER, filterButtonText} from '../../lib/inline-menu-filter'
import {getUrl} from '../../lib/calendar-helper'
import {MyContext} from '../../lib/types'

function nameOfUser({first_name, last_name, username}: User): string {
	let name = first_name
	if (last_name) {
		name += ' ' + last_name
	}

	if (username) {
		name += ` (${username})`
	}

	return name
}

async function menuBody(context: MyContext): Promise<Body> {
	if (!context.session.adminuserquicklook) {
		return 'Wähle einen Nutzer…'
	}

	const config = await context.userconfig.load(context.session.adminuserquicklook)

	let text = ''
	text += 'URL: '
	text += format.monospace('https://' + getUrl(context.session.adminuserquicklook, config!.config))
	text += '\n\n'
	text += format.monospaceBlock(JSON.stringify(config, null, 2), 'json')

	return {text, parse_mode: format.parse_mode}
}

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

menu.url('Kalender', async context => {
	const config = await context.userconfig.loadConfig(context.session.adminuserquicklook!)
	return `https://${getUrl(context.session.adminuserquicklook!, config)}`
}, {
	hide: context => !context.session.adminuserquicklook
})

const question = new TelegrafStatelessQuestion<MyContext>('admin-user-filter', async (context, path) => {
	if ('text' in context.message) {
		context.session.adminuserquicklookfilter = context.message.text
		delete context.session.adminuserquicklook
	}

	await replyMenuToContext(menu, context, path)
})

bot.use(question.middleware())

menu.interact(filterButtonText(context => context.session.adminuserquicklookfilter), 'filter', {
	do: async (context, path) => {
		await question.replyWithMarkdown(context, 'Wonach möchtest du die Nutzer filtern?', getMenuOfPath(path))
		await deleteMenuFromContext(context)
		return false
	}
})

menu.interact('Filter aufheben', 'filter-clear', {
	joinLastRow: true,
	hide: context => (context.session.adminuserquicklookfilter ?? DEFAULT_FILTER) === DEFAULT_FILTER,
	do: context => {
		delete context.session.adminuserquicklookfilter
		delete context.session.adminuserquicklook
		return true
	}
})

async function userOptions(context: MyContext): Promise<Record<number, string>> {
	const filter = context.session.adminuserquicklookfilter ?? DEFAULT_FILTER
	const filterRegex = new RegExp(filter, 'i')
	const allConfigs = await context.userconfig.all(
		config => filterRegex.test(JSON.stringify(config))
	)
	const allChats = allConfigs.map(o => o.chat)

	allChats.sort((a, b) => {
		const nameA = nameOfUser(a)
		const nameB = nameOfUser(b)
		return nameA.localeCompare(nameB)
	})

	const result: Record<number, string> = {}
	for (const chat of allChats) {
		result[chat.id] = nameOfUser(chat)
	}

	return result
}

menu.select('u', userOptions, {
	maxRows: 5,
	columns: 2,
	isSet: (context, selected) => context.session.adminuserquicklook === Number(selected),
	set: async (context, selected) => {
		context.session.adminuserquicklook = Number(selected)
		return true
	},
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})

menu.manualRow(backMainButtons)
