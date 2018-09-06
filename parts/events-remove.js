const Telegraf = require('telegraf')

const {generateInlineKeyboardMarkup} = require('../lib/telegraf-helper')

const {Markup} = Telegraf

function generateRemoveKeyboard(ctx) {
  return generateInlineKeyboardMarkup('r', ctx.state.userconfig.events, 1)
}

const bot = new Telegraf.Composer()

bot.command('remove', removeHandler)

function removeHandler(ctx) {
  if (ctx.state.userconfig.events.length === 0) {
    return ctx.reply('Du hast keine Veranstaltungen mehr im Kalender, die man entfernen könnte. 🤔')
  }

  return ctx.reply('Welche Veranstaltung möchtest du aus deinem Kalender entfernen?', generateRemoveKeyboard(ctx).extra())
}

bot.action(/^r:(.+)$/, ctx => {
  const event = ctx.match[1]

  ctx.state.userconfig.events = ctx.state.userconfig.events.filter(e => e !== event)

  // Remove changes to that event too
  const currentChanges = ctx.state.userconfig.changes || []
  ctx.state.userconfig.changes = currentChanges.filter(o => o.name !== event)

  // Update message
  if (ctx.state.userconfig.events.length === 0) {
    ctx.editMessageText('Alle deine Veranstaltungen wurden bereits aus dem Kalender entfernt. 😳', Markup.inlineKeyboard([]).extra())
  } else {
    ctx.editMessageReplyMarkup(generateRemoveKeyboard(ctx))
  }

  return ctx.answerCbQuery(`${event} wurde aus deinem Kalender entfernt.`)
})

module.exports = {
  bot
}
