const fs = require('fs')
const util = require('util')

const readFile = util.promisify(fs.readFile)


function parseDateTimeToDate(dateTime) {
  const unixTime = Number(/(\d+)\+/.exec(dateTime)[1])
  const date = new Date(unixTime)
  return date
}


module.exports = {
  generateChangeDescription: generateChangeDescription,
  generateChangeText: generateChangeText,
  generateChangeTextHeader: generateChangeTextHeader,
  generateShortChangeText: generateShortChangeText,
  loadEvents: loadEvents
}

function generateChangeDescription(change) {
  let text = ''
  if (change.remove) {
    text += '🚫 Entfällt\n'
  }

  return text
}

function generateChangeText(change) {
  let text = generateChangeTextHeader(change)
  text += '\nÄnderungen:\n'
  text += generateChangeDescription(change)

  return text
}

function generateChangeTextHeader(change) {
  let text = '*Veranstaltungsänderung*\n'
  text += `*${change.name}*`
  if (change.date) {
    text += ` ${change.date}`
  }
  text += '\n'
  return text
}

function generateShortChangeText(change) {
  return `${change.name} ${change.date}`
}

async function loadEvents(eventname) {
  const filename = eventname.replace('/', '-')
  const content = await readFile(`eventfiles/${filename}.json`, 'utf8')
  const arr = JSON.parse(content)
  const parsed = arr.map(o => {
    o.StartTime = parseDateTimeToDate(o.StartTime)
    o.EndTime = parseDateTimeToDate(o.EndTime)
    return o
  })
  return parsed
}
