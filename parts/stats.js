const Telegraf = require('telegraf')

const allEvents = require('../lib/all-events')

const bot = new Telegraf.Composer()

bot.command('stats', async ctx => {
  const userIds = await ctx.userconfig.allIds()
  const userCount = userIds.length
  const eventCount = allEvents.count()

  let text = `Ich habe aktuell ${eventCount} Veranstaltungen, die ich ${userCount} begeisterten Nutzern 😍 zur Verfügung stelle. Die letzte Nachricht habe ich gerade eben von dir erhalten.`
  text += '\nWenn ich für dich hilfreich bin, dann erzähl gern anderen von mir, denn ich will gern allen helfen, denen noch zu helfen ist. ☺️'
  text += '\n\nWenn du noch mehr über meine Funktionsweise wissen willst: /about'

  return ctx.replyWithMarkdown(text)
})
