# Handoff

Was zuletzt passiert ist und warum. Neueste Einträge oben.
Angelegt mit `452ac83`.

Die Git-History sagt, *was* geändert wurde. Hier steht, was gemessen,
verworfen oder bewusst liegen gelassen wurde — das geht sonst verloren und
wird ein zweites Mal erarbeitet.

**Jede Aussage hier gilt als veraltet, bis sie gegen das Repo geprüft ist.**
Erst `git fetch origin && git status -sb`, dann lesen.

---

## 2026-10-06 — Voting-Seite für die 18 Design-Richtungen `/voting/` (`2982e6d`)

**Auftrag (David).** Eine Seite, die Freunde bekommen: alle Designs
anschauen, Top 5 geordnet abgeben (Pflicht), bis zu 5 Schlechte geordnet
(optional), Bookmarks setzen, am Anfang 2-3 Textfenster zur Bedienung,
frei vor und zurück, am Ende eine Übersicht zum Abgeben.

**Annahme, nicht abgesprochen:** Abgestimmt wird über die 18 Richtungen aus
`designs/` (nicht über Spiele oder etwas anderes).

**Gemacht.** Neuer Ordner `voting/`, kein Eingriff in die Show:
- `voting/index.html`: drei Etappen (Anleitung in 3 Fenstern, Durchgehen,
  Abgabe), Kopfleiste jederzeit anklickbar, Browser-Zurück-Taste geht auch.
  Durchgehen: ◀ ▶ und Pfeiltasten, Reiter je Screen, Bookmarks 👍/👎 (nur
  Merkzettel), Streifen mit allen 18. **Abgabe als Stempel-Übersicht**
  (David: „die Übersicht, und die clicken an und setzen so kleine stamps
  1-5", nachdem die erste Fassung mit Listen und ▲▼ verworfen wurde):
  Raster aller 18 mit Vorschau. **Die Stempel gehen der Reihe nach** (David,
  zweite Korrektur: „nicht so auswählen, das 1. was sie anclicken is
  Platz 1, das 2. Platz 2"): erster Klick = ★1, zweiter = ★2 … ★5 (Top 5,
  Pflicht, 1 = Favorit). Nach dem fünften springt die Seite auf ✖ (Schlecht,
  optional, ✖1 = am schlechtesten); zwei Knöpfe oben schalten von Hand um.
  Ein gestempeltes Design nochmal anklicken nimmt den Stempel ab, die
  folgenden rücken auf (Nummern bleiben lückenlos, deshalb gibt es keine
  Stempelwahl mehr). Stempel groß auf dem Bild, Übersicht oben, Hinweis
  „Nächster Stempel: ★n“, Filter. Erste Fassung (Listen mit ▲▼) und zweite
  (Stempelwahl pro Design) sind verworfen.
  Annahmen von mir: Umschalten auf ✖ automatisch nach ★5; ein
  Design von ★ nach ✖ zu verschieben heißt abnehmen und neu anklicken.
- `voting/ergebnis.html`: Rangliste (Top 5 = 5…1 Punkte, Schlechte = −5…−1),
  Einzelabgaben, live. Nirgends verlinkt - nur David kennt die Adresse.
- `voting/data.js`: Kopie der Richtungsliste aus `designs/index.html`.
  **Beide Listen von Hand synchron halten.**
- Speicher: Firebase Realtime Database, Pfad `votes/<name>` (dieselbe
  Datenbank wie der Buzzer, Config aus `buzzer/index.html`). Gleicher Name =
  gleiche Abgabe, vorher kommt eine Rückfrage, wenn der Name schon vergeben
  ist. Fortschritt bleibt in `localStorage` (`iryo-voting-v1`).
- Schlägt das Senden fehl, kommt ein Fenster mit der Auswahl als Text zum
  Kopieren.

**Warum so.** Firebase, weil das Projekt es schon nutzt und die Regeln offen
sind - kein neuer Dienst. Gerüst wird nur einmal gebaut und danach nur
aktualisiert, weil jedes Neuzeichnen die 18 Vorschau-iframes neu geladen
hätte.

**Geprüft.** Im Browser per Skript durchgespielt (ohne Firebase): Anleitung
vor/zurück, Durchgehen mit Bookmarks, Reiter, Kopfleiste und Browser-Zurück,
Fallback-Fenster bei fehlendem Firebase (alles an der ersten Fassung). An der
Reihenfolge-Fassung: Klicks in Reihenfolge, Abnehmen mit Aufrücken, Wechsel
auf ✖ nach ★5, Umschalten von Hand, sechster Klick in voller Liste
abgelehnt, Namenspflicht, Anzeige in Übersicht und auf dem Bild, Aussehen
per Screenshot (Handybreite). Keine Konsolenfehler beim Laden. `node check.js` ändert sich nicht (prüft
`voting/` nicht).

**Ungeprüft.** Echtes Schreiben und Lesen in Firebase (bewusst keine Testdaten
in die Live-Datenbank geschrieben), `ergebnis.html` mit echten Daten, das
Aussehen auf dem Handy (Screenshots waren nicht möglich, das Browser-Fenster
war nicht sichtbar), Ladezeit von 18 Vorschauen auf dem Handy.

**Offen.** Jeder mit dem Link kann Abgaben anderer überschreiben oder
löschen (offene Datenbankregeln, wie beim Buzzer). Ergebnis-Adresse liegt
unter `/voting/ergebnis.html`, ist aber nicht geheim.

---

## 2026-10-06 — Show-Symbole je Design: Regeln in styles.css (`5ac4376`)

**Gemacht.** Fortsetzung von `d226865`. David: „Stil je Richtung wie geplant
umsetzen" - ein Zeichenstil je Richtung, nicht je Show und Richtung.
- `styles.css`: Block „Show-Symbole je Design-Richtung" nach den Show-Logo-
  Regeln. Jede Richtung (A-S ohne G) setzt nur Variablen `--ico-*` (Fläche,
  Kontur, Linie, Aussparung, gedimmt, Filter, Blend); die Regeln darunter
  greifen per Attribut-Selektor auf die vier Elementsorten. Bauhaus (H) und
  Memphis (P) färben reihum per `:nth-child`.
- Alte Regeln für `#main-logo` entfernt (Verlauf-Stops, `[fill="#0b0e2c"]`,
  `[fill="#3a3f6b"]`, die `data-theme-hell`-Stops). Die `.logo-word`-Regeln
  bleiben.
- `index.html`: Filter `#ico-pixel` neu gebaut, dazu `#ico-pixel-g`.

**Warum so.**
- Wächter per `:where(...)`: `:root[data-theme]:not([data-theme="A"])` hätte
  0,3,0 Spezifität und die Richtungs-Regeln (nth-child, Umriss-Stile)
  geschlagen. A behält das Gold und bekommt nur Aussparung, Dimmung, Schein.
- Elemente mit eigenem `stroke` (Karte im WWDS-Pult, Mittelpunkt der Torte)
  werden getrennt behandelt, sonst verschwindet deren Fuge bzw. die
  Linienbreite wird überschrieben.
- Umriss-Stile (I, J, K): Aussparungen und gedimmte Flächen bekommen
  `fill:none` plus Linie (`--ico-cutline`, `--ico-dimline`); sonst wäre die
  gedimmte Säule heller als die leuchtende.
- **Lücken in der Tabelle, von mir gewählt** - bitte prüfen: H Linie #141414,
  Aussparung #ECEAE4, gedimmt #141414. P gedimmt rgba(20,20,20,.3),
  Aussparung #F4F1FF. M Linie #B7A6FF statt Verlauf (ein senkrechter Strich
  hat keine Breite, ein Verlauf nach Bounding-Box wird dort nicht gezeichnet;
  nicht eigens geprüft, Vorsichtsmaßnahme). Q Linie = Fläche.
- **Pixel-Mosaik (B), drei Anläufe.** (1) Der vorbereitete Filter mit Fläche
  = Elementrand und feFlood in festen Einheiten: am `<svg>` ging es, an der
  `<g>` (Show-Logo oben) blieb das Symbol leer. Vermutung: die Teilregion
  der feFlood liegt im Koordinatensystem des Elements, die Filterfläche
  beginnt aber am Rand der `<g>`. (2) `primitiveUnits="objectBoundingBox"`
  mit Bruchteilen: in Chrome nirgends sichtbar. (3)
  `filterUnits="userSpaceOnUse"` ab 0/0 mit fester Fläche: geht an `<svg>`
  (CSS-Pixel, 4-px-Blöcke) und an `<g>` (Symbol-Einheiten, 6 Einheiten) -
  an einem Testkreis in allen drei Fällen nachgestellt. Deshalb zwei Filter:
  `--ico-filter-root` für das `<svg>`, `--ico-filter` für die `<g>`.
- Der Hover der Menükarte setzt `filter` mit Spezifität 0,3,1; die Filter-
  Regel hat dafür eine eigene Hover-Zeile.

**Geprüft.** `node check.js` und `node check.js --types` = alles in Ordnung
(1052 Klammernpaare). Im Browser (Vorschau-Server, 18 iframes mit
`applyThemeToDoc`; je Richtung die Menü-Symbole aller acht Spiele plus
Show-Logo `pih`): alle 18 Richtungen zeichnen, B, J, K, M, O, Q, S nach dem
Filter-Umbau einzeln angesehen. Testseiten wieder gelöscht, `designTheme`
im Browser zurückgesetzt.

**Ungeprüft.** Mainscreen/Zuschauerfenster (Filter-Verweise `url(#ico-...)`
im gespiegelten Dokument), Hover auf einer Menükarte, Intros/Tutorial/
Turnierplan mit Richtung, Klassik ohne Richtung (die Regeln gelten nur bei
`data-theme`; nicht nachfotografiert). Die Passwort-Sperre habe ich für die
Tests nur als Overlay im iframe entfernt, nichts eingegeben.

**Offen.** Davids Entscheidung „eigenes Piktogramm je Show und Richtung"
(Eintrag darunter) ist offen; er hat sich für den Zeichenstil je Richtung
entschieden. Das Mosaik wirkt bei WWDS und Torte unruhig.

**Fallstricke.** Python gibt es auf dieser Maschine nicht; Textumbauten mit
`node -e`. Mehrzeilige Texte nicht per `node -e` in Bash quoten - dafür das
Edit-Werkzeug nehmen. Der Vorschau-Screenshot lief mehrfach in ein Timeout,
ein zweiter Versuch klappte jeweils.

---

## 2026-10-06 — UNFERTIG: Show-Symbole je Design neu zeichnen (`d226865`)

**Auftrag (David).** „die Show-Symbole auch pro Design neu zeichnen" - nach
`86bc0e2` sind die Symbole in allen Richtungen nur umgefärbt.

**Stand.** Abgebrochen auf Davids Wunsch, um an einem anderen Rechner
weiterzumachen. Gepusht ist nur die Vorbereitung, sichtbar ändert sich
nichts:
- `js/core.js`: Klasse `show-icon` an `STAR_SVG`, `DANGER_SVG` (je am
  `<svg>`), `gameCardIcon` (`<svg>`) und den beiden Symbol-`<g>` in
  `renderLogo`. Damit erfasst eine CSS-Regel alle fünf Stellen: Show-Logo
  oben, Menükarten, Intros/Titel (auch Mainscreen), Tutorial, Turnierplan.
- `index.html`: `<svg id="show-icon-defs">` direkt nach `<body>` - Filter
  `#ico-pixel` (Mosaik, 5 Einheiten), `#ico-chalk` (Turbulenz + Körnung),
  Verläufe `#ico-aurora`, `#ico-deco`, Muster `#ico-scan`. Bewusst nicht
  `display:none` (dann baut der Browser Verläufe/Filter nicht, siehe
  Kommentar über `withOwnGradId`) und im `<body>`, damit der Spiegel es in
  den Mainscreen trägt.

**Was fehlt: die Regeln in `styles.css`.** Die Symbole bestehen aus vier
Sorten Elementen, die sich per Attribut-Selektor greifen lassen:
`[fill^="url"]` (Goldfläche), `[stroke^="url"]` (Goldlinie),
`[fill="#0b0e2c"]`/`[stroke="#0b0e2c"]` (Aussparung), `[fill="#3a3f6b"]`
(gedimmte Jeopardy-Säulen). Geplant: Basisregel
`:root[data-theme]:not([data-theme="A"]) .show-icon …` mit Variablen
`--ico-fill`, `--ico-sfill`, `--ico-line`/`--ico-lw` (Kontur mit
`paint-order:stroke`), `--ico-cut`, `--ico-dim`, `--ico-filter` auf
`svg.show-icon, g.show-icon` (Spezifität muss
`.menu-card:hover .menu-card-icon svg` schlagen, also `svg.show-icon` und
später im CSS). Je Richtung:

| | Technik | Fläche / Linie / Aussparung / gedimmt / Filter |
|---|---|---|
| A | Studio-Gold bleibt, Glühbirnen-Schein | Gold unverändert / – / #0A0C26 / #2A2E66 / drop-shadow 0 0 6px rgba(255,201,60,.6) |
| B | verpixelt | #FFE14D / – / #0B0A12 / #2B2740 / url(#ico-pixel) drop-shadow(3px 3px 0 #8A7400) |
| C | Sticker | #FFA3D1, Kontur #121212 3.5 / Linien #121212 / #121212 / #FFF / drop-shadow(4px 4px 0 #121212) |
| D | zweifarbig | #FF5B1F / Linien #F2F2F2 / #0E0E0E / #3A3A3A / – |
| E | 70er-Doppelschatten | #F6E7CB / Linien #F2B33D / #2B1810 / #8C3A1A / drop-shadow(3px 3px 0 #E8622C) drop-shadow(3px 3px 0 #8C3A1A) |
| F | Comic | #FFE600, Kontur #111 3.5 / Linien #E8453C / #111 / #FFF / drop-shadow(4px 4px 0 #111) |
| H | Bauhaus | `:nth-child(3n+1/2/3)` → #D7372B / #1F4FA3 / #F2C230 / #ECEAE4 / #141414 |
| I | Strichzeichnung | fill none, stroke #C9A54C 2 (auch Aussparungen) / dim rgba(201,165,76,.4) |
| J | Kreide | fill none, stroke #EDEDE6 3 / url(#ico-chalk) |
| K | Neon | fill none, stroke #FF4FA3 3, Linien #45F0FF / drop-shadow(0 0 3px #FF4FA3) drop-shadow(0 0 8px #FF4FA3) |
| L | Druckerschwärze | #1A1712 / #1A1712 / #978C73 / rgba(26,23,18,.35) / – |
| M | Aurora | url(#ico-aurora) / #070A1A / rgba(183,166,255,.25) / drop-shadow(0 0 6px rgba(183,166,255,.6)) |
| N | Papierschnitt | #F06A4E / Linien #163936 / #FBF5E8 / #9CCBC0 / drop-shadow(2px 3px 0 rgba(22,57,54,.25)) |
| O | Phosphor | url(#ico-scan) / Linien #7CFFA0 / #05140B / #1F5A33 / drop-shadow(0 0 4px rgba(124,255,160,.7)) |
| P | Memphis | `:nth-child(4n…)` #FFD23F #3FD0C9 #FF6FA8 #7B5CFF, Kontur #141414 2.5 / #141414 / #F4F1FF |
| Q | Riso | #3255A4 / #F2EEE4 / rgba(50,85,164,.3) / drop-shadow(3px 2px 0 rgba(255,72,176,.85)), mix-blend-mode multiply |
| R | Plattencover | #F2A900 / Linien #F4F1EA / #111 / #3A3A3A / – |
| S | Art déco | url(#ico-deco), Haarlinie #FBEBC0 .8 / Linien #D9B66B / #0B0A08 / rgba(217,182,107,.25) |

Danach die alten Regeln in `styles.css` entfernen, die nur `#main-logo`
umfärben (`#main-logo linearGradient stop`, `#main-logo [fill="#0b0e2c"]`,
`[fill="#3a3f6b"]`, `:root[data-theme-hell] #main-logo linearGradient
stop`) - die `.logo-word`-Regeln bleiben.

**Offene Entscheidung.** David wurde gefragt, ob dieser Zeichenstil je
Richtung reicht oder ob er je Show und Richtung ein eigenes Piktogramm
will (18 × 9 Zeichnungen). Keine Antwort bisher - vor dem Weiterbauen
klären.

**Geprüft.** `node check.js` = alles in Ordnung. Nicht im Browser angesehen
(es gibt noch nichts zu sehen). Ungeprüft: ob `#ico-pixel` als CSS-`filter`
auf einem `<g>` im Show-Logo und im Mainscreen-Dokument wirkt.

**Fallstricke.** Edge headless für Tests: nach jedem CDP-Lauf Prozesse mit
`scratchpad` in der Kommandozeile beenden (Eintrag `86bc0e2`). Das
Testskript `cdp.mjs` liegt nur im Scratchpad der alten Sitzung.

---

## 2026-10-06 — Eigenes Logo je Design-Richtung (`86bc0e2`)

**Gemacht.** David: „Die Logos sind nicht da drin, da is überall das
Standardlogo." Stimmte: `renderIryoHubLogo` (core.js) zeichnete immer das
Blau-Gold-Canvas-Schild, `theme.js` fasste Logos nicht an.
- `DESIGN_LOGOS` in `js/theme.js`: je Richtung die Wortmarke aus
  `designs/s/<K>-Menu.html`, als HTML auf 640 px Breite. `themeLogoHtml`
  rechnet jede px-Angabe in `cqw` um (Box mit `container-type:inline-size`),
  dasselbe Markup passt so ins Menü (400 px) und auf den Wartebildschirm
  (`BOARD_IDLE_WIDTH`, 60vw).
- `renderIryoHubLogo` nimmt mit Richtung dieses HTML, sonst wie bisher das
  Schild. `applyTheme` zeichnet Menü- und Wartebildschirm-Logo sofort neu.
- Design-Screen zeigt das Hub-Logo (vorher „KELLER FEUD" aus dem
  `else`-Zweig von `showScreen`).
- Show-Logos oben (`renderLogo`): per CSS `--font-logo`, Symbol und Wort in
  `--gold-rgb` (helle Richtungen: Wort `--fg`, Symbol `--accent-text`),
  kein Goldschein. `fitLogoWords` staucht Wörter über 284 Einheiten per
  `textLength` (Press Start 2P, Fraktur). L nimmt für Show-Logos Playfair
  Display 900 - Fraktur in Versalien („WER WEISS") war unleserlich.
- Klassik-Schild: lädt Luckiest Guy per `document.fonts.load` nach, wenn
  die Seite mit Richtung gestartet wurde (sonst Ersatzschrift im Canvas).

**Warum HTML statt Canvas je Richtung.** Der Mainscreen spiegelt per
`cloneNode`, ein geklontes Canvas kommt leer an (Kommentar in core.js).
Verworfen: die Menü-Entwürfe per iframe einbetten - eigenes Dokument, kein
Spiegel, und das ganze Menü statt nur der Marke.

**Geprüft.** `node check.js` = alles in Ordnung (1013 → 1020
Klammerpaare); `node check.js --types` = 14 Dateien, keine Meldung.
Edge headless: Kontaktabzug aller 18 Menü-Logos; F (Umbruch), O
(ASCII-Grafik zerfiel, Rahmenzeichen in Ersatzschrift - durch VT323-
Schriftzug ersetzt), P (Zeile auseinander), S (Strahlenkranz zu stark)
nachgebessert und erneut fotografiert. Show-Logos WWDS für B, L, K, C, S, F
und Jeopardy für 6 Richtungen (Breiten 117-272, keine über 284). Start mit
`designTheme=L`, dann Klassik: Schild in Luckiest Guy,
`fonts.check` = true. Echtes Mainscreen-Fenster: nach `applyTheme('R')`
steht in `#board-idle` „Iryo GAMESHOW RECORDS".

**Ungeprüft.** Show-Logos für die übrigen 12 Richtungen einzeln; die
Symbole sind nur umgefärbt, nicht je Richtung neu gezeichnet. Handy-Seiten
(`buzzer/`, `gamepad/`) tragen keine Richtung.

**Fallstricke.** `msedge --remote-debugging-port` hinterlässt nach
`ed.kill()` Kindprozesse, die den Port halten; der nächste Lauf hängt sich
dann an die alte Instanz (in einen Popup-Tab ohne `applyTheme`). Vor jedem
Lauf Edge-Prozesse mit `scratchpad` in der Kommandozeile beenden.

---

## 2026-10-06 — Design-Fenster live: Branch nach master, Overlay-Hintergrund (`7b19391`)

**Gemacht.** `claude/game-buzzer-fixes-90cyjz` per Fast-Forward nach
`master` gebracht (vorher 42 Commits voraus, 0 zurück; master stand
unverändert bei `71522b2`). Damit live: der Knopf „🎨 Design" im Hauptmenü
öffnet den Screen `#design-screen` in der Show selbst (kein eigener Tab mehr,
Davids Wunsch „auf der Website mit nem Window, nicht eine extra url"),
`js/theme.js` mit 18 Richtungen, und alle Entwürfe aus Runde 2 und 3 unter
`designs/`. Dazu `7b19391`: `#host-gate` und `.jeopardy-clue-overlay`
nehmen `var(--bg-img)`/`var(--bg-size)` statt des fest eingetragenen
Studio-Blau-Schimmers.

**Warum der Fix.** Beim Durchklicken lag auf L (New York) und Q (Riso) ein
blauer Fleck oben im Passwort-Overlay; das Jeopardy-Overlay hatte denselben
festen Verlauf und steht auf der Leinwand. Der `<body>` las die Variable
schon, die beiden Overlays nicht.

**Geprüft.** `node check.js` = alles in Ordnung (14 js-Dateien, 424
Handler, 269 IDs, 1013 Klammerpaare). Durchgeklickt per Edge headless über
das DevTools-Protokoll (Skript im Scratchpad, nicht im Repo; das
Vorschaufenster der App lud nicht): 18 Richtungen in `DESIGN_THEMES`
(ABCDEFHIJKLMNOPQRS), Design-Screen mit 19 Karten (Klassik + 18) und 18
Vorschau-iframes, `--pv-scale` 0.2016; `applyTheme('L')` setzt
`data-theme=L`, `localStorage.designTheme=L`, Schrift „Old Standard TT";
nach Neuladen weiter `L`; Mainscreen-Fenster (`openMainscreen`) übernimmt
`L` und beim Wechsel `Q`; `applyTheme('')` entfernt Attribut, Speicher und
alle Inline-Variablen. Konsolenfehler: nur `favicon.ico` 404. Das
Passwort-Overlay wurde im Test per Skript entfernt, nicht per Eingabe.

**Ungeprüft.** Ein echter Spielablauf mit Firebase-Buzzern unter einer
Richtung; Feud-Start (`startGame` brach im Test mit „Keine Fragen!" ab,
weil das frische Profil keine Fragen hat). Die übrigen Screens nur über
die Variablen, nicht einzeln angesehen.

**Offen.** Das Gamemaster-Fenster (`updateGamemasterOverlay` in
`js/feud.js`, „Zwischensequenz läuft") hat eigene, fest dunkle Farben und
folgt der Richtung nicht. Nur Host-Sicht, deshalb liegen gelassen. Die
Generator-Skripte der Entwürfe liegen weiter nur im Scratchpad.

**Fallstricke.** `window.open` aus `Runtime.evaluate` braucht
`userGesture: true`, sonst blockt Edge das Mainscreen-Fenster.

---

## 2026-10-06 — Themen-Layouts, Runde 3 abgeschlossen (`de8c19f`, `9ca0239`, `3a8cbd8`, `c0526ac`, `febdeb7`, `79b91db`)

Fortsetzung des Eintrags darunter (L, D, H, M). Auftrag, Methode und
Prüfweg stehen dort.

### Gemacht

| Commit | Richtung | neu |
|---|---|---|
| `de8c19f` | N Papier | Feud als **Wegweiser in der Hügellandschaft**, Wer weiß als **Briefumschläge** (Briefmarken als Punkte), TP als **Spielpfad** mit Figur, Turnier als **Papierberge** mit Gipfelfahnen, Handy als **Papierstapel** |
| `9ca0239` | P Memphis | Feud als **Formen-Collage** (verdeckte Formen gemustert), Wer weiß als **Sprechblasen**, TP als **Twister-Matte** mit Drehscheibe, Handy als **Sternknall** |
| `3a8cbd8` | Q Riso | Feud als **Abreiß-Tickets**, PIH als **Supermarkt-Prospekt**, Wer weiß als **Prüfungsbogen**, TP als **Kartenfächer**, Turnier als **Festival-Plakat** (Größe nach Platz), Handy als **Eintrittskarte** |
| `c0526ac` | R Jazzplatte | Feud als **Plattenkiste**, PIH als **Cover mit Preisaufklebern**, Wer weiß als **Plattenhüllen**, TP als **Plattenspieler von oben**, Millionär als **Jukebox** |
| `febdeb7` | S Art déco | Feud als **Hotel-Postfächer** mit Rezeptionsglocken, PIH als **Auktionshaus** mit Bieterkellen, Wer weiß als **Aufzugtüren** |
| `79b91db` | C, H, S | Nachzügler aus der Gesamtsichtung: C Wer weiß **Stickerbogen**, C Millionär **Glücksscheibe**, H Turnier **Kreisplakat**, S TP **Halbfächer** |

Insgesamt in Runde 3: **40 Screens** (36 aus der ersten Liste + 4
Nachzügler).

### Warum die Nachzügler

Die erste Liste kam aus Kontaktabzügen nur für D, H, L–S, weil B bis K laut
Branch-Historie schon eine zweite Runde hatten. Der Schluss-Abzug über
**alle 18** zeigte trotzdem vier Gerüst-Dubletten in C, H und S. Lehre:
„laut Historie erledigt“ ist kein Befund, der Abzug über alle ist es.

### Geprüft

- Jeder neue Screen per Edge-Headless in Originalgröße angesehen. Beim
  Ansehen gefunden und behoben u. a.: Überdruck-Kopie brach anders um als
  der Text (Q-Turnier, jetzt Grid mit zwei Ebenen in derselben Box);
  `clip-path` schnitt die Kontur-Schatten mit ab (P-Formen, jetzt Kontur
  auf eigener Ebene); Wortbruch „BIERKAST-EN“ (R); Karte angeschnitten
  (Q-TP, R-WWDS, BAUPLAN 4.6); Zeiger auf falscher Kategorie (P-TP).
- Schluss-Kontaktabzüge aller 18 Richtungen für Feud, Wer weiß, PIH,
  Millionär, DDF, TP, Turnier, Lobby, Ergebnis, Menü, Handy, Jeopardy
  angesehen.
- Die Ähnlichkeits-Kennzahl taugt **nicht** als Beleg: Feud vorher/nachher
  z. B. D 68→67, M 63→59, P 77→66, Q 35→69 — jede mittig gesetzte
  Komposition landet bei 60–75. Belastbar sind nur die Abzüge.
- `node check.js` vor jedem Commit: alles in Ordnung.

### Offen

- **Nach `master`** (live) erst nach Davids Freigabe. Der Branch enthält
  außer `designs/` auch den Design-Umschalter in der Show (`9a78a8f`:
  `styles.css` auf Variablen, `js/theme.js` neu) — der greift in die
  laufende Show ein und sollte vor dem Merge einmal im Browser durchgeklickt
  werden.
- Nicht neu gebaut, weil sie schon eigene Ideen haben, aber Kandidaten,
  falls David weiter schärfen will: Listen-Layouts bei Wer weiß (A, D, J,
  K, O) und Handy-Knöpfe, die alle mittig sitzen (liegt am Buzzer selbst).
- Skripte (`kit.js` + je Richtung eine Datei) weiterhin nur im Scratchpad.

---

## 2026-10-06 — Themen-Layouts, Runde 3, Teil 1 (`b76eda5`, `6ca0f92`, `bac49f1`, `c901a8f`)

**Auftrag (David):** „alle sollen ein individuelles Layout haben, auch
inspiriert am Design (z.b. mit der Zeitung und dpih kann man was schönes
machen) … bei allen die nicht fertig sind fertig machen."

**Vorab:** Diese Sitzung hat auf dem Branch der vorigen weitergemacht. Deren
„Runde 2“ (`79e91c6` … `202cddc`, B bis K: „eigenes Grundgerüst“) stand
noch in keinem HANDOFF-Eintrag — hier nachgetragen: B, C, D (nur Turnier),
E, F, H (DDF, Handy), I, J, K bekamen dort für einzelne Screens neue Gerüste.
Für L bis S lief Runde 2 nicht mehr.

### Wie „nicht fertig“ bestimmt wurde

1. **Gemessen:** alle 216 Screens in iframes geladen, je Screen ein Raster
   (32×18) aus Text- und Flächenpositionen, Kosinus-Ähnlichkeit zur
   ähnlichsten anderen Richtung. Taugt nur als Hinweis: Jeopardy lag bei
   allen um 0,77, weil das 6×5-Brett vom Spiel vorgegeben ist — obwohl die
   Bretter sichtbar verschieden sind.
2. **Kontaktabzüge angesehen**, je Show alle Richtungen nebeneinander, für
   D, H, L, M, N, P, Q, R, S größer. Ergebnis, 36 Screens:
   - Family Feud bei **allen neun** dasselbe Gerüst (Frage oben, zwei
     Spalten Antworten, Punkte daneben).
   - Wer weiß: drei A/B/C-Spalten bei H, L, M, N, P, Q, R, S.
   - Preis ist heiß: Produkt + großer Preis + Liste bei D, L, Q, R, S.
   - TP: Rad links, Karte rechts bei N, P, Q, R. Turnier: Rangliste bei
     M, N, Q. Millionär: D und R gleich. Handy: runder Knopf bei M, N, P, Q.
     Ergebnis: M.

### Gemacht (bisher)

| Commit | Richtung | neu |
|---|---|---|
| `b76eda5` | L New York | PIH als **Kleinanzeigen-Seite** (Gebote als Anzeigen, Zuschlag mit Tintenkreis), Feud als **Umfrage-Infografik** (geschwärzte Balken), Wer weiß als **Stimmzettel** |
| `6ca0f92` | D Late Night | Feud als **Top-8-Countdown** mit Moderatorentisch vor Skyline, PIH als **Applausometer**, Millionär mit Leiste oben und **Moderationskarten** |
| `bac49f1` | H Bauhaus | Feud als **Mondrian-Raster**, Wer weiß als **Kreis/Quadrat/Dreieck-Komposition** |
| `c901a8f` | M Aurora | Feud als **Sternbild**, Wer weiß als **Umlaufbahn**, Turnier als **Planetensystem**, Handy als **Glasplatte**, Ergebnis als **Planet mit Mond** |

### Geprüft

- Jeder neue Screen als Edge-Headless-Bildschirmfoto in Originalgröße
  (1280×720, Handy 390×844) angesehen; gefundene Fehler behoben: Etikett
  ragte aus dem Bild (M-Feud), Kugel überdeckte Fragekarte (M-WWDS),
  geschwärzte Balken länger als höher platzierte Antworten (L-Feud),
  leere untere Hälfte (L-WWDS).
- `node check.js` vor jedem Commit: alles in Ordnung.

### Offen

- ~~**N, P, Q, R, S** stehen noch aus~~ — erledigt, siehe Eintrag darüber.
- Dann alles nach `master` — erst nach Davids Freigabe; der Branch enthält
  auch den Design-Umschalter in der Show (`9a78a8f`, ändert `styles.css`).
- Skripte (`kit.js` + je Richtung eins) liegen im Scratchpad dieser Sitzung,
  nicht im Repo.

### Fallstricke

- Das Vorschaufenster der Desktop-App rendert nicht, solange die App im
  Hintergrund liegt („page did not finish rendering“). Zuverlässig:
  `msedge --headless=new --screenshot` mit eigenem `--user-data-dir` — ohne
  das hängt sich der zweite Aufruf an den ersten und schreibt keine Datei.

---

## 2026-10-05 — Eigene Layouts je Richtung (`e3df1d8` … `c114944`)

**Auftrag (David):** „gib den Designs auch verschiedene Layouts. die sind
1zu1 gleich alle, nur reskins. das sollen schon eigene dinger sein."

### Gemacht

17 Richtungen (B–S, ohne A als Vorlage) haben in `designs/s/` eigene
Anordnungen bekommen, nicht nur andere Farben. Je Richtung ein Commit:

| Commit | Richtung | neu gebaut |
|---|---|---|
| `e3df1d8` | B Arcade | alle 10 Spiel-/Menü-Screens |
| `47cdba6` | C Pop | alle 10 |
| `dd9f0a8` | D Late Night | 8 (Menü, Leinwand unverändert) |
| `3b9a87d` | E 70er | alle 10 |
| `e80362d` | F Comic | alle 10 |
| `16fef42` | H Bauhaus | 8 (Menü, Leinwand unverändert) |
| `818da68` | I Salon | alle 10 |
| `fd62ea8` | J Kreide | alle 10 |
| `f28ec6a` | K Neon-Bar | alle 10 |
| `ef34011` | L New York | 7 (Menü, Leinwand, Handy unverändert) |
| `648ea92`, `66567a0` | M Aurora | alle 10, danach Menü-Umlaufbahn über das Dock gehoben |
| `5221c62` | N Papier | alle 10 |
| `d64080e` | O Terminal | 8 + Lobby und Ergebnis |
| `0db89a1` | P Memphis | alle 10 |
| `102c55b` | Q Riso | alle 10 |
| `ba532fb` | R Jazzplatte | 8 (Menü, Leinwand unverändert) |
| `c114944` | S Art déco | alle 10 + Lobby und Ergebnis |

Lobby und Ergebnis von O und S stammen nicht aus `5532a96`, sondern aus
der Ursprungsfassung der Entwürfe, und waren dort das umgefärbte A-Gerüst
(`grid-template-columns: 330px minmax(0,1fr)` in A, O und S) — deshalb
nur dort neu. Die 15 aus `5532a96` hatten schon eigene Gerüste.

### Warum so

- **Erzeugt, nicht von Hand.** Je Richtung ein Python-Skript, gemeinsamer
  Inhalt (Fragen, Namen, Punkte) aus einer `base.py`, damit alle 216
  Screens dieselbe Spielsituation zeigen und nur das Layout sich
  unterscheidet. Die Skripte liegen **nur im Scratchpad der Sitzung**, nicht
  im Repo — siehe Offen.
- **Layout aus dem Thema abgeleitet, nicht zufällig variiert**: Arcade als
  Highscore-Liste, Jazzplatte mit Plattenteller und Tonarm, Art déco mit
  Stufentürmen und Strahlenfächer usw. Verworfen: ein gemeinsames Gerüst
  mit drei, vier Varianten — genau das wäre wieder „Reskin".

### Geprüft

- Jede Richtung nach dem Bau mit einem Playwright-Prüfer (1280×720,
  Handy 390×844, Google Fonts lokal eingebunden): überlappende
  Textkästen, Text außerhalb des Bildes, abgeschnittener `nowrap`-Text,
  Konsolenfehler. Plus Kontaktabzug aller 12 Screens angesehen.
- Schlusslauf über alle 18 Richtungen: **0 Seitenfehler**. Übrig bleiben
  Meldungen in D-Menü (1), I-WWDS (1), O-Leinwand (8), Q (9 Screens),
  R (3 Screens) — alle angesehen und gewollt: Riso-Überdruck mit
  versetzter Kopie, riesige Hintergrundzahl, angeschnittene Schallplatte,
  Terminal-Punktlinien. Der Prüfer kennt Absicht nicht.
- Bei S beim Prüfen gefunden und behoben: Bodoni-„4" mit Haarstrich las
  sich bei 34 px wie „1" (Jeopardy „400" → „100") — Zahlen jetzt in
  Josefin Sans; Stufen-`clip-path` war rechts nicht gespiegelt (schräge
  Kante statt Stufen); Verlaufsschrift im Handy-Knopf war unsichtbar, weil
  der Knopf-Hintergrund `background-clip:text` überschrieb.
- `node check.js` und `node check.js --types`: alles in Ordnung
  (14 js-Dateien typgeprüft, keine Meldung).

### Offen

- **Generatoren nicht im Repo.** Wer ein Layout ändern will, ändert jetzt
  das HTML in `designs/s/` direkt. Die Skripte gehen mit dem Container
  verloren.
- **Canvas-Artefakt** (claude.ai, Version 32) hat nur die Fixes aus
  `247cce7`, nicht die neuen Layouts. Ein Re-Export aus dem Canvas würde
  die Layouts überschreiben.
- Die Layouts sind **Entwürfe**. In der App selbst (`index.html`) wechselt
  das Design nur Farben und Schriften (Eintrag `9a78a8f` unten), nicht die
  Anordnung.

### Fallstricke

- Python 3.11: kein Backslash und keine gleichen Anführungszeichen innerhalb
  von f-String-Ausdrücken — hat bei acht Skripten geknallt.
- `background-clip:text` auf einem `<button>` wird vom eigenen
  `background` des Knopfs überschrieben → Text in ein `<span>`.

---

## 2026-10-05 — Lobby und Ergebnis für 15 Richtungen (`5532a96`)

**Auftrag (David):** „mach außerdem für den Rest der bisher keins hat Lobby
und Ergebnis"

### Gemacht

30 neue Dateien `designs/s/X-Lobby.html` / `X-Ergebnis.html` für die 15
Richtungen außer A, O und S (die hatten sie schon), `designs/index.html`
listet jetzt **216 Screens** (18 × 12).

### Geprüft / Offen

Im Schlusslauf (Eintrag oben) mitgeprüft, 0 Seitenfehler. Die schon
vorhandenen O- und S-Fassungen waren nur das A-Gerüst umgefärbt — in
`d64080e` und `c114944` ersetzt.

---

## 2026-10-05 — Design der ganzen Seite umstellbar (`9a78a8f`)

**Auftrag (David):** „ich will dass man mit dem Button in ein Menü kommt,
wo man das für die Ganze Seite das Design einstellen kann."

### Gemacht

- **`styles.css`**: Farben und Schriften als Variablen auf `:root`
  (Standard = bisheriges Studio-Blau): `--font-display/-body/-logo`, `--bg`,
  `--bg-img`, `--bg-size`, `--panel`, `--panel-hi`, `--line`, `--fg`,
  `--fg-rgb`, `--fg-strong`, `--muted`, `--pill-fg`, `--accent-line`,
  `--accent-text(-rgb)`, `--on-accent`. Ersetzt: 46× Bebas, 16× Inter,
  2× Luckiest, 42× `color:#fff`, 174 weiße `rgba(...)` in color/border/
  background, 55× `color: var(--gold)` → `--accent-text`, 11 goldene
  `rgba`-Schriftfarben, 5× `#1a1200` → `--on-accent`.
- **`js/theme.js`** (neu, lädt im `<head>` direkt nach `styles.css`, damit
  nichts erst blau aufblitzt): `DESIGN_THEMES` mit 18 Sätzen,
  `applyThemeToDoc(doc, key)`, `applyTheme(key)` (speichert in
  `localStorage` unter `designTheme`), Design-Screen mit Vorschau-Iframes
  (`renderDesignScreen`), Sprung in die Entwurfsseite
  (`openDesignGallery`).
- **`index.html`**: Knopf „🎨 Design" im Hauptmenü öffnet `#design-screen`.
- **`js/feud.js`**: Mainscreen-Popout bekommt das Thema per
  `applyThemeToDoc` — der Spiegel kopiert nur `<body>`, die Variablen auf
  `<html>` kämen sonst nie an.
- **Helle Themen** (C, F, H, L, N, P, Q): eigenes `--accent-text`, Logo-
  Schrift über `.logo-word` eingefärbt, Teamkarten mit deckenden Verläufen
  und weißer Schrift.

### Warum so

Variablen statt austauschbarer Stylesheets: ein Satz von 18 Werten je
Thema statt 18 Kopien von 1000 Regeln. Verworfen: Pixelvergleich als
Beleg, dass Klassik unverändert bleibt — die Einblend-Animation der Screens
machte ihn zu verrauscht; stattdessen berechnete Styles verglichen.

### Geprüft

- Ohne Thema: **694 Elemente** mit identischen berechneten Styles vor und
  nach der Umstellung.
- Kontrast (Schwelle 3:1, halbtransparente Schrift angenähert) auf Menü,
  Jeopardy-, Feud-, WWM-Setup und Turnier für alle 18 Themen, am Ende
  dieser Sitzung neu gemessen: 17 Themen **0** Treffer, L (New York) **2** —
  der Hinweis „QR-Code zeigen und scannen" mit 2,9:1.
- `node check.js`, `node check.js --types`: in Ordnung.

### Offen

- **Handy-Seiten** (`buzzer/`, `gamepad/`) sind nicht thematisiert.
- Das Thema gilt **pro Browser** (`localStorage`); ein zweites Gerät
  startet in Klassik. Der Mainscreen-Popout zieht mit.
- Nur Farben und Schriften wandern in die App, keine Layout-Möbel der
  Entwürfe (Platten, Stufen, Rahmen).
- **Nicht geprüft**: Press Start 2P (B Arcade) und Bangers (F Comic) in
  den Spiel-Screens auf Überlauf — beide laufen breiter als Bebas. Bangers
  hat dasselbe ß-Problem wie in den Entwürfen (ß ≈ B), in der App nicht
  behandelt.
- L: Hinweistext 2,9:1, knapp unter 3.

### Fallstricke

- Neue Farben in `styles.css` als Variable schreiben, nicht als
  `#fff`/`rgba(255,255,255,…)` — sonst bleibt die Stelle in hellen Themen
  weiß auf hell. Für Weiß mit Alpha: `rgba(var(--fg-rgb), .5)`.
- Gold als **Schrift** heißt `--accent-text`, Gold als **Fläche/Linie**
  bleibt `--gold`/`--accent-line`. In hellen Themen sind das zwei
  verschiedene Farben.

## 2026-10-05 — Entwürfe durchgemessen, drei Fehler behoben, Menü-Knopf (`247cce7`)

**Auftrag (David):** „siehst du die neuen Designs" → „fix alles" → „das liegt
aktuell auf einer Seperaten url. ich will dass das auf der Seite ein Menü
dafür gibt."

### Gemacht

Alle **186** Screens aus `designs/s/` im Browser vermessen (Playwright,
1920×1080) — die Lücke, die der Eintrag darunter als „nicht geprüft"
ausweist. Gesucht: überlappende Textkästen, abgeschnittener `nowrap`-Text,
waagerechtes Scrollen, Konsolenfehler.

Drei echte Fehler, alle behoben:

1. **D · Late Night, Menü.** Titel `font-size: 46px` in einer Spalte von
   330 px (Zeile 03) bzw. 348 px (04). Gemessene Textbreite 348 bzw. 403 px
   → Umbruch auf zwei Zeilen = 92 px in einer fest `height: 86px` hohen
   Zeile, also 6 px über die Trennlinie. Jetzt **38 px + `white-space:
   nowrap`**; gemessen: alle acht Titel einzeilig (38 px hoch),
   `scrollWidth == clientWidth`, nichts abgeschnitten. 38 px ist die
   größte Stufe, bei der auch „Wer weiß denn sowas" (333 px) in seine
   348-px-Spalte passt.
2. **Q · Riso, Menü.** Die beiden Deko-Kreise (`right: 90px/top: -60px` und
   `right: 230px/top: 40px`) lagen über „GAMESHOW · AUSGABE 8" (Textkasten
   530–938 px) und über dem Titel von Karte 4. Dunkelblau auf Magenta ist
   nicht lesbar. Nach oben rechts geschoben (`right: 10px/top: -110px` und
   `right: 80px/top: -30px`), so dass die Unterkante über der Kartenreihe
   (236 px) und die linke Kante rechts vom Text (938 px) bleibt.
3. **A · Studio und F · Comic, ß.** Bebas Neue und Bangers sind reine
   Versalschriften; ihr ß wird auf Versalhöhe gezeichnet und liest sich wie
   ein B — „WER WEIB DENN SOWAS", „DER PREIS IST HEIB". Eine Regel im
   `<head>` jeder A-/F-Datei setzt `text-transform: uppercase` auf alles,
   dessen Inline-Style die Schrift nennt; Chrome bildet ß dabei auf SS ab.

Dazu, auf Davids Wunsch, der Weg hin und zurück:

- **`openDesigns()`** in `js/core.js`, Knopf „🎨 Designs" in den
  `menu-pills` des Hauptmenüs. Öffnet einen eigenen Tab (benannt
  `iryo-designs`, also höchstens einer), kein Screen-Wechsel.
- **Rückweg** in `designs/index.html`: Link „← Show" im Kopf.

### Warum so

- **38 px statt zwei Zeilen bei D.** Die Alternative war `line-height: .9`
  (2 × 41,4 = 82,8 px, passt auch in 86 px). Verworfen: sechs der acht
  Zeilen sind einzeilig, zwei zweizeilige dazwischen sehen nach Versehen
  aus, nicht nach Entwurf. Das Menü ist der Host-Bildschirm, nicht die
  Leinwand — BAUPLAN 4.2 (aus drei Metern lesbar) gilt dort nicht.
- **Kreise verschieben statt Text verschieben.** Der Riso-Look lebt von den
  Flächen in der Ecke; die Textpositionen sind die Komposition.
- **`text-transform` statt „weiss" schreiben.** Die Schreibweise im Entwurf
  bleibt richtiges Deutsch, nur die Darstellung ändert sich. Geprüft: in
  allen 22 A-/F-Dateien kein Element mehr, das in der Versalschrift ein ß
  zeigt — und kein Element, das die Regel versehentlich erwischt (also
  `uppercase` ohne die Versalschrift).
- **Eigener Tab statt Screen.** `designs/` hat bewusst keinen Zugriff auf
  `js/`, `styles.css` oder Firebase. Ein Fehlklick während der Show soll
  die laufende Seite nicht verlassen.
- **Regel gebrochen, bewusst:** der Eintrag darunter hält fest „Kein Link
  aus `index.html`". David hat den Knopf ausdrücklich verlangt. Die Trennung
  bleibt technisch bestehen — nur der Link ist neu.

### Geprüft

- `node check.js --types`: 13 Dateien typgeprüft, keine Meldung; 420
  Handler, 263 IDs, 986 Klammernpaare. Alles in Ordnung.
- **186 Screens, vorher und nachher.** Vorher 12 auffällige Dateien, nachher
  11 — die verbliebenen sind gewollt: Q-Riso druckt jeden Titel doppelt
  versetzt (Fehldruck-Effekt), F legt „IRYO!" auf „GAMESHOW", L stapelt den
  Stempel, O-Leinwand ist ASCII. **0 Konsolenfehler, 0 waagerechtes
  Scrollen, 0 abgeschnittener nowrap-Text** in allen 186.
- D-Menu meldet weiter „Show ↔ Host-Steuerung · 8 Shows (328×6)". Das ist
  **kein** Fehler: bei `font-size: 148px; line-height: .82` ragt der
  *Inline-Kasten* des `<span>` 6 px tiefer als seine Zeilenhöhe. Im
  Screenshot liegt zwischen der Unterkante von „SHOW" und der Unterzeile
  sichtbar Luft. Ich hatte das David zuerst als Fehler gemeldet — falsch.
- Knopf im Hauptmenü: im DOM vorhanden, `typeof openDesigns === 'function'`,
  Klick öffnet `designs/#1/Leinwand` in einem zweiten Tab, dessen „← Show"
  auf die Wurzel zeigt. 0 Seitenfehler.
- **Nicht geprüft:** ob die Entwürfe auf einem echten Beamer taugen; die
  Helligkeit der hellen Richtungen ist nur im Screenshot beurteilt.

### Fallstricke

- **Schriften über den Proxy sind unzuverlässig.** Die ersten beiden
  Durchläufe liefen ohne die Google-Schriften — der Browser im Container
  geht nicht von selbst über `HTTPS_PROXY`, und selbst mit Proxy kam die
  Schrift mal an und mal nicht. Mit Ersatzschrift ist Big Shoulders
  Display viel breiter, und D sah nach vier kaputten Zeilen aus statt nach
  zwei. **Für jede Messung an `designs/` erst die Schriften lokal ablegen
  und per `page.route` ausliefern** — sonst misst man den Offline-Fall.
  Das Gerüst dafür liegt im Scratchpad (`lab.mjs`, `gf/`), nicht im Repo.
- Die Dateien in `designs/s/` sind **Export**. Dieselben drei Fixes stehen
  deshalb auch in der Canvas-Quelle
  (https://claude.ai/artifact/696browiHr6kBspCBfJm6G, Version 32):
  `project/D-Menu.dc.html`, `project/Q-Menu.dc.html` und die
  `<helmet><style>`-Blöcke von `project/Main.dc.html` (= A · Menü) sowie
  allen `A-*` und `F-*`. Wer neu exportiert, bekommt sie mit. Das
  Export-Skript selbst gibt es weiterhin nicht im Repo.
- Das Prüfskript findet nur Überlappungen zwischen **Text**kästen. Der
  Riso-Kreis über dem Text ist ihm entgangen — gesehen habe ich das erst im
  Screenshot. Messen ersetzt das Hinsehen nicht.

---

## 2026-10-05 — Design-Entwürfe als eigene Seite `designs/` (`69e3a75`)

**Auftrag (David):** „ein KOMPLETTes visuelles rework, erstmal nur
prototypen um sich für eins zu entscheiden“ — dann „mach einen Button wo
ich durchwechseln kann, mit einer Vorschau, durchnummeriert“ und „push mir
den Button mit den Designs“ (ausdrücklich: ins Repo, live).

### Gemacht

`designs/index.html` blättert durch **18 Richtungen** (nummeriert 01–18),
je **Menü, Family-Feud-Leinwand, Handy-Buzzer** und die sieben übrigen
Shows (Jeopardy, WWM, WWDS, DDF, PIH, TP, Turnier); A, O und S zusätzlich
Lobby und Ergebnis. **186 Screens** in `designs/s/`, je eine eigenständige
HTML-Datei. Bedienung: ◀ ▶, Reiter je Screen, Miniaturen, Pfeiltasten;
der Zustand steht im Hash (`#7/Leinwand`), ein Link zeigt also genau einen
Entwurf.

Live: https://iryogameshows.github.io/designs/

### Warum so

- **Reine Vorschau, vom Spiel getrennt.** Kein Link aus `index.html`, kein
  Zugriff auf `js/`, `styles.css` oder Firebase, `noindex`. Nichts davon ist
  ins Spiel übernommen — die Entscheidung für eine Richtung steht aus.
- **Jeder Screen als eigenes Dokument im `<iframe>`.** 18 Richtungen bringen
  18 Schriftfamilien-Sätze und widersprüchliches CSS mit; im iframe stört
  keiner den anderen. Verworfen: alles in eine Seite mit Klassen-Präfixen —
  hätte jeden Entwurf umschreiben müssen.
- **Statisch gerendert.** Die Entwürfe entstehen in einem claude.ai-Design-
  Canvas (`.dc.html` mit Vorlagen-Syntax, 32 davon mit Schleifen). Ein
  Export-Skript rendert sie zu reinem HTML; die Canvas-Laufzeit wird nicht
  gebraucht.
- Teamfarben bleiben in allen Richtungen Rot `#E8453C` / Blau `#3B82F6`
  (BAUPLAN 4.4), Leinwand-Screens ohne Host-Knöpfe (4.1).

### Geprüft

- `node check.js`: alles in Ordnung (13 JS-Dateien, 419 Handler, 263 IDs,
  986 Klammernpaare) — `designs/` liegt außerhalb dessen, was er prüft.
- Export: 186 Screens, **0** Vorlagenreste (`{{`, `<sc-`, `<dc-import>`).
- Lokal im Browser (`http-server`, Port 3000): Startansicht #1, Umschalten
  per Reiter auf einen gerenderten Schleifen-Screen (B · Menü), zweimal ▶
  → `#4/Menu`, `D · Late Night`, richtiges `src`. **0 Konsolenfehler.**
  Handybreite 375 px: Reiter brechen um, Vorschau skaliert, Miniaturen
  scrollen waagerecht.
- **Nicht geprüft:** jeder einzelne der 186 Screens auf Überlauf; nur
  Stichproben angesehen.

### Offen

- **Quelle liegt nicht im Repo.** Canvas:
  https://claude.ai/artifact/696browiHr6kBspCBfJm6G (privat). Generator,
  Häute und Export-Skript lagen nur im Scratchpad der Sitzung. Wer
  `designs/` ändern will, ändert den Canvas und exportiert neu — oder die
  Skripte kommen ins Repo; das wäre der nächste sinnvolle Schritt, falls die
  Seite länger lebt.
- David: G (Arena) gestrichen, A und O „passen“, **S soll schöner werden** —
  steht als Nächstes an und ersetzt dann die S-Dateien hier.
- Inhalte (Fragen, Namen, Punkte) sind Beispielinhalt.

### Fallstricke

- Im Canvas darf ein `<sc-for>` nicht direkt in `<table>` stehen — der
  HTML-Parser schiebt es aus der Tabelle. Tabellen dort als CSS-Grid.
- Der Canvas-Index (`canvas.json`) wird von der Seite selbst normalisiert;
  vor jedem Schreiben neu lesen, sonst lehnt der Publish ab.

---

## 2026-10-05 — BAUPLAN: Architektur-Überblick und drei Test-Regeln (`b255a14`)

**Auftrag (David):** Erst „beschreib meine ganze codebase so als wäre ich ein
Kind", dann „beschreib mir den code, sodass ich mit großen worten um mich
werfen kann obwohl ich keine Ahnung hab" — und schließlich „pack das in die
BAUPLAN.md".

### Abschnitt 0 · Was hier eigentlich steckt

Der Überblick für jemanden, der das Projekt zum ersten Mal sieht. In einem
Satz: zero-build, framework-lose Single-Page-Anwendung mit
Realtime-State-Synchronisation über drei Clients und einem selbstgeschriebenen
statischen Analyzer.

**Jeder Begriff ist an einer Code-Stelle belegt, die dabeisteht.** Das ist die
Bedingung, unter der so ein Abschnitt in einen Bauplan gehört: DOM-Diffing →
`morphMirror`, dreistufige Degradation → `mode: 'firebase'|'sse'|'none'`,
Proxy-RPC → `gmRemoteBridgeScript`, Optimistic Concurrency → die `transaction`
auf `tpspin/by`, logische Uhr → `nextRoundId`, Fail-closed Allowlist →
`BOARD_PUBLIC_SCREENS` und `GM_REMOTE_ALLOWED_FNS`.

**Die zweite Tabelle ist die wichtigere: was hier NICHT steckt.** Keine
Test-Suite (`check.js` ist ein Linter), keine CI-Prüfung (die Action deployt
nur und ruft `check.js` nicht auf — nachgesehen in `pages.yml`), kein Server,
keine Skalierung über den Keller hinaus, keine Typsicherheit zur Laufzeit.
`HOST_PASSWORD` steht als `'keller2024'` im ausgelieferten JavaScript — ein
Vorhang, kein Schloss.

Ein Bauplan, der mit Wörtern wirbt, die nicht eingelöst sind, verleitet den
Nächsten zu falschen Annahmen. Deshalb beides in einem Abschnitt.

### Dabei eine eigene Aussage korrigiert

In der ersten Fassung stand, die PINs seien „SHA-256-gehasht, **ungesalzen**".
Beim Nachsehen in `hashPlayerPin()`:

```js
const data = new TextEncoder().encode('keller:' + playerKeyOf(name) + ':' + pin);
```

Das ist ein fester Präfix plus der Name — kein Zufallswert je Eintrag und kein
Key-Stretching, aber auch nicht schlicht „ungesalzen". Gegen eine Tabelle über
alle Nutzer hilft es, gegen gezieltes Durchprobieren einer einzelnen PIN nicht.
So steht es jetzt da.

**Die grobe Fassung stand schon in der Datei, bevor sie geprüft war** — der
Fehler lag nicht im Schreiben, sondern in der Reihenfolge. Erst alle
Behauptungen belegen, dann committen.

### Abschnitt 5.1 · Drei Regeln für den Test selbst

Diese drei standen in **vier HANDOFF-Einträgen in Folge** als „gehört in den
BAUPLAN" und haben jeweils einen Fehler durchgelassen. Jetzt eingetragen:

1. **Ein Test, der beim kaputten Code grün gewesen wäre, ist kein Beleg.**
   (`82e9822` — Turnier-Direktstart meldete ohne verbundene Handys „bleibt
   stehen", was der kaputte Code auch gemeldet hätte.)
2. **Ein Test muss die Wege nehmen, die der Host nimmt, nicht die, die der Code
   vorsieht.** (`6074253` — der Lobby-Merker wurde über „Buzzer auf, Buzzer zu"
   geprüft; die echten Fälle standen nie drin.)
3. **Globales `querySelector` trifft in dieser App fast immer den falschen
   Screen.** Alle Screens stehen gleichzeitig im DOM; der erste Treffer ist
   womöglich der eines anderen Spiels, unsichtbar, mit Bounding-Box 0×0.
   (`21ca4e7`.)

### Warum Abschnitt 0 und nicht eine neue 1

Die Nummerierung bleibt dadurch stabil. In `HANDOFF.md` stehen Verweise auf
`BAUPLAN.md` 3.9, 4.3 und 5; eine Umnummerierung hätte sie alle stillschweigend
falsch gemacht. Interne Verweise innerhalb der Datei gibt es keine — geprüft.

### Geprüft

- Alle Behauptungen aus Abschnitt 0 gegen den Code: `HOST_PASSWORD` im
  Klartext, `hashPlayerPin` ohne Zufallssalt, `pages.yml` ohne `node`-Aufruf,
  `new Proxy` in `js/buzzer.js:626`, `.transaction(` an drei Stellen,
  `onDisconnect()` in `buzzer/index.html`, `EventSource` als SSE-Rückfall.
- `node check.js` ohne Befund (Markdown berührt ihn nicht, der Lauf gehört
  trotzdem zum Schritt).
- Gliederung danach: 0 bis 5, 587 Zeilen.

### Offen

- Abschnitt 0 nennt „rund 16.000 Zeilen" und „13 Dateien in `js/`". Das ist der
  Stand von heute und veraltet mit der nächsten Show. Beim nächsten größeren
  Umbau nachzählen statt fortschreiben.
- Die Testskripte und der Firebase-Stub liegen weiterhin nur im Scratchpad.
  5.1 verweist auf den Stub, ohne dass er im Repo liegt — das ist die
  offensichtlichste Lücke in dieser Datei.

---

## 2026-09-28 — GIF-Screen zwischen Fragen, zweiter Anlauf (`6074253`)

**Symptom (David):** „Man soll den gif screen zwischen fragen NICHT sehen."

**Das ist die zweite Meldung zu derselben Sache.** Die erste Fassung
(`1db72e0`, Merker `everLive`) war unvollständig, und einen Teil davon habe ich
danach selbst wieder aufgerissen.

### Die zwei Löcher

**1 · Der Merker hing nur an `live`.** Seit eine Schätzfrage den Buzzer gar
nicht mehr öffnet (`7d55620`, gestern gebaut), wird `live` bei einer Show, die
mit einer Schätzfrage anfängt, **nie** true. `everLive` blieb false, und nach
dem Schließen der Frage stand das GIF wieder da.

Das ist eine Folgewirkung meiner eigenen Änderung von vor einer Stunde: ich
habe den Buzzer für getippte Fragen abgeschaltet, ohne zu prüfen, wer sonst
noch an `live` hängt.

**2 · Der Merker stand nur im Speicher.** Das war beim ersten Mal eine bewusste
Entscheidung, mit der Begründung „nach einem Neuladen sieht man einmal die
Lobby, das ist der harmlose Fall". Das war falsch eingeschätzt: ein Handy, das
in der Tasche liegt, wird vom Browser verworfen und beim Herausholen neu
geladen — genau dann, wenn man den Buzzer braucht.

### Gemacht

`everActive` statt `everLive`:

- **Zählt jede Regung**, nicht nur den Buzzer: `live`, `armed`, Schätzfeld,
  Rad (Trivial Pursuit), Abstimmung (Der Dümmste fliegt). Sechs Stellen rufen
  `markActive()`.
- **Liegt im `sessionStorage`**, überlebt also das Neuladen und endet mit dem
  Tab. Lesen und Schreiben in `try/catch` — im privaten Modus wirft das.

Zurückgesetzt wird er, wenn die **Beitrittssperre gelöst** wird: das tut der
Host beim Einrichten der nächsten Show (`ensureLobbyConnected`), und dann ist
die Lobby wieder richtig. Geprüft wird der WECHSEL (war an, ist jetzt aus) —
der Listener feuert beim Laden ohnehin einmal mit dem aktuellen Wert.

Ein Spiel, das gar nichts auf die Handys schickt („Wer weiß denn sowas"),
behält die Lobby durchgehend. Dort ist sie richtig: es gibt keine „zwischen
zwei Fragen"-Lage, und die Lobby zeigt seit `924a80e` immerhin das Team.

### Geprüft

Mit dem Firebase-Stub, alle sechs Wege am Stück:

| Lage | Screen | vorher |
|---|---|---|
| vor der ersten Frage | Lobby | Lobby (richtig) |
| Host öffnet Frage | Buzzer | Buzzer |
| zwischen zwei Fragen | **Buzzer** | GIF |
| Show fängt mit Schätzfrage an, danach zwischen zwei Fragen | **Buzzer** | GIF |
| F5 zwischen zwei Fragen | **Buzzer** | GIF |
| Host richtet nächste Show ein | Lobby | Lobby (richtig) |

Keine JavaScript-Fehler.

### Lehre

Beim ersten Mal war der Test derselbe Pfad wie der Code: ich habe „Buzzer auf,
Buzzer zu" nachgestellt und für gelöst erklärt. Die Fälle, die David trifft —
eine Show, die mit einer Schätzfrage anfängt, und ein Handy, das aus der Tasche
kommt — standen nie im Test.

**Das ist jetzt der vierte Eintrag in Folge mit dieser Lehre.** Sie gehört in
`BAUPLAN.md`, Abschnitt 5: ein Test muss die Wege nehmen, die der Host nimmt,
nicht die, die der Code vorsieht. Noch nicht getan.

---

## 2026-09-28 — Schätzfrage: Feld steht beim Öffnen schon, gesperrt (`7d55620`)

**Wunsch (David):** „wenn es ne Schätzfrage ist, dann soll es nicht auf den
Buzzer umspringen auf der Buzzer seite. wenn die ausgewählte Frage eine
Schätzfrage ist, dann soll die Schätzzeile auch schon da sein. aber halt mit
nem Schloss davor, und drunter steht dann: du kannst schätzen wenn der Host die
Frage zeigt".

(Der erste Teil derselben Nachricht — Teamnamen statt „Rot und Blau" — hat sich
erledigt: „ne das is geregelt". Nicht angefasst.)

### Was vorher passierte

`openJeopardyClue()` rief für **jede** Frage `jeopardyBuzzPrepare()`, also auch
für Schätzfrage und Einzelantwort. Das Handy sprang damit auf den
Buzzer-Screen mit „Achtung — noch NICHT buzzern!", und erst beim Aufdecken auf
das Eingabefeld. Zwei Wechsel für eine Frage — und der erste zeigte etwas, das
bei dieser Fragesorte **nie** kommt: dort wird nicht gebuzzert.

### Gemacht

Beim Öffnen einer getippten Frage: `jeopardyBuzzClose()` statt `-Prepare()`,
dazu `jeopardyEstimatePrepare()`. Das Feld steht damit sofort, aber gesperrt —
Schloss im Titel, Feld und Knopf deaktiviert, darunter Davids Satz. Beim
Aufdecken fällt die Sperre und die Frage kommt dazu.

**Die Frage geht im gesperrten Zustand bewusst nicht mit.** Sie steht zu dem
Zeitpunkt noch nicht auf der Leinwand; ein Handy, das sie vorher zeigt, wäre
ein Leck — und bei einer Schätzfrage ein besonders wirksames, weil man dann in
Ruhe nachschlagen kann. `question` bleibt leer, bis der Host aufdeckt.

Gebaut als **ein** Weg mit Schalter, nicht als zwei Funktionen:

```js
function jeopardyEstimateOpen(gesperrt){ … }
function jeopardyEstimatePrepare(){ jeopardyEstimateOpen(true); }
```

Zwei fast gleiche Funktionen wären auseinandergelaufen, sobald am Kanal etwas
dazukommt — dieselbe Lehre wie bei den Team-Knöpfen.

Auf dem Handy trägt `estLocked` den Zustand. Die Eingabetaste im Feld ruft
dieselbe Funktion wie der Knopf, deshalb steht die Sperre auch in der Wache von
`sendEstimate()` — ein deaktivierter Knopf allein hätte nicht gereicht.

Der Hinweis im GM-Panel sagt jetzt „Auf den Handys steht das Feld schon —
gesperrt, mit Schloss", statt „Beim Aufdecken geht ein Textfeld auf".

### Im Test gefunden

Die Hinweiszeile wurde nur `if (estLocked)` gesetzt und blieb deshalb stehen,
nachdem der Host längst aufgedeckt hatte: „Du kannst schätzen, wenn der Host
die Frage zeigt" über einer offenen Frage. Sie wird jetzt in jedem Fall
gesetzt.

### Geprüft

Handy (mit dem Firebase-Stub aus `924a80e`):

| Zustand | Screen | Titel | Frage | Feld/Knopf | Hinweis |
|---|---|---|---|---|---|
| gesperrt | estimate | 🔒 Schätzfrage | leer | **aus** | steht |
| aufgedeckt | estimate | 📊 Schätzfrage | da | an | weg |
| Einzelantwort gesperrt | estimate | 🔒 Einzelantwort | leer | **aus** | steht |
| normale Frage | **buzz** | — | — | — | — |
| Eingabetaste trotz Sperre | nichts abgegeben | | | | |

Host-Seite (auch mit Stub): beim Öffnen einer Schätzfrage ist der Buzzer zu
(`armed:false`), das Feld vorbereitet (`locked:true`) und die Frage geheim
(`question:''`); beim Aufdecken fällt die Sperre und die Frage kommt. Eine
normale Frage läuft unverändert über den Buzzer — vorbereitet beim Öffnen,
scharf beim Aufdecken.

Keine JavaScript-Fehler, `node check.js --types` ohne Befund.

### Offen

- „Der Preis ist heiß" benutzt denselben Firebase-Zweig (`buzzer/estimate`),
  kennt `locked` aber nicht und schreibt es bei `pihBeginBids()` per `.set()`
  ohnehin weg. Dort bleibt es beim bisherigen Ablauf — die Gebote gehen auf,
  wenn der Host sie öffnet. Nicht angefasst, weil dort kein Zwischenzustand
  „Artikel gewählt, aber noch nicht gezeigt" existiert.
- Das Daily Double bleibt unberührt: dort antwortet nur das wählende Team, und
  ein Eingabefeld auf allen Handys wäre falsch.

---

## 2026-09-28 — Team-Zuteilung in allen Lobbys · Team-Anzeige auf dem Handy (`924a80e`)

**Symptom (David, mit Bild der Jeopardy-Lobby):** „die team zuteilung soll da
laufen. nicht über ein seperates Fenster. bitte. bau das endlich bei allen um."
Dazu: „wenn man im Gif Screen ist, soll irgendwo stehen: Du bist in Team ...,
oder Du bist in noch keinem Team".

### 1 · Zuteilung an der Zeile, in allen sechs Lobbys

In den vier **Team-Lobbys** (Family Feud, Jeopardy, Wer weiß denn sowas,
Trivial Pursuit) stand je Zeile nur ein Merkzettel — der Team-Tag „kein Team".
Zugeteilt wurde in der Spielerübersicht, einem eigenen Screen, auf den der
Knopf „👥 Teams zuteilen" führte. Der Host musste also weg von dem Bildschirm,
den er gerade einrichtet, dort zuteilen und zurück.

Bei „Der Dümmste fliegt" und „Der Preis ist heiß" ging es längst an der Zeile.
Jetzt überall — mit `playerTeamButtonsHtml()`, derselben Funktion. Der Knopf
zur Spielerübersicht heißt nun „👥 Accounts verwalten": dort geht es um
Passwörter und Löschen, nicht mehr um Teams.

**Dabei aufgefallen — und es hätte den Umbau sonst wertlos gemacht:**
`assignPlayerTeam()` schrieb den neuen Stand lokal nur nach `allPlayers`. Die
Setup-Lobbys zeichnen ihre Zeilen aber aus `buzzer.presence` — zwei
verschiedene Firebase-Knoten (`buzzer/players` und `buzzer/presence`).

Solange die Zuteilung in der Spielerübersicht stattfand, fiel das nicht auf:
die liest `allPlayers`. In der Lobby hätte der Knopf erst reagiert, wenn
Firebase die Presence zurückspiegelt — bei stockender Verbindung also gar
nicht. Genau der Fall, den der Kommentar „Sofort anzeigen, statt auf die
Antwort der Datenbank zu warten" seit jeher verhindern sollte.

Die Presence-Kopien werden jetzt mitgezogen (beide Kontexte: Jeopardy hat eine
eigene Verbindung, Feud/WWDS/TP teilen sich eine), und
`refreshOpenSetupLobby()` zeichnet die offene Lobby neu — Gegenstück zum schon
vorhandenen `refreshOpenRosterLobby()`.

**Gemessen:** ohne die Presence-Zeilen meldete der Test nach einem Klick
`{davidTeam: null, aktiv: 0}` — nichts passiert. Mit ihnen
`{davidTeam: 0, aktiv: 1}`.

### 2 · Team-Zeile im Wartebildschirm des Handys

Neue Zeile zwischen Namen und Hinweistext: **„Du bist in Die Blauen"** in der
Teamfarbe, oder **„Du bist in noch keinem Team"** zurückgenommen. Davids
Wortlaut übernommen.

Sie liest denselben Wert wie der Chip auf dem Buzzer-Screen (`myTeam`,
`teamNames`). Beide Firebase-Listener rufen `refreshRoot()`, sie steht also
sofort richtig da, wenn der Host zuteilt — während der Spieler wartet, und
genau dann passiert die Zuteilung.

### Neu im Werkzeugkasten: ein Firebase-Stub für die Tests

Die Handy-Seite ließ sich bisher gar nicht im Browser testen. Sie ruft
`firebase.initializeApp()` in der ersten Zeile; ohne geladenes CDN — und in
dieser Sandbox ist es gesperrt — wirft das, und **alles** darunter läuft nie,
auch die `let`-Deklarationen. Der Test sah davon nur ein
„Cannot access 'acc' before initialization" und wusste nichts damit anzufangen.

`fbstub.js` im Scratchpad ersetzt Firebase durch ein Gerüst, das nichts tut,
aber jede Kette durchlaufen lässt (`ref().child().on()`, `set`, `push`,
`transaction`, `onDisconnect`, `ServerValue.TIMESTAMP`). Damit läuft die Seite
bis zum Ende durch und ihre Funktionen sind aufrufbar.

**Das ist die erste Möglichkeit überhaupt, `buzzer/index.html` automatisch zu
prüfen.** Alles, was dort bisher geändert wurde — Buzzer-Sperre, Lobby-GIF,
Einzelantwort — war nur aus dem Code hergeleitet.

### Geprüft

| | Ergebnis |
|---|---|
| Team-Knöpfe in den vier Team-Lobbys | je 8 (3 Leute × 2 Teams + 2 ✕) |
| Knopftext zur Spielerübersicht | „👥 Accounts verwalten" |
| Klick auf „Die Roten" in der Lobby | Team gesetzt, Knopf markiert, sofort |
| Handy ohne Team | „Du bist in noch keinem Team", grau |
| Handy Team 1 / Team 2 | „Du bist in Die Roten" rot / „Die Blauen" blau |
| JavaScript-Fehler | 0 in beiden Fenstern |

`node check.js --types` ohne Befund, das Skript von `buzzer/index.html`
separat mit `node --check`.

### Offen

- Der Firebase-Stub liegt im Scratchpad, nicht im Repo. Wenn die Handy-Seite
  öfter geprüft werden soll, gehört er samt Testskripten in einen `test/`-Ordner
  — dieselbe offene Frage wie bei den anderen Skripten.
- Die Lobby zeigt nur **verbundene** Handys (Presence). Wer einen Account hat,
  aber gerade offline ist, taucht dort nicht auf und wird weiterhin über die
  Spielerübersicht zugeteilt. Das ist gewollt, aber nicht mit David besprochen.

---

## 2026-09-28 — Mainscreen bekommt eine eigene Adresse (`dc03697`)

**Wunsch (David):** „optimal wärs eigentlich wenn das ne eigene Seite wär, also
….gameshows/mainscreen. dann weil so isse die gleiche Url".

**Rückfrage gestellt**, weil zwei Lesarten sehr verschieden teuer sind:
nur eine eigene Adresse (~30 Minuten) oder eine Seite, die auch **allein**
läuft, an einem zweiten Rechner (großer Umbau: der ganze Anzeigezustand müsste
über Firebase, in allen sieben Shows einzeln — das bestehende Verfahren scheidet
aus, es würde bei jedem Buzz Megabyte durch die Datenbank schieben).

Davids Antwort: **„das soll genau das sein, was jetzt grad im popout passiert,
nur mit eigener URL".** Also die erste Variante.

### Gemacht

`mainscreen/index.html` als echte Seite. `openBoardPopout()` öffnet sie mit
`window.open(url, 'Board', …)` statt `about:blank` + `document.write`.

**Die Seite hält absichtlich fast nichts.** Schriften, `styles.css` und die
Regeln, welche Screens das Publikum sehen darf, setzt das Hauptfenster ein
(`injectBoardStyles()`). Der Grund ist `BOARD_PUBLIC_SCREENS`: die Liste steht
in `js/feud.js`, und eine zweite Kopie in der HTML-Datei wäre irgendwann
auseinandergelaufen — dann stünde ein Editor auf der Leinwand oder das
Spielbrett bliebe schwarz. `styles.css` wird mit der URL aus dem Hauptdokument
verlinkt, samt `?v=`-Cache-Buster des laufenden Deploys.

**Neuladen im Zuschauerfenster** war der Fall, der beim Entwurf sofort auffiel:
das Fensterobjekt bleibt dasselbe, aber Dokument und eingesetzte Stile sind
weg. Das Hauptfenster spiegelte dann in ein Dokument ohne Regeln — und dort
stünden alle Screens auf einmal. Gelöst, indem die Seite sich selbst meldet:

```js
if (window.opener && typeof window.opener.boardPageReady === 'function')
  window.opener.boardPageReady();
```

`boardPageReady()` setzt die Stile neu, leitet den Wartebildschirm aus dem
aktiven Screen ab und startet die Spiegelung. Dieselbe Funktion läuft auch
beim normalen Öffnen — ein Weg, nicht zwei.

**Direkt aufgerufen**, ohne Hauptfenster, zeigt die Seite einen Hinweis, wo sie
herkommt. Sie ist die Anzeige des Hosts, kein zweiter Zugang; an einem anderen
Rechner bleibt sie leer. Der Hinweis verschwindet per CSS-Regel, sobald das
Hauptfenster die Stile einsetzt (`#ms-warten{display:none!important}`).

### Geprüft

Im echten zweiten Fenster, Ablauf am Stück:

| Schritt | Adresse | Wartebildschirm | Regeln + CSS | sichtbarer Screen |
|---|---|---|---|---|
| nach dem Öffnen | `/mainscreen/` | **an** | ja | — |
| Spielbrett zeigen | `/mainscreen/` | aus | ja | `game-screen` |
| **F5 im Mainscreen** | `/mainscreen/` | aus | **ja, neu gesetzt** | `game-screen` |
| danach Setup-Screen | `/mainscreen/` | **an** | ja | — |

Direkt aufgerufen: Titel steht, Hinweis sichtbar. Keine JavaScript-Fehler in
beiden Fenstern. `node check.js --types` ohne Befund, das Skript der neuen
Seite separat mit `node --check` geprüft.

### Offen / Fallstricke

- **Die Seite funktioniert nur mit dem Hauptfenster.** Das ist die bewusst
  gewählte Variante, aber es steht jetzt eine Adresse im Netz, die allein
  aufgerufen nichts tut. Der Hinweistext fängt das ab; wer mehr will, braucht
  die Firebase-Variante.
- **`mainscreen/index.html` bekommt keinen Cache-Buster vom Deploy.** Die
  Action hängt `?v=` nur an die Pfade **in** `index.html`. Die neue Seite trägt
  deshalb dieselben `no-cache`-Metas wie `index.html`. Ungeprüft, ob GitHub
  Pages die respektiert — falls der Mainscreen nach einem Deploy einmal veraltet
  aussieht, ist das die Stelle.
- Das Fenster heißt weiterhin `'Board'` (der `window.open`-Name). Das ist der
  Grund, warum ein zweites Öffnen dasselbe Fenster trifft — nicht die URL.

---

## 2026-09-28 — Wartebildschirm aus dem Menü heraus leer · Logo auf 60% (`b755854`)

**Symptom (David, mit Bild vom Hauptmenü):** „logo kleiner, das soll auch wenn
ich auf dem screen bin schon angezeigt werden."

### Der Fehler im zweiten Halbsatz

Wer den Mainscreen aus dem **frisch geladenen Hauptmenü** öffnete, sah dort
nichts. Gemessen: `body.className` leer, `#board-idle` auf `display:none`.

**Ursache:** `setBoardIdle()` lief ausschliesslich in `showScreen()`. Beim
Laden der Seite ist `menu-screen` aber schon aktiv — die Klasse steht im
Markup, `showScreen()` wurde nie gerufen. Also fehlte `board-idle`, und das
Popout zeigte weder einen Screen (alle sind für das Publikum gesperrt) noch
den Wartebildschirm.

Der Fehler trat nur auf diesem einen Weg auf. Vom Setup-Screen aus
funktionierte es, weil man dorthin nur über `showScreen()` kommt — und genau
so hatte ich es getestet. Wieder ein Test, der die kaputte Stelle nicht
berührt hat.

**Gemacht:** `boardIdleFromCurrentScreen()` **liest** den Zustand aus dem
aktiven Screen ab, statt ihn mitzuführen:

```js
const aktiv = document.querySelector('.screen.active');
setBoardIdle(!aktiv || !BOARD_PUBLIC_SCREENS.includes(aktiv.id));
```

Gerufen in `openBoardPopout()`, auf beiden Wegen — frisches Fenster und
wiederverwendetes. Abgelesener Zustand kann nicht veralten; mitgeführter
schon, und dann fehlt genau der eine Pfad, auf dem niemand ihn setzt.

### Die Größe

Von 86% auf **60%** der Fensterbreite (`BOARD_IDLE_WIDTH`, jetzt an einer
Stelle statt zweimal im Code). Das ist zwischen zwei Rückmeldungen
interpoliert: bei 40% — der alten festen 760px-Grenze — war es David zu klein,
bei 86% zu groß. Bei 1920px Breite sind das 1152px, mit Luft ringsum wie im
Menü.

Zum Vergleich: das Logo im Hauptmenü ist 400px bei 1686px Fensterbreite, also
24%. Auf einem Beamer wäre das zu wenig — dort steht niemand einen halben Meter
vor dem Bild.

### Geprüft

Alle drei Wege ins Popout, Zielfenster 1920×1080:

| geöffnet … | sichtbar | Breite | Anteil | Versatz |
|---|---|---|---|---|
| aus dem frisch geladenen Menü | **ja** | 1152px | 60% | 0/0 |
| vom Setup-Screen | ja | 1152px | 60% | 0/0 |
| vom Turnier | ja | 1152px | 60% | 0/0 |
| während eines Spiels | nein | — | — | — |

`node check.js --types` ohne Befund, keine JavaScript-Fehler.

### Fallstrick

Die erste Fassung des Wartebildschirms (`da49b63`) war über `showScreen()`
gesteuert, und der Test ging auch über `showScreen()`. Beides stimmte
miteinander überein und beides war blind für den Fall, dass der Screen schon
steht, ohne dass jemand ihn gesetzt hat. **Ein Test, der denselben Weg nimmt
wie der Code, prüft die Annahme mit, statt sie zu prüfen** — dritter Eintrag
in Folge mit dieser Lehre, sie gehört in den `BAUPLAN.md`.

---

## 2026-09-28 — Wartebildschirm: Logo füllt das Fenster (`02e288b`)

**Symptom (David):** „mach das Loogo größer und in die MItte".

**Ursache für „größer":** Die Breite stand auf `min(760px, 70vw)`. Das zweite
Glied kam nie zum Tragen — auf einem Beamer mit 1920px griff immer die feste
Grenze. 760px von 1920px sind 40% der Fläche, der Rest war Rand.

Jetzt `min(86vw, 158vh)`: begrenzt wird nur noch vom Fenster selbst. Die
zweite Schranke hält das Bild bei einem hohen, schmalen Fenster in der Höhe —
das Logo ist 900:500, also 1,8 mal so breit wie hoch, und 158vh Breite ergeben
88vh Höhe.

**Zu „in die Mitte": es war schon exakt mittig.** Gemessen, nicht geschätzt —
der Versatz vom Fenstermittelpunkt ist in beiden Richtungen 0, bei allen drei
geprüften Größen. Was David als „nicht mittig" gelesen hat, war vermutlich der
viele Rand um ein zu kleines Bild. Die Zentrierung ist unverändert
(`position:fixed; inset:0; display:flex; align-items:center;
justify-content:center`), nur das Padding ging von 24px auf 16px.

**Dazu die Zeichenschärfe.** `renderIryoHubLogo()` hat einen dritten Parameter
bekommen: wie viele echte Pixel je CSS-Pixel gezeichnet werden. Das kleine
Logo oben bleibt bei 2, der Wartebildschirm zeichnet mit 4. Ohne das hätte der
Canvas 1800px nativ für 1651px Anzeige gehabt — das reicht gerade so für
1080p, aber nicht für einen 4K-Beamer, und das Bild wird hier fast zwei Meter
breit an eine Wand geworfen.

### Gemessen

Im echten zweiten Fenster, das per `openMainscreen()` geöffnet wurde:

| Fenster | Bild | Anteil Breite | Anteil Höhe | Versatz | nativ | scharf |
|---|---|---|---|---|---|---|
| 1920×1080 | 1651×917 | 86% | 85% | 0/0 | 3600×2000 | ja |
| 1280×720 | 1101×612 | 86% | 85% | 0/0 | 3600×2000 | ja |
| 1080×1920 | 929×516 | 86% | 27% | 0/0 | 3600×2000 | ja |

Der geringe Höhenanteil im Hochformat ist richtig: ein 1,8:1-Logo kann ein
9:16-Fenster nicht füllen, ohne angeschnitten zu werden.

### Offen

- Weiterhin ungeprüft, ob „Luckiest Guy" beim Öffnen des Popouts schon geladen
  ist (Google Fonts ist in dieser Sandbox gesperrt). Das Bild wird jetzt mit
  Schärfe 4 gezeichnet — steht dort die falsche Schrift, fällt es umso mehr auf.
  Der Fix wäre ein `await document.fonts.ready` vor dem Zeichnen.

---

## 2026-09-28 — Wartebildschirm im Zuschauerfenster (`da49b63`)

**Symptom (David, mit Bild vom Beamer):** „genau das soll nicht passieren da
soll das Logo sein, bis das spiel GESTARTET wird". Zu sehen war das kleine
Show-Logo („KELLER FEUD") oben in der Ecke und darunter nichts.

### Zwei Ursachen, eine davon nicht offensichtlich

**1 · Ein geklonter Canvas ist leer.** Das grosse Iryo-Logo entsteht in
`renderIryoHubLogo()` auf einem `<canvas>`. Das Zuschauerfenster ist eine
Spiegelung des Hauptfensters, und `morphMirror` kopiert mit `cloneNode(true)`.
Ein geklonter Canvas bringt sein Bild **nicht** mit — die Pixel hängen am
Zeichenkontext, nicht am Element. Das kleine Show-Logo daneben ist ein SVG und
wanderte deshalb mit; genau das sah David.

`renderIryoHubLogo()` hängt jetzt ein `<img>` mit `toDataURL()` ein statt des
Canvas. Das überlebt den Klon — und nebenbei auch jede andere Stelle, an der
gespiegelt wird.

**2 · Es gab gar keinen Wartebildschirm.** Seit das Popout nur noch die
Screens aus `BOARD_PUBLIC_SCREENS` zeigt (`66616c9`), ist dort schwarz,
solange der Host einrichtet. Vorher stand da der Setup-Screen — was auch
niemand wollte, und genau deswegen wurde die Whitelist gebaut. Der Zustand
dazwischen („nichts anzuzeigen, aber der Beamer läuft") war schlicht nie
bedacht.

### Gebaut

`#board-idle`, ein leerer Block **ausserhalb aller Screens**, direkt neben
`#main-logo`. Ausserhalb, weil die Spiegelung ihn dann immer mitnimmt; im
Hauptfenster ist er per `styles.css` grundsätzlich unsichtbar.

Gesteuert über eine Klasse am `<body>`:

```js
function setBoardIdle(an){ document.body.classList.toggle('board-idle', !!an); }
```

Der Mirror kopiert Body-Attribute mit, also entscheidet das Popout allein per
CSS, ob es das Logo oder den Screen zeigt. **Kein zweiter Kanal, keine
Nachricht zwischen den Fenstern** — das war die Alternative und ist verworfen:
sie hätte einen zweiten Weg gebraucht, der mit dem Mirror synchron bleiben
muss.

Gesetzt wird die Klasse an zwei Stellen:

- `showScreen()` — anhand **derselben** `BOARD_PUBLIC_SCREENS`-Liste, aus der
  auch das Popout-CSS gebaut wird. Zwei Quellen würden auseinanderlaufen.
- `addBlackBackdrop()` löscht sie. Der schwarze Vorhang steht am Anfang
  **jedes** Intro-Laufs (alle sieben Shows rufen ihn) und ist damit das
  verlässlichste Signal für „die Show fängt an". Nötig, weil die Intro-Läufe
  die Screens direkt umschalten (`querySelectorAll('.screen').forEach(…)`),
  ohne `showScreen()` zu rufen — die Klasse wäre sonst hängengeblieben und das
  Logo läge über dem Intro.

Gezeichnet wird in `openBoardPopout()`, nicht beim Seitenstart: der Canvas-Text
braucht die Schrift „Luckiest Guy", und beim Laden ist die oft noch nicht da —
dann stünde dort die Ersatzschrift. Auch beim Wiederverwenden eines schon
offenen Fensters wird neu gezeichnet.

Solange das Logo steht, weicht das kleine Show-Logo (`body.board-idle
#main-logo{display:none}`). Zwei Logos übereinander sind eines zu viel.

### Geprüft — im echten zweiten Fenster

Playwright öffnet das Popup wie der neue Knopf und misst darin:

| Screen im Hauptfenster | Logo | kleines Show-Logo | sichtbarer Screen |
|---|---|---|---|
| Setup (Host richtet ein) | **an** | aus | — |
| Fragen-Editor | **an** | aus | — |
| Hauptmenü | **an** | aus | — |
| Spielerübersicht | **an** | aus | — |
| Turnier-Werkstatt | **an** | aus | — |
| Spielbrett | aus | an | `game-screen` |
| Ergebnis | aus | an | `result-screen` |
| Turnierstand | aus | an | `tournament-board-screen` |

Bild 760×422, `naturalWidth > 0` (also wirklich geladen, nicht nur eingehängt).
Beim `startGame()` fällt die Klasse zusammen mit dem Vorhang. Keine
JavaScript-Fehler. Screenshot an David gegangen.

### Offen

- Im Test steht im Logo die Ersatzschrift, weil Google Fonts in dieser Sandbox
  gesperrt ist. Bei David ist „Luckiest Guy" geladen — sein eigenes Bild vom
  Menü zeigt das. **Ungeprüft bleibt damit, ob der Canvas beim Öffnen des
  Popouts die Schrift schon hat.** Falls dort einmal die falsche Schrift steht:
  `openBoardPopout()` müsste auf `document.fonts.ready` warten.
- Der Wartebildschirm hat keinen Inhalt ausser dem Logo. Ein „gleich geht es
  los" oder der Name der nächsten Show wäre denkbar — nicht gebaut, weil
  David das Logo verlangt hat und nichts sonst.

---

## 2026-09-28 — Setup-Screens mittig · Team-Knöpfe bei jedem · Mainscreen-Knopf (`21ca4e7`)

**Anlass:** David hat ein Bild des PIH-Setup-Screens geschickt, zwei Stellen
rot eingekreist („das is nicht zentriert"), dazu: „dazu hast dus mit den Leuten
nicht besser gemacht. mach hinter dazu noch buttons für die teams". Mitten in
der Arbeit kam der Wunsch nach einem Knopf „Mainscreen öffnen" dazu.

### Was nicht zentriert war — und warum

**Der Wertungs-Block.** Er ist eine alleinstehende `.team-card`. Die Klasse
trägt `max-width:300px`, gedacht für die Karten in einer Flex-Zeile. Ohne
Flex-Eltern und ohne `margin:auto` zieht diese Deckelung den Kasten an den
linken Rand. Die Knöpfe darin hatten zusätzlich kein `justify-content:center`.

**Der Gäste-Block.** Überschrift, Eingabefelder und „+ Gast" lagen als drei
lose Elemente direkt im Screen — also linksbündig, während alles andere mittig
ist. Jetzt ein eigener Block `.setup-guests`, bei DDF und PIH gleich.

**Dazu, im Bild sichtbar, aber nicht eingekreist:** die drei Karten „Team 1 /
Team 2 / Superpreis" brachen als 2+1 um, und die dritte stand schmaler da als
die beiden darüber. Das ist dieselbe Sache, die der `BAUPLAN.md` unter 4.3
beschreibt — ein flex-wrap mit verschieden breiten Elementen. Die Reihen sind
jetzt ein Raster (`.setup-row`, `auto-fit` + `minmax(190px,1fr)`); gemessen
bei 430px: drei Karten zu je 192px.

### Team-Knöpfe bei jedem

Vorher erschienen sie erst, **nachdem** jemand über „dazu" ausgewählt war —
zwei Schritte, und bis zum ersten Klick sah die Liste aus, als könne man nur
an- und abwählen. Jetzt stehen sie in jeder Zeile.

Ein Klick auf ein Team nimmt den Spieler **zugleich in die Runde**. Das ist
eine Zutat von mir, nicht wörtlich verlangt: sonst entstünde der Zustand
„Team zugeteilt, spielt aber nicht mit", der in keiner Wertung auftaucht und
den niemand sieht.

Gebaut als `rosterNoteAssigned(key, teamIdx)`, gerufen aus
`assignPlayerTeam()` — also aus der Funktion, an der **alle** Team-Knöpfe
hängen. Damit bleibt es bei einer Fassung der Knöpfe
(`playerTeamButtonsHtml`). Die Alternative wäre gewesen, im Roster eine zweite
zu bauen; zwei Fassungen derselben Sache waren in `66616c9` schon einmal der
Fehler. Es greift nur, wenn der Teilnehmer-Screen offen ist: aus der
Spielerübersicht heraus soll eine Zuteilung niemanden in eine Runde schieben,
die der Host noch gar nicht zusammenstellt.

**Dazu:** nicht ausgewählte Zeilen werden nicht mehr abgeblendet
(`opacity:.45`). Solange niemand gewählt war — und das ist der Zustand, in dem
der Host den Screen öffnet — stand damit die ganze Liste blass da. Ein Haufen
halbdurchsichtiger Namen ist keine Einladung, einen davon anzutippen.
Stattdessen bekommen die Mitspielenden einen goldenen Rahmen (`.pr-row.mit`).

### Mainscreen-Knopf

`openMainscreen()` in `js/feud.js`: öffnet das Zuschauerfenster, ohne ein Spiel
zu starten. Steht auf allen sieben Setup-Screens, im Hauptmenü und im Turnier.

Zu sehen ist das Logo — **ohne dass dafür etwas gebaut werden musste**:
`#main-logo` steht außerhalb aller Screens und wird deshalb immer mitgespiegelt.
Auf einem Setup-Screen ist es sogar schon das Logo der Show, die gleich kommt
(`showScreen` setzt es je Screen um).

Die eigene Funktion statt `openBoardPopout()` direkt am Knopf hat einen Grund:
schluckt der Pop-up-Blocker das Fenster, passierte sonst wortlos nichts. Jetzt
sagt es das.

### Nebenbefund: `assignPlayerTeam` starb ohne Firebase

```js
function assignPlayerTeam(key, teamIdx){
  firebase.database().ref(…).set(teamIdx)…   // ← erste Zeile, ungeschützt
  …
  const acc = (allPlayers || []).find(a => a.key === key);
  if (acc) acc.team = …;   // "Sofort anzeigen, ohne auf die Datenbank zu warten"
```

Lädt das CDN nicht (kein Netz, Firewall, schlechtes WLAN), ist `firebase` nicht
definiert — dann warf die **erste** Zeile, und alles danach lief nie. Auch
nicht die lokale Anzeige, die laut dem Kommentar darunter genau für diesen Fall
gedacht war. Der Knopf tat wortlos nichts.

Aufgefallen im Browser-Test, wo das CDN gesperrt ist: der Team-Klick blieb ohne
Wirkung, „firebase is not defined" in der Konsole. Jetzt erst anzeigen, dann
schreiben, und das Schreiben in `try/catch`.

> Das ist dieselbe Klasse von Fehler wie der Timer in `1db72e0`: die Absicht
> stand als Kommentar da, der Code tat etwas anderes.

### Geprüft

Im Browser bei 430px Breite, mit acht Accounts (dieselben Namen wie in Davids
Bild), keiner vorausgewählt:

| | Ergebnis |
|---|---|
| Abweichung von der Screenmitte | Wertungsknöpfe 0px · Gäste-Block 0px · „+ Gast" 0px · Lobby 0px |
| Kartenbreiten je Reihe | `[192,192]` und `[192,192,192]` |
| Team-Knöpfe sichtbar | 16 (8 Leute × 2 Teams), auch ohne Auswahl |
| Klick auf „Team 1" bei Joni | Teilnehmer 0 → 1, `joniTeam:0`, Aufstellung „Team 1 Joni" |
| Überlappungen | keine |
| JavaScript-Fehler | 0 (vorher: „firebase is not defined") |
| Mainscreen-Knopf im Screen | vorhanden |

`node check.js --types` ohne Befund. Screenshot an David gegangen.

### Fallstrick im eigenen Testskript

Die erste Messung meldete den Gäste-Block 215px links der Mitte — also am
linken Rand. Ursache war nicht der Code, sondern der Test:
`document.querySelector('.setup-guests')` trifft den **ersten** im Dokument,
und das ist der von „Der Dümmste fliegt", der weiter oben im Markup steht und
gerade unsichtbar ist. Eine Bounding-Box von 0×0 sieht in der Rechnung aus wie
„ganz links". Die Messung läuft jetzt über
`document.getElementById('pih-setup-screen').querySelector(…)`.

**Für den Bauplan:** In einer App, in der alle Screens gleichzeitig im DOM
stehen und nur per Klasse sichtbar werden, ist ein globales `querySelector` in
einem Test fast immer falsch. Gehört zu 3.9 ergänzt — noch nicht getan, wie der
Punkt aus dem vorigen Eintrag („ein Test muss beim kaputten Code rot sein").

### Offen

- Steht auf dem Branch, **nicht auf master**. Zusammen mit `82e9822` (PIH
  startete aus dem Turnier ohne Teilnehmer-Auswahl durch) warten zwei Commits
  auf den Deploy.
- Die drei Karten in einer Reihe brechen bei schmalem Fenster als 2+1 um. Sie
  sind jetzt gleich breit, aber die einzelne in Zeile 2 steht links, nicht
  mittig. Eine in CSS saubere Zentrierung der letzten Grid-Zeile gibt es nicht
  ohne Media-Query je Kartenzahl; bewusst so gelassen, weil die linke Kante mit
  der Karte darüber fluchtet.
- `.setup-row` gilt bisher nur für die drei Reihen, die den Inline-Style
  wortgleich trugen (DDF eine, PIH zwei). Andere Setup-Screens haben eigene
  Bauweisen; die sind nicht angefasst.

---

## 2026-09-28 — „Der Preis ist heiß" startete aus dem Turnier ohne Auswahl (`82e9822`)

**Gefunden beim Erklären, nicht beim Testen.** David fragte, wie der
Turniermodus jetzt funktioniert. Beim Nachlesen im eigenen Code fiel auf, dass
die Antwort, die ich ihm zwei Nachrichten vorher gegeben hatte, falsch war.

**Der Fehler:** Der Halt vor den Shows mit Teilnehmer-Auswahl hing an

```js
if (cfg.lobby === 'roster'){ … return; }
```

„Der Dümmste fliegt" trug `lobby:'roster'`, also griff es dort. „Der Preis ist
heiß" hat aber **eigene Teamnamen-Felder** (`pih-t1-name`, `pih-t2-name`) und
musste deshalb `lobby:'pih'` tragen — womit der Halt dort nie griff. Der
Direktstart rief `startPih()` unmittelbar auf.

**Warum es im Test durchrutschte — das ist der eigentliche Lehrsatz:** Im
Browser-Durchlauf war kein Handy verbunden. `rosterSeed()` wählt die
verbundenen Accounts automatisch vor; ohne Handys blieb die Liste leer, und
`startPih()` brach mit „Mindestens ein Teilnehmer" ab. Der Test meldete
`{aktiv:false, screen:'pih-setup-screen'}` — **genau das, was der gewollte Halt
auch gemeldet hätte.** Ich habe das als Bestätigung gelesen und in der Antwort
an David behauptet, die Show bleibe stehen. Mit verbundenen Handys wäre sie
ohne Rückfrage losgelaufen, mit einer Teilnehmerliste, die der Host nie gesehen
hat.

> Ein grüner Test ist nur dann ein Beleg, wenn er beim kaputten Code rot
> gewesen wäre. Dieser hier wäre in beiden Fällen grün gewesen.

**Gemacht:** Zwei Felder statt eines Werts mit zwei Bedeutungen.

| | vorher | jetzt |
|---|---|---|
| Der Dümmste fliegt | `lobby:'roster'` | `lobby:null, roster:true` |
| Der Preis ist heiß | `lobby:'pih'` | `lobby:'pih', roster:true` |

`lobby` sagt jetzt nur noch, **wo die Teamnamen stehen**; `roster` sagt, **ob
erst ausgewählt werden muss**. Das sind zwei Fragen, und ein Wert, der beide
beantwortet, fällt irgendwann auf die Nase. Betroffen: `tournamentStartAt()`
und das GM-Panel des Turnierstands (`updateGamemasterTournamentBoard` in
`js/wwds.js`, zweimal).

**Geprüft — diesmal mit dem Fall, der vorher fehlte.** Drei Accounts als
online gesetzt, damit `rosterSeed()` sie vorwählt:

| Spiel | läuft? | Screen | Teilnehmer | Teamnamen |
|---|---|---|---|---|
| Der Preis ist heiß | nein | `pih-setup-screen` | 3 vorgewählt | Rote/Blaue übernommen |
| Der Dümmste fliegt | nein | `ddf-setup-screen` | 3 vorgewählt | — |
| Jeopardy | **ja** | — | — | Rote/Blaue übernommen |

Keine Meldung, keine JavaScript-Fehler. Der GM-Knopf heißt bei beiden
Roster-Shows „▶ Einrichten", bei den anderen „▶ Nächstes Spiel starten".
`node check.js --types` ohne Befund.

**Offen:** Der Fehler stand rund eine Stunde live auf `master` (`31e6228` bis
zu diesem Commit). Wer in der Zeit „Der Preis ist heiß" aus dem Turnier heraus
gestartet hat, ist mit den zufällig verbundenen Handys ins Spiel gesprungen.

**Fallstrick für den Bauplan:** Der Abschnitt „Abnahme" in `BAUPLAN.md` sagt,
was zu prüfen ist, aber nicht, dass ein Test auch beim kaputten Code hätte
fehlschlagen müssen. Das gehört dort ergänzt — noch nicht getan.

---

## 2026-09-28 — Lobbys zentriert und vergrößert · BAUPLAN.md (`230f821`)

### 11 · Lobbys

**Symptom (David):** „Zentrier die Elemente den Lobbys. Und mach dass alles
Groß genug ist, ohne Überlappungen".

**Ursache:** Der Kasten war auf 520px gebaut und durchgehend in 0,68–0,85rem
gesetzt. In eine Zeile der Teilnehmer-Auswahl gehörten Punkt, Avatar, Name
(mit `flex:1`), der Mitspielen-Knopf und bis zu vier Team-Knöpfe. Das passte
nicht: der Name drückte alles nach rechts, die Team-Knöpfe rutschten darunter
und schoben sich dabei über den Knopf daneben.

**Gemacht:**

| | vorher | jetzt |
|---|---|---|
| Kastenbreite | 520px | 640px |
| Innenabstand | 14/16px | 18/20px |
| Zeile | .85rem, 5/4px | 1rem, 9/12px, eigener Block |
| Team-Knopf | .7rem, 5/12px | .82rem, 8/15px |
| Mitspielen-Knopf | .7rem, 4/10px inline | .78rem, 7/16px in CSS |
| Avatar | 28px | 34px |
| Team-Tag | .65rem | .75rem |
| Kopfzeile | .68rem | .8rem |
| Listenhöhe | 220px | min(56vh, 470px) |

Dazu die drei Eingriffe, die das Layout tragen:

1. **Der Name trägt kein `flex:1` mehr**, sondern die Klasse `.pr-name`. Erst
   dadurch lässt sich die Zeile mittig stellen — mit `flex:1` ist sie immer
   linksbündig, egal was `justify-content` sagt. Betrifft `js/buzzer.js`
   (`renderSetupLobby`) und `js/roster.js` (`renderRosterLobby`).
2. **`.roster-teams` bekommt `flex-basis:100%`** und steht damit immer in einer
   eigenen, zentrierten Zeile unter dem Namen. Vorher hing der Umbruch am
   verfügbaren Platz. Ein erzwungener Umbruch sieht immer gleich aus, ein
   zufälliger nie.
3. **Jede Zeile ist ein eigener Block** (eigener Hintergrund, 10px Radius). Wenn
   die Team-Knöpfe darunter umbrechen, ist zu sehen, was zusammengehört.

Der Inline-Style `opacity:.45` für nicht ausgewählte Spieler ist als Klasse
`.pr-row.aus` ins CSS gewandert.

**Warum mittig:** Die Zeilen sind verschieden lang — mal nur ein Name, mal ein
Name mit Team-Tag, mal ein Name mit vier Knöpfen. Linksbündig steht dann jede
Zeile woanders und das Auge findet keine Kante. Das ist dasselbe Argument wie
bei `f14dd4c` (Knopf-Raster) und `fde849b` (Kategorie-Chips), nur eine Ebene
tiefer.

**Geprüft — im Browser, mit automatischer Überlappungsprüfung.** Das Skript
(`lobby.js` im Scratchpad) lädt die Seite über einen lokalen Server, füllt
sechs Spieler mit langen Namen (Björn-Maximilian, Elisabeth-Charlotte) und
gemischter Team-Zuteilung ein und vergleicht dann für **jeden** Container die
Bounding-Boxes aller direkten Geschwister auf Schnittmengen.

Bei 1280px und bei 420px Fensterbreite, in Team-Lobby, Teilnehmer-Auswahl und
Spielerübersicht:

- **Überlappungen: keine** (alle sechs Kombinationen).
- **Schrift unter 12px: keine.**
- Null JavaScript-Fehler.

Screenshots der drei Kästen sind an David gegangen.

### 12 · BAUPLAN.md

**Auftrag (David):** „schreib in die MD eine gewisses Skelett zum langhangeln
für zukünftige Gameshows, dass sie einheitlich gebaut werden. Ich will das
alles besser machen. Regeln zum Design und Code sollten helfen. Zieh die Regeln
aus bisherigen Gameshow arbeiten und Anweisungen/Kritik meinerseits".

**Gemacht:** `BAUPLAN.md` im Wurzelverzeichnis, fünf Teile:

1. **Sieben Fragen vor der ersten Zeile** — Teams oder Teilnehmer, buzzern oder
   tippen die Handys, was sieht nur der Host, was ist ein Zug, wie endet sie,
   wie wird gewertet. Sie entscheiden über die halbe Architektur.
2. **Das Skelett** — die feste Reihenfolge in einer Spieldatei, der bei allen
   Shows wortgleiche Start- und Intro-Lauf, der Schnitt des GM-Panels
   (`xxxGmControlsHtml(pfx)` + `updateGamemasterXxx()`), und eine Tabelle mit
   den **elf Stellen**, an denen eine neue Show angemeldet werden muss.
3. **Code-Regeln** (10 Stück) — Helfer statt rohes DOM, Escapen als Pflicht,
   Inline-Handler sind für Werkzeuge unsichtbar, Wache vor Wirkung,
   Anzeige folgt dem Zustand an allen drei Orten, Rundennummern statt Zähler,
   Timer müssen nach Ablauf einmal mehr zeichnen, relativ statt gegen null
   rechnen, eine Quelle für eine Sache, Typen am Code.
4. **Design-Regeln** (7 Stück) — der Bildschirm gehört dem Publikum, lesbar aus
   drei Metern, mittig bei ungleichen Zeilen, nur ein lautester Knopf, null ist
   kein Erfolg, angeschnitten sieht aus wie kaputt, was läuft darf nicht neu
   anfangen.
5. **Abnahme** — die Prüfläufe und eine Checkliste mit elf Punkten.

**Warum jede Regel einen Anlass nennt:** Eine Regel ohne Grund wird beim ersten
Termindruck gebrochen. Eine Regel mit dem Fehler daneben, der sie ausgelöst
hat, überlebt. Deshalb steht bei jeder der Commit-Hash — `1673e6d` (Host-Knöpfe
standen auf der Leinwand), `f14dd4c` (vier Knöpfe brachen als 2+1+1),
`fde849b` (drei verschieden breite Kästchen), `ed25b18` (die Lösung muss im
GM-Fenster immer stehen), `1db72e0` (Undo vor der Wache, Timer-Sperre),
`66616c9` (drei Fassungen derselben Teamnamen), `a3fd47c` (eigener FileReader).

**Verworfen:** die Regeln in `CLAUDE.md` unterzubringen. Die Datei wird vor
**jeder** Änderung gelesen, auch vor einer Zeile im Editor — sie muss kurz
bleiben. Der Bauplan ist dreimal so lang und nur relevant, wenn es um eine Show
geht. `CLAUDE.md` verweist jetzt darauf und sagt, wann er zu lesen ist.

**Geprüft:** Alle 23 Funktions- und Konstantennamen, die der Bauplan nennt,
gegen `js/` geprüft — alle vorhanden. `node check.js --types` ohne Befund.

### Offen

- Der Bauplan beschreibt den **Ist-Zustand**. Zwei Stellen darin sind
  Beobachtung, keine geprüfte Vorgabe: die „elf Anmeldungen" sind aus dem
  Bestand abgeleitet, nicht durch das Anlegen einer achten Show erprobt. Wer
  die nächste Show baut, soll die Tabelle dabei gegenlesen und korrigieren.
- Die Design-Regeln nennen Mindestgrößen (12px Schrift, 32px Klickfläche).
  Geprüft ist davon die Schriftgröße, automatisch, in den Lobbys. Für
  Klickflächen gibt es keine Prüfung — das wäre ein lohnender Zusatz im
  Testskript.
- Die Testskripte (`lobby.js`, `smoke.js`, `flow.js`, `imp.js`) liegen im
  Scratchpad der Sitzung und sind **nicht** im Repo. Sie setzen einen lokalen
  Server, einen Browserpfad und eine npm-Installation voraus. Wenn solche
  Läufe öfter gebraucht werden, gehören sie als `test/`-Ordner ins Repo — das
  ist bewusst offen gelassen und nicht entschieden.

---

## 2026-09-28 — Turniermodus, TP-Rad, Mehrfachwertung, Zuschauerfenster (`66616c9`, `a3fd47c`)

**Sechs Meldungen von David (Punkte 5–10).** Erstmals im Browser nachgestellt,
nicht nur aus dem Code hergeleitet — siehe „Geprüft" unten.

### 5 · Das Trivial-Pursuit-Rad zeigte die falsche Kategorie

**Symptom (David):** „Das Trivial Pursuit Rad ist quasi nutzlos weil die
ausgewählten Kategorien nicht die selben waren wie die, die gedreht wurde."

**Ursache:** `tpSpin()` rechnete den Zielwinkel so aus, als stünde das Rad auf 0,
und addierte ihn dann auf den Stand, auf dem es tatsächlich stand:

```js
const target = 360*4 + (360 - (cat*seg + seg/2));
tpState.angle += target;
```

Beim **ersten** Dreh stimmte das — das Rad stand ja auf 0. Ab dem zweiten blieb
der alte Restwinkel als Versatz drin und summierte sich weiter auf.

**Gemessen** (6 Kategorien, Segmentbreite 60°, acht Drehungen nacheinander):

| Dreh | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Abweichung alt | 0° | 30° | 120° | 90° | 120° | 30° | 0° | 30° |
| Abweichung neu | 0° | 0° | 0° | 0° | 0° | 0° | 0° | 0° |

Ab 30° zeigt der Zeiger auf das Nachbarsegment. Davids „quasi nutzlos" ist
exakt das, was die Zahlen sagen.

**Gemacht:** Es wird gerechnet, wie weit von der AKTUELLEN Stellung aus noch zu
drehen ist. Die Differenz wird immer vorwärts genommen (bei ≤ 0 kommt eine
Umdrehung drauf), damit das Rad nie rückwärts läuft und nie stillsteht.

### 6 · „Gebote abgegeben" stand im GM-Panel still

**Symptom (David):** „Die ‚Gebote Abgegeben' Zahl aufm Gamemaster Panel und
Gamepad hat nicht funktioniert … Die aufm Mainscreen war aber OK."

**Ursache:** Der Firebase-Handler von `pihBids` rief nur `pihUpdateBidProgress()`
— das ist die Anzeige auf dem Hauptbildschirm. `updateGamemaster()` fehlte, und
das GM-Panel baut seine Zahl aus einem eigenen HTML-Durchlauf.

**Gemacht:** `updateGamemaster()` ergänzt, im Handy-Handler und in `pihHostBid()`
(dem Weg, auf dem der Host Gast-Gebote am Hauptfenster einträgt).

### 7 · Schätzfragen: mehrere Teams werten

**Symptom (David):** „bei Schätzfragen will ich beiden Teams Punkte geben
können, falls beide gleich weit weg schätzen".

**Gemacht:** `jeopardyScore()` schließt die Frage nur noch beim **Buzzern**. Bei
Schätzfrage und Einzelantwort — dort tippen alle — bleibt sie offen:

- `jeopardyState.scoredTeams` merkt, wer schon Punkte bekam; derselbe Knopf ein
  zweites Mal zahlt nicht doppelt, gewertete Teams zeigen ein Häkchen.
- Der Rumpf „Feld abhaken, Frage zu, Board frei" ist als `jeopardyFinishClue()`
  herausgelöst — ihn nutzen jetzt auch `jeopardySkip()` (wo er wortgleich
  dupliziert war) und der neue Knopf **„✔ Frage abschließen"**.
- `scoredTeams` geht in Snapshot und Undo mit.

**Gemessen:** zwei Teams gewertet → `scores [100,100,0]`, `scoredTeams [0,1]`,
Frage noch offen; dritter Klick auf Team 0 ändert nichts; nach dem Abschließen
ist `used[0][0]` gesetzt.

### 8 · Editoren standen auf der Leinwand

**Symptom (David):** „Wenn man Fragen und Intro bearbeitet, sieht man das auch
auf den Mainscreen."

**Ursache:** Das Zuschauerfenster hatte eine **Liste der auszublendenden**
Screens. Sie hinkte jeder neuen Show hinterher — zuletzt fehlte
`#intro-edit-screen`.

**Gemacht:** umgedreht. `BOARD_PUBLIC_SCREENS` zählt die neun Zuschauer-Screens
auf, `boardHiddenScreensCss()` baut daraus `.screen:not(#…):not(#…){display:none}`.
Eine Liste, die man beim Anlegen eines Screens pflegen muss, wird vergessen;
eine, die man beim Anlegen eines **Zuschauer**-Screens pflegen muss, fällt
sofort auf — dann bleibt die Leinwand schwarz.

**Gemessen:** 20 Screens werden jetzt ausgeblendet, darunter `intro-edit-screen`,
alle sieben Editoren, alle sieben Setup-Screens, Spielerliste, Notizen und der
Turnier-Screen.

### 9 · Turniermodus

**Symptom (David):** „das Turnier soll eine richtige Funktion haben, so Grad
geht da nix." Vier Wünsche: Spieldaten vorab importieren, Spiele nacheinander
im selben Popout, beim Einrichten nichts auf der Leinwand, und nach dem Spiel
ein durchgehender Ablauf ohne Umweg über Menü und Lobby.

**Gemacht:**

`TOURNAMENT_GAMES` ist die neue Registry: je Show der Setup-Screen, die
Startfunktion, der Schlüssel für die Teamnamen-Felder, die Import-Funktion und
eine Funktion, die sagt, was gerade geladen ist. `TOURNAMENT_STARTABLE` wird
daraus abgeleitet und bleibt nur als Name bestehen.

**Spieldaten-Depot** (Turnier-Screen, „📦 Spieldaten & Intro laden"): je
geplantem Spieltyp plus Intro eine Zeile mit „Laden" und dem aktuellen Stand.
Die Dateien gehen über **dieselbe** Import-Funktion wie im Editor dorthin, wo
sie hingehören; im Turnier steht nur Dateiname und Uhrzeit.

> **Warum nicht die Daten selbst ins Turnier:** das Turnier-Objekt liegt in
> Firebase und wird bei jeder Änderung komplett geschrieben. Ein Jeopardy-Board
> mit eingebetteten Bildern ist mehrere MB — das würde jede Runde ausbremsen.

`readJsonFile()` hat dafür einen einmaligen Erfolgs-Haken bekommen
(`onJsonImportOk`), der nur bei geglücktem Import feuert. Die sieben
Import-Funktionen selbst blieben unverändert — jede einzeln umzubauen wären
sieben Gelegenheiten, eine zu übersehen.

**„📦 Nächste Spieldaten überprüfen"** listet für alle offenen Spiele Datei,
Uhrzeit und den echten Stand aus dem Speicher („3 Kategorien · 4 Fragen").
Bewusst ein `alert` und kein weiterer Screen: der Host drückt das kurz vor dem
Start und macht weiter.

**Direktstart:** `tournamentStartAt(i)` / `tournamentStartNext()` betreten den
Setup-Screen (wegen der Nebenwirkungen von `showScreen()`: Lobby verbinden,
Einstellungen laden, Teilnehmerfelder bauen), übernehmen die Turnier-Teams in
dessen Felder inklusive Team-3-Haken und rufen dann die Startfunktion. Sichtbar
wird der Setup-Screen nicht — er steht nicht in `BOARD_PUBLIC_SCREENS`.

> „Der Dümmste fliegt" und „Der Preis ist heiß" (`lobby:'roster'`) bleiben auf
> ihrem Setup-Screen stehen: dort muss erst ausgesucht werden, **wer**
> mitspielt. Das kann kein Knopf erraten. Der Knopf heißt dort „Einrichten".

**Neuer Zuschauer-Screen `tournament-board-screen`:** Tabelle und Spielplan,
kein einziger Knopf, das nächste Spiel hervorgehoben. Er und der Host-Screen
rechnen über dieselbe Funktion (`tournamentStandingsHtml`) — zwei Kopien wären
zwei Stände, die auseinanderlaufen.

**Der Ablauf** ist jetzt der, den David beschrieben hat:

1. Spiel endet → Mainscreen bleibt beim Ergebnis. `tournamentRecordPending()`
   springt **nicht** mehr auf den Turnier-Screen (dort steht die Werkstatt des
   Hosts, und das Sieger-Bild war weg, bevor es jemand gesehen hatte).
2. „📊 Turnierstand anzeigen" → die Leinwand wechselt.
3. Im GM-Panel: nächstes Spiel mit Name, Gewichtung und Spieldaten-Zeile,
   dazu „▶ Nächstes Spiel starten", „📦 Nächste Spieldaten überprüfen",
   „🛠 Turnier bearbeiten", „🏠 Zum Menü".

Der GM-Zweig für diesen Screen steht **vor** den Spiel-Flags im Dispatch: ob
das Flag der eben beendeten Show schon zurückgesetzt ist, hängt daran, wie sie
geendet hat.

Trivial Pursuit, „Der Dümmste fliegt" und „Der Preis ist heiß" enden nicht auf
dem gemeinsamen Ergebnis-Screen. Bei ihnen führte nach dem Spiel nur „Zum Menü"
weiter; sie haben den Turnier-Knopf jetzt in ihrem eigenen Endzustand
(`tournamentEndButtonHtml`).

**Popout über mehrere Shows:** `openBoardPopout()` schrieb das Dokument bei
jedem Spielstart neu — zwischen zwei Spielen wurde das Zuschauerfenster weiß
und holte Schriften und `styles.css` erneut. Steht das Fenster schon, wird es
jetzt nur neu angeheftet. Die Prüfung braucht keine Markierung im Dokument:
`boardWin` steht nur, wenn dieses Fenster es selbst geöffnet hat. (Eine
Markierung im `<body>` wäre ohnehin wirkungslos — der Mirror kopiert die
Attribute des Haupt-`<body>` mit und würde sie wegräumen. Das war der erste
Versuch und ist verworfen.)

### 10 · Team-Zuteilung

**Symptom (David):** „Da zuteilen in Team bei dpih hat nur schlecht
funktioniert, mach das wie in den ersten Paar spielen und dann einheitlich bei
allen gleich. Außerdem gibt's im Team/Spieler Menü Überlappungen von Buttons
und Feldern."

**Ursache:** drei Fassungen derselben Sache.

| Ort | vorher |
|---|---|
| Setup-Lobbys | `lobbyTeamNames()` + `playerTeamButtonsHtml()`, beliebig viele Teams |
| Teilnehmer-Auswahl (DDF/PIH) | eigene Fassung, **fest zwei Teams** — `rosterTeamOf` gab bei Index > 1 `null` |
| Spielerübersicht | eigene Fassung, **immer drei Knöpfe**, egal wie viele Teams spielen |

Wer über die Spielerübersicht in „Team 3" gelegt wurde, galt bei „Der Preis ist
heiß" als „ohne Team" und tauchte in keiner Wertung auf.

**Gemacht:** eine Quelle, eine Funktion.
- `contextTeamNames(game)` in `buzzer.js` beantwortet „wie heißen die Teams
  gerade" für alle Kontexte.
- `playerTeamButtonsHtml()` baut die Knöpfe überall — Setup-Lobbys,
  Teilnehmer-Auswahl und Spielerübersicht. Es nimmt jetzt `p.id` **oder**
  `p.key` (derselbe Wert, nur aus verschiedenen Firebase-Knoten) und hat den
  „✕ Team wegnehmen"-Knopf bekommen, den vorher nur die Teilnehmer-Auswahl hatte.
- `currentTeamLabel(i)` ist ein Einzeiler über `currentTeamNames()`.

**Überlappungen:** `.player-row` hatte Name und Knopfleiste als zwei
Flex-Geschwister, die sich um dieselbe Breite stritten — beide durften wachsen,
keiner richtig schrumpfen (der Name wegen seiner Emoji-Kette aus Statistik und
Team-Tag, die Knöpfe wegen `white-space:nowrap`). Jetzt hat jeder Block eine
Mindestbreite (200px / 260px) und bricht darunter in eine eigene Zeile.

Dabei aufgefallen: `.pr-team-btn` war nur unterhalb von `.setup-lobby`
gestaltet. Außerhalb — also in der Spielerübersicht, wo die Knöpfe jetzt auch
stehen — wären sie als nackte Browser-Knöpfe herausgekommen. Die Regel gilt
jetzt ohne Vorfahren-Bedingung. Und `.roster-teams` durfte nicht umbrechen; bei
drei Teams plus ✕ schob sich die Leiste über den Nachbarknopf.

### Nebenbefund: zwei Importe liefen an `readJsonFile` vorbei

Im Browser-Test fiel auf, dass der Trivial-Pursuit-Import die Datei zwar lud,
der Dateiname im Depot aber nicht ankam. `importTp` und `importIntro` hatten
einen **eigenen FileReader** — dieselbe Mechanik noch einmal, aber ohne
BOM-Behandlung, mit einer Fehlermeldung, die bei kaputtem JSON „Datei konnte
nicht gelesen werden" sagte statt zu verraten was daran kaputt ist, und ohne
die Erfolgsmeldung. Beide laufen jetzt über `readJsonFile`; ihre
spielspezifische Prüfung wirft statt selbst zu melden.

### Geprüft

**Zum ersten Mal im echten Browser.** Chromium ist in dieser Umgebung
vorinstalliert; die Seite lief über einen lokalen Server, gesteuert per
Playwright. Die Skripte liegen im Scratchpad der Sitzung (`smoke.js`,
`flow.js`, `flow2.js`, `imp.js`) — sie sind **nicht** ins Repo gewandert, weil
sie einen Server, einen Browserpfad und eine npm-Installation voraussetzen.

Nachgestellt und bestanden:
- Turnier anlegen, drei Spiele in den Plan, Spieldaten-Panel, „Spieldaten
  prüfen", Turnierstand anzeigen.
- Direktstart Jeopardy: `jt1/2/3` = Rote/Blaue/Grüne, Team-3-Haken gesetzt,
  `jeopardyState.teamNames` stimmt, `activeTournamentGameIndex` = 0.
- Einzelantwort: öffnet, `jeopardyEstimate.single` true; zwei Teams gewertet,
  Frage bleibt offen, dritter Klick zahlt nicht doppelt; Abschließen hakt ab.
- Kompletter Turnierlauf TP → Ergebnis automatisch eingetragen (`[6,1]` →
  `+4/+2`) → Turnierstand → Jeopardy gestartet.
- Direktstart bei „Der Preis ist heiß": startet **nicht** durch, bleibt auf dem
  Setup-Screen, Teamnamen sind trotzdem übernommen.
- Echter Datei-Import durch den echten Datei-Input: Datei kommt an, Name wird
  gemerkt, Stand stimmt. Kaputte Datei: konkrete Fehlermeldung, der vorherige
  Eintrag bleibt stehen.
- Popout: zweiter Aufruf liefert dasselbe Fenster, Inhalt bleibt erhalten.
- Turnier-Knopf im Endzustand von TP, DDF und PIH vorhanden.
- Rad-Winkel: acht Drehungen, 0° Abweichung (alt: bis 120°).
- **Null JavaScript-Fehler** in allen Durchläufen. Die Meldungen in der Konsole
  sind ausnahmslos Netzwerk (Firebase, Google Fonts, CDN) — in dieser Sandbox
  ist der Ausgang gesperrt.

Dazu wie immer `node check.js` und `node check.js --types`: 13 Dateien, 410
Handler-Aufrufe gegen 783 globale Namen, 264 Element-IDs, keine Meldung.

### Ungeprüft / offen

- **Firebase lief in keinem Test.** Alles, was daran hängt — Lobby, Presence,
  Team-Zuteilung über die Handys, der Turnier-Sync — ist weiterhin nur aus dem
  Code hergeleitet. Der erste Abend mit echten Handys ist der eigentliche Test.
- **Das Zuschauerfenster wurde nicht gesehen.** Geprüft ist die erzeugte
  CSS-Regel und die Liste, nicht das Bild auf dem Beamer.
- **Der Spieldaten-Speicher ist nicht überall dauerhaft.** `tpData`, `wwdsData`,
  `ddfData`, `pihData`, `introData` und die Feud-Fragen liegen im
  `localStorage`; **`jeopardyData` nicht** — ein Neustart des Browsers wirft das
  geladene Board weg. Deshalb steht unter dem Depot der Hinweis, nach einem
  Neustart „Spieldaten prüfen" zu drücken. Wenn das stört, wäre die Stelle
  `jeopardyData` in `js/jeopardy.js` samt einem Paar `storeSetJson/storeGetJson`
  — mit der Einschränkung, dass Boards mit eingebetteten Bildern die
  5-MB-Grenze des localStorage reißen können.
- Ein Spieltyp kann mehrfach im Plan stehen (zwei Jeopardy-Runden an einem
  Abend); geladen wird er trotzdem nur einmal. Für zwei verschiedene Boards am
  selben Abend müsste zwischendurch nachgeladen werden.
- `tournamentEnterResult()` fragt die Punkte weiterhin per `prompt()` ab, eins
  nach dem anderen. Für die teamlosen Shows ist das der Weg — es ist nicht
  schön, wurde aber nicht angefasst.

---

## 2026-09-28 — Einzelantwort, TP-Logik, Buzzer-Sperre, Lobby-GIF (`1db72e0`)

**Vier Meldungen von David in einer Nachricht.** Der Reihe nach.

### 1 · Jeopardy: Schätzfrage mit Wörtern → eigene Sorte „Einzelantwort"

**Symptom (David):** „Jeopardy Schätzfragen auch mit Wörtern haben mal wieder
nicht funktioniert → bauen wir um in Einzelantwort. Auf dem Handy geht ein
Textfeld auf."

**Rückfrage gestellt**, weil „Einzelantwort" drei Lesarten hatte (eigener
Fragetyp für alle / nur einer tippt / Buzzer entscheidet dann Textfeld).
Davids Antwort: **eigener Fragetyp, alle tippen.**

**Gemacht:**
- Neues Feld `clue.single` (📝 Einzelantwort) gleichrangig neben
  `clue.estimate` (📊 Schätzfrage). Der alte Unterhaken `estimateText`
  („🔤 Buchstaben") ist raus.
- Die beiden Haken schließen sich gegenseitig aus — `jeopardyEditTyped()` in
  `js/jeopardy-ui.js` nimmt dem einen das Kreuz weg, wenn der andere gesetzt
  wird, und löscht `estimateText` gleich mit.
- `jeopardyTyped(clue)` / `jeopardySingle(clue)` in `js/jeopardy.js` — überall
  dort eingesetzt, wo vorher `clue.estimate` direkt abgefragt wurde
  (`jeopardyRevealQuestion`, GM-Panel in `js/feud.js`, GM-Leiste).
- Sortierung: bei `single` strikt nach Eingang, die Zahlen-Logik läuft gar
  nicht erst an. Beschriftung im GM-Panel, auf dem Handy (Überschrift,
  Platzhalter, „Antwort abgegeben ✔") und im Board-Gitter (📝-Abzeichen) folgt.
- Import alter Boards: `jeopardyMigrateBoard()` macht aus
  `estimate + estimateText` ein `single`. Zur Laufzeit zählt
  `estimateText` nur noch in `jeopardyEstimateOpen()` als Rückfall.
- `openJeopardyClue()` setzt `jeopardyEstimate.answers`/`.single` zurück —
  sonst zeigte das GM-Panel vor dem Aufdecken noch die Liste der vorigen Frage.

**Warum so:** Die alte Bauart war der Fehler selbst. Eine Wortantwort lief
weiter durch `parseEstimate()`, das aus allem ohne Ziffer `null` macht; die
Sortierung hängte sie als „Rest" hinter die Zahlen. Die Liste war also nach
nichts sortiert, und ein versehentlich stehengebliebener Zahlen-Haken kippte
die ganze Frage still auf Ziffernblock. Zwei gleichrangige Sorten, die sich
ausschließen, machen den Zustand am Haken ablesbar.

**Verworfen:** den alten Unterhaken nur zu reparieren. Er war die Ursache,
nicht das Symptom — und David hat den Umbau ausdrücklich verlangt.

### 2 · Trivial Pursuit: Logikfehler

David hat keine benannt („gibt's Logik Fehler die fixt du bitte"), also
`js/tp.js` durchgelesen. Gefunden und behoben:

| Stelle | Fehler | Folge |
|---|---|---|
| `tpEnterFinal()` | setzte `finalTeam`, aber nicht `turn` | Nach erfolgreichem Nachfassen, das das letzte Stück brachte, stand das falsche Team am Zug: GM-Kopf, Dreh-Knopf auf den Handys und Torten-Markierung zeigten den Vorgänger, gewertet wurde der Finalist |
| `tpShowAnswer()` | setzte auch beim Nachfassen `phase = 'answer'` | `tpStealAward()`/`tpStealNobody()` prüfen auf `'steal'` und taten danach wortlos nichts — der Host konnte das Nachfassen nicht mehr werten |
| `tpJudge()` | keine Phasen-Wache | Zweiter Klick (Doppeltipp, doppelt ankommender Fernbefehl) schob den Zug ein zweites Mal weiter, ein Team wurde übersprungen |
| `tpSpin()`, `tpJudge()`, `tpStealAward()`, `tpStealNobody()` | `tpUndoStack.save()` **vor** der Wache | Jeder abgeprallte Aufruf legte einen Zustand auf den Stapel; „↩ Undo" holte denselben Spielstand zurück und sah aus, als täte es nichts |
| `startTp()` | kein `tpUndoStack.reset()` | „↩ Undo" im ersten Zug holte den Spielstand des **vorigen** Spiels zurück |
| `tpDrawQuestion()` | schob bei leerer Auswahl die `0` ein zweites Mal in `used` | `used.length` wuchs über `questions.length`; `tpOpenCats()` hielt die Kategorie danach für erledigt |
| `tpRender()` | setzte `tpSpinOpen = true` auch ohne Verbindung | Der Dreh-Knopf kam nie mehr auf die Handys, auch wenn Firebase längst wieder da war |
| `tpStealAward()` | keine Prüfung `team !== turn` | Das Team, das gerade daneben lag, konnte bei sich selbst nachfassen (über einen alten GM-Spiegel) |

Dazu ein neuer Merker `tpState.stealShown`: der Host kann die Antwort jetzt
**während** des Nachfassens aufdecken, ohne die Phase zu verlassen — im
GM-Panel liegt dafür ein „Antwort zeigen"-Knopf in der Steal-Leiste.

### 3 · Lobby-GIF zwischen den Fragen

**Symptom (David):** „Zwischen jedem Buzzer geht immer wieder der Lobbyscreen
mit Gif auf. Soll nicht."

**Ursache:** `refreshRoot()` in `buzzer/index.html` kannte nur
`live || armed || buzzedThisRound` → Buzzer-Screen, sonst Lobby. Zwischen zwei
Fragen steht `live` auf `false`, also sprang jedes Handy in die Lobby zurück —
samt frisch eingeblendetem GIF.

**Gemacht:** Merker `everLive`. Er trennt die beiden Fälle, die `live === false`
sonst zusammenwirft: „Show hat noch nicht angefangen" (Lobby ist richtig) und
„nächste Frage kommt gleich" (Buzzer-Screen bleibt stehen, Statuszeile sagt
„Warte auf die Frage…").

**Bewusst nur im Speicher**, nicht in `localStorage`: nach einem Neuladen
mitten in der Show sieht man einmal die Lobby, spätestens bei der nächsten
Frage steht der Buzzer wieder da. Das ist der harmlose Fall — ein persistenter
Merker müsste dagegen wissen, wann eine Show *endet*, sonst bekäme ein Gast
beim nächsten Event nie wieder die Lobby zu sehen.

**Nebenwirkung, gewollt:** „Wer weiß denn sowas" setzt `live` nie und behält
damit wie bisher die Lobby. Trivial Pursuit setzt es beim Nachfassen — dort
bleibt das Handy danach auf dem Buzzer-Screen statt in der Lobby.

### 4 · Buzzer blieb für die ganze Frage gesperrt

**Symptom (David):** „Wenn man zu nah aneinander die Frage anzeigt und aber
noch vorher buzzert bleibt der Buzzer permanent gesperrt für die Frage."

**Ursache (aus dem Code hergeleitet, nicht live nachgestellt):** In
`buzzer/index.html` stand

```js
setInterval(() => { if (locked()) refreshBuzz(); }, 250);
```

Solange die 3-Sekunden-Sperre lief, wurde gezeichnet. In dem Takt, in dem sie
ablief, war die Bedingung falsch — es wurde **nicht** noch einmal gezeichnet.
Stehen blieb also das letzte Bild, das mit deaktiviertem Knopf. Er ging erst
wieder auf, wenn von außen ein Ereignis kam (fremder Buzz, Umschalten des
Hosts, neue Runde).

Genau deshalb hängt es an „zu nah aneinander": deckt der Host kurz nach dem
Öffnen auf, kommt das `armed`-Ereignis **während** der Sperre. Danach kommt
keins mehr — der Spieler ist für die ganze Frage raus, und niemand sieht warum.
Bei genug Abstand kommt `armed` nach der Sperre und räumt sie mit auf; deshalb
fiel es nur in der Hektik auf.

**Gemacht:** Der Takt läuft jetzt, solange eine Sperre eingetragen ist, und
räumt sie beim Ablaufen selbst weg — das ergibt genau den einen Durchlauf nach
dem Ende, der gefehlt hat.

**Dazu (4a):** zweiter Knopf **„🔔 Buzzer neu (alle dürfen)"** neben dem
bisherigen „(1. gesperrt)" — im GM-Panel und in der GM-Leiste.
`jeopardyBuzzReopen()` und der neue `jeopardyBuzzReopenAll()` teilen sich
`jeopardyBuzzReopenCore(sperreErsten)`. Der neue Knopf leert die Sperrliste
ganz, auch schon bestehende Einträge. Dabei mit aufgefallen: die alte Fassung
schrieb `excluded: {}` — ein leeres Objekt schreibt Firebase nicht, der alte
Knoten wäre stehengeblieben. Jetzt `null`, wenn die Liste leer ist.
`jeopardyBuzzReopenAll` steht in `GM_REMOTE_ALLOWED_FNS`, ist also auch vom
Handy-Gamepad aus erreichbar.

### Geprüft

- `node check.js` — 13 js-Dateien syntaktisch, 392 Handler-Aufrufe gegen 758
  globale Namen, 259 feste Element-IDs gegen 213 im Markup, 974
  Klammernpaare in `styles.css`. Ohne Befund.
- `node check.js --types` — 13 Dateien typgeprüft, keine Meldung.
- `buzzer/index.html`: das große `<script>` herausgelöst und mit
  `node --check` geprüft (`check.js` sieht diese Datei nicht an).

### Ungeprüft / offen

- **Nichts davon lief im Browser oder in einer echten Show.** Alle vier
  Befunde sind aus dem Code hergeleitet. Besonders Punkt 4 gehört mit zwei
  Handys nachgestellt: Feld öffnen, sofort drücken, sofort aufdecken — der
  Knopf muss nach spätestens 3 Sekunden wieder angehen.
- Punkt 3 und Trivial Pursuit greifen ineinander: seit `everLive` bleibt das
  Handy auch bei TP zwischen den Zügen auf dem Buzzer-Screen. Falls das dort
  stört, ist die Stelle `refreshRoot()` in `buzzer/index.html`.
- `estimateText` lebt noch als Rückfall in `jeopardyEstimateOpen()` und in der
  Typdefinition. Wenn sicher ist, dass keine alte Board-Datei mehr im Umlauf
  ist, kann beides raus.
- Die Fallstricke bei Trivial Pursuit, die **nicht** angefasst wurden:
  `tpHasAll()` verlangt `wedges[team].length === tpCatCount()` — wer im Editor
  während eines laufenden Spiels eine Kategorie hinzufügt, macht das Spiel
  unlösbar. Und `tpRenderTeams()` zeigt „🏁 Schlussfrage" bei **jedem** Team
  mit voller Torte, nicht nur bei dem, das gerade dran ist.

---

## 2026-09-26 — Intro-Editor landete immer bei Family Feud (`a58aab4`)

**Symptom (David):** „wenn ich in das Intro laden will dann komm ich IMMER
automatisch zu Family Feud".

**Ursache:** Der „Zurück"-Knopf im Intro-Editor stand als
`onclick="showScreen('setup-screen')"` im Markup — und `setup-screen` ist der
Family-Feud-Screen. Der Bedienblock `#intro-pick` wandert über alle acht
Setup-Screens (`INTRO_SLOTS`), der Rückweg tat das nicht. Wer das Intro aus
Jeopardy, WWDS oder dem Turnier heraus öffnete, stand danach im
Family-Feud-Setup — und einen Klick von der falschen Show entfernt.

**Behoben:** `openIntroEditor()` merkt sich den gerade aktiven Screen in
`introEditFrom`, `closeIntroEditor()` geht dorthin zurück. Gibt es den Screen
nicht (mehr), führt es ins Menü statt in eine Sackgasse. Beide in
`js/intro.js`, die zwei `onclick` in `index.html` zeigen jetzt darauf.

**Geprüft:** `node check.js --types` ohne Meldung. Im Browser **5 Prüfungen,
alle grün**: von **allen acht** Setup-Screens (Feud, Jeopardy, WWM, WWDS,
DDF, PIH, TP, Turnier) den Editor geöffnet und zurück — jedes Mal auf dem
Screen gelandet, von dem aus geöffnet wurde. Nach einem JSON-Import bleibt
man im Editor und kommt danach richtig zurück. Bei unbekannter Herkunft
landet man im Menü. Keine Konsolenfehler.

**Fallstrick beim Patchen:** `<button ... onclick="showScreen('setup-screen')">Zurück</button>`
steht **zweimal** in `index.html` — einmal im Feud-Editor, einmal im
Intro-Editor. Eine Ersetzung darauf muss mit der Zeile davor ankern, sonst
trifft sie die falsche.

## 2026-09-26 — Teams in der Lobby · Nachfassen nur fürs andere Team (`e24b4aa`)

Drei Meldungen von David, alle berechtigt.

### 1. „dpih team? da kann man nix auswählen"

**Stimmt.** Beim Teamstand hatte ich zwei Namensfelder ins PIH-Setup gebaut,
aber keine Möglichkeit, jemanden einem Team zuzuordnen. Die Lobby von
„Der Preis ist heiß" und „Der Dümmste fliegt" (`renderRosterLobby` in
`js/roster.js`) kannte nur „spielt mit / dazu" — die Team-Knöpfe hat nur
`renderSetupLobby`, die die anderen vier Shows benutzen.

Jetzt hat jede **ausgewählte** Zeile „Rot"/„Blau" und ein ✕. Beschriftet
wird über `rosterTeamNames(game)`: bei PIH aus den Setup-Feldern, sonst aus
einem laufenden Turnier, sonst „Team 1/2". Geschrieben wird über
`assignPlayerTeam` — **dieselbe Stelle wie überall sonst**, damit es nicht
zwei Stände gibt.

### 2. „die spieler werden dann als einzeln angezeigt"

Auch nach dem Zuteilen stand in der Lobby nur eine Namensliste. Jetzt steht
darunter die **Aufstellung** in einer Zeile: `Rot Anna, Ben · Blau Clara,
David · ohne Team Emil, Gustav (Gast)`. Gäste ohne Account stehen dort
ausdrücklich mit drin — sie spielen mit, zählen aber auf kein Team ein.

Dazu: `assignPlayerTeam` setzt den Wert jetzt **sofort lokal** in
`allPlayers` und ruft `refreshOpenRosterLobby()`. Vorher wartete die Anzeige
auf die Antwort der Datenbank; ohne Verbindung kam die nie und der Knopf sah
aus, als hätte er nicht reagiert.

### 3. „beim Rad drehen steht da, dass man gebuzzert hat"

**Zwei Fehler in einem.**

**a)** Nach dem Nachfassen blieb auf dem Handy dessen, der gebuzzert hatte,
„Gebuzzert! ✔" stehen. Grund: `buzzedThisRound` wird auf dem Handy erst bei
einer **neuen Runde** zurückgesetzt (`round !== lastRound`), und
`feudBuzzClose` zählt die Runde nicht weiter. Danach ging es sofort ans Rad —
und auf dem Handy stand weiter, man habe gebuzzert.

Neu: `feudBuzzEndRound()` in `js/buzzer.js` schließt **und** zählt die Runde
weiter. TP benutzt sie an allen vier Stellen statt `feudBuzzClose`.
**Family Feud bleibt, wie es war**: dort ist das Nachleuchten gewollt (man
soll seinen Platz noch sehen, wenn der Host gleich weitermacht) — deshalb
keine Änderung an `feudBuzzClose` selbst.

**b)** Beim Nachfassen war der Buzzer für **alle** offen, auch für das Team,
das gerade daneben lag — das konnte seinen eigenen Fehler wieder
einsammeln. Neu sperrt `tpExcludeTurnTeam()` dessen Handys über die
vorhandene `excluded`-Liste (nach Namen, so wertet das Handy sie aus). Dort
steht dann „Für diese Frage gesperrt 🚫" und der Knopf ist aus.

### Geprüft

`node check.js --types` ohne Meldung (388 Handler, 974 Klammernpaare).
**24 Prüfungen, alle grün**, Firebase durch eine mitschreibende Attrappe
ersetzt:

- Lobby: 2 Knöpfe je ausgewähltem Spieler, Beschriftung folgt den
  Setup-Namen (Test mit „Feuer"/„Eis"), Zuteilung wirkt sofort, ✕ nimmt sie
  weg, vier aktive Knöpfe markiert, Aufstellung gruppiert richtig, Gast
  unter „ohne Team". DDF-Lobby hat sie auch. Bildschirmfoto.
- TP: nach falscher Antwort läuft das Nachfassen, `excluded` enthält genau
  `Anna, Ben` (das Team am Zug), der Zustand kennt die Sperre; nach der
  Entscheidung wird eine neue Buzzer-Runde geschrieben, der Buzzer ist aus
  und die Sperre wieder weg.
- Handy: gesperrtes Team kann nicht buzzern und sieht den Grund, das andere
  Team kann; eine neue Runde löscht „Gebuzzert".
- Keine Konsolenfehler.

**Fallstrick:** Die Lobby baut sich nach **jedem** Klick neu auf. Ein Test,
der sich Knöpfe vorher in eine Liste holt und dann nacheinander anklickt,
klickt ab dem zweiten Mal auf tote Elemente. Nach jedem Klick neu suchen.

**Vorsicht beim Testen:** Ohne Firebase-Attrappe verbindet sich die Seite mit
der **echten** Datenbank und zeigt die echten Accounts. Ein Klick auf einen
Team-Knopf schreibt dann wirklich. Erst abklemmen, dann klicken.

## 2026-09-26 — Komplettdurchlauf (`bac0cd5`, ein Fund behoben)

Alles einmal durchgetestet. **89 Prüfungen, alle grün**, davon 80 auf der
Hostseite und 9 auf dem Handy. `node check.js --types` ohne Meldung
(13 Dateien, 386 Handler, 213 IDs, 967 Klammernpaare). Firebase war durch
eine Attrappe ersetzt, die jeden Schreibversuch **mitschreibt** statt ihn zu
senden (137 abgefangen), Popout gezählt statt geöffnet (4).

**Ein echter Fund, behoben in `bac0cd5`:** Der Ergebnis-Bildschirm lief bei
400 px Breite über — 430 px statt 400. Ursache: mit laufendem Turnier stehen
dort **vier** Knöpfe in einer Reihe („Ins Turnier übernehmen", „Zur
Turnierübersicht", „Nochmal spielen", „Zum Menü"), und `.result-btns` hatte
kein `flex-wrap`. Ohne Turnier sind zwei davon versteckt, deshalb ist es
vorher nie aufgefallen. Jetzt bricht die Reihe um.

**Durchgespielt:**

- **Feud**: Antwort, Strike, Teamwechsel, Undo, Runde 2.
- **WWM**: 15 Stufen, 4 Antworten, 50:50 und dessen Undo, Frage weiter, und
  das „Beenden" nach einer falschen Antwort (der Spielzug, kein Abbruch).
- **WWDS**: 12 Kategorien, Publikumsjoker, Punkte, Undo.
- **Jeopardy**: eigener Punktwert 800 auf einem 100er-Feld (Board zeigt ihn),
  Kategorie-Bild, Schritt-Frage mit Muster T,B,T, **Daily Double auf genau
  dieser Frage** → 1600 statt 800, Abzug 400, Schritte einzeln, Undo nimmt
  einen Schritt zurück, Gutschrift 1600. Ton in einer Schritt-Frage →
  **kleine** Anzeige, Schritte bleiben lesbar, Stopp räumt auf.
- **DDF**: vier Teilnehmer à 3 Leben, Abstimmung mit allen vier Stimmen,
  Mehrheit trifft den Richtigen, Undo gibt das Leben zurück.
- **PIH**: Ordner-Import (3 Bilder, Reihenfolge nach `01_`, Preise erkannt,
  „Playstation 5" ohne Preis, Bilder unter 200 KB), Teamleiste, 1 Runde +
  Finale, `only` geht an die Handys, nur die zwei Vertreter dürfen bieten,
  Superpreis bringt 3 Punkte (plus 1 nur bei punktgenauem Treffer), Undo,
  Endstand nennt das Team zuerst.
- **TP**: Rad-Kanal öffnet mit dem richtigen Team, Stück vergeben, Undo nimmt
  es zurück und das Rad hängt nicht.
- **Alle sieben Shows**: Hauptbildschirm hat **0** Host-Knöpfe; DDF, PIH und
  TP haben im GM kein „Beenden" mehr, dafür Undo.
- **Sieben Editoren** bauen auf. **Beide Intro-Bühnen** laufen (Kellerbühne
  mit Lämpchenrahmen, Neon mit Gitter und Sonne, dort korrekt ohne Rahmen).
- **Logos**: der goldene Balken findet seinen Verlauf, keine doppelte
  Verlaufs-ID im Dokument.
- **Töne**: alle acht Einträge in `SFX` da, Knopf „Töne probehören" im Menü.
- **Handy**: Rad-Knopf frei, wenn das eigene Team dran ist; nach fremdem Dreh
  gesperrt mit Namen; anderes Team sieht nichts; Finale-Sperre greift und
  nennt die Bieter; ohne Einschränkung darf jeder.
- **Gamepad** lädt ohne Fehler.
- **Kein Querüberlauf** auf zwölf Screens, weder bei 1024 px noch bei 400 px
  (nach dem Fix). Keine Konsolenfehler auf allen drei Seiten.

**Fünf Fehlalarme, die keine waren** — für den nächsten Durchlauf:

- `ddfHostVote` trägt nur **Gäste** ein; Konten stimmen über Firebase ab.
  Ein Test muss `ddfState.votes[uid]` direkt setzen, sonst zählt nur eine
  Stimme. (Dasselbe gilt für `pihHostBid`/`pihState.bids`.)
- Der **Undo-Knopf verschwindet nach dem Undo** — der Stapel ist dann leer.
  Wer direkt danach auf den Knopf prüft, findet ihn zu Recht nicht.
- Das **WWM-„Beenden"** erscheint nur nach einer **falschen** Antwort.
- Im PIH-Finale gibt ein **punktgenaues** Gebot einen Punkt extra, der
  Superpreis bringt also 3+1 statt 3.
- `document.body.textContent` auf der Gamepad-Seite enthält den Inhalt der
  `<script>`-Blöcke. Das sieht nach ausgeplauderter Konfiguration aus, ist
  aber keine: `innerText` ist leer. Mit `innerText` prüfen.

**Ungeprüft geblieben:** alles, was zwei echte Geräte über Firebase braucht —
Rad drehen vom Handy, Gebote im Finale, Buzzer-Wettlauf. Dazu das echte
Board-Popout und der Datei-Dialog per Mausklick.

## 2026-09-26 — Rad vom Handy · Host-Knöpfe nur im GM · Undo überall (`1673e6d`)

Drei Wünsche in einem Commit, weil sie sich überlappen.

### 1. Trivial Pursuit: Rad vom Handy drehen

Das Team **am Zug** dreht jetzt selbst. Neuer Zweig `buzzer/tpspin` nach dem
Muster von `ddfvote` und `estimate` (`makeRoundChannel`): der Host schreibt
`{active, round, team, teamName, by:null}`, auf den Handys dieses Teams
erscheint „🎡 Rad drehen" (`#screen-tpspin`).

**Genau ein Dreh je Runde**, auf drei Ebenen abgesichert: das Handy setzt
`by` per **transaction** (kommt nur durch, solange dort `null` steht — zwei
gleichzeitige Finger ergeben einen Dreh); der Host schließt den Zweig im
Rückruf **sofort** und noch einmal in `tpSpin`; und jede Runde hat eine
eigene `round`, sodass ein Handy mit altem Stand in eine Runde schreibt, die
niemand mehr abhört. `tpSpinOpen` verhindert, dass jedes Neuzeichnen eine
neue Runde aufmacht.

Der Knopf beim Host **bleibt**: ohne Verbindung, ohne Handy oder bei einem
hängenden Gerät dreht er wie bisher. Wer gedreht hat, steht kurz in der
Rundenleiste (`#tp-spin-by`).

### 2. Host-Knöpfe weg vom Hauptbildschirm

David hat ein Foto geschickt: „Antwort zeigen / Richtig / Falsch / Beenden"
standen bei TP **auf dem Bildschirm, den auch das Publikum sieht**. Nachgesehen:
**Feud, Jeopardy, WWM und WWDS** haben dort **keine** Steuerung, sie läuft nur
über das GM-Fenster (und damit auch über das Gamepad, das die GM-Seite
spiegelt). **DDF, PIH und TP** — die drei neueren Shows — hatten sie doppelt.

Jetzt sind `#tp-controls`, `#ddf-controls` und `#pih-controls` samt ihren
Render-Funktionen weg. Die GM-Helfer hatten schon **alle** Knöpfe, mit einer
Lücke: „Nochmal / Zum Menü" nach Spielende stand nur auf dem Hauptbildschirm.
Das steht jetzt im GM unter `phase === 'done'`.

### 3. Undo in allen Shows

`makeUndo(lies, ueberspringen, danach)` in `core.js`: ein flacher
JSON-Schnappschuss des Zustandsobjekts, Stapel bis 40 Schritte.
**`timerInt` wird ausgelassen** — zurückgeschrieben liefe der alte Timer
weiter und der neue dazu. Bei TP bleibt zusätzlich `spinning` außen vor,
sonst hängt das Rad nach einem Undo mitten in der Drehung.

Benutzt von **WWM, WWDS, DDF, PIH, TP**. Feud (`undoLast`) und Jeopardy
(`jeopardyUndo`) hatten schon eigene und bleiben, wie sie sind — zwei
funktionierende Implementierungen umzubauen wäre Risiko ohne Gewinn.

Gesichert wird vor: WWM `wwmLock/Next/Fifty/Phone/Audience`; WWDS
`wwdsPick/Lock/Reveal/Next/Audience`; DDF `ddfReveal/ApplyLoss/Next`; PIH
`pihEvaluate/pihNext`; TP `tpSpin/tpJudge/tpStealAward/tpStealNobody`. Der
Knopf erscheint nur, wenn der Stapel etwas hergibt (`can()`).

**Was Undo nicht kann:** Gesendetes zurückholen. Was auf den Handys stand,
stand dort. Der Zustand beim Host und die Anzeige stimmen danach wieder,
mehr verspricht der Knopf nicht. Steht so auch im Kommentar.

### „Beenden"

Bei DDF, PIH und TP raus — Feud, Jeopardy und WWDS hatten nie eins.
**Das WWM-„Beenden" bleibt**: es ruft `wwmNext()` und ist der Spielzug nach
einer falschen Antwort, kein Abbruch. Wer eine Show wirklich verlassen will,
nimmt „Zum Menü" am Spielende oder lädt neu.

### Geprüft

`node check.js --types` ohne Meldung (386 Handler, 213 IDs, 967
Klammernpaare). Im Browser **23 Prüfungen, alle grün**, Firebase durch eine
mitschreibende Attrappe ersetzt:

- TP-Hauptbildschirm hat **0** Knöpfe, das GM-Fenster „🎡 Rad drehen" und
  „Beenden"… (letzteres ist beim Test noch dagewesen, danach entfernt und
  gegengeprüft: `tpGmControlsHtml` enthält kein „Beenden" mehr, ebenso DDF
  und PIH).
- Rad-Kanal: `active:true`, richtiges Team, Teamname, `by:null`. Eingehender
  Dreh → Rad läuft, Kanal zu (`active:false` geschickt), Name auf dem
  Bildschirm; ein zweiter Dreh während der Drehung prallt ab; nach 3,6 s
  steht die Frage und der Kanal bleibt zu.
- Undo je Show: WWM nimmt 50:50 zurück und geht eine Frage zurück; WWDS
  nimmt die Punkte zurück; DDF gibt das Leben zurück; PIH nimmt die Punkte
  zurück und steht wieder in der Gebotsphase; TP nimmt das Tortenstück
  zurück, das Team bleibt am Zug und das Rad hängt nicht.
- Der Undo-Knopf fehlt, solange nichts zurückzunehmen ist, und erscheint
  nach dem ersten Schritt.
- Keine Konsolenfehler.

**Ungeprüft:** der Rad-Knopf auf einem echten Handy über Firebase (die
Handy-Seite ist nur gelesen, nicht gefahren), und ob Undo in jeder denkbaren
Zwischenphase sinnvoll aussieht — gesichert sind die Schritte, die Punkte,
Leben oder Runde ändern, nicht jede Kleinigkeit.

## 2026-09-26 — Handys im Finale stumm · Turnier-Teams umbenennbar (`c3ef922`)

### Handys im Finale

**Vorher** stand während des Finales bei **allen** Handys das Eingabefeld
offen; die Gebote der Nicht-Finalisten fielen erst in der Auswertung
stillschweigend raus. Auf dem Handy sah das aus wie ein Fehler. (Stand als
„bewusst so gelassen" im Eintrag zu `8ef97a8` — David wollte es anders.)

**Jetzt** schreibt `pihBeginBids` im Finale zwei Felder mit in
`buzzer/estimate`: `only` (die **Account-Schlüssel** der Vertreter) und
`onlyNames` (für die Anzeige). Das Handy liest beides, `mayEstimate()`
vergleicht `only` mit dem eigenen Schlüssel, und wer nicht dabei ist bekommt
den neuen Bildschirm `#screen-estwatch`: „★ Finale — Es bieten Anna und
Clara." `sendEstimate` prüft es **noch einmal**, falls jemand den alten
Bildschirm offen hat.

**Warum Schlüssel und nicht uids:** Das Handy kennt nur seinen Account, nicht
die spielinterne uid. Gäste haben gar keinen Schlüssel — sie tippen ohnehin
beim Host und sind im Finale sowieso raus.

**Rückwärtskompatibel:** Fehlt `only`, darf jeder. Die Jeopardy-Schätzfrage
schreibt ihr `set` ohne diese Felder, und `set` ersetzt den ganzen Knoten —
eine Einschränkung kann also nicht aus einer alten Runde hängen bleiben.

### Turnier-Teams umbenennen

Turniername und Teamnamen standen nach `tournamentCreate` fest. Ein Tippfehler
blieb den ganzen Abend, und wer die Teams erst nach dem ersten Spiel tauft,
musste das Turnier neu anlegen — samt Verlust aller Ergebnisse. Neu:
`✏ Namen ändern` über der Tabelle, klappt ein Formular auf
(`tournamentRenamePanelHtml` / `tournamentRenameSave`).

**Bewusst nur Umbenennen, kein Sortieren und kein Löschen:** Die Punkte hängen
am **Index** (`scores[0]` ist Team 1). Zwei Namen zu tauschen würde die
Ergebnisse *nicht* mittauschen — das wäre eine Falle. Steht als Hinweis auch
im Formular. Ein leer gelassenes Feld behält den alten Namen.

**Nebenbefund, mitbehoben:** Team- und Turniernamen gingen an vier Stellen
**ungeprüft ins Markup** (`<strong>${tournament.teams[o.i]}</strong>` und
drei weitere). Mit frei eingetippten Namen ist das eine offene Tür; jetzt
alle durch `escapeHtml`.

### Geprüft

`node check.js --types` ohne Meldung (403 Handler, 215 IDs). Im Browser
**26 Prüfungen, alle grün**, Firebase durch eine Attrappe ersetzt, die
mitschreibt, *was* gesendet wird:

- Normale Runde: `only` und `onlyNames` sind `null` — keine Einschränkung.
- Finale: `only` trägt genau `['k1','k3']` (Anna, Clara), `onlyNames`
  „Anna und Clara".
- Handy (`buzzer/index.html` lokal geladen, **nicht** eingeloggt, also keine
  Schreibzugriffe auf die echte Datenbank): ohne `only` darf jeder; mit
  `only` und fremdem Schlüssel greift die Sperre, der Warte-Bildschirm wird
  aktiv und nennt beide Namen, das Eingabefeld bleibt zu; als Vertreter darf
  man; `sendEstimate` schickt auch dann nichts, wenn der alte Bildschirm noch
  offen ist. Bildschirmfoto gemacht.
- Turnier: Formular öffnet vorbelegt, Umbenennen ändert Namen und lässt die
  Punkte bei **4 : 2**, das alte Ergebnis 300 : 100 bleibt stehen, die
  Tabelle zeigt die neuen Namen, gespeichert wird unter `tournamentCache`,
  ein leeres Feld behält den alten Namen, Abbrechen verwirft.
- Ein Teamname mit `<b>` erscheint als **Text**, kein eingeschleustes Markup.
- Keine Konsolenfehler.

**Ungeprüft:** der echte Weg über Firebase mit zwei Handys.

**Fallstrick:** Das Turnier liegt unter `tournamentCache`, nicht unter
`tournament`. Eine Prüfung auf den falschen Schlüssel meldet einen Fehler,
der keiner ist.

## 2026-09-26 — Preis ist heiß: Teamstand und Finale (`8ef97a8`)

**Anlass:** David hat gefragt, ob „Der Preis ist heiß" normalerweise ein
Finale hat. Im Fernsehen ja (drei Spielrunden, zum Schluss der Superpreis),
bei uns hatte es keins — die Phasen waren `show → bid → result → done`.
Dazu kam von ihm: **„wir spielen in 2 teams"**. Das Spiel kannte Teams
vorher **überhaupt nicht**, sie tauchten erst ganz am Ende beim
Turnier-Eintrag auf.

**Von David entschieden** (über die Auswahlfrage): Finale mit **je einem
Vertreter** pro Team, Gewicht **im Setup einstellbar**, Teamstand **während
des ganzen Spiels** sichtbar.

**Gemacht, 1 — Teamstand:** Neue Leiste `#pih-teams` über der Einzelwertung,
führendes Team hervorgehoben. Die Zuordnung kommt aus `allPlayers[].team`
(Lobby → „Teams zuteilen"), also **aus derselben Quelle wie das Turnier** —
zwei Quellen wären zwei Stände, die auseinanderlaufen. Namen aus den neuen
Feldern `pih-t1-name`/`pih-t2-name`; leer gelassen zieht es die Namen aus
einem laufenden Turnier, sonst „Team 1"/„Team 2". Gäste ohne Account haben
kein Team, spielen mit und werden unter der Leiste namentlich ausgewiesen —
sie fallen sonst stillschweigend aus der Wertung.

**Gemacht, 2 — Finale:** Im Editor markiert ein **★** je Artikel den
Superpreis (immer nur einen; ein zweiter Klick hebt es auf). `startPih`
nimmt ihn aus der Mischung und hängt ihn ans **Ende** von `order`;
`finalAt` merkt sich die Stelle, `pihIsFinal()` fragt sie ab. „Artikel pro
Spiel" zählt ihn nicht mit — die Zahl meint die normalen Runden.

Im Finale bietet je Team nur der **Punktbeste** (`pihTeamChampions`,
festgelegt in `pihNext` *vor* dem Eintritt, damit die letzte Vorrunde noch
zählt). `pihMayBid` filtert `pihPhoneBidders`/`pihGuestBidders`, damit gehen
Gebote anderer gar nicht erst in die Wertung. Der Superpreis bringt
`finalWeight` Punkte (Setup, Standard 2). **Der Bonus für den punktgenauen
Treffer bleibt bei 1** — sonst entscheidet ein Zufallstreffer die Show
doppelt.

Ohne markierten Artikel ist `finalAt` −1 und alles läuft wie vorher. Ein als
Superpreis markierter Artikel **ohne gültigen Preis** wird ignoriert.

**Geprüft:** `node check.js --types` ohne Meldung (400 Handler, 214 IDs).
Im Browser **41 Prüfungen, alle grün**, Firebase abgeklemmt (72 Aufrufe),
vier Accounts in zwei Teams plus ein Gast:

- Editor: Stern je Artikel, immer nur einer gesetzt, wieder abwählbar,
  Hinweiszeile wechselt zwischen „kein Superpreis" und „Superpreis gesetzt".
- Start mit „3 Artikel": `order` hat **4** Einträge, der Superpreis steht an
  Position 4 und kommt in den Vorrunden nicht vor.
- Teamleiste da, Gast als „ohne Team" ausgewiesen.
- Drei Vorrunden durchgespielt: Anna punktgenau (1+1), Clara, Ben →
  **Rot 3 : Blau 1**. Knopf heißt dann „★ Zum Finale" statt „Endstand".
- Finale: Vertreter sind **Anna** (2) und **Clara** (1), nur die beiden
  dürfen bieten, Davids Gebot taucht im Ergebnis **nicht** auf, der Gast
  bietet nicht mehr mit, Überschrift „★ SUPERPREIS".
- Clara gewinnt das Finale → **3 Punkte** → Endstand **Rot 3 : Blau 4**, das
  Finale dreht das Spiel also wie gewollt.
- Endstand nennt Teamergebnis zuerst, bester Einzelspieler dahinter.
- Gegenprobe ohne Superpreis: `finalAt` −1, zwei Runden wie eingestellt,
  alle dürfen bieten. Nur ein besetztes Team: ein Vertreter, kein Absturz.
- Keine Konsolenfehler. Bildschirmfoto der Teamleiste (Rot 4 : Blau 2).

**Offen / bewusst so gelassen:** Während des Finales zeigen **alle** Handys
weiter das Eingabefeld — die Gebote der Nicht-Finalisten werden nur nicht
gewertet. Sie stumm zu schalten hieße, in die gemeinsame Estimate-Leitung
einzugreifen, die sich PIH mit der Jeopardy-Schätzfrage teilt. Der
Bildschirm sagt, wer bietet; der Host sagt es ohnehin an.

**Ungeprüft:** ein echter Durchlauf mit Handys über Firebase, drei Teams
(der Code kennt hier bewusst nur zwei), und was passiert, wenn der
Punktbeste eines Teams zwischendurch das Spiel verlässt.

## 2026-09-26 — Preis ist heiß: ganzen Ordner einlesen (`a74661d`)

**Gemacht:** Knopf **„📁 Ordner einlesen"** in der Werkzeugleiste des
Artikel-Editors (`<input type="file" webkitdirectory>`). Je Bild im Ordner
entsteht ein Artikel: **Name und Preis aus dem Dateinamen**, das Bild auf
Medienplatz 1. Darunter eine Meldezeile (`#pih-import-info`) mit dem
Ergebnis. Nicht-Bilder im Ordner werden übersprungen, sortiert wird
alphabetisch nach Dateiname (`localeCompare` mit `numeric`, damit `2_` vor
`10_` kommt).

**Erkannte Muster** (`pihParseFileName`): `Name_49,99` · `Name - 49,99` ·
`Name 49,99 €` · `Name # 49,99` · `49,99 - Name`, jeweils auch mit führender
Nummerierung `03_` / `3. `. Auch `18.500` und `1.299,90` (deutsche
Tausenderpunkte) über das vorhandene `pihParsePrice`.

**Warum aus dem Dateinamen und nicht aus einer Begleit-CSV:** David benennt
die Bilder beim Sammeln ohnehin; eine zweite Datei, die zu den Bildern passen
muss, ist eine Fehlerquelle mehr. Er hatte ausdrücklich „Ordner hochladen und
es geht automatisch" gesagt.

**Bewusst keine blanke Zahl am Ende:** `Playstation 5.jpg` ist ein Name, kein
Artikel für 5 €. Eine Zahl zählt nur mit klarem Trenner (`_ | ; #`, „ - "),
mit Nachkommastelle oder mit `€`. Ohne erkannten Preis wird der Artikel
trotzdem angelegt — Preisfeld leer und rot, das sieht man im Editor sofort.

**Der eigentliche Fallstrick war der Speicher.** Die Spieldaten liegen in
`localStorage`, das ist bei rund 5 MB zu Ende. Zwanzig Handyfotos sind als
Data-URL ein Vielfaches davon, und `storeSetJson` fängt den Quota-Fehler ab
und gibt **still** `false` zurück: die Artikel hätten im Editor gestanden und
wären nach dem nächsten Neuladen weg gewesen. Deshalb

- neu `shrinkImageToDataUrl(file, maxPx, quality)` in `core.js`: rechnet über
  ein Canvas auf 1280 px herunter. PNG/WebP behalten ihre Transparenz,
  solange das Ergebnis unter 500 KB bleibt; darüber wird JPEG daraus, dann
  mit weißem Grund (sonst werden durchsichtige Stellen schwarz).
- `pihSave()` gibt jetzt den Rückgabewert von `storeSetJson` weiter, und der
  Import meldet per Hinweis **und** `alert`, wenn nicht gespeichert werden
  konnte, samt Rat, als JSON zu exportieren.

Nur der Import benutzt den Verkleinerer; die einzelnen Bild-Knöpfe in
Jeopardy, DDF und PIH legen ihre Bilder weiter unverändert ab. Das absichtlich
in einem Schritt zu ändern wäre eine zweite Baustelle gewesen.

**Geprüft:** `node check.js --types` ohne Meldung (13 Dateien, 399 Handler,
210 IDs). Im Browser **17 Prüfungen, alle grün:**

- **12 Dateinamen-Muster** trocken gegen erwartete Name/Preis-Paare geprüft,
  alle richtig — inklusive `Playstation 5.jpg` → kein Preis, `iPhone 15_999`
  → Name „iPhone 15" / 999, `Kleinwagen_18.500` → 18500,
  `Sofa 1.299,90 €` → 1299,9.
- Echter Import von fünf erzeugten Bildern (bis 3000 × 2000 px) plus einer
  `.txt`: 5 Artikel, Textdatei übersprungen, Reihenfolge nach `01_`…`05_`.
- Bilder nach dem Verkleinern **32–37 KB** statt Megabyte, längste Kante
  genau 1280 px, das PNG blieb PNG.
- Meldezeile nennt „5 Artikel · 1 ohne erkannten Preis (rot markiert)", das
  leere Preisfeld hat den roten Rahmen, das Bild sitzt auf Platz 1.
- Gesamter Datensatz in `localStorage` unter 1 MB; nach `location.reload()`
  stehen alle 11 Artikel und 5 Bilder unverändert da.
- Ordner ohne Bilder, abgebrochene Auswahl und eine kaputte JPEG-Datei geben
  je eine Meldung und legen nichts an. Keine Konsolenfehler.

**Ungeprüft:** ein echter Ordner aus dem Dateidialog (im Test wurde
`input.files` gesetzt), ein sehr großer Ordner (50+ Bilder) und wie lange das
dann dauert, Unterordner, und ob Safari `webkitdirectory` hier mitmacht.

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
