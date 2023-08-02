import type {Api} from 'grammy'
import {sequentialLoop, sleep} from './async.js'
import type {OtherSendMessage} from './types.js'

const SLEEP_MS = 250

export async function broadcast(
	telegram: Api,
	targetIds: readonly number[],
	text: string,
	extra: OtherSendMessage,
): Promise<number[]> {
	const goneUserIds: number[] = []

	await sequentialLoop(targetIds, async id => {
		try {
			await sleep(SLEEP_MS)
			await telegram.sendMessage(id, text, extra)
		} catch (error) {
			console.warn('broadcast failed. Target:', id, error instanceof Error ? error.message : error)
			if (isUserGoneError(error instanceof Error ? error.message : String(error))) {
				goneUserIds.push(id)
			}
		}
	})

	return goneUserIds
}

export async function forwardBroadcast(
	telegram: Api,
	targetIds: readonly number[],
	originChat: string | number,
	messageId: number,
): Promise<number[]> {
	const goneUserIds: number[] = []

	await sequentialLoop(targetIds, async id => {
		try {
			await sleep(SLEEP_MS)
			await telegram.forwardMessage(id, originChat, messageId)
		} catch (error) {
			console.warn('forwardBroadcast failed. Target:', id, error instanceof Error ? error.message : error)
			if (isUserGoneError(error instanceof Error ? error.message : String(error))) {
				goneUserIds.push(id)
			}
		}
	})

	return goneUserIds
}

function isUserGoneError(errorDescription: string): boolean {
	return errorDescription.includes('user is deactivated')
		|| errorDescription.includes('bot was blocked by the user')
}
