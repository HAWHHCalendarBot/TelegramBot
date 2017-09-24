const Telegraf = require('telegraf')

const { Extra, Markup } = Telegraf
const { generateCallbackButtons } = require('../helper')
const changesInline = require('./changesInline')
const {
  generateChangeText,
  generateShortChangeText,
  loadEvents
} = require('./changeHelper')

const bot = new Telegraf.Composer()
bot.use(changesInline)
module.exports = bot


const backToMainButton = Markup.callbackButton('🔝 zurück zur Auswahl', 'c')

function mainText(ctx) {
  const events = ctx.state.userconfig.events || []

  let text = '*Veranstaltungsänderungen*\n'
  if (events.length === 0) {
    return text + '\nWenn du keine Veranstaltungen im Kalender hast, kannst du auch keine Änderungen vornehmen.'
  }

  text += '\nWenn sich eine Änderung an einer Veranstaltung ergibt, die nicht in den offiziellen Veranstaltungsplan eingetragen wird, kannst du diese hier nachtragen.'
  text += '\nDein Kalender wird dann automatisch aktualisiert und du hast die Änderung in deinem Kalender.'

  text += '\nAußerdem lassen sich die Änderungen teilen, sodass du auch anderen Leuten diese Änderung bereitstellen kannst.'

  return text
}

function mainMarkup(ctx) {
  const events = ctx.state.userconfig.events || []
  const changes = ctx.state.userconfig.changes || []
  return Markup.inlineKeyboard([
    Markup.callbackButton('Änderung hinzufügen', 'c:g', events.length === 0),
    Markup.callbackButton('Meine Änderungen', 'c:list', events.length === 0 || changes.length === 0)
  ], { columns: 1 })
}

function handleMainmenu(ctx) {
  return ctx.editMessageText(mainText(ctx), Extra.markdown().markup(mainMarkup(ctx)))
}

function stopGenerationAfterBotRestartMiddleware(ctx, next) {
  if (ctx.session.generateChange) {
    return next()
  }

  return Promise.all([
    handleMainmenu(ctx),
    ctx.answerCallbackQuery('Ich hab den Faden verloren 🎈😴')
  ])
}

function handleList(ctx) {
  const changes = ctx.state.userconfig.changes || []
  if (changes.length === 0) {
    return handleMainmenu(ctx)
  }

  let text = '*Veranstaltungsänderungen*\n'
  text += '\nWelche Änderung möchtest du betrachten?'

  const buttons = []
  for (const change of changes) {
    buttons.push(Markup.callbackButton(generateShortChangeText(change), 'c:d:' + change.name + '#' + change.date))
  }
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
}

function handleDetails(ctx, name, date) {
  const changes = ctx.state.userconfig.changes || []
  const change = changes.filter(c => c.name === name && c.date === date)[0]
  const text = generateChangeText(change)
  const title = generateShortChangeText(change)
  const buttons = [
    Markup.switchToChatButton('Teilen…', title),
    Markup.callbackButton('⚠️ Änderung entfernen', 'c:r:' + change.name + '#' + change.date),
    Markup.callbackButton('🔙 zur Änderungsliste', 'c:list'),
    backToMainButton
  ]
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
}

function handleGenerationInProgress(ctx) {
  let text = generateChangeText(ctx.session.generateChange)
  text += '\nWelche Art von Änderung möchtest du vornehmen?'

  // TODO: remove on finish
  text += '\n\n_WIP: Mehr als das kann ich noch nicht._'

  const currentKeys = Object.keys(ctx.session.generateChange)

  // TODO: add more types of changes
  const buttons = [
    [
      Markup.callbackButton('🚫 Entfällt', 'c:g:remove', currentKeys.length > 2)
    ], [
      Markup.callbackButton('🕗 Startzeit', 'c:g:starttime'),
      Markup.callbackButton('🕓 Endzeit', 'c:g:endtime')
    ], [
      Markup.callbackButton('🔙 zurück zur Terminwahl', 'c:g:n:' + ctx.session.generateChange.name, currentKeys.length > 2)
    ], [
      Markup.callbackButton('✅ Fertig stellen', 'c:g:finish', currentKeys.length <= 2),
      Markup.callbackButton('🛑 Abbrechen', 'c')
    ]
  ]
  const keyboardMarkup = Markup.inlineKeyboard(buttons)
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
}

async function handleFinishGeneration(ctx) {
  const change = ctx.session.generateChange

  if (!ctx.state.userconfig.changes) {
    ctx.state.userconfig.changes = []
  }
  ctx.state.userconfig.changes.push(change)
  ctx.state.userconfig.changes.sort()
  await ctx.userconfig.save()

  return Promise.all([
    ctx.answerCallbackQuery('Die Änderung wurde deinem Kalender hinzugefügt.'),
    handleDetails(ctx, ctx.session.generateChange.name, ctx.session.generateChange.date)
  ])
}


bot.command('changes', ctx => ctx.replyWithMarkdown(mainText(ctx), Extra.markup(mainMarkup(ctx))))
bot.action('c', handleMainmenu)

bot.action('c:list', handleList)

bot.action(/^c:d:(.+)#(.+)$/, ctx => handleDetails(ctx, ctx.match[1], ctx.match[2]))

bot.action(/^c:r:(.+)#(.+)$/, async ctx => {
  const currentChanges = ctx.state.userconfig.changes || []
  ctx.state.userconfig.changes = currentChanges.filter(o => o.name !== ctx.match[1] || o.date !== ctx.match[2])
  await ctx.userconfig.save()
  return Promise.all([
    handleList(ctx),
    ctx.answerCallbackQuery('Änderung wurde entfernt.')
  ])
})

bot.action('c:g', ctx => { // change generate
  const events = ctx.state.userconfig.events || []
  const buttons = generateCallbackButtons('c:g:n', events)
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText('*Veranstaltungsänderung*\n\nWelche Veranstaltung betrifft diese Veränderung?', Extra.markdown().markup(keyboardMarkup))
})

bot.action(/^c:g:n:(.+)$/, async ctx => { // change generate name
  ctx.session.generateChange = {
    name: ctx.match[1]
  }
  const events = await loadEvents(ctx.session.generateChange.name, 'utf8')
  const dates = events
    .map(o => o.StartTime)
    .map(o => o.toISOString().replace(':00.000Z', ''))

  // prüfen ob man bereits eine Änderung mit dem Namen und dem Datum hat.
  const allChanges = ctx.state.userconfig.changes || []
  const onlyChangesOfThisEvent = allChanges.filter(o => o.name === ctx.session.generateChange.name)
  const buttons = dates.map(date => {
    const existingChange = onlyChangesOfThisEvent.filter(o => o.date === date)
    if (existingChange.length) {
      return Markup.callbackButton('✏️ ' + date, 'c:d:' + existingChange)
    } else {
      return Markup.callbackButton('➕ ' + date, 'c:g:d:' + date)
    }
  })

  buttons.push(Markup.callbackButton('🔙 zurück zur Veranstaltungswahl', 'c:g'))
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText(generateChangeText(ctx.session.generateChange) + `\nZu welchem Termin möchtest du die Veränderung hinzufügen?`, Extra.markdown().markup(keyboardMarkup))
})

bot.action(/^c:g:d:(.+)$/, stopGenerationAfterBotRestartMiddleware, ctx => { // change generate date
  ctx.session.generateChange.date = ctx.match[1]
  return handleGenerationInProgress(ctx)
})

// useful for cancel actions -> cancel button refer to this one
bot.action('c:g:possibility-picker', stopGenerationAfterBotRestartMiddleware, ctx => handleGenerationInProgress(ctx))

bot.action('c:g:finish', stopGenerationAfterBotRestartMiddleware, ctx => handleFinishGeneration(ctx))

bot.action('c:g:remove', stopGenerationAfterBotRestartMiddleware, ctx => { // change generate remove
  ctx.session.generateChange.remove = true
  return handleFinishGeneration(ctx)
})

bot.action(/^c:g:s:([^:]+):(.+)/, stopGenerationAfterBotRestartMiddleware, ctx => { // simple set: match[1] is param, match[2] is value
  ctx.session.generateChange[ctx.match[1]] = ctx.match[2]
  return handleGenerationInProgress(ctx)
})

bot.action(/^c:g:(.+time)$/, stopGenerationAfterBotRestartMiddleware, ctx => {
  let text = generateChangeText(ctx.session.generateChange)
  text += `\nAuf welche Zeit möchtest du die ${ctx.match[1] === 'starttime' ? 'Startzeit' : 'Endzeit'} setzen?`

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
  const minutes = ['00', 15, 30, 45]

  const buttons = hours.map(h => {
    const times = minutes.map(m => `${h}:${m}`)
    return generateCallbackButtons('c:g:s:' + ctx.match[1], times)
  })
  buttons.push([ Markup.callbackButton('🔝 zurück zur Änderungsauswahl', 'c:g:possibility-picker') ])
  buttons.push([ Markup.callbackButton('🛑 Abbrechen', 'c') ])

  const keyboardMarkup = Markup.inlineKeyboard(buttons)
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
})

// TODO: add more types
