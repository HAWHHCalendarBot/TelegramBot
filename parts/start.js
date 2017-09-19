const Telegraf = require('telegraf')

const { Extra, Markup } = Telegraf

const bot = new Telegraf.Composer()
module.exports = bot

bot.command('start', ctx => {
  let text = `Hey ${ctx.from.first_name}!`
  text += '\n\nMit /add kannst du Veranstaltungen zu deinem Kalender hinzufügen.'

  if (ctx.state.userconfig.events.length > 0) {
    text += '\nMit /remove kannst du Veranstaltungen entfernen.'
    text += '\nMit /list kannst du die Liste deiner Veranstaltungen einsehen.'
    text += '\nUnter /subscribe findest du Tipps, wie du den Kalender immer up to date auf dein bevorzugtes Gerät bekommst.'
  }
  text += '\nMit /about kannst du mehr über diesen Bot erfahren.'
  text += '\nUnter /settings gibt es genauere Einstellungen zu deinem Kalender oder diesem Bot.'

  text += '\n'
  text += '\nDas Mensaangebot erreichst du mit /mensa.'

  ctx.reply(text)
})

bot.command('about', ctx => ctx.replyWithMarkdown('Die Funktionsweise dieses Bots wird auf [calendarbot.hawhh.de](https://calendarbot.hawhh.de) genauer beschrieben.\n\nWenn dir der Bot gefällt, dann empfehle ihn gern weiter!\n\nDu hast Probleme, Ideen oder Vorschläge, was der Bot können sollte? Dann wende dich an @EdJoPaTo oder erstelle ein Issue auf [GitHub](https://github.com/HAWHHCalendarBot/telegrambot/issues).', Extra.markup(Markup.removeKeyboard())))
