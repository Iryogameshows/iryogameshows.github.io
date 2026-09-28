# Bauplan für eine Gameshow

Wie eine neue Show in diesem Projekt gebaut wird, damit sie aussieht und sich
anfühlt wie die sieben, die es schon gibt. Zum Langhangeln gedacht: oben die
Reihenfolge, in der Mitte die Stellen, an denen sie angemeldet werden muss,
unten die Regeln — jede mit dem Fehler, aus dem sie entstanden ist.

**Jede Regel hier hat einen Anlass.** Nichts davon ist Geschmack. Wo ein
Commit-Hash steht, ist der Vorgang in `HANDOFF.md` nachzulesen.

Die Pflichten aus `CLAUDE.md` (Repo-Stand prüfen, `node check.js`,
`HANDOFF.md` mitschreiben, Antwortformat) gelten unverändert. Hier steht, was
*zusätzlich* gilt, sobald es um eine Show geht.

---

## 1 · Die sieben Fragen vor der ersten Zeile

Erst beantworten, dann bauen. Sie entscheiden über die halbe Architektur.

1. **Teams oder Teilnehmer?** Feste Teams (Feud, Jeopardy, WWDS, Trivial
   Pursuit) oder einzelne Personen (Der Dümmste fliegt, Der Preis ist heiß)?
   Davon hängt ab, ob die Show in `LOBBY_SETUP` oder in `ROSTERS` gehört — und
   ob sie ihr Turnierergebnis selbst melden kann.
2. **Buzzern die Handys?** Dann läuft es über `feudBuzzer` oder
   `jeopardyBuzzer`. Nur eine Verbindung pro Kontext, siehe `currentBuzzer()`.
3. **Tippen die Handys?** Dann über `makeRoundChannel(...)` mit eigener
   Rundennummer — nie über einen Sammel-Listener auf `/buzzer`.
4. **Was sieht das Publikum, was nur der Host?** Die Antwort steht im
   GM-Panel **immer**, auch wenn sie auf der Leinwand verdeckt ist. Sonst kann
   der Host nicht urteilen (`ed25b18`).
5. **Was ist ein Zug?** Der Zustandsautomat (`phase`) muss vor der ersten
   Zeile stehen. Jede Phase braucht eine Antwort auf: welche Knöpfe, welche
   Wache, was passiert bei einem zweiten Klick?
6. **Wie endet sie?** Auf dem gemeinsamen `result-screen` oder in einem
   eigenen Endzustand? Beim eigenen Endzustand nicht vergessen:
   `tournamentEndButtonHtml(pfx)`.
7. **Wie wird gewertet?** Eine Zahl je Team — das ist, was das Turnier
   versteht. Bei teamlosen Shows rechnet `tournamentReportTeamless()` das über
   die Team-Zuordnung der Accounts hoch.

---

## 2 · Das Skelett

Eine Show ist **eine Datei** in `js/`, **drei Screens** in `index.html` und
**elf Anmeldungen** im Bestand. Mehr nicht — und weniger auch nicht.

### 2.1 Die Datei `js/xxx.js`

Immer in dieser Reihenfolge. Wer sich daran hält, findet sich in jeder anderen
Show sofort zurecht.

```js
// @ts-check
/* ═══ NAME DER SHOW ═══════════════════════════════════════════════════════
   Was sie ist, in drei Sätzen. Dann: warum sie SO gebaut ist und nicht
   anders — samt der Wege, die verworfen wurden.
   ════════════════════════════════════════════════════════════════════════ */

/** @typedef {{ … }} XxxQuestion */      // 1 · Bauplan der Daten
let xxxData = { … };                     // 2 · Fragen (Editor schreibt hier)
let xxxState = { active:false, phase:'…', … };  // 3 · Spielstand

function startXxx(){ … }                 // 4 · Start, Prüfung, Popout, Intro
function xxxQuit(){ … }                  // 5 · Abbruch
/* ── Spiellogik ── */                   // 6 · Züge, Wertung, Phasenwechsel
/* ── Anzeige ── */                      // 7 · renderXxx() und Unterteile
/* ── Editor ── */                       // 8 · renderXxxEditor(), Setter
/* ── Speichern ── */                    // 9 · xxxSave/xxxLoad/import/export
xxxLoad();                               // 10 · einmal beim Laden
/* ── Intro und Anleitung ── */          // 11 · xxxIntroThenGame, Tutorial
/* ── Gamemaster-Panel ── */             // 12 · xxxGmControlsHtml, updateGamemasterXxx
```

### 2.2 Der Start — immer dieselben fünf Schritte

```js
function startXxx(){
  // 1 · Prüfen, was die Show unspielbar machen würde. VOR dem Popout:
  //     ein abgebrochener Start soll kein leeres Fenster aufmachen.
  if (!xxxData.questions.length) { alert('Ohne Fragen geht es nicht.'); return; }

  openBoardPopout();          // 2 · Zuschauerfenster
  xxxState = { …frischer Zustand… };   // 3 · ALLES zurücksetzen, auch den Undo-Stapel
  xxxUndoStack.reset();

  activeBuzzerContext = 'xxx'; // 4 · Verbindung, Teamnamen, Beitrittssperre
  feudBuzzConnect();
  buzzerBroadcastTeams(namen);
  lockBuzzerJoins(feudBuzzer);

  xxxIntroThenGame();          // 5 · Intro → Zeichen → Anleitung → Titel → Screen
}
```

Der Intro-Lauf ist bei allen Shows wortgleich:

```js
function xxxIntroThenGame(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const old = document.querySelector('.black-backdrop');
  if (old) old.remove();
  addBlackBackdrop();
  openGamemaster();            // schon jetzt: Intro und Anleitung sind vom
                               // GM-Fenster und vom Handy aus weiterklickbar
  runIntroThen(() => {
    const ov = document.createElement('div');
    ov.className = 'intro-overlay';
    ov.innerHTML = `<div class="game-intro-sign">${gameCardIcon('xxx')}</div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', () => closeOverlay(ov, () => {
      runTutorial(xxxTutorialSlides(), xxxShowTitle);
    }));
  });
}
```

### 2.3 Die elf Anmeldungen

Vergessene Anmeldungen sind der häufigste Fehler beim Anbauen einer Show.
`node check.js` findet nur die ersten beiden.

| # | Wo | Was |
|---|---|---|
| 1 | `index.html` | `<script src="js/xxx.js">` **nach** `core.js`, `feud.js`, `buzzer.js` |
| 2 | `index.html` | Drei Screens: `xxx-setup-screen`, `xxx-edit-screen`, `xxx-screen` |
| 3 | `index.html` | Menükachel mit `data-game="xxx"` und `<div class="intro-slot" id="xxx-intro-slot">` |
| 4 | `js/core.js` → `logoIconMarkup()` | Das SVG-Zeichen der Show |
| 5 | `js/core.js` → `showScreen()` | Zweige für Setup- und Editor-Screen (Editor rendern, Einstellungen laden, Lobby verbinden) |
| 6 | `js/intro.js` → `INTRO_SLOTS` | Setup-Screen → Intro-Slot |
| 7 | `js/feud.js` → `BOARD_PUBLIC_SCREENS` | **Nur** `xxx-screen`. Setup und Editor gehören dem Host |
| 8 | `js/feud.js` → `updateGamemaster()` | `if (xxxState.active) return updateGamemasterXxx();` |
| 9 | `js/feud.js` → `updateGMBar()` | Zweig für die Leiste im Hauptfenster |
| 10 | `js/buzzer.js` → `GM_REMOTE_ALLOWED_FNS` | **Jede** Funktion, die aus dem GM-Panel gerufen wird |
| 11 | `js/buzzer.js` → `LOBBY_SETUP` *oder* `js/roster.js` → `ROSTERS` | Teamnamen-Felder oder Teilnehmer-Auswahl |

Dazu, wenn die Show im Turnier laufen soll (`js/tournament.js`):
`TOURNAMENT_GAMES`, `TOURNAMENT_AUTO_RESULT`, `TOURNAMENT_DEFAULT_WEIGHTS`,
`tournamentGameIcon()` und die `<option>` im Spielplan-Formular.

### 2.4 Das Gamemaster-Panel

Zwei Funktionen, immer gleich geschnitten:

```js
function xxxGmControlsHtml(pfx){     // nur die Knopfleiste
  const s = xxxState;
  let b = '';
  if (s.phase === 'frage'){ b += `<button class="gm-btn gm-gold" onclick="${pfx}xxxWeiter()">…</button>`; }
  …
  if (s.phase === 'done') return tournamentEndButtonHtml(pfx) + …;
  if (xxxUndoStack.can()) b += `<button class="gm-btn gm-orange" onclick="${pfx}xxxUndo()">↩ Undo</button>`;
  return b;
}

function updateGamemasterXxx(){      // das ganze Dokument
  const gmHtml = `<!DOCTYPE html>… ${gmHeaderHtml('Gamemaster', 'Show · Phase')}
    <div class="gm-body">
      <div class="gm-main">…Frage, Lösung IMMER sichtbar…</div>
      <div class="gm-side">…Punktestand… ${gmNotesPanelHtml()}</div>
    </div>
    <div class="gm-actions">${xxxGmControlsHtml('opener.')}</div>…`;
  commitGamemasterHtml(gmHtml);
}
```

`pfx` ist `'opener.'` im GM-Fenster und `''` im Hauptfenster. Das Handy-Gamepad
spiegelt genau dieses Dokument — was dort nicht steht, ist vom Handy aus nicht
bedienbar.

---

## 3 · Code-Regeln

### 3.1 Nie roh ans DOM

`document.getElementById(x).value` wirft, sobald die ID einen Tippfehler hat
oder der Screen noch nicht steht. Es gab davon rund 250 Stellen. **Alle sind
abgelöst**, für neuen Code gelten die Helfer aus `core.js`:

```
fieldVal · fieldChecked · fieldSet · fieldEl
setText · setHtml · showEl · screenActive · setClass
```

Alle geben `false`/`null`/den Rückfallwert zurück, wenn es das Element nicht
gibt. **Ein Knopf, den es gerade nicht gibt, darf keine Show abbrechen.**

`showEl` blendet mit `''` ein, nie mit `'block'` oder `'flex'`: ein fest
eingetragenes `display` schlägt jede CSS-Regel und hebelt sie still aus.

### 3.2 Escapen ist Pflicht, nicht Vorsicht

`setHtml` nimmt niemandem das Escapen ab. Alles aus Benutzereingaben —
Spielernamen, getippte Antworten, Kategorienamen — muss durch:

| Wohin | Womit |
|---|---|
| Text im Markup | `escapeHtml` |
| In ein Attribut | `escAttr` |
| Als Argument in einen `onclick`-String | `escJsArg` |

**Der Anlass:** Ein Spieler namens O'Brien. Im Markup stand
`assignPlayerTeam('o'brien',0)` — der Knopf tat wortlos nichts. `escJsArg`
serialisiert über `JSON.stringify` und escapt danach fürs Attribut.

### 3.3 Inline-Handler sind Zeichenketten, kein Werkzeug sieht sie

Die App hängt an rund 400 Inline-Handlern, gut die Hälfte davon zur Laufzeit
zusammengebaut:

```js
onclick="resetPlayerPassword('${p.key}', ${escJsArg(p.name)})"
```

Kein Editor, kein Linter und auch TypeScript sieht dort einen Funktionsnamen.
Wer umbenennt und eine Zeichenkette übersieht, merkt das, wenn während der
Show jemand drückt. Deshalb `node check.js` **vor jedem Commit**, besonders
nach Umbenennungen. Dasselbe gilt für Element-IDs.

### 3.4 Zustand: Wache vor Wirkung

Drei Regeln, alle aus echten Fehlern in `js/tp.js` (`1db72e0`):

**Erst prüfen, dann sichern.** `undoStack.save()` gehört *hinter* die Wache.
Stand es davor, legte jeder abgeprallte Aufruf einen Zustand auf den Stapel —
„↩ Undo" holte denselben Spielstand zurück und sah aus, als täte es nichts.

**Jede Aktion prüft ihre Phase.** GM-Fenster und Handy-Gamepad sind Spiegel
derselben Seite; ein Doppeltipp oder ein doppelt ankommender Fernbefehl ruft
dieselbe Funktion zweimal. Ohne Phasenwache sprang der Zug zweimal weiter und
ein Team wurde übersprungen.

**Ein neues Spiel setzt ALLES zurück**, auch den Undo-Stapel. Ohne
`reset()` holte „↩ Undo" im ersten Zug den Spielstand des vorigen Spiels.

### 3.5 Anzeige folgt dem Zustand — überall

Ändert sich etwas, das im GM-Panel steht, gehört `updateGamemaster()` dazu.

**Der Anlass:** Der Gebote-Zähler bei „Der Preis ist heiß" stand still. Der
Firebase-Handler frischte nur die Anzeige auf dem Hauptbildschirm auf. Der Host
sah „0/6", während auf der Leinwand längst alle da waren (`66616c9`).

Die Gegenprobe bei jedem Zustandswechsel: **Hauptbildschirm, GM-Panel,
Handy — stimmen alle drei?**

### 3.6 Handy-Kanäle: Rundennummer statt Zähler

Jeder Kanal (`buzzer/estimate`, `buzzer/tpspin`, `buzzer/ddfvote`, …) trägt
eine `round`. Die Handys setzen ihre Sperre zurück, sobald sich die Zahl
**ändert** — sie muss also eindeutig sein, nicht fortlaufend.

```js
function nextRoundId(prev){ return Math.max(Date.now(), (prev || 0) + 1); }
```

**Der Anlass:** Vorher war es ein Zähler ab 0. Lud der Host mitten in der Show
neu, fing er wieder von vorn an — jedes Handy, das die 1 schon gesehen hatte,
hielt seine Sperre, der Spieler konnte nicht mehr buzzern, und niemand wusste
warum.

Weitere Fallstricke an diesen Kanälen:

- **Gezielt auf Felder hören**, nie auf `/buzzer` als Ganzes. Der Knoten
  enthält `players` mit allen Accounts inklusive PIN-Hashes.
- **`excluded: {}` schreibt Firebase gar nicht.** Ein leeres Objekt lässt den
  alten Knoten stehen — und die Sperre mit ihm. Bei leerer Liste `null`.
- **Wer zuerst drückt, gewinnt: `transaction`, nicht `set`.** Zwei gleichzeitige
  Finger ergeben sonst zwei Drehungen.
- **Nur Verweise nach Firebase, keine Nutzlast.** Das Turnier merkt sich den
  *Dateinamen* eines Jeopardy-Boards, nicht das Board — mit eingebetteten
  Bildern sind das mehrere Megabyte bei jedem Schreibvorgang.

### 3.7 Timer, die eine Sperre zeichnen, müssen einmal mehr zeichnen

```js
setInterval(() => { if (locked()) refreshBuzz(); }, 250);   // FALSCH
```

Solange die Sperre lief, wurde gezeichnet. In dem Takt, in dem sie **ablief**,
war die Bedingung falsch — es wurde nicht noch einmal gezeichnet, und der
Knopf blieb deaktiviert, bis zufällig ein anderes Ereignis kam. Deckte der
Host die Frage kurz nach dem Öffnen auf, war der Spieler für die ganze Frage
raus (`1db72e0`).

```js
setInterval(() => {                                          // RICHTIG
  if (!lockUntil) return;
  if (!locked()) lockUntil = 0;
  refreshBuzz();
}, 250);
```

### 3.8 Relativ rechnen, nicht gegen null

```js
const target = 360*4 + (360 - (cat*seg + seg/2));   // FALSCH
tpState.angle += target;
```

Das rechnete den Zielwinkel so aus, als stünde das Rad auf 0, und addierte ihn
auf den Stand, auf dem es tatsächlich stand. Erster Dreh richtig, ab dem
zweiten summierte sich der Versatz: 30°, 120°, 90° — bei 60° Segmentbreite
zeigte das Rad auf eine andere Kategorie als die, die gespielt wurde.

**Wo etwas fortlaufend verändert wird, ist der IST-Wert Teil der Rechnung.**

### 3.9 Eine Quelle, eine Funktion

Es gab drei Fassungen von „wie heißen die Teams gerade" und drei von „male die
Team-Knöpfe": eine konnte beliebig viele Teams, eine fest zwei, eine zeigte
immer drei. Wer über die eine in Team 3 gelegt wurde, war für die andere „ohne
Team" und tauchte in keiner Wertung auf (`66616c9`).

Heute: `contextTeamNames(game)` und `playerTeamButtonsHtml(p, namen, pfx)`.
**Bevor etwas Zweites gebaut wird: nachsehen, ob es das Erste schon gibt.**

Dasselbe gilt für Importe: `readJsonFile(e, apply)` — nie ein eigener
`FileReader`. Zwei Shows hatten einen, und beide hatten dadurch keine
BOM-Behandlung, eine Fehlermeldung, die nicht sagte was kaputt ist, und keine
Erfolgsmeldung (`a3fd47c`).

### 3.10 Typen stehen am Code

JSDoc, keine eigenen Dateien. `node check.js --types` meldet **nichts** —
dieser Zustand ist der Grund, warum die Prüfung etwas wert ist. Eine neue
Meldung gehört zur Änderung, die gerade gemacht wurde.

Wer eine neue Sorte Frage einbaut, trägt sie in die `@typedef` ein. Sonst
kennt sie weder der Editor-Code noch die Prüfung.

---

## 4 · Design-Regeln

### 4.1 Der Bildschirm gehört dem Publikum

Alles, was nur der Host braucht, gehört ins GM-Panel — nicht auf die Leinwand.

Das Zuschauerfenster zeigt **nur** die Screens aus `BOARD_PUBLIC_SCREENS`.
Früher war es andersherum, eine Liste der auszublendenden Screens; sie hinkte
jeder neuen Show hinterher, und zuletzt stand der Intro-Editor auf der
Leinwand (`66616c9`).

**Eine Liste, die man beim Anlegen eines Screens pflegen muss, wird vergessen.
Eine, die man beim Anlegen eines Zuschauer-Screens pflegen muss, fällt sofort
auf — dann bleibt die Leinwand schwarz.**

Was daraus folgt: Host-Knöpfe stehen nie auf dem Spiel-Screen. „Nochmal" und
„Zum Menü" standen einmal auf dem Hauptbildschirm — also auf der Leinwand
(`1673e6d`).

### 4.2 Lesbar aus drei Metern, bedienbar im Halbdunkel

Der Host bedient mit einer Hand, im Dunkeln, während er moderiert.

- **Nichts unter 12px.** Der Lobby-Kasten war durchgehend in 0,68–0,85rem
  gesetzt; mit Avatar, Name, Knopf und vier Team-Knöpfen in einer Reihe wurde
  daraus ein Gedränge, in dem sich Knöpfe überlagerten.
- **Klickflächen mindestens 32px hoch.** Ein Knopf mit `padding:4px` wird im
  Dunkeln nicht getroffen.
- **Auf der Leinwand zählt die Bebas-Größe**, nicht die Zeichenzahl. Was der
  Host auf 27 Zoll liest, liest niemand auf 3 Metern.

### 4.3 Mittig, wenn die Zeilen verschieden lang sind

Eine Lobby-Zeile ist mal nur ein Name, mal ein Name mit Team-Tag, mal ein Name
mit vier Knöpfen. Linksbündig steht dann jede Zeile woanders und das Auge
findet keine Kante.

Dasselbe Prinzip von unten: **gleich breite Spalten statt freiem Umbruch.**
Vier verschieden breite Knöpfe brachen als 2+1+1 um, keine Kante stand unter
der anderen — ein Raster aus zwei gleichen Spalten ordnet das (`f14dd4c`).
Sechs Kategorie-Chips liegen aus demselben Grund in drei festen Spalten
(`fde849b`).

**Erzwungener Umbruch schlägt zufälligen.** `flex-basis:100%` bringt die
Team-Knöpfe immer in eine eigene Zeile. Ein erzwungener Umbruch sieht immer
gleich aus; ein zufälliger nie.

### 4.4 Nur ein lautester Knopf je Fläche

„Teams zuteilen" war `btn-primary` und damit lauter als „Spiel starten"
darunter. Es blieb der wichtigste Knopf *im Kasten*, aber der Vorrang gehört
dem Start — also Goldrand statt Goldfläche (`f14dd4c`).

- **Gold** = der eine Weg nach vorn.
- **Grau** = Nebenwege.
- **Rot** = zerstört etwas. Es darf nicht aussehen wie die anderen, aber auch
  nicht nach Warnung schreien — es steht ja absichtlich da.
- **Team-Farben sind fest:** 0 rot `#E8453C`, 1 blau `#3B82F6`, 2 grün
  `#22C55E`. Überall, auch auf den Handys.

### 4.5 Null ist kein Erfolg

Die Zahl im Lobby-Kopf war grün, auch bei 0 — ein grünes „0" versprach
Verbundene, die es nicht gab. Bei 0 ist sie grau (`f14dd4c`).

Allgemein: **eine Anzeige, die immer gleich aussieht, sagt nichts.** Die
Kategorie-Vorschau weist eine Kategorie ohne Fragen rot aus, *vor* dem Start —
sonst fällt es erst auf, wenn das Rad im Spiel darauf stehen bleibt.

### 4.6 Angeschnitten sieht aus wie kaputt

Die Lobby-Liste war auf 220px gedeckelt. Mit größeren Zeilen passten drei
Spieler hinein und die vierte stand angeschnitten da. Das liest sich wie ein
Fehler, nicht wie eine Liste, die weitergeht. `max-height:min(56vh,470px)`
nimmt auf dem Handy den Bildschirm als Maß und auf dem Rechner eine feste
Grenze.

### 4.7 Was läuft, darf nicht neu anfangen

Das Zuschauerfenster wird **gepatcht**, nicht neu geschrieben (`morphMirror`).
Ein `innerHTML`-Austausch ließ bei jeder Kleinigkeit — Punktestand,
Buzzer-Ping — laufende Animationen und Videos von vorn starten.

Aus demselben Grund schreibt `openBoardPopout()` das Dokument nicht neu, wenn
das Fenster schon steht: zwischen zwei Shows wurde es sonst kurz weiß und holte
Schriften und `styles.css` erneut (`a3fd47c`).

---

## 5 · Abnahme

Vor dem Commit:

```bash
node check.js            # Pflicht
node check.js --types    # nach größeren Änderungen
```

Danach im Browser durchspielen — **die ganze Show, nicht die geänderte Stelle.**
Chromium liegt in dieser Umgebung unter
`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; mit `python3 -m http.server`
und Playwright ist ein Durchlauf in zwei Minuten gebaut. Genau so kam heraus,
dass ein Import zwar lud, seinen Dateinamen aber nicht meldete — beim Lesen
war das nicht zu sehen (`a3fd47c`).

Die Liste, an der eine Show scheitert:

- [ ] Start ohne Fragen → saubere Meldung, kein leeres Popout
- [ ] Intro, Anleitung, Titelkarte laufen durch — auch vom GM-Fenster aus
- [ ] Jeder Knopf im GM-Panel steht in `GM_REMOTE_ALLOWED_FNS`
- [ ] Jeder Knopf **zweimal** schnell gedrückt: passiert nichts Zweites?
- [ ] Undo an jeder Stelle: ändert es wirklich etwas?
- [ ] Abbruch mitten im Zug → zurück ins Menü, Kanäle zu, Buzzer aus
- [ ] Zuschauerfenster: Setup, Editor und Spielerliste sind **nicht** zu sehen
- [ ] Bei 400px Fensterbreite kein Querüberlauf, keine Überlappung
- [ ] Turnier: gestartet, Ergebnis eingetragen, Stand stimmt
- [ ] Konsole leer (außer Netzwerk)
- [ ] `HANDOFF.md`-Eintrag mit Hash, samt verworfener Wege und Messwerten

Was nicht geprüft wurde, wird als ungeprüft benannt. **Firebase läuft in
keinem lokalen Durchlauf** — alles, was an Lobby, Presence und Handys hängt,
bleibt bis zum ersten echten Abend eine begründete Vermutung.
