import {MenuTemplate, Body} from 'grammy-inline-menu'

import {backMainButtons} from '../../lib/inline-menu.js'
import {getCanteenList} from '../../lib/mensa-meals.js'
import {MyContext, MealWishes, MensaPriceClass, unreachable} from '../../lib/types.js'

function enabledEmoji(truthy: boolean | undefined): '✅' | '🚫' {
	return truthy ? '✅' : '🚫'
}

const settingName: Readonly<Record<keyof MealWishes, string>> = {
	vegan: 'vegan',
	vegetarian: 'vegetarisch',
	lactoseFree: 'laktosefrei',
	noBeef: 'kein Rindfleisch',
	noFish: 'kein Fisch',
	noGame: 'kein Wild',
	noGelatine: 'keine Gelatine',
	noLamb: 'kein Lamm',
	noPig: 'kein Schweinefleisch',
	noPoultry: 'kein Geflügel',
}

export const menu = new MenuTemplate<MyContext>({text: '*Mensa Einstellungen*', parse_mode: 'Markdown'})

function mainMensaButtonText(context: MyContext): string {
	const {main} = context.userconfig.mine.mensa

	let text = 'Hauptmensa'
	if (main) {
		text += `: ${main}`
	}

	return text
}

const mainMensaMenu = new MenuTemplate<MyContext>({text: '*Mensa Einstellungen*\nHauptmensa', parse_mode: 'Markdown'})
menu.submenu(mainMensaButtonText, 'main', mainMensaMenu)
mainMensaMenu.select('set', getCanteenList, {
	columns: 1,
	set: (context, mensa) => {
		const oldMain = context.userconfig.mine.mensa.main
		context.userconfig.mine.mensa.main = mensa
		if (context.userconfig.mine.mensa.more) {
			context.userconfig.mine.mensa.more = context.userconfig.mine.mensa.more.filter(o => o !== mensa)
		}

		if (oldMain) {
			if (!context.userconfig.mine.mensa.more) {
				context.userconfig.mine.mensa.more = []
			}

			context.userconfig.mine.mensa.more.push(oldMain)
		}

		return '..'
	},
	isSet: (context, mensa) => mensa === context.userconfig.mine.mensa.main,
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	},
})

mainMensaMenu.manualRow(backMainButtons)

function isAdditionalMensa(context: MyContext, mensa: string): boolean {
	const selected = context.userconfig.mine.mensa.more ?? []
	return selected.includes(mensa)
}

function moreMensaButtonText(context: MyContext): string {
	const selected = context.userconfig.mine.mensa.more ?? []
	let text = 'Weitere Mensen'
	if (selected.length > 0) {
		text += ` (${selected.length})`
	}

	return text
}

const moreMenu = new MenuTemplate<MyContext>({text: '*Mensa Einstellungen*\nWähle weitere Mensen, in den du gelegentlich bist', parse_mode: 'Markdown'})
menu.submenu(moreMensaButtonText, 'more', moreMenu, {
	hide: context => !context.userconfig.mine.mensa.main,
})
moreMenu.select('more', getCanteenList, {
	columns: 1,
	isSet: (context, mensa) => isAdditionalMensa(context, mensa),
	set: async (context, mensa) => {
		if (context.userconfig.mine.mensa.main === mensa) {
			await context.answerCallbackQuery({text: mensa + ' ist bereits deine Hauptmensa'})
			return false
		}

		const selected = context.userconfig.mine.mensa.more ?? []
		if (selected.includes(mensa)) {
			context.userconfig.mine.mensa.more = selected.filter(o => o !== mensa)
		} else {
			selected.push(mensa)
			selected.sort()
			context.userconfig.mine.mensa.more = selected
		}

		return true
	},
	formatState: (context, mensa, state) => {
		if (context.userconfig.mine.mensa.main === mensa) {
			return '🍽 ' + mensa
		}

		return enabledEmoji(state) + ' ' + mensa
	},
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	},
})
moreMenu.manualRow(backMainButtons)

const priceOptions = {
	student: 'Student',
	attendant: 'Angestellt',
	guest: 'Gast',
}

menu.select('price', priceOptions, {
	set: (context, price) => {
		context.userconfig.mine.mensa.price = price as MensaPriceClass
		return true
	},
	isSet: (context, price) => context.userconfig.mine.mensa.price === price,
	hide: context => !context.userconfig.mine.mensa.main,
})

function specialWishMenuBody(context: MyContext): Body {
	let text = '*Mensa Einstellungen*'
	text += '\nWelche Sonderwünsche hast du zu deinem Essen?'
	text += '\n\n'

	const wishes = (Object.keys(settingName) as Array<keyof MealWishes>)
		.filter(o => context.userconfig.mine.mensa[o])

	text += wishes.length > 0
		? 'Aktuell werden die Angebote für dich nach deinen Wünschen gefiltert.'
		: 'Aktuell siehst du alle ungefilterten Angebote.'

	return {text, parse_mode: 'Markdown'}
}

const specialWishMenu = new MenuTemplate<MyContext>(specialWishMenuBody)
menu.submenu('Extrawünsche Essen', 's', specialWishMenu, {
	hide: context => !context.userconfig.mine.mensa.main,
})

function showWishAsOption(context: MyContext, wish: keyof MealWishes): boolean {
	const wishes = context.userconfig.mine.mensa
	switch (wish) {
		case 'noBeef':
		case 'noFish':
		case 'noGame':
		case 'noGelatine':
		case 'noLamb':
		case 'noPig':
		case 'noPoultry':
			return !wishes.vegan && !wishes.vegetarian
		case 'vegetarian':
		case 'lactoseFree':
			return !wishes.vegan
		case 'vegan':
			return true
		default:
			unreachable(wish)
	}
}

function specialWishOptions(context: MyContext): Record<string, string> {
	const allWishes = Object.keys(settingName) as Array<keyof MealWishes>
	const options: Record<string, string> = {}
	for (const wish of allWishes) {
		if (showWishAsOption(context, wish)) {
			options[wish] = settingName[wish]
		}
	}

	return options
}

specialWishMenu.select('w', specialWishOptions, {
	columns: 1,
	isSet: (context, wish) => Boolean(context.userconfig.mine.mensa[wish as keyof MealWishes]),
	set: (context, wish, newState) => {
		if (newState) {
			context.userconfig.mine.mensa[wish as keyof MealWishes] = true
		} else {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete context.userconfig.mine.mensa[wish as keyof MealWishes]
		}

		return true
	},
})
specialWishMenu.interact('warm… nicht versalzen… kein Spüli…', 'warm', {
	do: async context => {
		await context.answerCallbackQuery({text: 'das wär mal was… 😈'})
		return false
	},
})

specialWishMenu.manualRow(backMainButtons)

menu.toggle('zeige Inhaltsstoffe', 'showAdditives', {
	set: (context, newState) => {
		if (newState) {
			context.userconfig.mine.mensa.showAdditives = true
		} else {
			delete context.userconfig.mine.mensa.showAdditives
		}

		return true
	},
	isSet: context => context.userconfig.mine.mensa.showAdditives === true,
	hide: context => !context.userconfig.mine.mensa.main,
})

menu.manualRow(backMainButtons)
