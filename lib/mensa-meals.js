const fsPromises = require('fs').promises

async function getCanteenList() {
  const found = await fsPromises.readdir('mensa-data', {withFileTypes: true})
  const dirs = found
    .filter(o => o.isDirectory())
    .map(o => o.name)
    .filter(o => !o.startsWith('.'))
  return dirs
}

function getFilename(mensa, year, month, day) {
  let filename = `mensa-data/${mensa}/`
  filename += year.toLocaleString(undefined, {minimumIntegerDigits: 4, useGrouping: false})
  filename += month.toLocaleString(undefined, {minimumIntegerDigits: 2})
  filename += day.toLocaleString(undefined, {minimumIntegerDigits: 2})
  filename += '.json'
  return filename
}

async function getMealsOfDay(...args) {
  try {
    const filename = getFilename(...args)
    const content = await fsPromises.readFile(filename, 'utf8')
    return JSON.parse(content)
  } catch (_) {
    return []
  }
}

module.exports = {
  getCanteenList,
  getMealsOfDay
}
