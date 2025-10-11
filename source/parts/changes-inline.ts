import {Composer} from 'grammy';
import type {InlineQueryResultArticle, User} from 'grammy/types';
import {html as format} from 'telegram-format';
import {
	generateChangeDescription,
	generateChangeText,
	generateChangeTextHeader,
	generateShortChangeText,
} from '../lib/change-helper.ts';
import type {Change, MyContext} from '../lib/types.ts';

export const bot = new Composer<MyContext>();

function generateInlineQueryResultFromChange(
	ctx: MyContext,
	change: Change,
	from: User,
): InlineQueryResultArticle {
	const id = `${change.eventId}#${change.date}#${from.id}`;
	return {
		description: generateChangeDescription(change),
		id,
		input_message_content: {
			message_text: generateChangeText(ctx, change),
			parse_mode: format.parse_mode,
		},
		reply_markup: {
			inline_keyboard: [
				[{text: 'zu meinem Kalender hinzufügen', callback_data: 'c:a:' + id}],
			],
		},
		title: generateShortChangeText(ctx, change),
		type: 'article',
	};
}

function escapeRegexSpecificChars(input: string): string {
	return input
		.replaceAll('[', String.raw`\[`)
		.replaceAll(']', String.raw`\]`)
		.replaceAll('(', String.raw`\(`)
		.replaceAll(')', String.raw`\)`);
}

bot.on('inline_query', async ctx => {
	const regex = new RegExp(
		escapeRegexSpecificChars(ctx.inlineQuery.query),
		'i',
	);

	const filtered = ctx.userconfig.mine.changes.filter(o =>
		regex.test(generateShortChangeText(ctx, o)));
	const results = filtered.map(c =>
		generateInlineQueryResultFromChange(ctx, c, ctx.from));

	await ctx.answerInlineQuery(results, {
		cache_time: 20,
		is_personal: true,
		button: {
			start_parameter: 'changes',
			text: 'Zum Bot',
		},
	});
});

type ChangeRelatedInfos = {
	eventId: string;
	date: string;
	fromId: number;
	change: Change;
};

async function getChangeFromContextMatch(ctx: MyContext): Promise<ChangeRelatedInfos | undefined> {
	const eventId = ctx.match![1]!;
	const date = ctx.match![2]!;
	const fromId = Number(ctx.match![3]!);

	if (!Object.keys(ctx.userconfig.mine.events).includes(eventId)) {
		await ctx.answerCallbackQuery('Du besuchst diese Veranstaltung garnicht. 🤔');
		return undefined;
	}

	try {
		const fromconfig = await ctx.userconfig.loadConfig(fromId);
		const searchedChange = fromconfig.changes.find(o =>
			o.eventId === eventId && o.date === date);
		if (!searchedChange) {
			throw new Error('User does not have this change');
		}

		return {
			eventId,
			date,
			fromId,
			change: searchedChange,
		};
	} catch {
		await ctx.editMessageText('Die Veranstaltungsänderung existiert nicht mehr. 😔');
		return undefined;
	}
}

bot.callbackQuery(/^c:a:(.+)#(.+)#(.+)$/, async ctx => {
	const meta = await getChangeFromContextMatch(ctx);
	if (!meta) {
		return;
	}

	const {eventId, date, fromId, change} = meta;

	if (ctx.from?.id === Number(fromId)) {
		await ctx.answerCallbackQuery('Das ist deine eigene Änderung 😉');
		return;
	}

	// Prüfen ob man bereits eine Änderung mit dem Namen und dem Datum hat.
	const myChangeToThisEvent = ctx.userconfig.mine.changes.filter(o =>
		o.eventId === eventId && o.date === date);

	if (myChangeToThisEvent.length > 0) {
		const warning
			= '⚠️ Du hast bereits eine Änderung zu diesem Termin in deinem Kalender.';
		await ctx.answerCallbackQuery(warning);

		const currentChange = myChangeToThisEvent[0]!;

		let text = warning + '\n';
		text += generateChangeTextHeader(ctx, currentChange);

		text += '\nDiese Veränderung ist bereits in deinem Kalender:';
		text += '\n' + format.escape(generateChangeDescription(currentChange));

		text += '\nDiese Veränderung wolltest du hinzufügen:';
		text += '\n' + format.escape(generateChangeDescription(change));

		const inline_keyboard = [
			[
				{
					text: 'Überschreiben',
					callback_data: `c:af:${eventId}#${date}#${fromId}`,
				},
				{text: 'Abbrechen', callback_data: 'c:cancel'},
			],
		];

		await ctx.api.sendMessage(ctx.from.id, text, {
			parse_mode: format.parse_mode,
			reply_markup: {inline_keyboard},
		});
		return;
	}

	ctx.userconfig.mine.changes.push(change);
	await ctx.answerCallbackQuery('Die Änderung wurde hinzugefügt');
});

bot.callbackQuery(
	'c:cancel',
	async ctx => ctx.editMessageText('Ich habe nichts verändert. 🙂'),
);

// Action: change add force
bot.callbackQuery(/^c:af:(.+)#(.+)#(.+)$/, async ctx => {
	const meta = await getChangeFromContextMatch(ctx);
	if (!meta) {
		return;
	}

	const {eventId, date, change} = meta;
	ctx.userconfig.mine.changes = ctx.userconfig.mine.changes.filter(o =>
		o.eventId !== eventId || o.date !== date);
	ctx.userconfig.mine.changes.push(change);
	return ctx.editMessageText('Die Änderung wurde hinzugefügt.');
});
