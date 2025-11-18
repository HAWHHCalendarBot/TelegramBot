import {Composer} from 'grammy';
import {getCanteenList} from './lib/mensa-meals.ts';
import type {MyContext} from './lib/types.ts';

export const bot = new Composer<MyContext>();

bot.use(async (ctx, next) => {
	if (!ctx.userconfig.mine.calendarfileSuffix) {
		const fromTime = Date.now() % (10 ** 8);
		ctx.userconfig.mine.calendarfileSuffix = String(fromTime);
	}

	ctx.userconfig.mine.events ??= {};
	if (Array.isArray(ctx.userconfig.mine.events)) {
		ctx.userconfig.mine.events = {};
	}

	ctx.userconfig.mine.mensa ??= {};
	let more = ctx.userconfig.mine.mensa.more ?? [];
	if (more.length > 0 || ctx.userconfig.mine.mensa.main) {
		const allAvailableCanteens = new Set(await getCanteenList());
		more = [...new Set(more)]
			// Remove main from more
			.filter(canteen => canteen !== ctx.userconfig.mine.mensa.main)
			// Remove not anymore existing
			.filter(canteen => allAvailableCanteens.has(canteen))
			.sort();
		while (
			ctx.userconfig.mine.mensa.main
			&& !allAvailableCanteens.has(ctx.userconfig.mine.mensa.main)
		) {
			ctx.userconfig.mine.mensa.main = more.pop();
		}
	}

	if (more.length > 0) {
		ctx.userconfig.mine.mensa.more = more;
	} else {
		delete ctx.userconfig.mine.mensa.more;
	}

	delete (ctx as any).userconfig.mine.additionalEvents;
	delete (ctx as any).userconfig.mine.mensa.student;
	delete (ctx as any).userconfig.mine.settings;
	delete (ctx as any).userconfig.mine.showRemovedEvents;
	delete (ctx as any).userconfig.mine.stisysUpdate;
	delete (ctx as any).userconfig.mine.websiteStalkerUpdate;

	return next();
});
