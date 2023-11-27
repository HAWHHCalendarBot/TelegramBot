import {Composer} from 'grammy';
import {MenuTemplate} from 'grammy-inline-menu';
import type {MyContext} from '../../lib/types.js';
import * as broadcastMenu from './broadcast.js';
import * as userMenu from './user-quicklook.js';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>('Hey Admin!');

bot.use(broadcastMenu.bot);
bot.use(userMenu.bot);

menu.submenu('Broadcast', 'broadcast', broadcastMenu.menu);
menu.submenu('User Quicklook', 'u', userMenu.menu);
