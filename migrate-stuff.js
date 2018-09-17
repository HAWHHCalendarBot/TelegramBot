const Telegraf = require('telegraf')

const bot = new Telegraf.Composer()

bot.use((ctx, next) => {
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
  }

  delete ctx.state.userconfig.settings

  return next()
})

module.exports = {
  bot
}
