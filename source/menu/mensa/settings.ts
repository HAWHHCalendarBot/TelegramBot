import {MenuTemplate} from 'grammy-inline-menu';
import {html as format} from 'telegram-format';
import {backMainButtons} from '../../lib/inline-menu.js';
import {getCanteenList} from '../../lib/mensa-meals.js';
import {
	type MealWish,
	type MensaPriceClass,
	type MyContext,
} from '../../lib/types.js';

function enabledEmoji(truthy: boolean | undefined): '✅' | '🚫' {
	return truthy ? '✅' : '🚫';
}

const settingName = {
	vegan: 'vegan',
	vegetarian: 'vegetarisch',
	lactoseFree: 'laktosefrei',
	noAlcohol: 'kein Alkohol',
	noBeef: 'kein Rindfleisch',
	noFish: 'kein Fisch',
	noGame: 'kein Wild',
	noGelatine: 'keine Gelatine',
	noLamb: 'kein Lamm',
	noPig: 'kein Schweinefleisch',
	noPoultry: 'kein Geflügel',
} as const satisfies Record<MealWish, string>;
const MEAL_WISH_OPTIONS = Object.keys(settingName) as readonly MealWish[];

async function updateMore(ctx: MyContext, set: ReadonlySet<string>) {
	const {main} = ctx.userconfig.mine.mensa;
	const allAvailableCanteens = new Set(await getCanteenList());
	const more = [...set]
		.filter(canteen => canteen !== main)
		.filter(canteen => allAvailableCanteens.has(canteen));

	if (more.length > 0) {
		ctx.userconfig.mine.mensa.more = more.sort();
	} else {
		delete ctx.userconfig.mine.mensa.more;
	}
}

export const menu = new MenuTemplate<MyContext>({
	parse_mode: format.parse_mode,
	text: format.bold('Mensa Einstellungen'),
});

const mainMensaMenu = new MenuTemplate<MyContext>({
	parse_mode: format.parse_mode,
	text: format.bold('Mensa Einstellungen') + '\nHauptmensa',
});
menu.submenu('main', mainMensaMenu, {
	text(ctx) {
		const {main} = ctx.userconfig.mine.mensa;
		let text = 'Hauptmensa';
		if (main) {
			text += `: ${main}`;
		}

		return text;
	},
});
mainMensaMenu.select('set', {
	columns: 1,
	choices: getCanteenList,
	async set(ctx, mensa) {
		const more = new Set(ctx.userconfig.mine.mensa.more ?? []);

		const oldMain = ctx.userconfig.mine.mensa.main;
		if (oldMain) {
			more.add(oldMain);
		}

		ctx.userconfig.mine.mensa.main = mensa;
		await updateMore(ctx, more);
		return '..';
	},
	isSet: (ctx, mensa) => mensa === ctx.userconfig.mine.mensa.main,
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});

mainMensaMenu.manualRow(backMainButtons);

function isAdditionalMensa(ctx: MyContext, mensa: string): boolean {
	const selected = ctx.userconfig.mine.mensa.more ?? [];
	return selected.includes(mensa);
}

const moreMenu = new MenuTemplate<MyContext>({
	parse_mode: format.parse_mode,
	text: format.bold('Mensa Einstellungen')
		+ '\nWähle weitere Mensen, in den du gelegentlich bist',
});
menu.submenu('more', moreMenu, {
	hide: ctx => !ctx.userconfig.mine.mensa.main,
	text(ctx) {
		const selected = ctx.userconfig.mine.mensa.more ?? [];
		let text = 'Weitere Mensen';
		if (selected.length > 0) {
			text += ` (${selected.length})`;
		}

		return text;
	},
});
moreMenu.select('more', {
	columns: 1,
	choices: getCanteenList,
	isSet: (ctx, mensa) => isAdditionalMensa(ctx, mensa),
	async set(ctx, mensa) {
		if (ctx.userconfig.mine.mensa.main === mensa) {
			await ctx.answerCallbackQuery(mensa + ' ist bereits deine Hauptmensa');
			return false;
		}

		const more = new Set(ctx.userconfig.mine.mensa.more ?? []);
		if (more.has(mensa)) {
			more.delete(mensa);
		} else {
			more.add(mensa);
		}

		await updateMore(ctx, more);
		return true;
	},
	formatState(ctx, mensa, state) {
		if (ctx.userconfig.mine.mensa.main === mensa) {
			return '🍽 ' + mensa;
		}

		return enabledEmoji(state) + ' ' + mensa;
	},
	getCurrentPage: ctx => ctx.session.page,
	setPage(ctx, page) {
		ctx.session.page = page;
	},
});
moreMenu.manualRow(backMainButtons);

const PRICE_OPTIONS = {
	student: 'Student',
	attendant: 'Angestellt',
	guest: 'Gast',
} as const satisfies Record<MensaPriceClass, string>;

menu.select('price', {
	choices: PRICE_OPTIONS,
	set(ctx, price) {
		ctx.userconfig.mine.mensa.price = price as MensaPriceClass;
		return true;
	},
	isSet: (ctx, price) => ctx.userconfig.mine.mensa.price === price,
	hide: ctx => !ctx.userconfig.mine.mensa.main,
});

const specialWishMenu = new MenuTemplate<MyContext>(ctx => {
	let text = format.bold('Mensa Einstellungen');
	text += '\nWelche Sonderwünsche hast du zu deinem Essen?';
	text += '\n\n';

	const anyWishesSelected = MEAL_WISH_OPTIONS.some(o =>
		ctx.userconfig.mine.mensa[o]);

	text += anyWishesSelected
		? 'Aktuell werden die Angebote für dich nach deinen Wünschen gefiltert.'
		: 'Aktuell siehst du alle ungefilterten Angebote.';

	return {text, parse_mode: format.parse_mode};
});
menu.submenu('s', specialWishMenu, {
	text: 'Extrawünsche Essen',
	hide: ctx => !ctx.userconfig.mine.mensa.main,
});

function showWishAsOption(ctx: MyContext, wish: MealWish): boolean {
	const wishes = ctx.userconfig.mine.mensa;
	switch (wish) {
		case 'noBeef':
		case 'noFish':
		case 'noGame':
		case 'noGelatine':
		case 'noLamb':
		case 'noPig':
		case 'noPoultry': {
			return !wishes.vegan && !wishes.vegetarian;
		}

		case 'vegetarian':
		case 'lactoseFree': {
			return !wishes.vegan;
		}

		case 'noAlcohol':
		case 'vegan': {
			return true;
		}
	}
}

specialWishMenu.select('w', {
	columns: 1,
	choices: ctx =>
		Object.fromEntries(MEAL_WISH_OPTIONS.filter(wish => showWishAsOption(ctx, wish)).map(wish => [wish, settingName[wish]])),
	isSet: (ctx, wish) => Boolean(ctx.userconfig.mine.mensa[wish as MealWish]),
	set(ctx, wish, newState) {
		if (newState) {
			ctx.userconfig.mine.mensa[wish as MealWish] = true;
		} else {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete ctx.userconfig.mine.mensa[wish as MealWish];
		}

		return true;
	},
});
specialWishMenu.interact('warm', {
	text: 'warm… nicht versalzen… kein Spüli…',
	async do(ctx) {
		await ctx.answerCallbackQuery('das wär mal was… 😈');
		return false;
	},
});

specialWishMenu.manualRow(backMainButtons);

menu.toggle('showAdditives', {
	text: 'zeige Inhaltsstoffe',
	set(ctx, newState) {
		if (newState) {
			ctx.userconfig.mine.mensa.showAdditives = true;
		} else {
			delete ctx.userconfig.mine.mensa.showAdditives;
		}

		return true;
	},
	isSet: ctx => ctx.userconfig.mine.mensa.showAdditives === true,
	hide: ctx => !ctx.userconfig.mine.mensa.main,
});

menu.manualRow(backMainButtons);
