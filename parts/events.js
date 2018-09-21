const TelegrafInlineMenu = require('telegraf-inline-menu')

const addMenu = require('./events-add')
const removeMenu = require('./events-remove')
const changes = require('./changes')

function overviewText(ctx) {
  let text = '*Veranstaltungen*'

  const {events, additionalEvents} = ctx.state.userconfig
  if (events.length > 0) {
    text += '\n\nDu hast folgende Veranstaltungen im Kalender:\n'
    const eventLines = events
      .map(o => o.replace('_', '\\_'))
      .map(o => '- ' + o)
    text += eventLines.join('\n')
  } else {
    text += '\n\nDu hast aktuell keine Veranstaltungen in deinem Kalender. 😔'
  }

  if ((additionalEvents || []).length > 0) {
    text += '\n\nUnd du bist Veranstalter:\n'
    const eventLines = additionalEvents.map(o => '- ' + o)
    text += eventLines.join('\n')
  } else {
    text += '\n\nDu bist Tutor und deine Veranstaltung fehlt im Kalenderbot? Schreib mal @EdJoPaTo an. ;)'
  }

  return text
}

const menu = new TelegrafInlineMenu(overviewText)

menu.submenu('➕ Hinzufügen', 'a', addMenu.menu)
menu.submenu('🗑 Entfernen', 'r', removeMenu.menu, {
  joinLastRow: true,
  hide: ctx => ctx.state.userconfig.events.length === 0
})

menu.submenu('✏️ Änderungen', 'c', changes.menu, {
  hide: ctx => ctx.state.userconfig.events.length === 0
})

module.exports = {
  menu
}
