import {promises as fsPromises} from 'fs'

import {Change, EventEntryInternal, EventEntryFileContent} from './types'
import {formatDateToHumanReadable, parseDateTimeToDate} from './calendar-helper'

export function generateChangeDescription(change: Change): string {
	let text = ''
	if (change.remove) {
		text += '🚫 Entfällt\n'
	}

	if (change.namesuffix) {
		text += `🗯 Namenszusatz: ${change.namesuffix}\n`
	}

	if (change.starttime) {
		text += `🕗 Startzeit: ${change.starttime}\n`
	}

	if (change.endtime) {
		text += `🕓 Endzeit: ${change.endtime}\n`
	}

	if (change.room) {
		text += `📍 Raum: ${change.room}\n`
	}

	return text
}

export function generateChangeText(change: Change): string {
	let text = generateChangeTextHeader(change)

	if (Object.keys(change).length > 2) {
		text += '\nÄnderungen:\n'
		text += generateChangeDescription(change)
	}

	return text
}

export function generateChangeTextHeader(change: Change): string {
	let text = '*Veranstaltungsänderung*\n'
	text += `*${change.name}*`
	if (change.date) {
		text += ` ${formatDateToHumanReadable(change.date)}`
	}

	text += '\n'
	return text
}

export function generateShortChangeText(change: Change): string {
	return `${change.name} ${formatDateToHumanReadable(change.date)}`
}

export async function loadEvents(eventname: string): Promise<EventEntryInternal[]> {
	const filename = eventname.replace('/', '-')
	const content = await fsPromises.readFile(`eventfiles/${filename}.json`, 'utf8')
	const array = JSON.parse(content) as EventEntryFileContent[]
	const parsed = array.map((o): EventEntryInternal => ({
		...o,
		StartTime: parseDateTimeToDate(o.StartTime),
		EndTime: parseDateTimeToDate(o.EndTime)
	}))

	return parsed
}
