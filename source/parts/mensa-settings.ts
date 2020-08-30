import TelegrafInlineMenu from 'telegraf-inline-menu'

import {getCanteenList} from '../lib/mensa-meals'
import {MyContext, MealWishes, MensaPriceClass} from '../lib/types'

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

export const menu = new TelegrafInlineMenu('*Mensa Einstellungen*')

function mainMensaText(context: MyContext): string {
	const {main} = context.state.userconfig.mensa

	let text = 'Hauptmensa'
	if (main) {
		text += `: ${main}`
	}

	return text
}

function setMainMensa(context: MyContext, mensa: string): void {
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
}

menu.submenu(mainMensaText as any, 'main', new TelegrafInlineMenu('*Mensa Einstellungen*\nHauptmensa'))
	.select('set', getCanteenList, {
		setFunc: setMainMensa as any,
		isSetFunc: (ctx, mensa) => mensa === (ctx as MyContext).state.userconfig.mensa.main,
		columns: 2,
		getCurrentPage: ctx => (ctx as MyContext).session.page,
		setPage: (ctx, page) => {
			(ctx as MyContext).session.page = page
		}
	})

function isAdditionalMensa(context: MyContext, mensa: string): boolean {
	const selected = context.state.userconfig.mensa.more ?? []
	return selected.includes(mensa)
}

async function toggleAdditionalMensa(context: MyContext, mensa: string): Promise<void> {
	if (context.state.userconfig.mensa.main === mensa) {
		await context.answerCbQuery(mensa + ' ist bereits deine Hauptmensa')
		return
	}

	const selected = context.state.userconfig.mensa.more ?? []
	if (selected.includes(mensa)) {
		context.state.userconfig.mensa.more = selected.filter(o => o !== mensa)
	} else {
		selected.push(mensa)
		selected.sort()
		context.state.userconfig.mensa.more = selected
	}
}

function moreMensaEmoji(context: MyContext, mensa: string): string {
	if (context.state.userconfig.mensa.main === mensa) {
		return '🍽'
	}

	return enabledEmoji(isAdditionalMensa(context, mensa))
}

function moreMensaText(context: MyContext): string {
	const selected = context.state.userconfig.mensa.more ?? []
	let text = 'Weitere Mensen'
	if (selected.length > 0) {
		text += ` (${selected.length})`
	}

	return text
}

menu.submenu(moreMensaText as any, 'more', new TelegrafInlineMenu(
	'*Mensa Einstellungen*\nWähle weitere Mensen, in den du gelegentlich bist'
), {
	hide: ctx => !(ctx as MyContext).state.userconfig.mensa.main
})
	.select('more', getCanteenList, {
		setFunc: toggleAdditionalMensa as any,
		prefixFunc: moreMensaEmoji as any,
		columns: 2,
		getCurrentPage: ctx => (ctx as MyContext).session.page,
		setPage: (ctx, page) => {
			(ctx as MyContext).session.page = page
		}
	})

const priceOptions = {
	student: 'Student',
	attendant: 'Angestellt',
	guest: 'Gast'
}

function setPrice(context: MyContext, price: MensaPriceClass): void {
	context.state.userconfig.mensa.price = price
}

function isPriceSelected(context: MyContext, price: MensaPriceClass): boolean {
	return context.state.userconfig.mensa.price === price
}

menu.select('price', priceOptions, {
	setFunc: setPrice as any,
	isSetFunc: isPriceSelected as any,
	hide: ctx => !(ctx as MyContext).state.userconfig.mensa.main
})

function specialWishText(context: MyContext): string {
	let text = '*Mensa Einstellungen*'
	text += '\nWelche Sonderwünsche hast du zu deinem Essen?'
	text += '\n\n'

	const wishes = (Object.keys(settingName) as Array<keyof MealWishes>)
		.filter(o => context.state.userconfig.mensa[o])

	if (wishes.length > 0) {
		text += 'Aktuell werden die Angebote für dich nach deinen Wünschen gefiltert.'
	} else {
		text += 'Aktuell siehst du alle ungefilterten Angebote.'
	}

	return text
}

function specialWishEmoji(context: MyContext, wish: keyof MealWishes): string {
	return enabledEmoji(context.state.userconfig.mensa[wish])
}

function toggleSpecialWish(context: MyContext, wish: keyof MealWishes): void {
	if (context.state.userconfig.mensa[wish]) {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete context.state.userconfig.mensa[wish]
	} else {
		context.state.userconfig.mensa[wish] = true
	}
}

function hideIrrelevantSpecialWishes(context: MyContext, wish: keyof MealWishes): boolean {
	const wishes = context.state.userconfig.mensa ?? {}
	switch (wish) {
		case 'noBeef':
		case 'noFish':
		case 'noPig':
		case 'noPoultry':
			return Boolean(wishes.vegan) || Boolean(wishes.vegetarian)
		case 'vegetarian':
		case 'lactoseFree':
			return Boolean(wishes.vegan)
		case 'vegan':
		default:
			return false
	}
}

menu.submenu('Extrawünsche Essen', 's', new TelegrafInlineMenu(specialWishText as any), {
	hide: ctx => !(ctx as MyContext).state.userconfig.mensa.main
})
	.select('w', settingName, {
		setFunc: toggleSpecialWish as any,
		prefixFunc: specialWishEmoji as any,
		hide: hideIrrelevantSpecialWishes as any,
		columns: 1
	})
	.simpleButton('warm… nicht versalzen… kein Spüli…', 'warm', {
		doFunc: async ctx => ctx.answerCbQuery('das wär mal was… 😈')
	})

menu.toggle('zeige Inhaltsstoffe', 'showAdditives', {
	setFunc: (ctx, newState) => {
		if (newState) {
			(ctx as MyContext).state.userconfig.mensa.showAdditives = true
		} else {
			delete (ctx as MyContext).state.userconfig.mensa.showAdditives
		}
	},
	isSetFunc: ctx => (ctx as MyContext).state.userconfig.mensa.showAdditives === true,
	hide: ctx => !(ctx as MyContext).state.userconfig.mensa.main
})
