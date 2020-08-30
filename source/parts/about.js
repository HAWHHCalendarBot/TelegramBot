const TelegrafInlineMenu = require('telegraf-inline-menu')

const menu = new TelegrafInlineMenu(aboutText)

function aboutText() {
  return 'Die Funktionsweise dieses Bots wird auf [calendarbot.hawhh.de](https://calendarbot.hawhh.de) genauer beschrieben.\n\nWenn dir der Bot gefällt, dann empfehle ihn gern weiter!\n\nDu hast Probleme, Ideen oder Vorschläge, was der Bot können sollte? Dann wende dich an @EdJoPaTo oder erstelle ein Issue auf [GitHub](https://github.com/HAWHHCalendarBot/telegrambot/issues).'
}

module.exports = {
  menu
}
