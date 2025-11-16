import {readFile, watch} from 'node:fs/promises';
import {EVENT_FILES_DIR} from './git.js';
import {typedEntries} from './javascript-helper.js';
import type {EventDirectory, EventId} from './types.ts';

const DIRECTORY_FILE = `${EVENT_FILES_DIR}/directory.json`;

let directory = await loadDirectory();
let namesOfEvents: Readonly<Record<EventId, string>> = await generateMapping();

async function watchForDirectoryChanges() {
	const watcher = watch(DIRECTORY_FILE);
	for await (const event of watcher) {
		if (event.eventType === 'change') {
			console.log(new Date(), 'Detected file change. Reloading...');
			directory = await loadDirectory();
			namesOfEvents = await generateMapping();
		}
	}
}

// We do not want to await this Promise, since it will never resolve and would cause the module to hang on load.
// eslint-disable-next-line unicorn/prefer-top-level-await
void watchForDirectoryChanges();

async function loadDirectory(): Promise<EventDirectory> {
	console.log(new Date(), 'Loading directory');
	const directoryString = await readFile(DIRECTORY_FILE, 'utf8');
	const directory = JSON.parse(directoryString) as EventDirectory;
	return directory;
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

export function nonExisting(ids: readonly EventId[]): readonly EventId[] {
	return ids.filter(id => !(id in namesOfEvents));
}

export function find(
	pattern: string | RegExp | undefined,
	startAt: string[],
): EventDirectory {
	if (pattern !== undefined) {
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

		collect(getSubdirectory(startAt) ?? {});
		return {
			subDirectories: {},
			events: Object.fromEntries(typedEntries(accumulator).sort((a, b) => a[1].localeCompare(b[1]))),
		};
	}

	return getSubdirectory(startAt) ?? {};
}
