import test from 'ava'
import {filterMeals} from './mensa-helper.js'
import type {Meal} from './meal.js'

const BASE_MEAL = {
	Additives: {},
	Category: 'Test Meal',
	Date: '2021-05-18T07:39Z',
	PriceAttendant: 0,
	PriceGuest: 0,
	PriceStudent: 0,
} as const

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
	}, {
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
	}, {
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
	}, {
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
	}, {
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
] as const satisfies readonly Meal[]

test('filterfrei', t => {
	const filtered = filterMeals(TEST_MEALS, {})
	t.is(filtered.length, TEST_MEALS.length)
})

test('vegan', t => {
	const filtered = filterMeals(TEST_MEALS, {vegan: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Pasta',
	])
})

test('vegetarisch', t => {
	const filtered = filterMeals(TEST_MEALS, {vegetarian: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Pasta Sahne',
		'Pasta',
	])
})

test('laktosefrei', t => {
	const filtered = filterMeals(TEST_MEALS, {lactoseFree: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Pasta',
	])
})

test('ohne Schwein', t => {
	const filtered = filterMeals(TEST_MEALS, {noPig: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Fisch',
		'Pasta Sahne',
		'Pasta',
		'Rindstuff',
	])
})

test('ohne Rind', t => {
	const filtered = filterMeals(TEST_MEALS, {noBeef: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Fisch',
		'Pasta Sahne',
		'Pasta Speck',
		'Pasta',
	])
})

test('ohne Geflügel', t => {
	const filtered = filterMeals(TEST_MEALS, {noPoultry: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Fisch',
		'Pasta Sahne',
		'Pasta Speck',
		'Pasta',
		'Rindstuff',
	])
})

test('ohne Fisch', t => {
	const filtered = filterMeals(TEST_MEALS, {noFish: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Pasta Sahne',
		'Pasta Speck',
		'Pasta',
		'Rindstuff',
	])
})
