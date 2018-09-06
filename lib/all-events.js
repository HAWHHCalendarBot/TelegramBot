const fsPromises = require('fs').promises

let allEvents = []

setInterval(updateEvents, 1000 * 60 * 60)
updateEvents()

async function updateEvents() {
  const data = await fsPromises.readFile('eventfiles/all.txt', 'utf8')
  const list = data.split('\n').filter(element => element !== '')
  console.log(new Date(), list.length, 'Veranstaltungen geladen.')
  allEvents = list
}

function count() {
  return allEvents.length
}

function exists(name) {
  return allEvents.indexOf(name) >= 0
}

function find(pattern, blacklist = []) {
  const regex = new RegExp(pattern, 'i')
  const filtered = allEvents.filter(event => regex.test(event) && !blacklist.some(v => v === event))
  return filtered
}

module.exports = {
  count,
  exists,
  find
}
