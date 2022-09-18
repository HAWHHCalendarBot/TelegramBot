changes-help =
  Wenn sich eine Änderung an einer Veranstaltung ergibt, die nicht in den offiziellen Veranstaltungsplan eingetragen wird, kannst du diese hier nachtragen. Dein Kalender wird dann automatisch aktualisiert und du hast die Änderung in deinem Kalender.
  Außerdem lassen sich die Änderungen teilen, sodass du auch anderen Leuten diese Änderung bereitstellen kannst.

  ⚠️ Du bist in der Lage, unlogische Veranstaltungstermine zu kreieren. Beispielsweise kannst du einen Termin so verändern, dass er aufhört bevor er beginnt. Den Bot interessiert das nicht, der tut genau das, was du ihm sagst. Dein Kalenderprogramm ist damit dann allerdings häufig nicht so glücklich…

website-stalker-help =
  Der website-stalker prüft regelmäßig auf Änderungen an relevanten Webseiten.

  Hier wird beispielsweise StISys auf Änderungen betrachtet und wenn sich etwas ändert, kannst du direkt benachrichtigt werden. Folge dazu dem Telegram Kanal @HAWHHWebsiteStalker.

  Alternativ kannst du die Änderungen auch als RSS Feed mit deinem Feed Reader abonnieren. Abonniere dazu folgende URL: https://github.com/HAWHHCalendarBot/study-website-stalker/commits/main.atom


subscribe-overview =
  <b>Kalender abonnieren</b>
  Bitte wähle die Art aus, mit der du den Kalender abonnieren willst.

  Ich empfehle über iOS / macOS Boardmittel oder über den HAW-Mailer.

subscribe-apple =
  <b>Kalender abonnieren mit iOS / macOS</b>
  Auf den ersten Button klicken und die URL in Safari öffnen. Auf der nun geöffneten Website auf das Kalender Icon klicken und bestätigen. Done.

  Unter <b>macOS</b> den Haken bei Remove Alerts raus nehmen, damit die Erinnerungen im Kalender bleiben und nicht entfernt werden.
  Unter <b>iOS</b> ist dies bereits der Standard und funktioniert direkt.

subscribe-exchange =
  <b>Kalender abonnieren mit dem HAW-Mailer</b>
  Im <a href="https://www.haw-hamburg.de/online-services/haw-mailer.html">HAW-Mailer</a> oben links auf die Kalender Ansicht wechseln. Dann in der Menüleiste oben mittig auf das Drop Down Menu von "Kalender hinzufügen" auf "Aus dem Internet". Im aufgehenden Fenster in das Textfeld "Link zum Kalender" die folgende URL einfügen:
  <code>https://{$url}</code>

  Der Kalender wird nun alle paar Stunden vom HAW-Mailer aktualisiert. Wenn du dein Handy mit dem HAW-Mailer (Exchange) synchronisierst, ist der Kalender nun ebenfalls enthalten. Funktioniert mit iOS, Android und Gnome Online Accounts sehr entspannt und du hast gleich deine HAW E-Mails mit dabei.

  Erinnerungen scheinen nicht zu funktionieren, da diese automatisch beim Abonnieren entfernt werden. Ein Deaktivieren des automatischen Löschens dieser habe ich leider bisher nicht gefunden. Hinweise gern an @EdJoPaTo ;)

subscribe-google =
  <b>Kalender abonnieren mit dem Google Kalender</b>
  ⚠️ Der Google Kalender ist manchmal etwas… anstrengend. Erklärung unten.
  🔅 Alternativvorschlag: Kannst du vielleicht auch über den HAW-Mailer synchronisieren? Dann hast du auch gleich deine HAW E-Mails ;)

  In der linken Seitenleiste im <a href="https://calendar.google.com/">Google Kalender</a> gibt es den Eintrag "Weitere Kalender". Dort auf das kleine Dropdown Dreieck klicken und den Menüpunkt "per URL" auswählen. Hier muss die folgende URL hinein kopiert werden:
  <code>https://{$url}</code>

  Nach dem Bestätigen einen Moment warten, bis der Kalender im Google Kalender erschienen ist.

  Wenn dein Kalender nun "@HAWHHCalendarBot ({$firstname})" heißt, wie er eigentlich heißen soll, bist du ein glücklicher Sonderfall Googles und du bist fertig. Wenn dein Kalender jedoch den Namen der URL trägt, muss der Kalender umbenannt werden, damit er auf Android Geräte synchronisiert wird. (Google 🙄) Verwende einen einfachen Namen dafür, den Google nicht überfordernd findet.

  Fun Fact: Auf iOS Geräte wird der Google Kalender immer fehlerfrei synchronisiert, egal wie er heißt.

  Erinnerungen scheinen nicht zu funktionieren, da diese automatisch beim Abonnieren entfernt werden. Ein Deaktivieren des automatischen Löschens dieser habe ich leider bisher nicht gefunden. Hinweise gern an @EdJoPaTo ;)

  ⚠️ In der Vergangenheit hat der Google Kalender jeweils zwischen 30 Minuten und 40 Stunden gebraucht, um einen Kalender zu aktualisieren. Außerdem cacht Google (meiner Meinung nach) ein wenig zu viel, was für teilweise interessantes/sonderbares Verhalten gesorgt hat.

subscribe-freestyle =
  <b>Kalender abonnieren Freestyle Edition</b> 😎
  Wenn dein Kalender Standards unterstützt, benutz den ersten Button an dieser Nachricht und öffne die Website.
  Klicke auf das Kalender Icon. Der Browser fragt dich nun, mit welchem Tool er den webcal:// Link öffnen soll. Wähle dein Kalenderprogramm.

  Wenn das nicht funktioniert, finde einen Weg die folgende URL zu abonnieren. Achte dabei darauf, das du nicht importierst, sondern abonnierst. Nur dann aktualisiert sich der Kalender selbstständig bei Änderungen im Bot.
  <code>https://{$url}</code>

  Viel Erfolg 😎

subscribe-suffix =
  Die Kalender liegen für jeden frei zugänglich im Internet. Wenn die URL nur aus deiner Telegram Nutzer ID (<code>{$userId}</code>) bestehen würde, könnte jeder mit dieser ID deinen Kalender einsehen.
  Wird der URL eine zufällige Zeichenkette angefügt (aktuell <code>{$calendarfileSuffix}</code>), muss diese erraten werden und erhöht so deine Privatsphäre. Eine Zeichenkette, die deiner Kalender URL angefügt wird, kannst du entweder generieren lassen (<i>Generieren…</i>) oder <i>Manuell setzen…</i>. Jedoch musst du nach jedem Ändern dieser Einstellung deinen Kalender neu abonnieren, da sich die URL ändert.

  Deine Nutzer ID (<code>{$userId}</code>) ist nicht deine Telefonnummer oder Teil deines Usernamens und innerhalb von Telegram eindeutig. Wenn man eine Nachricht von dir hat oder in einer Gruppe mit dir ist, kann man deine Nutzer ID erhalten.

  Deine URL lautet:
  <code>https://{$url}</code>
