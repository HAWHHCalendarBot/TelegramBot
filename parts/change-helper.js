const fs = require('fs')
const util = require('util')

const readFile = util.promisify(fs.readFile)

const {
  formatDateToHumanReadable,
  parseDateTimeToDate
} = require('../lib/calendar-helper')

module.exports = {
  generateChangeDescription,
  generateChangeText,
  generateChangeTextHeader,
  generateShortChangeText,
  loadEvents
}

function generateChangeDescription(change) {
  let text = ''
  if (change.remove) {
    text += '🚫 Entfällt\n'
  }
  if (change.starttime) {
    text += `🕗 Startzeit: ${change.starttime}\n`
  }
  if (change.endtime) {
    text += `🕓 Endzeit: ${change.endtime}\n`
  }
  if (change.room) {
    text += `📍 Raum: ${change.room}\n`
  }

  return text
}

function generateChangeText(change) {
  let text = generateChangeTextHeader(change)

  if (Object.keys(change).length > 2) {
    text += '\nÄnderungen:\n'
    text += generateChangeDescription(change)
  }

  return text
}

function generateChangeTextHeader(change) {
  let text = '*Veranstaltungsänderung*\n'
  text += `*${change.name}*`
  if (change.date) {
    text += ` ${formatDateToHumanReadable(change.date)}`
  }
  text += '\n'
  return text
}

function generateShortChangeText(change) {
  return `${change.name} ${formatDateToHumanReadable(change.date)}`
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
