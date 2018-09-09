const TelegrafInlineMenu = require('telegraf-inline-menu')

const addMenu = require('./events-add')

const menu = new TelegrafInlineMenu('e', 'Hier hast du einen Überblick über deine Veranstaltungen')

menu.submenu('Hinzufügen…', addMenu.menu)

module.exports = {
  menu
}
