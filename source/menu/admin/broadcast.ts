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

function broadcastButtonText(context: MyContext): string {
	return context.session.adminBroadcast
		? '✏️ Ändere Nachricht…'
		: '✏️ Setze Nachricht…';
}

const broadcastQuestion = new StatelessQuestion<MyContext>(
	'admin-broadcast',
	async (context, path) => {
		context.session.adminBroadcast = context.message.message_id;
		await replyMenuToContext(menu, context, path);
	},
);

bot.use(broadcastQuestion.middleware());

menu.interact(broadcastButtonText, 'set', {
	async do(context, path) {
		await broadcastQuestion.replyWithMarkdown(
			context,
			'Hey admin! Was willst du broadcasten?',
			getMenuOfPath(path),
		);
		return false;
	},
});

menu.interact('📤 Versende Broadcast', 'send', {
	hide: context => !context.session.adminBroadcast,
	async do(context) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		handleOngoingBroadcast(context, context.session.adminBroadcast!);

		delete context.session.adminBroadcast;
		await context.editMessageText('wird versendet…');

		return false;
	},
});

async function handleOngoingBroadcast(
	context: MyContext,
	messageId: number,
): Promise<void> {
	let text: string;
	try {
		await context.userconfig.forwardBroadcast(context.from!.id, messageId);
		text = 'Broadcast finished';
	} catch (error) {
		text = 'Broadcast failed: ' + String(error);
	}

	await context.reply(text, {
		reply_to_message_id: messageId,
		reply_markup: {
			remove_keyboard: true,
		},
	});

	if (context.callbackQuery?.data) {
		await replyMenuToContext(
			menu,
			context,
			getMenuOfPath(context.callbackQuery.data),
		);
	}
}

menu.manualRow(backMainButtons);
