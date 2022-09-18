export const DEFAULT_FILTER = '.+'

export function filterButtonText<T>(
	getCurrentFilterFunction: (context: T) => string | undefined,
): (context: T) => string {
	return context => {
		let text = '🔎 Filter'
		const currentFilter = getCurrentFilterFunction(context)
		if (currentFilter && currentFilter !== '.+') {
			text += ': ' + currentFilter
		}

		return text
	}
}
