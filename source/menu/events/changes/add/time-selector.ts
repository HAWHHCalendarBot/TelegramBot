import {MenuTemplate} from 'grammy-inline-menu';
import {
	HOUR_OPTIONS,
	MINUTE_OPTIONS,
} from '../../../../lib/event-creation-menu-options.js';
import {BACK_BUTTON_TEXT} from '../../../../lib/inline-menu.js';
import type {MyContext} from '../../../../lib/types.js';

export function createTimeSelectionSubmenuButtons(
	menu: MenuTemplate<MyContext>,
	hide: (context: MyContext) => boolean,
): void {
	createTimeSelectionSubmenuButton(menu, 'starttime', hide);
	createTimeSelectionSubmenuButton(menu, 'endtime', hide);
}

function createTimeSelectionSubmenuButton(
	menu: MenuTemplate<MyContext>,
	time: 'starttime' | 'endtime',
	hide: (context: MyContext) => boolean,
): void {
	function buttonText(context: MyContext): string {
		const prefix = time === 'starttime' ? '▶️ ' : '⏹ ';
		const alreadySet = context.session.generateChange![time];
		const fallback = time === 'starttime' ? 'Startzeit' : 'Endzeit';
		return prefix + (alreadySet ?? fallback);
	}

	const subMenu = new MenuTemplate<MyContext>(menuBody(time));

	menu.submenu(buttonText, time, subMenu, {
		joinLastRow: time === 'endtime',
		hide,
	});

	subMenu.select('h', HOUR_OPTIONS, {
		columns: 3,
		isSet: (context, key) =>
			Number(context.session.generateChange![time]?.split(':')[0])
				=== Number(key),
		set(context, key) {
			const {minute} = getCurrent(context, time);
			context.session.generateChange![time] = formatTime(key, minute);
			return true;
		},
	});

	subMenu.select('m', MINUTE_OPTIONS, {
		columns: 4,
		buttonText: (_, number) => ':' + numberToTwoDigit(number),
		isSet: (context, key) =>
			Number(context.session.generateChange![time]?.split(':')[1])
				=== Number(key),
		set(context, key) {
			const {hour} = getCurrent(context, time);
			context.session.generateChange![time] = formatTime(hour, key);
			return true;
		},
	});

	subMenu.navigate(BACK_BUTTON_TEXT, '..');
}

function formatTime(hour: number | string, minute: number | string): string {
	return numberToTwoDigit(hour) + ':' + numberToTwoDigit(minute);
}

function numberToTwoDigit(number: number | string): string {
	return Number(number) < 10 ? `0${number}` : String(number);
}

function menuBody(time: 'starttime' | 'endtime'): string {
	if (time === 'starttime') {
		return 'Zu welchem Zeitpunkt beginnt diese Veranstaltung stattdessen?';
	}

	return 'Zu welchem Zeitpunkt endet diese Veranstaltung stattdessen?';
}

function getCurrent(
	context: MyContext,
	time: 'starttime' | 'endtime',
): {hour: number; minute: number} {
	const current = context.session.generateChange![time];
	const fallback = time === 'starttime' ? '8:00' : '16:00';
	const [hour, minute] = (current ?? fallback).split(':').map(Number);
	return {hour: hour!, minute: minute!};
}
