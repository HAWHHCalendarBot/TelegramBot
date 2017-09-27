const fs = require('fs')
const Telegraf = require('telegraf')

const { Extra, Markup } = Telegraf

const hasStISysChanged = require('./lib/hasStISysChanged')
const Chatconfig = require('./lib/chatconfig')

const addevents = require('./parts/addevents')
const additionalEvents = require('./parts/additionalEvents')
const admin = require('./parts/admin')
const changes = require('./parts/changes')
const easterEggs = require('./parts/easterEggs')
const events = require('./parts/events')
const mensa = require('./parts/mensa')
const settings = require('./parts/settings')
const start = require('./parts/start')
const subscribe = require('./parts/subscribe')

const tokenFilePath = process.env.NODE_ENV === 'production' ? process.env.npm_package_config_tokenpath : process.env.npm_package_config_tokenpathdebug
const token = fs.readFileSync(tokenFilePath, 'utf8').trim()
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
bot.use(chatconfig)

bot.use(easterEggs)
bot.use(Telegraf.optional(ctx => ctx.state.userconfig.admin, admin))
bot.use(Telegraf.optional(ctx => (ctx.state.userconfig.additionalEvents || []).length > 0, additionalEvents))

bot.use(changes)
bot.use(events)
bot.use(mensa)
bot.use(settings)
bot.use(start)
bot.use(subscribe)

bot.use(addevents)


setInterval(checkStISysChangeAndNotify, 15 * 60 * 1000)
checkStISysChangeAndNotify()

async function checkStISysChangeAndNotify() {
  const hasChanged = await hasStISysChanged()
  console.log(new Date(), 'StISys has changed:', hasChanged)
  if (!hasChanged) return

  const text = 'Es hat sich eine Änderung auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) ergeben.'

  chatconfig.broadcast(bot.telegram, text, Extra.markdown().markup(Markup.removeKeyboard()), user => user.config.stisysUpdate)
}

bot.catch(err => {
  console.error('Telegraf Error', err.response || err)
})

bot.startPolling()
