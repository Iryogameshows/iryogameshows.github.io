# Handoff

Was zuletzt passiert ist und warum. Neueste Einträge oben.
Angelegt mit `452ac83`.

Die Git-History sagt, *was* geändert wurde. Hier steht, was gemessen,
verworfen oder bewusst liegen gelassen wurde — das geht sonst verloren und
wird ein zweites Mal erarbeitet.

**Jede Aussage hier gilt als veraltet, bis sie gegen das Repo geprüft ist.**
Erst `git fetch origin && git status -sb`, dann lesen.

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
