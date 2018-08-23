const {Markup} = require('telegraf')

const {
  generateCallbackButtons
} = require('./telegrafHelper')

module.exports = {
  formatDateToHumanReadable: formatDateToHumanReadable,
  generateDateTimePickerButtons: generateDateTimePickerButtons,
  generateMonthButtons: generateMonthButtons,
  generateSpartaDayButtons: generateSpartaDayButtons,
  generateSpartaYearButtons: generateSpartaYearButtons,
  generateTimeSectionButtons: generateTimeSectionButtons,
  parseDateTimeToDate: parseDateTimeToDate
}

function formatDateToHumanReadable(isoDateString) {
  const match = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(isoDateString)
  return `${Number(match[3])}.${match[2]}.${match[1]} ${Number(match[4])}:${match[5]}`
}

function generateDateTimePickerButtons(callbackDataPrefix, year, month, date, starttime, endtime) {
  return [
    [
      Markup.callbackButton(`${date || 'Tag'}`, callbackDataPrefix + ':date'),
      Markup.callbackButton(`${month || 'Monat'}`, callbackDataPrefix + ':month'),
      Markup.callbackButton(`${year || 'Jahr'}`, callbackDataPrefix + ':year')
    ], [
      Markup.callbackButton(`🕗 ${starttime || 'Startzeit'}`, callbackDataPrefix + ':starttime'),
      Markup.callbackButton(`🕓 ${endtime || 'Endzeit'}`, callbackDataPrefix + ':endtime')
    ]
  ]
}

function generateMonthButtons(callbackDataPrefix) {
  const names = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  const result = []
  let current = []

  for (let i = 0; i < 12; i++) {
    current.push(Markup.callbackButton(`${names[i]}`, `${callbackDataPrefix}:${i + 1}`))

    if (i % 3 === 2) {
      result.push(current)
      current = []
    }
  }

  return result
}

function generateSpartaDayButtons(callbackDataPrefix) {
  return [
    generateCallbackButtons(callbackDataPrefix, [1, 2, 3, 4, 5, 6, 7]),
    generateCallbackButtons(callbackDataPrefix, [8, 9, 10, 11, 12, 13, 14]),
    generateCallbackButtons(callbackDataPrefix, [15, 16, 17, 18, 19, 20, 21]),
    generateCallbackButtons(callbackDataPrefix, [22, 23, 24, 25, 26, 27, 28]),
    generateCallbackButtons(callbackDataPrefix, [29, 30, 31])
  ]
}

function generateSpartaYearButtons(callbackDataPrefix) {
  const currentYear = new Date(Date.now()).getFullYear()
  return [
    generateCallbackButtons(callbackDataPrefix, [currentYear - 1, currentYear, currentYear + 1])
  ]
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
