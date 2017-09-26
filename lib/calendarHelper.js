const {
  generateCallbackButtons
} = require('./telegrafHelper')

module.exports = {
  formatDateToHumanReadable: formatDateToHumanReadable,
  generateTimeSectionButtons: generateTimeSectionButtons,
  parseDateTimeToDate: parseDateTimeToDate
}


function formatDateToHumanReadable(isoDateString) {
  const match = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(isoDateString)
  return `${Number(match[3])}.${match[2]}.${match[1]} ${Number(match[4])}:${match[5]}`
}

function generateTimeSectionButtons(callbackDataPrefix) {
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]
  const minutes = ['00', 15, 30, 45]

  const buttons = hours.map(h => {
    const times = minutes.map(m => `${h}:${m}`)
    return generateCallbackButtons(callbackDataPrefix, times)
  })
  return buttons
}

function parseDateTimeToDate(dateTime) {
  const unixTime = Number(/(\d+)\+/.exec(dateTime)[1])
  const date = new Date(unixTime)
  return date
}
