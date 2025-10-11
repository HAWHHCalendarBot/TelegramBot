import {Composer} from 'grammy';
import {getCanteenList} from './lib/mensa-meals.ts';
import type {MyContext} from './lib/types.ts';

export const bot = new Composer<MyContext>();

bot.use(async (ctx, next) => {
	if (!ctx.userconfig.mine.calendarfileSuffix) {
		const fromTime = Date.now() % (10 ** 8);
		ctx.userconfig.mine.calendarfileSuffix = String(fromTime);
	}

	ctx.userconfig.mine.changes ??= [];
	ctx.userconfig.mine.events ??= {};

	// Delete events in old format, since there is no practical way to match them to the myHAW ids
	if (Array.isArray(ctx.userconfig.mine.events)) {
		ctx.userconfig.mine.events = {};
	} else {
		for (const [maybeEventId, eventDetails] of Object.entries(ctx.userconfig.mine.events)) {
			if (!('name' in eventDetails)) {
				// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
				delete ctx.userconfig.mine.events[maybeEventId];
				const changeIndex = ctx.userconfig.mine.changes.findIndex(change => (change as any).name === maybeEventId);
				if (changeIndex !== -1) {
					ctx.userconfig.mine.changes.splice(changeIndex, 1);
				}
			}
		}
	}

	if (
		Boolean(ctx.userconfig.mine.websiteStalkerUpdate)
		|| Boolean(ctx.userconfig.mine.stisysUpdate)
	) {
		await ctx.reply('Das beobachten von StISys ist nicht mehr Teil dieses Bots und wurde in den Channel @HAWHHWebsiteStalker verlagert.');
	}

	ctx.userconfig.mine.mensa ??= {};
	let more = ctx.userconfig.mine.mensa.more ?? [];

	if (more.length > 0) {
		const allAvailableCanteens = new Set(await getCanteenList());
		more = [...new Set(more)]
			// Remove main from more
			.filter(canteen => canteen !== ctx.userconfig.mine.mensa.main)
			// Remove not anymore existing
			.filter(canteen => allAvailableCanteens.has(canteen))
			.sort();
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
