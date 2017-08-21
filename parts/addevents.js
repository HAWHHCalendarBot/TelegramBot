const fs = require('fs')
const Telegraf = require('telegraf')

const { generateCallbackButtons } = require('../helper.js')

const Extra = Telegraf.Extra
const Markup = Telegraf.Markup


let allEvents = ['MINF-MD', 'MINF-TTI', 'BTI-SE2']
const resultLimit = 5

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

function replyKeyboardFromResults(results, page = 0) {
  const pages = Math.ceil(results.length / resultLimit)
  page = Math.max(0, Math.min(page, pages - 1))

  if (results.length > resultLimit) {
    results = results.slice(page * resultLimit)
  }
  if (results.length > resultLimit) {
    results = results.slice(0, resultLimit)
  }
  const eventKeys = generateCallbackButtons('a', results)

  const paginationKeys = []
  for (let i = 0; i < pages; i++) {
    if (i === page) {
      paginationKeys.push(Markup.callbackButton(`▶️ ${i + 1}`, `p:${i}`))
    } else {
      paginationKeys.push(Markup.callbackButton(`${i + 1}`, `p:${i}`))
    }
  }

  const keyboard = []
  for (const key of eventKeys) {
    keyboard.push([key])
  }
  keyboard.push(paginationKeys)

  return Markup.inlineKeyboard(keyboard)
}

function updateMessage(ctx) {
  const pattern = ctx.callbackQuery.message.reply_to_message.text
  const results = findEventsByPatternForUser(ctx, pattern)

  const keyboard = replyKeyboardFromResults(results, ctx.session.page)

  if (results.length === 0) {
    const text = 'Du hast alle Veranstaltungen hinzugefügt, die ich finden konnte.\nMit /start kannst du zurück zum Hauptmenü gehen oder mit /add weitere Veranstaltungen hinzufügen.'
    return ctx.editMessageText(text, Extra.markup(keyboard))
  } else {
    return ctx.editMessageReplyMarkup(keyboard)
  }
}


bot.hears(/.+/, Telegraf.optional(ctx => ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === addQuestion, ctx => {
  const pattern = ctx.match[0]
  const results = findEventsByPatternForUser(ctx, pattern)

  if (results.length === 0) {
    return ctx.reply('Ich konnte leider keine Veranstaltungen für deine Suche finden. 😬')
  }

  const text = 'Ich habe diese Veranstaltungen gefunden. Welche möchtest du hinzufügen?\n\nMit /start kannst du das Hauptmenü erneut aufrufen.'
  const keyboard = replyKeyboardFromResults(results)

  return ctx.replyWithMarkdown(text, Extra
    .inReplyTo(ctx.message.message_id)
    .markup(keyboard)
  )
}))

bot.action(/p:(\d+)/, ctx => {
  ctx.session.page = Number(ctx.match[1])
  return Promise.all([
    updateMessage(ctx),
    ctx.answerCallbackQuery('')
  ])
})

bot.action(/a:(.+)/, async ctx => {
  const event = ctx.match[1]

  const isExisting = allEvents.indexOf(event) >= 0
  const isAlreadyInCalendar = ctx.state.userconfig.events.indexOf(event) >= 0

  if (isExisting && !isAlreadyInCalendar) {
    ctx.state.userconfig.events.push(event)
    await ctx.userconfig.save()
  }

  updateMessage(ctx)

  // answerCallbackQuery
  if (!isExisting) {
    return ctx.answerCallbackQuery(`${event} existiert nicht!`)
  }

  if (isAlreadyInCalendar) {
    return ctx.answerCallbackQuery(`${event} ist bereits in deinem Kalender!`)
  }

  return ctx.answerCallbackQuery(`${event} wurde zu deinem Kalender hinzugefügt.`)
})
