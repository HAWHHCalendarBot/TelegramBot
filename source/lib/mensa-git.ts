import {exec} from 'child_process'
import {promisify} from 'util'
import {existsSync} from 'fs'

const run = promisify(exec)

export async function pull(): Promise<void> {
	try {
		if (existsSync('mensa-data/.git')) {
			await gitCommand('pull')
		} else {
			await run('git clone -q --depth 1 https://github.com/HAWHHCalendarBot/mensa-data.git mensa-data')
		}
	} catch {}
}

async function gitCommand(command: string): Promise<{stdout: string; stderr: string}> {
	return run(`git -C mensa-data ${command}`)
}
