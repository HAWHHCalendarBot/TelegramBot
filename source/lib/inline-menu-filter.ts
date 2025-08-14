export const DEFAULT_FILTER = '.+';

export function filterButtonText<T>(getCurrentFilterFunction: (ctx: T) => string | undefined): (ctx: T) => string {
	return ctx => {
		let text = '🔎 Filter';
		const currentFilter = getCurrentFilterFunction(ctx);
		if (currentFilter && currentFilter !== '.+') {
			text += ': ' + currentFilter;
		}

		return text;
	};
}
