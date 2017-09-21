const fs = require('fs')
const util = require('util')

const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)


function parseDateTimeToDate(dateTime) {
  const unixTime = Number(/(\d+)\+/.exec(dateTime)[1])
  const date = new Date(unixTime)
  return date
}


module.exports = {
  filenameChange: filenameChange,
  generateChangeText: generateChangeText,
  generateShortChangeText: generateShortChangeText,
  loadChange: loadChange,
  loadEvents: loadEvents,
  saveChange: saveChange
}


function filenameChange(from, change) {
  const changeNameFilename = change.name.replace('/', '-')
  const filename = `${changeNameFilename}-${from.id}-${change.date}`
  return filename
}

function generateChangeText(change) {
  let text = `*${change.name}*`
  if (change.date) {
    text += ` ${change.date}`
  }
  text += '\n'

  if (change.remove) {
    text += '🚫 Entfällt\n'
  }

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

async function loadChange(filename) {
  const content = await readFile(`changes/${filename}.json`, 'utf8')
  return JSON.parse(content)
}

async function saveChange(from, change) {
  change.from = from
  const filename = filenameChange(from, change)
  await writeFile(`changes/${filename}.json`, JSON.stringify(change), 'utf8')
  return filename
}
