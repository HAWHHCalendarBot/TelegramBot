import {readFile} from 'node:fs/promises';
import {html as format} from 'telegram-format';
import type {
	Change, EventEntry, EventId, NaiveDateTime,
} from './types.ts';
import {getEventName} from './all-events.js';
import {EVENT_FILES_DIR} from "./git.js";

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
	eventId: EventId,
	date: NaiveDateTime | undefined,
	change: Change,
): string {
	let text = generateChangeTextHeader(eventId, date);

	if (Object.keys(change).length > 0) {
		text += '\nÄnderungen:\n';
		text += format.escape(generateChangeDescription(change));
	}

	return text;
}

export function generateChangeTextHeader(
	eventId: EventId,
	date: NaiveDateTime | undefined,
): string {
	let text = '';
	text += format.bold('Veranstaltungsänderung');
	text += '\n';
	text += format.bold(format.escape(getEventName(eventId)));
	if (date) {
		text += ` ${date}`;
	}

	text += '\n';
	return text;
}

export function generateShortChangeText(
	eventId: EventId,
	date: NaiveDateTime,
): string {
	return `${getEventName(eventId)} ${date}`;
}

export async function loadEvents(eventId: EventId): Promise<EventEntry[]> {
	try {
		const content = await readFile(`${EVENT_FILES_DIR}/events/${eventId}.json`, 'utf8');
		return JSON.parse(content) as EventEntry[];
	} catch (error) {
		console.error('ERROR while loading events for change date picker', error);
		return [];
	}
}
