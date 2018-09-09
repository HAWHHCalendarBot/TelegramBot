const TelegrafInlineMenu = require('telegraf-inline-menu')

const allEvents = require('../lib/all-events')

const menu = new TelegrafInlineMenu('stats', statsText)

async function statsText(ctx) {
  const userIds = await ctx.userconfig.allIds()
  const userCount = userIds.length
  const eventCount = allEvents.count()

  let text = `Ich habe aktuell ${eventCount} Veranstaltungen, die ich ${userCount} begeisterten Nutzern 😍 zur Verfügung stelle. Die letzte Nachricht habe ich gerade eben von dir erhalten.`
  text += '\nWenn ich für dich hilfreich bin, dann erzähl gern anderen von mir, denn ich will gern allen helfen, denen noch zu helfen ist. ☺️'
  text += '\n\nWenn du noch mehr über meine Funktionsweise wissen willst werfe einen Blick im Hauptmenu auf "Über den Bot"'

  return text
}

module.exports = {
  menu
}
