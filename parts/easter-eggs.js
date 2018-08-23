const Telegraf = require('telegraf')

const {Extra} = Telegraf

const bot = new Telegraf.Composer()
module.exports = bot

bot.on('edited_message', ctx => ctx.reply('Hui, jetzt wirds stressig. 😨\n\nIch kann doch nicht auch noch auf vergangene Nachrichten aufpassen!', Extra.inReplyTo(ctx.editedMessage.message_id)))

bot.on('channel_post', async ctx => {
  await ctx.reply('Adding a random bot as an admin to your channel is maybe not the best idea…\n\nSincerely, a random bot, added as an admin to this channel.')
  console.log(`leave the channel…`)
  return ctx.leaveChat(ctx.chat.id)
})
