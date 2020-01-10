const arrayFilterUnique = require('array-filter-unique')
const Telegraf = require('telegraf')

const {getCanteenList} = require('./lib/mensa-meals')

const bot = new Telegraf.Composer()

bot.use(async (ctx, next) => {
  // Mirgrate Mensa Student Price
  if (ctx.state.userconfig.mensa) {
    if (ctx.state.userconfig.mensa.student) {
      ctx.state.userconfig.mensa.price = 'student'
    } else if (!ctx.state.userconfig.mensa.price) {
      ctx.state.userconfig.mensa.price = 'guest'
    }

    delete ctx.state.userconfig.mensa.student

    // Sometimes people have the main mensa multiple times in the more list
    // Maybe I fixed that bug with 0b25d01, but havnt checked yet
    const {main, more} = ctx.state.userconfig.mensa
    if (main && more && more.length > 0) {
      const beforeCount = more.length
      ctx.state.userconfig.mensa.more = more.filter(o => o !== main)
      const afterCount = ctx.state.userconfig.mensa.more.length

      if (beforeCount !== afterCount) {
        console.log('migration: removed main mensa in more', ctx.from)
      }
    }

    if (more) {
      const allAvailableCanteens = await getCanteenList()
      ctx.state.userconfig.mensa.more = more
        .filter(o => allAvailableCanteens.includes(o))
    }
  }

  delete ctx.state.userconfig.settings

  delete ctx.state.userconfig.showRemovedEvents

  if (ctx.state.userconfig.additionalEvents) {
    ctx.state.userconfig.events = [
      ...ctx.state.userconfig.events,
      ...ctx.state.userconfig.additionalEvents
    ]
      .filter(arrayFilterUnique())
      .sort()

    delete ctx.state.userconfig.additionalEvents
  }

  return next()
})

module.exports = {
  bot
}
