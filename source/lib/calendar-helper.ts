import {Userconfig} from './types'

export function getUrl(id: number, userconfig: Userconfig): string {
	let filename = `${id}`
	const {calendarfileSuffix} = userconfig
	if (calendarfileSuffix) {
		filename += `-${calendarfileSuffix}`
	}

	const full = `calendarbot.hawhh.de/tg/${filename}.ics`
	return full
}

export function formatDateToHumanReadable(isoDateString: string): string {
	const date = new Date(Date.parse(isoDateString + 'Z'))
	return date.toLocaleString('de-DE', {
		timeZone: 'Europe/Berlin',
		hour12: false,
		year: undefined,
		month: 'long',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	})
}

export function parseDateTimeToDate(dateTime: string): Date {
	if (dateTime.includes('(')) {
		const unixTime = Number(/(\d+)\+/.exec(dateTime)![1])
		const date = new Date(unixTime)
		return date
	}

	return new Date(Date.parse(dateTime))
}