import {StatelessQuestion} from '@grammyjs/stateless-question';
import {arrayFilterUnique} from 'array-filter-unique';
import {Composer} from 'grammy';
import {
	deleteMenuFromContext,
	getMenuOfPath,
	MenuTemplate,
	replyMenuToContext,
} from 'grammy-inline-menu';
import {
	formatDateToHumanReadable,
	formatDateToStoredChangeDate,
} from '../../../../lib/calendar-helper.js';
import {
	generateChangeText,
	loadEvents,
} from '../../../../lib/change-helper.js';
import type {Change, MyContext} from '../../../../lib/types.js';
import * as changeDetails from '../details.js';
import {createDatePickerButtons} from './date-selector.js';
import {createTimeSelectionSubmenuButtons} from './time-selector.js';

function changesOfEvent(ctx: MyContext, name: string) {
	const allChanges = ctx.userconfig.mine.changes;
	return allChanges.filter(o => o.name === name);
}

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(ctx => {
	ctx.session.generateChange ??= {};

	if (ctx.match) {
		ctx.session.generateChange.name = ctx.match[1]!.replaceAll(';', '/');
	}

	const {name, date, add} = ctx.session.generateChange;
	let text = '';

	if (!date) {
		text = 'Zu welchem Termin willst du eine Änderung hinzufügen?';
		const changes = changesOfEvent(ctx, name!);
		if (changes.length > 0) {
			text
				+= '\n\nFolgende Termine habe bereits eine Veränderung. Entferne die Veränderung zuerst, bevor du eine neue erstellen kannst.';
			text += '\n';

			const dates = changes.map(o => o.date);
			dates.sort();
			text += dates
				.map(o => formatDateToHumanReadable(o))
				.map(o => `- ${o}`)
				.join('\n');
		}
	}

	if (date) {
		text = generateChangeText(ctx.session.generateChange as Change);
		text += add
			? '\nSpezifiziere den zusätzlichen Termin.'
			: '\nWelche Art von Änderung willst du vornehmen?';
	}

	return {text, parse_mode: 'HTML'};
});

function hidePickDateStep(ctx: MyContext): boolean {
	const {name, date} = ctx.session.generateChange ?? {};
	return !name || Boolean(date);
}

function hideGenerateChangeStep(ctx: MyContext): boolean {
	const {name, date} = ctx.session.generateChange ?? {};
	return !name || !date;
}

function hideGenerateAddStep(ctx: MyContext): boolean {
	const {name, date, add} = ctx.session.generateChange ?? {};
	return !name || !date || !add;
}

function generationDataIsValid(ctx: MyContext): boolean {
	const keys = Object.keys(ctx.session.generateChange ?? []);
	// Required (2): name and date
	// There have to be other changes than that in order to do something.
	return keys.length > 2;
}

menu.interact('new-date', {
	text: '➕ Zusätzlicher Termin',
	hide: hidePickDateStep,
	do(ctx) {
		// Set everything that has to be set to be valid.
		// When the user dont like the data they can change it but they are not able to create invalid data.
		ctx.session.generateChange!.add = true;
		ctx.session.generateChange!.date = formatDateToStoredChangeDate(new Date());
		ctx.session.generateChange!.starttime = new Date().toLocaleTimeString(
			'de-DE',
			{hour12: false, hour: '2-digit', minute: '2-digit'},
		);
		ctx.session.generateChange!.endtime = '23:45';
		return true;
	},
});

menu.choose('date', {
	columns: 2,
	hide: hidePickDateStep,
	async choices(ctx) {
		const name = ctx.match![1]!.replaceAll(';', '/');
		const {date} = ctx.session.generateChange ?? {};
		if (date) {
			// Date already selected
			return {};
		}

		const existingChangeDates = new Set(changesOfEvent(ctx, name).map(o => o.date));
		const events = await loadEvents(name);
		const dates = events
			.map(o => o.StartTime)
			.map(o => formatDateToStoredChangeDate(o))
			.filter(o => !existingChangeDates.has(o))
			.filter(arrayFilterUnique());
		return Object.fromEntries(dates.map(date => [date, formatDateToHumanReadable(date)]));
	},
	do(ctx, key) {
		ctx.session.generateChange!.date = key;
		return true;
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

menu.interact('remove', {
	text: '🚫 Entfällt',
	async do(ctx) {
		ctx.session.generateChange!.remove = true;
		return finish(ctx);
	},
	hide(ctx) {
		if (hideGenerateChangeStep(ctx)) {
			return true;
		}

		return Object.keys(ctx.session.generateChange!).length > 2;
	},
});

createDatePickerButtons(menu, hideGenerateAddStep);

createTimeSelectionSubmenuButtons(menu, hideGenerateChangeStep);

const namesuffixQuestion = new StatelessQuestion<MyContext>(
	'change-add-suffix',
	async (ctx, path) => {
		if (ctx.message.text) {
			ctx.session.generateChange!.namesuffix = ctx.message.text;
		}

		await replyMenuToContext(menu, ctx, path);
	},
);

const roomQuestion = new StatelessQuestion<MyContext>(
	'change-add-room',
	async (ctx, path) => {
		if (ctx.message.text) {
			ctx.session.generateChange!.room = ctx.message.text;
		}

		await replyMenuToContext(menu, ctx, path);
	},
);

bot.use(namesuffixQuestion.middleware());
bot.use(roomQuestion.middleware());

function questionButtonText(
	property: 'namesuffix' | 'room',
	emoji: string,
	fallback: string,
): (ctx: MyContext) => string {
	return ctx => {
		const value = ctx.session.generateChange![property];
		const text = value ?? fallback;
		return emoji + ' ' + text;
	};
}

menu.interact('namesuffix', {
	text: questionButtonText('namesuffix', '🗯', 'Namenszusatz'),
	hide: hideGenerateChangeStep,
	async do(ctx, path) {
		await namesuffixQuestion.replyWithHTML(
			ctx,
			'Welche Zusatzinfo möchtest du dem Termin geben? Dies sollte nur ein Wort oder eine kurze Info sein, wie zum Beispiel "Klausurvorbereitung". Diese Info wird dann dem Titel des Termins angehängt.',
			getMenuOfPath(path),
		);
		await deleteMenuFromContext(ctx);
		return false;
	},
});

menu.interact('room', {
	text: questionButtonText('room', '📍', 'Raum'),
	hide: hideGenerateChangeStep,
	async do(ctx, path) {
		await roomQuestion.replyWithHTML(
			ctx,
			'In welchen Raum wurde der Termin verschoben?',
			getMenuOfPath(path),
		);
		await deleteMenuFromContext(ctx);
		return false;
	},
});

menu.interact('finish', {
	text: '✅ Fertig stellen',
	do: finish,
	hide: ctx => !generationDataIsValid(ctx),
});

async function finish(ctx: MyContext): Promise<string | boolean> {
	const change = ctx.session.generateChange!;
	change.name = ctx.match![1]!.replaceAll(';', '/');

	if (change.add) {
		const date = new Date(Date.parse(change.date!));
		const [hour, minute] = change.starttime!.split(':').map(Number);
		date.setHours(hour!);
		date.setMinutes(minute!);
		change.date = formatDateToStoredChangeDate(date);
		delete change.starttime;
	}

	ctx.userconfig.mine.changes ??= [];

	const {name, date} = change;
	const alreadyExists = ctx.userconfig.mine.changes.some(o =>
		o.name === name && o.date === date);
	if (alreadyExists) {
		// Dont do something when there is already a change for the date
		// This shouldn't occour but it can when the user adds a shared change
		// Also the user can add an additional date that they already have 'used'
		await ctx.answerCallbackQuery('Du hast bereits eine Veranstaltungsänderung für diesen Termin.');
		return true;
	}

	ctx.userconfig.mine.changes.push(change as Change);
	delete ctx.session.generateChange;

	const actionPart = changeDetails.generateChangeAction(change as Change);
	return `../d:${actionPart}/`;
}

menu.interact('abort', {
	joinLastRow: true,
	text: '🛑 Abbrechen',
	do(ctx) {
		delete ctx.session.generateChange;
		return '..';
	},
});
