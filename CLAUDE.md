# Iryo Gameshows

> ## ⛔ VOR JEDEM ABSENDEN PRÜFEN
>
> **Beginnt JEDER Absatz dieser Nachricht mit einem Backslash `\` ?**
>
> Nicht nur der erste. Auch:
> - die eine kurze Zeile vor einem Werkzeugaufruf ← **hier fällt er weg**
> - die Rückfrage, die Fehlermeldung, der letzte Satz
> - die Einleitungszeile über einer Liste, Tabelle oder einem Code-Block
> - der Satz nach einer Tabelle, Liste oder Überschrift
>
> Keinen bekommen nur: Überschriften, Code-Blöcke, Tabellenzeilen, einzelne
> Listenpunkte.
>
> Nach dem Backslash folgt ein Buchstabe, eine Ziffer oder ein Leerzeichen —
> nie direkt `*`, `_`, `` ` ``, `[`, `#`, `>`, sonst frisst Markdown ihn auf.
>
> Das Warum steht unten unter „Antwortformat".

## ZUERST: Repo-Stand prüfen — nicht verhandelbar

**Vor jeder Aussage über die Struktur und vor der ersten Änderung:**

```bash
git fetch origin && git status -sb && git log --oneline -3 origin/master
```

Bei `behind`: `git merge --ff-only origin/master`.

Am Repo arbeiten parallele Sessions und drei GitHub-Accounts (`Iryogameshows`,
`IryoRun`, `iryoof`; in der History als `Iryo`, `iryoof`, `Iryogameshows`). Der
lokale Stand ist regelmäßig mehrere Commits alt.

Warum so scharf: Am 2026-09-16 kam eine Strukturauskunft aus einer
Zusammenfassung — beschrieben wurde ein Monolith `index.html`, der längst in
`styles.css` + `js/`-Module aufgeteilt war, eine ganze Show fehlte, und
vorgeschlagen wurde, die vorhandene Aufteilung zu bauen. Auf veraltetem Stand
editieren überschreibt fremde Arbeit.

- **Niemals** aus Gedächtnis, Zusammenfassung oder früherem Tool-Ergebnis über
  Dateien reden. Nach einer Kompaktierung gilt jede Datei-Information als veraltet.
- `git ls-files` ohne vorheriges `git fetch` ist für Struktur-Aussagen wertlos.
- Vor dem ersten Edit die Datei frisch lesen.
- Bevor etwas als „fehlt" gilt: nachsehen, ob es existiert.

## Geräte-Setup — Skills prüfen und selbst nachladen

Skills liegen lokal in `~/.claude/skills` und kommen nicht per Git mit. Am
Anfang jeder Session, nach dem Repo-Stand:

```bash
ls ~/.claude/skills/frontend-design ~/.claude/skills/caveman ~/.claude/skills/using-agent-skills
```

Fehlt eines: ohne Rückfrage nachladen (Anweisung 2026-10-09), erst dann weiter:

```bash
npx --yes skills add anthropics/claude-code --skill frontend-design -g -a claude-code -y
npx --yes skills add JuliusBrussee/caveman -g -a claude-code -y
npx --yes skills add addyosmani/agent-skills -g -a claude-code -y
```

Neue Skills erscheinen erst in der nächsten Session; bis dahin die `SKILL.md`
direkt aus `~/.claude/skills/<name>/` lesen. Am Ende sagen, dass nachinstalliert
wurde.

### Wann was benutzen

- **frontend-design**: jede Arbeit an Oberfläche, Intro, Logo, Layout,
  Animation. Erst Gestaltungsplan, dann Code. Bei Widerspruch gilt `BAUPLAN.md`.
- **agent-skills** (Osmani): `spec-driven-development` /
  `planning-and-task-breakdown` vor größeren Vorhaben,
  `debugging-and-error-recovery` bei Fehlern, `code-review-and-quality` /
  `security-and-hardening` vor größeren Pushes, `incremental-implementation`
  bei Umbauten.
- **caveman** (David will es, 2026-10-09) und **ponytail** (seit 2026-10-21,
  Stufe `full`): beide als Plugin in `.claude/settings.json`
  (`extraKnownMarketplaces` + `enabledPlugins`), kommen per Git mit; beim ersten
  Öffnen fragt Claude Code nach Vertrauen. Ausschalten: `/caveman off`.
  Claude darf die eigene Plugin-Konfiguration nicht erweitern (die Umgebung
  verweigert es) — bei einem weiteren Plugin David die zwei Stellen nennen.
- **Caveman kürzt nur den Chat.** Backslash, Deutsch, Belege mit Zahlen bleiben.
  HANDOFF, Commit-Nachrichten und diese Datei im normalen, ausführlichen Stil.

#### ponytail × CLAUDE.md — was gilt

Ponytail regelt den **Code**, diese Datei **Prüfen, Melden, Protokoll**:

- Kürzen gilt für den Code, nicht für die Prüfung: `node check.js` vor jedem
  Commit, `shots.js` nach Änderungen an Aussehen/Layout, `--types` vor Größerem.
  Die Seite läuft vor Publikum ohne Netz.
- Ponytails „kleiner Test" sind hier `check.js` und `tools/shots`. Kein neues
  Testwerkzeug; neue Zustände in `tools/gemeinsam/aufbau.js`.
- HANDOFF-Eintrag bleibt vollständig (Gemacht · Warum · Geprüft · Offen ·
  Fallstricke).
- Kommentardichte: Haus-Stil. In `js/` steht das *Warum* samt verworfener Wege
  am Code, oft mehrzeilig.
- Ponytails Abschlusszeile geht in die Liste **Offen**.

### Projekt-Skills, Plugins, Hooks

Liegen im Repo:

- **`/design-pruefung`**: `tools/shots` laufen lassen, Kontaktbögen ansehen,
  Studio-Blau vergleichen. Nach jeder Änderung an Aussehen oder Layout.
- **`/neue-show`**: neue Show entlang BAUPLAN — sieben Fragen, Skelett, elf
  Anmeldungen, Design, Abnahme.
- **`/abschluss`**: check.js, Commit, HANDOFF, Push, Deploy-Nachweis, Antwort.
  `/handoff`: nur der HANDOFF-Eintrag.
- **Hook `design-reminder.js`**: erinnert bei `git commit` mit `styles.css`,
  `js/theme.js`, `js/core.js` oder Handy-/Mainscreen-Seite an
  `/design-pruefung`. Sperrt nicht.
- **Hook `commit-gate.js`**: lässt Commits über das Bash-Werkzeug nur nach
  bestandenem `node check.js` durch.
- **Plugins**: `code-review@claude-plugins-official` (`/code-review` vor großen
  Pushes), `design@knowledge-work-plugins` (seine Slack/Figma/Notion-Konnektoren
  bleiben unangemeldet), `firebase@claude-plugins-official` (braucht einmal
  `npx firebase-tools login` durch David). **Firebase-MCP nur lesend** —
  Schreiben in Live-Daten erst nach Frage.
- `gh` für den Deploy-Nachweis (`gh run list`).

### Stupide Arbeit an Codex abgeben (seit 2026-10-22)

Mechanische Arbeit ohne Abwägung (gleichförmige Ersetzungen, Daten abtippen,
Fragen-Sets befüllen, Umbenennen nach Muster, Verschieben) **nicht selbst
machen**, sondern David einen Prompt für Codex schreiben — spart Tokens.

Der Prompt steht in einem Code-Block und ist ohne diese Unterhaltung verständlich:

- **Erste Zeile wörtlich: „Nicht committen, nicht pushen — alles nur lokal."**
  (David, 2026-10-22). Am Ende noch einmal.
- Dateien und Stellen mit Pfad, Muster mit Vorher-/Nachher-Beispiel.
- Was **nicht** angefasst wird.
- `node check.js` am Ende, Ergebnis melden.

Danach prüft Claude den Diff selbst, committet und schreibt den HANDOFF-Eintrag.
Codex liest `AGENTS.md`; die verweist nur hierher (eine Kopie veraltete).
Design, Spiellogik, Fehlersuche, Firebase bleiben hier.

## Bibliotheken in `vendor/`

Feste Kopien statt CDN: die Show muss ohne Netz laufen. Eingebunden ist **noch
nichts** — wer eine nutzt, trägt das `<script>`-Tag in `index.html` ein
(klassisch, siehe „Scripts").

| Datei | Version | Zweck |
|---|---|---|
| `vendor/gsap.min.js`, `ScrollTrigger.min.js` | GSAP 3.15.0 | Animation für Host und Intro-Labor — nicht für die Leinwand |
| `vendor/lenis.min.js`, `lenis.css` | Lenis 1.3.26 | weiches Scrollen (MIT) |
| `vendor/reactbits.js`, `reactbits.css` | gebaut aus `tools/reactbits/` | React-Bits-Komponenten |

- GSAP: GreenSock-Standardlizenz. Beim Aktualisieren Version hier mitziehen.
- **Was das Publikum sieht, wird mit CSS animiert.** `mainscreen/` bekommt nur
  den DOM gespiegelt; GSAP-`style`-Schreibungen stünden still, sobald das
  Hauptfenster im Hintergrund ist, Canvas/WebGL kommen gar nicht an
  (BAUPLAN 4.8). Ausnahme: Skripte, die der Beamer selbst ausführt
  (`mainscreen/aufdecken.js`, `buehne.js`). Immer `prefers-reduced-motion`.
- `check.js` und `jsconfig.json` prüfen `vendor/` bewusst nicht.

**React Bits** (https://reactbits.dev): vorab mit esbuild gebündelt und
eingecheckt, enthält React 19 (~223 KB mit einer Komponente — nur laden, wo
eine vorkommt). Lizenz MIT + Commons Clause.

```bash
cd tools/reactbits && npm install   # einmal pro Gerät
node add.js ShinyText BlurText      # Komponente(n) holen (Variante JS-CSS) und bauen
node build.js                       # nur neu bauen
```

`add.js` meldet `registryDependencies`, die man mitholen muss. Nutzung:
`ReactBits.mount('ShinyText', el, { text: '…' })`, `ReactBits.unmount(el)`,
`ReactBits.list()`; Beispiel in `tools/reactbits/demo.html`.
**`vendor/reactbits.js` nie von Hand ändern**, nach jedem Bau mit committen.

## Struktur

Statische Seite, **kein Build-Step**. GitHub Pages liefert die Dateien direkt.

```
index.html      Markup: alle Screens + die <script>-Tags am Ende
styles.css      gesamtes CSS
js/
  theme.js      Design-Richtung (18 Variablensätze)  ← lädt im <head>, vor allem anderen
  core.js       Logo-Rendering, showScreen(), Gemeinsames  ← lädt zuerst im <body>
  intro.js      Alle Intros: playIntro(), drei Bühnen, Vorlagen (Keller, Tag 2,
                Geburtstag), Film-Intros Arcade und Primetime (playFilmIntro,
                reines CSS, Ton per WebAudio), Intro-Editor, Intro-Auswahl
                je Show (INTRO_SLOTS)
  keller-ton.js WebAudio-Töne für Design-Richtung T (Keller)
  feud.js       Family Feud
  jeopardy.js   Jeopardy-Logik
  jeopardy-ui.js Jeopardy-Board/Overlays
  wwm.js        Wer wird Millionär
  wwds.js       Wer weiß denn sowas
  ddf.js        Der Dümmste fliegt
  pih.js        Der Preis ist heiß
  tp.js         Trivial Pursuit (Glücksrad statt Brett, Tortenstücke, Finalfrage)
  tournament.js Turnier-Modus
  buzzer.js     Firebase-Buzzer, GM-Remote
  roster.js     Teilnehmer-Auswahl (DDF, Preis ist heiß)
  resume.js     Spielstand sichern und fortsetzen
buzzer/index.html   Handy-Buzzer
gamepad/index.html  Handy-Gamepad
mainscreen/index.html  Zuschauerfenster (bekommt den DOM gespiegelt, führt selbst nichts aus)
  aufdecken.js  Jeopardy-Flug, vom Beamer selbst gespielt (GSAP, BAUPLAN 4.8)
  buehne.js     grosse Momente je Richtung (Antwort, X, Runde, Punkte) + lebende
                Stadt in Late Night - ebenfalls vom Beamer selbst
tools/
  intros/       Intro-Labor: 18 Intro-Prototypen, NICHT Teil der Show
  keller/       Keller-Assets holen und zuschneiden
  reactbits/    Bauwerkzeug für vendor/reactbits.js
  shots/        Screenshot-Prüfung aller Design-Richtungen (siehe unten)
  sprites/      Pixel-Sprites für Richtung T (Keller) bauen
  durchgang/    Durchgeh-Seite: jede Richtung × jeden Zustand anklickbar
                ansehen, Urteil und Notiz, Bericht zum Kopieren (siehe unten)
  gemeinsam/    was Werkzeug UND ausgelieferte Seite brauchen (aufbau.js,
                fbstub.js) — tools/shots wird vom Deploy entfernt, dieser
                Ordner nicht. Siehe tools/gemeinsam/LIESMICH.md
```

Eine Änderung an einem Spiel geht in die jeweilige `js/`-Datei, nicht in `index.html`.

### Intro-Labor (`tools/intros/`)

Eigenständige Seiten zum Ausprobieren, live unter
https://iryogameshows.github.io/tools/intros/. Je Intro ein Ordner mit
`index.html`; gemeinsam nur `lab.js`/`lab.css` (Texte `Lab.SHOW`, Bedienleiste,
Ton-Baukasten `Lab.Ton` per WebAudio, Explosions-Baustein).

- Nutzen GSAP, Canvas, WebGL — laufen deshalb **nicht** im Zuschauerfenster.
  Wer eins in die Show holt, schreibt es auf CSS um oder lässt den Beamer es
  selbst abspielen.
- `check.js` und Typprüfung sehen `tools/` nicht.
- Ohne Ton an eine Stelle springen: `lab.zeige(sekunden)`. Ein ausgeblendetes
  Browser-Pane liefert keine Animationsbilder.
- Dramaturgie: Anlauf, Logo als Höhepunkt mit Schlag, stehende Titelkarte.

## BAUPLAN.md — bevor eine Show angefasst oder gebaut wird

Das Skelett jeder Show: Reihenfolge in der Spieldatei, die elf
Anmeldestellen, Code- und Design-Regeln. Jede Regel hat einen Anlass (Hash
dabei, Vorgang in der HANDOFF). Vor einer neuen Show ganz lesen, sonst
mindestens die berührten Abschnitte. Wer eine Regel bricht, begründet es in der
HANDOFF; ist sie falsch, wird sie im BAUPLAN geändert.

## Scripts

Klassische `<script src>`-Tags, **keine** ES-Module. Alles global, Reihenfolge
in `index.html` zählt: `core.js` vor den Spielen. Kein `import`/`export` ohne
Umstellung auf `type="module"`.

## Nach Änderungen — Pflicht

```bash
node check.js
```

Muss fehlerfrei durchlaufen, bevor committet wird. Prüft:

1. **Syntax** aller `js/`-Dateien.
2. **Inline-Handler**: jeder Funktionsname aus `onclick=`/`onchange=` usw.
   existiert im JavaScript.
3. **Element-IDs**: zu jeder festen ID im Code (`setText('round-pts', …)`)
   gibt es ein Element, im Markup oder zur Laufzeit erzeugt.
4. **styles.css**: Klammern gehen auf.

Warum 2 und 3: rund 320 Inline-Handler, etwa 230 davon als Zeichenkette gebaut
(`onclick="resetPlayerPassword('${p.key}', ${escJsArg(p.name)})"`). Kein Editor
und kein TypeScript sieht dort einen Namen — eine Umbenennung fällt sonst erst
auf, wenn in der Show jemand drückt. Fehlende IDs fallen nie auf, weil die
Helfer still bleiben. Handler mit eingesetztem Funktionsnamen
(`opener.${togglerName}(...)`) meldet der Prüfer als „nicht prüfbar".

## Typprüfung

```bash
node check.js --types
```

Rund eine halbe Minute; nach größeren Änderungen und vor größeren Pushes.
**Kein Build-Step**: TypeScript liest nur (`noEmit`), ausgeliefert wird
unverändertes JavaScript.

**Alle 16 Dateien in `js/` melden nichts** — eine neue Meldung gehört also zur
gerade gemachten Änderung. `checkJs` steht auf `true`, die `// @ts-check`-Marker
bleiben. **Nie Marker entfernen oder `checkJs` zurückdrehen**, um Meldungen
loszuwerden; wer eine nicht auflösen kann, fragt.

Typen als JSDoc am Code. Jeopardy-Daten: `@typedef JeopardyClue` /
`JeopardyCategory` oben in `js/jeopardy.js` — **neue Fragensorte dort
eintragen**. CDN-Globale (`firebase`, `QRCode`) in `types/globals.d.ts`.

### Felder und Anzeigen

Für DOM-Zugriffe immer die Helfer aus `core.js` — sie geben bei fehlendem
Element `false`/`null`/Rückfallwert zurück statt zu werfen. Ein fehlender Knopf
darf keine Show abbrechen.

```js
fieldVal('ddf-lives')             // Inhalt, oder '' wenn es das Feld nicht gibt
fieldChecked('enable-team3')      // Haken gesetzt? Fehlt das Feld: false
fieldSet('tour-game-weight', 2)   // schreibt; Rückgabe sagt, ob es das Feld gab
fieldEl('ddf-bulk-text')          // das Element selbst, oder null
setText('round-pts', 123)         // textContent, Zahl wird umgewandelt
setHtml('wwm-ladder', markup)     // innerHTML — Eingaben vorher escapen!
showEl('team3-card', on)          // ein- und ausblenden
screenActive('result-screen')     // ist dieser Screen gerade sichtbar?
setClass('gm-bar', 'visible', on) // Klasse setzen oder wegnehmen
```

- `setHtml` escapt nicht: Spielernamen, getippte Schätzungen vorher durch
  `escapeHtml` bzw. `escAttr`.
- `showEl` blendet mit `''` ein, nicht `'block'`/`'flex'` — sonst schlägt der
  Inline-Wert still jede Regel in `styles.css`.

## Screenshot-Prüfung

```bash
cd tools/shots && npm install      # einmal pro Gerät
node shots.js                      # alle Shows x alle Richtungen, 1280x720
node shots.js --basis              # vor einer Änderung: Studio-Blau merken
node shots.js --vergleich          # danach: Studio-Blau unverändert?
node shots.js --reduced            # mit „Bewegung reduzieren“: läuft noch etwas?
node ablauf.js                     # Host + Handy + Gamepad: welcher Screen wann (48 Punkte)
node geraete.js                    # echte Geräteprofile, iPhones in WebKit (55–57 Punkte, ~1,5 min)
npx playwright@1.64.1 install webkit   # einmal pro Gerät, für geraete.js
```

**`shots.js` ist Pflicht nach jeder Änderung an CSS, Design-Richtungen,
GM-Panel oder Handy-Seiten**, vor dem Commit. Kontaktbögen nach
`tools/shots/out/`; Befunde: JS-Fehler, Richtung nicht angekommen, Screen höher
als das Fenster (Code 1). Kontaktbogen ansehen, nicht nur Befunde lesen. Voller
Lauf gut 6 Minuten je Größe — im Hintergrund. GM-Panel, Turnier-Host-Seite,
`menu`, `setup` ohne Höhenprüfung (`HOST_SEITEN`), sie kommen nicht auf den Beamer.
Firebase ist ersetzt (`fbstub.js`), kein Lauf erreicht Live-Daten. Browser:
Chrome/Edge, sonst Umgebungsvariable `CHROME`. Einzelheiten: BAUPLAN 5.

- `ablauf.js`: Host, Handy, Gamepad über gemeinsame Ersatz-DB (`fbshared.js`),
  fünf Shows (Feud, TP, Jeopardy, DDF, PIH). Nach Änderungen an Lobby,
  Buzzer-Logik, Spielstart, Teams.
- `geraete.js`: Host (Chrome), iPhone 15/SE (WebKit), Pixel 7/Galaxy S9+,
  Gamepad per Touch — Login, Buzzer-Wettlauf, Netzabriss, Neuladen, Nachzügler,
  TP-Rad, DDF, PIH. Ersatz-DB als Server im Testprozess (`relay.js` +
  `fbrelay.js`), je Gerät `relay.offline()` / `relay.delay()`. Nicht abgedeckt:
  echtes iOS, Bildschirmsperre, App-Wechsel.

**Automatische Prüfung bei Push gibt es nicht.** Ein Workflow
`pruefungen.yml` ist gebaut, liegt aber nicht auf GitHub: Dateien unter
`.github/workflows/` brauchen ein Token mit `workflow`-Recht, das weder Git-
noch `gh`-Anmeldung hat. David einmal: `gh auth refresh -h github.com -s workflow`,
dann
`git -c credential.helper= -c "credential.helper=!gh auth git-credential" push origin master`.
Bis dahin auch `pages.yml` nicht ändern — der Push würde abgelehnt.

## Durchgeh-Seite (`tools/durchgang/`)

`http://localhost:3000/tools/durchgang/` oder live unter
https://iryogameshows.github.io/tools/durchgang/; nicht per `file://`.
Oben das Zuschauerfenster, unten die echte Hostseite, anklickbar; je Schritt
Urteil und Notiz (`←` `→` `1` `2`, Stand im `localStorage`), Knopf **Bericht**.

- **Was eine Seite lädt, muss in einem Ordner liegen, den der Deploy behält.**
  `pages.yml` entfernt `tools/shots` und `tools/reactbits`; am 2026-10-17 war
  deshalb live alles 404. Nach Deploy prüfen:
  `curl -s -o /dev/null -w "%{http_code}\n" https://iryogameshows.github.io/tools/gemeinsam/aufbau.js`
- Beamer-Animationen (`aufdecken.js`, Bauchbinde, `buehne.js`) sieht man nur im
  oberen Rahmen. Angeheftet über `opener` + `boardReattach`.
- Die Spiegelung hängt an `requestAnimationFrame` (`scheduleBoardMirror`,
  `js/feud.js`) — im ausgeblendeten Browser-Pane steht sie still. Kein Fehler.
- Zustände aus `tools/gemeinsam/aufbau.js` (dieselbe Tabelle wie `shots.js`).
  Neuer Zustand dort → auch in `ZUSTAENDE` der Durchgeh-Seite eintragen.
- **`?stumm=1`** lädt `tools/gemeinsam/fbstub.js` statt Firebase, roter Balken
  zeigt es. Ohne das setzte ein Durchgang echte Buzzer-Zustände. Kein Handy
  verbunden — für eine echte Show nie mit `?stumm=1`.
- Nicht dabei: Handy-Zustände (`buzzer`, `buzzer-pause`, `buzzer-login`).

## Deploy

Push auf `master` → `.github/workflows/pages.yml` → https://iryogameshows.github.io/

## Commit und Push — automatisch, ohne Rückfrage

Anweisung von David (2026-10-08, bekräftigt 2026-10-13): Commit und Push ohne
Rückfrage, sobald ein Arbeitsschritt fertig ist — auch bei `CLAUDE.md` und
`.claude/`.

1. `git fetch origin && git status -sb`; bei `behind` erst `git merge --ff-only origin/master`.
2. `node check.js` muss durchlaufen.
3. Code committen, HANDOFF-Eintrag mit Hash als eigenen Commit hinterher,
   `git push origin master`.
4. Deploy-Lauf prüfen (`gh run list`) und melden. Fehlgeschlagen = nicht fertig.

Vorher kurz Bescheid geben nur bei: Verlauf umschreiben (`--force`,
`reset --hard`, `rebase`, Branches löschen) und Löschen von Dateien/Daten.
Gilt für `master` in diesem Repo, nicht für andere Projekte.

## Session-Tokens knapp — kontrolliert abbrechen

Anweisung 2026-10-13. Maßstab ist der `<total_tokens>`-Zähler je Zug (Davids
Abo-Kontingent ist nicht sichtbar). Unter **~300 000**: den Schritt an der
nächsten sauberen Stelle beenden, HANDOFF-Eintrag mit Stopppunkt (Datei,
Funktion, Zeile, letzter geprüfter Stand) und konkreten nächsten Schritten,
David sagen, dass abgebrochen wurde und es in der HANDOFF steht. Geprüft wird zu
Beginn jedes Zuges.

## HANDOFF.md — bei JEDER Änderung, ohne Ausnahme

Wird **mitgeschrieben, nicht nachgepflegt**; gehört zur Änderung wie Code und
Prüfung. Kein Eintrag = Arbeitsschritt nicht fertig.

1. Eintrag **oben**, Datum und Commit-Hash in der Überschrift. Hash erst nach
   dem Commit bekannt → Code committen, dann Eintrag als eigener Commit.
2. Je Eintrag: **Gemacht · Warum so (samt verworfener Wege) · Geprüft (mit
   Zahlen) · Offen · Fallstricke**. Ungeprüftes als ungeprüft benennen.
3. **In der Antwort sagen: „Steht in der HANDOFF.md."** David sieht die Datei
   sonst nicht.

Bei Themenwechsel oder Abbruch einer komplexen Aufgabe, auch ohne Commit:
Übersicht in die HANDOFF — aktueller Stand, Stopppunkt, kreative Ansätze und
Design-Ideen (auch verworfene), nächste Schritte.

Warum: Nach Sessionende oder Kompaktierung bleibt nur die Git-History. Sie sagt
*was*, nicht was gemessen, verworfen oder liegen gelassen wurde. Nach einer
Kompaktierung ist die HANDOFF die erste Datei, die gelesen wird — ihre Aussagen
gelten trotzdem als veraltet, bis sie gegen das Repo geprüft sind.

## Antwortformat

**Jeder Absatz beginnt mit einem Backslash `\`** — jeder, bis zum Ende der
Nachricht, auch Zwischenzeilen, Rückfragen, Fehlermeldungen, der letzte Satz.

\ Davids Kontrollzeichen: Es kann nur aus einer echten, frisch erzeugten Antwort
stammen. Über alle Absätze verteilt deckt es die ganze Nachricht ab, nicht nur
den Anfang. Ausgenommen sind nur Überschriften, Code-Blöcke, Tabellen und
einzelne Listenpunkte.

### Abschluss jeder Ergebnis-Nachricht

Endet mit zwei Listen, in dieser Reihenfolge (Anweisung 2026-10-10):

- **Offen:** was nicht behoben oder nicht geprüft ist, ein Punkt je Zeile.
- **Nächste Schritte:** nummeriert in vorgeschlagener Reihenfolge.

Leere Liste: „keine", nicht weglassen.

## Ton

Deutsch. Keine Füllwörter, keine gespiegelten Umgangswörter. Keine Behauptung
ohne Beleg: Geprüftes als geprüft, Vermutetes als Vermutung, nicht Nachgesehenes
als nicht nachgesehen benennen.

## TODO / Offene Punkte

- **2026-10-17 — Durchgeh-Seite: David unzufrieden** („nicht zufrieden mit
  deiner Umsetzung aber das passt schon so", Gründe „zu viel um zu erklären").
  **Nicht aus eigenem Antrieb umbauen**, nicht raten. Vermutungen am Ende der
  `HANDOFF.md` unter „TODO / Offene Punkte".
