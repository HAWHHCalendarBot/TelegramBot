const TelegrafInlineMenu = require('telegraf-inline-menu')

const {getCanteenList} = require('../lib/mensa-meals')

function enabledEmoji(truthy) {
  return truthy ? '✅' : '🚫'
}

const settingName = {
  vegan: 'vegan',
  vegetarian: 'vegetarisch',
  lactoseFree: 'laktosefrei',
  noPig: 'kein Schweinefleisch',
  noBeef: 'kein Rindfleisch',
  noPoultry: 'kein Geflügel',
  noFish: 'kein Fisch'
}

const menu = new TelegrafInlineMenu('*Mensa Einstellungen*')

function getMainMensa(ctx) {
  return ctx.state.userconfig.mensa && ctx.state.userconfig.mensa.main
}

function mainMensaText(ctx) {
  const main = getMainMensa(ctx)

  let text = 'Hauptmensa'
  if (main) {
    text += `: ${main}`
  }

  return text
}

function setMainMensa(ctx, mensa) {
  if (!ctx.state.userconfig.mensa) {
    ctx.state.userconfig.mensa = {}
  }

  const oldMain = ctx.state.userconfig.mensa.main
  ctx.state.userconfig.mensa.main = mensa
  if (ctx.state.userconfig.mensa.more) {
    ctx.state.userconfig.mensa.more = ctx.state.userconfig.mensa.more.filter(o => o !== mensa)
  }

  if (oldMain) {
    if (!ctx.state.userconfig.mensa.more) {
      ctx.state.userconfig.mensa.more = []
    }

    ctx.state.userconfig.mensa.more.push(oldMain)
  }
}

menu.submenu(mainMensaText, 'main', new TelegrafInlineMenu('*Mensa Einstellungen*\nHauptmensa'))
  .select('set', getCanteenList, {
    setFunc: setMainMensa,
    isSetFunc: (ctx, mensa) => mensa === getMainMensa(ctx),
    columns: 2,
    getCurrentPage: ctx => ctx.session.page,
    setPage: (ctx, page) => {
      ctx.session.page = page
    }
  })

function isAdditionalMensa(ctx, mensa) {
  const selected = ctx.state.userconfig.mensa.more || []
  return selected.indexOf(mensa) >= 0
}

function toggleAdditionalMensa(ctx, mensa) {
  if (getMainMensa(ctx) === mensa) {
    return ctx.answerCbQuery(mensa + ' ist bereits deine Hauptmensa')
  }

  const selected = ctx.state.userconfig.mensa.more || []
  if (selected.indexOf(mensa) >= 0) {
    ctx.state.userconfig.mensa.more = selected.filter(o => o !== mensa)
  } else {
    selected.push(mensa)
    selected.sort()
    ctx.state.userconfig.mensa.more = selected
  }
}

function moreMensaEmoji(ctx, mensa) {
  if (getMainMensa(ctx) === mensa) {
    return '🍽'
  }

  return enabledEmoji(isAdditionalMensa(ctx, mensa))
}

function moreMensaText(ctx) {
  const selected = ctx.state.userconfig.mensa.more || []
  let text = 'Weitere Mensen'
  if (selected.length > 0) {
    text += ` (${selected.length})`
  }

  return text
}

menu.submenu(moreMensaText, 'more', new TelegrafInlineMenu(
  '*Mensa Einstellungen*\nWähle weitere Mensen, in den du gelegentlich bist'
), {
  hide: ctx => !getMainMensa(ctx)
})
  .select('more', getCanteenList, {
    setFunc: toggleAdditionalMensa,
    prefixFunc: moreMensaEmoji,
    columns: 2,
    getCurrentPage: ctx => ctx.session.page,
    setPage: (ctx, page) => {
      ctx.session.page = page
    }
  })

const priceOptions = {
  student: 'Student',
  attendant: 'Angestellt',
  guest: 'Gast'
}

function setPrice(ctx, price) {
  ctx.state.userconfig.mensa.price = price
}

function isPriceSelected(ctx, price) {
  return ctx.state.userconfig.mensa.price === price
}

menu.select('price', priceOptions, {
  setFunc: setPrice,
  isSetFunc: isPriceSelected,
  hide: ctx => !getMainMensa(ctx)
})

function specialWishText(ctx) {
  let text = '*Mensa Einstellungen*'
  text += '\nWelche Sonderwünsche hast du zu deinem Essen?'
  text += '\n\n'

  const wishes = Object.keys(settingName)
    .filter(o => ctx.state.userconfig.mensa[o])

  if (wishes.length > 0) {
    text += 'Aktuell werden die Angebote für dich nach deinen Wünschen gefiltert.'
  } else {
    text += 'Aktuell siehst du alle ungefilterten Angebote.'
  }

  return text
}

function specialWishEmoji(ctx, wish) {
  return enabledEmoji(ctx.state.userconfig.mensa[wish])
}

function toggleSpecialWish(ctx, wish) {
  if (ctx.state.userconfig.mensa[wish]) {
    delete ctx.state.userconfig.mensa[wish]
  } else {
    ctx.state.userconfig.mensa[wish] = true
  }
}

function hideIrrelevantSpecialWishes(ctx, wish) {
  const wishes = ctx.state.userconfig.mensa
  switch (wish) {
    case 'noBeef':
    case 'noFish':
    case 'noPig':
    case 'noPoultry':
      return wishes.vegan || wishes.vegetarian
    case 'vegetarian':
    case 'lactoseFree':
      return wishes.vegan
    case 'vegan':
    default:
      return false
  }
}

menu.submenu('Extrawünsche Essen', 's', new TelegrafInlineMenu(specialWishText), {
  hide: ctx => !getMainMensa(ctx)
})
  .select('w', settingName, {
    setFunc: toggleSpecialWish,
    prefixFunc: specialWishEmoji,
    hide: hideIrrelevantSpecialWishes,
    columns: 1
  })
  .simpleButton('warm… nicht versalzen… kein Spüli…', 'warm', {
    doFunc: ctx => ctx.answerCbQuery('das wär mal was… 😈')
  })

menu.toggle('zeige Inhaltsstoffe', 'showAdditives', {
  setFunc: (ctx, newState) => {
    if (newState) {
      ctx.state.userconfig.mensa.showAdditives = true
    } else {
      delete ctx.state.userconfig.mensa.showAdditives
    }
  },
  isSetFunc: ctx => ctx.state.userconfig.mensa.showAdditives === true,
  hide: ctx => !getMainMensa(ctx)
})

module.exports = {
  menu
}
