const fsPromises = require('fs').promises

async function getMealsOfDay(mensa, year, month, day) {
  try {
    let filename = `meals/${mensa}/`
    filename += year.toLocaleString(undefined, {minimumIntegerDigits: 4, useGrouping: false})
    filename += month.toLocaleString(undefined, {minimumIntegerDigits: 2})
    filename += day.toLocaleString(undefined, {minimumIntegerDigits: 2})
    filename += '.json'

    const content = await fsPromises.readFile(filename, 'utf8')
    return JSON.parse(content)
  } catch (error) {
    return []
  }
}

module.exports = {
  getMealsOfDay
}
