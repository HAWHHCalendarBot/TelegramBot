import {MenuTemplate} from 'grammy-inline-menu';
import {
	HOUR_OPTIONS,
	MINUTE_OPTIONS,
} from '../../../../lib/event-creation-menu-options.js';
import {BACK_BUTTON_TEXT} from '../../../../lib/inline-menu.js';
import type {MyContext} from '../../../../lib/types.js';

export function createTimeSelectionSubmenuButtons(
	menu: MenuTemplate<MyContext>,
	hide: (ctx: MyContext) => boolean,
): void {
	createTimeSelectionSubmenuButton(menu, 'starttime', hide);
	createTimeSelectionSubmenuButton(menu, 'endtime', hide);
}

function createTimeSelectionSubmenuButton(
	menu: MenuTemplate<MyContext>,
	time: 'starttime' | 'endtime',
	hide: (ctx: MyContext) => boolean,
): void {
	const subMenu = new MenuTemplate<MyContext>(time === 'starttime'
		? 'Zu welchem Zeitpunkt beginnt diese Veranstaltung stattdessen?'
		: 'Zu welchem Zeitpunkt endet diese Veranstaltung stattdessen?');

	menu.submenu(time, subMenu, {
		joinLastRow: time === 'endtime',
		hide,
		text(ctx) {
			const prefix = time === 'starttime' ? '▶️ ' : '⏹ ';
			const alreadySet = ctx.session.generateChange![time];
			const fallback = time === 'starttime' ? 'Startzeit' : 'Endzeit';
			return prefix + (alreadySet ?? fallback);
		},
	});

	subMenu.select('h', {
		columns: 3,
		choices: HOUR_OPTIONS,
		isSet: (ctx, key) =>
			Number(ctx.session.generateChange![time]?.split(':')[0]) === Number(key),
		set(ctx, key) {
			const {minute} = getCurrent(ctx, time);
			ctx.session.generateChange![time] = formatTime(key, minute);
			return true;
		},
	});

	subMenu.select('m', {
		columns: 4,
		choices: MINUTE_OPTIONS,
		buttonText: (_, number) => ':' + numberToTwoDigit(number),
		isSet: (ctx, key) =>
			Number(ctx.session.generateChange![time]?.split(':')[1]) === Number(key),
		set(ctx, key) {
			const {hour} = getCurrent(ctx, time);
			ctx.session.generateChange![time] = formatTime(hour, key);
			return true;
		},
	});

	subMenu.navigate('..', {text: BACK_BUTTON_TEXT});
}

function formatTime(hour: number | string, minute: number | string): string {
	return numberToTwoDigit(hour) + ':' + numberToTwoDigit(minute);
}

function numberToTwoDigit(number: number | string): string {
	return Number(number) < 10 ? `0${number}` : String(number);
}

function getCurrent(
	ctx: MyContext,
	time: 'starttime' | 'endtime',
): {hour: number; minute: number} {
	const current = ctx.session.generateChange![time];
	const fallback = time === 'starttime' ? '8:00' : '16:00';
	const [hour, minute] = (current ?? fallback).split(':').map(Number);
	return {hour: hour!, minute: minute!};
}
