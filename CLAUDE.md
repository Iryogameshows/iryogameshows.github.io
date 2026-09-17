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

## Nach Änderungen

```bash
node --check js/*.js
```

## Deploy

Push auf `master` → GitHub Action (`.github/workflows/pages.yml`) → live auf
https://iryogameshows.github.io/

## Antwortformat

**Jede Nachricht an David beginnt mit einem Backslash `\`.**

Das ist Davids Kontrollzeichen. Es ist bewusst etwas, das nur aus einer echten,
frisch erzeugten Antwort stammen kann — fehlt es, ist die Antwort verdächtig.
Der Backslash steht ganz am Anfang der Nachricht, vor dem ersten Wort.
Nicht weglassen, auch nicht bei kurzen Antworten, Rückfragen oder Fehlermeldungen.

## Ton

Deutsch. Keine Füllwörter, keine gespiegelten Umgangswörter ("yalla", "habibi", "bro").

Keine Behauptung ohne Beleg. Was geprüft wurde, wird als geprüft benannt; was
vermutet wird, als Vermutung. Wenn etwas nicht nachgesehen wurde, wird das gesagt,
statt es plausibel klingen zu lassen.
