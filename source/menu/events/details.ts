import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	deleteMenuFromContext,
	getMenuOfPath,
	MenuTemplate,
	replyMenuToContext,
} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import {backMainButtons} from '../../lib/inline-menu.ts';
import type {MyContext} from '../../lib/types.ts';

function getNameFromPath(path: string): string {
	const match = /\/d:([^/]+)\//.exec(path)!;
	return match[1]!.replaceAll(';', '/');
}

export const bot = new Composer<MyContext>();

export const menu = new MenuTemplate<MyContext>((ctx, path) => {
	const name = getNameFromPath(path);
	const event = ctx.userconfig.mine.events[name]!;

	let text = format.bold('Veranstaltung');
	text += '\n';
	text += name;
	text += '\n';

	if (event.alertMinutesBefore !== undefined) {
		text += '\n';
		text += '⏰';
		text += 'Erinnerung';
		text += ': ';
		text += `${event.alertMinutesBefore} Minuten vorher`;
		text += '\n';
	}

	if (event.notes) {
		text += '\n';
		text += '🗒';
		text += format.bold('Notizen');
		text += '\n';
		text += format.escape(event.notes);
		text += '\n\n';
	}

	return {
		disable_web_page_preview: true,
		parse_mode: format.parse_mode,
		text,
	};
});

const alertMenu = new MenuTemplate<MyContext>((_, path) => {
	const name = getNameFromPath(path);
	return `Wie lange im vorraus möchtest du an einen Termin der Veranstaltung ${name} erinnert werden?`;
});

alertMenu.interact('nope', {
	text: '🔕 Garnicht',
	do(ctx, path) {
		const name = getNameFromPath(path);
		delete ctx.userconfig.mine.events[name]!.alertMinutesBefore;
		return '..';
	},
});

alertMenu.choose('t', {
	columns: 3,
	choices: {
		0: 'Beginn',
		5: '5 Minuten',
		10: '10 Minuten',
		15: '15 Minuten',
		30: '30 Minuten',
		45: '45 Minuten',
		60: '1 Stunde',
		120: '2 Stunden',
		1337: '1337 Minuten',
	},
	do(ctx, key) {
		if (!ctx.callbackQuery?.data) {
			throw new Error('how?');
		}

		const name = getNameFromPath(ctx.callbackQuery.data);
		const minutes = Number(key);
		ctx.userconfig.mine.events[name]!.alertMinutesBefore = minutes;
		return '..';
	},
});

alertMenu.manualRow(backMainButtons);

menu.submenu('alert', alertMenu, {text: '⏰ Erinnerung'});

const noteQuestion = new StatelessQuestion<MyContext>(
	'event-notes',
	async (ctx, path) => {
		const name = getNameFromPath(path);
		if (ctx.message.text) {
			const notes = ctx.message.text;

			ctx.userconfig.mine.events[name]!.notes = notes;
		}

		await replyMenuToContext(menu, ctx, path);
	},
);

bot.use(noteQuestion.middleware());

menu.interact('set-notes', {
	text: '🗒 Schreibe Notiz',
	async do(ctx, path) {
		const name = getNameFromPath(path);
		const text = `Welche Notizen möchtest du an den Kalendereinträgen von ${
			format.escape(name)
		} stehen haben?`;
		await noteQuestion.replyWithHTML(ctx, text, getMenuOfPath(path));
		await deleteMenuFromContext(ctx);
		return false;
	},
});

menu.interact('remove-notes', {
	text: 'Notiz löschen',
	joinLastRow: true,
	hide(ctx, path) {
		const name = getNameFromPath(path);
		return !ctx.userconfig.mine.events[name]!.notes;
	},
	do(ctx, path) {
		const name = getNameFromPath(path);
		delete ctx.userconfig.mine.events[name]!.notes;
		return true;
	},
});

const removeMenu = new MenuTemplate<MyContext>(ctx => {
	const event = ctx.match![1]!.replaceAll(';', '/');
	return (
		event
		+ '\n\nBist du dir sicher, dass du diese Veranstaltung entfernen möchtest?'
	);
});
removeMenu.interact('y', {
	text: 'Ja ich will!',
	async do(ctx) {
		const event = ctx.match![1]!.replaceAll(';', '/');
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete ctx.userconfig.mine.events[event];

		await ctx.answerCallbackQuery(`${event} wurde aus deinem Kalender entfernt.`);
		return true;
	},
});
removeMenu.navigate('..', {joinLastRow: true, text: '🛑 Abbrechen'});

menu.submenu('r', removeMenu, {text: '🗑 Veranstaltung entfernen'});

menu.manualRow(backMainButtons);
