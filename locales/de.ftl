help =
  Dieser Bot hilft dir bei deinem Vorlesungskalender.
  Trage unter /events deine Vorlesungen ein, die du dieses Semester besuchen wirst. Daraus wird ein Kalender für dich generiert, den du mit deinen Geräten abbonieren kannst. Anleitungen für dein Gerät gibts unter /subscribe.

  Unter /mensa gibts die Hamburger Mensen zur Auswahl, mittels /about findest du Statistiken über diesen Bot und unter /privacy kannst du die über dich gespeicherten Daten einsehen.

website-stalker-help =
  Der website-stalker prüft regelmäßig auf Änderungen an relevanten Webseiten.

  Hier wird beispielsweise StISys auf Änderungen betrachtet und wenn sich etwas ändert, kannst du direkt benachrichtigt werden. Folge dazu dem Telegram Kanal @HAWHHWebsiteStalker.

  Alternativ kannst du die Änderungen auch als RSS-Feed mit deinem Feedreader abonnieren. Abonniere dazu folgende URL: https://github.com/HAWHHCalendarBot/study-website-stalker/commits/main.atom

privacy-overview =
  Auf dem Server wird geloggt, wenn Aktionen von Nutzern zu einem neu Bauen von Kalendern oder ungewollten Fehlern führen. Diese Logs werden nicht persistent gespeichert und sind nur bis zum Neustart des Servers verfügbar.
  Der Quellcode dieses Bots ist auf <a href="https://github.com/HAWHHCalendarBot">GitHub</a> verfügbar.

privacy-telegram =
  Jeder Telegram Bot kann diese User Infos abrufen, wenn du mit ihm interagierst. Um dies zu verhindern, blockiere den Bot.

privacy-persistent =
  Damit dein Kalender generiert oder deine Mensa Einstellungen gespeichert werden können, werden einige Daten persistent auf dem Server hinterlegt. Wenn du alle Daten über dich löschen lassen möchtest, wähle "Alles löschen".

privacy-tmp =
  Diese Daten werden nur temporär gehalten und sind nur bis zum Neustart des Servers im RAM hinterlegt.

subscribe-overview =
  <b>Kalender abonnieren</b>
  Bitte wähle die Art aus, mit der du den Kalender abonnieren willst.

  Ich empfehle über iOS / macOS Boardmittel oder über den HAW-Mailer.

subscribe-empty =
  ⚠️ Du hast aktuell keine Veranstaltungen in deinem Kalender! Füge zuerst Veranstaltungen über /events hinzu!

subscribe-apple =
  <b>Kalender abonnieren mit iOS / macOS</b>
  Auf den ersten Button klicken und die URL in Safari öffnen. Auf der nun geöffneten Website auf das Kalender Icon klicken und bestätigen. Fertig.

  Unter <b>macOS</b> den Haken bei <i>Remove Alerts</i> herausnehmen, damit die Erinnerungen im Kalender bleiben und nicht entfernt werden.
  Unter <b>iOS</b> ist dies bereits der Standard und funktioniert direkt.

subscribe-exchange =
  <b>Kalender abonnieren mit Office.com HAW Account</b>
  Im <a href="https://outlook.office.com/calendar">Office.com-Kalender</a> links in der Menüleiste mittig auf "Kalender hinzufügen". Dann im aufgehenden Fenster links mittig auf "Aus dem Internet abbonieren". In das Textfeld "Beispiel: webcal://www.contoso.com/calendar.ics" die folgende URL einfügen:
  <code>https://{$url}</code>

  Der Kalender wird nun alle paar Stunden von Office.com aktualisiert. Wenn du dein Handy mit dem Office.com Account (Exchange) synchronisierst, ist der Kalender ebenfalls enthalten. Funktioniert mit iOS, Android und Gnome Online Accounts sehr entspannt und du hast gleich deine HAW E-Mails mit dabei.

  Erinnerungen scheinen nicht zu funktionieren, da diese automatisch beim Abonnieren entfernt werden. Ein Deaktivieren des automatischen Löschens dieser habe ich leider bisher nicht gefunden. Hinweise gern an @EdJoPaTo 😇

subscribe-google =
  <b>Kalender abonnieren mit dem Google Kalender</b>
  ⚠️ Der Google Kalender ist manchmal etwas… anstrengend. Erklärung unten.
  🔅 Alternativvorschlag: Kannst du vielleicht auch über den HAW-Mailer synchronisieren? Dann hast du auch gleich deine HAW E-Mails.

  In der linken Seitenleiste im <a href="https://calendar.google.com/">Google Kalender</a> gibt es den Eintrag "Weitere Kalender". Dort auf das kleine Dropdown Dreieck klicken und den Menüpunkt "per URL" auswählen. Hier muss die folgende URL hineinkopiert werden:
  <code>https://{$url}</code>

  Nach dem Bestätigen einen Moment warten, bis der Kalender im Google Kalender erschienen ist.

  Wenn dein Kalender "@HAWHHCalendarBot ({$firstname})" heißt, wie er eigentlich heißen soll, bist du ein glücklicher Sonderfall Googles und du bist fertig. Wenn dein Kalender jedoch den Namen der URL trägt, muss der Kalender umbenannt werden, damit dieser auf Android-Geräte synchronisiert wird. Verwende einen einfachen Namen dafür, den Google nicht überfordernd findet.

  Fun Fact: Auf iOS-Geräte wird der Google Kalender unabhängig vom Namen fehlerfrei synchronisiert.

  Erinnerungen scheinen nicht zu funktionieren, da diese automatisch beim Abonnieren entfernt werden. Ein Deaktivieren des automatischen Löschens dieser habe ich leider bisher nicht gefunden. Hinweise gern an @EdJoPaTo 😇

  ⚠️ In der Vergangenheit hat der Google Kalender jeweils zwischen 30 Minuten und 40 Stunden gebraucht, um einen Kalender zu aktualisieren. Außerdem cacht Google (meiner Meinung nach) ein wenig zu viel, was für teilweise interessantes/sonderbares Verhalten gesorgt hat.

subscribe-freestyle =
  <b>Kalender abonnieren Freestyle Edition</b> 😎
  Wenn dein Kalender Standards unterstützt, benutz den ersten Button an dieser Nachricht und öffne die Website.
  Klicke auf das Kalender Icon. Der Browser fragt nun, mit welchem Tool der <code>webcal://</code> Link geöffnet werden soll. Wähle dein Kalenderprogramm.

  Wenn das nicht funktioniert, finde einen Weg die folgende URL zu abonnieren. Achte dabei darauf, das du nicht importierst, sondern abonnierst. Nur dann aktualisiert sich der Kalender selbstständig bei Änderungen im Bot.
  <code>https://{$url}</code>

  Viel Erfolg 😎

subscribe-suffix =
  Die Kalender liegen für jeden frei zugänglich im Internet. Wenn die URL nur aus deiner Telegram Nutzer ID (<code>{$userId}</code>) bestehen würde, könnte jeder mit dieser ID deinen Kalender einsehen.
  Wird der URL eine zufällige Zeichenkette angefügt (aktuell <code>{$calendarfileSuffix}</code>), muss diese erraten werden und erhöht so deine Privatsphäre. Eine Zeichenkette, die deiner Kalender URL angefügt wird, kannst du entweder generieren lassen (<i>Generieren…</i>) oder <i>Manuell setzen…</i>. Jedoch musst du nach jedem Ändern dieser Einstellung deinen Kalender neu abonnieren, da sich die URL ändert.

  Deine Nutzer ID (<code>{$userId}</code>) ist nicht deine Telefonnummer oder Teil deines Usernamens und innerhalb von Telegram eindeutig. Wenn man eine Nachricht von dir hat oder in einer Gruppe mit dir ist, kann man deine Nutzer ID erhalten.

  Deine URL lautet:
  <code>https://{$url}</code>

subscribe-removed-setting =
  <b>Anzeigeart entfernter Termine</b>

  Veranstaltungsänderungen, die du mit diesem Bot anlegst, können Termine entfernen. Diese ausfallenden Termine werden nach dem iCal Standard mit dem Status CANCELLED markiert. Jedoch arbeiten nicht alle Kalendertools standardkonform 🙄.

  Der <b>iOS</b> und <b>macOS</b> Systemkalender halten sich an den Standard. Hier solltest du <i>Standard</i> wählen.
  Veranstaltungen können in den jeweiligen Einstellungen vom Kalendertool ein- oder ausgeblendet werden.
  Der <b>Google</b> Kalender ist nicht in der Lage, entfernte Veranstaltungen einzublenden. Sie werden immer ausgeblendet. Um diese trotzdem anzuzeigen, wähle <i>erzwungen</i> oder bleibe bei <i>Standard</i>.
  Der <b>Exchange</b> Kalender ignoriert den Status und zeigt die Veranstaltung an, als wäre nichts gewesen. Du kannst diese Veranstaltungen <i>komplett entfernen</i> oder <i>erzwingen</i>.

  👌 <i>Standard</i>: Der erzeugte Kalender wird standardkonform sein.
  🗑 <i>komplett entfernen</i>: Der erzeugte Kalender enthält keine entfernten Veranstaltungen mehr. Du kannst nur noch im Bot sehen, welche Veranstaltungen ausfallen.
  🚫 <i>erzwungen</i>: Die Veranstaltung wird auf jeden Fall angezeigt und der Name enthält den 🚫 Emoji.
