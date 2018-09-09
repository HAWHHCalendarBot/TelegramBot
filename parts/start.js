const Telegraf = require('telegraf')

const bot = new Telegraf.Composer()

bot.command('start', async (ctx, next) => {
  let text = `Hey ${ctx.from.first_name}!`
  text += '\n\nDies ist das Legacy Menü. Es enthält die Kommands, die noch nicht im neuen Hauptmenü vorhanden sind. Work in Progress… 😎'

  text += '\n'
  text += '\n*Kalender*'

  if (ctx.state.userconfig.events.length > 0) {
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

  await ctx.replyWithMarkdown(text)
  return next()
})

module.exports = {
  bot
}
