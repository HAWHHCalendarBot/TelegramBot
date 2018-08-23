const Telegraf = require('telegraf')

const {Extra, Markup} = Telegraf

const {
  generateChangeDescription,
  generateChangeText,
  generateChangeTextHeader,
  generateShortChangeText
} = require('./change-helper')

const bot = new Telegraf.Composer()
module.exports = bot

function generateInlineQueryResultFromChange(change, from) {
  const id = `${change.name}#${change.date}#${from.id}`
  return {
    description: generateChangeDescription(change),
    id,
    input_message_content: {
      message_text: generateChangeText(change),
      parse_mode: 'markdown'
    },
    reply_markup: Markup.inlineKeyboard([Markup.callbackButton('zu meinem Kalender hinzufügen', 'c:a:' + id)]),
    title: generateShortChangeText(change),
    type: 'article'
  }
}

function escapeRegexSpecificChars(input) {
  return input
    .replace('[', '\\[')
    .replace(']', '\\]')
    .replace('(', '\\(')
    .replace(')', '\\)')
}

bot.on('inline_query', ctx => {
  const regex = new RegExp(escapeRegexSpecificChars(ctx.inlineQuery.query), 'i')

  const changes = ctx.state.userconfig.changes || []
  const filtered = changes
    .filter(o => regex.test(generateShortChangeText(o)))
  const results = filtered.map(c => generateInlineQueryResultFromChange(c, ctx.from))

  return ctx.answerInlineQuery(results, {
    cache_time: 20,
    is_personal: true,
    switch_pm_parameter: 'changes',
    switch_pm_text: 'Zum Bot'
  })
})

async function preAddMiddleware(ctx, next) {
  const name = ctx.match[1]
  const date = ctx.match[2]
  const fromId = ctx.match[3]

  const myEvents = ctx.state.userconfig.events
  if (!myEvents.some(o => o === name)) {
    return ctx.answerCbQuery('Du besuchst diese Veranstaltung garnicht. 🤔')
  }

  try {
    const fromconfig = await ctx.userconfig.loadSpecific(fromId)
    const changesOfFrom = fromconfig.changes || []
    const searchedChange = changesOfFrom.filter(o => o.name === name && o.date === date)

    if (searchedChange.length !== 1) {
      throw new Error('User does not have this change')
    }

    ctx.state.addChange = searchedChange[0]
    return next()
  } catch (err) {
    return ctx.editMessageText('Die Veranstaltungsänderung existiert nicht mehr. 😔')
  }
}

bot.action(/^c:a:(.+)#(.+)#(.+)$/, preAddMiddleware, async ctx => {
  const name = ctx.match[1]
  const date = ctx.match[2]
  const fromId = ctx.match[3]
  const myChanges = ctx.state.userconfig.changes || []

  if (ctx.from.id === Number(fromId)) {
    return ctx.answerCbQuery('Das ist deine eigene Änderung 😉')
  }

  // Prüfen ob man bereits eine Änderung mit dem Namen und dem Datum hat.
  const myChangeToThisEvent = myChanges
    .filter(o => o.name === name && o.date === date)

  if (myChangeToThisEvent.length > 0) {
    const warning = '⚠️ Du hast bereits eine Änderung zu diesem Termin in deinem Kalender.'
    ctx.answerCbQuery(warning)

    const currentChange = myChangeToThisEvent[0]

    let text = warning + '\n'
    text += generateChangeTextHeader(currentChange)

    text += '\nDiese Veränderung ist bereits in deinem Kalender:'
    text += '\n' + generateChangeDescription(currentChange)

    text += '\nDiese Veränderung wolltest du hinzufügen:'
    text += '\n' + generateChangeDescription(ctx.state.addChange)

    const keyboardMarkup = Markup.inlineKeyboard([
      Markup.callbackButton('Überschreiben', `c:af:${name}#${date}#${fromId}`),
      Markup.callbackButton('Abbrechen', 'c:cancel')
    ])

    return ctx.telegram.sendMessage(ctx.from.id, text, Extra.markdown().markup(keyboardMarkup))
  }

  myChanges.push(ctx.state.addChange)
  ctx.state.userconfig.changes = myChanges
  await ctx.userconfig.save()

  return ctx.answerCbQuery('Die Änderung wurde hinzugefügt')
})

bot.action('c:cancel', ctx => ctx.editMessageText('Ich habe nichts verändert. 🙂'))

// Action: change add force
bot.action(/^c:af:(.+)#(.+)#(.+)$/, preAddMiddleware, async ctx => {
  const name = ctx.match[1]
  const date = ctx.match[2]
  let myChanges = ctx.state.userconfig.changes || []

  myChanges = myChanges.filter(o => o.name !== name || o.date !== date)
  myChanges.push(ctx.state.addChange)
  ctx.state.userconfig.changes = myChanges
  await ctx.userconfig.save()

  return ctx.editMessageText('Die Änderung wurde hinzugefügt.')
})
