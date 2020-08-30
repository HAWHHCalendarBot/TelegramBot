const TelegrafInlineMenu = require('telegraf-inline-menu')

const mensaSettings = require('./mensa-settings')

const menu = new TelegrafInlineMenu('*Einstellungen*')

menu.setCommand('settings')

function stisysText(ctx) {
  const active = ctx.state.userconfig.stisysUpdate

  let text = '*Einstellungen*\nStISys\n\n'
  text += 'Das StISys Update prüft alle 15 Minuten, ob sich etwas auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) geändert hat. Ist dies der Fall, kannst du vom Bot benachrichtigt werden.\n\n'
  text += 'Das StISys Update ist für dich aktuell ' + (active ? 'aktiv' : 'deaktiviert') + '.'

  return text
}

menu.submenu('StISys', 'stisys', new TelegrafInlineMenu(stisysText))
  .toggle('StISys Update', 'update', {
    setFunc: (ctx, newState) => {
      ctx.state.userconfig.stisysUpdate = newState
    },
    isSetFunc: ctx => ctx.state.userconfig.stisysUpdate === true
  })

menu.submenu('🍽 Mensa', 'm', mensaSettings.menu)

async function getActualUserconfigContent(ctx) {
  if (!ctx.state.userconfig) {
    return null
  }

  const userconfig = await ctx.userconfig.load(ctx.from.id)
  return userconfig && userconfig.config
}

async function dataText(ctx) {
  let infotext = ''

  infotext += '\nAuf dem Server wird geloggt, wenn Aktionen von Nutzern zu einem neu Bauen von Kalendern oder ungewollten Fehlern führen. Diese Logs werden nicht persistent gespeichert und sind nur bis zum Neustart des Servers verfügbar.'
  infotext += '\nDer Quellcode dieses Bots ist auf [GitHub](https://github.com/HAWHHCalendarBot) verfügbar.'
  infotext += '\n'

  const userconfig = await getActualUserconfigContent(ctx)
  if (userconfig) {
    infotext += '\nDie folgenden Daten werden auf dem Server über dich gespeichert. Wenn du alle Daten über dich löschen lassen möchtest, wähle "Alles löschen".'
  } else {
    infotext += '\nAktuell speichert der Server keine Daten zu dir.'
  }

  const user = ctx.from
  let dataText = '*Telegram User Info*'
  dataText += '\nJeder Telegram Bot kann diese User Infos abrufen, wenn du mit ihm interagierst.'
  dataText += ' Um dies zu verhindern, blockiere den Bot.'
  dataText += '\n```\n' + JSON.stringify(user, null, 2) + '\n```'

  if (userconfig) {
    dataText += '\n*Einstellungen im Bot*\n```\n' + JSON.stringify(userconfig, null, 2) + '\n```'
  }

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

menu.submenu('💾 Gespeicherte Daten über dich', 'data', new TelegrafInlineMenu(dataText))
  .setCommand('stop')
  .question('⚠️ Alles löschen ⚠️', 'delete-all', {
    setFunc: deleteEverything,
    hide: async ctx => !(await getActualUserconfigContent(ctx)),
    uniqueIdentifier: 'delete-everything',
    questionText: deleteQuestion
  })

module.exports = {
  menu
}
