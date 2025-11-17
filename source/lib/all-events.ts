import {readFile} from 'node:fs/promises';
import {pull} from './git.ts';
import {typedEntries} from './javascript-helper.ts';
import type {EventDirectory, EventEntry, EventId} from './types.ts';

let directory: EventDirectory = {};
let namesOfEvents: Readonly<Record<EventId, string>> = {};

setInterval(async () => update(), 1000 * 60 * 30); // Every 30 minutes
await update();
console.log(new Date(), 'eventfiles loaded');

async function update() {
	await pull(
		'eventfiles',
		'https://github.com/HAWHHCalendarBot/eventfiles.git',
	);
	const directoryString = await readFile('eventfiles/directory.json', 'utf8');
	directory = JSON.parse(directoryString) as EventDirectory;
	namesOfEvents = await generateMapping();
}

async function generateMapping(): Promise<Readonly<Record<EventId, string>>> {
	const namesOfEvents: Record<EventId, string> = {};

	function collect(directory: EventDirectory) {
		for (const subDirectory of Object.values(directory.subDirectories ?? {})) {
			collect(subDirectory);
		}

		Object.assign(namesOfEvents, directory.events ?? {});
	}

	collect(directory);
	return namesOfEvents;
}

function getSubdirectory(path: string[]): EventDirectory | undefined {
	let resolvedDirectory = directory;

	for (const part of path) {
		const subDirectory = resolvedDirectory.subDirectories?.[part];
		if (subDirectory === undefined) {
			return undefined;
		}

		resolvedDirectory = subDirectory;
	}

	return resolvedDirectory;
}

export function directoryHasContent(directory: EventDirectory): boolean {
	const events = Object.keys(directory.events ?? {}).length;
	const subDirectories = Object.keys(directory.subDirectories ?? {}).length;
	return events > 0 || subDirectories > 0;
}

export function directoryExists(path: string[]): boolean {
	if (path.length === 0) {
		// Toplevel always exists
		return true;
	}

	const directory = getSubdirectory(path);
	return Boolean(directory && directoryHasContent(directory));
}

export function getEventName(id: EventId): string {
	return namesOfEvents[id] ?? id;
}

export function count(): number {
	return Object.keys(namesOfEvents).length;
}

export function exists(id: EventId): boolean {
	return id in namesOfEvents;
}

export function find(
	path: string[],
	pattern: string | RegExp | undefined,
): EventDirectory {
	if (!pattern) {
		return getSubdirectory(path) ?? {};
	}

	const regex = new RegExp(pattern, 'i');
	const accumulator: Record<EventId, string> = {};

	function collect(directory: EventDirectory) {
		for (const [eventId, name] of typedEntries(directory.events ?? {})) {
			if (regex.test(name)) {
				accumulator[eventId] = name;
			}
		}

		for (const subDirectory of Object.values(directory.subDirectories ?? {})) {
			collect(subDirectory);
		}
	}

	collect(getSubdirectory(path) ?? {});
	return {
		events: Object.fromEntries(typedEntries(accumulator).sort((a, b) => a[1].localeCompare(b[1]))),
	};
}

export async function loadEvents(eventId: EventId): Promise<EventEntry[]> {
	const content = await readFile(`eventfiles/events/${eventId}.json`, 'utf8');
	return JSON.parse(content) as EventEntry[];
}
