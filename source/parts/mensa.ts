import TelegrafInlineMenu from 'telegraf-inline-menu'

import {generateMealText} from '../lib/mensa-helper'
import {getMealsOfDay} from '../lib/mensa-meals'
import {MyContext, MensaSettings} from '../lib/types'
import * as mensaGit from '../lib/mensa-git'

const weekdays: readonly string[] = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const DAY_IN_MS = 1000 * 60 * 60 * 24

setInterval(async () => mensaGit.pull(), 1000 * 60 * 30) // Every 30 minutes
// eslint-disable-next-line @typescript-eslint/no-floating-promises
mensaGit.pull()

function getYearMonthDay(date: Readonly<Date>): Readonly<{year: number; month: number; day: number}> {
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	return {year, month, day}
}

function stringifyEqual(first: unknown, second: unknown): boolean {
	if (!first || !second) {
		return false
	}

	if (first === second) {
		return true
	}

	return JSON.stringify(first) === JSON.stringify(second)
}

function dateEqual(first: Readonly<Date>, second: Readonly<Date>): boolean {
	return stringifyEqual(getYearMonthDay(first), getYearMonthDay(second))
}

export const menu = new TelegrafInlineMenu(currentMensaText as any)

menu.setCommand('mensa')

function getCurrentSettings(context: MyContext): Readonly<{mensa?: string; date: Date}> {
	let {mensa, date} = context.session.mensa ?? {}
	if (!mensa) {
		mensa = context.state.userconfig.mensa.main
	}

	if (!date) {
		date = Date.now()
	}

	const now = Date.now()
	// When that date is more than a day ago, update it
	if ((now - date) > DAY_IN_MS) {
		date = Date.now()
		mensa = context.state.userconfig.mensa.main
	}

	return {mensa, date: new Date(date)}
}

async function currentMensaText(context: MyContext): Promise<string> {
	const {mensa, date} = getCurrentSettings(context)
	const mensaSettings = context.state.userconfig.mensa
	return generateMensaTextOfDate(mensa, date, mensaSettings)
}

function parseActionCode(actionCode: string): Readonly<{mensa: string; date: Date}> {
	const result = /^([^:]+)#(\d+-\d+-\d+)/.exec(actionCode)!
	const mensa = result[1]
	const date = new Date(Date.parse(result[2]))
	return {mensa, date}
}

function generateActionCode(mensa: string, date: Date): string {
	const {year, month, day} = getYearMonthDay(date)
	return `${mensa}#${year}-${month}-${day}`
}

function setMensaDay(context: MyContext, selected: string): void {
	const {mensa, date} = parseActionCode(selected)
	if (!context.session.mensa) {
		context.session.mensa = {}
	}

	if (mensa === 'undefined') {
		return
	}

	context.session.mensa.mensa = mensa
	context.session.mensa.date = date.getTime()
}

function timePrefixFunc(context: MyContext, key: string): string {
	const action = parseActionCode(key)
	const selected = getCurrentSettings(context)
	const mensaSelected = action.mensa === selected.mensa
	const dateSelected = dateEqual(action.date, selected.date)
	const isSelected = mensaSelected && dateSelected

	return isSelected ? '🕚' : ''
}

function hideMensa(context: MyContext, key: string): boolean {
	const {mensa} = getCurrentSettings(context)
	return mensa === parseActionCode(key).mensa
}

function daySelectOptions(context: MyContext): Record<string, string> {
	const {mensa} = getCurrentSettings(context)
	if (!mensa) {
		return {}
	}

	const dateOptions = []
	const daysInFuture = 6

	for (let i = 0; i < daysInFuture; i++) {
		dateOptions.push(new Date(Date.now() + (DAY_IN_MS * i)))
	}

	const result: Record<string, string> = {}
	for (const date of dateOptions) {
		const weekday = weekdays[date.getDay()]
			.slice(0, 2)
		const day = date.getDate()
		const key = generateActionCode(mensa, date)
		result[key] = `${weekday} ${day}.`
	}

	return result
}

function mensaSelectOption(context: MyContext): Record<string, string> {
	const {date} = getCurrentSettings(context)

	const {main, more} = context.state.userconfig.mensa ?? {}
	const mensaOptions = [...more ?? []]
	if (main) {
		mensaOptions.unshift(main)
	}

	const result: Record<string, string> = {}
	for (const mensa of mensaOptions) {
		const key = generateActionCode(mensa, date)
		result[key] = '🍽 ' + mensa
	}

	return result
}

menu.select('t', daySelectOptions as any, {
	setFunc: setMensaDay as any,
	columns: 3,
	prefixFunc: timePrefixFunc as any
})

menu.select('m', mensaSelectOption as any, {
	setFunc: setMensaDay as any,
	columns: 1,
	hide: hideMensa as any
})

async function generateMensaTextOfDate(mensa: string | undefined, date: Date, mensaSettings: Readonly<MensaSettings>): Promise<string> {
	if (!mensa || mensa === 'undefined') {
		return '⚠️ Du hast keine Mensa gesetzt, zu der du dein Angebot bekommen möchtest. Diese kannst du in den Einstellungen setzen.'
	}

	const weekday = weekdays[date.getDay()]
	const {year, month, day} = getYearMonthDay(date)
	const prefix = `Mensa *${mensa}*\n${weekday} ${day}.${month}.${year}\n`

	const meals = await getMealsOfDay(mensa, year, month, day)
	const text = generateMealText(meals, mensaSettings)
	return prefix + text
}
