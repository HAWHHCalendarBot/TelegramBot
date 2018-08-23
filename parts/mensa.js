const fs = require('fs')
const util = require('util')

const Telegraf = require('telegraf')

const {filterMeals} = require('./mensa-helper')
const mensaSettings = require('./mensa-settings')

const {Extra, Markup} = Telegraf
const readFile = util.promisify(fs.readFile)

async function getMealsOfDay(mensa, year, month, day) {
  try {
    let filename = `meals/${mensa}/`
    filename += year.toLocaleString(undefined, {minimumIntegerDigits: 4, useGrouping: false})
    filename += month.toLocaleString(undefined, {minimumIntegerDigits: 2})
    filename += day.toLocaleString(undefined, {minimumIntegerDigits: 2})
    filename += '.json'

    const content = await readFile(filename, 'utf8')
    return JSON.parse(content)
  } catch (err) {
    return []
  }
}

const bot = new Telegraf.Composer()
module.exports = bot

bot.use((ctx, next) => {
  if (!ctx.state.userconfig.mensa) {
    ctx.state.userconfig.mensa = {}
  }
  ctx.state.mensaSettings = ctx.state.userconfig.mensa
  return next()
})
bot.use(mensaSettings)

function mealToMarkdown(meal, isStudent, showAdditives) {
  const parsedName = showAdditives ?
    meal.Name
      .replace(/ \(/g, '* (')
      .replace(/\), /g, '), *')
      .replace(/([^)])$/, '$1*') :
    meal.Name.replace(/\s*\([^)]+\)\s*/g, '') + '*'
  const price = isStudent ? meal.PriceStudent : meal.PriceAttendant
  const priceStr = price.toLocaleString('de-DE', {minimumFractionDigits: 2})

  let text = `*${parsedName}\n`
  text += `${priceStr} €`

  const infos = []

  if (meal.Pig) {
    infos.push('🐷')
  }
  if (meal.Beef) {
    infos.push('🐮')
  }
  if (meal.Poultry) {
    infos.push('🐔')
  }
  if (meal.Fish) {
    infos.push('🐟')
  }

  if (meal.LactoseFree) {
    infos.push('laktosefrei')
  }
  if (meal.Vegan) {
    infos.push('vegan')
  }
  if (meal.Vegetarian) {
    infos.push('vegetarisch')
  }

  if (infos.length > 0) {
    text += ' ' + infos.join(' ')
  }

  if (showAdditives) {
    for (const additive of meal.Additives) {
      text += `\n${additive.Key}: ${additive.Value}`
    }
  }

  return text
}

const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
async function mensaText(mensa, year, month, day, mensaSettings) {
  if (!mensa || mensa === 'undefined') {
    return '⚠️ Du hast keine Mensa gesetzt, zu der du dein Angebot bekommen möchtest. In den /settings findest du die Mensa Einstellungen.'
  }
  const date = new Date(Date.parse(`${year}-${month}-${day}`))
  const weekday = weekdays[date.getDay()]

  const prefix = `Mensa *${mensa}*\n${weekday} ${day}.${month}.${year}\n`
  let hints = ''
  if (mensaSettings.noPig || mensaSettings.noFish || mensaSettings.lactoseFree || mensaSettings.vegetarian || mensaSettings.vegan) {
    hints += '⚠️ Durch deine Sonderwünsche siehst du nicht jede Mahlzeit. Dies kannst du in den /settings einstellen.\n'
  }

  const meals = await getMealsOfDay(mensa, year, month, day)
  const filtered = filterMeals(meals, mensaSettings)
  const mealTexts = filtered.map(m => mealToMarkdown(m, mensaSettings.student, mensaSettings.showAdditives))

  if (meals.length === 0) {
    return prefix + '\nDie Mensa bietet heute nichts an.'
  }

  if (mealTexts.length === 0) {
    return prefix + hints + '\nDie Mensa hat heute nichts für dich.'
  }
  return prefix + hints + '\n' + mealTexts.join('\n\n')
}

function dateCallbackButtonData(mensa, date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `m:${mensa}:${year}:${month}:${day}`
}

function generateMensaButtons(mensa, year, month, day, mensaSettings) {
  if (!mensa || mensa === 'undefined') {
    return []
  }
  const timeButtons = generateTimeButtons(mensa, year, month, day)
  const mensaButtons = generateSwitchMensaButtons(mensa, year, month, day, mensaSettings)

  const buttons = []
  buttons.push(timeButtons)
  for (const b of mensaButtons) {
    buttons.push([b])
  }
  return buttons
}

function generateSwitchMensaButtons(mensa, year, month, day, mensaSettings) {
  if (!mensa || mensa === 'undefined') {
    return []
  }
  const more = mensaSettings.more || []
  more.unshift(mensaSettings.main)
  return more.map(m => Markup.callbackButton(`🍽 ${m}`, `m:${m}:${year}:${month}:${day}`, m === mensa))
}

function generateTimeButtons(mensa, year, month, day) {
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
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const text = await mensaText(ctx.state.mensaSettings.main, year, month, day, ctx.state.mensaSettings)
  const buttons = generateMensaButtons(ctx.state.mensaSettings.main, year, month, day, ctx.state.mensaSettings)

  const keyboardMarkup = Markup.inlineKeyboard(buttons)
  return ctx.replyWithMarkdown(text, Extra.markup(keyboardMarkup))
})

bot.action(/^m:([^:]+):(\d+):(\d+):(\d+)$/, async ctx => {
  const mensa = ctx.match[1]
  const year = Number(ctx.match[2])
  const month = Number(ctx.match[3])
  const day = Number(ctx.match[4])

  const text = await mensaText(mensa, year, month, day, ctx.state.mensaSettings)
  const buttons = generateMensaButtons(mensa, year, month, day, ctx.state.mensaSettings)

  const keyboardMarkup = Markup.inlineKeyboard(buttons)

  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
})
