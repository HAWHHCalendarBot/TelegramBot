import {Composer} from 'telegraf'
import {MenuTemplate, replyMenuToContext} from 'telegraf-inline-menu'
import TelegrafStatelessQuestion from 'telegraf-stateless-question'

import {backMainButtons} from '../../lib/inline-menu'
import {MyContext} from '../../lib/types'

export const bot = new Composer<MyContext>()
export const menu = new MenuTemplate<MyContext>('Broadcast')

function broadcastButtonText(context: MyContext): string {
	return context.session.adminBroadcast ?
		'✏️ Ändere Nachricht…' :
		'✏️ Setze Nachricht…'
}

const broadcastQuestion = new TelegrafStatelessQuestion<MyContext>('admin-broadcast', async context => {
	context.session.adminBroadcast = context.message.message_id
	await replyMenuToContext(menu, context, '/admin/broadcast/')
})

bot.use(broadcastQuestion.middleware())

menu.interact(broadcastButtonText, 'set', {
	do: async context => {
		await broadcastQuestion.replyWithMarkdown(context, 'Hey admin! Was willst du broadcasten?')
		return false
	}
})

menu.interact('📤 Versende Broadcast', 'send', {
	do: async context => {
		// TODO: broadcast takes some time. This should be done in parallel so the bot responds to normal users
		await context.userconfig.forwardBroadcast(context.from!.id, context.session.adminBroadcast!)
		delete context.session.adminBroadcast
		return false
	},
	hide: context => !context.session.adminBroadcast
})

menu.manualRow(backMainButtons)
