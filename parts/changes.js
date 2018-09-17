const Telegraf = require('telegraf')
const TelegrafInlineMenu = require('telegraf-inline-menu')

const {Extra, Markup} = Telegraf

const {generateCallbackButtons, question} = require('../lib/telegraf-helper')
const {
  formatDateToHumanReadable,
  generateTimeSectionButtons
} = require('../lib/calendar-helper')
const {
  generateChangeText,
  generateShortChangeText,
  loadEvents
} = require('../lib/change-helper')

const menu = new TelegrafInlineMenu(mainText)

// TODO: refactor menu
// This needs to be completly done with TelegrafInlineMenu but currently it does
// not support a .select that opens a submenu on the given key while maintaining
// the key over subactions

menu.manual('Änderung hinzufügen', 'c:g', {root: true})

menu.manual('Meine Änderungen', 'c:list', {
  root: true,
  hide: ctx => (ctx.state.userconfig.changes || []).length === 0
})

const bot = new Telegraf.Composer()

const backToMainButton = Markup.callbackButton('🔝 zurück zur Auswahl', 'e:c')

function mainText() {
  let text = '*Veranstaltungsänderungen*\n'

  text += '\nWenn sich eine Änderung an einer Veranstaltung ergibt, die nicht in den offiziellen Veranstaltungsplan eingetragen wird, kannst du diese hier nachtragen.'
  text += ' Dein Kalender wird dann automatisch aktualisiert und du hast die Änderung in deinem Kalender.'

  text += '\nAußerdem lassen sich die Änderungen teilen, sodass du auch anderen Leuten diese Änderung bereitstellen kannst.'

  text += '\n\n⚠️ Das Changes Menü ist noch nicht vollständig in das neue Menü überführt. Work in Progress. Theoretisch sollte alles funktionieren… Wenn du Probleme hast, schreib gern @EdJoPaTo.'

  return text
}

function stopGenerationAfterBotRestartMiddleware(ctx, next) {
  if (ctx.session.generateChange) {
    return next()
  }

  const text = 'Ich hab den Faden verloren 🎈😴'

  return Promise.all([
    ctx.editMessageText(text),
    ctx.answerCbQuery(text)
  ])
}

function handleList(ctx, next) {
  const changes = ctx.state.userconfig.changes || []
  if (changes.length === 0) {
    return next(ctx)
  }

  let text = '*Veranstaltungsänderungen*\n'
  text += '\nWelche Änderung möchtest du betrachten?'

  const buttons = []
  for (const change of changes) {
    buttons.push(Markup.callbackButton(generateShortChangeText(change), 'c:d:' + change.name + '#' + change.date))
  }
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})
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
  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
}

function handleGenerationInProgress(ctx) {
  let text = generateChangeText(ctx.session.generateChange)
  text += '\nWelche Art von Änderung möchtest du vornehmen?'

  text += '\n\n_Dir fehlt eine Änderungsmöglichkeit? Schreib einfach_ @EdJoPaTo'

  const currentKeys = Object.keys(ctx.session.generateChange)

  const buttons = [
    [
      Markup.callbackButton('🚫 Entfällt', 'c:g:remove', currentKeys.length > 2)
    ], [
      Markup.callbackButton('🕗 Startzeit', 'c:g:starttime'),
      Markup.callbackButton('🕓 Endzeit', 'c:g:endtime')
    ], [
      Markup.callbackButton('📍 Raum', 'c:g:room')
    ], [
      Markup.callbackButton('🔙 zurück zur Terminwahl', 'c:g:n:' + ctx.session.generateChange.name, currentKeys.length > 2)
    ], [
      Markup.callbackButton('✅ Fertig stellen', 'c:g:finish', currentKeys.length <= 2),
      Markup.callbackButton('🛑 Abbrechen', 'e:c')
    ]
  ]
  const keyboardMarkup = Markup.inlineKeyboard(buttons)
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
}

function handleFinishGeneration(ctx) {
  const change = ctx.session.generateChange

  if (!ctx.state.userconfig.changes) {
    ctx.state.userconfig.changes = []
  }
  ctx.state.userconfig.changes.push(change)
  ctx.state.userconfig.changes.sort()

  return Promise.all([
    ctx.answerCbQuery('Die Änderung wurde deinem Kalender hinzugefügt.'),
    handleDetails(ctx, ctx.session.generateChange.name, ctx.session.generateChange.date)
  ])
}

bot.action('c:list', handleList)

bot.action(/^c:d:(.+)#(.+)$/, ctx => handleDetails(ctx, ctx.match[1], ctx.match[2]))

bot.action(/^c:r:(.+)#(.+)$/, (ctx, next) => {
  const currentChanges = ctx.state.userconfig.changes || []
  ctx.state.userconfig.changes = currentChanges.filter(o => o.name !== ctx.match[1] || o.date !== ctx.match[2])
  return Promise.all([
    handleList(ctx, next),
    ctx.answerCbQuery('Änderung wurde entfernt.')
  ])
})

// Action: change generate
bot.action('c:g', ctx => {
  const events = ctx.state.userconfig.events || []
  const buttons = generateCallbackButtons('c:g:n', events)
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})
  return ctx.editMessageText('*Veranstaltungsänderung*\n\nWelche Veranstaltung betrifft diese Veränderung?', Extra.markdown().markup(keyboardMarkup))
})

// Action: change generate name
bot.action(/^c:g:n:(.+)$/, async ctx => {
  ctx.session.generateChange = {
    name: ctx.match[1]
  }
  const events = await loadEvents(ctx.session.generateChange.name, 'utf8')
  const dates = events
    .map(o => o.StartTime)
    .map(o => o.toISOString().replace(':00.000Z', ''))

  // Prüfen ob man bereits eine Änderung mit dem Namen und dem Datum hat.
  const allChanges = ctx.state.userconfig.changes || []
  const onlyChangesOfThisEvent = allChanges.filter(o => o.name === ctx.session.generateChange.name)
  const buttons = dates.map(date => {
    const existingChange = onlyChangesOfThisEvent.filter(o => o.date === date)
    if (existingChange.length > 0) {
      // There already is a change, so it can be edited
      return Markup.callbackButton('✏️ ' + formatDateToHumanReadable(date), 'c:d:' + ctx.session.generateChange.name + '#' + date)
    }
    return Markup.callbackButton('➕ ' + formatDateToHumanReadable(date), 'c:g:d:' + date)
  })

  buttons.push(Markup.callbackButton('🔙 zurück zur Veranstaltungswahl', 'c:g'))
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})
  return ctx.editMessageText(generateChangeText(ctx.session.generateChange) + '\nZu welchem Termin möchtest du die Veränderung hinzufügen?', Extra.markdown().markup(keyboardMarkup))
})

// Action: change generate date
bot.action(/^c:g:d:(.+)$/, stopGenerationAfterBotRestartMiddleware, ctx => {
  ctx.session.generateChange.date = ctx.match[1]
  return handleGenerationInProgress(ctx)
})

// Useful for cancel actions -> cancel button refer to this one
bot.action('c:g:possibility-picker', stopGenerationAfterBotRestartMiddleware, ctx => handleGenerationInProgress(ctx))

bot.action('c:g:finish', stopGenerationAfterBotRestartMiddleware, ctx => handleFinishGeneration(ctx))

// Action: change generate remove
bot.action('c:g:remove', stopGenerationAfterBotRestartMiddleware, ctx => {
  ctx.session.generateChange.remove = true
  return handleFinishGeneration(ctx)
})

// Action: simple set: match[1] is param, match[2] is value
bot.action(/^c:g:s:([^:]+):(.+)/, stopGenerationAfterBotRestartMiddleware, ctx => {
  ctx.session.generateChange[ctx.match[1]] = ctx.match[2]
  return handleGenerationInProgress(ctx)
})

bot.action(/^c:g:(.+time)$/, stopGenerationAfterBotRestartMiddleware, ctx => {
  let text = generateChangeText(ctx.session.generateChange)
  text += `\nAuf welche Zeit möchtest du die ${ctx.match[1] === 'starttime' ? 'Startzeit' : 'Endzeit'} setzen?`

  const callbackDataPrefix = 'c:g:s:' + ctx.match[1]
  const buttons = generateTimeSectionButtons(callbackDataPrefix)

  buttons.push([Markup.callbackButton('🔝 zurück zur Änderungsauswahl', 'c:g:possibility-picker')])
  buttons.push([Markup.callbackButton('🛑 Abbrechen', 'e:c')])

  const keyboardMarkup = Markup.inlineKeyboard(buttons)
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
})

bot.action('c:g:room', stopGenerationAfterBotRestartMiddleware, question(bot, 'In welchen Raum wurde der Termin gewechselt?', stopGenerationAfterBotRestartMiddleware, ctx => {
  ctx.session.generateChange.room = ctx.message.text
  const keyboardMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('Ja!', 'c:g:possibility-picker'),
    Markup.callbackButton('Nein.', 'c:g:room')
  ])
  ctx.reply(`Ist '${ctx.session.generateChange.room}' korrekt?`, Extra.markup(keyboardMarkup))
}))

module.exports = {
  bot,
  menu
}
