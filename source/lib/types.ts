import {Api, Context as BaseContext} from 'grammy'
import {I18nContext} from '@grammyjs/i18n'

import {ContextProperty} from './chatconfig.js'

export function unreachable(unreachable: never): never {
	throw new Error('Should have been unreachable but looks like it wasnt: ' + JSON.stringify(unreachable))
}

export type OtherSendMessage = Parameters<Api['sendMessage']>[2]

export interface ContextFlavour {
	readonly i18n: I18nContext;
	readonly match: RegExpExecArray | undefined;
	readonly session: Session;
	readonly userconfig: ContextProperty;
}

export type MyContext = BaseContext & ContextFlavour

export interface Session {
	adminBroadcast?: number; // Message ID
	adminuserquicklook?: number; // User ID
	adminuserquicklookfilter?: string;
	eventfilter?: string;
	generateChange?: Partial<Change>;
	page?: number;
	mensa?: {
		mensa?: string;
		date?: number;
	};
}

export interface Userconfig {
	readonly admin?: true;
	calendarfileSuffix: string;
	changes: Change[];
	events: Record<string, EventDetails>;
	mensa: MensaSettings;
	removedEvents?: RemovedEventsDisplayStyle;
	/** @deprecated use channel https://t.me/HAWHHWebsiteStalker instead */
	stisysUpdate?: boolean;
	/** @deprecated use channel https://t.me/HAWHHWebsiteStalker instead */
	websiteStalkerUpdate?: true;
}

export type RemovedEventsDisplayStyle = 'cancelled' | 'removed' | 'emoji'

export interface EventDetails {
	alertMinutesBefore?: number;
	notes?: string;
}

export interface Change {
	add?: true;
	name: string;
	date: string;
	remove?: true;
	namesuffix?: string;
	starttime?: string;
	endtime?: string;
	room?: string;
}

export type MensaPriceClass = 'student' | 'attendant' | 'guest'

export interface MealWishes {
	lactoseFree?: boolean;
	noBeef?: boolean;
	noFish?: boolean;
	noGame?: boolean;
	noGelatine?: boolean;
	noLamb?: boolean;
	noPig?: boolean;
	noPoultry?: boolean;
	vegan?: boolean;
	vegetarian?: boolean;
}

export interface MensaSettings extends MealWishes {
	main?: string;
	more?: string[];
	price?: MensaPriceClass;
	showAdditives?: boolean;
}

export interface EventEntryFileContent {
	readonly Name: string;
	readonly Location: string;
	readonly Description: string;
	readonly StartTime: string;
	readonly EndTime: string;
}

export interface EventEntryInternal {
	readonly Name: string;
	readonly Location: string;
	readonly Description: string;
	readonly StartTime: Date;
	readonly EndTime: Date;
}
