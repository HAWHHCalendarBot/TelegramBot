function generateNumberArray(
	start: number,
	end: number,
	interval = 1,
): number[] {
	const array: number[] = []
	for (let i = start; i <= end; i += interval) {
		array.push(i)
	}

	return array
}

export const MONTH_NAMES = [
	'Januar',
	'Februar',
	'März',
	'April',
	'Mai',
	'Juni',
	'Juli',
	'August',
	'September',
	'Oktober',
	'November',
	'Dezember',
] as const
type MonthName = typeof MONTH_NAMES[number]

export const DAY_OPTIONS: readonly number[] = generateNumberArray(1, 31)
export const HOUR_OPTIONS: readonly number[] = generateNumberArray(7, 21)
export const MINUTE_OPTIONS: readonly number[] = generateNumberArray(0, 55, 5)

export function generateMonthOptions(): Record<number, MonthName> {
	const result: Record<number, MonthName> = {}
	for (const [i, name] of MONTH_NAMES.entries()) {
		result[i + 1] = name
	}

	return result
}

export function generateYearOptions() {
	const currentYear = new Date(Date.now()).getFullYear()
	return generateNumberArray(currentYear - 1, currentYear + 1)
}
