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

function isShowRemovedEventsSet(ctx) {
  return ctx.state.userconfig.showRemovedEvents === true
}
const showRemovedText = 'erzwinge entfernte Termine'
function showRemovedDescription(ctx) {
  const active = ctx.state.userconfig.showRemovedEvents

  let text = '*erzwinge entfernte Veranstaltungsänderungen*\n'
  text += '\nIn deinem Kalender hast du Änderungen, die Termine entfernen.'
  text += ' Diese ausfallenden Termine werden nach dem iCal Standard mit dem Status CANCELLED markiert.'
  text += ' Jedoch können nicht alle Kalendertools diese ausfallenden Veranstaltungen anzeigen.'
  text += ' Um diese in deinem Kalender zu erzwingen, können diese Termine stattdessen ganz normal als stattfindende Termine in deinem Kalender hinterlegt werden, die mit dem 🚫 Emoji als ausfallend gekennzeichnent werden.'

  text += '\n'
  text += '\nSowohl die default iOS als auch macOS Kalender App kann CANCELLED Events optional anzeigen.'
  text += ' Für den Google Kalender und den HAW Mailer ist mir diese Option nicht bekannt.'

  text += '\n'
  text += '\nEntfernte Veranstaltungen werden für dich aktuell '
  if (active) {
    text += 'als normales Event mit dem 🚫 Emoji im Namen dargestellt.'
  } else {
    text += 'mit dem Status CANCELLED markiert. Dein Kalendertool kann diese (möglicherweise) ein oder ausblenden.'
  }
  return text
}
function showRemovedTextSubmenu(ctx) {
  const currentState = isShowRemovedEventsSet(ctx)
  let text = currentState ? '✅' : '🚫'
  text += ' ' + showRemovedText
  return text
}
menu.submenu(showRemovedTextSubmenu, 'showRemoved', new TelegrafInlineMenu(showRemovedDescription), {
  hide: ctx => (ctx.state.userconfig.changes || [])
    .filter(c => c.remove)
    .length === 0
})
  .toggle(showRemovedText, 'toggle', {
    setFunc: (ctx, newValue) => {
      if (newValue) {
        ctx.state.userconfig.showRemovedEvents = true
      } else {
        delete ctx.state.userconfig.showRemovedEvents
      }
    },
    isSetFunc: isShowRemovedEventsSet
  })

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
