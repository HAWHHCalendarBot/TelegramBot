const Telegraf = require('telegraf')

const bot = new Telegraf.Composer()

bot.command('list', ctx => {
  const eventList = ctx.state.userconfig.events
    .concat(ctx.state.userconfig.additionalEvents || [])
  let events = 'Du hast aktuell folgende *Veranstaltungen* in deinem Kalender:\n' + ctx.state.userconfig.events.map(s => '- ' + s).join('\n')
  if ((ctx.state.userconfig.additionalEvents || []).length > 0) {
    events += '\n\nAußerdem bist du Veranstalter:\n' + ctx.state.userconfig.additionalEvents.map(s => '- ' + s).join('\n')
  }
  const noEvents = 'Du hast aktuell keine Veranstaltungen in deinem Kalender. 😔'

  let text
  let hint = '\n\nNutze /add um Veranstaltungen hinzuzufügen'

  if (eventList.length === 0) {
    text = noEvents
    hint += '.'
  } else {
    text = events
    hint += ' oder /remove um Veranstaltungen aus deinem Kalender zu entfernen.'
    hint += ' Mit /subscribe bekommst du deinen Kalender auf dein bevorzugtes Gerät.'
  }
  return ctx.replyWithMarkdown(text + hint)
})

module.exports = {
  bot
}
