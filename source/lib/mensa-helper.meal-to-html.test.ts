import test from 'ava'
import {mealNameToHtml, mealToHtml} from './mensa-helper.js'
import type {Meal} from './meal.js'

const example: Meal = {
	Additives: {
		La: 'Milch/-erzeugnisse (einschl. Laktose)',
	},
	Alcohol: false,
	Beef: false,
	Category: 'Food',
	Date: '/Date(1536883200000+0000)/',
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
}

test('example student without Additives', t => {
	let expected = '<b>4 Röstiecken, Kräuterquark, Gurkensalat</b>'
	expected += '\n2,45 € vegetarisch'
	const result = mealToHtml(example, 'student', false)
	t.is(result, expected)
})

test('example guest without Additives', t => {
	let expected = '<b>4 Röstiecken, Kräuterquark, Gurkensalat</b>'
	expected += '\n4,70 € vegetarisch'
	const result = mealToHtml(example, 'guest', false)
	t.is(result, expected)
})

test('example student with Additives', t => {
	let expected = '<b>4 Röstiecken, Kräuterquark</b> (La), <b>Gurkensalat</b> (La)'
	expected += '\n2,45 € vegetarisch'
	const result = mealToHtml(example, 'student', true)
	t.is(result, expected)
})

test('example name with end bracket without Additives', t => {
	const expected = '<b>Soja Bolognese mit Gemüse, bunte Fusilli (VEGAN)</b>'
	const result = mealNameToHtml('Soja Bolognese mit Gemüse (So,Sl), bunte Fusilli (VEGAN) (Gl)', false)
	t.is(result, expected)
})

test('example name with end bracket with Additives', t => {
	const expected = '<b>Soja Bolognese mit Gemüse</b> (So,Sl), <b>bunte Fusilli (VEGAN)</b> (Gl)'
	const result = mealNameToHtml('Soja Bolognese mit Gemüse (So,Sl), bunte Fusilli (VEGAN) (Gl)', true)
	t.is(result, expected)
})
