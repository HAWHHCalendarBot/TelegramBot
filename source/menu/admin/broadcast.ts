import { StatelessQuestion } from "@grammyjs/stateless-question";
import { Composer } from "grammy";
import { getMenuOfPath, MenuTemplate, replyMenuToContext } from "grammy-inline-menu";

import { backMainButtons } from "../../lib/inline-menu.ts";
import type { MyContext } from "../../lib/types.ts";

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>("Broadcast");

const broadcastQuestion = new StatelessQuestion<MyContext>("admin-broadcast", async (ctx, path) => {
	ctx.session.adminBroadcast = ctx.message.message_id;
	await replyMenuToContext(menu, ctx, path);
});

bot.use(broadcastQuestion.middleware());

menu.interact("set", {
	// oxlint-disable-next-line typescript/strict-boolean-expressions
	text: (ctx) => (ctx.session.adminBroadcast ? "✏️ Ändere Nachricht…" : "✏️ Setze Nachricht…"),
	async do(ctx, path) {
		await broadcastQuestion.replyWithHTML(
			ctx,
			"Hey admin! Was willst du broadcasten?",
			getMenuOfPath(path),
		);
		return false;
	},
});

menu.interact("send", {
	style: "danger",
	text: "📤 Versende Broadcast",
	// oxlint-disable-next-line typescript/strict-boolean-expressions
	hide: (ctx) => !ctx.session.adminBroadcast,
	async do(ctx) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		handleOngoingBroadcast(ctx, ctx.session.adminBroadcast!);

		delete ctx.session.adminBroadcast;
		await ctx.editMessageText("wird versendet…");

		return false;
	},
});

async function handleOngoingBroadcast(ctx: MyContext, messageId: number): Promise<void> {
	let text: string;
	try {
		await ctx.userconfig.forwardBroadcast(ctx.from!.id, messageId);
		text = "Broadcast finished";
	} catch (error) {
		text = "Broadcast failed: " + String(error);
	}

	await ctx.reply(text, {
		reply_markup: { remove_keyboard: true },
		reply_parameters: { message_id: messageId },
	});

	if (ctx.callbackQuery?.data) {
		await replyMenuToContext(menu, ctx, getMenuOfPath(ctx.callbackQuery.data));
	}
}

menu.manualRow(backMainButtons);
