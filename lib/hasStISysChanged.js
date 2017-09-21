const fs = require('fs')
const request = require('request-promise-native')
const util = require('util')

// Promisify the fs.writeFile and fs.readFile
const mkdir = util.promisify(fs.mkdir)
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const _stISysFolder = 'tmp'
const _stISysFile = 'StISys.html'

async function getCurrentStISys() {
  const response = await request({
    encoding: 'latin1',
    resolveWithFullResponse: true,
    simple: false,
    uri: 'https://stisys.haw-hamburg.de/'
  })

  if (response.statusCode !== 200) {
    console.log(Date.now(), 'StISys down', response.statusCode, response.statusMessage)
    return
  }

  const match = /;jsessionid=[^"]+/.exec(response.body)
  const tmp = response.body.replace(match[0], '')

  return tmp
}

async function compareToOldStISys(currentStISys) {
  try {
    await mkdir(_stISysFolder, '0755')
  } catch (e) {}

  try {
    const oldStISys = await readFile(_stISysFolder + '/' + _stISysFile, 'utf8')

    if (currentStISys === oldStISys) {
      return false
    } else {
      await writeFile(_stISysFolder + '/' + _stISysFile, currentStISys, 'utf8')
      return true
    }
  } catch (e) {
    await writeFile(_stISysFolder + '/' + _stISysFile, currentStISys, 'utf8')
    return undefined
  }
}

module.exports = async function() {
  const currentStISys = await getCurrentStISys()
  return compareToOldStISys(currentStISys)
}
