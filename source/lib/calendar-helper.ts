import type {MyContext, Userconfig} from './types.ts';

export function getUrl(id: number, userconfig: Userconfig): string {
	let filename = `${id}`;
	const {calendarfileSuffix} = userconfig;
	if (calendarfileSuffix) {
		filename += `-${calendarfileSuffix}`;
	}

	const full = `calendarbot.hawhh.de/tg/${filename}.ics`;
	return full;
}

export function getUrlFromContext(ctx: MyContext): string {
	return getUrl(ctx.from!.id, ctx.userconfig.mine);
}
