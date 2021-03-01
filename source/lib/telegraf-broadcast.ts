import {Telegram} from 'telegraf'
import {ExtraReplyMessage} from 'telegraf/typings/telegram-types'

import {sequentialLoop, sleep} from './async'

const SLEEP_MS = 250

export async function broadcast(telegram: Telegram, targetIds: readonly number[], text: string, extra: ExtraReplyMessage): Promise<number[]> {
	const goneUserIds: number[] = []

	await sequentialLoop(targetIds, async id => {
		try {
			await sleep(SLEEP_MS)
			await telegram.sendMessage(id, text, extra)
		} catch (error: unknown) {
			console.warn('broadcast failed. Target:', id, (error as any)?.response)
			if (isUserGoneError(error instanceof Error ? error.message : String(error))) {
				goneUserIds.push(id)
			}
		}
	})

	return goneUserIds
}

export async function forwardBroadcast(telegram: Telegram, targetIds: readonly number[], originChat: string | number, messageId: number): Promise<number[]> {
	const goneUserIds: number[] = []

	await sequentialLoop(targetIds, async id => {
		try {
			await sleep(SLEEP_MS)
			await telegram.forwardMessage(id, originChat, messageId)
		} catch (error: unknown) {
			console.warn('forwardBroadcast failed. Target:', id, (error as any)?.response)
			if (isUserGoneError(error instanceof Error ? error.message : String(error))) {
				goneUserIds.push(id)
			}
		}
	})

	return goneUserIds
}

function isUserGoneError(errorDescription: string): boolean {
	return errorDescription.includes('user is deactivated') ||
        errorDescription.includes('bot was blocked by the user')
}
