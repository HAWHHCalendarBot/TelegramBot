import {Composer} from 'grammy'
import {MenuTemplate, type Body} from 'grammy-inline-menu'
import {html as format} from 'telegram-format'
import * as allEvents from '../../lib/all-events.js'
import {backMainButtons} from '../../lib/inline-menu.js'
import type {MyContext} from '../../lib/types.js'
import * as addMenu from './add.js'
import * as detailsMenu from './details.js'

async function menuBody(context: MyContext): Promise<Body> {
	let text = format.bold('Veranstaltungen')
	text += '\n\n'

	const events = Object.keys(context.userconfig.mine.events)
	events.sort()
	if (events.length > 0) {
		const nonExisting = new Set(await allEvents.nonExisting(events))
		text += 'Du hast folgende Veranstaltungen im Kalender:'
		text += '\n'
		text += events
			.map(o => {
				let line = '- '
				if (nonExisting.has(o)) {
					line += '⚠️ '
				}

				line += format.escape(o)
				return line
			})
			.join('\n')

		if (nonExisting.size > 0) {
			text += '\n\n'
			text += '⚠️ Du hast Veranstaltungen, die nicht mehr existieren.'
		}
	} else {
		text += 'Du hast aktuell keine Veranstaltungen in deinem Kalender. 😔'
	}

	text += '\n\n'
	const additionalEventsLink = format.url('AdditionalEvents', 'https://github.com/HAWHHCalendarBot/AdditionalEvents')
	text += `Du bist Tutor und deine Veranstaltung fehlt im Kalenderbot? Wirf mal einen Blick auf ${additionalEventsLink} oder schreib @EdJoPaTo an. ;)`

	return {text, parse_mode: format.parse_mode, disable_web_page_preview: true}
}

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate(menuBody)

bot.use(addMenu.bot)
bot.use(detailsMenu.bot)

menu.interact('🗑 Entferne nicht mehr Existierende', 'remove-old', {
	async hide(context) {
		const nonExisting = await allEvents.nonExisting(Object.keys(context.userconfig.mine.events))
		return nonExisting.length === 0
	},
	async do(context) {
		const nonExisting = new Set(await allEvents.nonExisting(Object.keys(context.userconfig.mine.events)))
		for (const name of nonExisting) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete context.userconfig.mine.events[name]
		}

		// Only keep changes of events the user still has
		context.userconfig.mine.changes = context.userconfig.mine.changes
			.filter(o => Object.keys(context.userconfig.mine.events).includes(o.name))

		return true
	},
})

menu.submenu('➕ Veranstaltung hinzufügen', 'a', addMenu.menu)

function getEventOptions(context: MyContext): Record<string, string> {
	const {changes} = context.userconfig.mine
	const result: Record<string, string> = {}

	for (const [name, details] of Object.entries(context.userconfig.mine.events)) {
		let title = name + ' '

		if (changes.some(o => o.name === name)) {
			title += '✏️'
		}

		if (details.alertMinutesBefore !== undefined) {
			title += '⏰'
		}

		if (details.notes) {
			title += '🗒'
		}

		result[name.replaceAll('/', ';')] = title.trim()
	}

	return result
}

menu.chooseIntoSubmenu('d', getEventOptions, detailsMenu.menu, {
	columns: 1,
	getCurrentPage: context => context.session.page,
	setPage(context, page) {
		context.session.page = page
	},
})

menu.manualRow(backMainButtons)
