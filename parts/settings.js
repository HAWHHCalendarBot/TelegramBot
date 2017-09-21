const Telegraf = require('telegraf')

const Extra = Telegraf.Extra
const Markup = Telegraf.Markup

function enabledEmoji(truthy) {
  return truthy ? '✅' : '❎'
}

const bot = new Telegraf.Composer()
module.exports = bot

function baseSettingsKeyboard(ctx) {
  return Markup.inlineKeyboard([
    Markup.callbackButton(enabledEmoji(ctx.state.userconfig.stisysUpdate) + ' StISysUpdate', 's:stisys'),
    Markup.callbackButton('🍽 Mensa', 's:m'),
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
    ctx.answerCallbackQuery(callbackQueryText)
  ])
}


bot.command('settings', ctx => ctx.replyWithMarkdown('*Einstellungen*', baseSettingsKeyboard(ctx).extra()))

bot.action('s', ctx => {
  ctx.editMessageText('*Einstellungen*', Extra.markdown().markup(baseSettingsKeyboard(ctx)))
})

bot.action('s:stisys', ctx => stisysUpdate(ctx))

bot.action('s:stisys:on', async ctx => {
  ctx.state.userconfig.stisysUpdate = true
  await ctx.userconfig.save()

  return stisysUpdate(ctx, 'StISys Update wurde eingeschaltet.')
})

bot.action('s:stisys:off', async ctx => {
  ctx.state.userconfig.stisysUpdate = false
  await ctx.userconfig.save()

  return stisysUpdate(ctx, 'StISys Update wurde ausgeschaltet.')
})

const deleteConfirmString = 'Ja, ich will!'

const deleteQuestion = `Bist du dir sicher, das du deinen Kalender und alle Einstellungen löschen willst?\n\nWenn du wirklich alles löschen willst, antworte mit "${deleteConfirmString}"`

bot.action('s:del', ctx => {
  return Promise.all([
    ctx.answerCallbackQuery(),
    ctx.reply(deleteQuestion, Markup.forceReply().extra())
  ])
})

bot.on('text', Telegraf.optional(ctx => ctx.message && ctx.message.reply_to_message && ctx.message.reply_to_message.text === deleteQuestion, ctx => {
  if (ctx.message.text === deleteConfirmString) {
    ctx.userconfig.remove()
    return ctx.reply('Deine Daten werden gelöscht…')
  } else {
    return ctx.reply('Du hast mir aber einen Schrecken eingejagt! 🙀')
  }
}))
