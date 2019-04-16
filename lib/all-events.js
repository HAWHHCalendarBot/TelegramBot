const fsPromises = require('fs').promises

async function getAll() {
  const data = await fsPromises.readFile('eventfiles/all.txt', 'utf8')
  const list = data.split('\n').filter(element => element !== '')
  return list
}

async function count() {
  const allEvents = await getAll()
  return allEvents.length
}

async function exists(name) {
  const allEvents = await getAll()
  return allEvents.includes(name)
}

async function find(pattern, blacklist = []) {
  const allEvents = await getAll()
  const regex = new RegExp(pattern, 'i')
  const filtered = allEvents.filter(event => regex.test(event) && !blacklist.some(v => v === event))
  return filtered
}

module.exports = {
  count,
  exists,
  find
}
