import {Composer} from 'grammy'

import {MyContext} from '../lib/types.js'

export const bot = new Composer<MyContext>()

bot.on(
	'edited_message',
	async ctx => ctx.reply(
		'Hui, jetzt wirds stressig. 😨\n\nIch kann doch nicht auch noch auf vergangene Nachrichten aufpassen!',
		{reply_to_message_id: ctx.editedMessage.message_id},
	),
)

bot.on('channel_post', async ctx => {
	await ctx.reply('Adding a random bot as an admin to your channel is maybe not the best idea…\n\nSincerely, a random bot, added as an admin to this channel.')
	console.log(new Date(), 'leave the channel…', ctx.chat)
	await ctx.leaveChat()
})
