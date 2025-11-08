import {exec} from 'node:child_process';
import {existsSync} from 'node:fs';
import {promisify} from 'node:util';

const MENSA_REPO = 'https://github.com/HAWHHCalendarBot/mensa-data.git';
export const MENSA_DIR = 'mensa-data';
const EVENT_FILES_REPO = 'https://github.com/HAWHHCalendarBot/eventfiles.git';
export const EVENT_FILES_DIR = 'eventfiles';

const run = promisify(exec);

async function pull(repoUrl: string, repoDir: string): Promise<void> {
	try {
		await (existsSync(`${repoDir}/.git`)
			? run(`git -C ${repoDir} pull`)
			: run(`git clone -q --depth 1 ${repoUrl} ${repoDir}`));
	} catch {}
}

export async function pullMensaData(): Promise<void> {
	await pull(MENSA_REPO, MENSA_DIR);
}

export async function pullEventFiles(): Promise<void> {
	await pull(EVENT_FILES_REPO, EVENT_FILES_DIR);
}
