const fs = require('fs')
const util = require('util')

// Promisify the fs.writeFile and fs.readFile
const readdir = util.promisify(fs.readdir)
const readFile = util.promisify(fs.readFile)
const rm = util.promisify(fs.unlink)
const writeFile = util.promisify(fs.writeFile)

function clone(a) {
  return JSON.parse(JSON.stringify(a))
}

class Chatconfig {
  constructor(folder, defaultConfig = {}) {
    this.folder = folder
    this.defaultConfig = defaultConfig

    try {
      fs.mkdirSync(folder, '0755')
    } catch (e) {}
  }

  middleware() {
    return async (ctx, next) => {
      if (!ctx.from) {
        console.warn('ctx.from empty, update type:', ctx.updateType, ctx.update)
        return next()
      }

      ctx.state.userconfig = await this.loadConfig(ctx.from.id)

      ctx.userconfig = {
        all: (...args) => this.all(...args),
        allIds: () => this.allIds(),
        broadcast: (...args) => this.broadcast(ctx.telegram, ...args),
        loadSpecific: id => this.loadConfig(id),
        remove: () => this.removeConfig(ctx.from.id),
        save: () => this.saveConfig(ctx.from, ctx.state.userconfig)
      }

      return next()
    }
  }

  filenameFromId(id) {
    return this.folder + '/' + id + '.json'
  }

  async loadConfig(id) {
    let config
    try {
      const content = await readFile(this.filenameFromId(id), 'utf8')
      config = JSON.parse(content).config
    } catch (err) {
      config = clone(this.defaultConfig)
    }

    return config
  }

  async saveConfig(from, config) {
    const json = {
      chat: from,
      config
    }

    await writeFile(this.filenameFromId(from.id), JSON.stringify(json, null, '  ') + '\n', 'utf8')
  }

  async removeConfig(id) {
    await rm(this.filenameFromId(id))
  }

  async allIds() {
    const files = await readdir(this.folder)
    const ids = files.map(s => s.replace('.json', ''))
    return ids
  }

  async all(filter = () => true) {
    const ids = await this.allIds()
    const configs = []

    for (let i = 0; i < ids.length; i++) {
      const content = await readFile(this.filenameFromId(ids[i]), 'utf8')
      const config = JSON.parse(content)

      const isAcceptedByFilter = filter(config)
      if (isAcceptedByFilter) {
        configs.push(config)
      }
    }

    return configs
  }

  async broadcast(telegram, text, extra, filter = () => true) {
    const allConfigs = await this.all(filter)
    const allIds = allConfigs.map(config => config.chat.id)

    const promiseArr = allIds.map(id => telegram.sendMessage(id, text, extra))
    return Promise.all(promiseArr)
  }
}

module.exports = Chatconfig
