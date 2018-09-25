const TelegrafInlineMenu = require('telegraf-inline-menu')

function generateTimeSelectionOptions() {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
  const minutes = [0, 15, 30, 45]
  const minutesString = minutes.map(o => o < 10 ? '0' + o : String(o))
  const options = {}

  for (const h of hours) {
    for (const m of minutesString) {
      options[`${h}.${m}`] = `${h}:${m}`
    }
  }
  return options
}

function generateTimeSelectionMenu(text, setFunc) {
  const ownSetFunc = (ctx, key) => setFunc(ctx, key.replace('.', ':'))
  return new TelegrafInlineMenu(text)
    .select('t', generateTimeSelectionOptions(), {
      setParentMenuAfter: true,
      columns: 4,
      setFunc: ownSetFunc
    })
}

module.exports = {
  generateTimeSelectionMenu
}
