import {readFile} from 'node:fs/promises';
import {html as format} from 'telegram-format';
import type {Change, EventEntry, NaiveDateTime} from './types.ts';

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

export function generateChangeText(
	name: string,
	date: NaiveDateTime | undefined,
	change: Change,
): string {
	let text = generateChangeTextHeader(name, date);

	if (Object.keys(change).length > 0) {
		text += '\nÄnderungen:\n';
		text += format.escape(generateChangeDescription(change));
	}

	return text;
}

export function generateChangeTextHeader(
	name: string,
	date: NaiveDateTime | undefined,
): string {
	let text = '';
	text += format.bold('Veranstaltungsänderung');
	text += '\n';
	text += format.bold(format.escape(name));
	if (date) {
		text += ` ${date}`;
	}

	text += '\n';
	return text;
}

export function generateShortChangeText(
	name: string,
	date: NaiveDateTime,
): string {
	return `${name} ${date}`;
}

export async function loadEvents(eventname: string): Promise<EventEntry[]> {
	try {
		const filename = eventname.replaceAll('/', '-');
		const content = await readFile(`eventfiles/${filename}.json`, 'utf8');
		return JSON.parse(content) as EventEntry[];
	} catch (error) {
		console.error('ERROR while loading events for change date picker', error);
		return [];
	}
}
