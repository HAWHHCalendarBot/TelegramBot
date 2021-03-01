import {promises as fsPromises} from 'fs'

import {ExtraReplyMessage} from 'telegraf/typings/telegram-types'
import {Telegram, MiddlewareFn} from 'telegraf'
import {User} from 'typegram'
import * as stringify from 'json-stable-stringify'

import {MyContext, Userconfig} from './types'
import {sequentialLoop} from './async'
import * as telegrafBroadcast from './telegraf-broadcast'

interface ChatConfigFileContent {
	chat: User;
	config: Userconfig;
}

export interface ContextProperty {
	readonly all: (filter?: (o: ChatConfigFileContent) => boolean) => Promise<readonly ChatConfigFileContent[]>;
	readonly allIds: () => Promise<number[]>;
	readonly broadcast: (text: string, extra: ExtraReplyMessage, filter?: (o: ChatConfigFileContent) => boolean) => Promise<void>;
	readonly forwardBroadcast: (originChat: string | number, messageId: number, filter?: (o: ChatConfigFileContent) => boolean) => Promise<void>;
	readonly load: (id: number) => Promise<ChatConfigFileContent | undefined>;
	readonly loadConfig: (id: number) => Promise<Userconfig>;
}

export class Chatconfig {
	constructor(
		public readonly folder: string
	) {
		// Creating the folder is not needed. It should already be there
	}

	middleware(): MiddlewareFn<MyContext> {
		return async (ctx, next) => {
			if (!ctx.from) {
				console.warn(new Date(), 'Chatconfig', 'ctx.from empty, update type:', ctx.updateType, ctx.update)
				return next()
			}

			const wholeconfig: ChatConfigFileContent = (await this.load(ctx.from.id)) ?? {user: {}, userconfig: {}} as any
			ctx.state.userconfig = this.configFromWholeConfig(wholeconfig)

			ctx.userconfig = {
				all: async (filter?: (o: ChatConfigFileContent) => boolean) => this.all(filter),
				allIds: async () => this.allIds(),
				broadcast: async (text: string, extra: ExtraReplyMessage, filter?: (o: ChatConfigFileContent) => boolean) => this.broadcast(ctx.telegram, text, extra, filter),
				forwardBroadcast: async (originChat: string | number, messageId: number, filter?: (o: ChatConfigFileContent) => boolean) => this.forwardBroadcast(ctx.telegram, originChat, messageId, filter),
				load: async (id: number) => this.load(id),
				loadConfig: async (id: number) => this.loadConfig(id)
			}

			const before = stringify(ctx.state.userconfig)
			await next()
			if (!ctx.state.userconfig) {
				console.log(new Date(), 'request to delete data', ctx.from)
				// Request to remove the userconfig
				return this.removeConfig(ctx.from.id)
			}

			const after = stringify(ctx.state.userconfig)
			const userString = stringify(wholeconfig.chat)
			const currentUserString = stringify(ctx.from)

			if (before !== after || userString !== currentUserString) {
				await this.saveConfig(ctx.from, ctx.state.userconfig)
			}
		}
	}

	async load(id: number): Promise<ChatConfigFileContent | undefined> {
		try {
			const content = await fsPromises.readFile(this.filenameFromId(id), 'utf8')
			return JSON.parse(content)
		} catch {
			return undefined
		}
	}

	async loadConfig(id: number): Promise<Userconfig> {
		const content = await this.load(id)
		return this.configFromWholeConfig(content)
	}

	async saveConfig(from: User, config: Userconfig): Promise<void> {
		const json: ChatConfigFileContent = {
			chat: from,
			config
		}

		await fsPromises.writeFile(this.filenameFromId(from.id), stringify(json, {space: 2}) + '\n', 'utf8')
	}

	async removeConfig(id: number): Promise<void> {
		await fsPromises.unlink(this.filenameFromId(id))
	}

	async allIds(): Promise<number[]> {
		const files = await fsPromises.readdir(this.folder)
		const ids = files
			.map(s => s.replace('.json', ''))
			.map(o => Number(o))
		return ids
	}

	async all(filter: (o: ChatConfigFileContent) => boolean = () => true): Promise<readonly ChatConfigFileContent[]> {
		const ids = await this.allIds()

		const fileContents = await Promise.all(ids.map(async id =>
			fsPromises.readFile(this.filenameFromId(id), 'utf8')
		))

		const configs = fileContents
			.map(o => JSON.parse(o) as ChatConfigFileContent)
			.filter(o => filter(o))

		return configs
	}

	async broadcast(telegram: Telegram, text: string, extra: ExtraReplyMessage, filter: (o: ChatConfigFileContent) => boolean = () => true): Promise<void> {
		const allConfigs = await this.all(filter)
		const allIds = allConfigs.map(config => config.chat.id)
		const failedIds = await telegrafBroadcast.broadcast(telegram, allIds, text, extra)
		await sequentialLoop(failedIds, async id => this.removeConfig(id))
	}

	async forwardBroadcast(telegram: Telegram, originChat: string | number, messageId: number, filter: (o: ChatConfigFileContent) => boolean = () => true): Promise<void> {
		const allConfigs = await this.all(filter)
		const allIds = allConfigs.map(config => config.chat.id)
		const failedIds = await telegrafBroadcast.forwardBroadcast(telegram, allIds, originChat, messageId)
		await sequentialLoop(failedIds, async id => this.removeConfig(id))
	}

	private filenameFromId(id: number): string {
		return `${this.folder}/${id}.json`
	}

	private configFromWholeConfig(content: ChatConfigFileContent | undefined): Userconfig {
		const config: Userconfig = content?.config ?? {
			calendarfileSuffix: '',
			changes: [],
			events: [],
			mensa: {}
		}
		return {...config}
	}
}
