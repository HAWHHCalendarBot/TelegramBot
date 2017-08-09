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
      ctx.state.userconfig = await this.loadConfig(ctx.chat.id)

      ctx.userconfig = {
        allIds: () => this.allIds(),
        all: (...args) => this.all(...args),
        broadcast: (...args) => this.broadcast(ctx.telegram, ...args),
        remove: () => this.removeConfig(ctx.chat.id),
        save: () => this.saveConfig(ctx.chat, ctx.state.userconfig)
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

  async saveConfig(chat, config) {
    const json = {
      chat: chat,
      config: config
    }

    await writeFile(this.filenameFromId(chat.id), JSON.stringify(json), 'utf8')
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

    for (var i = 0; i < ids.length; i++) {
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
