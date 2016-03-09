var ChatConfigHandler = require('telegramBotChatConfigHandler');
var BotHandler = require('telegramBotBotHandler');
var request = require('request');
var hasStISysChanged = require('./hasStISysChanged.js');

// Lade Events alle Stunde
var allEvents = [];
var startupPhase = true;
setInterval(updateEvents, 1000 * 60 * 60);
updateEvents();

function updateEvents() {
  request("https://3t0.de/study/events/all.txt", function(error, response, body) {
    var list = body.split("\n").filter(element => element != '');
    console.log(new Date() + " " + list.length + " Events geladen.");
    allEvents = list;

    if (startupPhase) {
      startupPhase = false;
      main();
    }
  });
};

function getFilteredEvents(filter, blacklist) {
  var regex = new RegExp(filter, "i");
  if (!blacklist) blacklist = [];

  var filtered = allEvents.filter(event => regex.test(event) && !blacklist.some(v => v === event));
  if (filtered.length == 0)
    console.log(regex);
  return filtered;
};

function main() {
  var configHandler = new ChatConfigHandler('userconfig', { events: [], settings: {} });
  var bot = new BotHandler("token.txt");
  hasStISysChanged(notifyUsersWhenStISysHasChanged, 15 * 60 * 1000);

  bot.setMainMenuText(function (chat) {
    return "Was möchtest du tun?";
  });

  bot.setMainMenuOptions(function (chat) {
    var config = configHandler.loadConfig(chat);

    var options = {};
    options["📥 Veranstaltung hinzufügen 📥"] = addOption;
    if (config.events.length > 0) {
      options["📤 Veranstaltung entfernen 📤"] = removeOption;
      options["📜 Meine Veranstaltungen auflisten 📜"] = eventListOption;
      options["📲 Kalender Url anfordern 📲"] = calendarUrlOption;
    }
    options["⚒ Einstellungen 🛠"] = settingsOption;
    if (config.admin) {
      options["🙈 Broadcast 🙈"] = adminBroadcastOption;
      options["🙈 Nutzerübersicht 🙈"] = adminUserOverviewOption;
    }

    return options;
  });

  bot.onCommand("start", false, menuCommand);
  bot.onCommand("einstellungen", false, settingsOption);
  bot.onCommand("settings", false, settingsOption);
  bot.onCommand("stop", false, deleteCalendarOption);

  var newSearchString = "🔎 erneut suchen 🔍";
  var cancelString = "⛔️ Abbrechen ⛔️";
  function cancelOption (msg) {
    bot.sendText(msg.chat, "😔");
  }

  function menuCommand (msg) {
    bot.sendText(msg.chat, "Hey " + msg.from.first_name + "!");
  }

  function deleteCalendarOption (msg) {
    configHandler.removeConfig(msg.chat);
    bot.bot.sendMessage(msg.chat, "Dein Kalender wurde zum Löschen vorgemerkt. Das Löschen kann bis zu einer Stunde dauern.\nDu wirst keine Nachrichten mehr vom Bot erhalten.");
  }

  function addOption (msg) {
    var text = "Gebe mir einen Teil des Veranstaltungsnamen und ich suche danach.\n\n";
    text += "Groß- und Kleinschreibung egal, RegExp funktionieren.\n";
    text += "Um zum Menü zurückzukehren benutze /start."

    bot.sendText(msg.chat, text, addOptionFilterReceived);
  }

  function addOptionFilterReceived (msg) {
    try {
      var myEvents = configHandler.loadConfig(msg.chat).events;
      var possibleEvents = getFilteredEvents(msg.text, myEvents);
      if (possibleEvents.length == 0) throw "length == 0";
      var longResult = possibleEvents.length > 100;

      if (longResult) {
        possibleEvents = possibleEvents.slice(0, 100);
      }

      var keyboard = bot.arrayToKeyboard(possibleEvents, 5, true);
      keyboard.unshift([newSearchString]);
      keyboard.push([cancelString]);

      var text = "Ich habe diese Events gefunden. Welches möchtest du hinzufügen?";
      if (longResult)
        text += "\nDie Suche hatte viele Treffer. Die Ergebnisse wurden gekürzt.";

      bot.sendText(msg.chat, text, addOptionSpecificEventName, keyboard);
    } catch (e) {
      console.log(e);
      var text = "Damit konnte ich leider keine Veranstaltungen finden.\n";
      text += "Gebe einen neuen Filter an oder benutze /start um zum Menü zurückzukehren.";
      bot.sendText(msg.chat, text, addOptionFilterReceived);
    }
  }

  function addOptionSpecificEventName (msg) {
    var options = {};
    options[newSearchString] = addOption;
    options[cancelString] = cancelOption;

    try {
      if (msg.text === cancelString) { cancelOption(msg); return; }
      if (msg.text === newSearchString) { addOption(msg); return; }
      if (!allEvents.some(event => event === msg.text)) throw "length == 0";

      var config = configHandler.loadConfig(msg.chat);
      config.events.push(msg.text);
      config.events.sort();
      configHandler.saveConfig(msg.chat, config);

      var text = msg.text + " wurde zu deinen Veranstaltungen hinzugefügt.\n";
      text += "Es kann bis zu einer Stunde dauern bis dein Kalender aktualisiert wurde.";
      bot.sendText(msg.chat, text, options);
    } catch (e) {
      console.log(e);
      bot.sendText(msg.chat, "Das Event, das du hinzufügen willst, existiert nicht!", options);
    }
  }

  function removeOption (msg) {
    var myEvents = configHandler.loadConfig(msg.chat).events;
    if (myEvents.length == 0) {
      bot.sendText(msg.chat, "Du hast aktuell keine Veranstaltungen in deinem Kalender.");
      return;
    }

    var keyboard = bot.arrayToKeyboard(myEvents, 4, true);
    keyboard.push([cancelString]);
    bot.sendText(msg.chat, "Welche Veranstaltung möchtest du aus deinem Kalender entfernen?", removeOptionSpecificEvent, keyboard);
  }

  function removeOptionSpecificEvent (msg) {
    var config = configHandler.loadConfig(msg.chat);
    if (!config.events.some(event => event === msg.text)) {
      bot.sendText(msg.chat, "Du hast die Veranstaltung \"" + msg.text + "\" nicht in deinem Kalender!");
      return;
    }

    config.events = config.events.filter(event => event != msg.text);
    configHandler.saveConfig(msg.chat, config);
    var text = "Die Veranstaltung " + msg.text + " wurde aus deinem Kalender entfernt.\n";
    text += "Es kann bis zu einer Stunde dauern bis dein Kalender aktualisiert wurde.";

    bot.sendText(msg.chat, text);
  }

  function eventListOption (msg) {
    var myEvents = configHandler.loadConfig(msg.chat).events;
    if (myEvents.length == 0) {
      bot.sendText(msg.chat, "Du hast aktuell keine Veranstaltungen in deinem Kalender.");
    } else {
      var text = "Du hast aktuell folgende Veranstaltungen in deinem Kalender:\n" + myEvents.map(v => "- " + v).join('\n');
      bot.sendText(msg.chat, text);
    }
  }

  function calendarURLFromChat (chat) {
    return "3t0.de/study/events/tgBot/" + chat.id + ".ics";
  }

  function iosSubscribeLink (chat) {
    return "https://3t0.de/study/ics.php?url=" + calendarURLFromChat(chat);
  }

  function calendarUrlOption (msg) {
    var fs = require('fs');
    var path = "calendar/" + msg.chat.id + ".ics";

    try {
      fs.accessSync(path);
    } catch (e) {
      var defaultContent = "BEGIN:VCALENDAR\n";
      defaultContent += "VERSION:2.0\n";
      defaultContent += "CALSCALE:GREGORIAN\n";
      defaultContent += "METHOD:PUBLISH\n";
      defaultContent += "X-WR-CALNAME:@HAWHHCalendarBot (" + msg.chat.first_name + ")\n";
      defaultContent += "X-WR-TIMEZONE:Europe/Berlin\n";
      defaultContent += "END:VCALENDAR";
      fs.writeFileSync("calendar/" + msg.chat.id + ".ics", defaultContent, 'utf8');
    }

    var text = "_iOS:_ [Kalender abonnieren](" + iosSubscribeLink(msg.chat) + ")\n";
    text += "_Android:_ [Link](" + calendarURLFromChat(msg.chat) + ") kopieren und im Google Calendar hinzufügen (Add by URL).\n";
    text += "\nAktualisierungen können bis zu eine Stunde brauchen, bis sie im ics Kalender sind.";
    bot.sendText(msg.chat, text);
  }

  function getEnabledIcon (isEnabled) {
    if (isEnabled) {
      return "✅";
    } else {
      return "❎";
    }
  }

  function surroundWithIsEnabledIcon (text, isEnabled) {
    return getEnabledIcon(isEnabled) + " " + text + " " + getEnabledIcon(isEnabled);
  }

  function settingsOption (msg) {
    var config = configHandler.loadConfig(msg.chat);

    var options = {};
    options[surroundWithIsEnabledIcon("StISys Änderungen", config.settings.stisysUpdate)] = toggleStISysUpdate;
    options["⚠️ Einstellungen löschen ⚠️"] = deleteCalendarOption;
    options[cancelString] = cancelOption;

    var text = "Welche Einstellung möchtest du anpassen?";
    bot.sendText(msg.chat, text, options);
  }

  function toggleStISysUpdate (msg) {
    var config = configHandler.loadConfig(msg.chat);
    config.settings.stisysUpdate = !config.settings.stisysUpdate;

    configHandler.saveConfig(msg.chat, config);
    if (config.settings.stisysUpdate) {
      var text = getEnabledIcon(true) + " Ab jetzt wirst du über StISys Ändergungen informiert.";
    } else {
      var text = getEnabledIcon(false) + " Du wirst jetzt nicht mehr über StISys Änderungen informiert.";
    }
    bot.sendText(msg.chat, text);
  }

  function adminUserOverviewOption (msg) {
    var config = configHandler.loadConfig(msg.chat);
    if (!config.admin) return;

    var allFirstNames = configHandler.getAllConfigs().map(o => o.chat.first_name);
    var keyboard = bot.arrayToKeyboard(allFirstNames);
    keyboard.push([cancelString]);

    bot.sendText(msg.chat, "Welchen Nutzer möchtest du betrachten?", adminUserInspectOption, keyboard);
  }

  function adminUserInspectOption (msg) {
    var config = configHandler.loadConfig(msg.chat);
    if (!config.admin) return;

    if (msg.text === cancelString) { cancelOption(msg); return; }

    var user = configHandler.getAllConfigs().filter(v => v.chat.first_name === msg.text)[0];
    var text = "[Kalender](" + iosSubscribeLink(user.chat) + ")\n";
    text += "```\n" + JSON.stringify(user, null, '  ') + "\n```";

    bot.sendText(msg.chat, text);
  }

  function adminBroadcastOption (msg) {
    var config = configHandler.loadConfig(msg.chat);
    if (!config.admin) return;

    bot.sendText(msg.chat, "Was möchtest du allen senden?", adminBroadcastGoForIt);
  }

  function adminBroadcastGoForIt (msg) {
    var config = configHandler.loadConfig(msg.chat);
    if (!config.admin) return;

    broadcastMessageToUsersWithFilter(msg.text, user => true);

    bot.sendText(msg.chat, "Gesendet!");
  }

  function broadcastMessageToUsersWithFilter (text, filter) {
    var users = configHandler.getAllConfigs().filter(filter);

    console.log("broadcast to " + users.map(user => user.chat.first_name));

    for (var i = 0; i < users.length; i++) {
      bot.bot.sendMessage(users[i].chat.id, text, { parse_mode: "Markdown" });
    }
  }

  function notifyUsersWhenStISysHasChanged (hasChanged) {
    console.log(new Date() + " StISys has changed: " + hasChanged);
    if (!hasChanged) return;

    broadcastMessageToUsersWithFilter("Es hat sich eine Änderung auf der [StISys Einstiegsseite](https://stisys.haw-hamburg.de) ergeben.", user => user.config.settings.stisysUpdate);
  }
}
