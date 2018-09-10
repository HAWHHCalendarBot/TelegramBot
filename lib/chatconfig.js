const fsPromises = require('fs').promises

const stringify = require('json-stable-stringify')

function clone(a) {
  return JSON.parse(stringify(a))
}

class Chatconfig {
  constructor(folder, defaultConfig = {}) {
    // Creating the folder is not needed. It should already be there
    this.folder = folder
    this.defaultConfig = defaultConfig
  }

  middleware() {
    return async (ctx, next) => {
      if (!ctx.from) {
        console.warn(new Date(), 'Chatconfig', 'ctx.from empty, update type:', ctx.updateType, ctx.update)
        return next()
      }

      ctx.state.userconfig = await this.loadConfig(ctx.from.id)

      ctx.userconfig = {
        all: (...args) => this.all(...args),
        allIds: (...args) => this.allIds(...args),
        broadcast: (...args) => this.broadcast(ctx.telegram, ...args),
        forwardBroadcast: (...args) => this.forwardBroadcast(ctx.telegram, ...args),
        loadConfig: (...args) => this.loadConfig(...args)
      }

      const before = stringify(ctx.state.userconfig)
      await next()
      if (!ctx.state.userconfig) {
        console.log(new Date(), 'request to delete data', ctx.from)
        // Request to remove the userconfig
        return this.removeConfig(ctx.from.id)
      }

      const after = stringify(ctx.state.userconfig)

      if (before !== after) {
        await this.saveConfig(ctx.from, ctx.state.userconfig)
      }
    }
  }

  filenameFromId(id) {
    return this.folder + '/' + id + '.json'
  }

  async loadConfig(id) {
    try {
      const content = await fsPromises.readFile(this.filenameFromId(id), 'utf8')
      const {config} = JSON.parse(content)
      return {...clone(this.defaultConfig), ...config}
    } catch (error) {
      return clone(this.defaultConfig)
    }
  }

  async saveConfig(from, config) {
    const json = {
      chat: from,
      config
    }

    await fsPromises.writeFile(this.filenameFromId(from.id), stringify(json, {space: 2}) + '\n', 'utf8')
  }

  async removeConfig(id) {
    await fsPromises.unlink(this.filenameFromId(id))
  }

  async allIds() {
    const files = await fsPromises.readdir(this.folder)
    const ids = files.map(s => s.replace('.json', ''))
    return ids
  }

  async all(filter = () => true) {
    const ids = await this.allIds()

    const fileContents = await Promise.all(ids.map(id =>
      fsPromises.readFile(this.filenameFromId(id), 'utf8')
    ))

    const configs = fileContents
      .map(JSON.parse)
      .filter(filter)

    return configs
  }

  async broadcast(telegram, text, extra, filter = () => true) {
    const allConfigs = await this.all(filter)
    const allIds = allConfigs.map(config => config.chat.id)
    return Promise.all(
      allIds.map(id => telegram.sendMessage(id, text, extra))
    )
  }

  async forwardBroadcast(telegram, originChat, messageId, filter = () => true) {
    const allConfigs = await this.all(filter)
    const allIds = allConfigs.map(config => config.chat.id)
    return Promise.all(
      allIds.map(id => telegram.forwardMessage(id, originChat, messageId))
    )
  }
}

module.exports = Chatconfig
