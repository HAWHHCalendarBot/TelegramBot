import {readFile} from 'node:fs/promises';
import {html as format} from 'telegram-format';
import {
	formatDateToHumanReadable,
	parseDateTimeToDate,
} from './calendar-helper.ts';
import type {
	Change,
	EventEntryFileContent,
	EventEntryInternal,
} from './types.ts';

export function generateChangeDescription(change: Change): string {
	let text = '';
	if (change.remove) {
		text += '🚫 Entfällt\n';
	}

	if (change.namesuffix) {
		text += `🗯 Namenszusatz: ${change.namesuffix}\n`;
	}

	if (change.starttime) {
		text += `🕗 Startzeit: ${change.starttime}\n`;
	}

	if (change.endtime) {
		text += `🕓 Endzeit: ${change.endtime}\n`;
	}

	if (change.room) {
		text += `📍 Raum: ${change.room}\n`;
	}

	return text;
}

export function generateChangeText(change: Change): string {
	let text = generateChangeTextHeader(change);

	if (Object.keys(change).length > 2) {
		text += '\nÄnderungen:\n';
		text += format.escape(generateChangeDescription(change));
	}

	return text;
}

export function generateChangeTextHeader(change: Change): string {
	let text = '';
	text += format.bold('Veranstaltungsänderung');
	text += '\n';
	text += format.bold(format.escape(change.name));
	if (change.date) {
		text += ` ${formatDateToHumanReadable(change.date)}`;
	}

	text += '\n';
	return text;
}

export function generateShortChangeText(change: Change): string {
	return `${change.name} ${formatDateToHumanReadable(change.date)}`;
}

export async function loadEvents(eventname: string): Promise<EventEntryInternal[]> {
	try {
		const filename = eventname.replaceAll('/', '-');
		const content = await readFile(`eventfiles/${filename}.json`, 'utf8');
		const array = JSON.parse(content) as EventEntryFileContent[];
		const parsed = array.map((o): EventEntryInternal => ({
			...o,
			StartTime: parseDateTimeToDate(o.StartTime),
			EndTime: parseDateTimeToDate(o.EndTime),
		}));

		return parsed;
	} catch (error) {
		console.error('ERROR while loading events for change date picker', error);
		return [];
	}
}
