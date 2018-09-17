const TelegrafInlineMenu = require('telegraf-inline-menu')

const allEvents = require('../lib/all-events')
const {filteredOptions} = require('../lib/inline-menu-helper')

const MAX_RESULT_ROWS = 15
const RESULT_COLUMNS = 2

const menu = new TelegrafInlineMenu('Welche Events möchtest du hinzufügen?')

filteredOptions(menu, {
  uniqueQuestionText: 'Wonach möchtest du die Veranstaltungen filtern?',
  getCurrentFilterFunc: ctx => ctx.session.eventfilter,
  setCurrentFilterFunc: (ctx, filter) => {
    ctx.session.eventfilter = filter
  },
  getFilteredOptionsFunc: findEvents,
  columns: RESULT_COLUMNS,
  maxRows: MAX_RESULT_ROWS,
  setFunc: addEvent
})

function findEvents(ctx, pattern) {
  const blacklist = ctx.state.userconfig.events
    .concat(ctx.state.userconfig.additionalEvents || [])

  const results = allEvents.find(pattern, blacklist)

  return results
}

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
