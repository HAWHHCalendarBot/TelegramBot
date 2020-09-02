function generateNumberArray(start: number, end: number, interval = 1): number[] {
    const array: number[] = []
    for (let i = start; i <= end; i += interval) {
        array.push(i)
    }

    return array
}

export const MONTH_NAMES: readonly string[] = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export const DAY_OPTIONS: readonly number[] = generateNumberArray(1, 31)
export const HOUR_OPTIONS: readonly number[] = generateNumberArray(7, 21)
export const MINUTE_OPTIONS: readonly number[] = generateNumberArray(0, 55, 5)

export function generateMonthOptions(): Record<number, string> {
    const result: Record<number, string> = {}
    for (let i = 0; i < MONTH_NAMES.length; i++) {
        const name = MONTH_NAMES[i];
        result[i + 1] = name
    }

    return result
}

export function generateYearOptions() {
    const currentYear = new Date(Date.now()).getFullYear()
    return generateNumberArray(currentYear - 1, currentYear + 1)
}
