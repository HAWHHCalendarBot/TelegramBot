const fs = require('fs')
const Telegraf = require('telegraf')
const util = require('util')

const { filterMeals } = require('./mensaHelper')
const mensaSettings = require('./mensaSettings')

const { Extra, Markup } = Telegraf
const readFile = util.promisify(fs.readFile)

async function getMealsOfDay(mensa, year, month, day) {
  try {
    let filename = `meals/${mensa}/`
    filename += year.toLocaleString(undefined, { minimumIntegerDigits: 4, useGrouping: false })
    filename += month.toLocaleString(undefined, { minimumIntegerDigits: 2 })
    filename += day.toLocaleString(undefined, { minimumIntegerDigits: 2 })
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
  if (!ctx.state.userconfig.settings.mensa) {
    ctx.state.userconfig.settings.mensa = {}
  }
  ctx.state.mensaSettings = ctx.state.userconfig.settings.mensa
  return next()
})
bot.use(mensaSettings)

function mealToMarkdown(meal, isStudent, showAdditives) {
  const parsedName = showAdditives
    ? meal.Name
      .replace(/ \(/g, '* (')
      .replace(/\), /g, '), *')
      .replace(/([^)])$/, '$1*')
    : meal.Name.replace(/\s*\([\d, ]+\)\s*/g, '') + '*'
  const price = isStudent ? meal.PriceStudent : meal.PriceAttendant
  const priceStr = price.toLocaleString('de-DE', { minimumFractionDigits: 2 })

  let text = `*${parsedName}\n`
  text += `${priceStr} €`

  const infos = []

  if (meal.Pig) { infos.push('🐷') }
  if (meal.Beef) { infos.push('🐮') }
  if (meal.Poultry) { infos.push('🐔') }
  if (meal.Fish) { infos.push('🐟') }

  if (meal.LactoseFree) { infos.push('laktosefrei') }
  if (meal.Vegan) { infos.push('vegan') }
  if (meal.Vegetarian) { infos.push('vegetarisch') }

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

async function mensaText(mensa, year, month, day, mensaSettings) {
  if (!mensa || mensa === 'undefined') { mensa = 'Berliner-Tor' }
  let prefix = `Mensa *${mensa}* ${day}.${month}.${year}\n`
  if (!mensaSettings.main) {
    prefix += `⚠️ Da du noch keine Einstellungen zur Mensa hast, nehme ich die Mensa '${mensa}' an. In den /settings findest du die Mensa Einstellungen.\n`
  }

  let hints = ''
  if (mensaSettings.noPig || mensaSettings.noFish || mensaSettings.lactoseFree || mensaSettings.vegetarian || mensaSettings.vegan) {
    hints += '⚠️ Durch deine Sonderwünsche siehst du nicht jede Mahlzeit. Dies kannst du in den /settings einstellen.\n'
  }

  const meals = await getMealsOfDay(mensa, year, month, day)
  const filtered = filterMeals(meals, mensaSettings)
  const mealTexts = filtered.map(m => mealToMarkdown(m, mensaSettings.student, mensaSettings.showAdditives))

  if (mealTexts.length) {
    return prefix + hints + '\n' + mealTexts.join('\n\n')
  } else if (meals.length === 0) {
    return prefix + '\nDie Mensa bietet heute nichts an.'
  } else {
    return prefix + hints + '\nDie Mensa hat heute nichts für dich.'
  }
}


bot.command('mensa', async ctx => {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const text = await mensaText(ctx.state.mensaSettings.main, year, month, day, ctx.state.mensaSettings)

  const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24)
  const tYear = tomorrow.getFullYear()
  const tMonth = tomorrow.getMonth() + 1
  const tDay = tomorrow.getDate()

  const keyboardMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('Mensaangebot morgen', `m:${ctx.state.mensaSettings.main}:${tYear}:${tMonth}:${tDay}`)
  ], { columns: 1 })

  return ctx.replyWithMarkdown(text, Extra.markup(keyboardMarkup))
})

bot.action(/^m:([^:]+):(\d+):(\d+):(\d+)$/, async ctx => {
  const mensa = ctx.match[1]
  const year = Number(ctx.match[2])
  const month = Number(ctx.match[3])
  const day = Number(ctx.match[4])

  const text = await mensaText(mensa, year, month, day, ctx.state.mensaSettings)

  const keyboardMarkup = Markup.inlineKeyboard([
  ], { columns: 1 })

  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
})
