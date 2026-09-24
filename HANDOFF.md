# Handoff

Was zuletzt passiert ist und warum. Neueste Einträge oben.

Die Git-History sagt, *was* geändert wurde. Hier steht, was gemessen,
verworfen oder bewusst liegen gelassen wurde — das geht sonst verloren und
wird ein zweites Mal erarbeitet.

**Jede Aussage hier gilt als veraltet, bis sie gegen das Repo geprüft ist.**
Erst `git fetch origin && git status -sb`, dann lesen.

---

## 2026-09-24 — Setup-Screen von Trivial Pursuit

**Gemacht:** Die zwei Regel-Haken stehen jetzt in einer eigenen Tafel, darüber
eine Vorschau der sechs Kategorien mit Farbe und Fragenzahl.

**Warum:** Vorher waren es drei einzeln zentrierte `.team-toggle`-Zeilen. Jede
war anders breit, also saß jedes Kästchen woanders — das Auge findet darin
keine Kante. Die Tafel gibt eine feste linke Kante, die Erklärung hängt am Text
statt in der Zeile zu stehen. Die Kategorien liegen in einem Raster aus drei
gleich breiten Spalten, nicht im freien Umbruch: sonst endet jede Zeile
woanders, weil die Namen verschieden lang sind.

Die Vorschau ist nicht Schmuck. Eine Kategorie ohne Frage fällt sonst erst auf,
wenn das Rad im Spiel darauf stehen bleibt — sie wird jetzt rot ausgewiesen,
vor dem Start.

**Geprüft:** `node check.js --types` ohne Befund. Im Browser: sechs Chips,
gleiche Breite (191 px), drei Spaltenpositionen; beide Kästchen auf derselben
x-Position (208,1 px) — vorher drei verschiedene. Bei 400 px Fensterbreite eine
Spalte, kein Querüberlauf (`scrollWidth` 400 = `innerWidth`).

---

## 2026-09-24 — Trivial Pursuit, Schätzfragen mit Text (`36cdbc5`)

### Gemacht

- **Achtes Spiel: Trivial Pursuit.** Neu `js/tp.js` (564 Zeilen), Setup-,
  Editor- und Spielscreen in `index.html`, Stilblock am Ende von `styles.css`,
  Menükarte mit eigenem Torten-Icon in `logoIconMarkup()`.
- **Schätzfragen können Textantworten sein.** Neuer Haken „🔤 Buchstaben" im
  Jeopardy-Editor, sichtbar nur wenn „📊 Schätzfrage" an ist.

Angefasst außerdem: `js/core.js` (showScreen-Haken, Logo, `currentTeamLabel`,
Icon), `js/buzzer.js` (`LOBBY_SETUP`), `js/jeopardy.js`, `js/jeopardy-ui.js`,
`buzzer/index.html`.

### Warum so

**Kein Spielbrett mit Laufweg.** Das Brett ist im Original nur der
Zufallsgenerator aus Würfel und Feldern. Auf einem Beamer wäre es totes Bild.
Das Glücksrad macht dasselbe in drei Sekunden und ist dabei eine Show. Die
Regeln bleiben unverändert: richtig = weiter, Stück nur einmal je Kategorie,
alle sechs = Finale.

**Sechs Kategorien fest verdrahtet, Namen frei.** Bei fünf oder sieben stimmt
die Torte nicht mehr, und daran hängt das ganze Spiel. Der Import lehnt Dateien
mit anderer Kategorienzahl deshalb ab — sonst fällt das erst mitten in der Show
auf.

**Kein eigener Firebase-Kanal.** Die Handys spielen nur beim Nachfassen mit.
Dafür reicht der bestehende `feudBuzzer`-Kanal; TP setzt `activeBuzzerContext`
auf `'tp'` und ist in `LOBBY_SETUP` registriert.

**Verworfen:** ein GM-Panel für TP. `updateGamemaster()` hat für Feud, WWM,
WWDS, Jeopardy, Finale, Turnier und Result je einen Zweig — „Der Preis ist
heiß" hat bewusst keinen und rendert seine Bedienung auf dem Board. TP macht
es genauso. Wer das später anders will, findet den Einstieg in
`js/feud.js:1031`.

**Textflag im selben Schreibvorgang.** `jeopardyEstimateOpen()` schickt `text`
zusammen mit Frage und Runde. Als zweiter Schreibvorgang stünde auf langsamen
Verbindungen kurz der Ziffernblock offen — und wer dann schon tippt, kommt an
keinen Buchstaben.

**Zahlen bleiben Standard.** Für „wie viele Einwohner hat X" ist der
Ziffernblock schneller. Der Haken schaltet um, er ersetzt nichts.

### Geprüft

`node check.js --types`: 12 Dateien typgeprüft ohne Meldung, 336
Handler-Aufrufe gegen 631 globale Namen, 242 feste Element-IDs, `styles.css`
815 Klammernpaare. Ohne Befund.

Komplette Show im Browser durchgespielt (lokaler Server, `.claude/launch.json`,
Port 3000). **Firebase vorher abgeklemmt**, jeder Schreibversuch nur gezählt:
22 Stück, darunter zweimal `joinLocked` — die wären sonst in die
Live-Datenbank gegangen.

- Jeopardy: Intro durchgeklickt, Board mit 25 Feldern, richtig +100, falsch
  −150, Schätzfrage sendet `text:true` bzw. `text:false`, Buzzer bleibt bei
  Schätzfragen aus.
- Handy: `inputmode` wechselt zwischen `text` und `decimal`, Platzhalter
  wechselt mit. `parseEstimate` unverändert: „Laika" → `null`, „390.000" →
  `390000`, „12,5" → `12.5`.
- TP: drei Teams. Nach der Drehung steht der Zeiger auf genau der gezogenen
  Kategorie — nicht nach Augenmaß, sondern Winkel modulo 360 gegen die
  Segmentmitte gerechnet; Zeigermitte 0,2 px neben der Radmitte. Richtig gibt
  ein Stück und den nächsten Wurf, falsch öffnet das Nachfassen mit Knöpfen für
  die anderen beiden Teams, der Nachfasser bekommt Stück und Zug. Endspiel:
  sechstes Stück, Schlussfrage verhauen, zwei Züge später wieder Finalist,
  gewonnen.
- Keine Konsolenfehler auf einem frischen Laden.

### Offen

- **Nie gegen echte Handys und echtes Firebase getestet.** Der
  Tastaturwechsel greift erst dort richtig — ein Desktop-Browser ignoriert
  `inputmode` ohnehin. Beim nächsten Livespiel prüfen.
- **TP hat kein GM-Panel** (siehe oben). Auf dem Board bedienbar, im
  GM-Fenster nicht.
- **TP-Fragen sind Beispielfragen.** Vier je Kategorie, als Platzhalter
  gedacht. Sind alle 24 durch, gibt TP die Kategorien wieder frei und
  wiederholt, statt abzubrechen.
- Alles gepusht, Arbeitsbaum sauber.

### Fallstricke

- **Die Dateien im Arbeitsbaum haben CRLF.** Ein `perl -0pi -e` mit `\n` im
  Suchmuster trifft nichts. Ein `grep -q $'\r'` hat das an einem Tag *falsch*
  als LF gemeldet — verlässlich ist nur ein Hexdump der Zeile.
- **`$` direkt vor dem Regex-Trenner.** `s/…text$/…/` liest Perl als Variable
  `$/`, nicht als Zeilenende. Die Ersetzung tut dann wortlos nichts. Entweder
  `sed` mit Zeilennummer nehmen oder das `$` vermeiden.
- **Sehr lange Heredocs scheitern am Shell-Parser.** Ab einigen Kilobyte kam
  „unexpected EOF". Fragment als Datei schreiben und per Skript einspleißen.
- **Die Hostseite hat ein Passwort-Gate** (`js/jeopardy-ui.js:212`). Es legt
  sich als Overlay über die Seite; eingespeistes JavaScript läuft darunter
  trotzdem, Screenshots zeigen aber nur das Gate. Zum Testen das Element
  entfernen, nicht den Merker in `localStorage` setzen — sonst bleibt der
  Testzustand.

---

## 2026-09-24 — Bewegung und Optik (`cd649c1`)

### Gemacht

Der Durchgang `4a8ad6b` hatte die Hostseite poliert, den Handy-Client aber
nicht angefasst: 673 Zeilen mit einer einzigen Animation und zwei Übergängen.
Nachgezogen in `buzzer/index.html` und `gamepad/index.html`, dazu eine
Reparatur in `styles.css`.

### Warum so

**Ein echter Fehler:** die Publikumsjoker-Balken bei WWM und WWDS hatten
`transition:height`, das nie lief. Die Balken werden bei jedem Render per
`innerHTML` neu erzeugt und bekommen ihre Höhe inline — ein Übergang braucht
aber einen Wertwechsel an einem bestehenden Element. Gefunden mit einem Skript,
das alle Klassen mit `transition:` gegen die JS-Templates prüft: von 26
Kandidaten waren genau diese zwei betroffen, weil nur bei ihnen die animierte
Eigenschaft auch inline gesetzt wird.

**Versatz über Laufzeiten, nicht über `animation-delay`.** Mit Verzögerung
bräuchte es `fill-mode: backwards`, und dann kann im gedrosselten
Popout-Fenster ein Balken auf Höhe 0 stehenbleiben. Dieselbe Überlegung steht
schon im Commit `4a8ad6b`.

**Der Bereitschaftsring des Buzzers sitzt auf einem `::after`.** Eine laufende
Animation gewinnt gegen die `box-shadow` aus `:active` — das Druckgefühl wäre
sonst genau dann weg, wenn es zählt.

**Unter `prefers-reduced-motion` bleibt der Ring sichtbar** und steht nur
still. Die Information darf nicht mit der Bewegung verschwinden.

### Geprüft

Tokens lösen auf, alle neun Keyframes vorhanden, der Balken misst direkt nach
dem Einhängen 0 und wächst auf die Zielhöhe, kein Querüberlauf bei 375 px,
keine Konsolenfehler auf drei Seiten. `node --check` über alle js-Dateien
sauber. Während des Tests wurde nichts an Firebase geschrieben — es wurde sich
nicht angemeldet, und ohne Anmeldung schreibt der Client keine Presence.

---

## Davor

`a031908` bis `cf5147c` (16.–19.09., von anderen Geräten): Prüfer `check.js`,
Typprüfung per `jsconfig.json` mit `checkJs: true`, `types/globals.d.ts`, die
DOM-Helfer `showEl`/`setText`/`setHtml`/`setClass`, Design-Tokens in
`styles.css` und zwei Escaping-Korrekturen. Die Begründungen stehen
ausführlich in den jeweiligen Commit-Nachrichten — dort nachlesen, hier nicht
doppeln.
