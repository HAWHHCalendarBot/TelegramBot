const fs = require('fs')
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const TelegrafInlineMenu = require('telegraf-inline-menu')

const {Extra, Markup} = Telegraf

const hasStISysChanged = require('./lib/has-stisys-changed')
const Chatconfig = require('./lib/chatconfig')

const migrateStuff = require('./migrate-stuff')

const about = require('./parts/about')
const additionalEvents = require('./parts/additional-events')
const admin = require('./parts/admin')
const changes = require('./parts/changes')
const changesInline = require('./parts/changes-inline')
const easterEggs = require('./parts/easter-eggs')
const events = require('./parts/events')
const generateEventDate = require('./parts/generate-event-date')
const mensa = require('./parts/mensa')
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
  events: []
})
bot.use(chatconfig)

bot.use(migrateStuff.bot)

bot.use(additionalEvents.bot)
bot.use(changes.bot)
bot.use(changesInline.bot)
bot.use(easterEggs.bot)
bot.use(generateEventDate.bot)
bot.use(start.bot)

const menu = new TelegrafInlineMenu(ctx => `Hey ${ctx.from.first_name}!`)

menu.submenu('🏢 Veranstaltungen', 'e', events.menu)
menu.submenu('📲 Kalender abonnieren', 'url', subscribe.menu, {
  hide: ctx => (ctx.state.userconfig.events || []).length === 0
})

menu.submenu('🍽 Mensa', 'mensa', mensa.menu)

menu.submenu('😇 Admin Area', 'admin', admin.menu, {
  hide: admin.hide
})

menu.submenu('⚙️ Einstellungen', 's', settings.menu)

menu.submenu('📈 Statistiken', 'stats', stats.menu)
menu.submenu('ℹ️ Über den Bot', 'about', about.menu, {joinLastRow: true})

menu.setCommand('start')

bot.use(menu.init({
  backButtonText: '🔙 zurück…',
  mainMenuButtonText: '🔝 zum Hauptmenü'
}))

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
  console.error(new Date(), 'Telegraf Error', error.response || error, error.on)
})

bot.startPolling()
