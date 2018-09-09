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
  }

  return next()
})

module.exports = {
  bot
}
