const TelegrafInlineMenu = require('telegraf-inline-menu')

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

async function remove(ctx, event) {
  ctx.state.userconfig.events = ctx.state.userconfig.events.filter(o => o !== event)

  // Remove changes to that event too
  const currentChanges = ctx.state.userconfig.changes || []
  ctx.state.userconfig.changes = currentChanges.filter(o => o.name !== event)

  await ctx.answerCbQuery(`${event} wurde aus deinem Kalender entfernt.`)
}

module.exports = {
  menu
}
