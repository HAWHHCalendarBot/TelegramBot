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

export function getEventNameFromContext(ctx: MyContext, eventId: string): string {
	const name = ctx.userconfig.mine.events[eventId]?.name;
	if (name === undefined) {
		throw new Error('Konnte Veranstaltungsnamen nicht finden');
	}

	return name;
}

export function formatDateToHumanReadable(isoDateString: string): string {
	const date = new Date(Date.parse(isoDateString + 'Z'));
	return date.toLocaleString('de-DE', {
		timeZone: 'Europe/Berlin',
		hour12: false,
		year: undefined,
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});
}

export function formatDateToStoredChangeDate(date: Readonly<Date>): string {
	return date.toISOString().replace(/:\d{2}.\d{3}Z$/, '');
}

export function parseDateTimeToDate(dateTime: string): Date {
	if (dateTime.includes('(')) {
		const unixTime = Number(/(\d+)\+/.exec(dateTime)![1]);
		const date = new Date(unixTime);
		return date;
	}

	return new Date(Date.parse(dateTime));
}
