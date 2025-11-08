import {readFile, watch} from 'node:fs/promises';
import type {EventDirectory, EventId} from './types.ts';
import {typedEntries} from './javascript-helper.js';
import {EVENT_FILES_DIR} from './git-helper.js';

const DIRECTORY_FILE = `${EVENT_FILES_DIR}/directory.json`;

let directory = await loadDirectory();
let namesOfEvents: Record<string, string> = await generateMapping();

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

async function loadDirectory(): Promise<Partial<EventDirectory>> {
	console.log(new Date(), 'Loading directory');
	const directoryString = await readFile(DIRECTORY_FILE, 'utf8');
	const directory = JSON.parse(directoryString) as Partial<EventDirectory>;
	return directory;
}

async function generateMapping(): Promise<Record<string, string>> {
	const namesOfEvents: Record<string, string> = {};

	function collect(directory: Partial<EventDirectory>) {
		for (const subDirectory of Object.values(directory.subDirectories ?? {})) {
			collect(subDirectory);
		}

		Object.assign(namesOfEvents, directory.events ?? {});
	}

	collect(directory);
	return namesOfEvents;
}

function getSubdirectory(path: string[]): Partial<EventDirectory> | undefined {
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

export function getEventName(id: EventId): string {
	return namesOfEvents[id] ?? id;
}

export function count(): number {
	return Object.keys(namesOfEvents).length;
}

export function nonExisting(ids: readonly EventId[]): readonly EventId[] {
	return ids.filter(id => !(id in namesOfEvents));
}

export function find(
	pattern: string | RegExp | undefined,
	startAt: string[] = [],
): Readonly<EventDirectory> {
	if (pattern !== undefined) {
		const regex = new RegExp(pattern, 'i');
		const accumulator: Record<EventId, string> = {};

		function collect(directory: Partial<EventDirectory>) {
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
			events: Object.fromEntries(Object.entries(accumulator).sort((a, b) => a[1].localeCompare(b[1]))),
		};
	}

	const directory = getSubdirectory(startAt) ?? {};
	return {
		subDirectories: directory.subDirectories ?? {},
		events: directory.events ?? {},
	};
}

export function directoryExists(path: string[]): boolean {
	return getSubdirectory(path) !== undefined;
}
