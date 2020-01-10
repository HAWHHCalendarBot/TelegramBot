const {existsSync, readFileSync} = require('fs')
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const TelegrafInlineMenu = require('telegraf-inline-menu')

const {Extra, Markup} = Telegraf

const hasStISysChanged = require('./lib/has-stisys-changed')
const Chatconfig = require('./lib/chatconfig')

const migrateStuff = require('./migrate-stuff')

const about = require('./parts/about')
const admin = require('./parts/admin')
const changesInline = require('./parts/changes-inline')
const easterEggs = require('./parts/easter-eggs')
const events = require('./parts/events')
const generateEventDate = require('./parts/generate-event-date')
const mensa = require('./parts/mensa')
const settings = require('./parts/settings')
const stats = require('./parts/stats')
const subscribe = require('./parts/subscribe')

const tokenFilePath = existsSync('/run/secrets') ? '/run/secrets/bot-token.txt' : 'bot-token.txt'
const token = readFileSync(tokenFilePath, 'utf8').trim()
const bot = new Telegraf(token)

// For handling group/supergroup commands (/start@your_bot) you need to provide bot username.
bot.telegram.getMe().then(botInfo => {
  bot.options.username = botInfo.username
})

if (process.env.NODE_ENV !== 'production') {
  bot.use(async (ctx, next) => {
    const identifier = `${new Date().toISOString()} ${ctx.from && ctx.from.first_name} ${ctx.updateType}`
    console.time(identifier)
    await next()
    const callbackData = ctx.callbackQuery && ctx.callbackQuery.data
    const messageText = ctx.message && ctx.message.text
    const data = callbackData || messageText
    console.timeLog(identifier, data && data.length, data)
  })
}

bot.use(session())
const chatconfig = new Chatconfig('userconfig', {
  events: []
})
bot.use(chatconfig)

bot.use(migrateStuff.bot)

bot.use(changesInline.bot)
bot.use(easterEggs.bot)
bot.use(generateEventDate.bot)

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

bot.command(ctx => ctx.reply('Den Command gibt es nicht mehr. Nutze das Hauptmenü: /start'))

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
  if (error.on && error.on.payload && error.on.payload.chat_id) {
    try {
      let text = 'Da ist wohl ein Fehler aufgetreten… Schreib mal @EdJoPaTo dazu an. Dafür findet sich sicher eine Lösung:'
      text += '\n```\n'
      text += JSON.stringify(error.description || error, null, 2)
      text += '\n```\n'
      bot.telegram.sendMessage(error.on.payload.chat_id, text, Extra.markdown())
    } catch (_) {
      console.error(new Date(), 'Error while sending error to user', error)
    }
  }

  console.error(new Date(), 'Telegraf Error', error.response, error.parameters, error.on || error, error.on && error.on.payload && error.on.payload.reply_markup && error.on.payload.reply_markup.inline_keyboard)
})

async function startup() {
  await bot.launch()
  console.log(new Date(), 'Bot started as', bot.options.username)
}

startup()
