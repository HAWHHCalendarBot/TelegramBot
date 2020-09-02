const TelegrafInlineMenu = require('telegraf-inline-menu')

const {getUrl} = require('../../lib/calendar-helper')
const {filteredOptions} = require('../../lib/inline-menu-helper')

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

const menu = new TelegrafInlineMenu(userQuicklookText)

menu.urlButton('Kalender', async ctx => {
  const config = await ctx.userconfig.loadConfig(ctx.session.adminuserquicklook)
  return `https://${getUrl(ctx.session.adminuserquicklook, config)}`
}, {
  hide: ctx => !ctx.session.adminuserquicklook
})

filteredOptions(menu, {
  uniqueIdentifier: 'admin-user-filter',
  uniqueQuestionText: 'Wonach möchtest du die Nutzer filtern?',
  getCurrentFilterFunc: ctx => ctx.session.adminuserquicklookfilter,
  setCurrentFilterFunc: (ctx, filter) => {
    ctx.session.adminuserquicklookfilter = filter
    delete ctx.session.adminuserquicklook
  },
  getFilteredOptionsFunc: userOptions,
  columns: 2,
  maxRows: 5,
  setFunc: (ctx, selected) => {
    ctx.session.adminuserquicklook = selected
  }
})

async function userOptions(ctx, filter) {
  const filterRegex = new RegExp(filter, 'i')
  const allConfigs = await ctx.userconfig.all(
    config => filterRegex.test(JSON.stringify(config))
  )
  const allChats = allConfigs.map(o => o.chat)

  allChats.sort((a, b) => {
    const nameA = nameOfUser(a)
    const nameB = nameOfUser(b)
    return nameA.localeCompare(nameB)
  })

  const result = {}
  for (const chat of allChats) {
    result[String(chat.id)] = nameOfUser(chat)
  }

  return result
}

module.exports = {
  menu
}
