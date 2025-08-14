import {exec} from 'node:child_process';
import {existsSync} from 'node:fs';
import {promisify} from 'node:util';

const run = promisify(exec);

export async function pull(): Promise<void> {
	try {
		await (existsSync('mensa-data/.git')
			? run('git -C mensa-data pull')
			: run('git clone -q --depth 1 https://github.com/HAWHHCalendarBot/mensa-data.git mensa-data'));
	} catch {}
}
