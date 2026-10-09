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
> Das Warum steht unten unter „Antwortformat". Hier oben steht nur die Prüfung.

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

## Geräte-Setup — Skills prüfen und selbst nachladen, DANN erst weiterarbeiten

David arbeitet auf mehreren Geräten. Was im Repo liegt (`vendor/`), kommt per
Git mit. Skills liegen dagegen lokal in `~/.claude/skills` und kommen **nicht**
mit. Deshalb am Anfang jeder Session, nach dem Repo-Stand:

```bash
ls ~/.claude/skills/frontend-design ~/.claude/skills/caveman ~/.claude/skills/using-agent-skills
```

Fehlt eines davon, selbstständig nachladen — ohne Rückfrage, David hat das am
2026-10-09 ausdrücklich angewiesen — und **erst danach** mit der eigentlichen
Aufgabe weitermachen (Node mit `npx` genügt, die `claude`-CLI ist nicht nötig):

```bash
npx --yes skills add anthropics/claude-code --skill frontend-design -g -a claude-code -y
npx --yes skills add JuliusBrussee/caveman -g -a claude-code -y
npx --yes skills add addyosmani/agent-skills -g -a claude-code -y
```

Die Skills-Liste einer laufenden Session ist beim Start festgelegt. Frisch
installierte Skills erscheinen daher erst in der nächsten Session. Bis dahin
die `SKILL.md` direkt aus `~/.claude/skills/<name>/` lesen und befolgen. Am
Ende sagen, dass nachinstalliert wurde und eine neue Session nötig ist.

Quellen: `anthropics/claude-code` (`plugins/frontend-design`),
`JuliusBrussee/caveman`, `addyosmani/agent-skills`.

### Wann was benutzen

- **frontend-design**: bei jeder Arbeit an Oberfläche, Intro, Logo, Layout oder
  Animation. Zuerst Gestaltungsplan, dann Code. Ihre Regeln hebeln die
  Gestaltungsregeln im `BAUPLAN.md` nicht aus; bei Widerspruch gilt das
  `BAUPLAN.md`.
- **agent-skills** (Osmani): nach Aufgabe wählen — `spec-driven-development`
  und `planning-and-task-breakdown` vor größeren Vorhaben,
  `debugging-and-error-recovery` bei Fehlern, `code-review-and-quality` und
  `security-and-hardening` vor größeren Pushes, `incremental-implementation`
  bei Umbauten.
- **caveman**: David will es (Anweisung 2026-10-09). Der Autostart läuft als
  Plugin über die Projekt-Settings (`extraKnownMarketplaces` + `enabledPlugins`
  mit `caveman@caveman` in `.claude/settings.json`), das kommt per Git auf alle
  Geräte. Beim ersten Öffnen des Projekts auf einem Gerät fragt Claude Code,
  ob der Marketplace vertraut und das Plugin installiert werden soll.
  Zusätzlich liegen die Skills global (`/caveman`, `/caveman-commit`,
  `/caveman-review`). Ausschalten: `/caveman off`.
  **Auch mit caveman gilt unverändert:** Antwortformat (Backslash vor jedem
  Absatz), Deutsch, Belege mit Zahlen. HANDOFF-Einträge, Commit-Nachrichten
  und `CLAUDE.md` bleiben im normalen, ausführlichen Stil. Caveman kürzt nur
  den Chat-Text.

## Bibliotheken in `vendor/` (GSAP, Lenis)

Liegen als feste Kopien im Repo, nicht per CDN: eine Show läuft vor Publikum und
muss ohne Netz auskommen. Eingebunden ist **noch nichts** — wer sie nutzt, trägt
das `<script>`-Tag in `index.html` ein (klassisch, kein `type="module"`, Reihenfolge
siehe Abschnitt „Scripts“).

| Datei | Version | Zweck |
|---|---|---|
| `vendor/gsap.min.js` | GSAP 3.15.0 | Animationen für den Host und im Intro-Labor (`tools/intros/`) – nicht für die Leinwand |
| `vendor/ScrollTrigger.min.js` | GSAP 3.15.0 | scrollgesteuerte Animation |
| `vendor/lenis.min.js`, `vendor/lenis.css` | Lenis 1.3.26 | weiches Scrollen (MIT) |
| `vendor/reactbits.js`, `vendor/reactbits.css` | gebaut aus `tools/reactbits/` | React-Bits-Komponenten (siehe unten) |

- GSAP unterliegt der GreenSock-Standardlizenz (https://gsap.com/standard-license),
  Lenis ist MIT. Beim Aktualisieren die Version in dieser Tabelle mitziehen.
- **Was das Publikum sieht, wird mit CSS animiert, nicht mit GSAP.** Das
  Zuschauerfenster (`mainscreen/`) führt keinen App-Code aus, es bekommt nur
  den DOM gespiegelt. GSAP schriebe jeden Frame ein `style`-Attribut und
  stünde auf der Leinwand still, sobald das Hauptfenster im Hintergrund ist.
  Canvas und WebGL kommen gar nicht an (BAUPLAN 4.8). GSAP also nur für das,
  was der Host sieht, und für die Prototypen in `tools/intros/`. Beim
  Scrollen Lenis. Immer `prefers-reduced-motion` beachten.
- `check.js` und `jsconfig.json` prüfen nur `js/`; `vendor/` bleibt dort
  bewusst außen vor.

### React Bits (https://reactbits.dev)

React Bits sind React-Komponenten. Die Seite bleibt ohne Build-Step: die
Komponenten werden **vorab** mit esbuild zu einer fertigen Datei gebündelt, die
eingecheckt wird (`vendor/reactbits.js` + `vendor/reactbits.css`, enthält
React 19). Die Seite lädt nur diese zwei Dateien.

```bash
cd tools/reactbits
npm install                      # einmal pro Gerät (node_modules ist ignoriert)
node add.js ShinyText BlurText   # holt Komponente(n) aus dem Registry und baut neu
node build.js                    # nur neu bauen
```

- Es wird immer die Variante **JS-CSS** geholt (kein Tailwind im Projekt).
  `add.js` installiert npm-Abhängigkeiten der Komponente selbst (z. B. `gsap`,
  `ogl`) und meldet `registryDependencies`, die man ebenfalls holen muss.
- Nutzung in der Seite: `<link href="vendor/reactbits.css">`,
  `<script src="vendor/reactbits.js">` (Einbindung in `index.html` wie bei
  GSAP/Lenis erst bei Bedarf), dann
  `ReactBits.mount('ShinyText', element, { text: '…' })` und
  `ReactBits.unmount(element)`; `ReactBits.list()` nennt die enthaltenen Namen.
- **`vendor/reactbits.js` ist gebaut, nicht von Hand zu ändern.** Nach jedem
  `add.js`/`build.js` die neue Datei mit committen, sonst fehlt sie auf den
  anderen Geräten.
- Gewicht: etwa 223 KB mit einer Komponente, fast alles ist React selbst. Nur
  laden, wo eine Komponente tatsächlich vorkommt.
- Lizenz: MIT + Commons Clause (frei für private und kommerzielle Nutzung,
  nicht zum Weiterverkauf der Komponenten selbst).
- `tools/reactbits/demo.html` zeigt eine Komponente in einer Seite.

## Struktur

Statische Seite, **kein Build-Step**. GitHub Pages served die Dateien direkt.

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
buzzer/index.html   Handy-Buzzer
gamepad/index.html  Handy-Gamepad
mainscreen/index.html  Zuschauerfenster (bekommt den DOM gespiegelt, führt selbst nichts aus)
tools/
  intros/       Intro-Labor: 18 Intro-Prototypen, NICHT Teil der Show
  reactbits/    Bauwerkzeug für vendor/reactbits.js
```

Eine Änderung an einem Spiel geht in die jeweilige `js/`-Datei, nicht in `index.html`.

### Intro-Labor (`tools/intros/`)

Eigenständige Seiten, um Intro-Ideen auszuprobieren, bevor eine davon in die
Show kommt. Übersicht: `tools/intros/index.html` (live unter
https://iryogameshows.github.io/tools/intros/, weil der Deploy das ganze Repo
hochlädt).

- Jedes Intro ist ein Ordner mit einer `index.html`. Gemeinsam ist nur
  `lab.js` / `lab.css`: Texte (`Lab.SHOW`), Startbildschirm, Bedienleiste mit
  Spulen, Ton-Baukasten (`Lab.Ton`, alles WebAudio, keine Tondateien),
  Explosions-Baustein.
- Sie benutzen GSAP, Canvas und WebGL. Deshalb laufen sie **nicht** im
  Zuschauerfenster (siehe oben, BAUPLAN 4.8). Wer eins in die Show holt, muss
  es entweder auf reines CSS umschreiben oder das Zuschauerfenster das Intro
  selbst abspielen lassen.
- `check.js` und die Typprüfung sehen `tools/` nicht.
- Zum Prüfen ohne Ton an eine Stelle springen: `lab.zeige(sekunden)` in der
  Konsole. Ein ausgeblendetes Browser-Pane liefert keine Animationsbilder,
  Echtzeit-Abspielen bleibt dort stehen.
- Neue Intros folgen der Dramaturgie der zweiten Runde: Anlauf, dann das
  Logo als Höhepunkt mit Schlag, dann die stehende Titelkarte.

## BAUPLAN.md — bevor eine Show angefasst oder gebaut wird

`BAUPLAN.md` im Wurzelverzeichnis ist das Skelett, an dem sich jede Gameshow
entlanghangelt: die Reihenfolge in der Spieldatei, die elf Stellen, an denen
eine neue Show angemeldet werden muss, und die Code- und Design-Regeln, die
aus den bisherigen Shows entstanden sind.

**Jede Regel dort hat einen Anlass**, meist einen Fehler, der in einer Show
aufgefallen ist — der Commit-Hash steht dabei, der Vorgang in `HANDOFF.md`.

Vor einer neuen Show: ganz lesen. Vor einer Änderung an einer bestehenden:
mindestens die Abschnitte, die sie berührt. Wer eine Regel bricht, schreibt in
die `HANDOFF.md`, warum — und wenn sich die Regel als falsch erweist, wird sie
im `BAUPLAN.md` geändert, statt sie stillschweigend zu umgehen.

## Scripts

Klassische `<script src>`-Tags, **keine** ES-Module. Alles liegt global, die
Ladereihenfolge in `index.html` zählt: `core.js` muss vor den Spielen kommen.
Kein `import`/`export` einbauen, ohne die Tags auf `type="module"` umzustellen.

## Nach Änderungen — Pflicht

```bash
node check.js
```

Muss ohne Fehler durchlaufen, bevor committet wird. Der Prüfer macht vier Dinge:

1. **Syntax** aller `js/`-Dateien.
2. **Inline-Handler**: ob jeder Funktionsname, der aus einem `onclick=`/`onchange=`
   usw. heraus aufgerufen wird, im JavaScript auch existiert.
3. **Element-IDs**: ob zu jeder festen ID im Code (`setText('round-pts', …)`,
   `getElementById('gm-bar')`, …) auch ein Element existiert — im Markup oder
   im HTML, das die `js/`-Dateien zur Laufzeit erzeugen.
4. **styles.css**: ob die geschweiften Klammern aufgehen.

Punkte 2 und 3 sind der Grund für das Skript. Die App hängt an rund 320 Inline-Handlern,
etwa 230 davon werden zur Laufzeit als Zeichenkette zusammengebaut:

```js
onclick="resetPlayerPassword('${p.key}', ${escJsArg(p.name)})"
```

Für jedes Werkzeug ist das Text — kein Editor, kein Linter und auch TypeScript
sieht dort einen Funktionsnamen. Wer eine Funktion umbenennt und eine dieser
Zeichenketten übersieht, merkt das erst, wenn während der Show jemand auf den
Knopf drückt. Deshalb **vor jedem Commit** laufen lassen, besonders nach
Umbenennungen.

Dasselbe gilt für die IDs: die stehen ebenfalls als Zeichenketten im Code, und
seit die Helfer bei einem fehlenden Element stillhalten, merkt es sonst
niemand mehr — die Stelle tut dann einfach nichts. Punkt 3 hat genau so einen
Fall gefunden: `#jeopardy-corner` wurde noch zweimal gelesen und in
`styles.css` gestaltet, war aber nirgends mehr erzeugt.

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

**Alle 14 Dateien in `js/` sind geprüft und melden nichts.** Das ist der
Zustand, in dem die Prüfung etwas wert ist: eine neue Meldung gehört dann zur
Änderung, die gerade gemacht wurde, und niemand muss sie aus einem Rauschen
von Altlasten heraussuchen.

`checkJs` steht deshalb auf `true` — eine neu angelegte Datei ist ab der
ersten Zeile mit dabei, auch wenn jemand das `// @ts-check` oben vergisst. Die
Marker bleiben trotzdem in den Dateien stehen; sie sagen beim Öffnen sofort,
woran man ist. **Nie entfernen, um Meldungen loszuwerden** — und `checkJs`
nicht zurückdrehen. Wer eine Meldung nicht auflösen kann, fragt nach, statt
die Prüfung abzuschalten.

Typen stehen als JSDoc-Kommentare am Code, nicht in eigenen Dateien:

```js
/** @param {string} id
 *  @returns {HTMLInputElement|null} */
function fieldEl(id) { ... }
```

Die Jeopardy-Daten haben einen eigenen Bauplan: `JeopardyClue` und
`JeopardyCategory` stehen als `@typedef` oben in `js/jeopardy.js`, direkt über
`makeEmptyBoard`. Dort steht, was in einem Feld stecken kann — Bilder, Ton,
Staffelbild, Bilderreihe, Schätzfrage. **Wer eine neue Sorte Frage einbaut,
trägt sie dort ein**, sonst kennt sie weder der Editor-Code noch die Prüfung.

Globale Objekte vom CDN (`firebase`, `QRCode`) sind in `types/globals.d.ts`
deklariert.

### Felder und Anzeigen

`document.getElementById(id).value` war in dieser App rund 160-mal zu finden,
`.textContent`/`.innerHTML = …` 45-mal, `.style.display = …` 17-mal und
`.classList.…` 29-mal. Alle werfen, wenn es das Element nicht gibt — ein
Tippfehler in der ID oder ein Screen, der noch nicht aufgebaut ist, reicht.
**Alle sind abgelöst; für neuen Code die Helfer aus `core.js` benutzen:**

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

Alle neun geben `false` zurück (bzw. `null`/den Rückfallwert), wenn es das
Element nicht gibt, statt zu werfen. Ein Knopf, den es gerade nicht gibt, darf
keine ganze Show abbrechen.

`setHtml` nimmt niemandem das Escapen ab: was aus Benutzereingaben kommt —
Spielernamen, getippte Schätzungen — muss vorher durch `escapeHtml` bzw.
`escAttr`. Der Name sagt bewusst „Html", damit an der Aufrufstelle sichtbar
bleibt, dass dort Markup landet.

`screenActive` und `setClass` sind auch deshalb wichtig, weil der Zugriff in
`showScreen` selbst ungesichert war: eine einzige vertippte Screen-ID hätte
die komplette Navigation lahmgelegt.

`showEl` blendet mit `''` ein, nicht mit `'block'` oder `'flex'`: das nimmt den
Inline-Wert weg und lässt wieder gelten, was in `styles.css` steht. Ein fest
eingetragenes `display` würde dort jede spätere Änderung aushebeln — und zwar
still, weil ein Inline-Style jede Regel schlägt.

## Deploy

Push auf `master` → GitHub Action (`.github/workflows/pages.yml`) → live auf
https://iryogameshows.github.io/

## Commit und Push — automatisch, außer bei großen Änderungen

Seit 2026-10-08 (Anweisung von David): **Commit und Push passieren ohne
Rückfrage**, sobald ein Arbeitsschritt fertig ist. Vorher fragen nur bei
großen Änderungen.

**Ablauf, jedes Mal:**

1. `git fetch origin && git status -sb`; bei `behind` erst
   `git merge --ff-only origin/master`.
2. `node check.js` muss durchlaufen (die Commit-Sperre in
   `.claude/hooks/commit-gate.js` erzwingt das für Commits über das Bash-Werkzeug).
3. Code committen, HANDOFF-Eintrag mit Hash als eigenen kleinen Commit
   hinterher (siehe unten), dann `git push origin master`.
4. Nach dem Push den Lauf der Deploy-Action prüfen (`gh run list`) und den
   Ausgang melden. Schlägt sie fehl, ist der Arbeitsschritt nicht fertig.

**Groß — hier weiter erst fragen:**

- neue Show, neue Seite oder größerer Umbau der Struktur (Dateien verschieben,
  aufteilen, zusammenlegen)
- Dateien oder Daten löschen
- Änderungen an `.github/workflows/`, Firebase-Regeln oder -Daten,
  Passwort-Sperre
- Änderungen an `.claude/` (Hooks, Rechte, Agents), `CLAUDE.md` selbst
- alles, was Verlauf umschreibt: `--force`, `reset --hard`, `rebase`,
  Branches löschen
- Diff über etwa 10 Dateien oder mehrere hundert Zeilen
- `check.js` meldet Fehler, oder die Änderung ist ungeprüft in einem Bereich,
  der während einer Show benutzt wird

Die Grenze für „groß“ ist eine Festlegung der Session, nicht Davids Wortlaut:
bei Zweifel fragen, bei Bedarf hier anpassen.

Die Regel hebt **nicht** auf: den Repo-Stand vorher prüfen, `check.js`, den
HANDOFF-Eintrag und das Melden von Ungeprüftem. Sie gilt für `master` in diesem
Repo, nicht für andere Projekte unter `Documents\Coding`.

## HANDOFF.md — bei JEDER Änderung, ohne Ausnahme

`HANDOFF.md` im Wurzelverzeichnis wird **mitgeschrieben, nicht nachgepflegt**.
Sie gilt als Teil der Änderung, genau wie der Code und die Prüfung.

**Pflicht bei jedem Arbeitsschritt, der committet wird:**

1. Neuen Eintrag **oben** anlegen, mit Datum und Commit-Hash in der
   Überschrift. Der Hash ist erst nach dem Commit bekannt — also: Code
   committen, Hash ablesen, Eintrag damit schreiben und als eigenen kleinen
   Commit hinterherschicken. Lieber ein Commit mehr als ein Eintrag ohne Hash.
2. Je Eintrag: **Gemacht · Warum so (samt verworfener Wege) · Geprüft (mit
   Zahlen) · Offen · Fallstricke**. Was nicht geprüft wurde, wird als
   ungeprüft benannt.
3. **In der Antwort an David ausdrücklich sagen, dass es in der HANDOFF.md
   steht.** Er sieht die Datei sonst nicht und kann nicht nachhalten, ob es
   passiert ist. Ein Satz reicht: "Steht in der HANDOFF.md."

Kein Eintrag heißt: der Arbeitsschritt ist nicht fertig.

### Abschluss-Übersicht bei Themenwechsel oder Abbruch

Wird eine komplexe Aufgabe abgebrochen oder wechselt das Thema, schreibe ich
zum Abschluss eine kurze Übersicht — **immer auch in die `HANDOFF.md`**, nicht
nur in den Chat. Sie enthält:

- **Aktueller Stand:** woran zuletzt genau gearbeitet wurde,
- **Stopppunkt:** an welchem Punkt wir stehengeblieben sind,
- **Kreative Ansätze & Visionen:** welche konkreten Vorstellungen, Design-Ideen
  oder Konzepte bereits im Raum standen (visuelle Stile, Layouts, kreative
  Richtungen) — auch verworfene und nur angedachte,
- **Nächste Schritte:** welche konkreten Maßnahmen als Nächstes sinnvoll sind,
  um das Projekt nahtlos weiterzuführen.

Das gilt auch, wenn nichts committet wurde: ein unfertiger Stand ist genau der
Fall, in dem eine andere Session (oder ein anderer Rechner) die Information
braucht.

Warum: eine Sitzung endet, der Kontext wird komprimiert, eine andere Session
übernimmt — dann ist nur noch die Git-History da. Die sagt, *was* geändert
wurde, aber nicht, was gemessen, verworfen oder bewusst liegen gelassen wurde.
Genau das geht sonst verloren und wird ein zweites Mal erarbeitet.

Nach einer Kompaktierung ist `HANDOFF.md` die erste Datei, die gelesen wird —
ihre Aussagen gelten trotzdem als veraltet, bis sie gegen das Repo geprüft
sind.

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
