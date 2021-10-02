import {createServer} from 'http'

import {Webhooks, createNodeMiddleware} from '@octokit/webhooks'
import {PushEvent} from '@octokit/webhooks-types'

export function startListenWebsiteStalkerWebhook(callback: (text: string) => Promise<void>) {
	const secret = process.env['WEBSITE_STALKER_WEBHOOK_SECRET']
	if (!secret) {
		console.log('WEBSITE_STALKER_WEBHOOK_SECRET is not set. webserver is not started.')
		return
	}

	const webhooks = new Webhooks({
		secret,
	})

	const middleware = createNodeMiddleware(webhooks, {path: '/'})

	createServer(middleware).listen(3000)
	console.log('website-stalker webhook is started and listening for POST / on Port 3000')

	webhooks.on('push', async ({payload}) => {
		// Only care for events on main branch
		if (payload.ref !== 'refs/heads/main') {
			console.log('website-stalker webhook ignore not on main branch', payload)
			return
		}

		const hasRelevantModification = payload.commits.some(commit => commit.modified.some(file => file.startsWith('sites/')))
		if (!hasRelevantModification) {
			console.log('website-stalker webhook ignore unrelevant push', payload)
		}

		const text = textFromPayload(payload)
		try {
			await callback(text)
		} catch (error: unknown) {
			console.error('study-website-stalker callback ERROR', error)
		}
	})
}

function textFromPayload(payload: PushEvent) {
	let text = 'Es gab Webseitenänderungen:\n\n'

	const messages = payload.commits.map(o => o.message)
	text += messages.join('\n\n')

	text += '\n\n'
	text += `Kompletter Diff:\n${payload.compare}`
	return text
}
