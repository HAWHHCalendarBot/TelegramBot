const Telegraf = require('telegraf')

const { Extra, Markup } = Telegraf
const { generateCallbackButtons } = require('../helper')
const {
  filenameChange,
  generateChangeText,
  generateShortChangeText,
  loadChange,
  loadEvents,
  saveChange
} = require('./changeHelper')

const bot = new Telegraf.Composer()
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

  // TODO: Teilen Button
  // text += '\nAußerdem lassen sich die Änderungen teilen, sodass du auch anderen Leuten diese Änderung bereitstellen kannst.'

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

async function handleList(ctx) {
  const changes = ctx.state.userconfig.changes || []
  if (changes.length === 0) {
    return handleMainmenu(ctx)
  }

  let text = '*Veranstaltungsänderungen*\n'
  text += '\nWelche Änderung möchtest du betrachten?'

  const buttons = []
  for (const filename of changes) {
    const change = await loadChange(filename)
    buttons.push(Markup.callbackButton(generateShortChangeText(change), 'c:d:' + filename))
  }
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
}

function handleDetails(ctx, change) {
  const text = generateChangeText(change)
  const filename = filenameChange(change, ctx.from)
  const buttons = [
    // TODO: Teilen Button
    Markup.callbackButton('⚠️ Änderung entfernen', 'c:r:' + filename),
    Markup.callbackButton('🔙 zur Änderungsliste', 'c:list'),
    backToMainButton
  ]
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
}

async function handleFinishGeneration(ctx) {
  const change = ctx.session.generateChange
  const filename = await saveChange(ctx.from, change)

  if (!ctx.state.userconfig.changes) {
    ctx.state.userconfig.changes = []
  }
  ctx.state.userconfig.changes.push(filename)
  await ctx.userconfig.save()

  return Promise.all([
    ctx.answerCallbackQuery('Die Änderung wurde deinem Kalender hinzugefügt.'),
    handleDetails(ctx, change)
  ])
}


bot.command('changes', ctx => ctx.replyWithMarkdown(mainText(ctx), Extra.markup(mainMarkup(ctx))))
bot.action('c', handleMainmenu)

bot.action('c:list', handleList)

bot.action(/^c:d:(.+)$/, async ctx => handleDetails(ctx, await loadChange(ctx.match[1])))

bot.action(/^c:r:(.+)$/, async ctx => {
  const currentChanges = ctx.state.userconfig.changes || []
  ctx.state.userconfig.changes = currentChanges.filter(o => o !== ctx.match[1])
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
  return ctx.editMessageText('*Veranstaltungsänderungen*\n\nWelche Veranstaltung betrifft diese Veränderung?', Extra.markdown().markup(keyboardMarkup))
})

bot.action(/^c:g:n:(.+)$/, async ctx => { // change generate name
  ctx.session.generateChange = {
    name: ctx.match[1]
  }
  const events = await loadEvents(ctx.session.generateChange.name, 'utf8')
  const dates = events
    .map(o => o.StartTime)
    .map(o => o.toISOString().replace(':00.000Z', ''))
  // TODO: prüfen ob man bereits eine Änderung mit dem Namen und dem Datum hat.
  const buttons = generateCallbackButtons('c:g:d', dates)
  buttons.push(Markup.callbackButton('🔙 zurück zur Veranstaltungswahl', 'c:g'))
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText(generateChangeText(ctx.session.generateChange) + `\nWelchen Termin betrifft diese Veränderung?`, Extra.markdown().markup(keyboardMarkup))
})

bot.action(/^c:g:d:(.+)$/, stopGenerationAfterBotRestartMiddleware, ctx => { // change generate date
  ctx.session.generateChange.date = ctx.match[1]

  let text = generateChangeText(ctx.session.generateChange)
  text += '\nWelche Art von Änderung möchtest du vornehmen?'

  // TODO: remove on finish
  text += '\n\n_WIP: Mehr als das kann ich noch nicht._'

  const buttons = [
    Markup.callbackButton('🚫 Entfällt', 'c:g:remove')
  ]
  buttons.push(Markup.callbackButton('🔙 zurück zur Terminwahl', 'c:g:n:' + ctx.session.generateChange.name))
  buttons.push(backToMainButton)
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
})

bot.action('c:g:remove', stopGenerationAfterBotRestartMiddleware, ctx => { // change generate remove
  ctx.session.generateChange.remove = true
  return handleFinishGeneration(ctx)
})

// TODO: add more types
