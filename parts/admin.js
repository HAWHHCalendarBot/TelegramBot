const Telegraf = require('telegraf')

const {Extra, Markup} = Telegraf

const {question} = require('../lib/telegraf-helper')

const bot = new Telegraf.Composer()

function predicate(ctx) {
  return ctx.state.userconfig.admin
}

bot.command('start', (ctx, next) => {
  return Promise.all([
    ctx.replyWithMarkdown('Hey admin!\n\n*Commands*\n/broadcast'),
    next()
  ])
})

bot.command('broadcast', question(bot, 'Hey admin!\nWas möchtest du senden?', ctx => {
  return ctx.replyWithMarkdown(
    ctx.message.text,
    Extra.inReplyTo(ctx.message.message_id)
      .markup(
        Markup.inlineKeyboard([
          Markup.callbackButton('Broadcast!', 'broadcast!'),
          Markup.callbackButton('Clear Broadcast', 'clearinline')
        ])
      )
  )
}))

bot.action('broadcast!', ctx => {
  return Promise.all([
    ctx.userconfig.broadcast(ctx.callbackQuery.message.reply_to_message.text, Extra.markdown().markup(Markup.removeKeyboard())),
    ctx.editMessageReplyMarkup(Markup.inlineKeyboard([])),
    ctx.answerCbQuery('Broadcast wird versendet…')
  ])
})

bot.action('clearinline', ctx => {
  return Promise.all([
    ctx.editMessageReplyMarkup(Markup.inlineKeyboard([])),
    ctx.answerCbQuery('Inline Keyboard entfernt…')
  ])
})

module.exports = {
  bot: Telegraf.optional(predicate, bot),
  predicate
}
