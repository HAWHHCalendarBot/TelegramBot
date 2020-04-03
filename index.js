const {existsSync, readFileSync} = require('fs')
const Telegraf = require('telegraf')
const session = require('telegraf/session')
const TelegrafInlineMenu = require('telegraf-inline-menu')
const {generateUpdateMiddleware} = require('telegraf-middleware-console-time')

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
  bot.use(generateUpdateMiddleware())
}

bot.use(async (ctx, next) => {
  try {
    if (next) {
      await next()
    }
  } catch (error) {
    if (error.message.includes('Too Many Requests')) {
      console.warn('Telegraf Too Many Requests error. Skip.', error)
      return
    }

    console.error('try to send error to user', ctx.update, error, error && error.on && error.on.payload)
    let text = '🔥 Da ist wohl ein Fehler aufgetreten…'
    text += '\n'
    text += 'Schreib mal @EdJoPaTo dazu an oder erstell ein [Issue auf GitHub](https://github.com/HAWHHCalendarBot/TelegramBot/issues). Dafür findet sich sicher eine Lösung. ☺️'

    text += '\n'
    text += '\nError: `'
    text += error.message
      .replace(token, '')
    text += '`'

    const target = (ctx.chat || ctx.from).id
    await ctx.telegram.sendMessage(target, text, Extra.markdown().webPreview(false))
  }
})

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
  try {
    const hasChanged = await hasStISysChanged()
    if (!hasChanged) {
      return
    }

    const text = 'Es hat sich eine Änderung auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) ergeben.'

    await chatconfig.broadcast(bot.telegram, text, Extra.markdown().markup(Markup.removeKeyboard()), user => user.config.stisysUpdate)
  } catch (error) {
    console.error('checkStISysChangeAndNotify failed', error)
  }
}

bot.catch(error => {
  // Should not occur as the error middleware is in place
  console.error('Telegraf Error', error)
})

async function startup() {
  await bot.launch()
  console.log(new Date(), 'Bot started as', bot.options.username)
}

startup()
