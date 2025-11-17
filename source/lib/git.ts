import {exec} from 'node:child_process';
import {existsSync} from 'node:fs';
import {promisify} from 'node:util';

const run = promisify(exec);

export async function pull(
	directory: string,
	remoteUrl: string,
): Promise<void> {
	try {
		await (existsSync(`${directory}/.git`)
			? run(`git -C ${directory} pull`)
			: run(`git clone -q --depth 1 ${remoteUrl} ${directory}`));
	} catch {}
}
