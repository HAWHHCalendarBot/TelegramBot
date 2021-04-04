import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {backMainButtons} from '../lib/inline-menu.js'

export const menu = new MenuTemplate(menuBody)

function menuBody(): Body {
	const text = 'Die Funktionsweise dieses Bots wird auf [calendarbot.hawhh.de](https://calendarbot.hawhh.de) genauer beschrieben.\n\nWenn dir der Bot gefällt, dann empfehle ihn gern weiter!\n\nDu hast Probleme, Ideen oder Vorschläge, was der Bot können sollte? Dann wende dich an @EdJoPaTo oder erstelle ein Issue auf [GitHub](https://github.com/HAWHHCalendarBot/telegrambot/issues).'
	return {text, parse_mode: 'Markdown'}
}

menu.manualRow(backMainButtons)
