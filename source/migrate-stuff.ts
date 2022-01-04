import {Composer} from 'grammy'

import {getCanteenList} from './lib/mensa-meals.js'
import {MyContext, EventDetails} from './lib/types.js'

export const bot = new Composer<MyContext>()

bot.use(async (ctx, next) => {
	if (!ctx.userconfig.mine.calendarfileSuffix) {
		const fromTime = Date.now() % (10 ** 8)
		ctx.userconfig.mine.calendarfileSuffix = String(fromTime)
	}

	if (!ctx.userconfig.mine.changes) {
		ctx.userconfig.mine.changes = []
	}

	if (!ctx.userconfig.mine.events) {
		ctx.userconfig.mine.events = {}
	}

	if (Array.isArray(ctx.userconfig.mine.events)) {
		const array = ctx.userconfig.mine.events as string[]
		const map: Record<string, EventDetails> = {}
		for (const name of array) {
			map[name] = {}
		}

		ctx.userconfig.mine.events = map
	}

	if (ctx.userconfig.mine.websiteStalkerUpdate || ctx.userconfig.mine.stisysUpdate) {
		await ctx.reply('Das beobachten von StISys ist nicht mehr Teil dieses Bots und wurde in den Channel @HAWHHWebsiteStalker verlagert.')
	}

	if (!ctx.userconfig.mine.mensa) {
		ctx.userconfig.mine.mensa = {}
	}

	// Sometimes people have the main mensa multiple times in the more list
	// Maybe I fixed that bug with 0b25d01, but havnt checked yet
	const {main} = ctx.userconfig.mine.mensa
	let {more} = ctx.userconfig.mine.mensa
	if (main && more && more.length > 0) {
		const beforeCount = more.length
		ctx.userconfig.mine.mensa.more = more.filter(o => o !== main)
		const afterCount = ctx.userconfig.mine.mensa.more.length

		if (beforeCount !== afterCount) {
			console.log('migration: removed main mensa in more', ctx.from)
		}
	}

	// Remove not anymore existing from more
	more = ctx.userconfig.mine.mensa.more
	if (more && more.length > 0) {
		const allAvailableCanteens = await getCanteenList()
		ctx.userconfig.mine.mensa.more = more
			.filter(o => allAvailableCanteens.includes(o))
	}

	delete (ctx as any).userconfig.mine.additionalEvents
	delete (ctx as any).userconfig.mine.mensa.student
	delete (ctx as any).userconfig.mine.settings
	delete (ctx as any).userconfig.mine.showRemovedEvents
	delete (ctx as any).userconfig.mine.stisysUpdate
	delete (ctx as any).userconfig.mine.websiteStalkerUpdate

	return next()
})
