import {readFile} from 'node:fs/promises';
import {html as format} from 'telegram-format';
import {
	formatDateToHumanReadable,
	getEventNameFromContext,
	parseDateTimeToDate,
} from './calendar-helper.ts';
import type {
	Change,
	EventEntryFileContent,
	EventEntryInternal,
	MyContext,
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

export function generateChangeText(ctx: MyContext, change: Change): string {
	let text = generateChangeTextHeader(ctx, change);

	if (Object.keys(change).length > 2) {
		text += '\nÄnderungen:\n';
		text += format.escape(generateChangeDescription(change));
	}

	return text;
}

export function generateChangeTextHeader(ctx: MyContext, change: Change): string {
	let text = '';
	text += format.bold('Veranstaltungsänderung');
	text += '\n';
	text += format.bold(format.escape(getEventNameFromContext(ctx, change.eventId)));
	if (change.date) {
		text += ` ${formatDateToHumanReadable(change.date)}`;
	}

	text += '\n';
	return text;
}

export function generateShortChangeText(ctx: MyContext, change: Change): string {
	return `${getEventNameFromContext(ctx, change.eventId)} ${formatDateToHumanReadable(change.date)}`;
}

export async function loadEvents(eventId: string): Promise<EventEntryInternal[]> {
	try {
		const content = await readFile(`eventfiles/${eventId}.json`, 'utf8');
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
