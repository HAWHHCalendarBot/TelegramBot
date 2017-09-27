const fs = require('fs')
const Telegraf = require('telegraf')
const util = require('util')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

async function readJsonFile(file) { return JSON.parse(await readFile(file, 'utf8')) }
function writeJsonFile(file, data) { return writeFile(file, JSON.stringify(data), 'utf8') }

const {
  generateDateTimePickerButtons,
  generateMonthButtons,
  generateSpartaDayButtons,
  generateSpartaYearButtons,
  generateTimeSectionButtons
} = require('../lib/calendarHelper')
const { generateCallbackButtons } = require('../lib/telegrafHelper')

const { Extra, Markup } = Telegraf


const bot = new Telegraf.Composer()
module.exports = bot

function somethingStrangeMiddleware(ctx, next) {
  if (!ctx.session.additionalEvents) {
    return ctx.editMessageText('Ich hab den Faden verloren 🎈😴')
  }
  return next()
}

function handleEventOverview(ctx) {
  const keyboardMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('Termin hinzufügen', 'aE:add'),
    Markup.callbackButton('Termin duplizieren / anpassen', 'aE:duplicate'),
    Markup.callbackButton('Termin entfernen', 'aE:remove')
  ], { columns: 1 })
  return ctx.editMessageText(`*${ctx.session.additionalEvents.name}*`, Extra.markdown().markup(keyboardMarkup))
}

function handleAddEvent(ctx) {
  const data = ctx.session.additionalEvents || {}
  const allNeededDataAvailable = data.date &&
    data.endtime &&
    data.month &&
    data.room &&
    data.starttime &&
    data.year

  const buttons = generateDateTimePickerButtons('aE:add:t', data.year, data.month, data.date, data.starttime, data.endtime)
  buttons.push([ Markup.callbackButton(`📍 ${data.room || 'Raum'}`, 'aE:add:room') ])
  buttons.push([
    Markup.callbackButton('✅ Fertig stellen', 'aE:add:finish', !allNeededDataAvailable),
    Markup.callbackButton('🛑 Abbrechen', 'aE:event:' + data.name)
  ])
  return ctx.editMessageText('Bestimme die Details des Termins', Extra.markup(Markup.inlineKeyboard(buttons)))
}

bot.command('additionalEvents', ctx => {
  let text = 'Hier kannst du bei deiner / deinen Veranstaltungen Termine hinzufügen oder entfernen. Diese erscheinen für alle unter den möglichen, hinzufügbaren Veranstaltungen. Du hast diese automatisch im Kalender.'

  text += '\n\n⚠️ Der geringste Teil der Nutzer ist Veranstalter. Daher ist diese Funktionalität etwas spartanisch gestaltet. Denke bitte selbst ein bisschen mit, was du tust. Zum Beispiel hat nicht jeder Monat 31 Tage 😉'

  const buttons = generateCallbackButtons('aE:event', ctx.state.userconfig.additionalEvents || [])
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.replyWithMarkdown(text, Extra.markup(keyboardMarkup))
})

bot.action(/^aE:event:(.+)$/, ctx => {
  ctx.session.additionalEvents = {
    name: ctx.match[1],
    year: new Date(Date.now()).getFullYear()
  }
  return handleEventOverview(ctx)
})

bot.action('aE:add', ctx => handleAddEvent(ctx))

const timePickText = 'Wähle den Zeitpunkt des Termins'
bot.action('aE:add:t:date', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateSpartaDayButtons(ctx.match)))))
bot.action('aE:add:t:month', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateMonthButtons(ctx.match)))))
bot.action('aE:add:t:year', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateSpartaYearButtons(ctx.match)))))
bot.action('aE:add:t:starttime', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateTimeSectionButtons(ctx.match)))))
bot.action('aE:add:t:endtime', somethingStrangeMiddleware, ctx => ctx.editMessageText(timePickText, Extra.markup(Markup.inlineKeyboard(generateTimeSectionButtons(ctx.match)))))

bot.action(/^aE:add:t:([^:]+):(.+)$/, somethingStrangeMiddleware, ctx => {
  ctx.session.additionalEvents[ctx.match[1]] = ctx.match[2]
  return handleAddEvent(ctx)
})

const roomQuestion = 'In welchem Raum findet der Termin statt?'
bot.action('aE:add:room', somethingStrangeMiddleware, ctx => {
  return Promise.all([
    ctx.editMessageText('⬇️'),
    ctx.reply(roomQuestion, Extra.markup(Markup.forceReply()))
  ])
})

function isRoomAnswerMiddleware(ctx, next) {
  if (!ctx.session.additionalEvents) { return }
  if (ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === roomQuestion) { return next() }
}
bot.hears(/.+/, isRoomAnswerMiddleware, ctx => {
  ctx.session.additionalEvents.room = ctx.message.text
  const keyboardMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('Ja!', 'aE:add'),
    Markup.callbackButton('Nein.', 'aE:add:room')
  ])
  ctx.reply(`Ist '${ctx.session.additionalEvents.room}' korrekt?`, Extra.markup(keyboardMarkup))
})

bot.action('aE:add:finish', somethingStrangeMiddleware, async ctx => {
  const data = ctx.session.additionalEvents
  const filename = `additionalEvents/${data.name}.json`
  let current = []
  try {
    current = await readJsonFile(filename)
  } catch (err) {}

  // remove events at the same time
  const future = current.filter(o => Number(o.year) !== Number(data.year) ||
    Number(o.month) !== Number(data.month) ||
    Number(o.date) !== Number(data.date) ||
    o.starttime !== data.starttime)

  future.push(data)
  await writeJsonFile(filename, future)

  const outputText = future.length === current.length ? 'Geändert.' : 'Hinzugefügt.'
  return Promise.all([
    ctx.answerCallbackQuery(outputText),
    ctx.editMessageText(outputText)
  ])
})

async function getEventsButtons(ctx) {
  let eventsAvailable = []
  try {
    eventsAvailable = await readJsonFile(`additionalEvents/${ctx.session.additionalEvents.name}.json`)
  } catch (err) {}

  const buttons = eventsAvailable.map(e => Markup.callbackButton(`${e.name} ${e.date}.${e.month}.${e.year} ${e.starttime}`, `aE:d:${e.name}:${e.year}-${e.month}-${e.date}T${e.starttime}`))
  return buttons
}

bot.action('aE:duplicate', somethingStrangeMiddleware, async ctx => {
  let text = 'Welchen Termin möchtest du duplizieren / anpassen?'
  text += '\n'
  text += '\nBeim Speichern des neuen Termins wird ein zeitgleich startender Termin überschrieben -> quasi bearbeitet.'

  const buttons = await getEventsButtons(ctx)

  buttons.push(Markup.callbackButton('🛑 Abbrechen', 'aE:event:' + ctx.session.additionalEvents.name))
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
})

bot.action(/^aE:d:(.+):(\d+)-(\d+)-(\d+)T(\d{2}:\d{2})$/, async ctx => {
  const filename = `additionalEvents/${ctx.match[1]}.json`
  const current = await readJsonFile(filename)
  const searched = current.filter(o => Number(o.year) === Number(ctx.match[2]) &&
    Number(o.month) === Number(ctx.match[3]) &&
    Number(o.date) === Number(ctx.match[4]) &&
    o.starttime === ctx.match[5])
  ctx.session.additionalEvents = searched[0]
  return handleAddEvent(ctx)
})


bot.action('aE:remove', somethingStrangeMiddleware, async ctx => {
  const buttons = await getEventsButtons(ctx)

  buttons.push(Markup.callbackButton('🛑 Abbrechen', 'aE:event:' + ctx.session.additionalEvents.name))
  const keyboardMarkup = Markup.inlineKeyboard(buttons, { columns: 1 })
  return ctx.editMessageText('Welchen Termin möchtest du entfernen?', Extra.markdown().markup(keyboardMarkup))
})

bot.action(/^aE:r:(.+):(\d+)-(\d+)-(\d+)T(\d{2}:\d{2})$/, async ctx => {
  const filename = `additionalEvents/${ctx.match[1]}.json`
  const current = await readJsonFile(filename)
  const future = current.filter(o => Number(o.year) !== Number(ctx.match[2]) ||
    Number(o.month) !== Number(ctx.match[3]) ||
    Number(o.date) !== Number(ctx.match[4]) ||
    o.starttime !== ctx.match[5])
  await writeJsonFile(filename, future)
  return Promise.all([
    ctx.answerCallbackQuery('Entfernt.'),
    ctx.editMessageText('Entfernt.')
  ])
})
