const fsPromises = require('fs').promises

const Telegraf = require('telegraf')

const {generateCallbackButtons} = require('../lib/telegraf-helper')

const generateEventDate = require('./generate-event-date')

const {Extra, Markup} = Telegraf

async function readJsonFile(file) {
  return JSON.parse(await fsPromises.readFile(file, 'utf8'))
}
function writeJsonFile(file, data) {
  return fsPromises.writeFile(file, JSON.stringify(data), 'utf8')
}

const bot = new Telegraf.Composer()

function predicate(ctx) {
  return (ctx.state.userconfig.additionalEvents || []).length > 0
}

bot.command('additionalEvents', ctx => {
  const {text, extra} = main(ctx)
  return ctx.reply(text, extra)
})

bot.action('aE', ctx => {
  const {text, extra} = main(ctx)
  return ctx.editMessageText(text, extra)
})

function main(ctx) {
  let text = 'Hier kannst du bei deiner / deinen Veranstaltungen Termine hinzufügen oder entfernen. Diese erscheinen für alle unter den möglichen, hinzufügbaren Veranstaltungen. Du hast diese automatisch im Kalender.'

  text += '\n\n⚠️ Der geringste Teil der Nutzer ist Veranstalter. Daher ist diese Funktionalität etwas spartanisch gestaltet. Denke bitte selbst ein bisschen mit, was du tust. Zum Beispiel hat nicht jeder Monat 31 Tage 😉'

  const buttons = generateCallbackButtons('aE:event', ctx.state.userconfig.additionalEvents || [])
  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})
  const extra = Extra.markdown().markup(keyboardMarkup)
  return {text, extra}
}

bot.action(/^aE:event:(.+)$/, ctx => {
  const name = ctx.match[1]
  const keyboardMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('Termin hinzufügen', 'aE:add:' + name),
    Markup.callbackButton('Termin duplizieren / anpassen', 'aE:duplicate:' + name),
    Markup.callbackButton('Termin entfernen', 'aE:remove:' + name),
    Markup.callbackButton('Zurück…', 'aE')
  ], {columns: 1})
  return ctx.editMessageText(`*${name}*`, Extra.markdown().markup(keyboardMarkup))
})

function beginEventDateGeneration(ctx, name, event) {
  return generateEventDate.start(ctx, {
    text: 'Bestimme die Details des Termins',
    finishActionCode: 'aE:finish',
    abortActionCode: 'aE:event:' + name,
    event
  })
}

bot.action(/^aE:add:(.+)$/, ctx => {
  const name = ctx.match[1]
  return beginEventDateGeneration(ctx, name, {name})
})

bot.action('aE:finish', generateEventDate.somethingStrangeMiddleware, async ctx => {
  const data = ctx.session.generateEventDate.event
  const filename = `additionalEvents/${data.name.replace('/', '-')}.json`
  let current = []
  try {
    current = await readJsonFile(filename)
  } catch (error) {}

  // Remove events at the same time
  const future = current.filter(o => Number(o.year) !== Number(data.year) ||
    Number(o.month) !== Number(data.month) ||
    Number(o.date) !== Number(data.date) ||
    o.starttime !== data.starttime)

  future.push(data)
  await writeJsonFile(filename, future)

  const outputText = future.length === current.length ? 'Geändert.' : 'Hinzugefügt.'
  return Promise.all([
    ctx.answerCbQuery(outputText),
    ctx.editMessageText(outputText)
  ])
})

async function getEventsButtons(ctx, name, type) {
  let eventsAvailable = []
  try {
    eventsAvailable = await readJsonFile(`additionalEvents/${name.replace('/', '-')}.json`)
  } catch (error) {}

  const buttons = eventsAvailable.map(e => Markup.callbackButton(`${e.name} ${e.date}.${e.month}.${e.year} ${e.starttime}`, `aE:${type}:${e.name}:${e.year}-${e.month}-${e.date}T${e.starttime}`))
  return buttons
}

bot.action(/^aE:duplicate:(.+)/, async ctx => {
  const name = ctx.match[1]
  let text = 'Welchen Termin möchtest du duplizieren / anpassen?'
  text += '\n'
  text += '\nBeim Speichern des neuen Termins wird ein zeitgleich startender Termin überschrieben -> quasi bearbeitet.'

  const buttons = await getEventsButtons(ctx, name, 'd')

  buttons.push(Markup.callbackButton('🛑 Abbrechen', 'aE:event:' + name))
  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})
  return ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
})

bot.action(/^aE:d:(.+):(\d+)-(\d+)-(\d+)T(\d?\d:\d{2})$/, async ctx => {
  const name = ctx.match[1]
  const filename = `additionalEvents/${name.replace('/', '-')}.json`
  const current = await readJsonFile(filename)
  const searched = current.filter(o => Number(o.year) === Number(ctx.match[2]) &&
    Number(o.month) === Number(ctx.match[3]) &&
    Number(o.date) === Number(ctx.match[4]) &&
    o.starttime === ctx.match[5])

  return beginEventDateGeneration(ctx, name, searched[0])
})

bot.action(/^aE:remove:(.+)$/, async ctx => {
  const name = ctx.match[1]
  const buttons = await getEventsButtons(ctx, name, 'r')

  buttons.push(Markup.callbackButton('🛑 Abbrechen', 'aE:event:' + name))
  const keyboardMarkup = Markup.inlineKeyboard(buttons, {columns: 1})
  return ctx.editMessageText('Welchen Termin möchtest du entfernen?', Extra.markdown().markup(keyboardMarkup))
})

bot.action(/^aE:r:(.+):(\d+)-(\d+)-(\d+)T(\d?\d:\d{2})$/, async ctx => {
  const name = ctx.match[1]
  const filename = `additionalEvents/${name.replace('/', '-')}.json`
  const current = await readJsonFile(filename)
  const future = current.filter(o => Number(o.year) !== Number(ctx.match[2]) ||
    Number(o.month) !== Number(ctx.match[3]) ||
    Number(o.date) !== Number(ctx.match[4]) ||
    o.starttime !== ctx.match[5])
  await writeJsonFile(filename, future)
  return Promise.all([
    ctx.answerCbQuery('Entfernt.'),
    ctx.editMessageText('Entfernt.')
  ])
})

module.exports = {
  bot: Telegraf.optional(predicate, bot),
  predicate
}
