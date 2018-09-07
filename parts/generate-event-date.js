const Telegraf = require('telegraf')

const {
  generateDateTimePickerButtons,
  generateSpartaDayButtons,
  generateMonthButtons,
  generateSpartaYearButtons,
  generateTimeSectionButtons
} = require('../lib/calendar-helper')
const {question} = require('../lib/telegraf-helper')

const {Extra, Markup} = Telegraf

const bot = new Telegraf.Composer()

function somethingStrangeMiddleware(ctx, next) {
  if (!ctx.session.generateEventDate) {
    const text = 'Ich hab den Faden verloren 🎈😴'
    if (ctx.updateType === 'callback_query') {
      return ctx.editMessageText(text)
    }
    return ctx.reply(text)
  }
  return next()
}

const prefix = 'ged'

function prefixedRegEx(pattern) {
  return new RegExp('^' + prefix + pattern + '$')
}

function start(ctx, args) {
  ctx.session.generateEventDate = {
    text: 'The text property was not set',
    finishActionCode: 'main',
    abortActionCode: 'main',
    ...args
  }

  const now = new Date(Date.now())
  ctx.session.generateEventDate.event = {
    year: now.getFullYear(),
    month: now.getMonth(),
    date: now.getDate(),
    ...args.event
  }

  return generateOverview(ctx)
}

function generateOverview(ctx) {
  const {text, extra} = generateOverviewParts(ctx)
  return ctx.editMessageText(text, extra)
}

function generateOverviewReply(ctx) {
  const {text, extra} = generateOverviewParts(ctx)
  return ctx.reply(text, extra)
}

function generateOverviewParts(ctx) {
  const info = ctx.session.generateEventDate || {}
  const event = info.event || {}
  const allNeededDataAvailable = event.date &&
    event.endtime &&
    event.month &&
    event.starttime &&
    event.year

  const buttons = generateDateTimePickerButtons(prefix + ':t', event.year, event.month, event.date, event.starttime, event.endtime)
  buttons.push([
    Markup.callbackButton(`📍 ${event.room || 'Raum'}`, prefix + ':room')
  ])
  buttons.push([
    Markup.callbackButton('✅ Fertig stellen', info.finishActionCode, !allNeededDataAvailable),
    Markup.callbackButton('🛑 Abbrechen', info.abortActionCode)
  ])

  const keyboard = Markup.inlineKeyboard(buttons)
  const extra = Extra.markdown().markup(keyboard)
  return {text: info.text, extra}
}

bot.action(prefix, ctx => generateOverviewReply(ctx))

const timePickText = 'Wähle den Zeitpunkt des Termins'
bot.action(prefix + ':t:date', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateSpartaDayButtons(ctx.match)))))
bot.action(prefix + ':t:month', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateMonthButtons(ctx.match)))))
bot.action(prefix + ':t:year', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateSpartaYearButtons(ctx.match)))))
bot.action(prefix + ':t:starttime', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateTimeSectionButtons(ctx.match)))))
bot.action(prefix + ':t:endtime', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateTimeSectionButtons(ctx.match)))))

bot.action(prefixedRegEx(':t:([^:]+):(.+)'), somethingStrangeMiddleware, ctx => {
  ctx.session.generateEventDate.event[ctx.match[1]] = ctx.match[2]
  return generateOverview(ctx)
})

bot.action(prefix + ':room', somethingStrangeMiddleware, question(bot, 'In welchem Raum findet der Termin statt?', somethingStrangeMiddleware, ctx => {
  ctx.session.generateEventDate.event.room = ctx.message.text
  return generateOverviewReply(ctx)
}))

module.exports = {
  bot,
  somethingStrangeMiddleware,
  start
}
