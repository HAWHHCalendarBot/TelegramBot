import test from 'ava'

import {Meal} from './meal.js'

import {filterMeals} from './mensa-helper.js'

const testMeals: readonly Meal[] = [
	{
		Beef: false,
		Fish: true,
		LactoseFree: false,
		Name: 'Fisch',
		Pig: false,
		Poultry: false,
		Vegan: false,
		Vegetarian: false
	}, {
		Beef: false,
		Fish: false,
		LactoseFree: false,
		Name: 'Pasta Sahne',
		Pig: false,
		Poultry: false,
		Vegan: false,
		Vegetarian: true
	}, {
		Beef: false,
		Fish: false,
		LactoseFree: false,
		Name: 'Pasta Speck',
		Pig: true,
		Poultry: false,
		Vegan: false,
		Vegetarian: false
	}, {
		Beef: false,
		Fish: false,
		LactoseFree: true,
		Name: 'Pasta',
		Pig: false,
		Poultry: false,
		Vegan: true,
		Vegetarian: false
	}, {
		Beef: true,
		Fish: false,
		LactoseFree: false,
		Name: 'Rindstuff',
		Pig: false,
		Poultry: false,
		Vegan: false,
		Vegetarian: false
	}
] as any

test('filterfrei', t => {
	const filtered = filterMeals(testMeals, {})
	t.is(filtered.length, testMeals.length)
})

test('vegan', t => {
	const filtered = filterMeals(testMeals, {vegan: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Pasta'
	])
})

test('vegetarisch', t => {
	const filtered = filterMeals(testMeals, {vegetarian: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Pasta Sahne',
		'Pasta'
	])
})

test('laktosefrei', t => {
	const filtered = filterMeals(testMeals, {lactoseFree: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Pasta'
	])
})

test('ohne Schwein', t => {
	const filtered = filterMeals(testMeals, {noPig: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Fisch',
		'Pasta Sahne',
		'Pasta',
		'Rindstuff'
	])
})

test('ohne Rind', t => {
	const filtered = filterMeals(testMeals, {noBeef: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Fisch',
		'Pasta Sahne',
		'Pasta Speck',
		'Pasta'
	])
})

test('ohne Geflügel', t => {
	const filtered = filterMeals(testMeals, {noPoultry: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Fisch',
		'Pasta Sahne',
		'Pasta Speck',
		'Pasta',
		'Rindstuff'
	])
})

test('ohne Fisch', t => {
	const filtered = filterMeals(testMeals, {noFish: true})
	t.deepEqual(filtered.map(o => o.Name), [
		'Pasta Sahne',
		'Pasta Speck',
		'Pasta',
		'Rindstuff'
	])
})
