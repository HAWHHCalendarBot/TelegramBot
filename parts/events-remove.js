const Telegraf = require('telegraf')
const TelegrafInlineMenu = require('telegraf-inline-menu')

const {generateInlineKeyboardMarkup} = require('../lib/telegraf-helper')

const {Extra, Markup} = Telegraf

function overviewText(ctx) {
  const {events} = ctx.state.userconfig
  const prefix = '*Veranstaltungen*\n'
  if (events.length === 0) {
    return prefix + 'Du hast keine Veranstaltungen mehr in deinem Kalender, die ich entfernen könnte. 😔'
  }

  return prefix + 'Welche Veranstaltungen möchtest du aus deinem Kalender entfernen?'
}

const menu = new TelegrafInlineMenu(overviewText)

function deleteDict(ctx) {
  const {events} = ctx.state.userconfig
  const entries = {}
  events.forEach(event => {
    entries[event] = '🗑 ' + event
  })
  return entries
}

menu.select('r', deleteDict, {
  setFunc: remove,
  columns: 2,
  getCurrentPage: ctx => ctx.session.page,
  setPage: (ctx, page) => {
    ctx.session.page = page
  }
})

function generateRemoveKeyboard(ctx) {
  return generateInlineKeyboardMarkup('r', ctx.state.userconfig.events, 1)
}

function remove(ctx, event) {
  ctx.state.userconfig.events = ctx.state.userconfig.events.filter(e => e !== event)

  // Remove changes to that event too
  const currentChanges = ctx.state.userconfig.changes || []
  ctx.state.userconfig.changes = currentChanges.filter(o => o.name !== event)

  // Update message
  if (ctx.state.userconfig.events.length === 0) {
    ctx.editMessageText('Alle deine Veranstaltungen wurden bereits aus dem Kalender entfernt. 😳', Extra.markup(Markup.inlineKeyboard([])))
  } else {
    ctx.editMessageReplyMarkup(generateRemoveKeyboard(ctx))
  }

  return ctx.answerCbQuery(`${event} wurde aus deinem Kalender entfernt.`)
}

module.exports = {
  menu
}
