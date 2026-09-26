# Handoff

Was zuletzt passiert ist und warum. Neueste Einträge oben.
Angelegt mit `452ac83`.

Die Git-History sagt, *was* geändert wurde. Hier steht, was gemessen,
verworfen oder bewusst liegen gelassen wurde — das geht sonst verloren und
wird ein zweites Mal erarbeitet.

**Jede Aussage hier gilt als veraltet, bis sie gegen das Repo geprüft ist.**
Erst `git fetch origin && git status -sb`, dann lesen.

---

## 2026-09-25 — Jeopardy: eigener Punktwert je Frage (`5191743`)

**Gemacht:** `JeopardyClue` hat das optionale Feld `pts`. Im Frage-Editor
steht neben „Kategorie · Wert" ein Eingabefeld **Punkte**. Leer heißt wie
bisher: der Wert der Zeile (Platzhalter zeigt ihn an). Steht eine Zahl drin,
gilt die überall.

**Gerechnet wird an genau einer Stelle:** `jeopardyValueOf(clue, row)` und
`jeopardyCellValue(col, row)` in `js/jeopardy.js`. Daran hängen sieben
Anzeigen — Spielbrett, Frage-Overlay, Editor-Kopfzeile, Editor-Gitter,
GM-Spiegelbrett, DD-Warnung, Gutschrift/Abzug. Stünde die Rechnung mehrfach
im Code, wäre beim nächsten Mal genau eine davon vergessen. Deshalb nimmt
`renderJeopardyBoard` jetzt `JEOPARDY_VALUES.forEach((_, row) => …)` und holt
den Wert je Zelle.

**Eingaben:** 0, Leer, negative Zahlen und Buchstaben löschen `pts` wieder,
statt einen unsinnigen Wert zu speichern. Ein Feld, das nichts oder
Minuspunkte bringt, wäre keine Frage, sondern eine Falle. Nachkommastellen
werden gerundet, `250,7` (deutsches Komma) ist für `Number` keine Zahl und
fällt damit auf den Zeilenwert zurück — geprüft.

**Daily Double:** Die Regel „nur auf Feldern ab 300" meint jetzt den
**tatsächlichen** Wert. Vorher filterte der Code über den Zeilenindex. Eine
100er-Frage, in die der Host 900 einträgt, wäre sonst nie Daily Double
geworden, eine 500er-Frage mit 50 dagegen schon. Der Abzug bleibt die Hälfte
des **Originalwerts** (ohne Verdopplung), jetzt eben des eigenen.

**Sichtbar im Editor:** Ein Feld mit eigenem Wert ist im Gitter unterstrichen
und trägt als `title` „Eigener Punktwert statt 100" — sonst fällt beim
Durchsehen nicht auf, warum da 800 steht.

**Geprüft:** `node check.js --types` ohne Meldung (398 Handler, 209 IDs). Im
Browser **36 Prüfungen, alle grün**, Firebase abgeklemmt (40 Aufrufe):

- Editor: Feld da, leer mit Platzhalter 100; 800 eingetragen → gespeichert,
  Kopfzeile „· 800", Gitterfeld zeigt 800 unterstrichen; leeren stellt 100
  wieder her; `-50`, `0`, `abc`, `250,7` werden alle verworfen.
- Brett: 800 in Feld 1, 50 in der 500er-Zeile, Nachbarn unverändert.
- Overlay zeigt 800 bzw. 50; Gutschrift +800 gebucht; Abzug bei 50 ist 25
  und wurde gebucht.
- GM-Spiegelbrett zeigt 75, die vier Nachbarn weiter 300.
- Daily Double auf einer Frage mit 700: Warnung nennt 1400 und −350, nach
  der Ansage `jeopardyClueValue()` = 1400, Abzug 350, Knopf „+1400".
- **300 Spielstarts gezählt:** Das Daily Double landete auf 15 verschiedenen
  Feldern, darunter 16-mal auf der 900er-Frage in der 100er-Zeile, **nie**
  auf der 50er-Frage in der 500er-Zeile, sonst nur auf Zeilen ab 300.
- JSON-Export/Import trägt `pts` mit; Fragen ohne das Feld nehmen weiter den
  Zeilenwert.

**Ungeprüft:** wie sich sehr lange Zahlen (fünfstellig) im Brett-Kästchen
umbrechen, und das Zusammenspiel mit der Turnier-Wertung.

**Fallstrick:** Ein Testfeld, das im selben Durchlauf schon gespielt wurde,
steht im GM-Spiegelbrett leer da (`.jcell.used`). Eine Prüfung, die dort noch
den Wert sucht, meldet einen Fehler, der keiner ist.

## 2026-09-25 — Goldener Balken im Jeopardy-Logo war weg (`4b9cdfb`)

**Symptom:** David schickte ein Bild vom Jeopardy-Titel: vom Logo standen nur
noch die dunklen Säulen da, der goldene Balken fehlte.

**Ursache:** `STAR_SVG` und `DANGER_SVG` in `js/core.js` bringen ihren
Farbverlauf selbst mit — als `<linearGradient id="sg">` bzw. `id="dg"`.
Dasselbe SVG steht mehrfach im Dokument, sobald eine Menükachel und ein Intro
gleichzeitig existieren. Damit gibt es die id **doppelt**; `url(#dg)` trifft
das **erste** Vorkommen, und das lag im Menü-Screen. Während des Intros ist
der abgeschaltet (`.screen` ohne `.active` → `display:none`), und dort baut
der Browser den Verlauf gar nicht. Der Balken blieb ungefüllt und war auf
schwarzem Grund unsichtbar.

**Nicht neu, nur jetzt aufgefallen.** Die Stelle stammt aus `4ed4cf6`
(2026-09-15, Aufteilung von `index.html`). Zwei andere Stellen hatten
denselben Fehler schon einzeln umschifft: `gameCardIcon` vergibt seit
`022066f` eigene IDs (mit genau dieser Begründung im Kommentar), gab aber
ausgerechnet diese beiden SVGs unverändert zurück; `tournamentGameIcon` baute
sich von Hand eine eigene um, was nur innerhalb des Spielplans half.

**Behoben:** `withOwnGradId(svg, id)` plus `starSvg()` und `dangerSvg()` in
`core.js`. Alle elf Einbindungen (6× Stern in `feud.js`, 1× Gefahr in
`feud.js`, 2× in `jeopardy.js`, 1× in `jeopardy-ui.js`, 2× in `core.js`,
2× in `tournament.js`) gehen jetzt darüber. Die Handumbenennung in
`tournament.js` ist raus, ebenso ihr `uid`-Parameter.

**Geprüft:** `node check.js --types` ohne Meldung. Im Browser **zuerst den
Fehler nachgestellt** (alle Screens abgeschaltet, dann `showJeopardyTitle()`):
Das Bild sah aus wie Davids Screenshot. Nach dem Fix an derselben Stelle
wieder vier Balken, der zweite golden — per Bildschirmfoto bestätigt.
Dazu **6 Prüfungen, alle grün**: Jeopardy-Titel, Jeopardy-Stern-Intro,
Feud-Willkommen, Menükacheln und Turnier-Spielplan zeigen jeweils nur
`url(#…)`-Verweise, die auf einen Verlauf **im eigenen SVG** zeigen und deren
id **im ganzen Dokument einmalig** ist; keine doppelte id mehr im Dokument.
Keine Konsolenfehler.

**Fallstrick für die Zukunft:** Jedes SVG, das seinen eigenen Verlauf
mitbringt und mehr als einmal ausgegeben wird, braucht eine eigene id.
Auffallen tut es erst, wenn die erste Kopie in einem versteckten Element
landet — im sichtbaren Zustand funktioniert der falsche Verweis zufällig.
Neue Logos deshalb über `withOwnGradId` ausgeben.

## 2026-09-25 — Zweite Bühne fürs eigene Intro: „Neon-Nacht" (`5e656a2`)

**Gemacht:** Das eigene Intro (`showCustomIntro`) lief bisher immer auf der
Kellerbühne `#kg`. Jetzt gibt es im Intro-Editor die Auswahl **Bühne** mit
zwei Einträgen: „Kellerbühne (Gold)" wie bisher und **„Neon-Nacht (Retro)"**
— neue Bühne `#kgn` mit Nachthimmel und Sternen, Retro-Sonne mit
Querstreifen, perspektivischem Gitterboden, Horizontlinie, Scanlines und
Leuchtschrift in Cyan/Magenta.

Gewählt wird über `introData.stage` (`'buehne'` / `'neon'`), die Liste steht
als `INTRO_STAGES` in `js/intro.js`. **Feste Schlüssel statt Index**, weil der
Wert gespeichert wird: eine spätere dritte Bühne darf die Reihenfolge ändern,
ohne alte Einstellungen umzudeuten. Unbekannte Werte fallen über
`introStage()` auf die Kellerbühne zurück.

**Alle Funktionen sind identisch:** Kopfzeile, Sekunden je Stufe, bis zu zwölf
Stufen mit je vier Zeilen, Verschieben, Löschen, Vorschau, Export/Import,
Klicken zum Fortfahren. Unterschiedlich sind nur Aussehen und die Bewegung
der Stufen: `knBeat` fährt sie seitlich mit Unschärfe ein und wieder hinaus,
`kgBeat` schiebt sie von unten hoch. Die Taktung kommt weiterhin aus dem
`style`-Attribut, die Bühne liefert nur `animation-name`.

**Warum nicht die Kellerbühne einfach umfärben:** `#kgb` (Geburtstag) macht
genau das und bleibt dadurch erkennbar dieselbe Bühne. David wollte etwas,
das anders *aussieht* — deshalb erbt `#kgn` nichts von `#kg`, sondern bringt
eigene Wand, eigenen Boden, eigene Schrift mit.

**Eine Änderung außerhalb:** `runKgIntro` in `js/feud.js` baut den
Lämpchenrahmen aus der Bühnengröße. Die Neon-Bühne hat bewusst kein `.frame`
— ein Lämpchenrahmen wäre wieder die Kellerbühne. `build()` steigt jetzt bei
fehlendem `.frame` sofort aus; ohne diese Zeile hätte der Zugriff geworfen.
Damit entfallen dort auch die Funken.

**Nachgebessert nach dem ersten Bildschirmfoto:** Die Stufen liegen mitten auf
der Sonne, „HEUTE ABEND" in Cyan auf Orange war nicht lesbar. `.screen` hat
jetzt ein dunkles Oval als Hintergrund (radialer Verlauf), das mit der Stufe
ein- und ausblendet; Kopfzeile, kleine Zeile und Klick-Hinweis haben einen
dunklen Schatten dazubekommen.

**Geprüft:** `node check.js --types` ohne Meldung (13 Dateien, 397 Handler,
209 IDs, 955 Klammernpaare). Im Browser **29 Prüfungen, alle grün:**

- Editor: Auswahl da, Kellerbühne voreingestellt, Hinweiszeile wechselt mit,
  alle 20 Textfelder (5 Stufen × 4) unverändert, Auswahl überlebt das
  Neuladen (`localStorage`).
- Neon: `#kgn` gebaut, `play` gesetzt, kein `.frame` und keine Funken, alle
  sechs eigenen Teile da, 5 Stufen im Markup, letzte Stufe hält,
  `animationName` ist `knBeat`, Verzögerung steht im `style`-Attribut.
- Kellerbühne danach unverändert: `#kg`, 68 Rahmenlämpchen, 12 Funken,
  `kgBeat`, zwei Sterne in der Kopfzeile.
- Klick führt weiter und räumt die Bühne ab (beide Bühnen).
- JSON: Bühne ist im Export; eine alte Datei **ohne** `stage` und eine mit
  unbekanntem Wert landen beide auf der Kellerbühne.
- Bei 400 px: kein Querüberlauf, Schrift auf 50 px, alle vier Zeilen im Bild
  (Bildschirmfoto).
- Keine Konsolenfehler.

**Ungeprüft:** wie es auf dem Beamer im Vollbild wirkt, und das Zusammenspiel
mit `prefers-reduced-motion` (Gitter und Sterne sind dort mit abgeschaltet,
aber nicht nachgemessen).

**Entschieden am 2026-09-26:** David hat die Bühne zuerst in der Liste
„Welches Intro:" gesucht und nicht gefunden — sie steht im Intro-Editor unter
„Kopfzeile & Takt". Auf die Frage, ob sie als eigener Eintrag
(„Eigenes Intro — Neon") in diese Liste soll, hat er **nein** gesagt. Es
bleibt bei der Einstellung im Editor. **Nicht ungefragt umbauen.**

**Fallstrick:** Der Dev-Server einer anderen Session war zwischendurch weg,
`navigate` auf `localhost:3000` schlug fehl. `preview_start` mit dem Namen
aus `.claude/launch.json` startet einen eigenen.

## 2026-09-25 — Ton-Anzeige klein, wenn etwas auf der Leinwand steht (`bd92ad9`)

**Gemacht:** Der Befund aus `22f7fa8` ist behoben. `showSoundFx(kompakt)` in
`js/jeopardy.js` nimmt jetzt einen Schalter; `jeopardyPlaySound` setzt ihn
über den neuen Helfer `jeopardyClueHasVisuals(clue)`. In der kompakten
Fassung (`.jeopardy-sound-fx.compact` in `styles.css`) sitzt die Anzeige
unten rechts, 176 × 64 px, ohne Abdunklung und ohne Weichzeichner über der
Leinwand, mit 7 statt 11 Balken und eigener Pulsfolge `jsfxRingSmall`.

**Regel, bewusst so gezogen:** klein wird es bei **Frage-Bild, aufgedeckten
Schritten, Bilder-Reihe, Staffelbild** und bei gezeigtem Lösungsbild. Ein
bloßer **Fragetext zählt nicht** als Inhalt — bei der klassischen „welches
Geräusch ist das?"-Frage soll der große Effekt den Bildschirm füllen, dafür
ist er da. Solange die Frage noch verdeckt ist, bleibt es ebenfalls groß.

**Warum unten rechts:** oben rechts sitzt schon die Buzzer-Anzeige
(`#jeopardy-buzzer`, z-index 1300).

**Warum eine eigene Pulsfolge:** `jsfxRing` wirft bis zu 90 px Schein. Um
einen 44-px-Ring wäre das nur noch ein Fleck. Eine Animation schlägt
außerdem jede normale Regel, die kleinere `box-shadow`-Angabe im
`.compact`-Block allein hätte also gar nicht gewirkt.

**Geprüft:** `node check.js --types` ohne Meldung (13 Dateien, 918
Klammernpaare). Im Browser bei 1280 × 720, Firebase abgeklemmt (43 Aufrufe),
**20 Prüfungen, alle grün:**

- Schritt-Frage mit zwei aufgedeckten Hinweisen: Anzeige ist `compact`,
  176 × 64 px = 1,6 % der Fläche, sitzt unten rechts, **überlappt keinen
  Schritt**, keine Abdunklung. Bildschirmfoto: beide Hinweise voll lesbar.
- Dieselbe Frage **vor** dem Aufdecken: noch die große Anzeige.
- Reine Tonfrage (nur Text, kein Bild): große Anzeige, füllt 1280 × 720,
  11 Balken, Abdunklung wie bisher.
- Frage mit Frage-Bild: kleine Anzeige, Bild bleibt unverdeckt.
- Stopp entfernt die Anzeige. Keine Konsolenfehler.

**Fallstrick:** Das Browser-Panel war aus einem früheren Test noch auf 297 px
Breite. Eine Prüfung „Anzeige < 25 % der Fensterbreite" schlug deshalb fehl,
obwohl nichts kaputt war — bei 297 px nimmt die kompakte Anzeige eben die
halbe Breite ein. Vor Layout-Messungen die Fenstergröße setzen, nicht
annehmen.

## 2026-09-25 — Soundeffekte neu gebaut + Ton in Schritt-Frage geprüft (`22f7fa8`)

**Gemacht, Teil 1 (Test, nichts geändert):** Ton in einer Schritt-Frage. Über
den Editor eine Frage mit 4 Schritten (Zeile 1+3, Bild 2+4) **und** einem Ton
angelegt, beides trägt dieselbe Frage. **22 Prüfungen, alle grün:** Badges
zeigen 📜 und 🔊, der Ton startet und läuft, während Schritte eingeblendet
werden; das Einblenden zeichnet die Frage neu, der Ton läuft trotzdem weiter
und der Sicht-Effekt überlebt es; Stopp im GM-Panel beendet ihn und lässt die
Schritte stehen; Überspringen beendet ihn ebenfalls. Firebase abgeklemmt
(33 Aufrufe abgefangen), keine Konsolenfehler.

**Befund dabei, nicht behoben:** `.jeopardy-sound-fx` liegt mit `z-index:1050`
über dem Frage-Overlay (1000) und bringt `rgba(5,8,26,.55)` plus
`backdrop-filter: blur(4px)` mit. Bei einer reinen Tonfrage ist das richtig —
es gibt nichts zu lesen. Bei einer **Schritt-Frage** werden damit die schon
eingeblendeten Hinweise abgedunkelt und weichgezeichnet, während der Ton
läuft (im Bildschirmfoto kaum noch lesbar). Vorschlag für später: den
Sicht-Effekt klein an den Rand setzen, sobald die Frage sichtbaren Inhalt hat
(Schritte, Bilder, Text). **Davids Entscheidung, deshalb hier nur notiert.**

**Gemacht, Teil 2 (Code):** Die sechs Spielgeräusche in `js/core.js` neu
gebaut. David: „das hört sich ja an wie liminal horror" — zu Recht. Vorher war
jeder Effekt ein nackter Oszillator, `wrong()` etwa ein Sägezahn, der von 220
auf 110 Hz rutschte. Jetzt:

- **Obertöne.** Ein Ton besteht aus Teiltönen, die schneller ausklingen als
  der Grundton — die Hüllkurve von Glocke und Marimba. Beim Buzzer bewusst
  unharmonisch (2.76, 5.4), das ergibt das „Ding".
- **Hüllkurve ohne Kanten.** Anriss in 12 ms, exponentiell aus. Kein Knacken.
- **Tiefpass** je Ton, der beim Ausklingen mitfährt.
- **Hall** aus künstlich erzeugter Impulsantwort (abklingendes Rauschen,
  1,5 s). Nimmt die Schärfe und setzt alles in denselben Raum.
- **Echte Intervalle:** `correct` C-E-G-C aufwärts, `wrong` eine fallende
  Terz F4→D4 mit dumpfem Schlag statt Schreckmoment, `fanfare` Dreiklang
  hoch und danach der Akkord stehen gelassen.
- **Kompressor** auf dem Summenweg.

Dazu neu im Menü: **„🎧 Töne probehören"** spielt alle sechs nacheinander
(`sfxPreview` in `core.js`, Knopf in `index.html`). Der Knopf sperrt sich für
6,5 s selbst und meldet „🔇 Ton ist aus", wenn der Ton aus ist. Der
An/Aus-Schalter spielt beim Einschalten sofort `point()`, damit hörbar ist,
dass er wirkt.

**Warum erzeugt statt Audiodateien:** kein Build-Step, nichts nachzuladen,
`git push` bleibt der ganze Deploy. Sechs anständige WAV/MP3 wären einige
hundert KB im Repo und müssten lizenzrechtlich sauber sein.

**Geprüft (mit Zahlen):** `node check.js --types` ohne Meldung (13 Dateien,
396 Handler, 208 IDs im Markup). Jeder Effekt einzeln über eine
`OfflineAudioContext` gerendert und gemessen — Spitze / Länge:

| Effekt | Spitze | Länge |
|---|---|---|
| buzz | 0,158 | 0,84 s |
| point | 0,191 | 0,49 s |
| correct | 0,469 | 1,14 s |
| wrong | 0,417 | 0,63 s |
| tick | 0,045 | 0,04 s |
| fanfare klein | 0,653 | 1,45 s |
| fanfare groß | 0,690 | 1,82 s |

Kein Übersteuern, keine Stille, keine NaN. Drei Effekte gleichzeitig
(`fanfare(true)` + `correct` + `buzz`): Spitze 0,693 — der Kompressor fängt
es ab. Im Browser: Knopf da, sperrt sich, gibt nach 6,5 s wieder frei, meldet
bei ausgeschaltetem Ton „🔇 Ton ist aus"; keine Konsolenfehler; bei 400 px
kein Querüberlauf in der Knopfreihe.

**Abgehört und abgenommen:** Ich kann nur messen, nicht hören — beurteilt
habe ich den Aufbau (Obertöne, Hüllkurven, Intervalle, Hall) und den Pegel.
**David hat sie am 2026-09-25 über „🎧 Töne probehören" angehört: „die passen
gut."** Damit sind die Werte in `SFX` der Stand, auf den man sich beziehen
kann. Wer sie ändert, ändert etwas Abgenommenes — Tonhöhen, Längen und
Lautstärken stehen als benannte Werte beieinander und sind leicht zu drehen,
aber nicht ohne Grund.

**Fallstricke:**

- **Der Kompressor hat die Einzeltöne erschlagen.** Mit `knee: 26` und
  `threshold: -16` beginnt die Kompression schon bei −29 dBFS, also unterhalb
  von allem, was hier gespielt wird: gemessene Spitze 0,056 statt der
  gewollten 0,13. Jetzt `threshold: -6`, `knee: 8`, und der Summenweg hebt um
  2,7 an. Bei 3,6 übersteuerte dafür die große Fanfare (1,085), deren vier
  stehende Töne sich addieren.
- `exponentialRampToValueAtTime` darf **nie** auf 0 laufen und nicht von 0
  starten — deshalb überall `.0001` als Ziel und ein `setValueAtTime(.0001)`
  vor dem Anriss.
- Zum Messen lässt sich `window.AudioContext` durch eine Unterklasse von
  `OfflineAudioContext` ersetzen, die `resume()` überschreibt. Aber: `SFX`
  merkt sich den Kontext beim ersten Ton. Für **jeden** Effekt braucht es
  deshalb einen frischen Seitenaufruf, sonst landet alles im selben Rendering
  auf `t=0`.

## 2026-09-25 — Daily Double zusammen mit Schritten getestet (kein Commit)

**Gemacht:** Den offenen Punkt aus `9cfa74f` nachgeholt. Code ist nicht
geändert, es gab nichts zu ändern.

**Aufbau:** Schritt-Frage über den echten Editor auf Feld (Board 1, Spalte 3,
Wert 400) gelegt, Muster `T,B,B,T,B` — Zeile 1+4, Bild 2+3+5. Danach das
Daily Double per `jeopardyState.dailyDoubles[0]` genau auf dieses Feld gesetzt.
Firebase abgeklemmt (38 Aufrufe abgefangen), Popout gezählt, Intro
übersprungen.

**Geprüft — 30 Prüfungen, alle grün:**

- Warnphase: Leinwand zeigt weiter das Board, kein Overlay, Schritt-Zähler 0.
  Im GM-Panel steht die Daily-Double-Warnung, aber **noch kein**
  Schritt-Knopf.
- Ansage ohne gewähltes Team wird abgelehnt („Erst angeben, welches Team das
  Feld gewählt hat"), der Zustand bleibt in der Warnphase.
- Nach Team und Ansage: Rahmen und Banner stehen, Frage noch verdeckt, die
  Schritte sind noch **gar nicht** im Markup — sie tauchen erst beim Aufdecken
  auf.
- Aufgedeckt: 5 Schritte, Muster stimmt, alle verdeckt. Einblenden einzeln,
  Zeile 1 als Text, Schritt 2 als geladenes Bild (240 px Quelle).
- Das Banner überlebt jedes Einblenden — `renderJeopardyClueOverlay` baut es
  bei jedem Schritt neu mit auf.
- GM-Knopf „📜 Nächster Schritt (2/5)" ist da und zählt mit; Klick im Panel
  blendet ein.
- Nur das wählende Team steht im Panel (eine Zeile, „Rot"), Gutschrift **+800**
  (verdoppelt), Abzug **−200** (halber Originalwert, nicht halbiertes Doppel) —
  wie im Kommentar an `jeopardyDeductValue` beschrieben.
- Undo mitten in den Schritten nimmt einen Schritt zurück und lässt Daily
  Double und Banner stehen.
- Punkten: Rot +800, danach ist das Daily Double verbraucht
  (`dailyDoubles[0].done`), `currentIsDaily` wieder false.
- Nächstes Feld: kein Banner, Schritt-Zähler 0, kein Schritt-Block.
- Layout: Banner + Frage + 5 Schritte + Lösung passen zusammen ins Bild
  (Inhalt ≤ 768 px). Bildschirmfoto gemacht.
- Keine Konsolenfehler.

**Ungeprüft:** weiterhin das echte Board-Popout, Ton in einer Schritt-Frage,
der echte Datei-Dialog per Mausklick und Firebase im Echtbetrieb.

**Fallstrick:** Im GM-Panel stehen Teamname und Knopf in getrennten Elementen
(`.sr-name`, `.sr-btn.plus`). Eine Prüfung auf den Text „Rot +800" am Stück
schlägt fehl, obwohl alles stimmt — über `.score-row` zählen statt über den
Fließtext suchen.

## 2026-09-25 — Jeopardy: Frage in Schritten einblenden, Zeile/Bild gemischt (`9cfa74f`)

**Gemacht:** Neuer Schalter **📜 Nacheinander** im Frage-Editor. Eine Frage kann
aus bis zu fünf Schritten bestehen, die der Host einzeln einblendet. Jeder
Schritt ist eine Zeile, ein Bild oder beides — frei gemischt, also z. B. 1+4
Zeile und 2+3+5 Bild. Leere Schritte fallen raus.

- `js/jeopardy.js`: `JeopardyClue` um `steps`, `stepTexts`, `stepImgs`,
  `stepNames`, `stepCount` erweitert; Zustand `stepsRevealed` (in Snapshot,
  Undo und Reset beim Öffnen); Helfer `jeopardyStepCount`, `jeopardyStepItems`,
  `jeopardyStepsHtml`; `jeopardyStepsReveal()`.
- `js/jeopardy-ui.js`: Schalter, Anzahl-Auswahl, je Schritt ein Textfeld und
  ein Bild-Knopf bzw. Thumbnail mit ✕; Badge 📜 im Board-Gitter.
- `js/feud.js`: Knopf „📜 Nächster Schritt (n/5)" im GM-Panel und „📜 Schritt"
  in der Sternleiste, dazu eine Vorschau aller Schritte im Panel — der Host
  liest vor, bevor er zeigt — und der Tag „📜 Nacheinander (n)".
- `styles.css`: `.jeopardy-steps`, `.jeopardy-step`, `-text`, `-img`.

**Warum so:** Erst war es nur „Zeilen"; auf Davids zweite Nachricht hin wurde
daraus ein Schritt, der Zeile **und** Bild tragen kann. Das ist ein Feld mehr
im Editor statt zweier getrennter Betriebsarten, die man nicht mischen könnte.
Gebaut wie die Bilder-Reihe (derselbe Zähler, derselbe Undo, derselbe Knopf),
damit nichts Neues zu lernen ist. Die **Bilder-Reihe bleibt daneben bestehen**:
sie stellt Bilder nebeneinander, die Schritte stapeln untereinander. Text geht
durch `escapeHtml`, Bild-`src` durch `escAttr`. Die Bilder liegen wie `qImg`
als Data-URL in `jeopardyData`, JSON-Export und -Import brauchten keine
Anpassung (geprüft).

**Ein Fund beim Testen:** Fünf Schritte mit drei Bildern schoben die Lösung
aus dem Bild (Inhalt 806 px bei 768 px Fenster, nichts scrollte). Behoben über
`min-height: 0` an Schritt und Bild — ohne das darf ein Flex-Kind nicht unter
seine Inhaltsgröße schrumpfen. Dazu teilen sich die Bilder die Höhe über die
CSS-Variablen `--jstep-n` und `--jstep-imgs`, die `jeopardyStepsHtml` setzt.
Danach: Inhalt 768 px, Lösung sichtbar, nichts scrollt.

**Geprüft:** `node check.js --types` ohne Meldung (13 Dateien, 395 Handler,
256 IDs, 911 Klammernpaare). Im Browser **117 Prüfungen, alle grün**, bei
abgeklemmtem Firebase (144 Schreibversuche abgefangen) und gezähltem Popout
(3 Aufrufe), keine Konsolenfehler.

Zu den Schritten im Einzelnen: Editor legt 5 Text- und 5 Bildfelder an, Muster
`T,B,B,T,B` kommt so im Overlay an; Fokus bleibt beim Tippen im Feld; ✕ nimmt
ein Bild raus, ohne die Zeilen zu verlieren; Einblenden geht eins nach dem
anderen, kein Überlauf über 5, Undo nimmt einen zurück; Zähler ist beim
nächsten Feld wieder 0; eine Frage ohne Schritte zeigt keinen Block.
Fernbedienung: Knopf mit Zähler 0/5 → 1/5, am Ende „✓ Alle Schritte
eingeblendet", Vorschau listet 1.–5., Tag „Nacheinander (5)". Sternleiste
ebenso. Bei 400 px kein Querüberlauf, alle fünf Schritte im Bild
(Bildschirmfoto).

Der übrige Durchlauf: Feud (Antworten, Strikes, Teamwechsel, Runde 2),
Jeopardy (25 Felder, +100, Abzug −100 = halber Wert, Kategorie-Bild in Board
und Overlay, Schätzfrage auf/zu), WWM (15 Stufen, 4 Antworten, alle drei
Joker, Sicherheitsstufe 500 €), WWDS (12 Kategorien, Joker, Punkte,
Teamwechsel), DDF (3 Teilnehmer à 3 Leben, Abstimmung 2:1, Leben ab, nächste
Runde), PIH (Regel „nur drunter": Gebote 50 %, 90 %, 150 % → das 90-%-Gebot
gewinnt, das Gebot drüber zählt nicht), TP (Frage ziehen, richtig → Stück,
falsch → kein Stück), sieben Editoren, Turnier mit sieben startbaren Shows,
zehn Screens bei 1024 px und bei 400 px ohne Querüberlauf, Handy-Buzzer und
Gamepad ohne Konsolenfehler.

**Ungeprüft:** echtes Board-Popout, Daily Double zusammen mit Schritten, Ton
in einer Schritt-Frage, echter Datei-Dialog per Mausklick, Firebase im
Echtbetrieb.

**Fallstricke:**

- **Im versteckten Browser-Panel stehen CSS-Animationen bei 0.** `document.hidden`
  ist dann `true`, und eine gerade eingeblendete Zeile misst `opacity: 0`,
  obwohl die Klasse `shown` sitzt. Das kostete eine Fehlersuche an einer
  Stelle, an der nichts kaputt war. Abhilfe im Test:
  `el.getAnimations().forEach(a => a.finish())` vor dem Messen.
- `updateGMBar()` zeichnet **nur**, wenn `#gm-bar` die Klasse `visible` hat —
  sonst kommt eine leere Leiste zurück und sieht aus wie ein fehlender Knopf.
- Ein Feld, das schon gespielt wurde, lässt sich nicht erneut öffnen
  (`openJeopardyClue` steigt bei `used` sofort aus). Ein Test, der dasselbe
  Feld zweimal nimmt, prüft danach eine leere Frage.
- Die Firebase-Attrappe braucht `firebase.database.ServerValue.TIMESTAMP`,
  sonst wirft `jeopardyBuzzArm`.
- WWM heißt `currentQ`/`removed`/`lifelines`, WWDS-Antworten heißen `answers`
  (nicht `options`), der Jeopardy-Abzug ist die **Hälfte** des Feldwerts.

## 2026-09-25 — Kategorie-Bild in Frage-Overlay und GM-Board getestet (kein Code geändert)

**Gemacht:** Die zwei offenen Prüfpunkte aus `674f8cd` und `6c920bd` im
Browser nachgeholt. Code ist nicht geändert.

**Aufbau:** localhost:3000, Host-Sperre per JS ausgeblendet. Firebase war
abgeklemmt: `firebase.database` lieferte eine Attrappe, `jeopardyBuzzConnect`
und `lockBuzzerJoins` waren leer, 10 Aufrufe wurden abgefangen. Popout und
Intro wurden übersprungen (`startJeopardyActual()`, danach von Hand
`showScreen` + `renderJeopardyBoard`). Das Testbild `logos.png` (300 × 120)
kam über den echten Editor-Knopf in Kategorie 1. Als Name war absichtlich
`Logos "Firmen" <b>x</b>` gesetzt.

**Geprüft:**
- Board-Kopf: `img.jeopardy-cat-img` 183 × 84 px, alt-Text escaped als
  reiner Text.
- Frage-Overlay (`openJeopardyClue(0,0)`, aufgedeckt): `img.jeopardy-clue-cat-img`
  180 × 72 px, vollständig geladen, per Screenshot sichtbar über „100“ und
  der Frage. In der GM-Kopfzeile „Frage verdeckt · Name · Wert“ steht der Name
  escaped.
- GM-Spiegel-Board im iframe nach dem Überspringen: 1 × `img.jcat-img`
  111 × 34 px in Spalte 1, die anderen vier Spalten mit Namen. Das benutzte
  Feld 100 ist leer. Per Screenshot geprüft.
- Keine Konsolenfehler. Danach neu geladen, es bleibt nichts zurück.

**Ungeprüft:** das echte Board-Popout (`window.open`, spiegelt das DOM des
Hauptfensters, sollte also dasselbe zeigen), ein Daily Double mit
Kategorie-Bild, die Handy-Breite, der echte Datei-Dialog.

**Fallstricke:** Nach `startJeopardyActual()` ohne Intro liegen der
`.black-backdrop` und das GM-iframe (`#gm-embed-overlay.visible`) über dem
Hauptfenster. Ein Screenshot zeigt dann nur Schwarz bzw. die Fernbedienung.
Beides muss für den Test weg, die Backdrop ist eine **Klasse**, keine ID.

## 2026-09-25 — Jeopardy-Editor: Upload-Knopf für Kategorie-Bild (`6c920bd`)

**Gemacht:** In `renderJeopardyEditor()` (`js/jeopardy-ui.js`) steht unter dem
Namensfeld jeder Kategorie ein kleiner Knopf „🖼 Bild“ (verstecktes
`<input type="file">`, ruft `jeopardyEditCatImg(b, col, this)`). Ist ein Bild
gesetzt, ersetzt ihn ein Thumbnail (`.jimg-thumb`, mit Hover-Vorschau über
`data-preview-name`) plus ✕, das `jeopardyClearCatImg(b, col)` aufruft. Damit
ist der offene Punkt aus `674f8cd` erledigt.

**Warum so:** Knopf und Thumbnail wechseln sich ab, statt nebeneinander zu
stehen. Bei fünf Spalten ist der Kopf schmal, zwei Elemente pro Zeile hätten
umgebrochen. Für ein anderes Bild erst ✕, dann neu hochladen. Optik von den
Frage-Bild-Knöpfen übernommen, nur kleiner. Das `src` des Thumbnails läuft
durch `escAttr`, wie im Board-Kopf. Das Namensfeld bleibt stehen, weil der
Name der alt-Text ist und der Host ihn weiter sieht.

**Geprüft:** `node check.js --types` meldet „alles in Ordnung“ (13 Dateien
ohne Meldung, 387 Handler statt 385, 256 IDs, 905 Klammernpaare). Im Browser
(localhost:3000, Host-Sperre per JS ausgeblendet): ein erzeugtes PNG
`logo-test.png` über den echten `change`-Handler in Kategorie 2 von Board 1
geladen. Danach hatte `cat.img` eine Data-URL, `imgName` war „logo-test.png“,
es gab 1 Thumbnail und 9 statt 10 Upload-Knöpfe, und
`jeopardyCatHeadHtml` lieferte das `<img>`. Das ✕ angeklickt: `img` und
`imgName` waren weg, wieder 10 Knöpfe und 0 Thumbnails. Keine Konsolenfehler.
Screenshot zeigte das Thumbnail sauber im Kopf.

**Ungeprüft:** ein echter Datei-Dialog mit Klick, Handy-Breite des Editors,
und aus `674f8cd` weiterhin das Frage-Overlay und das GM-Spiegel-Board mit
Bild.

**Fallstricke:** Port 3000 war vom Dev-Server einer anderen Session belegt.
Der served denselben Ordner mit `-c-1`, deshalb reichte
`preview_start` mit `url: http://localhost:3000`, ohne eigenen Server.
`jeopardyData` wird nirgends automatisch gespeichert (nur Export/Import),
Tests im Editor hinterlassen also nichts.

## 2026-09-25 — Jeopardy: Bild als Kategorie-Name, nur Anzeige (`674f8cd`)

**Gemacht:** `JeopardyCategory` hat zwei neue optionale Felder, `img` (Data-URL)
und `imgName`. Der neue Helfer `jeopardyCatHeadHtml(cat, imgClass)` in
`js/jeopardy.js` liefert das Bild, wenn eins gesetzt ist, sonst wie bisher den
escapten Namen. Er wird an drei Stellen benutzt: im Board-Kopf
(`.jeopardy-cat.has-img` / `.jeopardy-cat-img`), im Frage-Overlay
(`.jeopardy-clue-cat-img`) und im gespiegelten Board der GM-Fernbedienung
(`.jcat-img` im Inline-CSS in `feud.js`). Außerdem gibt es
`jeopardyEditCatImg(b, col, input)` und `jeopardyClearCatImg(b, col)` in
`js/jeopardy-ui.js`.

**Warum so:** Der Name bleibt als Feld erhalten. Er ist der alt-Text des Bilds,
und der Host sieht ihn weiter im Editor und in der Zeile „Frage offen · Name ·
Wert“ der Fernbedienung, weiß also, was hinter dem Bild steckt. `object-fit:
contain` statt `cover`, damit von Logos oder Motiven nichts abgeschnitten wird,
das zum Erraten gebraucht wird. Das Bild liegt wie `qImg` als Data-URL in
`jeopardyData`, deshalb funktionieren JSON-Export und -Import ohne Anpassung.
Das `src` läuft durch `escAttr`, weil importierte JSON-Dateien beliebigen Text
enthalten können.

**Geprüft:** `node check.js --types` meldet „alles in Ordnung“ (13 Dateien ohne
Meldung, 385 Handler, 256 IDs, 905 Klammernpaare). Im Browser mit einem Testbild
in Kategorie 1: Der Board-Kopf zeigt das Bild in 181 × 83 px, alt-Text
„Logos“. Ein Name mit `"` und `<b>` erscheint escaped als Text. Die Spalten ohne
Bild sehen aus wie vorher.

**Ungeprüft:** das Frage-Overlay mit Bild, das GM-Spiegel-Board mit Bild und die
Handy-Breite.

**Offen:** **Im Editor fehlt der Upload-Knopf.** Die Funktionen sind fertig, es
fehlt nur ein `<input type="file">` im Kategorie-Kopf von
`renderJeopardyEditor()`, das `jeopardyEditCatImg(b, col, this)` aufruft, dazu
ein Thumbnail mit ✕ für `jeopardyClearCatImg`. Bis dahin kommt ein Bild nur
über eine importierte JSON-Datei ans Board.

**Fallstricke:** Beim Einbau des Editor-Knopfs brach die Session zweimal ab, der
Knopf ist deshalb nicht von hier. Die Host-Seite hat eine Passwort-Sperre
(`#host-gate`). Wer im Browser testet, meldet sich vorher selbst an.

---

## 2026-09-25 — Zweiter Komplettdurchlauf (kein Commit, reiner Test)

**Gemacht:** Alles erneut durchgetestet, inklusive der neuen Turnier-Eintragung
für die teamlosen Shows. Nichts geändert.

**Ergebnis:** `node check.js --types` ohne Befund (13 Dateien, 385 Handler, 256
Element-IDs). Im Browser **77 Prüfungen, alle grün**, bei abgeklemmtem Firebase
(97 Schreibversuche abgefangen) und gezähltem Popout (16 Aufrufe). Keine
Konsolenfehler auf Hostseite, Handy und Gamepad. Bei 400 px kein Querüberlauf
auf zehn Screens.

Neu gegenüber dem ersten Durchlauf: alle **vier Wege der Turnier-Eintragung**
geprüft — Team-Show automatisch (TP: Rot 2 / Blau 6), teamlos mit Zuordnung
(DDF: Rot 4 / Blau 0 aus übrigen Leben), teamlos mit Gast ohne Account (PIH:
Rot 4 / Blau 1, Gast namentlich ausgewiesen), teamlos ohne jede Zuordnung
(Zeile unberührt, Platz frei, Grund am Bildschirm). Gesamtwertung rechnet:
🥇 Rot 5 · 🥈 Blau 4.

**Zwei Fallstricke dazugelernt:**

- Ein Testlauf, der vier Shows nacheinander mit ihren Intros durchklickt,
  braucht über 80 s und läuft in die 45-s-Grenze des Werkzeugs. Für
  Zustandstests die Show starten und dann direkt
  `showScreen(...)` + `render...()` aufrufen — die Intros sind separat geprüft.
- Bei „Der Preis ist heiß" kann es unter der Regel „nur drunter zählt"
  **keinen** Sieger geben (im Test: Eis für 1,80 €, alle Gebote drüber). Eine
  Prüfung, die stur einen Sieger erwartet, meldet dann einen Fehler, der keiner
  ist.

---

## 2026-09-25 — Teamlose Shows ins Turnier eintragbar (`b0ca45c`)

**Gemacht:** „Der Dümmste fliegt" und „Der Preis ist heiß" tragen ihr Ergebnis
jetzt selbst ins Turnier ein, statt dass der Host Zahlen in einen `prompt()`
tippt.

**Wie:** Die Brücke gab es schon — jeder Spieler-Account trägt eine
Team-Zuordnung aus der Lobby („Teams zuteilen"). `tournamentReportTeamless()`
rechnet das Einzelergebnis darüber auf die Turnier-Teams hoch.

- DDF: **übrige Leben** je Team. Belohnt Durchhalten statt nur den einen Sieg
  und ergibt bei mehreren Teilnehmern pro Team eine Zahl statt eines Namens.
- PIH: **Punkte** je Team, aufsummiert.

Gäste ohne Account haben keine Zuordnung. Sie fallen nicht unter den Tisch,
sondern werden **namentlich gemeldet** — der Host sieht, dass ihre Punkte
fehlen. Hat *niemand* eine Zuordnung, wird nichts eingetragen: dann wäre jede
Zahl geraten. Platz freigeben, Grund auf den Bildschirm.

**Eigener Fehler gefunden:** In `24556f7` ist die PIH-Zeile
`tournamentReleaseActive()` in der **falschen Funktion** gelandet — in
`pihRenderBidGrid` statt in `pihFinish`. Sie lief bei jedem Aufbau des
Endstand-Gitters statt einmal am Spielende. Folgenlos, weil der Platz so oder
so frei wurde, aber falsch. Mein Test damals hat nur DDF geprüft, nicht PIH.
**Lehre:** eine Ersetzung, die auf `const rank = [...]` ankert, trifft in
`pih.js` zwei Stellen — vor dem Einfügen prüfen, in welcher Funktion man
landet.

**Geprüft:** `node check.js --types` ohne Befund. Turnier mit Rot (Anna, Ben)
und Blau (Clara, David): DDF → Rot 4 / Blau 0 mit Bericht und freiem Platz;
PIH mit einem Gast ohne Account → Rot 8 / Blau 3, Gast namentlich als nicht
gezählt gemeldet; ohne jede Zuordnung → Zeile unberührt, Platz frei, Hinweis
„keine Team-Zuordnung gefunden". Keine Konsolenfehler.

---

## 2026-09-25 — Komplettdurchlauf (kein Commit, reiner Test)

**Gemacht:** Alles einmal durchgetestet, nichts geändert.

**Ergebnis:** `node check.js --types` ohne Befund (13 Dateien, 385 Handler, 256
Element-IDs, 902 Klammernpaare). Im Browser **61 Prüfungen, alle grün** — bei
abgeklemmtem Firebase (68 Schreibversuche abgefangen, keiner ging raus) und
gezähltem statt geöffnetem Popout (7 Aufrufe).

Durchgespielt: Feud (Intro-Kette, 5 Antwortfelder, Punkte, Strikes, Runde 2),
Jeopardy (25 Felder, Buzzer scharf, Punkte +100, Abzug −50, Schätzfrage sendet
`text:true`), WWM (15 Stufen, 4 Antworten), WWDS (12 Kategorien, auflösen),
DDF (Abstimmung, Verlierer, Leben ab, Zähler „3 noch dabei"), PIH (drei
Gebote, Regel „nur drunter" korrekt: Preis 161,88 € → Anna mit 100 gewinnt,
200 und 300 sind drüber), TP (Zeiger trifft die gezogene Kategorie, Stück,
Nachfassen, Sieg), Turnier (alle sieben startbar, Hinweis nur bei den zwei
teamlosen), alle vier Intro-Varianten plus „aus", acht Editoren, Handy-Client
(Bereitschaftsring, grüner Buzzer, Ausschlag, Tastaturwechsel, Parser,
gestaffelte Abstimmung, Lobby-Zustände), Gamepad. Keine Konsolenfehler auf
allen drei Seiten. Bei 400 px kein Querüberlauf auf sechs geprüften Screens.

**Fallstrick für den nächsten Durchlauf:** Der Testlauf selbst produziert
Fehlalarme, wenn man nicht aufpasst.

- Stern-Intro und Schwarzpause haben **dieselbe** Klasse `.intro-overlay` und
  liegen übereinander. `querySelector` trifft das untere — durchklicken muss
  immer das **letzte** Element der Liste anklicken.
- `showClickOverlay` nimmt vor Ablauf seiner 1,8 s keinen Klick an.
- Zwischen zwei Shows müssen Overlays und Backdrop weg, sonst zeigt das
  GM-Panel „Zwischensequenz läuft" statt der Show.
- Container-IDs **nicht raten**: es heißt `ddf-editor` und `pih-editor`, aber
  `jeopardy-editor-grid`, `wwm-editor-grid`, `wwds-editor-grid`,
  `tp-editor-grid`, `intro-editor-grid`. Vier meiner Fehlschläge waren nur das.

---

## 2026-09-25 — Alle acht Shows im Turnier startbar (`24556f7`)

**Gemacht:** `TOURNAMENT_STARTABLE` kennt jetzt alle sieben Spiel-Shows statt
drei. Dazu die fehlenden Typen in der Auswahlliste (Der Preis ist heiß,
Trivial Pursuit), Gewichtungen und Symbole.

**Zwei Klassen beim Ergebnis — und das steht auch in der Zeile:**

*Wer weiß denn sowas* meldete sein Ergebnis schon immer (`js/wwds.js:492`), war
aber nicht startbar. Reine Lücke, eine Zeile.

*Trivial Pursuit* meldet jetzt auch. Gewertet wird die **Zahl der
Tortenstücke**, nicht nur Sieg oder Niederlage: ein Team mit fünf Stücken hat
mehr geleistet als eines mit einem, und die Gesamtwertung rechnet mit Punkten.

*Der Dümmste fliegt* und *Der Preis ist heiß* können **nicht** automatisch
eintragen — sie kennen Teilnehmer, keine Teams, und ein Turnier läuft über
feste Teams. Sie sind trotzdem startbar; der Host trägt das Ergebnis von Hand
ein. Der Hinweis steht direkt in der Spielplan-Zeile, nicht in einer Fußnote,
damit niemand vergeblich darauf wartet, dass sich der Plan von selbst füllt.

**Der Fehler, den das sonst gebaut hätte:** `activeTournamentGameIndex` wird
beim Start gesetzt und nur von `tournamentAutoRecordIfActive` gelöscht. Eine
teamlose Show hätte ihn stehen lassen — und die nächste Show, die ein Ergebnis
meldet, hätte es in **deren** Zeile geschrieben. Das fällt erst beim Blick auf
die Gesamtwertung auf, und dann weiß niemand mehr, woher die Zahl kam. Dafür
gibt es jetzt `tournamentReleaseActive()`, das beide am Spielende aufrufen.

**Geprüft:** `node check.js --types` ohne Befund. Turnier mit zwei Teams und
den vier Shows angelegt: alle vier mit Startknopf, die beiden teamlosen
zusätzlich mit Hinweis. TP aus dem Spielplan gestartet (Platz 3), Sieg
erzwungen — Ergebnis automatisch drin (Team Rot 3, Team Blau 6 Stücke), Platz
wieder frei. DDF aus dem Spielplan gestartet (Platz 1) und beendet — Platz
freigegeben, Zeile unberührt. Keine Konsolenfehler.

---

## 2026-09-25 — Intro-Auswahl auf dem Turnier-Screen (`7a1cf27`)

**Gemacht:** Der Intro-Block wandert jetzt auch auf den Turnier-Screen. Ein
Platzhalter mehr im Markup, ein Eintrag mehr in `INTRO_SLOTS`.

**Warum:** Der Turniermodus schickt den Host auf den Setup-Screen des
jeweiligen Spiels (`tournamentStartGame` → `showScreen(TOURNAMENT_STARTABLE…)`),
dort steht die Auswahl seit `7383900` ohnehin — das Intro lief also schon.
Was fehlte, war die Auswahl an der Stelle, an der der Host den Abend **plant**,
bevor er das erste Spiel öffnet.

**Geprüft:** `node check.js --types` ohne Befund. Der Block landet im
Platzhalter und überlebt `renderTournament()` — der zeichnet nur
`#tournament-content` neu, der Platzhalter ist ein Geschwisterelement. Auf dem
Turnier-Screen „Geburtstag" eingestellt, dann auf den Feud-Setup gewechselt:
Einstellung steht dort. Danach der ganze Weg: „Eigenes Intro" auf dem
Turnier-Screen gewählt, auf den Setup-Screen gewechselt (das macht
`tournamentStartGame`) und gestartet — Stern, dann die eigene Bühne mit fünf
Stufen. Weiterhin genau ein Block im Dokument. Keine Konsolenfehler.

**Offen:** `TOURNAMENT_STARTABLE` kennt nur Family Feud, Jeopardy und Wer wird
Millionär. Die fünf neueren Shows lassen sich aus dem Turnier **gar nicht**
starten — eigene Baustelle, nicht Teil dieser Änderung.

---

## 2026-09-25 — Intro-Auswahl für alle acht Shows (`7383900`)

**Gemacht:** Eine Intro-Auswahl, die auf jedem Setup-Screen steht. Vier
Varianten: Keller Gameshow, Keller Gameshow Tag 2, Geburtstag, Eigenes Intro.
Die eigene Jeopardy-Zeile für das Tag-2-Intro fällt weg — es ist jetzt eine
Variante wie die anderen.

**Warum so — ein Block, der wandert:** Der Bedienblock steht genau **einmal**
im Dokument (`#intro-pick`) und wird beim Screenwechsel in den Platzhalter des
offenen Setup-Screens verschoben (`moveIntroPickerTo`, aus `showScreen`).

Acht Kopien wären der naheliegende Weg gewesen und der falsche: dann gäbe es
acht Mal dieselben IDs, ein `getElementById` träfe immer nur die erste, und was
der Host auf dem einen Screen einstellt, stünde auf dem nächsten nicht drin.
Ein verschobener Block hat von sich aus überall denselben Stand.

`runIntroThen(onDone)` spielt das eingestellte Intro und ruft danach den
Rückruf; ohne Auswahl geht es ohne Umweg weiter. Jede Show ruft das an der
Stelle auf, an der sie sonst direkt ihren Bildschirm gezeigt hätte. Bei den
drei neuen Shows läuft es **vor** dem Show-Zeichen, danach wie gehabt Anleitung
und Titelkarte.

`toggleIntroPicker` ist von `feud.js` nach `intro.js` gezogen — Intro-Bedienung,
keine Feud-Logik. Die Auswahl überlebt jetzt das Neuladen (`introChoice` im
localStorage); ohne das müsste der Host sie vor jeder Show neu setzen.

**Geprüft:** `node check.js --types` ohne Befund, 13 Dateien. Der Block landet
in allen sieben Setup-Screens und steht dabei genau einmal im Dokument. TP mit
„Eigenes Intro": erst die Bühne, nach dem Klick das TP-Zeichen. WWM mit „Keller
Gameshow": Bühne, dann der Spielbildschirm. WWDS mit ausgeschaltetem Intro:
direkt der Spielbildschirm, keine Bühne. Auswahl nach Neuladen erhalten.
Keine Konsolenfehler.

---

## 2026-09-25 — Eigenes Intro, frei befüllbar (`beedc12`)

**Gemacht:** Dritte Intro-Variante „Eigenes Intro" neben Keller Gameshow und
Geburtstag. Neue Datei `js/intro.js` mit Daten und Editor, neuer Screen
`intro-edit-screen`. Je Stufe vier freiwillige Zeilen (kleine Zeile darüber,
groß in Gold, groß in Pink, kleine darunter), dazu Kopfzeile und Sekunden je
Stufe. Stufen anlegen, löschen, verschieben; Export/Import als JSON; Vorschau
ohne Spielstart.

**Warum:** Die beiden festen Intros stehen als Markup im Code — für einen
anderen Namen, ein anderes Datum oder einen anderen Preis musste man die Datei
anfassen.

**Zwei Entscheidungen:**

Die Bühne benutzt dieselbe id wie das Keller-Intro (`#kg`). Daran hängen alle
Bühnenstile; sie ein zweites Mal unter anderem Namen zu führen hieße, sie ab
jetzt doppelt zu pflegen. Es läuft immer nur ein Intro, die id ist nie zweimal
im Dokument.

Die Taktung steht **nicht** im Stylesheet: dort ist sie fest auf sieben Stufen
verdrahtet (`.s1`–`.s7` mit ausgerechneten Verzögerungen). Hier ist die Zahl
der Stufen frei, also rechnet JavaScript sie aus und schreibt sie ins
`style`-Attribut. Im Stylesheet steht nur noch, *welche* Animation läuft.

**Geprüft:** `node check.js --types` ohne Befund, 13 Dateien. Über echte
Klicks bis in den Editor; eigene Daten eingetragen (Name, Datum, Teams) und
abgespielt: Kopfzeile auf der Bühne, vier Stufen mit 0,3 / 3,3 / 6,3 / 9,3 s,
letzte hält, leere Zeilen fielen weg (Stufe 1 zwei Absätze, Stufe 2 drei).
Klick beendet und ruft den Rückruf. Keine Konsolenfehler.

**Offen:** Das eigene Intro hängt am Feud-Setup (dort steht die
Intro-Auswahl). Jeopardy hat seine eigene Intro-Option (`enable-jeopardy-intro`
→ Tag-2-Bühne) und kennt die Variante noch nicht. Die anderen sechs Shows
haben gar keine Intro-Auswahl.

---

## 2026-09-25 — Cache-Buster beim Deploy (`3316c2e`)

**Gemacht:** Der Pages-Workflow hängt die ersten acht Stellen der Commit-ID
als `?v=` an `styles.css` und alle zwölf `js/`-Dateien in `index.html`. Das
Beamer-Popout nimmt die CSS-Adresse jetzt aus dem `<link>` des Hauptdokuments
statt aus einem festen Pfad.

**Warum:** `index.html` wird beim Besuch neu geholt, die verlinkten Dateien
aber aus dem Cache. Wer die Seite schon einmal offen hatte, sah eine fertige
Änderung nicht — hier **zweimal** passiert: erst blieb der neue Stilblock des
TP-Setups aus, dann fehlten Intro und Anleitung der neuen Shows. Beide Male
war der Code live, nur der Browser hielt die alte Fassung.

Das Popout musste mit: mit Version wäre `styles.css` ohne Parameter eine
*andere* Adresse, und das Popout hätte die alte Fassung aus dem Cache gezogen,
während das Hauptfenster die neue zeigt.

Geändert wird nur die ausgecheckte Kopie im Workflow-Lauf, nicht das Repo — im
Verzeichnis stehen weiter saubere Pfade.

**Geprüft:** `node check.js --types` ohne Befund. Die `sed`-Zeilen des
Workflows gegen eine Kopie von `index.html` laufen lassen: 13 Pfade
umgeschrieben, Form `js/core.js?v=deadbeef`. Popout-Zeile im Browser
nachgestellt: ohne Version `styles.css`, mit Version `styles.css?v=deadbeef`.

**Nebenbefund zum Intro:** Der Vorwurf „die haben kein Intro" ließ sich nicht
bestätigen — „Der Dümmste fliegt" komplett über echte Klicks gestartet
(Menükarte → + Gast → Namen → Spiel starten): Popout-Aufruf, Intro-Zeichen,
schwarzer Grund, fünf Anleitungsfolien. Der Live-Stand enthält den Code
ebenfalls (per `curl` gegen iryogameshows.github.io geprüft).

**Aber:** die Anleitung läuft im Hauptfenster und auf dem Beamer-Popout — und
das **GM-Overlay legt sich im Hauptfenster darüber** und zeigt nur
„Zwischensequenz läuft · Weiter". Wer am Hauptrechner sitzt und kein
Popout-Fenster hat (Popup-Blocker!), sieht vom Intro also nichts. Das ist bei
Feud und Jeopardy genauso. **Offen:** ob das der Grund war — bei David
nachgefragt, noch keine Antwort.

---

## 2026-09-24 — HANDOFF-Regel festgeschrieben (`c3afa5f`)

**Gemacht:** Die Pflicht, `HANDOFF.md` bei jeder Änderung mitzuschreiben,
steht jetzt ausdrücklich in beiden `CLAUDE.md` (Projekt und `Coding/`). Die
sechs Einträge ohne Commit-Hash haben ihren nachgetragen, und die Datei weist
oben aus, mit welchem Commit sie angelegt wurde.

**Warum:** Inhaltlich war alles erfasst, aber sechs von acht Einträgen hatten
keinen Hash — sie entstanden jeweils **vor** dem Commit, da war er noch nicht
bekannt. Die Regel nennt deshalb die Reihenfolge, die das löst: Code
committen, Hash ablesen, Eintrag damit schreiben und als eigenen kleinen
Commit hinterherschicken. Lieber ein Commit mehr als ein Eintrag ohne Hash.
Dieser Eintrag hier ist genau dieser Fall.

Zweiter Punkt der Regel: in der Antwort ausdrücklich sagen, dass es in der
`HANDOFF.md` steht. Die Datei ist sonst unsichtbar, und ob sie gepflegt wurde,
lässt sich von außen nicht nachhalten.

**Geprüft:** `node check.js` ohne Befund (Markdown berührt ihn nicht, aber der
Lauf gehört zum Schritt). Alle acht Einträge tragen jetzt einen Hash, alle
neun Commits seit `36cdbc5` sind abgedeckt.

---

## 2026-09-24 — GM-Panels für die drei neuen Shows (`ed25b18`)

**Gemacht:** „Der Dümmste fliegt", „Der Preis ist heiß" und Trivial Pursuit
haben jetzt ein eigenes Gamemaster-Panel. Es öffnet beim Start, noch vor dem
Intro, und die Fernsteuerung vom Handy-Gamepad kennt ihre Funktionen.

**Warum das vorher fehlte — und warum das falsch war:** Ich hatte sie bewusst
weggelassen, weil `updateGamemaster()` sonst auf den Feud-Zweig zurückfällt.
Der Schluss daraus war falsch: nicht „dann kein GM-Fenster", sondern „dann ein
eigener Zweig". Ohne Panel ist die Show nur am Hauptrechner moderierbar, denn
`gamepad/index.html` spiegelt genau dieses Fenster. Das GM-„Fenster" ist
übrigens kein Popup, sondern das eingebettete iframe `gm-embed-frame` — es
lässt sich deshalb direkt aus der Seite heraus prüfen.

**Aufbau:** Je Spiel `xGmControlsHtml(pfx)` für die Knopfleiste und
`updateGamemasterX()` für das Dokument, wie `wwdsControlsHtml` /
`updateGamemasterWwds`. Dispatch in `updateGamemaster()` vor dem Feud-Rückfall.

Die Lösung steht im GM-Fenster **immer**, auch solange sie auf der Leinwand
verdeckt ist — DDF die Antwort, PIH der echte Preis, TP die Antwort. Sonst
kann der Host nicht urteilen.

Gäste ohne Handy sind vom GM aus bedienbar: DDF stimmt über
`ddfHostVote(voterUid, candUid)` ab, PIH über das neue
`pihHostBidValue(uid, value)`. Nötig, weil `pihHostBid(i)` seinen Wert aus
einem Eingabefeld im **Hauptfenster** liest — das gibt es im GM-Fenster nicht.

**Geprüft:** `node check.js --types` ohne Befund. Alle drei Shows gestartet,
durchs Intro geklickt und **aus dem GM-Fenster heraus gespielt**: TP gedreht,
Frage gezogen, falsch geurteilt → Nachfassen mit Knopf je Gegner; DDF
aufgedeckt und zur Abstimmung, neun Gast-Stimmknöpfe (3 Wähler × 3
Kandidaten); PIH Gebote geöffnet, drei Gast-Eingabefelder, echter Preis im GM
sichtbar und auf der Leinwand leer. Keine Konsolenfehler.

---

## 2026-09-24 — Popout und Intros für die drei neuen Shows (`022066f`)

**Gemacht:** „Der Dümmste fliegt", „Der Preis ist heiß" und Trivial Pursuit
öffnen jetzt das Zuschauerfenster und haben Intro, Anleitung und Titelkarte
wie Feud und Jeopardy. Dazu ein Tutorial-Knopf auf jedem Setup-Screen.

**Was fehlte:** `openBoardPopout()` wurde nur aus `startGame`, `startJeopardy`,
`startWwds` und `startWwm` gerufen — die drei neuen Shows nie. Und sie sprangen
ohne ein Wort auf den Spielbildschirm; die Regeln musste der Host ansagen.

**Warum so:**

Der Ablauf ist derselbe wie bei den alten Shows: Zeichen → Anleitung →
Titelkarte → Spiel, alles über `runTutorial` und `showClickOverlay`, die es
schon gab. Kein `openGamemaster()` für die drei: sie haben kein GM-Panel, und
`updateGamemaster()` fällt sonst auf den Feud-Zweig zurück — das Fenster zeigte
einen Stand, der gar nicht läuft.

Die Anleitungen lesen die **echten** Einstellungen: DDF zeigt die eingestellte
Zahl Leben als Herzen, PIH nur die aktive Regel (beide nebeneinander wäre
bequemer, aber genau daraus entsteht am Tisch der Streit), TP die echten
Kategorien in ihren Farben und die gesetzten Regeln.

Die Ausblendliste im Popout hinkte ebenfalls hinterher: WWDS, DDF, PIH und TP
fehlten samt Editoren, dazu Spielerliste, Turnier, Notizen und Bestenliste.
Wechselte der Host während der Show dorthin, stand das auf der Leinwand.

**Gefundener Fehler:** `gameCardIcon()` vergab die Verlaufs-ID fest als
`cg_<key>`. Sobald dasselbe Symbol zweimal im Dokument steht — genau das machen
die neuen Intros — trifft `url(#cg_tp)` immer das **erste** Vorkommen. Das lag
im versteckten Menü, die Füllung löste zu `none` auf und vom Symbol blieb ein
Punkt übrig. Jetzt zählt ein Zähler hoch.

**Geprüft:** `node check.js --types` ohne Befund. Alle drei Shows durchgespielt
(Firebase abgeklemmt, `window.open` gezählt statt geöffnet): je ein Popout, ein
Intro-Zeichen mit schwarzem Grund, fünf Anleitungsfolien mit fünf Punkten,
Titelkarte, dann der Spielbildschirm und der Grund blendet aus. DDF zeigt sechs
Herzen auf zwei Beispielkarten, PIH die Regel „Nur drunter zählt" mit drei
Geboten, TP sechs Kategorie-Chips. Tutorial-Knöpfe auf allen drei
Setup-Screens vorhanden. Keine Konsolenfehler.

**Fallstrick:** `showClickOverlay` nimmt vor Ablauf seiner Verzögerung (1800 ms)
keinen Klick an. Beim Testen erst warten, sonst sieht es aus, als hinge die
Titelkarte.

---

## 2026-09-24 — DDF-Wertung, eigene Kategorien in Trivial Pursuit (`52700f0`)

**Gemacht:** Die Spielerleiste bei „Der Dümmste fliegt" sortiert jetzt
Ausgeschiedene nach hinten, hebt das letzte Herz hervor und zählt, wie viele
noch dabei sind. In Trivial Pursuit sind die Kategorien frei: Anzahl (3–8),
Farbe, Zeichen und Name.

**Warum:**

DDF wird **nicht** nach Leben sortiert, nur nach drin/raus. In diesem Spiel
entscheidet die Abstimmung, nicht der Punktestand — eine Rangfolge nach Herzen
wäre eine Aussage, die das Spiel gar nicht macht. Innerhalb einer Gruppe
entscheidet die ursprüngliche Reihenfolge, sonst tauschen zwei Gleichstehende
nach jeder Runde grundlos die Plätze. Das letzte Herz bekommt einen wärmeren
Rand, nicht den roten — Rot ist für `.picked` reserviert, den Rauswurf.

TP rechnet überall mit `tpCatCount()` statt mit einer festen Zahl; Rad, Torte,
Vorschau und „x von y" gehen mit. Grenzen 3 und 8: darunter bleibt vom Spiel
nichts übrig, darüber wird das Rad unlesbar. **Neue Startprüfung:** eine
Kategorie ohne Frage kann das Rad zwar treffen, aber nie vergeben — das
Tortenstück bliebe für immer leer und niemand könnte gewinnen. `startTp()`
weigert sich jetzt und nennt die betroffenen Kategorien.

**Geprüft:** `node check.js --types` ohne Befund. DDF mit sechs Teilnehmern:
Reihenfolge Anna, Ben (letztes Herz), David, Frieda, dann Clara und Emil als
ausgeschieden; Zähler „4 noch dabei". TP: hinzufügen, Farbe ändern, löschen bis
zur Untergrenze (Knopf dann gesperrt), Überschrift und Vorschau folgen. Spiel
mit **vier** Kategorien gestartet: vier Radsegmente, vier Tortensektoren, vier
Stücke je Team, und nach der Drehung steht der Zeiger auf genau der gezogenen
Kategorie. Start mit leerer Kategorie wird abgelehnt. Auslieferungszustand nach
`localStorage`-Reset weiterhin sechs Kategorien. Keine Konsolenfehler. Firebase
abgeklemmt.

**Fallstricke:** Zwei CSS-Regeln griffen nicht, weil etwas Spezifischeres
davorstand — `.panel-head` ist außerhalb des Lobby-Kastens `display:block`
(Zähler und Löschknopf rutschten unter die Zeile), und die allgemeine
Editor-Regel für Eingabefelder drückte dem Farbwähler `11px 14px` Polster auf,
sodass vom Farbfeld ein Strich übrig blieb. Beides mit höherer Spezifität
gelöst, nicht mit `!important`. Merke: im Editor immer die *berechneten* Werte
nachsehen, bevor man an der eigenen Regel zweifelt.

---

## 2026-09-24 — Wertung bei „Der Preis ist heiß" (`29c668f`)

**Gemacht:** Die Punkteleiste ist eine Rangliste geworden: nach Punkten
sortiert, mit Platzziffer, Krone für die Spitze, graue Null statt goldener.
Aus den Kästen sind Pillen geworden, darunter eine Trennlinie.

**Warum:** Sie stand in Beitrittsreihenfolge da und jede Karte sah gleich aus —
wer führt, musste man sich aus fünf Zahlen zusammensuchen. Bei Gleichstand
fällt die Sortierung auf den Ausgangsindex zurück, sonst springen zwei
Punktgleiche zwischen zwei Runden ohne Grund umeinander. Gleiche Punktzahl
heißt gleicher Platz (2./2./4.), nicht fortlaufend durchnummeriert.

Die Krone kommt erst, wenn überhaupt jemand gepunktet hat — zu Beginn stehen
alle auf null, und fünf Kronen sagen nichts. Das Leuchten bleibt `.picked`
vorbehalten, dem Moment, in dem jemand den Punkt holt; „führt" ist nur getönt.

Die Trennlinie bindet die Leiste an den Kopf der Seite. Vorher schwebte sie
zwischen Logo und Artikel, ohne erkennbar zu einem von beiden zu gehören.

**Geprüft:** `node check.js --types` ohne Befund. Mit fünf Teilnehmern:
👑 Anna 3 · 2. David 2 · 3. Ben 1 · 3. Emil 1 · 5. Clara 0 — Gleichstand teilt
sich den Platz, der nächste Platz überspringt entsprechend. Mit acht
Teilnehmern zwei Zeilen, kein Querüberlauf, keine Überlappung mit der
Gebotsliste (Leiste endet bei 204+x, Grid beginnt bei 423). Keine
Konsolenfehler. Firebase während des Tests abgeklemmt, zwei Schreibversuche
abgefangen, keiner davon `joinLocked`.

**Fallstrick:** `r.rank` erst nachträglich an ein Objektliteral zu hängen gibt
TS2339 — die Eigenschaft muss beim `map` schon drinstehen (`{ p, i, rank: 0 }`).

---

## 2026-09-24 — Regeln in den Editor, Lobby-Kasten geordnet (`f14dd4c`)

**Gemacht:** Die zwei Regel-Haken sind vom Setup- in den Fragen-Editor
gewandert. Der Lobby-Kasten hat jetzt ein Raster aus zwei gleich breiten
Spalten statt eines Umbruchs.

**Warum:** Die Regeln sind Eigenschaften der Fragerunde, kein Startparameter —
der Setup-Screen soll zeigen, *was* gespielt wird, nicht *wie*. Sie sichern
sich jetzt sofort beim Umschalten (`tpSaveRules()`), sonst käme man über das
Menü mit dem alten Stand zurück. `startTp()` liest weiter dieselben Feld-IDs;
die liegen im DOM, egal welcher Screen sichtbar ist.

Im Lobby-Kasten brachen vier verschieden breite Knöpfe als 2+1+1 um, keine
Kante stand unter der anderen. Zwei Spalten ordnen das und stellen die Paare
zusammen: oben QR, unten Teams. „Teams zuteilen" war `btn-primary` und damit
lauter als „Spiel starten" darunter — es bleibt der wichtigste Knopf *im
Kasten*, aber der Vorrang gehört dem Start, also jetzt Goldrand statt
Goldfläche. Die Zahl im Kopf ist bei 0 grau: ein grünes „0" versprach
Verbundene, die es nicht gab.

**Betroffen sind sechs Screens**, nicht nur Trivial Pursuit: der Kasten ist
geteilt (`renderSetupLobby` in `js/buzzer.js`, dazu `js/roster.js` für DDF und
Der Preis ist heiß).

**Geprüft:** `node check.js --types` ohne Befund. Alle sechs Setup-Screens: je
vier Knöpfe, zwei Spaltenpositionen, gleiche Breite. Regel abschalten schreibt
sofort nach `localStorage`, `tpLoadSettings()` holt sie zurück, `fieldChecked`
liest sie aus dem Editor heraus. Bei 400 px eine Spalte, kein Querüberlauf.
Keine Konsolenfehler.

**Fallstrick:** `js/tp.js` hatte gemischte Zeilenenden (26 CRLF gegen 564 LF),
weil die Datei per Write-Werkzeug mit LF entstand und spätere Perl-Einschübe
CRLF einsetzten. Auf CRLF normalisiert, wie der Rest des Arbeitsbaums.

---

## 2026-09-24 — Setup-Screen von Trivial Pursuit (`fde849b`)

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
