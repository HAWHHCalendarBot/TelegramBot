import {StatelessQuestion} from '@grammyjs/stateless-question';
import {Composer} from 'grammy';
import {
	getMenuOfPath,
	MenuTemplate,
	replyMenuToContext,
} from 'grammy-inline-menu';
import {backMainButtons} from '../../lib/inline-menu.js';
import type {MyContext} from '../../lib/types.js';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>('Broadcast');

const broadcastQuestion = new StatelessQuestion<MyContext>(
	'admin-broadcast',
	async (ctx, path) => {
		ctx.session.adminBroadcast = ctx.message.message_id;
		await replyMenuToContext(menu, ctx, path);
	},
);

bot.use(broadcastQuestion.middleware());

menu.interact('set', {
	text(ctx) {
		return ctx.session.adminBroadcast
			? '✏️ Ändere Nachricht…'
			: '✏️ Setze Nachricht…';
	},
	async do(ctx, path) {
		await broadcastQuestion.replyWithHTML(
			ctx,
			'Hey admin! Was willst du broadcasten?',
			getMenuOfPath(path),
		);
		return false;
	},
});

menu.interact('send', {
	text: '📤 Versende Broadcast',
	hide: ctx => !ctx.session.adminBroadcast,
	async do(ctx) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		handleOngoingBroadcast(ctx, ctx.session.adminBroadcast!);

		delete ctx.session.adminBroadcast;
		await ctx.editMessageText('wird versendet…');

		return false;
	},
});

async function handleOngoingBroadcast(
	ctx: MyContext,
	messageId: number,
): Promise<void> {
	let text: string;
	try {
		await ctx.userconfig.forwardBroadcast(ctx.from!.id, messageId);
		text = 'Broadcast finished';
	} catch (error) {
		text = 'Broadcast failed: ' + String(error);
	}

	await ctx.reply(text, {
		reply_to_message_id: messageId,
		reply_markup: {
			remove_keyboard: true,
		},
	});

	if (ctx.callbackQuery?.data) {
		await replyMenuToContext(menu, ctx, getMenuOfPath(ctx.callbackQuery.data));
	}
}

menu.manualRow(backMainButtons);
