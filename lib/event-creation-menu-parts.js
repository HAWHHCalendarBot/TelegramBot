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

function addTimeSelectionSubmenu(menu, action, {
  emoji,
  buttonText,
  menuText,
  getCurrentSelection,
  setFunc
}, additionalArgs) {
  const buttonTextFunc = async ctx => {
    const currentSelection = await getCurrentSelection(ctx)
    return `${emoji} ${currentSelection || buttonText}`
  }
  return menu.submenu(buttonTextFunc, action, generateTimeSelectionMenu(menuText, setFunc), additionalArgs)
}

function addStartEndTimeSelectionSubmenu(menu, {
  menuTextStart,
  menuTextEnd,
  getCurrent,
  setFunc
}, additionalArgs = {}) {
  addTimeSelectionSubmenu(menu, 'starttime', {
    emoji: '🕗',
    buttonText: 'Startzeit',
    menuText: menuTextStart,
    getCurrentSelection: ctx => getCurrent(ctx, 'starttime'),
    setFunc: (ctx, newValue) => setFunc(ctx, 'starttime', newValue)
  }, additionalArgs)

  addTimeSelectionSubmenu(menu, 'endtime', {
    emoji: '🕓',
    buttonText: 'Endzeit',
    menuText: menuTextEnd,
    getCurrentSelection: ctx => getCurrent(ctx, 'endtime'),
    setFunc: (ctx, newValue) => setFunc(ctx, 'endtime', newValue)
  }, {
    joinLastRow: true,
    ...additionalArgs
  })
}

module.exports = {
  addStartEndTimeSelectionSubmenu,
  addTimeSelectionSubmenu,
  generateTimeSelectionMenu
}
