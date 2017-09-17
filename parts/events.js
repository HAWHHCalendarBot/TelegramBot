const Telegraf = require('telegraf')

const generateInlineKeyboardMarkup = require('../helper.js').generateInlineKeyboardMarkup

const { Extra, Markup } = Telegraf

function generateRemoveKeyboard(ctx) {
  return generateInlineKeyboardMarkup('r', ctx.state.userconfig.events, 1)
}

const bot = new Telegraf.Composer()
module.exports = bot

bot.command('list', ctx => {
  const events = 'Du hast aktuell folgende *Veranstaltungen* in deinem Kalender:\n' + ctx.state.userconfig.events.map(s => '- ' + s).join('\n')
  const noEvents = 'Du hast aktuell keine Veranstaltungen in deinem Kalender. 😔'

  let text
  let hint = '\n\nNutze /add um Veranstaltungen hinzuzufügen'

  if (ctx.state.userconfig.events.length === 0) {
    text = noEvents
    hint += '.'
  } else {
    text = events
    hint += ' oder /remove um Veranstaltungen aus deinem Kalender zu entfernen.'
    hint += ' Unter /start findest du den Link zu deinem Kalender.'
  }
  return ctx.replyWithMarkdown(text + hint, Extra.markup(Markup.removeKeyboard()))
})


bot.command('remove', removeHandler)

function removeHandler(ctx) {
  if (ctx.state.userconfig.events.length === 0) {
    return ctx.reply('Du hast keine Veranstaltungen mehr im Kalender, die man entfernen könnte. 🤔')
  }

  return ctx.reply('Welche Veranstaltung möchtest du aus deinem Kalender entfernen?', generateRemoveKeyboard(ctx).extra())
}

bot.action(/^r:(.+)$/, async ctx => {
  const event = ctx.match[1]

  ctx.state.userconfig.events = ctx.state.userconfig.events.filter(e => e !== event)
  await ctx.userconfig.save()


  // Update message
  if (ctx.state.userconfig.events.length === 0) {
    ctx.editMessageText('Alle deine Veranstaltungen wurden bereits aus dem Kalender entfernt. 😳', Markup.inlineKeyboard([]).extra())
  } else {
    ctx.editMessageReplyMarkup(generateRemoveKeyboard(ctx))
  }


  // answerCallbackQuery
  return ctx.answerCallbackQuery(`${event} wurde aus deinem Kalender entfernt.`)
})
