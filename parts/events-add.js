const TelegrafInlineMenu = require('telegraf-inline-menu')

const allEvents = require('../lib/all-events')

const MAX_RESULT_ROWS = 15
const RESULT_COLUMNS = 2

const menu = new TelegrafInlineMenu('Welche Events möchtest du hinzufügen?')
function filterText(ctx) {
  let text = '🔎 Filter'
  if (ctx.session.eventfilter && ctx.session.eventfilter !== '.+') {
    text += ': ' + ctx.session.eventfilter
  }
  return text
}
menu.question(filterText, 'filter', {
  setFunc: (ctx, answer) => {
    ctx.session.eventfilter = answer
  },
  questionText: 'Wonach möchtest du die Veranstaltungen filtern?'
})

menu.button('Filter aufheben', 'clearfilter', {
  doFunc: ctx => {
    delete ctx.session.eventfilter
  },
  joinLastRow: true,
  hide: ctx => !ctx.session.eventfilter || ctx.session.eventfilter === '.+'
})

function findEvents(ctx) {
  const pattern = ctx.session.eventfilter || '.+'
  const blacklist = ctx.state.userconfig.events
    .concat(ctx.state.userconfig.additionalEvents || [])

  const results = allEvents.find(pattern, blacklist)

  return results
}

menu.select('add', findEvents, {
  setFunc: addEvent,
  columns: RESULT_COLUMNS,
  maxRows: MAX_RESULT_ROWS
})

function addEvent(ctx, event) {
  const isExisting = allEvents.exists(event)
  const isAlreadyInCalendar = ctx.state.userconfig.events
    .concat(ctx.state.userconfig.additionalEvents || [])
    .indexOf(event) >= 0

  if (isExisting && !isAlreadyInCalendar) {
    ctx.state.userconfig.events.push(event)
    ctx.state.userconfig.events.sort()
  }

  if (!isExisting) {
    return ctx.answerCbQuery(`${event} existiert nicht!`)
  }

  if (isAlreadyInCalendar) {
    return ctx.answerCbQuery(`${event} ist bereits in deinem Kalender!`)
  }

  return ctx.answerCbQuery(`${event} wurde zu deinem Kalender hinzugefügt.`)
}

module.exports = {
  menu
}
