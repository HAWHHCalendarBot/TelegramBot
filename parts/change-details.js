const TelegrafInlineMenu = require('telegraf-inline-menu')

const {
  generateChangeText,
  generateShortChangeText
} = require('../lib/change-helper')

function generateChangeAction(change) {
  return change.name + '#' + change.date.replace(':', '.')
}

function getChangeFromCtx(ctx) {
  const complete = ctx.match[1]
  const match = complete.match(/^(.+)#(.+)$/)
  const name = match[1]
  const date = match[2].replace('.', ':')

  const changes = ctx.state.userconfig.changes || []
  const change = changes.filter(c => c.name === name && c.date === date)[0]
  return change
}

const menu = new TelegrafInlineMenu(ctx => {
  const change = getChangeFromCtx(ctx)
  if (!change) {
    return 'Change does not exist anymore'
  }
  return generateChangeText(change)
})

menu.switchToChatButton('Teilen…', ctx => generateShortChangeText(getChangeFromCtx(ctx)), {
  hide: ctx => {
    const change = getChangeFromCtx(ctx)
    return !change
  }
})
menu.simpleButton('⚠️ Änderung entfernen', 'r', {
  setParentMenuAfter: true,
  doFunc: ctx => {
    const change = getChangeFromCtx(ctx)
    const currentChanges = ctx.state.userconfig.changes || []
    ctx.state.userconfig.changes = currentChanges.filter(o => o.name !== change.name || o.date !== change.date)
    return ctx.answerCbQuery('Änderung wurde entfernt.')
  }
})

module.exports = {
  generateChangeAction,
  menu
}
