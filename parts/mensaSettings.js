const fs = require('fs')
const Telegraf = require('telegraf')
const util = require('util')

const {mensaSpecialWishesButtons} = require('./mensaHelper')
const {generateCallbackButton} = require('../lib/telegrafHelper')

const {Extra, Markup} = Telegraf
const readdir = util.promisify(fs.readdir)

function enabledEmoji(truthy) {
  return truthy ? '✅' : '🚫'
}

let allCanteens = []

setInterval(updateCanteens, 1000 * 60 * 60 * 6) // Every 6 hours
updateCanteens()

async function updateCanteens() {
  allCanteens = await readdir('meals')
  console.log(new Date(), allCanteens.length, 'Mensen geladen.')
}

const bot = new Telegraf.Composer()
module.exports = bot

function mensaSettingsMainmenu(ctx) {
  const text = '*Mensa Einstellungen*'
  const mainMensa = ctx.state.mensaSettings.main || 'Berliner-Tor'
  const mainUnset = !ctx.state.mensaSettings.main
  const moreCount = (ctx.state.mensaSettings.more || []).length
  const moreCountText = moreCount ? ' (' + moreCount + ' gewählt)' : ''

  const keyboardMarkup = Markup.inlineKeyboard([
    Markup.callbackButton(`Hauptmensa${mainUnset ? '' : ': ' + mainMensa}`, 's:m:main'),
    Markup.callbackButton('weitere Mensen' + moreCountText, 's:m:more', mainUnset),
    Markup.callbackButton(enabledEmoji(ctx.state.mensaSettings.student) + ' Studentenpreis', 's:m:student', mainUnset),
    Markup.callbackButton('Extrawünsche Essen', 's:m:s', mainUnset),
    Markup.callbackButton(enabledEmoji(ctx.state.mensaSettings.showAdditives) + ' zeige Inhaltsstoffe', 's:m:showAdditives', mainUnset),
    Markup.callbackButton('🔙 zurück zur Einstellungsübersicht', 's')
  ], {columns: 1})

  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
}

bot.action('s:m', ctx => Promise.all([
  mensaSettingsMainmenu(ctx),
  ctx.answerCbQuery()
]))

bot.action('s:m:student', async ctx => {
  await toggleSetting(ctx, 'student')
  return mensaSettingsMainmenu(ctx)
})

bot.action('s:m:showAdditives', async ctx => {
  await toggleSetting(ctx, 'showAdditives')
  return mensaSettingsMainmenu(ctx)
})

bot.action('s:m:main', ctx => {
  const mainMensa = ctx.state.mensaSettings.main
  const mensaButtons = allCanteens.map(mensa => {
    if (mensa === mainMensa) {
      return Markup.callbackButton(`▶️ ${mensa}`, `s:m:main:${mensa}`)
    } else {
      return generateCallbackButton('s:m:main', mensa)
    }
  })

  mensaButtons.push(Markup.callbackButton('🔙 zurück zu den Mensa Einstellungen', 's:m'))
  mensaButtons.push(Markup.callbackButton('🔙 zurück zur Einstellungensübersicht', 's'))
  const keyboardMarkup = Markup.inlineKeyboard(mensaButtons, {columns: 1})

  return Promise.all([
    ctx.editMessageText('*Mensa Einstellungen*\nWähle die Mensa, in den du am häufigsten bist', Extra.markdown().markup(keyboardMarkup)),
    ctx.answerCbQuery()
  ])
})

bot.action(/^s:m:main:(.+)$/, async ctx => {
  ctx.state.mensaSettings.main = ctx.match[1]
  await ctx.userconfig.save()
  return Promise.all([
    mensaSettingsMainmenu(ctx),
    ctx.answerCbQuery(`${ctx.state.mensaSettings.main} wurde als deine neue Hauptmensa ausgewählt.`)
  ])
})

function moreMenu(ctx) {
  const selected = ctx.state.mensaSettings.more || []
  const buttons = allCanteens.map(m => {
    const data = `s:m:more:${m}`
    if (m === ctx.state.mensaSettings.main) {
      return Markup.callbackButton(`🍽 ${m}`, data)
    } else {
      const isSelected = selected.indexOf(m) >= 0
      return Markup.callbackButton(enabledEmoji(isSelected) + ` ${m}`, data)
    }
  })
  buttons.push(Markup.callbackButton('🔙 zurück zu den Mensa Einstellungen', 's:m'))
  buttons.push(Markup.callbackButton('🔙 zurück zur Einstellungensübersicht', 's'))
  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})

  return ctx.editMessageText('*Mensa Einstellungen*\nWähle weitere Mensen, in den du gelegentlich bist', Extra.markdown().markup(keyboardMarkup))
}

bot.action('s:m:more', ctx => Promise.all([
  moreMenu(ctx),
  ctx.answerCbQuery()
]))

bot.action(/^s:m:more:(.+)$/, async ctx => {
  const mensa = ctx.match[1]
  if (mensa === ctx.state.mensaSettings.main) {
    return ctx.answerCbQuery(`${mensa} ist bereits deine Hauptmensa.`)
  }

  ctx.state.mensaSettings.more = ctx.state.mensaSettings.more || []
  const wasSelected = ctx.state.mensaSettings.more.indexOf(mensa) >= 0

  if (wasSelected) {
    ctx.state.mensaSettings.more = ctx.state.mensaSettings.more.filter(o => o !== mensa)
  } else {
    ctx.state.mensaSettings.more.push(mensa)
    ctx.state.mensaSettings.more.sort()
  }

  const text = wasSelected ? `${mensa} wurde entfernt` : `${mensa} wurde hinzugefügt`

  await ctx.userconfig.save()
  return Promise.all([
    moreMenu(ctx),
    ctx.answerCbQuery(text)
  ])
})

function mensaSettingsSpecialWishesMenu(ctx) {
  const possibleSettings = mensaSpecialWishesButtons(ctx.state.mensaSettings)

  const buttons = possibleSettings.map(o => Markup.callbackButton(enabledEmoji(ctx.state.mensaSettings[o]) + ' ' + settingName[o], 's:m:s:' + o))

  buttons.push(Markup.callbackButton('🔙 zurück zu den Mensa Einstellungen', 's:m'))
  buttons.push(Markup.callbackButton('🔙 zurück zur Einstellungensübersicht', 's'))

  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})

  return ctx.editMessageText('*Mensa Einstellungen*\nWelche Sonderwünsche hast du zu deinem Essen?', Extra.markdown().markup(keyboardMarkup))
}

// Action: settings:mensa:specialWishes
bot.action('s:m:s', ctx => Promise.all([
  mensaSettingsSpecialWishesMenu(ctx),
  ctx.answerCbQuery()
]))

const settingName = {
  lactoseFree: 'laktosefrei',
  noBeef: 'kein Rindfleisch',
  noFish: 'kein Fisch',
  noPig: 'kein Schweinefleisch',
  noPoultry: 'kein Geflügel',
  vegan: 'vegan',
  vegetarian: 'vegetarisch'
}

function toggleSettingText(setting, enabled) {
  switch (setting) {
    case 'showAdditives': return enabled ? 'Inhaltsstoffe werden nun angezeigt' : 'Inhaltsstoffe werden verborgen'
    case 'student': return enabled ? 'Du hast nun Studentenpreise' : 'Du hast nun Angestelltenpreise'

    case 'lactoseFree': return enabled ? 'Du bekommst nun nur noch laktosefreies Essen' : 'Du bekommst wieder jedes Essen'
    case 'noBeef': return enabled ? 'Du bekommst nun kein Essen mehr mit Rindfleisch' : 'Du bekommst wieder Rindfleisch'
    case 'noFish': return enabled ? 'Du bekommst nun kein Essen mehr mit Fisch' : 'Du bekommst wieder Fisch'
    case 'noPig': return enabled ? 'Du bekommst nun kein Essen mehr mit Schweinefleisch' : 'Du bekommst wieder Schweinefleisch'
    case 'noPoultry': return enabled ? 'Du bekommst nun kein Essen mehr mit Geflügel' : 'Du bekommst wieder Geflügel'
    case 'vegan': return enabled ? 'Du bekommst nun nur noch veganes Essen' : 'Du bekommst wieder jedes Essen'
    case 'vegetarian': return enabled ? 'Du bekommst nun nur noch vegetarisches Essen' : 'Du bekommst wieder jedes Essen'
    default:
      throw new Error()
  }
}

async function toggleSetting(ctx, settingName) {
  ctx.state.mensaSettings[settingName] = !ctx.state.mensaSettings[settingName]
  await ctx.userconfig.save()
  return ctx.answerCbQuery(toggleSettingText(settingName, ctx.state.mensaSettings[settingName]))
}

bot.action(/^s:m:s:(.+)$/, async ctx => {
  await toggleSetting(ctx, ctx.match[1])
  return mensaSettingsSpecialWishesMenu(ctx)
})
