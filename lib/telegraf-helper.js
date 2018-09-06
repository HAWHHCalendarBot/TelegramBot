const Telegraf = require('telegraf')

const {Extra, Markup} = Telegraf

function generateCallbackButton(type, value) {
  return Markup.callbackButton(`${value}`, type + ':' + value)
}

function generateCallbackButtons(type, values) {
  return values.map(o => generateCallbackButton(type, o))
}

function generateInlineKeyboardMarkup(type, entries, columns = 2) {
  return Markup.inlineKeyboard(generateCallbackButtons(type, entries), {columns})
}

function question(bot, text, ...fns) {
  bot.on('text', Telegraf.optional(ctx => ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === text, ...fns))

  return async ctx => {
    const extra = Extra.markup(Markup.forceReply())
    await ctx.reply(text, extra)
    if (ctx.updateType === 'callback_query') {
      await ctx.deleteMessage()
    }
  }
}

module.exports = {
  generateCallbackButton,
  generateCallbackButtons,
  generateInlineKeyboardMarkup,
  question
}
