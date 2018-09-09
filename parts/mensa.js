const Telegraf = require('telegraf')
const TelegrafInlineMenu = require('telegraf-inline-menu')

const {generateMealText} = require('../lib/mensa-helper')
const {getMealsOfDay} = require('../lib/mensa-meals')

const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const DAY_IN_MS = 1000 * 60 * 60 * 24

function getYearMonthDay(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return {year, month, day}
}

function stringifyEqual(date, other) {
  if (!date || !other) {
    return false
  }
  if (date === other) {
    return true
  }
  return JSON.stringify(date) === JSON.stringify(other)
}

const menu = new TelegrafInlineMenu('mensa', currentMensaText)

function currentMensaText(ctx) {
  let {mensa, date} = ctx.session.mensa || {}
  if (!mensa) {
    mensa = (ctx.state.userconfig.mensa || {}).main
  }
  if (!date) {
    date = new Date(Date.now())
  }

  const now = new Date(Date.now())
  // When that date is more than a day ago, update it
  if ((now - date) > DAY_IN_MS) {
    date = new Date(Date.now())
    mensa = (ctx.state.userconfig.mensa || {}).main
  }

  const mensaSettings = ctx.state.userconfig.mensa
  return generateMensaTextOfDate(mensa, date, mensaSettings)
}

function parseActionCode(actionCode) {
  const result = actionCode.match(/^([^:]+):(\d+):(\d+):(\d+)/)
  const mensa = result[1]
  const year = Number(result[2])
  const month = Number(result[3])
  const day = Number(result[4])
  const date = new Date(Date.parse(`${year}-${month}-${day}`))
  return {mensa, date}
}

function generateActionCode(mensa, date) {
  const {year, month, day} = getYearMonthDay(date)
  return `${mensa}:${year}:${month}:${day}`
}

function setFunc(ctx, selected) {
  const {mensa, date} = parseActionCode(selected)
  if (!ctx.session.mensa) {
    ctx.session.mensa = {}
  }
  ctx.session.mensa.mensa = mensa
  ctx.session.mensa.date = date
}

function timePrefixFunc(ctx, key) {
  if (!ctx.session.mensa) {
    return ''
  }
  const {mensa, date} = parseActionCode(key)
  const isSelected = ctx.session.mensa.mensa === mensa &&
    stringifyEqual(ctx.session.mensa.date, date)

  return isSelected ? '🕚' : ''
}

function hideMensa(ctx, key) {
  if (!ctx.session.mensa) {
    return false
  }
  const {mensa} = parseActionCode(key)
  return mensa === ctx.session.mensa.mensa
}

function daySelectOptions(ctx) {
  const mensa = ((ctx.session.mensa || {}).mensa ||
        (ctx.state.userconfig.mensa || {}).main)

  const dateOptions = []
  const daysInFuture = 6

  for (let i = 0; i < daysInFuture; i++) {
    dateOptions.push(new Date(Date.now() + (DAY_IN_MS * i)))
  }

  const result = {}
  dateOptions.forEach(date => {
    const weekday = weekdays[date.getDay()]
      .slice(0, 2)
    const day = date.getDate()
    const key = generateActionCode(mensa, date)
    result[key] = `${weekday} ${day}.`
  })
  return result
}

function mensaSelectOption(ctx) {
  const date = ((ctx.session.mensa || {}).date) || new Date(Date.now())

  const {main, more} = ctx.state.userconfig.mensa
  const mensaOptions = [].concat(more || [])
  mensaOptions.unshift(main)

  const result = {}
  mensaOptions.forEach(mensa => {
    const key = generateActionCode(mensa, date)
    result[key] = '🍽 ' + mensa
  })
  return result
}

menu.select('t', daySelectOptions, setFunc, {
  columns: 3,
  prefixFunc: timePrefixFunc
})

menu.select('m', mensaSelectOption, setFunc, {
  columns: 1,
  hide: hideMensa
})

async function generateMensaTextOfDate(mensa, date, mensaSettings) {
  if (!mensa || mensa === 'undefined') {
    return '⚠️ Du hast keine Mensa gesetzt, zu der du dein Angebot bekommen möchtest. Diese kannst du in den Einstellungen setzen.'
  }
  const weekday = weekdays[date.getDay()]
  const {year, month, day} = getYearMonthDay(date)
  const prefix = `Mensa *${mensa}*\n${weekday} ${day}.${month}.${year}\n`

  const meals = await getMealsOfDay(mensa, year, month, day)
  const text = generateMealText(meals, mensaSettings)
  return prefix + text
}

const bot = new Telegraf.Composer()
bot.command('mensa', ctx => menu.replyMenuNow(ctx))

module.exports = {
  bot,
  menu
}
