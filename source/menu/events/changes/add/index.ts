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
	generateChangeText,
	loadEvents,
} from '../../../../lib/change-helper.ts';
import {typedKeys} from '../../../../lib/javascript-helper.ts';
import type {
	EventId,
	MyContext,
	NaiveDateTime,
} from '../../../../lib/types.ts';
import {createTimeSelectionSubmenuButtons} from './time-selector.ts';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>(ctx => {
	ctx.session.generateChange ??= {};

	if (ctx.match) {
		ctx.session.generateChangeEventId = ctx.match[1]! as EventId;
	}

	if (!ctx.session.generateChangeEventId) {
		throw new Error('Something fishy');
	}

	const eventId = ctx.session.generateChangeEventId;
	let text = '';

	if (!ctx.session.generateChangeDate) {
		text = 'Zu welchem Termin willst du eine Änderung hinzufügen?';
		const changeDates = typedKeys(ctx.userconfig.mine.events[eventId]?.changes ?? {});

		if (changeDates.length > 0) {
			text
				+= '\n\nFolgende Termine haben bereits eine Veränderung. Entferne die Veränderung zuerst, bevor du eine neue erstellen kannst.';
			text += '\n';

			changeDates.sort();
			text += changeDates.map(o => `- ${o}`).join('\n');
		}
	}

	if (ctx.session.generateChangeEventId && ctx.session.generateChangeDate) {
		text = generateChangeText(
			ctx.session.generateChangeEventId,
			ctx.session.generateChangeDate,
			ctx.session.generateChange,
		);
		text += '\nWelche Art von Änderung willst du vornehmen?';
	}

	return {text, parse_mode: 'HTML'};
});

function hidePickDateStep(ctx: MyContext): boolean {
	const eventId = ctx.session.generateChangeEventId;
	const date = ctx.session.generateChangeDate;
	return !eventId || Boolean(date);
}

function hideGenerateChangeStep(ctx: MyContext): boolean {
	const eventId = ctx.session.generateChangeEventId;
	const date = ctx.session.generateChangeDate;
	return !eventId || !date;
}

function generationDataIsValid(ctx: MyContext): boolean {
	const eventId = ctx.session.generateChangeEventId;
	const date = ctx.session.generateChangeDate;
	if (!eventId || !date) {
		return false;
	}

	// There have to some changes than that in order to do something.
	return Object.keys(ctx.session.generateChange ?? []).length > 0;
}

menu.choose('date', {
	columns: 2,
	hide: hidePickDateStep,
	async choices(ctx) {
		const eventId = ctx.match![1]! as EventId;
		if (ctx.session.generateChangeDate) {
			// Date already selected
			return {};
		}

		const existingChangeDates = new Set(typedKeys(ctx.userconfig.mine.events[eventId]?.changes ?? {}));
		const events = await loadEvents(eventId);
		const dates = events
			.map(o => o.startTime)
			.filter(o => !existingChangeDates.has(o))
			.filter(arrayFilterUnique());
		return dates;
	},
	do(ctx, key) {
		ctx.session.generateChangeDate = key as NaiveDateTime;
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

		return Object.keys(ctx.session.generateChange!).length > 0;
	},
});

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
	const eventId = ctx.match![1]! as EventId;
	const date = ctx.session.generateChangeDate!;
	const change = ctx.session.generateChange!;

	ctx.userconfig.mine.events[eventId] ??= {};
	ctx.userconfig.mine.events[eventId].changes ??= {};

	const alreadyExists = ctx.userconfig.mine.events[eventId].changes[date];
	if (alreadyExists) {
		// Dont do something when there is already a change for the date
		// This shouldn't occour but it can when the user adds a shared change
		// Also the user can add an additional date that they already have 'used'
		await ctx.answerCallbackQuery('Du hast bereits eine Veranstaltungsänderung für diesen Termin.');
		return true;
	}

	ctx.userconfig.mine.events[eventId].changes[date] = change;
	delete ctx.session.generateChange;

	return `../d:${date}/`;
}

menu.interact('abort', {
	joinLastRow: true,
	text: '🛑 Abbrechen',
	do(ctx) {
		delete ctx.session.generateChange;
		return '..';
	},
});
