import test from 'ava'

import {Meal} from './meal.js'

import {generateMealText} from './mensa-helper.js'

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

// Shortened
const bracketsInNameExample: Meal = {
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
	Date: '/Date(1556582400000+0000)/',
	Fish: false,
	LactoseFree: false,
	Name: 'Hamburger (100%Rind) mit gegrilltem Spargel und Parmesanspäne (1, 2, Gl, Ei, La), Kartoffeltwister (Gl)',
	Pig: false,
	Poultry: false,
	PriceAttendant: 4.5,
	PriceGuest: 5.65,
	PriceStudent: 3.5,
	Vegan: false,
	Vegetarian: false,
}

test('shows hint when something is filtered', t => {
	const result = generateMealText([example], {
		vegan: true,
	})
	t.regex(result, /Sonderwünsche/)
})

test('does not show hint when nothing is filtered while having filters', t => {
	const result = generateMealText([example], {
		noPig: true,
	})
	t.notRegex(result, /Sonderwünsche/)
})

test('show no meals today', t => {
	const result = generateMealText([], {})
	t.regex(result, /bietet heute nichts an/)
})

test('has meal', t => {
	const result = generateMealText([example], {})
	t.regex(result, /Gurkensalat/)
})

test('even amount of bold markers without showAdditives', t => {
	const result = generateMealText([example], {
		showAdditives: false,
	})
	t.log(result)
	const occurrences = result.match(/<\/?b>/g)?.length
	t.is(occurrences, 2)
})

test('even amount of bold markers with showAdditives', t => {
	const result = generateMealText([example], {
		showAdditives: true,
	})
	t.log(result)
	const occurrences = result.match(/<\/?b>/g)?.length
	t.is(occurrences, 4)
})

test('Name without showAdditives', t => {
	const result = generateMealText([example], {
		showAdditives: false,
	}).trim()
	t.log(result)
	const lines = result.split('\n')
	t.is(lines[0], '<b>4 Röstiecken, Kräuterquark, Gurkensalat</b>')
})

test('Name with showAdditives', t => {
	const result = generateMealText([example], {
		showAdditives: true,
	}).trim()
	t.log(result)
	const lines = result.split('\n')
	t.is(lines[0], '<b>4 Röstiecken, Kräuterquark</b> (La), <b>Gurkensalat</b> (La)')
})

test('Name with brackets without showAdditives', t => {
	const result = generateMealText([bracketsInNameExample], {
		showAdditives: false,
	}).trim()
	t.log(result)
	const lines = result.split('\n')
	t.is(lines[0], '<b>Hamburger (100%Rind) mit gegrilltem Spargel und Parmesanspäne, Kartoffeltwister</b>')
})

test('Name with brackets with showAdditives', t => {
	const result = generateMealText([bracketsInNameExample], {
		showAdditives: true,
	}).trim()
	t.log(result)
	const lines = result.split('\n')
	t.is(lines[0], '<b>Hamburger (100%Rind) mit gegrilltem Spargel und Parmesanspäne</b> (1, 2, Gl, Ei, La), <b>Kartoffeltwister</b> (Gl)')
})
