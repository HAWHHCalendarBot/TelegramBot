import {strictEqual} from 'node:assert'
import {test} from 'node:test'
import type {Meal} from './meal.js'
import {mealNameToHtml, mealToHtml} from './mensa-helper.js'

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
} as const satisfies Meal

await test('meal-to-html example student without Additives', () => {
	let expected = '<b>4 Röstiecken, Kräuterquark, Gurkensalat</b>'
	expected += '\n2,45 € vegetarisch'
	const result = mealToHtml(example, 'student', false)
	strictEqual(result, expected)
})

await test('meal-to-html example guest without Additives', () => {
	let expected = '<b>4 Röstiecken, Kräuterquark, Gurkensalat</b>'
	expected += '\n4,70 € vegetarisch'
	const result = mealToHtml(example, 'guest', false)
	strictEqual(result, expected)
})

await test('meal-to-html example student with Additives', () => {
	let expected
    = '<b>4 Röstiecken, Kräuterquark</b> (La), <b>Gurkensalat</b> (La)'
	expected += '\n2,45 € vegetarisch'
	const result = mealToHtml(example, 'student', true)
	strictEqual(result, expected)
})

await test('meal-to-html example name with end bracket without Additives', () => {
	const expected = '<b>Soja Bolognese mit Gemüse, bunte Fusilli (VEGAN)</b>'
	const result = mealNameToHtml(
		'Soja Bolognese mit Gemüse (So,Sl), bunte Fusilli (VEGAN) (Gl)',
		false,
	)
	strictEqual(result, expected)
})

await test('meal-to-html example name with end bracket with Additives', () => {
	const expected
    = '<b>Soja Bolognese mit Gemüse</b> (So,Sl), <b>bunte Fusilli (VEGAN)</b> (Gl)'
	const result = mealNameToHtml(
		'Soja Bolognese mit Gemüse (So,Sl), bunte Fusilli (VEGAN) (Gl)',
		true,
	)
	strictEqual(result, expected)
})
