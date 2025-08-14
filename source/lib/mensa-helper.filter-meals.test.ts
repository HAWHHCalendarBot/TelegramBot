import {deepStrictEqual, strictEqual} from 'node:assert';
import {test} from 'node:test';
import type {Meal} from './meal.ts';
import {filterMeals} from './mensa-helper.ts';

const BASE_MEAL = {
	Additives: {},
	Category: 'Test Meal',
	Date: '2021-05-18',
	PriceAttendant: 0,
	PriceGuest: 0,
	PriceStudent: 0,
} as const;

const TEST_MEALS = [
	{
		...BASE_MEAL,
		Alcohol: false,
		Beef: false,
		Fish: true,
		LactoseFree: false,
		Name: 'Fisch',
		Pig: false,
		Poultry: false,
		Vegan: false,
		Vegetarian: false,
	},
	{
		...BASE_MEAL,
		Alcohol: false,
		Beef: false,
		Fish: false,
		LactoseFree: false,
		Name: 'Pasta Sahne',
		Pig: false,
		Poultry: false,
		Vegan: false,
		Vegetarian: true,
	},
	{
		...BASE_MEAL,
		Alcohol: false,
		Beef: false,
		Fish: false,
		LactoseFree: false,
		Name: 'Pasta Speck',
		Pig: true,
		Poultry: false,
		Vegan: false,
		Vegetarian: false,
	},
	{
		...BASE_MEAL,
		Alcohol: false,
		Beef: false,
		Fish: false,
		LactoseFree: true,
		Name: 'Pasta',
		Pig: false,
		Poultry: false,
		Vegan: true,
		Vegetarian: false,
	},
	{
		...BASE_MEAL,
		Alcohol: false,
		Beef: true,
		Fish: false,
		LactoseFree: false,
		Name: 'Rindstuff',
		Pig: false,
		Poultry: false,
		Vegan: false,
		Vegetarian: false,
	},
] as const satisfies readonly Meal[];

await test('filter-meals filterfrei', () => {
	const filtered = filterMeals(TEST_MEALS, {});
	strictEqual(filtered.length, TEST_MEALS.length);
});

await test('filter-meals vegan', () => {
	const filtered = filterMeals(TEST_MEALS, {vegan: true});
	deepStrictEqual(
		filtered.map(o => o.Name),
		['Pasta'],
	);
});

await test('filter-meals vegetarisch', () => {
	const filtered = filterMeals(TEST_MEALS, {vegetarian: true});
	deepStrictEqual(
		filtered.map(o => o.Name),
		['Pasta Sahne', 'Pasta'],
	);
});

await test('filter-meals laktosefrei', () => {
	const filtered = filterMeals(TEST_MEALS, {lactoseFree: true});
	deepStrictEqual(
		filtered.map(o => o.Name),
		['Pasta'],
	);
});

await test('filter-meals ohne Schwein', () => {
	const filtered = filterMeals(TEST_MEALS, {noPig: true});
	deepStrictEqual(
		filtered.map(o => o.Name),
		['Fisch', 'Pasta Sahne', 'Pasta', 'Rindstuff'],
	);
});

await test('filter-meals ohne Rind', () => {
	const filtered = filterMeals(TEST_MEALS, {noBeef: true});
	deepStrictEqual(
		filtered.map(o => o.Name),
		['Fisch', 'Pasta Sahne', 'Pasta Speck', 'Pasta'],
	);
});

await test('filter-meals ohne Geflügel', () => {
	const filtered = filterMeals(TEST_MEALS, {noPoultry: true});
	deepStrictEqual(
		filtered.map(o => o.Name),
		['Fisch', 'Pasta Sahne', 'Pasta Speck', 'Pasta', 'Rindstuff'],
	);
});

await test('filter-meals ohne Fisch', () => {
	const filtered = filterMeals(TEST_MEALS, {noFish: true});
	deepStrictEqual(
		filtered.map(o => o.Name),
		['Pasta Sahne', 'Pasta Speck', 'Pasta', 'Rindstuff'],
	);
});
