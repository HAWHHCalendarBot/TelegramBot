import {exec} from 'node:child_process';
import {existsSync} from 'node:fs';
import {promisify} from 'node:util';

export const EVENT_FILES_DIR = 'eventfiles';
export const MENSA_DIR = 'mensa-data';

const run = promisify(exec);

async function pull(directory: string, remoteUrl: string): Promise<void> {
	try {
		await (existsSync(`${directory}/.git`)
			? run(`git -C ${directory} pull`)
			: run(`git clone -q --depth 1 ${remoteUrl} ${directory}`));
	} catch {}
}

export async function pullEventFiles(): Promise<void> {
	await pull(
		EVENT_FILES_DIR,
		'https://github.com/HAWHHCalendarBot/eventfiles.git',
	);
}

export async function pullMensaData(): Promise<void> {
	await pull(MENSA_DIR, 'https://github.com/HAWHHCalendarBot/mensa-data.git');
}
