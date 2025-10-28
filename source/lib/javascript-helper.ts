
export function typedKeys<K extends keyof any>(record: Readonly<Partial<Record<K, unknown>>>): K[] {
	return Object.keys(record) as K[];
}

export function typedEntries<K extends keyof any, V>(record: Readonly<Partial<Record<K, V>>>): Array<[K, V]> {
	if (!record) {
		return [];
	}

	return (Object.entries(record) as unknown[]) as Array<[K, V]>;
}
