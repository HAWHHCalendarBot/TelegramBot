import {Composer} from 'grammy';
import {MenuMiddleware} from 'grammy-inline-menu';
import type {MyContext} from '../lib/types.js';
import * as about from './about.js';
import * as admin from './admin/index.js';
import * as data from './data.js';
import * as events from './events/index.js';
import * as mensa from './mensa/index.js';
import * as subscribe from './subscribe/index.js';

export const bot = new Composer<MyContext>();

const mensaMiddleware = new MenuMiddleware('mensa/', mensa.menu);
bot.command('mensa', async ctx => mensaMiddleware.replyToContext(ctx));
bot.use(mensaMiddleware);

const eventMiddleware = new MenuMiddleware('e/', events.menu);
bot.command('events', async ctx => eventMiddleware.replyToContext(ctx));
bot.use(events.bot);
bot.use(eventMiddleware);

const subscribeMiddleware = new MenuMiddleware('subscribe/', subscribe.menu);
bot.command('subscribe', async ctx => {
	// eslint-disable-next-line unicorn/prefer-ternary
	if (Object.keys(ctx.userconfig.mine.events).length === 0) {
		await ctx.reply(ctx.t('subscribe-empty'));
	} else {
		await subscribeMiddleware.replyToContext(ctx);
	}
});
bot.use(subscribe.bot);
bot.use(subscribeMiddleware);

const aboutMiddleware = new MenuMiddleware('about/', about.menu);
bot.command('about', async ctx => aboutMiddleware.replyToContext(ctx));
bot.use(aboutMiddleware);

const dataMiddleware = new MenuMiddleware('data/', data.menu);
bot.command(
	['data', 'privacy', 'stop'],
	async ctx => dataMiddleware.replyToContext(ctx),
);
bot.use(data.bot);
bot.use(dataMiddleware);

const adminComposer = new Composer<MyContext>();
const adminMiddleware = new MenuMiddleware('admin/', admin.menu);
adminComposer.command(
	'admin',
	async ctx => adminMiddleware.replyToContext(ctx),
);
adminComposer.use(admin.bot);
adminComposer.use(adminMiddleware);
// False positive
// eslint-disable-next-line unicorn/no-array-method-this-argument
bot.filter(ctx => Boolean(ctx.userconfig.mine.admin), adminComposer);
