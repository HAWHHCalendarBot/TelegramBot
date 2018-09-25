const TelegrafInlineMenu = require('telegraf-inline-menu')

const {
  generateShortChangeText
} = require('../lib/change-helper')

const changesAdd = require('./change-add')
const changeDetails = require('./change-details')

const menu = new TelegrafInlineMenu(mainText)

menu.submenu('➕ Änderung hinzufügen', 'a', changesAdd.menu)

// TODO: Select only shows up to 15 elements. needs pagination
menu.select('d', getChangesOptions, {
  columns: 1,
  submenu: changeDetails.menu
})

function getChangesOptions(ctx) {
  const changes = ctx.state.userconfig.changes || []
  if (changes.length === 0) {
    return []
  }
  const result = {}
  for (const change of changes) {
    const key = changeDetails.generateChangeAction(change)
    result[key] = generateShortChangeText(change)
  }
  return result
}

// TODO: add setting for forced removed changes here

function mainText() {
  let text = '*Veranstaltungsänderungen*\n'

  text += '\nWenn sich eine Änderung an einer Veranstaltung ergibt, die nicht in den offiziellen Veranstaltungsplan eingetragen wird, kannst du diese hier nachtragen.'
  text += ' Dein Kalender wird dann automatisch aktualisiert und du hast die Änderung in deinem Kalender.'

  text += '\nAußerdem lassen sich die Änderungen teilen, sodass du auch anderen Leuten diese Änderung bereitstellen kannst.'

  text += '\n\n⚠️ Du bist in der Lage, unlogische Veranstaltungstermine zu kreieren. Beispielsweise kannst du einen Termin so verändern, dass er aufhört bevor er beginnt. Den Bot interessiert das nicht, der tut genau das, was du ihm sagst. Dein Kalenderprogramm ist damit dann allerdings häufig nicht so glücklich…'

  return text
}

module.exports = {
  menu
}
