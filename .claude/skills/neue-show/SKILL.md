---
name: neue-show
description: Fuehrt durch den Bau einer neuen Gameshow nach BAUPLAN.md - die sieben Fragen vor der ersten Zeile, das Skelett der Spieldatei, die elf Anmeldungen, Design in allen 18 Richtungen, Abnahme. Aufruf, wenn David eine neue Show will, mit dem Namen oder der Idee als Argument.
disable-model-invocation: true
argument-hint: "[Name oder Idee der Show]"
---

# Neue Show: $ARGUMENTS

Eine neue Show ist laut CLAUDE.md eine **grosse Aenderung**: erst den Plan
mit David abstimmen, dann bauen. Der BAUPLAN.md ist das Skelett; jede Regel
dort hat einen Anlass. Bricht eine davon, gehoert das Warum in die HANDOFF.md.

## 1 · Stand und Grundlage

1. `git fetch origin && git status -sb`; bei `behind` erst `git merge --ff-only origin/master`.
2. `BAUPLAN.md` **ganz** lesen, nicht ueberfliegen. Danach die zwei Shows in
   `js/` lesen, die der neuen am naechsten kommen (Teams: `feud.js`,
   `wwds.js`; Teilnehmer: `ddf.js`, `pih.js`; Glueck/Rad: `tp.js`).
3. Nachsehen, ob es die Show oder Teile davon schon gibt (`designs/`,
   `tools/intros/`, Menuekacheln in `index.html`). Nichts als "fehlt"
   bezeichnen, ohne nachgesehen zu haben.

## 2 · Die sieben Fragen (BAUPLAN 1) - an David, vor der ersten Zeile

Teams oder Teilnehmer? Buzzern die Handys? Tippen die Handys? Was sieht das
Publikum, was nur der Host? Was ist ein Zug (Zustandsautomat `phase`)? Wie
endet sie? Wie wird gewertet?

Antworten, die sich aus der Idee ergeben, als Vorschlag mitschicken; offene
als Frage mit Optionen. Das Ergebnis als kurzen Plan in den Chat und in die
HANDOFF.md (Abschluss-Uebersicht), **dann** auf Davids Ja warten.

## 3 · Bauen - in Scheiben, jede mit Commit

1. **Spieldatei** `js/xxx.js` in der Reihenfolge aus BAUPLAN 2.1, Start in
   den fuenf Schritten aus 2.2, Intro-Lauf wortgleich.
2. **Die elf Anmeldungen** (BAUPLAN 2.3) als Checkliste abhaken - `node
   check.js` findet nur die ersten zwei. Turnier: zusaetzlich die fuenf
   Stellen in `js/tournament.js`.
3. **GM-Panel** nach BAUPLAN 2.4; jede gerufene Funktion in
   `GM_REMOTE_ALLOWED_FNS`. Das GM-HTML laeuft automatisch durch
   `themeGmHtml` (Design-Richtung) - keine eigenen Farben ausser denen aus
   `GM_SHARED_CSS`.
4. **Code-Regeln** BAUPLAN 3: Helfer aus `core.js` statt rohem DOM, alles
   Eingegebene durch `escapeHtml`/`escAttr`, Typen als JSDoc.
5. **Design** BAUPLAN 4: was das Publikum sieht, nur mit CSS animieren
   (Zuschauerfenster spiegelt nur den DOM). Flaechen ueber die
   Material-Tokens (`var(--tile, …)`, `var(--brd-surface, …)`, Abschnitt
   "Spielbrett-Material" in `styles.css`) - dann traegt die Show in allen 18
   Richtungen sofort Material. Teamfarben bleiben fest (BAUPLAN 4.4).

## 4 · Pruefen

1. `node check.js` (Pflicht), `node check.js --types`.
2. **Neue Show in `tools/shots/shots.js` eintragen** (`AUFBAU` und
   `ALLE_SHOWS`), dann `/design-pruefung` - alle Richtungen, Kontaktbogen
   ansehen, Studio-Blau der anderen Shows per `--vergleich` unveraendert.
3. Abnahme-Liste BAUPLAN 5 komplett, im Browser die **ganze** Show
   durchspielen. Firebase dabei durch den Stub ersetzen (BAUPLAN 5) -
   niemals Tests gegen die Live-DB.
4. Was nicht geprueft wurde, als ungeprueft benennen.

## 5 · Abschluss

`/abschluss` - Commit, HANDOFF-Eintrag mit Hash, Push, Deploy-Nachweis,
Nachricht mit "Offen" und "Naechste Schritte".
