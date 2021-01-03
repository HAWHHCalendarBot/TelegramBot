import {promises as fsPromises} from 'fs'

async function getAll(): Promise<string[]> {
	const data = await fsPromises.readFile('eventfiles/all.txt', 'utf8')
	const list = data.split('\n').filter(element => element !== '')
	return list
}

export async function count(): Promise<number> {
	const allEvents = await getAll()
	return allEvents.length
}

export async function exists(name: string): Promise<boolean> {
	const allEvents = await getAll()
	return allEvents.includes(name)
}

export async function nonExisting(names: readonly string[]): Promise<string[]> {
	const allEvents = new Set(await getAll())
	const result: string[] = []
	for (const event of names) {
		if (!allEvents.has(event)) {
			result.push(event)
		}
	}

	return result
}

export async function find(pattern: string | RegExp, ignore: readonly string[] = []): Promise<readonly string[]> {
	const allEvents = await getAll()
	const regex = new RegExp(pattern, 'i')
	const filtered = allEvents.filter(event => regex.test(event) && !ignore.some(v => v === event))
	return filtered
}
