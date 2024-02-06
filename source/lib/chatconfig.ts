import {
	readdir, readFile, unlink, writeFile,
} from 'node:fs/promises';
import type {Api, MiddlewareFn} from 'grammy';
import type {User} from 'grammy/types';
import stringify from 'json-stable-stringify';
import {sequentialLoop} from './async.js';
import * as telegramBroadcast from './telegram-broadcast.js';
import type {MyContext, OtherSendMessage, Userconfig} from './types.js';

type ChatConfigFileContent = {
	chat: User;
	config: Userconfig;
};

export type ContextProperty = {
	readonly all: (
		filter?: (o: ChatConfigFileContent) => boolean,
	) => Promise<readonly ChatConfigFileContent[]>;
	readonly allIds: () => Promise<number[]>;
	readonly broadcast: (
		text: string,
		extra: OtherSendMessage,
		filter?: (o: ChatConfigFileContent) => boolean,
	) => Promise<void>;
	readonly forwardBroadcast: (
		originChat: string | number,
		messageId: number,
		filter?: (o: ChatConfigFileContent) => boolean,
	) => Promise<void>;
	readonly load: (id: number) => Promise<ChatConfigFileContent | undefined>;
	readonly loadConfig: (id: number) => Promise<Userconfig>;

	// Data deletion will delete this property but thats only there and only in that place
	readonly mine: Userconfig;
};

export class Chatconfig {
	constructor(
		public readonly folder: string,
	) {
		// Creating the folder is not needed. It should already be there
	}

	middleware(): MiddlewareFn<MyContext> {
		return async (ctx, next) => {
			if (!ctx.from) {
				console.warn(new Date(), 'Chatconfig', 'ctx.from empty', ctx.update);
				return next();
			}

			const wholeconfig = await this.load(ctx.from.id);
			const configOfUser = this.configFromWholeConfig(wholeconfig);

			const contextProperty: ContextProperty = {
				all: async (filter?: (o: ChatConfigFileContent) => boolean) =>
					this.all(filter),
				allIds: async () => this.allIds(),
				broadcast: async (
					text: string,
					extra: OtherSendMessage,
					filter?: (o: ChatConfigFileContent) => boolean,
				) => this.broadcast(ctx.api, text, extra, filter),
				forwardBroadcast: async (
					originChat: string | number,
					messageId: number,
					filter?: (o: ChatConfigFileContent) => boolean,
				) => this.forwardBroadcast(ctx.api, originChat, messageId, filter),
				load: async (id: number) => this.load(id),
				loadConfig: async (id: number) => this.loadConfig(id),
				mine: configOfUser,
			};

			// @ts-expect-error write to readonly
			ctx.userconfig = contextProperty;

			const before = stringify(ctx.userconfig.mine);
			await next();
			if (!ctx.userconfig.mine) {
				console.log(new Date(), 'request to delete data', ctx.from);
				// Request to remove the userconfig
				return this.removeConfig(ctx.from.id);
			}

			const after = stringify(ctx.userconfig.mine);
			const userString = stringify(wholeconfig?.chat);
			const currentUserString = stringify(ctx.from);

			if (before !== after || userString !== currentUserString) {
				await this.saveConfig(ctx.from, ctx.userconfig.mine);
			}
		};
	}

	async load(id: number): Promise<ChatConfigFileContent | undefined> {
		try {
			const content = await readFile(
				this.filenameFromId(id),
				'utf8',
			);
			return JSON.parse(content) as ChatConfigFileContent;
		} catch {
			return undefined;
		}
	}

	async loadConfig(id: number): Promise<Userconfig> {
		const content = await this.load(id);
		return this.configFromWholeConfig(content);
	}

	async saveConfig(from: User, config: Userconfig): Promise<void> {
		const json: ChatConfigFileContent = {
			chat: from,
			config,
		};

		await writeFile(
			this.filenameFromId(from.id),
			stringify(json, {space: 2}) + '\n',
			'utf8',
		);
	}

	async removeConfig(id: number): Promise<void> {
		await unlink(this.filenameFromId(id));
	}

	async allIds(): Promise<number[]> {
		const files = await readdir(this.folder);
		const ids = files
			.map(s => s.replace('.json', ''))
			.map(Number);
		return ids;
	}

	async all(
		filter: (o: ChatConfigFileContent) => boolean = () => true,
	): Promise<readonly ChatConfigFileContent[]> {
		const ids = await this.allIds();

		const fileContents = await Promise.all(
			ids.map(async id => readFile(this.filenameFromId(id), 'utf8')),
		);

		const configs = fileContents
			.map(o => JSON.parse(o) as ChatConfigFileContent)
			.filter(o => filter(o));

		return configs;
	}

	async broadcast(
		telegram: Api,
		text: string,
		extra: OtherSendMessage,
		filter: (o: ChatConfigFileContent) => boolean = () => true,
	): Promise<void> {
		const allConfigs = await this.all(filter);
		const allIds = allConfigs.map(config => config.chat.id);
		const failedIds = await telegramBroadcast.broadcast(
			telegram,
			allIds,
			text,
			extra,
		);
		await sequentialLoop(failedIds, async id => this.removeConfig(id));
	}

	async forwardBroadcast(
		telegram: Api,
		originChat: string | number,
		messageId: number,
		filter: (o: ChatConfigFileContent) => boolean = () => true,
	): Promise<void> {
		const allConfigs = await this.all(filter);
		const allIds = allConfigs.map(config => config.chat.id);
		const failedIds = await telegramBroadcast.forwardBroadcast(
			telegram,
			allIds,
			originChat,
			messageId,
		);
		await sequentialLoop(failedIds, async id => this.removeConfig(id));
	}

	private filenameFromId(id: number): string {
		return `${this.folder}/${id}.json`;
	}

	private configFromWholeConfig(
		content: ChatConfigFileContent | undefined,
	): Userconfig {
		const config: Userconfig = content?.config ?? {
			calendarfileSuffix: '',
			changes: [],
			events: {},
			mensa: {},
		};
		return {...config};
	}
}
