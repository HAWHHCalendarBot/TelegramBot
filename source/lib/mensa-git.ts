import {exec} from 'node:child_process'
import {promisify} from 'node:util'
import {existsSync} from 'node:fs'

const run = promisify(exec)

export async function pull(): Promise<void> {
	try {
		// eslint-disable-next-line unicorn/prefer-ternary
		if (existsSync('mensa-data/.git')) {
			await run('git -C mensa-data pull')
		} else {
			await run('git clone -q --depth 1 https://github.com/HAWHHCalendarBot/mensa-data.git mensa-data')
		}
	} catch {}
}
