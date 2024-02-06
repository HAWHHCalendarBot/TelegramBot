import {type Body, MenuTemplate} from 'grammy-inline-menu';
import * as mensaGit from '../../lib/mensa-git.js';
import {generateMealText} from '../../lib/mensa-helper.js';
import {getMealsOfDay} from '../../lib/mensa-meals.js';
import type {MyContext} from '../../lib/types.js';
import {menu as mensaSettingsMenu} from './settings.js';

const WEEKDAYS = [
	'Sonntag',
	'Montag',
	'Dienstag',
	'Mittwoch',
	'Donnerstag',
	'Freitag',
	'Samstag',
] as const;
const DAY_IN_MS = 1000 * 60 * 60 * 24;

setInterval(async () => mensaGit.pull(), 1000 * 60 * 30); // Every 30 minutes
// eslint-disable-next-line @typescript-eslint/no-floating-promises
mensaGit.pull();

function getYearMonthDay(
	date: Readonly<Date>,
): Readonly<{year: number; month: number; day: number}> {
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return {year, month, day};
}

function stringifyEqual(first: unknown, second: unknown): boolean {
	if (!first || !second) {
		return false;
	}

	if (first === second) {
		return true;
	}

	return JSON.stringify(first) === JSON.stringify(second);
}

function dateEqual(first: Readonly<Date>, second: Readonly<Date>): boolean {
	return stringifyEqual(getYearMonthDay(first), getYearMonthDay(second));
}

export const menu = new MenuTemplate<MyContext>(menuBody);

function getCurrentSettings(
	context: MyContext,
): Readonly<{mensa?: string; date: Date}> {
	let {mensa, date} = context.session.mensa ?? {};
	mensa ||= context.userconfig.mine.mensa.main;
	date ??= Date.now();

	const now = Date.now();
	// When that date is more than a day ago, update it
	if ((now - date) > DAY_IN_MS) {
		date = Date.now();
		mensa = context.userconfig.mine.mensa.main;
	}

	return {mensa, date: new Date(date)};
}

async function menuBody(context: MyContext): Promise<Body> {
	const {mensa, date} = getCurrentSettings(context);
	const mensaSettings = context.userconfig.mine.mensa;

	if (!mensa || mensa === 'undefined') {
		return '⚠️ Du hast keine Mensa gesetzt, zu der du dein Angebot bekommen möchtest. Diese kannst du in den Einstellungen setzen.';
	}

	const weekday = WEEKDAYS[date.getDay()]!;
	const {year, month, day} = getYearMonthDay(date);
	let text = '';
	text += `<b>${mensa}</b>`;
	text += '\n';
	text += `${weekday} ${day}.${month}.${year}`;
	text += '\n';

	const meals = await getMealsOfDay(mensa, year, month, day);
	text += generateMealText(meals, mensaSettings);

	return {text, parse_mode: 'HTML'};
}

function parseDateString(actionCode: string): Readonly<Date> {
	const date = new Date(Date.parse(actionCode));
	return date;
}

function generateDateString(date: Date): string {
	const {year, month, day} = getYearMonthDay(date);
	return `${year}-${month}-${day}`;
}

function daySelectOptions(context: MyContext): Record<string, string> {
	const {mensa} = getCurrentSettings(context);
	if (!mensa) {
		return {};
	}

	const dateOptions: Date[] = [];
	const daysInFuture = 6;

	for (let i = 0; i < daysInFuture; i++) {
		dateOptions.push(new Date(Date.now() + (DAY_IN_MS * i)));
	}

	const result: Record<string, string> = {};
	for (const date of dateOptions) {
		const weekday = WEEKDAYS[date.getDay()]!
			.slice(0, 2);
		const day = date.getDate();
		const key = generateDateString(date);
		result[key] = `${weekday} ${day}.`;
	}

	return result;
}

function mensaSelectOption(context: MyContext): string[] {
	const current = getCurrentSettings(context).mensa;
	const {main, more} = context.userconfig.mine.mensa;
	return [main, ...(more ?? [])]
		.filter(o => o !== current)
		// eslint-disable-next-line unicorn/prefer-native-coercion-functions
		.filter((o): o is string => Boolean(o));
}

menu.select('t', daySelectOptions, {
	columns: 3,
	isSet: (context, key) =>
		dateEqual(getCurrentSettings(context).date, parseDateString(key)),
	set(context, key) {
		context.session.mensa ??= {};
		context.session.mensa.date = parseDateString(key).getTime();
		return true;
	},
	formatState: (_, textResult, state) =>
		state ? `🕚 ${textResult}` : textResult,
});

menu.choose('m', mensaSelectOption, {
	columns: 1,
	buttonText: (_, key) => '🍽 ' + key,
	do(context, key) {
		context.session.mensa ??= {};
		context.session.mensa.mensa = key;
		return true;
	},
});

menu.submenu('⚙️ Mensa Einstellungen', 'settings', mensaSettingsMenu);
