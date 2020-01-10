const {exec} = require('child_process')
const {promisify} = require('util')
const {existsSync} = require('fs')

const run = promisify(exec)

async function pull() {
  try {
    if (existsSync('mensa-data/.git')) {
      await gitCommand('pull')
    } else {
      await run('git clone -q --depth 1 https://github.com/HAWHHCalendarBot/mensa-data.git mensa-data')
    }
  } catch (_) {}
}

async function gitCommand(command) {
  return run(`git -C mensa-data ${command}`)
}

module.exports = {
  pull
}
