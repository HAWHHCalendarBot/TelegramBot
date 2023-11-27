import {strictEqual} from 'node:assert';
import {test} from 'node:test';
import type {Meal} from './meal.js';
import {generateMealText} from './mensa-helper.js';

const example = {
	Additives: {
		La: 'Milch/-erzeugnisse (einschl. Laktose)',
	},
	Alcohol: false,
	Beef: false,
	Category: 'Food',
	Date: '2018-09-14',
	Fish: false,
	LactoseFree: false,
	Name: '4 Röstiecken, Kräuterquark (La), Gurkensalat (La)',
	Pig: false,
	Poultry: false,
	PriceAttendant: 3.75,
	PriceGuest: 4.7,
	PriceStudent: 2.45,
	Vegan: false,
	Vegetarian: true,
} as const satisfies Meal;

// Shortened
const bracketsInNameExample = {
	Additives: {
		1: 'Farbstoffe',
		2: 'Konservierungsstoffe',
		Gl: 'Glutenhaltiges Getreide und daraus hergestellte Erzeugnissse',
		Ei: 'Ei/-erzeugnisse',
		La: 'Milch/-erzeugnisse (einschl. Laktose)',
	},
	Alcohol: false,
	Beef: true,
	Category: 'Campus Spezial',
	Date: '2019-04-30',
	Fish: false,
	LactoseFree: false,
	Name:
    'Hamburger (100%Rind) mit gegrilltem Spargel und Parmesanspäne (1, 2, Gl, Ei, La), Kartoffeltwister (Gl)',
	Pig: false,
	Poultry: false,
	PriceAttendant: 4.5,
	PriceGuest: 5.65,
	PriceStudent: 3.5,
	Vegan: false,
	Vegetarian: false,
} as const satisfies Meal;

await test('generate-meal-test shows hint when something is filtered', () => {
	const result = generateMealText([example], {
		vegan: true,
	});
	strictEqual(result.includes('Sonderwünsche'), true);
});

await test('generate-meal-test does not show hint when nothing is filtered while having filters', () => {
	const result = generateMealText([example], {
		noPig: true,
	});
	strictEqual(result.includes('Sonderwünsche'), false);
});

await test('generate-meal-test show no meals today', () => {
	const result = generateMealText([], {});
	strictEqual(result.includes('bietet heute nichts an'), true);
});

await test('generate-meal-test has meal', () => {
	const result = generateMealText([example], {});
	strictEqual(result.includes('Gurkensalat'), true);
});

await test('generate-meal-test even amount of bold markers without showAdditives', () => {
	const result = generateMealText([example], {
		showAdditives: false,
	});
	const occurrences = result.match(/<\/?b>/g)?.length;
	strictEqual(occurrences, 2);
});

await test('generate-meal-test even amount of bold markers with showAdditives', () => {
	const result = generateMealText([example], {
		showAdditives: true,
	});
	const occurrences = result.match(/<\/?b>/g)?.length;
	strictEqual(occurrences, 4);
});

await test('generate-meal-test Name without showAdditives', () => {
	const result = generateMealText([example], {
		showAdditives: false,
	}).trim();
	const lines = result.split('\n');
	strictEqual(lines[0], '<b>4 Röstiecken, Kräuterquark, Gurkensalat</b>');
});

await test('generate-meal-test Name with showAdditives', () => {
	const result = generateMealText([example], {
		showAdditives: true,
	}).trim();
	const lines = result.split('\n');
	strictEqual(
		lines[0],
		'<b>4 Röstiecken, Kräuterquark</b> (La), <b>Gurkensalat</b> (La)',
	);
});

await test('generate-meal-test Name with brackets without showAdditives', () => {
	const result = generateMealText([bracketsInNameExample], {
		showAdditives: false,
	}).trim();
	const lines = result.split('\n');
	strictEqual(
		lines[0],
		'<b>Hamburger (100%Rind) mit gegrilltem Spargel und Parmesanspäne, Kartoffeltwister</b>',
	);
});

await test('generate-meal-test Name with brackets with showAdditives', () => {
	const result = generateMealText([bracketsInNameExample], {
		showAdditives: true,
	}).trim();
	const lines = result.split('\n');
	strictEqual(
		lines[0],
		'<b>Hamburger (100%Rind) mit gegrilltem Spargel und Parmesanspäne</b> (1, 2, Gl, Ei, La), <b>Kartoffeltwister</b> (Gl)',
	);
});
