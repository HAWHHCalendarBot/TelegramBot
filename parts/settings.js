const Telegraf = require('telegraf')
const TelegrafInlineMenu = require('telegraf-inline-menu')

const mensaSettings = require('./mensa-settings')

const menu = new TelegrafInlineMenu('s', '*Einstellungen*')

function stisysText(ctx) {
  const active = ctx.state.userconfig.stisysUpdate

  let text = '*Einstellungen*\nStISys\n\n'
  text += 'Das StISys Update prüft alle 15 Minuten, ob sich etwas auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) geändert hat. Ist dies der Fall, kannst du vom Bot benachrichtigt werden.\n\n'
  text += 'Das StISys Update ist für dich aktuell ' + (active ? 'aktiv' : 'deaktiviert') + '.'

  return text
}

const stisysMenu = new TelegrafInlineMenu('s:stisys', stisysText)
stisysMenu.toggle('update', 'StISys Update', (ctx, newState) => {
  ctx.state.userconfig.stisysUpdate = newState
}, {
  isSetFunc: ctx => ctx.state.userconfig.stisysUpdate
})
menu.submenu('StISys', stisysMenu)

function changesText(ctx) {
  const active = ctx.state.userconfig.showRemovedEvents

  let text = '*Einstellungen*\nVeranstaltungsänderungen\n\n'
  text += 'Mit dem /changes Feature kannst du Änderungen an Veranstaltungen hinzufügen. Möglicherweise fallen auch Vorlesungen aus. Mit dieser Option kann eingestellt werden, ob ausfallende Veranstaltungen (mit einem Hinweis) trotzdem im Kalender erscheinen sollen.\n\n'
  text += 'Entfernte Veranstaltungen werden für dich aktuell ' + (active ? 'angezeigt' : 'ausgeblendet') + '.'
  return text
}

const changesMenu = new TelegrafInlineMenu('s:changes', changesText)
changesMenu.toggle('showRemoved', 'zeige ausfallende Veranstaltungen', (ctx, newState) => {
  ctx.state.userconfig.showRemovedEvents = newState
}, {
  isSetFunc: ctx => ctx.state.userconfig.showRemovedEvents
})
menu.submenu('Veranstaltungsänderungen', changesMenu)

menu.submenu('🍽 Mensa', mensaSettings.menu)

function dataText(ctx) {
  let infotext = 'Die folgenden Daten werden auf dem Server über dich gespeichert. Wenn du alle Daten über dich löschen lassen möchtest, wähle "Alles löschen".'
  infotext += '\nAußerdem wird geloggt, wenn Änderungen von Nutzern zu einem neu bauen von Kalendern führt. Diese Logs werden nicht persistent gespeichert und sind nur bis zum Neustart des Servers verfügbar.'
  infotext += '\nDer Quellcode dieses Bots ist auf [GitHub](https://github.com/HAWHHCalendarBot) verfügbar.'

  const {userconfig} = ctx.state
  const user = ctx.from

  let dataText = '*Telegram User Info*\n```\n' + JSON.stringify(user, null, 2) + '\n```'
  dataText += '\n*Einstellungen im Bot*\n```\n' + JSON.stringify(userconfig, null, 2) + '\n```'

  return infotext + '\n\n' + dataText
}

const deleteConfirmString = 'Ja, ich will!'

const deleteQuestion = `Bist du dir sicher, das du deinen Kalender und alle Einstellungen löschen willst?\n\nWenn du wirklich alles löschen willst, antworte mit "${deleteConfirmString}"`

function deleteEverything(ctx, answer) {
  if (answer !== deleteConfirmString) {
    return ctx.reply('Du hast mir aber einen Schrecken eingejagt! 🙀')
  }
  delete ctx.state.userconfig
  return ctx.reply('Deine Daten werden gelöscht…')
}

const dataMenu = new TelegrafInlineMenu('s:data', dataText)
dataMenu.question('delete-all', '⚠️ Alles löschen ⚠️', deleteEverything, {
  questionText: deleteQuestion
})
menu.submenu('💾 Gespeicherte Daten über dich', dataMenu)

const bot = new Telegraf.Composer()
bot.command('settings', ctx => menu.replyMenuNow(ctx))
bot.command('stop', ctx => dataMenu.replyMenuNow(ctx))

module.exports = {
  bot,
  menu
}
