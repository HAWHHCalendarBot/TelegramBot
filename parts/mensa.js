const Telegraf = require('telegraf')

const {generateMealText} = require('../lib/mensa-helper')
const {getMealsOfDay} = require('../lib/mensa-meals')

const {Extra, Markup} = Telegraf

function getYearMonthDay(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return {year, month, day}
}

const bot = new Telegraf.Composer()

bot.use((ctx, next) => {
  if (!ctx.state.userconfig.mensa) {
    ctx.state.userconfig.mensa = {}
  }
  return next()
})

const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
async function generateMensaTextOfDate(mensa, date, mensaSettings) {
  if (!mensa || mensa === 'undefined') {
    return '⚠️ Du hast keine Mensa gesetzt, zu der du dein Angebot bekommen möchtest. Diese kannst du in den Einstellungen setzen'
  }
  const weekday = weekdays[date.getDay()]
  const {year, month, day} = getYearMonthDay(date)
  const prefix = `Mensa *${mensa}*\n${weekday} ${day}.${month}.${year}\n`

  const meals = await getMealsOfDay(mensa, year, month, day)
  const text = generateMealText(meals, mensaSettings)
  return prefix + text
}

function dateCallbackButtonData(mensa, date) {
  const {year, month, day} = getYearMonthDay(date)

  return `m:${mensa}:${year}:${month}:${day}`
}

function generateMensaButtons(mensa, date, mensaSettings) {
  if (!mensa || mensa === 'undefined') {
    return []
  }
  const timeButtons = generateTimeButtons(mensa, date)
  const mensaButtons = generateSwitchMensaButtons(mensa, date, mensaSettings)

  const buttons = []
  buttons.push(timeButtons)
  for (const b of mensaButtons) {
    buttons.push([b])
  }
  return buttons
}

function generateSwitchMensaButtons(mensa, date, mensaSettings) {
  if (!mensa || mensa === 'undefined') {
    return []
  }
  const {year, month, day} = getYearMonthDay(date)
  const more = [...mensaSettings.more]
  more.unshift(mensaSettings.main)
  return more.map(m => Markup.callbackButton(`🍽 ${m}`, `m:${m}:${year}:${month}:${day}`, m === mensa))
}

function generateTimeButtons(mensa, date) {
  const {year, month, day} = getYearMonthDay(date)
  const currentCallbackData = `m:${mensa}:${year}:${month}:${day}`
  const today = dateCallbackButtonData(mensa, new Date(Date.now() + (1000 * 60 * 60 * 24 * 0)))
  const tomorrow = dateCallbackButtonData(mensa, new Date(Date.now() + (1000 * 60 * 60 * 24 * 1)))
  const afterTomorrow = dateCallbackButtonData(mensa, new Date(Date.now() + (1000 * 60 * 60 * 24 * 2)))

  const timeButtons = []
  timeButtons.push(Markup.callbackButton('🕚 heute', today, today === currentCallbackData))
  timeButtons.push(Markup.callbackButton('🕚 morgen', tomorrow, tomorrow === currentCallbackData))
  timeButtons.push(Markup.callbackButton('🕚 übermorgen', afterTomorrow, afterTomorrow === currentCallbackData))
  return timeButtons
}

bot.command('mensa', async ctx => {
  const date = new Date()

  const text = await generateMensaTextOfDate(ctx.state.userconfig.mensa.main, date, ctx.state.userconfig.mensa)
  const buttons = generateMensaButtons(ctx.state.userconfig.mensa.main, date, ctx.state.userconfig.mensa)

  const keyboardMarkup = Markup.inlineKeyboard(buttons)
  return ctx.replyWithMarkdown(text, Extra.markup(keyboardMarkup))
})

bot.action(/^m:([^:]+):(\d+):(\d+):(\d+)$/, async ctx => {
  const mensa = ctx.match[1]
  const year = Number(ctx.match[2])
  const month = Number(ctx.match[3])
  const day = Number(ctx.match[4])
  const date = new Date(Date.parse(`${year}-${month}-${day}`))

  const text = await generateMensaTextOfDate(mensa, date, ctx.state.userconfig.mensa)
  const buttons = generateMensaButtons(mensa, date, ctx.state.userconfig.mensa)

  const keyboardMarkup = Markup.inlineKeyboard(buttons)

  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
})

module.exports = {
  bot
}
