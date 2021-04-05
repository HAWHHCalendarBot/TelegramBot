import {MenuTemplate, Body} from 'telegraf-inline-menu'
import {html as format} from 'telegram-format'

import {backMainButtons} from '../lib/inline-menu.js'

export const menu = new MenuTemplate(menuBody)

function menuBody(): Body {
	const websiteLink = format.url('calendarbot.hawhh.de', 'https://calendarbot.hawhh.de')
	const githubIssues = format.url('GitHub', 'https://github.com/HAWHHCalendarBot/telegrambot/issues')

	let text = ''
	text += `Die Funktionsweise dieses Bots wird auf ${websiteLink} genauer beschrieben.`
	text += '\n\n'
	text += 'Wenn dir der Bot gefällt, dann empfehle ihn gern weiter!'
	text += '\n\n'
	text += `Du hast Probleme, Ideen oder Vorschläge, was der Bot können sollte? Dann wende dich an @EdJoPaTo oder erstelle ein Issue auf ${githubIssues}.`

	return {text, parse_mode: format.parse_mode}
}

menu.manualRow(backMainButtons)
