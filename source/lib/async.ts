export async function sequentialLoop<Argument, Result>(inputs: readonly Argument[], func: (input: Argument) => Promise<Result>): Promise<Result[]> {
	const results: Result[] = []

	for (const arg of inputs) {
		// eslint-disable-next-line no-await-in-loop
		results.push(await func(arg))
	}

	return results
}

export async function sleep(ms: number): Promise<void> {
	await new Promise(resolve => {
		setTimeout(resolve, ms)
	})
}
