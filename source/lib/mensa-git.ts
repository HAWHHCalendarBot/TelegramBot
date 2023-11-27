import {exec} from 'node:child_process';
import {existsSync} from 'node:fs';
import {promisify} from 'node:util';

const run = promisify(exec);

export async function pull(): Promise<void> {
	try {
		if (existsSync('mensa-data/.git')) {
			await run('git -C mensa-data pull');
		} else {
			await run(
				'git clone -q --depth 1 https://github.com/HAWHHCalendarBot/mensa-data.git mensa-data',
			);
		}
	} catch {}
}
