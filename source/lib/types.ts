import type {I18nFlavor} from '@grammyjs/i18n';
import type {Api, Context as BaseContext, SessionFlavor} from 'grammy';
import type {ContextProperty} from './chatconfig.ts';

export type OtherSendMessage = Parameters<Api['sendMessage']>[2];

export type NaiveDate = `${number}-${number}-${number}`;
export type NaiveTime = `${number}:${number}:${number}`;
export type NaiveDateTime = `${NaiveDate}T${NaiveTime}`;

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
	eventPath?: string[]; // Path to the selected subdirectory
	eventDirectorySubDirectoryItems?: string[]; // Subdirectory item keys of the directory selected by eventPath
	generateChangeEventId?: EventId;
	generateChangeDate?: NaiveDateTime;
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
	events: Record<EventId, EventDetails>;
	mensa: MensaSettings;
	removedEvents?: RemovedEventsDisplayStyle;
};

export type RemovedEventsDisplayStyle = 'cancelled' | 'removed' | 'emoji';

export type EventDetails = {
	alertMinutesBefore?: number;
	changes?: Record<NaiveDateTime, Change>;
	notes?: string;
};

export type Change = {
	remove?: true;
	namesuffix?: string;
	starttime?: NaiveTime;
	endtime?: NaiveTime;
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

export type EventId = `${number}_${number | string}`;

export type EventDirectory = {
	readonly subDirectories: Readonly<Record<string, Partial<EventDirectory>>>;
	readonly events: Readonly<Record<EventId, string>>;
};

export type EventEntry = {
	readonly name: string;
	readonly location: string;
	readonly description: string;
	readonly startTime: NaiveDateTime;
	readonly endTime: NaiveDateTime;
};
