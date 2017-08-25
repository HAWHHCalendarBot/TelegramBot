const fs = require('fs')
const Telegraf = require('telegraf')

const { Extra, Markup } = Telegraf

const hasStISysChanged = require('./hasStISysChanged.js')
const Chatconfig = require('./lib/chatconfig.js')

const addevents = require('./parts/addevents.js').middleware()
const admin = require('./parts/admin.js').middleware()
const easterEggs = require('./parts/easterEggs.js').middleware()
const events = require('./parts/events.js').middleware()
const settings = require('./parts/settings.js').middleware()
const start = require('./parts/start.js').middleware()

const token = fs.readFileSync(process.env.npm_package_config_tokenpath, 'utf8').trim()
const bot = new Telegraf(token)

// For handling group/supergroup commands (/start@your_bot) you need to provide bot username.
bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

bot.use(Telegraf.memorySession())
const chatconfig = new Chatconfig('userconfig', {
  events: [],
  settings: {}
})
bot.use(chatconfig.middleware())

bot.use(easterEggs)
bot.use(Telegraf.optional(ctx => ctx.state.userconfig.admin, admin))

bot.use(events)
bot.use(settings)
bot.use(start)

bot.use(addevents)


setInterval(checkStISysChangeAndNotify, 15 * 60 * 1000)
checkStISysChangeAndNotify()

async function checkStISysChangeAndNotify() {
  const hasChanged = await hasStISysChanged()
  console.log(new Date(), 'StISys has changed:', hasChanged)
  if (!hasChanged) return

  const text = 'Es hat sich eine Änderung auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) ergeben.'

  chatconfig.broadcast(bot.telegram, text, Extra.markdown().markup(Markup.removeKeyboard()), user => user.config.settings.stisysUpdate)
}

bot.catch(err => {
  if (err.description === 'Bad Request: message is not modified') return
  console.error(err)
})

bot.startPolling()
