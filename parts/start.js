const Telegraf = require('telegraf')

const bot = new Telegraf.Composer()

bot.command('start', ctx => {
  let text = `Hey ${ctx.from.first_name}!`

  text += '\n'
  text += '\n*Kalender*'
  text += '\nMit /add kannst du Veranstaltungen zu deinem Kalender hinzufügen.'

  if (ctx.state.userconfig.events.length > 0) {
    text += '\nMit /remove kannst du Veranstaltungen entfernen.'
    text += '\nMit /list kannst du die Liste deiner Veranstaltungen einsehen.'
    text += '\nUnter /subscribe findest du Tipps, wie du den Kalender immer up to date auf dein bevorzugtes Gerät bekommst.'
    text += '\nMit /changes kannst du Änderungen an einem Veranstaltungskalender erstellen, die in deinen Kalender synchronisiert werden.'
  }

  const additionalEvents = ctx.state.userconfig.additionalEvents || []
  if (additionalEvents.length > 0) {
    text += '\n'
    text += '\n*Deine Veranstaltungen*'
    text += '\nAls Veranstalter kannst du mit /additionalEvents deine Termine in den Veranstaltungen verwalten.'
    text += ' Bei Fragen oder Problemen (das Feature ist sehr spartanisch) gern @EdJoPaTo anschreiben.'
  }

  text += '\n'
  text += '\n*Mensa*'
  text += '\nDas Mensaangebot erreichst du mit /mensa.'

  text += '\n'
  text += '\n*Sonstiges*'
  text += '\nMit /about kannst du mehr über diesen Bot erfahren.'
  text += '\nUnter /settings gibt es Einstellungen dieses Bots.'

  ctx.replyWithMarkdown(text)
})

module.exports = {
  bot
}
