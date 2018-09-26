const TelegrafInlineMenu = require('telegraf-inline-menu')

function generateNumberArray(start, end) {
  const arr = []
  for (let i = start; i <= end; i++) {
    arr.push(i)
  }
  return arr
}

const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
function generateMonthOptions() {
  const result = {}
  monthNames.forEach((name, i) => {
    result[i + 1] = name
  })
  return result
}

function generateYearOptions() {
  const currentYear = new Date(Date.now()).getFullYear()
  return generateNumberArray(currentYear - 1, currentYear + 1)
}

function addDateSelection(menu, {
  getCurrent,
  setFunc
}, additionalArgs) {
  const regex = /(\d+)-(\d+)-(\d+)T(\d+:\d+)/
  const get = index => {
    return async ctx => {
      const current = await getCurrent(ctx)
      return current.match(regex)[index]
    }
  }
  const set = index => {
    return async (ctx, newValue) => {
      const current = await getCurrent(ctx)
      const match = current.match(regex)
      if (String(newValue).length === 1 && (index === 2 || index === 3)) {
        newValue = '0' + newValue
      }
      match[index] = newValue
      return setFunc(ctx, `${match[1]}-${match[2]}-${match[3]}T${match[4]}`)
    }
  }
  const submenuText = 'Wann findet der Termin statt?'

  menu.submenu(get(3), 'day', new TelegrafInlineMenu(submenuText), {
    ...additionalArgs
  })
    .select('s', generateNumberArray(1, 31), {
      setParentMenuAfter: true,
      columns: 7,
      setFunc: set(3)
    })

  const monthText = async ctx => monthNames[Number(await get(2)(ctx)) - 1]
  menu.submenu(monthText, 'month', new TelegrafInlineMenu(submenuText), {
    joinLastRow: true,
    ...additionalArgs
  })
    .select('s', generateMonthOptions(), {
      setParentMenuAfter: true,
      columns: 3,
      setFunc: set(2)
    })

  menu.submenu(get(1), 'year', new TelegrafInlineMenu(submenuText), {
    joinLastRow: true,
    ...additionalArgs
  })
    .select('s', generateYearOptions(), {
      setParentMenuAfter: true,
      setFunc: set(1)
    })
}

function addQuestionButton(menu, param, {
  emoji,
  buttonText,
  questionText,
  getCurrent,
  setFunc
}, additionalArgs = {}) {
  const buttonTextFunc = async ctx => {
    const currentSelection = await getCurrent(ctx, param)
    return `${emoji} ${currentSelection || buttonText}`
  }
  menu.question(buttonTextFunc, param, {
    questionText,
    setFunc: (ctx, answer) => setFunc(ctx, param, answer),
    ...additionalArgs
  })
}

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
  addDateSelection,
  addQuestionButton,
  addStartEndTimeSelectionSubmenu,
  addTimeSelectionSubmenu,
  generateTimeSelectionMenu
}
