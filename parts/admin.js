const TelegrafInlineMenu = require('telegraf-inline-menu')

const {getUrl} = require('../lib/calendar-helper')

function hide(ctx) {
  return !ctx.state.userconfig.admin
}

const menu = new TelegrafInlineMenu('Hey Admin!')

const broadcastMenu = menu.submenu('Broadcast', 'broadcast', new TelegrafInlineMenu('Broadcast'))

function broadcastButtonText(ctx) {
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

broadcastMenu.question(broadcastButtonText, 'set', {
  setFunc: setMessageToBroadcast,
  questionText: 'Hey admin! Was willst du broadcasten?'
})

broadcastMenu.button('📤 Versende Broadcast', 'send', {
  doFunc: sendBroadcast,
  hide: ctx => !ctx.session.adminBroadcast
})

function nameOfUser({first_name: first, last_name: last, username}) {
  let name = first
  if (last) {
    name += ' ' + last
  }
  if (username) {
    name += ` (${username})`
  }
  return name
}

async function userQuicklookText(ctx) {
  if (!ctx.session.adminuserquicklook) {
    return 'Wähle einen Nutzer…'
  }

  const config = await ctx.userconfig.load(ctx.session.adminuserquicklook)

  let text = `URL: \`https://${getUrl(ctx.session.adminuserquicklook, config.config)}\``
  text += '\n```\n' + JSON.stringify(config, null, 2) + '\n```'

  return text
}

const userMenu = menu.submenu('User Quicklook', 'u', new TelegrafInlineMenu(userQuicklookText))

userMenu.urlButton('Kalender', async ctx => {
  const config = await ctx.userconfig.loadConfig(ctx.session.adminuserquicklook)
  return `https://${getUrl(ctx.session.adminuserquicklook, config)}`
}, {
  hide: ctx => !ctx.session.adminuserquicklook
})

function filterText(ctx) {
  let text = '🔎 Filter'
  if (ctx.session.adminuserquicklookfilter && ctx.session.adminuserquicklookfilter !== '.+') {
    text += ': ' + ctx.session.adminuserquicklookfilter
  }
  return text
}
userMenu.question(filterText, 'filter', {
  setFunc: (ctx, answer) => {
    ctx.session.adminuserquicklookfilter = answer
    delete ctx.session.adminuserquicklook
  },
  questionText: 'Wonach möchtest du die Nutzer filtern?'
})

userMenu.button('Filter aufheben', 'clearfilter', {
  doFunc: ctx => {
    delete ctx.session.adminuserquicklookfilter
    delete ctx.session.adminuserquicklook
  },
  joinLastRow: true,
  hide: ctx => !ctx.session.adminuserquicklookfilter || ctx.session.adminuserquicklookfilter === '.+'
})

async function userOptions(ctx) {
  const filter = ctx.session.adminuserquicklookfilter || '.+'
  const filterRegex = new RegExp(filter, 'i')
  const allConfigs = await ctx.userconfig.all(
    config => filterRegex.test(JSON.stringify(config))
  )
  const allChats = allConfigs.map(o => o.chat)

  allChats.sort((a, b) => {
    const nameA = nameOfUser(a)
    const nameB = nameOfUser(b)
    return nameA > nameB ? 1 : nameA < nameB ? -1 : 0
  })

  if (allChats.length > 0) {
    ctx.session.adminuserquicklook = allChats[0].id
  }

  const result = {}
  allChats
    .slice(0, 12)
    .forEach(chat => {
      result[String(chat.id)] = nameOfUser(chat)
    })
  return result
}

userMenu.select('u', userOptions, {
  setFunc: (ctx, selected) => {
    ctx.session.adminuserquicklook = selected
  },
  columns: 3
})

module.exports = {
  menu,
  hide
}
