import {MenuTemplate, Body} from 'telegraf-inline-menu'

import {backMainButtons} from '../../lib/inline-menu'
import {getCanteenList} from '../../lib/mensa-meals'
import {MyContext, MealWishes, MensaPriceClass} from '../../lib/types'

function enabledEmoji(truthy: boolean | undefined): '✅' | '🚫' {
	return truthy ? '✅' : '🚫'
}

const settingName: Readonly<Record<keyof MealWishes, string>> = {
	vegan: 'vegan',
	vegetarian: 'vegetarisch',
	lactoseFree: 'laktosefrei',
	noPig: 'kein Schweinefleisch',
	noBeef: 'kein Rindfleisch',
	noPoultry: 'kein Geflügel',
	noFish: 'kein Fisch'
}

export const menu = new MenuTemplate<MyContext>({text: '*Mensa Einstellungen*', parse_mode: 'Markdown'})

function mainMensaButtonText(context: MyContext): string {
	const {main} = context.state.userconfig.mensa

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
		const oldMain = context.state.userconfig.mensa.main
		context.state.userconfig.mensa.main = mensa
		if (context.state.userconfig.mensa.more) {
			context.state.userconfig.mensa.more = context.state.userconfig.mensa.more.filter(o => o !== mensa)
		}

		if (oldMain) {
			if (!context.state.userconfig.mensa.more) {
				context.state.userconfig.mensa.more = []
			}

			context.state.userconfig.mensa.more.push(oldMain)
		}

		return '..'
	},
	isSet: (context, mensa) => mensa === context.state.userconfig.mensa.main,
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})

mainMensaMenu.manualRow(backMainButtons)

function isAdditionalMensa(context: MyContext, mensa: string): boolean {
	const selected = context.state.userconfig.mensa.more ?? []
	return selected.includes(mensa)
}

function moreMensaButtonText(context: MyContext): string {
	const selected = context.state.userconfig.mensa.more ?? []
	let text = 'Weitere Mensen'
	if (selected.length > 0) {
		text += ` (${selected.length})`
	}

	return text
}

const moreMenu = new MenuTemplate<MyContext>({text: '*Mensa Einstellungen*\nWähle weitere Mensen, in den du gelegentlich bist', parse_mode: 'Markdown'})
menu.submenu(moreMensaButtonText, 'more', moreMenu, {
	hide: context => !context.state.userconfig.mensa.main
})
moreMenu.select('more', getCanteenList, {
	columns: 1,
	isSet: (context, mensa) => isAdditionalMensa(context, mensa),
	set: async (context, mensa) => {
		if (context.state.userconfig.mensa.main === mensa) {
			await context.answerCbQuery(mensa + ' ist bereits deine Hauptmensa')
			return false
		}

		const selected = context.state.userconfig.mensa.more ?? []
		if (selected.includes(mensa)) {
			context.state.userconfig.mensa.more = selected.filter(o => o !== mensa)
		} else {
			selected.push(mensa)
			selected.sort()
			context.state.userconfig.mensa.more = selected
		}

		return true
	},
	formatState: (context, mensa, state) => {
		if (context.state.userconfig.mensa.main === mensa) {
			return '🍽 ' + mensa
		}

		return enabledEmoji(state) + ' ' + mensa
	},
	getCurrentPage: context => context.session.page,
	setPage: (context, page) => {
		context.session.page = page
	}
})
moreMenu.manualRow(backMainButtons)

const priceOptions = {
	student: 'Student',
	attendant: 'Angestellt',
	guest: 'Gast'
}

menu.select('price', priceOptions, {
	set: (context, price) => {
		context.state.userconfig.mensa.price = price as MensaPriceClass
		return true
	},
	isSet: (context, price) => context.state.userconfig.mensa.price === price,
	hide: context => !context.state.userconfig.mensa.main
})

function specialWishMenuBody(context: MyContext): Body {
	let text = '*Mensa Einstellungen*'
	text += '\nWelche Sonderwünsche hast du zu deinem Essen?'
	text += '\n\n'

	const wishes = (Object.keys(settingName) as Array<keyof MealWishes>)
		.filter(o => context.state.userconfig.mensa[o])

	text += wishes.length > 0 ?
		'Aktuell werden die Angebote für dich nach deinen Wünschen gefiltert.' :
		'Aktuell siehst du alle ungefilterten Angebote.'

	return {text, parse_mode: 'Markdown'}
}

const specialWishMenu = new MenuTemplate<MyContext>(specialWishMenuBody)
menu.submenu('Extrawünsche Essen', 's', specialWishMenu, {
	hide: context => !context.state.userconfig.mensa.main
})

function showWishAsOption(context: MyContext, wish: keyof MealWishes): boolean {
	const wishes = context.state.userconfig.mensa
	switch (wish) {
		case 'noBeef':
		case 'noFish':
		case 'noPig':
		case 'noPoultry':
			return !wishes.vegan && !wishes.vegetarian
		case 'vegetarian':
		case 'lactoseFree':
			return !wishes.vegan
		case 'vegan':
		default:
			return true
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
	isSet: (context, wish) => Boolean(context.state.userconfig.mensa[wish as keyof MealWishes]),
	set: (context, wish, newState) => {
		if (newState) {
			context.state.userconfig.mensa[wish as keyof MealWishes] = true
		} else {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete context.state.userconfig.mensa[wish as keyof MealWishes]
		}

		return true
	}
})
specialWishMenu.interact('warm… nicht versalzen… kein Spüli…', 'warm', {
	do: async context => {
		await context.answerCbQuery('das wär mal was… 😈')
		return false
	}
})

specialWishMenu.manualRow(backMainButtons)

menu.toggle('zeige Inhaltsstoffe', 'showAdditives', {
	set: (context, newState) => {
		if (newState) {
			context.state.userconfig.mensa.showAdditives = true
		} else {
			delete context.state.userconfig.mensa.showAdditives
		}

		return true
	},
	isSet: context => context.state.userconfig.mensa.showAdditives === true,
	hide: context => !context.state.userconfig.mensa.main
})

menu.manualRow(backMainButtons)
