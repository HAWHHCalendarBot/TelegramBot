import TelegrafInlineMenu from 'telegraf-inline-menu'

import {MyContext} from '../../lib/types'

export const menu = new TelegrafInlineMenu('Broadcast')

function broadcastButtonText(ctx: MyContext) {
	return ctx.session.adminBroadcast ?
		'✏️ Ändere Nachricht…' :
		'✏️ Setze Nachricht…'
}

function setMessageToBroadcast(ctx: MyContext) {
	ctx.session.adminBroadcast = ctx.message!.message_id
}

async function sendBroadcast(ctx: MyContext) {
	// TODO: broadcast takes some time. This should be done in parallel so the bot responds to normal users
	await ctx.userconfig.forwardBroadcast(ctx.from!.id, ctx.session.adminBroadcast!)
	delete ctx.session.adminBroadcast
}

menu.question(broadcastButtonText as any, 'set', {
	setFunc: setMessageToBroadcast as any,
	uniqueIdentifier: 'admin-broadcast',
	questionText: 'Hey admin! Was willst du broadcasten?'
})

menu.button('📤 Versende Broadcast', 'send', {
	doFunc: sendBroadcast as any,
	hide: ctx => !(ctx as MyContext).session.adminBroadcast
})
