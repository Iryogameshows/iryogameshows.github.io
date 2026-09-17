# Iryo Gameshows

## ZUERST: Repo-Stand prüfen — nicht verhandelbar

**Vor jeder Aussage über die Struktur und vor der ersten Änderung:**

```bash
git fetch origin && git status -sb && git log --oneline -3 origin/master
```

Bei `behind`: `git merge --ff-only origin/master`.

An diesem Repo arbeiten mehrere parallele Sessions und **drei** GitHub-Accounts:
`Iryogameshows`, `IryoRun` und `iryoof`. In der Commit-History tauchen sie unter den
Namen `Iryo`, `iryoof` und `Iryogameshows` auf. Der lokale Stand ist deshalb regelmäßig
veraltet, oft um mehrere Commits.

### Warum das hier so scharf formuliert ist

Am 2026-09-16 hat David gefragt, wie die Repo-Struktur aussieht. Die Antwort kam aus
einer Konversations-Zusammenfassung statt aus dem Repo: beschrieben wurde ein
8673-Zeilen-Monolith `index.html`. Tatsächlich war origin/master zu dem Zeitpunkt
5 Commits weiter, die Datei längst in `styles.css` + 11 `js/`-Module aufgeteilt, und
eine ganze Show (`pih.js`) existierte, von der in der Antwort kein Wort stand.
Obendrauf kam der Vorschlag, eine Aufteilung zu bauen, die es längst gab.

**Das ist nicht bloß peinlich, das ist gefährlich.** Auf so eine Falschauskunft hin
werden Entscheidungen getroffen. Im schlimmsten Fall wird auf einem veralteten Stand
editiert und committet — und damit fremde Arbeit überschrieben.

### Verbindliche Regeln

- **Niemals** aus dem Gedächtnis, aus einer Zusammenfassung oder aus einem früheren
  Tool-Ergebnis über Dateien, Struktur oder Inhalte reden. Immer frisch nachsehen.
- Nach einer Kontext-Kompaktierung gilt **jede** Datei-Information als veraltet.
  Zusammenfassungen beschreiben die Vergangenheit, nicht den aktuellen Stand.
- `git ls-files` allein zeigt nur den **lokalen** Stand. Ohne vorheriges `git fetch`
  ist das Ergebnis wertlos für eine Struktur-Aussage.
- Vor dem ersten Edit in einer Datei: die Datei lesen. Nicht auf eine frühere Version
  im Kontext verlassen.
- Bevor etwas als "fehlt" oder "sollte man bauen" bezeichnet wird: nachsehen, ob es
  schon existiert.
- Im Zweifel nachsehen statt schätzen. Ein zusätzlicher Befehl kostet Sekunden,
  eine Falschauskunft kostet Davids Zeit und Vertrauen.

## Struktur

Statische Seite, **kein Build-Step**. GitHub Pages served die Dateien direkt.

```
index.html      Markup: alle Screens + die <script>-Tags am Ende
styles.css      gesamtes CSS
js/
  core.js       Logo-Rendering, showScreen(), Gemeinsames  ← lädt zuerst
  feud.js       Family Feud
  jeopardy.js   Jeopardy-Logik
  jeopardy-ui.js Jeopardy-Board/Overlays
  wwm.js        Wer wird Millionär
  wwds.js       Wer weiß denn sowas
  ddf.js        Der Dümmste fliegt
  pih.js        Der Preis ist heiß
  tournament.js Turnier-Modus
  buzzer.js     Firebase-Buzzer, GM-Remote
  roster.js     Teilnehmer-Auswahl (DDF, Preis ist heiß)
buzzer/index.html   Handy-Buzzer
gamepad/index.html  Handy-Gamepad
```

Eine Änderung an einem Spiel geht in die jeweilige `js/`-Datei, nicht in `index.html`.

## Scripts

Klassische `<script src>`-Tags, **keine** ES-Module. Alles liegt global, die
Ladereihenfolge in `index.html` zählt: `core.js` muss vor den Spielen kommen.
Kein `import`/`export` einbauen, ohne die Tags auf `type="module"` umzustellen.

## Nach Änderungen — Pflicht

```bash
node check.js
```

Muss ohne Fehler durchlaufen, bevor committet wird. Der Prüfer macht drei Dinge:

1. **Syntax** aller `js/`-Dateien.
2. **Inline-Handler**: ob jeder Funktionsname, der aus einem `onclick=`/`onchange=`
   usw. heraus aufgerufen wird, im JavaScript auch existiert.
3. **styles.css**: ob die geschweiften Klammern aufgehen.

Punkt 2 ist der Grund für das Skript. Die App hängt an rund 320 Inline-Handlern,
etwa 230 davon werden zur Laufzeit als Zeichenkette zusammengebaut:

```js
onclick="resetPlayerPassword('${p.key}', ${escJsArg(p.name)})"
```

Für jedes Werkzeug ist das Text — kein Editor, kein Linter und auch TypeScript
sieht dort einen Funktionsnamen. Wer eine Funktion umbenennt und eine dieser
Zeichenketten übersieht, merkt das erst, wenn während der Show jemand auf den
Knopf drückt. Deshalb **vor jedem Commit** laufen lassen, besonders nach
Umbenennungen.

Ein Handler, dessen Funktionsname selbst eingesetzt wird
(`onclick="opener.${togglerName}(...)"`), ist statisch nicht auflösbar. Solche
Stellen weist der Prüfer als „nicht prüfbar" aus, statt sie zu bemängeln.

## Typprüfung

```bash
node check.js --types
```

Läuft nicht bei jedem Commit mit (ein Durchlauf dauert rund eine halbe Minute
und holt TypeScript beim ersten Mal übers Netz), aber **nach größeren
Änderungen** und bevor etwas Größeres gepusht wird.

Wichtig: das ist **kein Build-Step**. TypeScript liest nur (`noEmit` in
`jsconfig.json`), die `js/`-Dateien bleiben unverändertes JavaScript und
werden weiter direkt ausgeliefert. Es gibt nichts zu kompilieren, `git push`
bleibt der ganze Deploy.

Geprüft wird nur, was am Dateianfang `// @ts-check` trägt. Stand heute sieben
von elf: `roster.js`, `wwm.js`, `ddf.js`, `wwds.js`, `buzzer.js`,
`tournament.js`, `pih.js`.

Offen sind noch `jeopardy-ui.js` (56 Meldungen), `core.js` (31), `feud.js` (29)
und `jeopardy.js` (18). **Wer eine davon sauber bekommt, setzt `// @ts-check`
in Zeile 1 und lässt es dort.** Nie wieder entfernen, um Meldungen
loszuwerden.

Typen stehen als JSDoc-Kommentare am Code, nicht in eigenen Dateien:

```js
/** @param {string} id
 *  @returns {HTMLInputElement|null} */
function fieldEl(id) { ... }
```

Globale Objekte vom CDN (`firebase`, `QRCode`) sind in `types/globals.d.ts`
deklariert.

### Formularfelder

`document.getElementById(id).value` ist in dieser App rund 160-mal zu finden.
TypeScript kann dort nichts sagen (der Rückgabetyp ist `HTMLElement`, nicht
`HTMLInputElement`), und fehlt das Element, wirft der Zugriff. Für neuen Code
stattdessen die Helfer aus `core.js` benutzen:

```js
fieldVal('ddf-lives')          // Inhalt, oder '' wenn es das Feld nicht gibt
fieldChecked('enable-team3')   // Haken gesetzt? Fehlt das Feld: false
fieldSet('tour-game-weight', 2) // schreibt; Rueckgabe sagt, ob es das Feld gab
fieldEl('ddf-bulk-text')       // das Element selbst, oder null
```

## Deploy

Push auf `master` → GitHub Action (`.github/workflows/pages.yml`) → live auf
https://iryogameshows.github.io/

## Antwortformat

**Jeder Absatz beginnt mit einem Backslash `\`.**

Nicht nur der erste. Jeder neue Absatz, durchgehend bis zum Ende der Nachricht.

\ Das ist Davids Kontrollzeichen. Es ist bewusst etwas, das nur aus einer
echten, frisch erzeugten Antwort stammen kann — fehlt es, ist die Antwort
verdächtig. Stünde es nur einmal ganz oben, wäre bloß der Anfang abgesichert;
über alle Absätze verteilt ist die ganze Nachricht abgedeckt.

\ Als Absatz zählt alles, was nach einer Leerzeile neu anfängt. Also auch die
kurze Zwischenzeile zwischen zwei Arbeitsschritten, die Rückfrage, die
Fehlermeldung und der einzelne Satz am Schluss. Genau dort fällt der Backslash
sonst weg, weil die Zeile wie ein Nebensatz wirkt und nicht wie eine Nachricht.

\ Ausgenommen sind nur Bestandteile, die der Backslash zerschießen würde:
Überschriften, Code-Blöcke, Tabellen sowie Aufzählungs- und Listenpunkte.
Dort trägt ihn der Absatz davor oder danach.

## Ton

Deutsch. Keine Füllwörter, keine gespiegelten Umgangswörter ("yalla", "habibi", "bro").

Keine Behauptung ohne Beleg. Was geprüft wurde, wird als geprüft benannt; was
vermutet wird, als Vermutung. Wenn etwas nicht nachgesehen wurde, wird das gesagt,
statt es plausibel klingen zu lassen.
