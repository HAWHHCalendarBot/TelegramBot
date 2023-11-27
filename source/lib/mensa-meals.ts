import {readdir, readFile} from 'node:fs/promises';
import type {Meal} from './meal.js';

export async function getCanteenList(): Promise<string[]> {
	const found = await readdir('mensa-data', {withFileTypes: true});
	const dirs = found
		.filter(o => o.isDirectory())
		.map(o => o.name)
		.filter(o => !o.startsWith('.'));
	return dirs;
}

function getFilename(
	mensa: string,
	year: number,
	month: number,
	day: number,
): string {
	const y = year.toLocaleString(undefined, {
		minimumIntegerDigits: 4,
		useGrouping: false,
	});
	const m = month.toLocaleString(undefined, {minimumIntegerDigits: 2});
	const d = day.toLocaleString(undefined, {minimumIntegerDigits: 2});
	return `mensa-data/${mensa}/${y}/${m}/${d}.json`;
}

export async function getMealsOfDay(
	mensa: string,
	year: number,
	month: number,
	day: number,
): Promise<Meal[]> {
	try {
		const filename = getFilename(mensa, year, month, day);
		const content = await readFile(filename, 'utf8');
		return JSON.parse(content) as Meal[];
	} catch {
		return [];
	}
}
