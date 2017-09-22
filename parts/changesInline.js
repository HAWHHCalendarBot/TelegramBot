const Telegraf = require('telegraf')
const { Extra, Markup } = Telegraf

const {
  filenameChange,
  generateChangeDescription,
  generateChangeText,
  generateChangeTextHeader,
  generateShortChangeText,
  hasAlreadyChangeOfThatEvent,
  loadChange
} = require('./changeHelper')

const bot = new Telegraf.Composer()
module.exports = bot

function generateInlineQueryResultFromChangeFilename(change) {
  const filename = filenameChange(change)
  return {
    description: generateChangeDescription(change),
    id: filename,
    input_message_content: {
      message_text: generateChangeText(change),
      parse_mode: 'markdown'
    },
    reply_markup: Markup.inlineKeyboard([ Markup.callbackButton('zu meinem Kalender hinzufügen', 'c:a:' + filename) ]),
    title: generateShortChangeText(change),
    type: 'article'
  }
}


bot.on('inline_query', async ctx => {
  const regex = new RegExp(ctx.inlineQuery.query, 'i')

  const changeFilenames = ctx.state.userconfig.changes || []
  const changes = await Promise.all(changeFilenames.map(o => loadChange(o)))
  const filtered = changes
    .filter(o => regex.test(generateShortChangeText(o)))
  const results = filtered.map(generateInlineQueryResultFromChangeFilename)

  return ctx.answerInlineQuery(results, {
    cache_time: 20,
    is_personal: true,
    switch_pm_parameter: 'changes',
    switch_pm_text: 'Zum Bot'
  })
})

async function precheckAddMiddleware(ctx, next) {
  const filename = ctx.match[1]
  try {
    ctx.state.addChange = await loadChange(filename)
    if (!ctx.state.userconfig.changes) {
      ctx.state.userconfig.changes = []
    }
    return next()
  } catch (err) {
    return ctx.editMessageText('Die Veranstaltungsänderung existiert nicht mehr. 😔')
  }
}

bot.action(/^c:a:(.+)$/, precheckAddMiddleware, async ctx => {
  const filename = ctx.match[1]
  const myChangeFilenames = ctx.state.userconfig.changes

  if (myChangeFilenames.indexOf(filename) >= 0) {
    return ctx.answerCallbackQuery('Du hast diese Änderung bereits in deinem Kalender 👍')
  }

  // prüfen ob man bereits eine Änderung mit dem Namen und dem Datum hat.
  const myCurrentChangeFilename = hasAlreadyChangeOfThatEvent(myChangeFilenames, filename)
  if (myCurrentChangeFilename) {
    const warning = '⚠️ Du hast bereits eine Änderung zu diesem Termin in deinem Kalender.'
    ctx.answerCallbackQuery(warning)

    const currentChange = await loadChange(myCurrentChangeFilename)

    let text = warning + '\n'
    text += generateChangeTextHeader(currentChange)

    text += '\nDiese Veränderung ist bereits in deinem Kalender:'
    text += '\n' + generateChangeDescription(currentChange)

    text += '\nDiese Veränderung wolltest du hinzufügen:'
    text += '\n' + generateChangeDescription(ctx.state.addChange)

    const keyboardMarkup = Markup.inlineKeyboard([
      Markup.callbackButton('Überschreiben', 'c:af:' + filename),
      Markup.callbackButton('Abbrechen', 'c:cancel')
    ])

    return ctx.telegram.sendMessage(ctx.from.id, text, Extra.markdown().markup(keyboardMarkup))
  }

  ctx.state.userconfig.changes.push(filename)
  ctx.state.userconfig.changes.sort()
  await ctx.userconfig.save()

  return ctx.answerCallbackQuery('Die Änderung wurde hinzugefügt')
})

bot.action('c:cancel', ctx => ctx.editMessageText('Ich habe nichts verändert. 🙂'))

bot.action(/^c:af:(.+)$/, precheckAddMiddleware, async ctx => { // change add force
  const filename = ctx.match[1]
  let myChangeFilenames = ctx.state.userconfig.changes

  if (myChangeFilenames.indexOf(filename) >= 0) {
    return ctx.editMessageText('Du hast diese Änderung bereits in deinem Kalender 👍')
  }

  const myCurrentChangeFilename = hasAlreadyChangeOfThatEvent(myChangeFilenames, filename)
  myChangeFilenames = myChangeFilenames.filter(o => o !== myCurrentChangeFilename)
  myChangeFilenames.push(filename)
  myChangeFilenames.sort()
  ctx.state.userconfig.changes = myChangeFilenames
  await ctx.userconfig.save()

  return ctx.editMessageText('Die Änderung wurde hinzugefügt.')
})
