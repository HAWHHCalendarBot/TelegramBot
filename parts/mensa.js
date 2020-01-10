const TelegrafInlineMenu = require('telegraf-inline-menu')

const {generateMealText} = require('../lib/mensa-helper')
const {getMealsOfDay} = require('../lib/mensa-meals')
const mensaGit = require('../lib/mensa-git')

const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const DAY_IN_MS = 1000 * 60 * 60 * 24

setInterval(async () => mensaGit.pull(), 1000 * 60 * 30) // Every 30 minutes
mensaGit.pull()

function getYearMonthDay(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return {year, month, day}
}

function stringifyEqual(first, second) {
  if (!first || !second) {
    return false
  }

  if (first === second) {
    return true
  }

  return JSON.stringify(first) === JSON.stringify(second)
}

function dateEqual(first, second) {
  return stringifyEqual(getYearMonthDay(first), getYearMonthDay(second))
}

const menu = new TelegrafInlineMenu(currentMensaText)

menu.setCommand('mensa')

function getCurrentSettings(ctx) {
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

  return {mensa, date}
}

function currentMensaText(ctx) {
  const {mensa, date} = getCurrentSettings(ctx)
  const mensaSettings = ctx.state.userconfig.mensa
  return generateMensaTextOfDate(mensa, date, mensaSettings)
}

function parseActionCode(actionCode) {
  const result = actionCode.match(/^([^:]+)#(\d+-\d+-\d+)/)
  const mensa = result[1]
  const date = new Date(Date.parse(result[2]))
  return {mensa, date}
}

function generateActionCode(mensa, date) {
  const {year, month, day} = getYearMonthDay(date)
  return `${mensa}#${year}-${month}-${day}`
}

function setMensaDay(ctx, selected) {
  const {mensa, date} = parseActionCode(selected)
  if (!ctx.session.mensa) {
    ctx.session.mensa = {}
  }

  if (mensa === 'undefined') {
    return
  }

  ctx.session.mensa.mensa = mensa
  ctx.session.mensa.date = date
}

function timePrefixFunc(ctx, key) {
  const action = parseActionCode(key)
  const selected = getCurrentSettings(ctx)
  const mensaSelected = action.mensa === selected.mensa
  const dateSelected = dateEqual(action.date, selected.date)
  const isSelected = mensaSelected && dateSelected

  return isSelected ? '🕚' : ''
}

function hideMensa(ctx, key) {
  const {mensa} = getCurrentSettings(ctx)
  return mensa === parseActionCode(key).mensa
}

function daySelectOptions(ctx) {
  const {mensa} = getCurrentSettings(ctx)
  if (!mensa) {
    return {}
  }

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
  const {date} = getCurrentSettings(ctx)

  const {main, more} = ctx.state.userconfig.mensa || {}
  const mensaOptions = [].concat(more || [])
  if (main) {
    mensaOptions.unshift(main)
  }

  const result = {}
  mensaOptions.forEach(mensa => {
    const key = generateActionCode(mensa, date)
    result[key] = '🍽 ' + mensa
  })
  return result
}

menu.select('t', daySelectOptions, {
  setFunc: setMensaDay,
  columns: 3,
  prefixFunc: timePrefixFunc
})

menu.select('m', mensaSelectOption, {
  setFunc: setMensaDay,
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

module.exports = {
  menu
}
