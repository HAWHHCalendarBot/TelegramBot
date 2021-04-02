import {promises as fsPromises} from 'fs'

import got from 'got'

// Creating the folder is not needed. It should already be there
const _stISysFolder = 'tmp'
const _stISysFile = 'StISys.html'

async function getCurrentStISys(): Promise<string> {
	const response = await got('https://stisys.haw-hamburg.de/', {
		encoding: 'latin1',
		timeout: 5 * 1000, // 5 seconds
		headers: {
			from: 'calendarbot@hawhh.de',
			'user-agent': 'github.com/HAWHHCalendarBot/telegrambot'
		}
	})

	if (response.statusCode !== 200) {
		console.log(Date.now(), 'StISys down', response.statusCode, response.statusMessage)
		throw new Error(`${Date.now()} StISys down ${response.statusCode} ${String(response.statusMessage)}`)
	}

	const match = /;jsessionid=[^"]+/.exec(response.body)!
	return response.body.replace(match[0]!, '')
}

async function compareToOldStISys(currentStISys: string): Promise<boolean | undefined> {
	try {
		const oldStISys = await fsPromises.readFile(_stISysFolder + '/' + _stISysFile, 'utf8')

		if (currentStISys === oldStISys) {
			return false
		}

		return true
	} catch {
		return undefined
	} finally {
		await fsPromises.writeFile(_stISysFolder + '/' + _stISysFile, currentStISys, 'utf8')
	}
}

export async function hasStISysChanged(): Promise<boolean | undefined> {
	try {
		const currentStISys = await getCurrentStISys()
		return await compareToOldStISys(currentStISys)
	} catch (error: unknown) {
		console.error('StISys check failed', error)
		return undefined
	}
}
