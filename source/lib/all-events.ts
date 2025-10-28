import {readFile, watch} from 'node:fs/promises';
import type {
	EventDirectory, EventId, Events,
} from './types.ts';

const DIRECTORY_FILE = 'eventfiles/directory.json';

const directory = await loadDirectory();
const namesOfEvents: Record<string, string> = await generateMapping();

async function watchForDirectoryChanges() {
	const watcher = watch(DIRECTORY_FILE);
	for await (const event of watcher) {
		console.log(event);
		if (event.eventType === 'change') {
			await loadDirectory();
			await generateMapping();
		}
	}
}

// We do not want to await this Promise, since it will never resolve and would cause the module to hang on load.
// eslint-disable-next-line unicorn/prefer-top-level-await
void watchForDirectoryChanges();

async function loadDirectory(): Promise<Partial<EventDirectory>> {
	const directoryString = await readFile(DIRECTORY_FILE);
	const directory = JSON.parse(directoryString.toString()) as Partial<EventDirectory>;
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

function resolvePath(path: string[]): Partial<EventDirectory> {
	let resolvedDirectory = directory;

	for (const part of path) {
		if (resolvedDirectory.subDirectories === undefined || !(part in resolvedDirectory.subDirectories)) {
			throw new Error('Ungültiger Pfad');
		}

		resolvedDirectory = resolvedDirectory.subDirectories[part]!;
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
		const accumulator: Events = {};

		function collect(directory: Partial<EventDirectory>) {
			for (const [eventId, name] of Object.entries(directory.events ?? {})) {
				if (regex.test(name)) {
					accumulator[eventId as EventId] = name;
				}
			}

			for (const subDirectory of Object.values(directory.subDirectories ?? {})) {
				collect(subDirectory);
			}
		}

		collect(resolvePath(startAt));

		return {
			subDirectories: {},
			events: Object.fromEntries(Object.entries(accumulator).sort((a, b) => a[1].localeCompare(b[1]))),
		};
	}

	const directory = resolvePath(startAt);

	return {
		subDirectories: directory.subDirectories ?? {},
		events: directory.events ?? {},
	};
}
