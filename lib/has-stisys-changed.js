const fsPromises = require('fs').promises
const request = require('request-promise-native')

// Creating the folder is not needed. It should already be there
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
    const oldStISys = await fsPromises.readFile(_stISysFolder + '/' + _stISysFile, 'utf8')

    if (currentStISys === oldStISys) {
      return false
    }
    return true
  } catch (e) {
    return undefined
  } finally {
    await fsPromises.writeFile(_stISysFolder + '/' + _stISysFile, currentStISys, 'utf8')
  }
}

async function hasStISysChanged() {
  const currentStISys = await getCurrentStISys()
  return compareToOldStISys(currentStISys)
}

module.exports = hasStISysChanged
