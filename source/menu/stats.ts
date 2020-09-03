import {MenuTemplate} from 'telegraf-inline-menu'

import {backMainButtons} from '../lib/inline-menu'
import {getCanteenList} from '../lib/mensa-meals'
import {MyContext} from '../lib/types'
import * as allEvents from '../lib/all-events'

export const menu = new MenuTemplate<MyContext>(statsText)

async function statsText(context: MyContext): Promise<string> {
	const userIds = await context.userconfig.allIds()
	const userCount = userIds.length

	const canteenCount = (await getCanteenList()).length
	const eventCount = await allEvents.count()

	let text = `Ich habe aktuell ${eventCount} Veranstaltungen und ${canteenCount} Mensen, die ich ${userCount} begeisterten Nutzern 😍 zur Verfügung stelle.`

	text += '\n\nWenn ich für dich hilfreich bin, dann erzähl gern anderen von mir, denn ich will gern allen helfen, denen noch zu helfen ist. ☺️'
	text += '\n\nWenn du noch mehr über meine Funktionsweise wissen willst werfe einen Blick im Hauptmenu auf "Über den Bot"'

	return text
}

menu.manualRow(backMainButtons)
