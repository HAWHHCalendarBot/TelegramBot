import {Meal} from './meal.js'
import {MealWishes, MensaPriceClass, MensaSettings} from './types.js'

export function filterMeals(meals: readonly Meal[], specialWishes: Readonly<MealWishes>): Meal[] {
	return meals
		.filter(m => !specialWishes.noBeef || !m.Beef)
		.filter(m => !specialWishes.noFish || !m.Fish)
		.filter(m => !specialWishes.noPig || !m.Pig)
		.filter(m => !specialWishes.noPoultry || !m.Poultry)
		.filter(m => !specialWishes.lactoseFree || m.LactoseFree)
		.filter(m => !specialWishes.vegan || m.Vegan)
		.filter(m => !specialWishes.vegetarian || m.Vegan || m.Vegetarian)
}

export function generateMealText(meals: readonly Meal[], mensaSettings: Readonly<MensaSettings>): string {
	if (meals.length === 0) {
		return 'Die Mensa bietet heute nichts an.'
	}

	const hints = []

	const filtered = filterMeals(meals, mensaSettings)
	const mealTexts = filtered.map(m => mealToHtml(m, mensaSettings.price, mensaSettings.showAdditives))

	if (meals.length !== filtered.length) {
		hints.push('⚠️ Durch deine Sonderwünsche siehst du nicht jede Mahlzeit. Dies kannst du in den /settings einstellen.')
	}

	const hintText = hints
		.map(o => o + '\n')
		.join('\n')
	if (mealTexts.length === 0) {
		return hintText + '\nDie Mensa hat heute nichts für dich.'
	}

	return hintText + '\n' + mealTexts.join('\n\n')
}

export function mealToHtml(meal: Meal, priceClass: MensaPriceClass | undefined, showAdditives: boolean | undefined): string {
	const parsedName = meal.Name
	// Remove / un-bold additives at the end
		.replace(/ \(([\d\w, ]+)\)$/g, showAdditives ? '</b> ($1)' : '')
	// Remove / un-bold additives within the name
		.replace(/ \(([\d\w, ]+)\), /g, showAdditives ? '</b> ($1), <b>' : ', ')
	// When not ) at the end, end with un-bold
		.replace(/[^)]$/, '$&</b>')

	const price = priceClass === 'student' ? meal.PriceStudent : (priceClass === 'attendant' ? meal.PriceAttendant : meal.PriceGuest)
	const priceString = price.toLocaleString('de-DE', {minimumFractionDigits: 2}).replace('.', ',')

	let text = `<b>${parsedName}\n`
	text += `${priceString} €`

	const infos = []

	if (meal.Pig) {
		infos.push('🐷')
	}

	if (meal.Beef) {
		infos.push('🐮')
	}

	if (meal.Poultry) {
		infos.push('🐔')
	}

	if (meal.Fish) {
		infos.push('🐟')
	}

	if (meal.Alcohol) {
		infos.push('🍷')
	}

	if (meal.LactoseFree) {
		infos.push('laktosefrei')
	}

	if (meal.Vegan) {
		infos.push('vegan')
	}

	if (meal.Vegetarian) {
		infos.push('vegetarisch')
	}

	if (infos.length > 0) {
		text += ' ' + infos.join(' ')
	}

	if (showAdditives) {
		for (const [short, full] of Object.entries(meal.Additives)) {
			text += `\n${short}: ${full}`
		}
	}

	return text
}
