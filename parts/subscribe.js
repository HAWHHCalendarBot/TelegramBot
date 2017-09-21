const Telegraf = require('telegraf')

const { Extra, Markup } = Telegraf

const bot = new Telegraf.Composer()
module.exports = bot

const chooseText = `*Kalender abonnieren*\nBitte wähle die Art aus, mit der du den Kalender abonnieren willst.\n\nIch empfehle über iOS / macOS Boardmittel oder über den HAW-Mailer.`
const chooseKeyboardMarkup = Markup.inlineKeyboard([
  Markup.callbackButton('iOS / macOS', 'url:apple'),
  Markup.callbackButton('HAW-Mailer (Exchange)', 'url:exchange'),
  Markup.callbackButton('Google Kalender (Android Default Kalender)', 'url:google'),
  Markup.callbackButton('Freestyle 😎', 'url:freestyle')
], { columns: 1 })
const backToChooseKeyboardButton = Markup.callbackButton('🔙 zurück zur Übersicht', 'url')

bot.use((ctx, next) => {
  ctx.state.url = `calendarbot.hawhh.de/tg/${ctx.from.id}.ics`

  ctx.fastEdit = function(text, keyboardButtons = []) {
    keyboardButtons.push(backToChooseKeyboardButton)
    const keyboardMarkup = Markup.inlineKeyboard(keyboardButtons, { columns: 1 })

    return this.editMessageText(text, Extra.markdown().markup(keyboardMarkup))
  }

  return next()
})


bot.command(['subscribe', 'url'], ctx => {
  const eventCount = ctx.state.userconfig.events.length
  if (eventCount === 0) {
    return ctx.replyWithMarkdown('*Kalender abonnieren*\nDu hast noch keine Veranstaltungen in deinem Kalender!\nMit /add kannst du Veranstaltungen hinzufügen.')
  }

  return ctx.replyWithMarkdown(chooseText, Extra.markup(chooseKeyboardMarkup))
})

bot.action('url', ctx => ctx.editMessageText(chooseText, Extra.markdown().markup(chooseKeyboardMarkup)))

bot.action('url:apple', ctx => {
  let text = '*Kalender abonnieren mit iOS / macOS*'
  text += '\nAuf den ersten Button klicken und die URL in Safari öffnen. Auf der nun geöffneten Website auf das Kalender Icon klicken und bestätigen. Done.'

  const buttons = [
    Markup.urlButton('Kalender abonnieren', `https://calendarbot.hawhh.de/ics.php?url=${ctx.state.url}`)
  ]

  return ctx.fastEdit(text, buttons)
})

bot.action('url:exchange', ctx => {
  let text = '*Kalender abonnieren mit dem HAW-Mailer*'
  text += '\nIm [HAW-Mailer](https://www.haw-hamburg.de/online-services/haw-mailer.html) unten links auf die Kalender Ansicht wechseln. Dann in der Menüleiste oben links das Drop Down Menü von "Freigeben" öffnen und "Kalender werden hinzugefügt…" auswählen. (Wer zum Henker hat das übersetzt?! Englisch: "Share" → "Add Calendar…")'
  text += '\n'
  text += '\nIm aufgehenden Fenster in das untere Textfeld "Kalender aus dem Internet" die folgende URL einfügen und danach bestätigen.'
  text += `\nhttps://${ctx.state.url}`
  text += '\n'
  text += '\nDer Kalender wird nun alle paar Stunden vom HAW-Mailer aktualisiert. Wenn du dein Handy mit dem HAW-Mailer synchronisierst, ist der Kalender nun ebenfalls enthalten. Funktioniert mit iOS und Android sehr entspannt und du hast gleich deine HAW E-Mails mit dabei. (Windows Phone Tester hab ich noch keine gefunden 😜)'
  text += '\n'
  text += `\nDer Name des Kalenders (\`${ctx.from.id}\`) ist übrigens deine Telegram Nutzer ID, mit der dich Bots zuordnen 😉. Ohne das du jedoch einen Bot zuerst anschreibst, können Bots dich aber nicht anschreiben, also keine Angst vor Bot-Spam. Fühl dich frei den Kalender für dich umzubennen.`

  const buttons = [
    Markup.urlButton('HAW-Mailer', 'https://www.haw-hamburg.de/online-services/haw-mailer.html'),
    Markup.urlButton('Anleitung Einrichten des HAW-Mailers auf Android, iOS und Co.', 'https://www.haw-hamburg.de/online-services/haw-mailer/faqs.html#c73012')
  ]
  return ctx.fastEdit(text, buttons)
})

bot.action('url:google', ctx => {
  let text = '*Kalender abonnieren mit dem Google Kalender*'
  text += '\n⚠️ Der Google Kalender ist manchmal etwas… anstrengend. Erklärung unten.'
  text += '\n🔅 Alternativvorschlag: Kannst du vielleicht auch über den HAW-Mailer synchronisieren? Dann hast du auch gleich deine HAW E-Mails ;)'

  text += '\n'
  text += '\nIn der linken Seitenleiste im [Google Kalender](https://google.com/calendar/) gibt es den Eintrag "Weitere Kalender". Dort auf das kleine Dropdown Dreieck klicken und den Menüpunkt "Über URL hinzufügen" auswählen. Hier muss die folgende URL hinein kopiert werden.'
  text += `\nhttps://${ctx.state.url}`
  text += '\nNach dem Bestätigen einen Moment warten, bis der Kalender im Google Kalender erschienen ist.'

  text += '\n'
  text += `\nWenn dein Kalender nun "@HAWHHCalendarBot (${ctx.from.first_name})" heißt, wie er eigentlich heißen soll, bist du ein glücklicher Sonderfall Googles und du bist fertig.`
  text += '\nWenn dein Kalender jedoch den Namen der URL trägt, muss der Kalender umbenannt werden, damit er auf Android Geräte synchronisiert wird. (Google 🙄) Verwende einen einfachen Namen dafür, den Google nicht überfordernd findet.'
  text += '\nFun Fact: Auf iOS Geräte wird der Google Kalender immer fehlerfrei synchronisiert, egal wie er heißt.'

  text += '\n'
  text += '\n⚠️ In der Vergangenheit hat der Google Kalender jeweils zwischen 30 Minuten und 40 Stunden gebraucht, um einen Kalender zu aktualisieren. Außerdem cacht Google (meiner Meinung nach) ein wenig zu viel, was für teilweise interessantes/sonderbares Verhalten gesorgt hat.'

  const buttons = [
    Markup.urlButton('Google Calendar', 'https://google.com/calendar/'),
    Markup.callbackButton('abonnieren mit dem HAW-Mailer (Exchange)', 'url:exchange')
  ]

  return ctx.fastEdit(text, buttons)
})

bot.action('url:freestyle', ctx => {
  let text = '*Kalender abonnieren Freesyle Edition* 😎'
  text += '\nWenn dein Kalender Standards unterstützt, benutz den ersten Button an dieser Nachricht und öffne die Website. Klicke auf das Kalender Icon. Der Browser fragt dich nun, mit welchem Tool er den webcal:// Link öffnen soll. Wähle dein Kalenderprogramm.'

  text += '\n'
  text += '\nWenn das nicht funktioniert, finde einen Weg die folgende URL zu abonnieren. Achte dabei darauf, das du nicht importierst, sondern abonnierst. Nur dann aktualisiert sich der Kalender selbstständig bei Änderungen im Bot.'
  text += `\nhttps://${ctx.state.url}`

  text += '\n'
  text += '\nViel Erfolg 😎'

  const buttons = [
    Markup.urlButton('Kalender abonnieren', `https://calendarbot.hawhh.de/ics.php?url=${ctx.state.url}`)
  ]

  return ctx.fastEdit(text, buttons)
})
