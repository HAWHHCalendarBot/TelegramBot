import {MenuTemplate} from 'grammy-inline-menu';
import * as git from '../../lib/git.ts';
import {generateMealText} from '../../lib/mensa-helper.ts';
import {getMealsOfDay} from '../../lib/mensa-meals.ts';
import type {MyContext} from '../../lib/types.ts';
import {menu as mensaSettingsMenu} from './settings.ts';

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

setInterval(async () => git.pullMensaData(), 1000 * 60 * 30); // Every 30 minutes
void git.pullMensaData();

function getYearMonthDay(date: Readonly<Date>): Readonly<{year: number; month: number; day: number}> {
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

function getCurrentSettings(ctx: MyContext): Readonly<{mensa?: string; date: Date}> {
	let date = ctx.session.mensa?.date ?? Date.now();
	let mensa = ctx.session.mensa?.mensa;

	const now = Date.now();
	// When that date is more than a day ago, update it
	if (!mensa || (now - date) > DAY_IN_MS) {
		date = Date.now();
		mensa = ctx.userconfig.mine.mensa.main;
	}

	return {mensa, date: new Date(date)};
}

export const menu = new MenuTemplate<MyContext>(async ctx => {
	const {mensa, date} = getCurrentSettings(ctx);
	const mensaSettings = ctx.userconfig.mine.mensa;

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
});

function parseDateString(actionCode: string): Readonly<Date> {
	const date = new Date(Date.parse(actionCode));
	return date;
}

function generateDateString(date: Date): string {
	const {year, month, day} = getYearMonthDay(date);
	return `${year}-${month}-${day}`;
}

// Select day
menu.select('t', {
	columns: 3,
	choices(ctx) {
		const {mensa} = getCurrentSettings(ctx);
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
			const weekday = WEEKDAYS[date.getDay()]!.slice(0, 2);
			const day = date.getDate();
			const key = generateDateString(date);
			result[key] = `${weekday} ${day}.`;
		}

		return result;
	},
	isSet: (ctx, key) =>
		dateEqual(getCurrentSettings(ctx).date, parseDateString(key)),
	set(ctx, key) {
		ctx.session.mensa ??= {};
		ctx.session.mensa.date = parseDateString(key).getTime();
		return true;
	},
	formatState: (_, textResult, state) =>
		state ? `🕚 ${textResult}` : textResult,
});

// Select mensa
menu.choose('m', {
	columns: 1,
	choices(ctx) {
		const current = getCurrentSettings(ctx).mensa;
		const {main, more} = ctx.userconfig.mine.mensa;
		return [main, ...(more ?? [])]
			.filter(o => o !== current)
			.filter(o => typeof o === 'string')
			.filter(Boolean);
	},
	buttonText: (_, key) => '🍽 ' + key,
	do(ctx, key) {
		ctx.session.mensa ??= {};
		ctx.session.mensa.mensa = key;
		return true;
	},
});

menu.submenu('settings', mensaSettingsMenu, {text: '⚙️ Mensa Einstellungen'});
