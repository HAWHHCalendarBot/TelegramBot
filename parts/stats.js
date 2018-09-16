const TelegrafInlineMenu = require('telegraf-inline-menu')

const allEvents = require('../lib/all-events')
const {getCanteenList} = require('../lib/mensa-meals')

const menu = new TelegrafInlineMenu(statsText)

async function statsText(ctx) {
  const userIds = await ctx.userconfig.allIds()
  const userCount = userIds.length

  const canteenCount = (await getCanteenList()).length
  const eventCount = allEvents.count()
  const messageCount = ctx.callbackQuery.message.message_id

  let text = `Ich habe aktuell ${eventCount} Veranstaltungen und ${canteenCount} Mensen, die ich ${userCount} begeisterten Nutzern 😍 zur Verfügung stelle.`
  text += ` Mit dir habe ich schon ${messageCount} Nachrichten ausgetauscht.`

  text += '\n\nWenn ich für dich hilfreich bin, dann erzähl gern anderen von mir, denn ich will gern allen helfen, denen noch zu helfen ist. ☺️'
  text += '\n\nWenn du noch mehr über meine Funktionsweise wissen willst werfe einen Blick im Hauptmenu auf "Über den Bot"'

  return text
}

module.exports = {
  menu
}
