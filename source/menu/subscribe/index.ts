import {Composer} from 'telegraf'
import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {backMainButtons} from '../../lib/inline-menu'
import {getUrlFromContext} from '../../lib/calendar-helper'
import {MyContext} from '../../lib/types'

import * as suffixMenu from './suffix'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>(menuBody)

bot.use(suffixMenu.bot)

const appleMenu = new MenuTemplate<MyContext>(appleBody)
appleMenu.url('Kalender abonnieren', context => `https://calendarbot.hawhh.de/ics.html?url=${getUrlFromContext(context)}`)
appleMenu.manualRow(backMainButtons)
menu.submenu('🍏 iOS / macOS', 'apple', appleMenu)

const exchangeMenu = new MenuTemplate(exchangeBody)
exchangeMenu.url('HAW Mailer', 'https://www.haw-hamburg.de/online-services/haw-mailer.html')
exchangeMenu.url('HAW Anleitung Einrichten des HAW-Mailers auf Android, iOS und Co.', 'https://www.haw-hamburg.de/online-services/haw-mailer/faqs.html#c73012')
exchangeMenu.manualRow(backMainButtons)
menu.submenu('🗂 HAW Mailer (Exchange)', 'exchange', exchangeMenu)

const googleMenu = new MenuTemplate(googleBody)
menu.submenu('🍰 Google Kalender', 'google', googleMenu)
googleMenu.url('Google Calendar', 'https://calendar.google.com/')
googleMenu.url('Google Sync Settings', 'https://www.google.com/calendar/syncselect')
googleMenu.navigate('abonnieren mit dem HAW-Mailer (Exchange)', '../exchange/')
googleMenu.manualRow(backMainButtons)

const freestyleMenu = new MenuTemplate(freestyleBody)
freestyleMenu.url('Kalender abonnieren', context => `https://calendarbot.hawhh.de/ics.html?url=${getUrlFromContext(context)}`)
freestyleMenu.manualRow(backMainButtons)
menu.submenu('Freestyle 😎', 'freestyle', freestyleMenu)

function menuBody(): Body {
	let text = '*Kalender abonnieren*'
	text += '\nBitte wähle die Art aus, mit der du den Kalender abonnieren willst.\n\nIch empfehle über iOS / macOS Boardmittel oder über den HAW-Mailer.'

	return {text, parse_mode: 'Markdown'}
}

menu.submenu('⚙️ URL Privacy', 'suffix', suffixMenu.menu)

menu.manualRow(backMainButtons)

function appleBody(): Body {
	let text = '*Kalender abonnieren mit iOS / macOS*'
	text += '\nAuf den ersten Button klicken und die URL in Safari öffnen. Auf der nun geöffneten Website auf das Kalender Icon klicken und bestätigen. Done.'
	return {text, parse_mode: 'Markdown'}
}

function exchangeBody(context: MyContext): Body {
	let text = '*Kalender abonnieren mit dem HAW-Mailer*'
	text += '\nIm [HAW-Mailer](https://www.haw-hamburg.de/online-services/haw-mailer.html) unten links auf die Kalender Ansicht wechseln. Dann in der Menüleiste oben links das Drop Down Menü von "Freigeben" öffnen und "Kalender werden hinzugefügt…" auswählen. (Wer zum Henker hat das übersetzt?! Englisch: "Share" → "Add Calendar…")'
	text += '\n'
	text += '\nIm aufgehenden Fenster in das untere Textfeld "Kalender aus dem Internet" die folgende URL einfügen und danach bestätigen.'
	text += `\nhttps://${getUrlFromContext(context)}`
	text += '\n'
	text += '\nDer Kalender wird nun alle paar Stunden vom HAW-Mailer aktualisiert. Wenn du dein Handy mit dem HAW-Mailer synchronisierst, ist der Kalender nun ebenfalls enthalten. Funktioniert mit iOS und Android sehr entspannt und du hast gleich deine HAW E-Mails mit dabei. (Windows Phone Tester hab ich noch keine gefunden 😜)'
	text += '\n'
	text += `\nDer Name des Kalenders (\`${context.from!.id}\`) ist übrigens deine Telegram Nutzer ID, mit der dich Bots zuordnen 😉. Ohne das du jedoch einen Bot zuerst anschreibst, können Bots dich aber nicht anschreiben, also keine Angst vor Bot-Spam. Fühl dich frei den Kalender für dich umzubennen.`
	return {text, parse_mode: 'Markdown'}
}

function googleBody(context: MyContext): Body {
	let text = '*Kalender abonnieren mit dem Google Kalender*'
	text += '\n⚠️ Der Google Kalender ist manchmal etwas… anstrengend. Erklärung unten.'
	text += '\n🔅 Alternativvorschlag: Kannst du vielleicht auch über den HAW-Mailer synchronisieren? Dann hast du auch gleich deine HAW E-Mails ;)'

	text += '\n'
	text += '\nIn der linken Seitenleiste im [Google Kalender](https://calendar.google.com/) gibt es den Eintrag "Weitere Kalender". Dort auf das kleine Dropdown Dreieck klicken und den Menüpunkt "Über URL hinzufügen" auswählen. Hier muss die folgende URL hinein kopiert werden.'
	text += `\nhttps://${getUrlFromContext(context)}`
	text += '\nNach dem Bestätigen einen Moment warten, bis der Kalender im Google Kalender erschienen ist.'

	text += '\n'
	text += `\nWenn dein Kalender nun "@HAWHHCalendarBot (${context.from!.first_name})" heißt, wie er eigentlich heißen soll, bist du ein glücklicher Sonderfall Googles und du bist fertig.`
	text += '\nWenn dein Kalender jedoch den Namen der URL trägt, muss der Kalender umbenannt werden, damit er auf Android Geräte synchronisiert wird. (Google 🙄) Verwende einen einfachen Namen dafür, den Google nicht überfordernd findet.'
	text += '\nFun Fact: Auf iOS Geräte wird der Google Kalender immer fehlerfrei synchronisiert, egal wie er heißt.'

	text += '\n'
	text += '\n⚠️ In der Vergangenheit hat der Google Kalender jeweils zwischen 30 Minuten und 40 Stunden gebraucht, um einen Kalender zu aktualisieren. Außerdem cacht Google (meiner Meinung nach) ein wenig zu viel, was für teilweise interessantes/sonderbares Verhalten gesorgt hat.'
	return {text, parse_mode: 'Markdown'}
}

function freestyleBody(context: MyContext): Body {
	let text = '*Kalender abonnieren Freestyle Edition* 😎'
	text += '\nWenn dein Kalender Standards unterstützt, benutz den ersten Button an dieser Nachricht und öffne die Website. Klicke auf das Kalender Icon. Der Browser fragt dich nun, mit welchem Tool er den webcal:// Link öffnen soll. Wähle dein Kalenderprogramm.'

	text += '\n'
	text += '\nWenn das nicht funktioniert, finde einen Weg die folgende URL zu abonnieren. Achte dabei darauf, das du nicht importierst, sondern abonnierst. Nur dann aktualisiert sich der Kalender selbstständig bei Änderungen im Bot.'
	text += `\nhttps://${getUrlFromContext(context)}`

	text += '\n'
	text += '\nViel Erfolg 😎'
	return {text, parse_mode: 'Markdown'}
}
