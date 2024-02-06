import type {I18nFlavor} from '@grammyjs/i18n';
import type {Api, Context as BaseContext, SessionFlavor} from 'grammy';
import type {ContextProperty} from './chatconfig.js';

export type OtherSendMessage = Parameters<Api['sendMessage']>[2];

type ContextFlavour = {
	readonly userconfig: ContextProperty;
};

export type MyContext =
	& BaseContext
	& I18nFlavor
	& SessionFlavor<Session>
	& ContextFlavour;

export type Session = {
	adminBroadcast?: number; // Message ID
	adminuserquicklook?: number; // User ID
	adminuserquicklookfilter?: string;
	eventfilter?: string;
	generateChange?: Partial<Change>;
	page?: number;
	privacySection?: 'telegram' | 'persistent' | 'tmp';
	mensa?: {
		mensa?: string;
		date?: number;
	};
};

export type Userconfig = {
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
};

export type RemovedEventsDisplayStyle = 'cancelled' | 'removed' | 'emoji';

export type EventDetails = {
	alertMinutesBefore?: number;
	notes?: string;
};

export type Change = {
	add?: true;
	name: string;
	date: string;
	remove?: true;
	namesuffix?: string;
	starttime?: string;
	endtime?: string;
	room?: string;
};

export type MensaPriceClass = 'student' | 'attendant' | 'guest';

export type MealWishes = {
	lactoseFree?: boolean;
	noAlcohol?: boolean;
	noBeef?: boolean;
	noFish?: boolean;
	noGame?: boolean;
	noGelatine?: boolean;
	noLamb?: boolean;
	noPig?: boolean;
	noPoultry?: boolean;
	vegan?: boolean;
	vegetarian?: boolean;
};
export type MealWish = keyof MealWishes;

export type MensaSettings = MealWishes & {
	main?: string;
	more?: readonly string[];
	price?: MensaPriceClass;
	showAdditives?: boolean;
};

export type EventEntryFileContent = {
	readonly Name: string;
	readonly Location: string;
	readonly Description: string;
	readonly StartTime: string;
	readonly EndTime: string;
};

export type EventEntryInternal = {
	readonly Name: string;
	readonly Location: string;
	readonly Description: string;
	readonly StartTime: Date;
	readonly EndTime: Date;
};
