const Telegraf = require('telegraf')

const allEvents = require('../lib/all-events')
const {generateCallbackButtons, question} = require('../lib/telegraf-helper')

const {Extra, Markup} = Telegraf

const resultLimit = 5

function findEventsByPatternForUser(ctx, pattern) {
  const blacklist = ctx.state.userconfig.events
    .concat(ctx.state.userconfig.additionalEvents || [])

  return allEvents.find(pattern, blacklist)
}

const bot = new Telegraf.Composer()

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
  if (pages > 1) {
    keyboard.push(paginationKeys)
  }

  return Markup.inlineKeyboard(keyboard)
}

function updateMessage(ctx) {
  const pattern = ctx.callbackQuery.message.reply_to_message.text
  const results = findEventsByPatternForUser(ctx, pattern)

  const keyboard = replyKeyboardFromResults(results, ctx.session.page)

  if (results.length === 0) {
    const text = 'Du hast alle Veranstaltungen hinzugefügt, die ich finden konnte.\nMit /start kannst du zurück zum Hauptmenü gehen oder mit /add weitere Veranstaltungen hinzufügen. Mit /subscribe bekommst du deinen Kalender auf dein bevorzugtes Gerät.'
    return ctx.editMessageText(text, Extra.markup(keyboard))
  }

  return ctx.editMessageReplyMarkup(keyboard)
}

bot.command('add', question(bot, 'Welche Veranstaltung möchtest du hinzufügen? Gebe mir einen Teil des Namens, dann suche ich danach.', ctx => {
  const pattern = ctx.match[0]
  const results = findEventsByPatternForUser(ctx, pattern)

  if (results.length === 0) {
    return ctx.reply('Ich konnte leider keine Veranstaltungen für deine Suche finden. 😬')
  }

  const text = 'Ich habe diese Veranstaltungen gefunden. Welche möchtest du hinzufügen?\n\nMit /start kannst du das Hauptmenü erneut aufrufen und mit /subscribe bekommst du deinen Kalender auf dein bevorzugtes Gerät.'
  const keyboard = replyKeyboardFromResults(results)

  return ctx.replyWithMarkdown(text, Extra
    .inReplyTo(ctx.message.message_id)
    .markup(keyboard)
  )
}))

bot.action(/^p:(\d+)$/, ctx => {
  ctx.session.page = Number(ctx.match[1])
  return Promise.all([
    updateMessage(ctx),
    ctx.answerCbQuery('')
  ])
})

bot.action(/^a:(.+)$/, ctx => {
  const event = ctx.match[1]

  const isExisting = allEvents.exists(event)
  const isAlreadyInCalendar = ctx.state.userconfig.events
    .concat(ctx.state.userconfig.additionalEvents || [])
    .indexOf(event) >= 0

  if (isExisting && !isAlreadyInCalendar) {
    ctx.state.userconfig.events.push(event)
    ctx.state.userconfig.events.sort()
  }

  updateMessage(ctx)

  if (!isExisting) {
    return ctx.answerCbQuery(`${event} existiert nicht!`)
  }

  if (isAlreadyInCalendar) {
    return ctx.answerCbQuery(`${event} ist bereits in deinem Kalender!`)
  }

  return ctx.answerCbQuery(`${event} wurde zu deinem Kalender hinzugefügt.`)
})

module.exports = {
  bot
}
