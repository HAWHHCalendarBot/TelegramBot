const fsPromises = require('fs').promises

function getFilename(mensa, year, month, day) {
  let filename = `meals/${mensa}/`
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
  } catch (error) {
    return []
  }
}

module.exports = {
  getMealsOfDay
}
