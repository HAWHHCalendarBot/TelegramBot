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
const MealWishOptions = Object.keys(settingName) as readonly MealWish[];

async function updateMore(context: MyContext, set: ReadonlySet<string>) {
	const {main} = context.userconfig.mine.mensa;
	const allAvailableCanteens = new Set(await getCanteenList());
	const more = [...set]
		.filter(canteen => canteen !== main)
		.filter(canteen => allAvailableCanteens.has(canteen));

	if (more.length > 0) {
		context.userconfig.mine.mensa.more = more.sort();
	} else {
		delete context.userconfig.mine.mensa.more;
	}
}

export const menu = new MenuTemplate<MyContext>({
	text: format.bold('Mensa Einstellungen'),
	parse_mode: format.parse_mode,
});

function mainMensaButtonText(context: MyContext): string {
	const {main} = context.userconfig.mine.mensa;

	let text = 'Hauptmensa';
	if (main) {
		text += `: ${main}`;
	}

	return text;
}

const mainMensaMenu = new MenuTemplate<MyContext>({
	text: format.bold('Mensa Einstellungen') + '\nHauptmensa',
	parse_mode: format.parse_mode,
});
menu.submenu(mainMensaButtonText, 'main', mainMensaMenu);
mainMensaMenu.select('set', getCanteenList, {
	columns: 1,
	async set(context, mensa) {
		const more = new Set(context.userconfig.mine.mensa.more ?? []);

		const oldMain = context.userconfig.mine.mensa.main;
		if (oldMain) {
			more.add(oldMain);
		}

		context.userconfig.mine.mensa.main = mensa;
		await updateMore(context, more);
		return '..';
	},
	isSet: (context, mensa) => mensa === context.userconfig.mine.mensa.main,
	getCurrentPage: context => context.session.page,
	setPage(context, page) {
		context.session.page = page;
	},
});

mainMensaMenu.manualRow(backMainButtons);

function isAdditionalMensa(context: MyContext, mensa: string): boolean {
	const selected = context.userconfig.mine.mensa.more ?? [];
	return selected.includes(mensa);
}

function moreMensaButtonText(context: MyContext): string {
	const selected = context.userconfig.mine.mensa.more ?? [];
	let text = 'Weitere Mensen';
	if (selected.length > 0) {
		text += ` (${selected.length})`;
	}

	return text;
}

const moreMenu = new MenuTemplate<MyContext>({
	text: format.bold('Mensa Einstellungen')
		+ '\nWähle weitere Mensen, in den du gelegentlich bist',
	parse_mode: format.parse_mode,
});
menu.submenu(moreMensaButtonText, 'more', moreMenu, {
	hide: context => !context.userconfig.mine.mensa.main,
});
moreMenu.select('more', getCanteenList, {
	columns: 1,
	isSet: (context, mensa) => isAdditionalMensa(context, mensa),
	async set(context, mensa) {
		if (context.userconfig.mine.mensa.main === mensa) {
			await context.answerCallbackQuery(
				mensa + ' ist bereits deine Hauptmensa',
			);
			return false;
		}

		const more = new Set(context.userconfig.mine.mensa.more ?? []);
		if (more.has(mensa)) {
			more.delete(mensa);
		} else {
			more.add(mensa);
		}

		await updateMore(context, more);
		return true;
	},
	formatState(context, mensa, state) {
		if (context.userconfig.mine.mensa.main === mensa) {
			return '🍽 ' + mensa;
		}

		return enabledEmoji(state) + ' ' + mensa;
	},
	getCurrentPage: context => context.session.page,
	setPage(context, page) {
		context.session.page = page;
	},
});
moreMenu.manualRow(backMainButtons);

const priceOptions = {
	student: 'Student',
	attendant: 'Angestellt',
	guest: 'Gast',
} as const satisfies Record<MensaPriceClass, string>;

menu.select('price', priceOptions, {
	set(context, price) {
		context.userconfig.mine.mensa.price = price as MensaPriceClass;
		return true;
	},
	isSet: (context, price) => context.userconfig.mine.mensa.price === price,
	hide: context => !context.userconfig.mine.mensa.main,
});

const specialWishMenu = new MenuTemplate<MyContext>(context => {
	let text = format.bold('Mensa Einstellungen');
	text += '\nWelche Sonderwünsche hast du zu deinem Essen?';
	text += '\n\n';

	const anyWishesSelected = MealWishOptions
		.some(o => context.userconfig.mine.mensa[o]);

	text += anyWishesSelected
		? 'Aktuell werden die Angebote für dich nach deinen Wünschen gefiltert.'
		: 'Aktuell siehst du alle ungefilterten Angebote.';

	return {text, parse_mode: format.parse_mode};
});
menu.submenu('Extrawünsche Essen', 's', specialWishMenu, {
	hide: context => !context.userconfig.mine.mensa.main,
});

function showWishAsOption(context: MyContext, wish: MealWish): boolean {
	const wishes = context.userconfig.mine.mensa;
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

function specialWishOptions(context: MyContext): Record<string, string> {
	return Object.fromEntries(
		MealWishOptions
			.filter(wish => showWishAsOption(context, wish))
			.map(wish => [wish, settingName[wish]]),
	);
}

specialWishMenu.select('w', specialWishOptions, {
	columns: 1,
	isSet: (context, wish) =>
		Boolean(context.userconfig.mine.mensa[wish as MealWish]),
	set(context, wish, newState) {
		if (newState) {
			context.userconfig.mine.mensa[wish as MealWish] = true;
		} else {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete context.userconfig.mine.mensa[wish as MealWish];
		}

		return true;
	},
});
specialWishMenu.interact('warm… nicht versalzen… kein Spüli…', 'warm', {
	async do(context) {
		await context.answerCallbackQuery('das wär mal was… 😈');
		return false;
	},
});

specialWishMenu.manualRow(backMainButtons);

menu.toggle('zeige Inhaltsstoffe', 'showAdditives', {
	set(context, newState) {
		if (newState) {
			context.userconfig.mine.mensa.showAdditives = true;
		} else {
			delete context.userconfig.mine.mensa.showAdditives;
		}

		return true;
	},
	isSet: context => context.userconfig.mine.mensa.showAdditives === true,
	hide: context => !context.userconfig.mine.mensa.main,
});

menu.manualRow(backMainButtons);
