const TelegrafInlineMenu = require('telegraf-inline-menu')

const addMenu = require('./events-add')

function overviewText(ctx) {
  let text = 'Hier hast du einen Überblick über deine Veranstaltungen'

  const {events, additionalEvents} = ctx.state.userconfig
  if (events.length > 0) {
    text += '\n\nDu hast folgende Veranstaltungen im Kalender:\n'
    const eventLines = events.map(o => '- ' + o)
    text += eventLines.join('\n')
  } else {
    text += '\n\nDu hast aktuell keine Veranstaltungen in deinem Kalender. 😔'
  }

  if ((additionalEvents || []).length > 0) {
    text += '\n\nUnd du Veranstalter:\n'
    const eventLines = additionalEvents.map(o => '- ' + o)
    text += eventLines.join('\n')
  }

  return text
}

const menu = new TelegrafInlineMenu('e', overviewText)

menu.submenu('Hinzufügen…', addMenu.menu)

module.exports = {
  menu
}
