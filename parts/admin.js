const TelegrafInlineMenu = require('telegraf-inline-menu')

function hide(ctx) {
  return !ctx.state.userconfig.admin
}

const menu = new TelegrafInlineMenu('admin', 'Hey Admin!')

const broadcastMenu = new TelegrafInlineMenu('admin:broadcast', 'Broadcast')

function setMessageToBroadcastText(ctx) {
  return ctx.session.adminBroadcast ?
    '✏️ Ändere Nachricht…' :
    '✏️ Setze Nachricht…'
}

function setMessageToBroadcast(ctx) {
  ctx.session.adminBroadcast = ctx.message.message_id
}

async function sendBroadcast(ctx) {
  await ctx.userconfig.forwardBroadcast(ctx.from.id, ctx.session.adminBroadcast)
  delete ctx.session.adminBroadcast
}

broadcastMenu.question('set', setMessageToBroadcastText, setMessageToBroadcast, {
  questionText: 'Hey admin! Was willst du broadcasten?'
})

broadcastMenu.button('send', '📤 Versende Broadcast', sendBroadcast, {
  hide: ctx => !ctx.session.adminBroadcast
})

menu.submenu('Broadcast', broadcastMenu)

module.exports = {
  menu,
  hide
}
