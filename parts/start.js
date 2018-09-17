const Telegraf = require('telegraf')

const bot = new Telegraf.Composer()

bot.command('start', async (ctx, next) => {
  let intro = `Hey ${ctx.from.first_name}!`
  intro += '\n\n⚠️ Dies ist das Legacy Menü. Es enthält die Kommands, die noch nicht im neuen Hauptmenü vorhanden sind. Work in Progress… 😎'

  let text = ''
  const additionalEvents = ctx.state.userconfig.additionalEvents || []
  if (additionalEvents.length > 0) {
    text += '\n'
    text += '\n*Deine Veranstaltungen*'
    text += '\nAls Veranstalter kannst du mit /additionalEvents deine Termine in den Veranstaltungen verwalten.'
    text += ' Bei Fragen oder Problemen (das Feature ist sehr spartanisch) gern @EdJoPaTo anschreiben.'
  }

  if (text.length > 0) {
    await ctx.replyWithMarkdown(intro + text)
  }
  return next()
})

module.exports = {
  bot
}
