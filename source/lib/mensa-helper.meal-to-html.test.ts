import test from 'ava'

import {Meal} from './meal.js'

import {mealToHtml} from './mensa-helper.js'

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
	expected += '\nLa: Milch/-erzeugnisse (einschl. Laktose)'
	const result = mealToHtml(example, 'student', true)
	t.is(result, expected)
})
