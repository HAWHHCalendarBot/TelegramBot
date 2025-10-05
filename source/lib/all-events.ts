import {readFile} from 'node:fs/promises';
import type {EventDirectory, EventDirectoryEvent} from './types.ts';

async function getAll(): Promise<EventDirectory[]> {
	const data = await readFile('eventfiles/directory.json', 'utf8');
	return JSON.parse(data) as EventDirectory[];
}

export async function count(): Promise<number> {
	const allEvents = (await find('', [], []));
	return allEvents.length;
}

export async function exists(id: string): Promise<EventDirectoryEvent | undefined> {
	const allDirectories = await getAll();

	function traverse(directory: EventDirectory): EventDirectoryEvent | undefined {
		const event = directory.Events?.find(event => event.Id === id);
		if (event !== undefined) {
			return event;
		}

		for (const subDirectory of directory.SubDirectories ?? []) {
			const eventInSubdirectory = traverse(subDirectory);
			if (eventInSubdirectory !== undefined) {
				return eventInSubdirectory;
			}
		}

		return undefined;
	}

	for (const subDirectory of allDirectories) {
		const event = traverse(subDirectory);
		if (event !== undefined) {
			return event;
		}
	}

	return undefined;
}

export async function nonExisting(ids: readonly string[]): Promise<string[]> {
	const allEvents = await getAll();
	const result = [...ids];

	function traverse(directory: EventDirectory) {
		for (const event of directory.Events ?? []) {
			const eventId = event.Id;
			if (result.includes(eventId)) {
				result.splice(result.indexOf(eventId), 1);
			}
		}

		for (const subDirectory of directory.SubDirectories ?? []) {
			traverse(subDirectory);
		}
	}

	for (const directory of allEvents) {
		traverse(directory);
	}

	return result;
}

export async function find(
	pattern: string | RegExp | undefined,
	ignoreIds: readonly string[] = [],
	startAt: number[] = [],
): Promise<ReadonlyArray<EventDirectoryEvent | [EventDirectory, number[]]>> {
	if (pattern !== undefined) {
		const accumulator: EventDirectoryEvent[] = [];
		await _find(pattern, ignoreIds, await resolvePath(startAt), accumulator);
		return [...new Set(accumulator)].sort((a, b) =>
			a.Name.localeCompare(b.Name));
	}

	const dir = await resolvePath(startAt);

	return [
		...(dir.SubDirectories ?? []).map((dir, i) => [dir, [...startAt, i]] as [EventDirectory, number[]]),
		...(dir.Events ?? []).filter(event => !ignoreIds.includes(event.Id)),
	];
}

async function _find(
	pattern: string | RegExp,
	ignoreIds: readonly string[],
	startAt: EventDirectory,
	accumulator: EventDirectoryEvent[],
) {
	if (startAt?.Events !== undefined) {
		const regex = new RegExp(pattern, 'i');
		accumulator.push(...startAt?.Events
			.filter(event => regex.test(event.Name) && !ignoreIds.includes(event.Id)) ?? []);
	}

	await Promise.all(startAt.SubDirectories
		?.map(async subDirectory => _find(pattern, ignoreIds, subDirectory, accumulator))
		?? []);
}

export async function resolvePath(path: number[]): Promise<EventDirectory> {
	let Name = 'HAW Hamburg';
	let Events: EventDirectoryEvent[] | undefined;
	let SubDirectories: EventDirectory[] | undefined = await getAll();

	for (const part of path) {
		if (SubDirectories === undefined || SubDirectories.length <= part) {
			throw new Error('Ungültiger Pfad');
		}

		Name = SubDirectories[part]!.Name;
		Events = SubDirectories[part]!.Events;
		SubDirectories = SubDirectories[part]!.SubDirectories;
	}

	return {Name, SubDirectories, Events};
}
