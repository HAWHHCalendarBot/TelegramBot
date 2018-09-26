const TelegrafInlineMenu = require('telegraf-inline-menu')

const {formatDateToHumanReadable} = require('../lib/calendar-helper')
const {
  loadEvents,
  generateChangeText
} = require('../lib/change-helper')
const {addStartEndTimeSelectionSubmenu} = require('../lib/event-creation-menu-parts')

const changeDetails = require('./change-details')

const menu = new TelegrafInlineMenu(addChangeMenuText)

function changesOfEvent(ctx, name) {
  const allChanges = ctx.state.userconfig.changes || []
  return allChanges.filter(o => o.name === name)
}

function addChangeMenuText(ctx) {
  const name = ctx.session.generateChange && ctx.session.generateChange.name
  if (!name) {
    return 'Zu welcher Veranstaltung willst du eine Änderung hinzufügen?'
  }
  const {date} = ctx.session.generateChange
  if (!date) {
    let text = 'Zu welchem Termin willst du eine Änderung hinzufügen?'
    const changes = changesOfEvent(ctx, name)
    if (changes.length > 0) {
      text += '\n\nFolgende Termine habe bereits eine Veränderung. Entferne die Veränderung zuerst, bevor du eine neue erstellen kannst.'
      text += '\n'

      const dates = changes.map(o => o.date)
      dates.sort()
      text += dates
        .map(o => formatDateToHumanReadable(o))
        .map(o => `- ${o}`)
        .join('\n')
    }
    return text
  }
  let text = generateChangeText(ctx.session.generateChange)
  text += '\nWelche Art von Änderung willst du vornehmen?'
  return text
}

function hidePickEventStep(ctx) {
  if (!ctx.session.generateChange) {
    ctx.session.generateChange = {}
  }
  return ctx.session.generateChange.name
}

function hidePickDateStep(ctx) {
  return !ctx.session.generateChange || !ctx.session.generateChange.name || ctx.session.generateChange.date
}

function hideGenerateChangeStep(ctx) {
  return !ctx.session.generateChange || !ctx.session.generateChange.name || !ctx.session.generateChange.date
}

function generationDataIsValid(ctx) {
  const keys = Object.keys(ctx.session.generateChange || [])
  // Required (2): name and date
  // There have to be other changes than that in order to do something.
  return keys.length > 2
}

function possibleEventsToCreateChangeToOptions(ctx) {
  return ctx.state.userconfig.events || []
}
menu.select('event', possibleEventsToCreateChangeToOptions, {
  columns: 2,
  hide: hidePickEventStep,
  setFunc: (ctx, key) => {
    ctx.session.generateChange.name = key
  }
})

async function possibleTimesToCreateChangeToOptions(ctx) {
  const name = ctx.session.generateChange && ctx.session.generateChange.name
  if (!name) {
    // No event selected for which events could be found
    return []
  }
  if (ctx.session.generateChange.date) {
    // Date already selected
    return []
  }

  const existingChangeDates = changesOfEvent(ctx, name)
    .map(o => o.date)

  const events = await loadEvents(name, 'utf8')
  const dates = events
    .map(o => o.StartTime)
    .map(o => o.toISOString().replace(':00.000Z', ''))
    .filter(o => existingChangeDates.indexOf(o) < 0)
  const uniqueDates = [...new Set(dates)]
  const options = {}
  for (const date of uniqueDates) {
    options[date.replace(':', '!')] = formatDateToHumanReadable(date)
  }
  return options
}
menu.select('date', possibleTimesToCreateChangeToOptions, {
  columns: 2,
  hide: hidePickDateStep,
  setFunc: (ctx, key) => {
    ctx.session.generateChange.date = key.replace('!', ':')
  }
})

menu.simpleButton('🚫 Entfällt', 'remove', {
  doFunc: ctx => {
    ctx.session.generateChange.remove = true
    return finish(ctx)
  },
  hide: ctx => {
    if (hideGenerateChangeStep(ctx)) {
      return true
    }
    return Object.keys(ctx.session.generateChange).length > 2
  }
})

addStartEndTimeSelectionSubmenu(menu, {
  menuTextStart: 'Zu welchem Zeitpunkt beginnt diese Veranstaltung stattdessen?',
  menuTextEnd: 'Zu welchem Zeitpunkt endet diese Veranstaltung stattdessen?',
  getCurrent: (ctx, time) => ctx.session.generateChange[time],
  setFunc: (ctx, time, newValue) => {
    ctx.session.generateChange[time] = newValue
  }
}, {
  hide: hideGenerateChangeStep
})

menu.question('📍 Raum', 'room', {
  questionText: 'In welchen Raum wurde der Termin verschoben?',
  setFunc: (ctx, answer) => {
    ctx.session.generateChange.room = answer
  },
  hide: hideGenerateChangeStep
})

menu.simpleButton('✅ Fertig stellen', 'finish', {
  doFunc: finish,
  hide: ctx => !generationDataIsValid(ctx)
})

function finish(ctx) {
  const change = ctx.session.generateChange

  if (!ctx.state.userconfig.changes) {
    ctx.state.userconfig.changes = []
  }
  ctx.state.userconfig.changes.push(change)
  delete ctx.session.generateChange

  const actionPart = changeDetails.generateChangeAction(change)
  return changeDetails.setSpecific(ctx, `e:c:d-${actionPart}`)
}

menu.button('🛑 Neu beginnen', 'restart', {
  doFunc: ctx => {
    ctx.session.generateChange = {}
  },
  hide: ctx => Object.keys(ctx.session.generateChange || {}).length === 0
})

module.exports = {
  menu
}
