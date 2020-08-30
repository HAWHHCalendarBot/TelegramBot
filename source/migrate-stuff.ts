import {Composer} from 'telegraf'

import {getCanteenList} from './lib/mensa-meals'
import {MyContext} from './lib/types'

export const bot = new Composer<MyContext>()

bot.use(async (ctx, next) => {
	if (!ctx.state.userconfig.changes) {
		ctx.state.userconfig.changes = []
	}

	if (!ctx.state.userconfig.events) {
		ctx.state.userconfig.events = []
	}

	if (!ctx.state.userconfig.mensa) {
		ctx.state.userconfig.mensa = {}
	}

	// Sometimes people have the main mensa multiple times in the more list
	// Maybe I fixed that bug with 0b25d01, but havnt checked yet
	const {main} = ctx.state.userconfig.mensa
	let {more} = ctx.state.userconfig.mensa
	if (main && more && more.length > 0) {
		const beforeCount = more.length
		ctx.state.userconfig.mensa.more = more.filter(o => o !== main)
		const afterCount = ctx.state.userconfig.mensa.more.length

		if (beforeCount !== afterCount) {
			console.log('migration: removed main mensa in more', ctx.from)
		}
	}

	// Remove not anymore existing from more
	more = ctx.state.userconfig.mensa.more
	if (more && more.length > 0) {
		const allAvailableCanteens = await getCanteenList()
		ctx.state.userconfig.mensa.more = more
			.filter(o => allAvailableCanteens.includes(o))
	}

	delete (ctx as any).state.userconfig.mensa.student
	delete (ctx as any).state.userconfig.settings
	delete (ctx as any).state.userconfig.showRemovedEvents
	delete (ctx as any).state.userconfig.additionalEvents

	return next()
})
