import {Composer} from 'grammy';
import {MenuTemplate} from 'grammy-inline-menu';
import type {MyContext} from '../../lib/types.ts';
import * as broadcastMenu from './broadcast.ts';
import * as userMenu from './user-quicklook.ts';

export const bot = new Composer<MyContext>();
export const menu = new MenuTemplate<MyContext>('Hey Admin!');

bot.use(broadcastMenu.bot);
bot.use(userMenu.bot);

menu.submenu('broadcast', broadcastMenu.menu, {text: 'Broadcast'});
menu.submenu('u', userMenu.menu, {text: 'User Quicklook'});
