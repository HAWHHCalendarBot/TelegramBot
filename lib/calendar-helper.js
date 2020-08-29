function getUrl(id, userconfig) {
  let filename = `${id}`
  const {calendarfileSuffix} = userconfig
  if (calendarfileSuffix) {
    filename += `-${calendarfileSuffix}`
  }

  const full = `calendarbot.hawhh.de/tg/${filename}.ics`
  return full
}

function formatDateToHumanReadable(isoDateString) {
  const match = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(isoDateString)
  return `${Number(match[3])}.${match[2]}.${match[1]} ${Number(match[4])}:${match[5]}`
}

function parseDateTimeToDate(dateTime) {
  if (dateTime.includes('(')) {
    const unixTime = Number(/(\d+)\+/.exec(dateTime)[1])
    const date = new Date(unixTime)
    return date
  }

  return new Date(Date.parse(dateTime))
}

module.exports = {
  getUrl,
  formatDateToHumanReadable,
  parseDateTimeToDate
}
