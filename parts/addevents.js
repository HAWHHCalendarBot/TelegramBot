const fs = require('fs')
const Telegraf = require('telegraf')

const generateInlineKeyboardMarkup = require('../helper.js').generateInlineKeyboardMarkup

const Extra = Telegraf.Extra
const Markup = Telegraf.Markup


let allEvents = ['MINF-MD', 'MINF-TTI', 'BTI-SE2']
const resultLimit = 10

setInterval(updateEvents, 1000 * 60 * 60)
updateEvents()

function updateEvents() {
  const data = fs.readFileSync('eventfiles/all.txt', 'utf8')
  const list = data.split('\n').filter(element => element !== '')
  console.log(new Date(), list.length, 'Events geladen.')
  allEvents = list
}


function findEventsByPatternForUser(ctx, pattern) {
  const regex = new RegExp(pattern, 'i')
  const blacklist = ctx.state.userconfig.events

  const filtered = allEvents.filter(event => regex.test(event) && !blacklist.some(v => v === event))
  return filtered
}

const bot = new Telegraf.Composer()
module.exports = bot


bot.command('add', addHandler)

const addQuestion = 'Welches Event möchtest du hinzufügen? Gebe mir einen Teil des Namens, dann suche ich danach.'

function addHandler(ctx) {
  return ctx.reply(addQuestion, Extra.markup(Markup.forceReply()))
}

function replyTextFromResults(results) {
  let text = 'Ich habe diese Veranstaltungen gefunden. Welche möchtest du hinzufügen?'

  if (results.length > resultLimit) {
    text += `\nDie Suche hatte ${results.length} Treffer. Die Ergebnisse wurden auf ${resultLimit} gekürzt.`
  }
  return text
}

bot.hears(/.+/, Telegraf.optional(ctx => ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === addQuestion, ctx => {
  const pattern = ctx.match[0]
  let results = findEventsByPatternForUser(ctx, pattern)

  if (results.length === 0) {
    return ctx.reply('Ich konnte leider keine Veranstaltungen für deine Suche finden. 😬')
  }

  const text = replyTextFromResults(results)
  if (results.length > resultLimit) {
    results = results.slice(0, resultLimit)
  }

  return ctx.replyWithMarkdown(text, Extra
    .inReplyTo(ctx.message.message_id)
    .markup(generateInlineKeyboardMarkup('a', results, 1))
  )
}))

bot.action(/a:(.+)/, async ctx => {
  const event = ctx.match[1]

  const isExisting = allEvents.indexOf(event) >= 0
  const isAlreadyInCalendar = ctx.state.userconfig.events.indexOf(event) >= 0

  if (isExisting && !isAlreadyInCalendar) {
    ctx.state.userconfig.events.push(event)
    await ctx.userconfig.save()
  }


  // Update message
  const pattern = ctx.update.callback_query.message.reply_to_message.text
  let results = findEventsByPatternForUser(ctx, pattern)

  if (results.length === 0) {
    ctx.editMessageText('Du hast alle Veranstaltungen hinzugefügt, die ich finden konnte.\nMit /list kannst du dir die Liste deiner Veranstaltungen ansehen oder mit /remove Veranstaltungen aus deinem Kalender entfernen.', Markup.inlineKeyboard([]).extra())
  } else {
    const text = replyTextFromResults(results)
    if (results.length > resultLimit) {
      results = results.slice(0, resultLimit)
    }

    ctx.editMessageText(text, generateInlineKeyboardMarkup('a', results, 1).extra())
  }


  // answerCallbackQuery
  if (!isExisting) {
    return ctx.answerCallbackQuery(`${event} existiert nicht!`)
  }

  if (isAlreadyInCalendar) {
    return ctx.answerCallbackQuery(`${event} ist bereits in deinem Kalender!`)
  }

  return ctx.answerCallbackQuery(`${event} wurde zu deinem Kalender hinzugefügt.`)
})
