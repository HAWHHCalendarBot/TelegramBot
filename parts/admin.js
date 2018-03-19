const Telegraf = require('telegraf')

const Extra = Telegraf.Extra
const Markup = Telegraf.Markup


const bot = new Telegraf.Composer()
module.exports = bot

bot.command('start', (ctx, next) => {
  return Promise.all([
    ctx.replyWithMarkdown('Hey admin!\n\n*Commands*\n/broadcast'),
    next()
  ])
})

const broadcastQuestion = 'Hey admin!\nWas möchtest du senden?'

bot.command('broadcast', ctx => {
  return ctx.reply(broadcastQuestion, Markup.forceReply().extra())
})

bot.on('text', Telegraf.optional(ctx => ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === broadcastQuestion, ctx => {
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
