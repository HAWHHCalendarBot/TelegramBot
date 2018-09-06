const Telegraf = require('telegraf')

const {Extra, Markup} = Telegraf

function enabledEmoji(truthy) {
  return truthy ? '✅' : '❎'
}

const bot = new Telegraf.Composer()

function baseSettingsKeyboard(ctx) {
  return Markup.inlineKeyboard([
    Markup.callbackButton(enabledEmoji(ctx.state.userconfig.showRemovedEvents) + ' Entfernte Veranstaltungen anzeigen', 's:showRemovedEvents'),
    Markup.callbackButton(enabledEmoji(ctx.state.userconfig.stisysUpdate) + ' StISysUpdate', 's:stisys'),
    Markup.callbackButton('🍽 Mensa', 's:m'),
    Markup.callbackButton('💾 Gespeicherte Daten anzeigen', 's:data'),
    Markup.callbackButton('⚠️ Alles löschen ⚠️', 's:del')
  ], {
    columns: 1
  })
}

function stisysUpdate(ctx, callbackQueryText) {
  const active = ctx.state.userconfig.stisysUpdate

  let text = '*Einstellungen*\n\n'
  text += 'Das StISys Update prüft alle 15 Minuten, ob sich etwas auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) geändert hat. Ist dies der Fall, kannst du vom Bot benachrichtigt werden.\n\n'
  text += 'Das StISys Update ist für dich aktuell ' + (active ? 'aktiv' : 'deaktiviert') + '.'

  const keyboardMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('StISys Update aktivieren', 's:stisys:on', active),
    Markup.callbackButton('StISys Update deaktivieren', 's:stisys:off', !active),
    Markup.callbackButton('🔙 zurück zur Einstellungensübersicht', 's')
  ], {
    columns: 1
  })

  return Promise.all([
    ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup)),
    ctx.answerCbQuery(callbackQueryText)
  ])
}

function showRemovedEventsUpdate(ctx, callbackQueryText) {
  const active = ctx.state.userconfig.showRemovedEvents

  let text = '*Einstellungen*\n\n'
  text += 'Mit dem /changes Feature kannst du Änderungen an Veranstaltungen hinzufügen. Möglicherweise fallen auch Vorlesungen aus. Mit dieser Option kann eingestellt werden, ob ausfallende Veranstaltungen (mit einem Hinweis) trotzdem im Kalender erscheinen sollen.\n\n'
  text += 'Entfernte Veranstaltungen werden für dich aktuell ' + (active ? 'angezeigt' : 'ausgeblendet') + '.'

  const keyboardMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('Entfernte Veranstaltungen anzeigen', 's:showRemovedEvents:toggle', active),
    Markup.callbackButton('Entfernte Veranstaltungen ausblenden', 's:showRemovedEvents:toggle', !active),
    Markup.callbackButton('🔙 zurück zur Einstellungensübersicht', 's')
  ], {
    columns: 1
  })

  return Promise.all([
    ctx.editMessageText(text, Extra.markdown().markup(keyboardMarkup)),
    ctx.answerCbQuery(callbackQueryText)
  ])
}

bot.command('settings', ctx => ctx.replyWithMarkdown('*Einstellungen*', baseSettingsKeyboard(ctx).extra()))

bot.action('s', ctx => {
  ctx.editMessageText('*Einstellungen*', Extra.markdown().markup(baseSettingsKeyboard(ctx)))
})

bot.action('s:stisys', ctx => stisysUpdate(ctx))

bot.action('s:stisys:on', ctx => {
  ctx.state.userconfig.stisysUpdate = true
  return stisysUpdate(ctx, 'StISys Update wurde eingeschaltet.')
})

bot.action('s:stisys:off', ctx => {
  ctx.state.userconfig.stisysUpdate = false
  return stisysUpdate(ctx, 'StISys Update wurde ausgeschaltet.')
})

bot.action('s:showRemovedEvents', ctx => showRemovedEventsUpdate(ctx))

bot.action('s:showRemovedEvents:toggle', ctx => {
  ctx.state.userconfig.showRemovedEvents = !ctx.state.userconfig.showRemovedEvents
  return showRemovedEventsUpdate(ctx, ctx.state.userconfig.showRemovedEvents ? 'Entfernte Veranstaltungen werden nun angezeigt' : 'Entfernte Veranstaltungen werden nicht mehr angezeigt')
})

bot.action('s:data', ctx => {
  let infotext = 'Die folgenden Daten werden auf dem Server über dich gespeichert. Wenn du alle Daten über dich löschen lassen möchtest, wähle in den /settings "Alles löschen".'
  infotext += '\nAußerdem wird geloggt, wenn Änderungen von Nutzern zu einem neu bauen von Kalendern führt. Diese Logs werden nicht persistent gespeichert und sind nur bis zum Neustart des Servers verfügbar.'
  infotext += '\nDer Quellcode dieses Bots ist auf [GitHub](https://github.com/HAWHHCalendarBot) verfügbar.'

  const {userconfig} = ctx.state
  const user = ctx.from

  let dataText = '*Telegram User Info*\n```\n' + JSON.stringify(user, null, 2) + '\n```'
  dataText += '\n*Einstellungen im Bot*\n```\n' + JSON.stringify(userconfig, null, 2) + '\n```'

  return Promise.all([
    ctx.answerCbQuery(),
    ctx.reply(infotext + '\n\n' + dataText, Extra.markdown())
  ])
})

const deleteConfirmString = 'Ja, ich will!'

const deleteQuestion = `Bist du dir sicher, das du deinen Kalender und alle Einstellungen löschen willst?\n\nWenn du wirklich alles löschen willst, antworte mit "${deleteConfirmString}"`

bot.action('s:del', ctx => {
  return Promise.all([
    ctx.answerCbQuery(),
    ctx.reply(deleteQuestion, Markup.forceReply().extra())
  ])
})

bot.on('text', Telegraf.optional(ctx => ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === deleteQuestion, ctx => {
  if (ctx.message.text !== deleteConfirmString) {
    return ctx.reply('Du hast mir aber einen Schrecken eingejagt! 🙀')
  }
  delete ctx.state.userconfig
  return ctx.reply('Deine Daten werden gelöscht…')
}))

module.exports = {
  bot
}
