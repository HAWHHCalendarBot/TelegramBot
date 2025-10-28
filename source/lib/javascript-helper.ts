
export function typedKeys<T extends Record<string, unknown>>(obj: T): Array<keyof T> {
	return Object.keys(obj) as Array<keyof T>;
}

export function typedEntries<K extends keyof any, V>(record: Readonly<Partial<Record<K, V>>>): Array<[K, V]> {
	if (!record) {
		return [];
	}

	return (Object.entries(record) as unknown[]) as Array<[K, V]>;
}
