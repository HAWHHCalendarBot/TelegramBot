import {arrayFilterUnique} from 'array-filter-unique';
import type {Meal} from './meal.js';
import type {MealWishes, MensaPriceClass, MensaSettings} from './types.js';

export function filterMeals(
	meals: readonly Meal[],
	specialWishes: Readonly<MealWishes>,
): Meal[] {
	return meals
		.filter(m => !specialWishes.noAlcohol || !m.Alcohol)
		.filter(m => !specialWishes.noBeef || !m.Beef)
		.filter(m => !specialWishes.noFish || !m.Fish)
		.filter(m => !specialWishes.noGame || !m.Game)
		.filter(m => !specialWishes.noGelatine || !m.Gelatine)
		.filter(m => !specialWishes.noLamb || !m.Lamb)
		.filter(m => !specialWishes.noPig || !m.Pig)
		.filter(m => !specialWishes.noPoultry || !m.Poultry)
		.filter(m => !specialWishes.lactoseFree || m.LactoseFree)
		.filter(m => !specialWishes.vegan || m.Vegan)
		.filter(m =>
			!specialWishes.vegetarian || Boolean(m.Vegan) || m.Vegetarian,
		);
}

export function generateMealText(
	meals: readonly Meal[],
	mensaSettings: Readonly<MensaSettings>,
): string {
	if (meals.length === 0) {
		return 'Die Mensa bietet heute nichts an.';
	}

	const hints: string[] = [];

	const filtered = filterMeals(meals, mensaSettings);
	const mealTexts = filtered.map(m =>
		mealToHtml(m, mensaSettings.price, mensaSettings.showAdditives),
	);

	if (meals.length !== filtered.length) {
		hints.push(
			'⚠️ Durch deine Sonderwünsche siehst du nicht jede Mahlzeit. Dies kannst du in den Mensa Einstellungen einstellen.',
		);
	}

	const hintText = hints
		.map(o => o + '\n')
		.join('\n');
	if (mealTexts.length === 0) {
		return hintText + '\nDie Mensa hat heute nichts für dich.';
	}

	let text = '';
	text += hintText;
	text += '\n';
	text += mealTexts.join('\n\n');

	if (mensaSettings.showAdditives) {
		text += '\n\n';
		text += mealAdditivesToHtml(filtered);
	}

	return text;
}

export function mealNameToHtml(
	name: string,
	showAdditives: boolean | undefined,
): string {
	const parsedName = name
		// Remove / un-bold additives at the end
		.replaceAll(/ \(([\d\w, ]+)\)$/g, showAdditives ? '</b> ($1)<b>' : '')
		// Remove / un-bold additives within the name
		.replaceAll(/ \(([\d\w, ]+)\), /g, showAdditives ? '</b> ($1), <b>' : ', ');

	const fullName = `<b>${parsedName}</b>`;
	return fullName.replaceAll('<b></b>', '');
}

export function mealAdditivesToHtml(meals: readonly Meal[]): string {
	return meals
		.flatMap(meal =>
			Object.entries(meal.Additives).map(([short, full]) => `${short}: ${full}`),
		)
		.sort()
		.filter(arrayFilterUnique())
		.join('\n');
}

export function mealToHtml(
	meal: Meal,
	priceClass: MensaPriceClass | undefined,
	showAdditives: boolean | undefined,
): string {
	const name = mealNameToHtml(meal.Name, showAdditives);

	const price = priceClass === 'student'
		? meal.PriceStudent
		: (priceClass === 'attendant' ? meal.PriceAttendant : meal.PriceGuest);
	const priceString = price.toLocaleString('de-DE', {
		minimumFractionDigits: 2,
	}).replace('.', ',');

	let text = `${name}\n`;
	text += `${priceString} €`;

	const infos: string[] = [];

	if (meal.Pig) {
		infos.push('🐷');
	}

	if (meal.Beef) {
		infos.push('🐮');
	}

	if (meal.Poultry) {
		infos.push('🐔');
	}

	if (meal.Fish) {
		infos.push('🐟');
	}

	if (meal.Alcohol) {
		infos.push('🍷');
	}

	if (meal.LactoseFree) {
		infos.push('laktosefrei');
	}

	if (meal.Vegan) {
		infos.push('vegan');
	}

	if (meal.Vegetarian) {
		infos.push('vegetarisch');
	}

	if (infos.length > 0) {
		text += ' ' + infos.join(' ');
	}

	return text;
}
