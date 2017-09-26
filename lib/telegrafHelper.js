const Telegraf = require('telegraf')
const Markup = Telegraf.Markup

function generateCallbackButton(type, value) {
  return Markup.callbackButton(`${value}`, type + ':' + value)
}

function generateCallbackButtons(type, values) {
  return values.map(o => generateCallbackButton(type, o))
}

function generateInlineKeyboardMarkup(type, entries, columns = 2) {
  return Markup.inlineKeyboard(generateCallbackButtons(type, entries), {
    columns: columns
  })
}


module.exports = {
  generateCallbackButton: generateCallbackButton,
  generateCallbackButtons: generateCallbackButtons,
  generateInlineKeyboardMarkup: generateInlineKeyboardMarkup
}
