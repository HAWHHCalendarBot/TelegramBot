const TelegrafInlineMenu = require('telegraf-inline-menu')

function getUrl(ctx) {
  let filename = `${ctx.from.id}`
  const {calendarfileSuffix} = ctx.state.userconfig
  if (calendarfileSuffix) {
    filename += `-${calendarfileSuffix}`
  }
  const full = `calendarbot.hawhh.de/tg/${filename}.ics`
  return full
}

const menu = new TelegrafInlineMenu('url', mainText)

const appleMenu = new TelegrafInlineMenu('url:apple', appleText)
appleMenu.urlButton('Kalender abonnieren', ctx => `https://calendarbot.hawhh.de/ics.php?url=${getUrl(ctx)}`)
menu.submenu('🍏 iOS / macOS', appleMenu)

const exchangeMenu = new TelegrafInlineMenu('url:exchange', exchangeText)
exchangeMenu.urlButton('HAW Mailer', 'https://www.haw-hamburg.de/online-services/haw-mailer.html')
exchangeMenu.urlButton('HAW Anleitung Einrichten des HAW-Mailers auf Android, iOS und Co.', 'https://www.haw-hamburg.de/online-services/haw-mailer/faqs.html#c73012')
menu.submenu('🗂 HAW Mailer (Exchange)', exchangeMenu)

const googleMenu = new TelegrafInlineMenu('url:google', googleText)
googleMenu.urlButton('Google Calendar', 'https://calendar.google.com/')
googleMenu.manual('url:exchange', 'abonnieren mit dem HAW-Mailer (Exchange)', {root: true})
menu.submenu('🍰 Google Kalender', googleMenu)

const freestyleMenu = new TelegrafInlineMenu('url:freestyle', freestyleText)
freestyleMenu.urlButton('Kalender abonnieren', ctx => `https://calendarbot.hawhh.de/ics.php?url=${getUrl(ctx)}`)
menu.submenu('Freestyle 😎', freestyleMenu)

function mainText(ctx) {
  let text = '*Kalender abonnieren*'
  text += '\nBitte wähle die Art aus, mit der du den Kalender abonnieren willst.\n\nIch empfehle über iOS / macOS Boardmittel oder über den HAW-Mailer.'

  const {calendarfileSuffix} = ctx.state.userconfig
  if (!calendarfileSuffix) {
    text += '\n\n⚠️ '
    text += `Die Kalender liegen für jeden frei zugänglich im Internet. Jeder, der deine Telegram Nutzer ID (\`${ctx.from.id}\`) kennt, kann sich deinen Kalender ansehen.`
    text += '\nDu kannst die URL Privacy aktivieren, musst danach jedoch die Kalender neu abonnieren.'
  }

  return text
}

const suffixMenu = new TelegrafInlineMenu('url:suffix', suffixText)

function suffixButtonText(ctx) {
  const {calendarfileSuffix} = ctx.state.userconfig
  let text = 'URL Privacy'
  if (calendarfileSuffix) {
    text = `✅ ${text}`
  } else {
    text = `⚠️ ${text} ⚠️`
  }
  return text
}

function suffixText(ctx) {
  const {calendarfileSuffix} = ctx.state.userconfig

  let text = 'Die Kalender liegen für jeden frei zugänglich im Internet. '
  text += `Da die default URL nur aus deiner Telegram Nutzer ID (\`${ctx.from.id}\`) besteht, kann jeder mit dieser ID deinen Kalender einsehen.`
  text += ' Wird der URL ein zufällig generierter String angefügt, müsste dieser erraten werden und erhöht so deine Privatsphäre.'
  text += ' Jedoch musst du nach jedem Ändern dieser Einstellung deine Kalender neu abonnieren, da sich die URL ändert.'

  text += '\n\n'
  text += `Die Nutzer ID (\`${ctx.from.id}\`) ist nicht deine Telefonnummer oder teil deines Usernamens und innerhalb von Telegram eindeutig.`
  text += ' Wenn man eine Nachricht von dir hat, kann man über diese die Nutzer ID erhalten.'

  text += '\n\n'
  if (calendarfileSuffix) {
    text += '✅ Aktuell ist deine URL geschützt.'
  } else {
    text += '⚠️ Aktuell ist deine URL *nicht* geschützt.'
  }
  text += '\nDeine aktuelle URL lautet:'
  text += `\n\`https://${getUrl(ctx)}\``
  return text
}

const SUFFIX_MAX_LENGTH = 15
const SUFFIX_MIN_LENGTH = 3

function setSuffix(ctx, val) {
  val = String(val)
    .replace(/[^\w\d]/g, '')
    .slice(0, SUFFIX_MAX_LENGTH)
  if (val.length < SUFFIX_MIN_LENGTH) {
    return
  }
  ctx.state.userconfig.calendarfileSuffix = val
  return sendHintText(ctx)
}

function sendHintText(ctx) {
  const hintText = '⚠️ Hinweis: Dein Kalender muss nun neu abonniert werden!'
  if (ctx.updateType === 'callback_query') {
    return ctx.answerCbQuery(hintText, true)
  }
  return ctx.reply(hintText)
}

suffixMenu.button('g', 'Generieren…', ctx => {
  // 10^8 -> 10 ** 8
  const fromTime = Date.now() % (10 ** 8)
  return setSuffix(ctx, fromTime)
})

suffixMenu.question('s', 'Manuell setzen…', setSuffix, {
  questionText: `Gib mir Tiernamen! 🦁🦇🐌🦍\nOder andere zufällige Buchstaben und Zahlen Kombinationen.\nSonderzeiche werden heraus gefiltert. Muss mindestens ${SUFFIX_MIN_LENGTH} Zeichen lang sein. Romane werden leider auf ${SUFFIX_MAX_LENGTH} Zeichen gekürzt.`
})

suffixMenu.button('r', '⚠️ Schutz entfernen', ctx => {
  delete ctx.state.userconfig.calendarfileSuffix
  return sendHintText(ctx)
}, {
  hide: ctx => !ctx.state.userconfig.calendarfileSuffix
})

menu.submenu(suffixButtonText, suffixMenu)

function appleText() {
  let text = '*Kalender abonnieren mit iOS / macOS*'
  text += '\nAuf den ersten Button klicken und die URL in Safari öffnen. Auf der nun geöffneten Website auf das Kalender Icon klicken und bestätigen. Done.'
  return text
}

function exchangeText(ctx) {
  let text = '*Kalender abonnieren mit dem HAW-Mailer*'
  text += '\nIm [HAW-Mailer](https://www.haw-hamburg.de/online-services/haw-mailer.html) unten links auf die Kalender Ansicht wechseln. Dann in der Menüleiste oben links das Drop Down Menü von "Freigeben" öffnen und "Kalender werden hinzugefügt…" auswählen. (Wer zum Henker hat das übersetzt?! Englisch: "Share" → "Add Calendar…")'
  text += '\n'
  text += '\nIm aufgehenden Fenster in das untere Textfeld "Kalender aus dem Internet" die folgende URL einfügen und danach bestätigen.'
  text += `\nhttps://${getUrl(ctx)}`
  text += '\n'
  text += '\nDer Kalender wird nun alle paar Stunden vom HAW-Mailer aktualisiert. Wenn du dein Handy mit dem HAW-Mailer synchronisierst, ist der Kalender nun ebenfalls enthalten. Funktioniert mit iOS und Android sehr entspannt und du hast gleich deine HAW E-Mails mit dabei. (Windows Phone Tester hab ich noch keine gefunden 😜)'
  text += '\n'
  text += `\nDer Name des Kalenders (\`${ctx.from.id}\`) ist übrigens deine Telegram Nutzer ID, mit der dich Bots zuordnen 😉. Ohne das du jedoch einen Bot zuerst anschreibst, können Bots dich aber nicht anschreiben, also keine Angst vor Bot-Spam. Fühl dich frei den Kalender für dich umzubennen.`
  return text
}

function googleText(ctx) {
  let text = '*Kalender abonnieren mit dem Google Kalender*'
  text += '\n⚠️ Der Google Kalender ist manchmal etwas… anstrengend. Erklärung unten.'
  text += '\n🔅 Alternativvorschlag: Kannst du vielleicht auch über den HAW-Mailer synchronisieren? Dann hast du auch gleich deine HAW E-Mails ;)'

  text += '\n'
  text += '\nIn der linken Seitenleiste im [Google Kalender](https://calendar.google.com/) gibt es den Eintrag "Weitere Kalender". Dort auf das kleine Dropdown Dreieck klicken und den Menüpunkt "Über URL hinzufügen" auswählen. Hier muss die folgende URL hinein kopiert werden.'
  text += `\nhttps://${ctx.state.url}`
  text += '\nNach dem Bestätigen einen Moment warten, bis der Kalender im Google Kalender erschienen ist.'

  text += '\n'
  text += `\nWenn dein Kalender nun "@HAWHHCalendarBot (${ctx.from.first_name})" heißt, wie er eigentlich heißen soll, bist du ein glücklicher Sonderfall Googles und du bist fertig.`
  text += '\nWenn dein Kalender jedoch den Namen der URL trägt, muss der Kalender umbenannt werden, damit er auf Android Geräte synchronisiert wird. (Google 🙄) Verwende einen einfachen Namen dafür, den Google nicht überfordernd findet.'
  text += '\nFun Fact: Auf iOS Geräte wird der Google Kalender immer fehlerfrei synchronisiert, egal wie er heißt.'

  text += '\n'
  text += '\n⚠️ In der Vergangenheit hat der Google Kalender jeweils zwischen 30 Minuten und 40 Stunden gebraucht, um einen Kalender zu aktualisieren. Außerdem cacht Google (meiner Meinung nach) ein wenig zu viel, was für teilweise interessantes/sonderbares Verhalten gesorgt hat.'
  return text
}

function freestyleText(ctx) {
  let text = '*Kalender abonnieren Freesyle Edition* 😎'
  text += '\nWenn dein Kalender Standards unterstützt, benutz den ersten Button an dieser Nachricht und öffne die Website. Klicke auf das Kalender Icon. Der Browser fragt dich nun, mit welchem Tool er den webcal:// Link öffnen soll. Wähle dein Kalenderprogramm.'

  text += '\n'
  text += '\nWenn das nicht funktioniert, finde einen Weg die folgende URL zu abonnieren. Achte dabei darauf, das du nicht importierst, sondern abonnierst. Nur dann aktualisiert sich der Kalender selbstständig bei Änderungen im Bot.'
  text += `\nhttps://${getUrl(ctx)}`

  text += '\n'
  text += '\nViel Erfolg 😎'
  return text
}

module.exports = {
  menu
}
