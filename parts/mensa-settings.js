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

const menu = new TelegrafInlineMenu('s:m', '*Mensa Einstellungen*', 'zurück…')

function getMainMensa(ctx) {
  return ctx.state.userconfig.mensa.main
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
  const oldMain = ctx.state.userconfig.mensa.main
  ctx.state.userconfig.mensa.main = mensa
  ctx.state.userconfig.mensa.more = ctx.state.userconfig.mensa.more.filter(o => o !== mensa)
  if (oldMain) {
    ctx.state.userconfig.mensa.more.push(oldMain)
  }
}

const mainMensaMenu = new TelegrafInlineMenu('s:m:main', '*Mensa Einstellungen*')
mainMensaMenu.list('set', getCanteenList, setMainMensa, {
  isSetFunc: (ctx, mensa) => mensa === getMainMensa(ctx),
  columns: 2
})
menu.submenu(mainMensaText, mainMensaMenu)

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

const moreMensaMenu = new TelegrafInlineMenu('s:m:more', '*Mensa Einstellungen*\nWähle weitere Mensen, in den du gelegentlich bist')
moreMensaMenu.list('more', getCanteenList, toggleAdditionalMensa, {
  prefixFunc: moreMensaEmoji,
  columns: 2
})
menu.submenu(moreMensaText, moreMensaMenu, {
  hide: ctx => !getMainMensa(ctx)
})

const priceOptions = {
  student: 'Student',
  attendent: 'Angestellt',
  guest: 'Gast'
}

function setPrice(ctx, price) {
  ctx.state.userconfig.mensa.price = price
}

function isPriceSelected(ctx, price) {
  return ctx.state.userconfig.mensa.price === price
}

menu.select('price', priceOptions, setPrice, {
  isSetFunc: isPriceSelected,
  hide: ctx => !getMainMensa(ctx)
})

function specialWishEmoji(ctx, wish) {
  return enabledEmoji(ctx.state.userconfig.mensa[wish])
}

function toggleSpecialWish(ctx, wish) {
  ctx.state.userconfig.mensa[wish] = !ctx.state.userconfig.mensa[wish]
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

const specialWishesMenu = new TelegrafInlineMenu('s:m:s', '*Mensa Einstellungen*\nWelche Sonderwünsche hast du zu deinem Essen?')
specialWishesMenu.list('w', settingName, toggleSpecialWish, {
  prefixFunc: specialWishEmoji,
  hide: hideIrrelevantSpecialWishes,
  columns: 1
})

menu.submenu('Extrawünsche Essen', specialWishesMenu)

menu.toggle('showAdditives', 'zeige Inhaltsstoffe', (ctx, newState) => {
  ctx.state.userconfig.mensa.showAdditives = newState
}, {
  isSetFunc: ctx => ctx.state.userconfig.mensa.showAdditives,
  hide: ctx => !getMainMensa(ctx)
})

module.exports = {
  bot: menu.middleware(),
  menu
}
