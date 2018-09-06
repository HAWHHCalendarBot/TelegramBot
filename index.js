const fs = require('fs')
const Telegraf = require('telegraf')
const session = require('telegraf/session')

const {Extra, Markup} = Telegraf

const hasStISysChanged = require('./lib/has-stisys-changed')
const Chatconfig = require('./lib/chatconfig')

const addevents = require('./parts/addevents')
const additionalEvents = require('./parts/additional-events')
const admin = require('./parts/admin')
const changes = require('./parts/changes')
const changesInline = require('./parts/changes-inline')
const easterEggs = require('./parts/easter-eggs')
const events = require('./parts/events')
const mensa = require('./parts/mensa')
const mensaSettings = require('./parts/mensa-settings')
const settings = require('./parts/settings')
const start = require('./parts/start')
const stats = require('./parts/stats')
const subscribe = require('./parts/subscribe')

const tokenFilePath = process.env.NODE_ENV === 'production' ? process.env.npm_package_config_tokenpath : process.env.npm_package_config_tokenpathdebug
const token = fs.readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf(token)

// For handling group/supergroup commands (/start@your_bot) you need to provide bot username.
bot.telegram.getMe().then(botInfo => {
  bot.options.username = botInfo.username
})

bot.use(session())
const chatconfig = new Chatconfig('userconfig', {
  events: [],
  settings: {}
})
bot.use(chatconfig)

bot.use(easterEggs.bot)
bot.use(admin.bot)
bot.use(additionalEvents.bot)

bot.use(changes.bot)
bot.use(changesInline.bot)
bot.use(events.bot)
bot.use(mensa.bot)
bot.use(mensaSettings.bot)
bot.use(settings.bot)
bot.use(start.bot)
bot.use(stats.bot)
bot.use(subscribe.bot)

bot.use(addevents.bot)

setInterval(checkStISysChangeAndNotify, 15 * 60 * 1000)
checkStISysChangeAndNotify()

async function checkStISysChangeAndNotify() {
  const hasChanged = await hasStISysChanged()
  console.log(new Date(), 'StISys has changed:', hasChanged)
  if (!hasChanged) {
    return
  }

  const text = 'Es hat sich eine Änderung auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) ergeben.'

  chatconfig.broadcast(bot.telegram, text, Extra.markdown().markup(Markup.removeKeyboard()), user => user.config.stisysUpdate)
}

bot.catch(error => {
  console.error(new Date(), 'Telegraf Error', error.response || error)
})

bot.startPolling()
