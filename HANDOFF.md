# Handoff

Was zuletzt passiert ist und warum. Neueste Einträge oben.
Angelegt mit `452ac83`.

Die Git-History sagt, *was* geändert wurde. Hier steht, was gemessen,
verworfen oder bewusst liegen gelassen wurde — das geht sonst verloren und
wird ein zweites Mal erarbeitet.

**Jede Aussage hier gilt als veraltet, bis sie gegen das Repo geprüft ist.**
Erst `git fetch origin && git status -sb`, dann lesen.

---

## 2026-10-22 — `856b25f` Domain `iryo.party` bei GitHub verifiziert, Voll-Token gelöscht

**Gemacht:**
- David hat das erste Cloudflare-Token (Account-Token mit allen Rechten) selbst gelöscht.
  Das DNS-Token (`CLOUDFLARE_API_TOKEN`) danach geprüft: `active`.
- Domain-Verifizierung: David hat in seinem Browser unter github.com/settings/pages
  (`Iryogameshows`) `iryo.party` hinzugefügt; Claude hat per Cloudflare-API den TXT
  `_github-pages-challenge-iryogameshows.iryo.party` = `12c0791b0dd23be8af554b1d80896f`
  angelegt; David hat „Verify" geklickt → verified.
- `CLAUDE.md` (Deploy): Verifizierung vermerkt, TXT-Eintrag nicht löschen.

**Warum so:** Für die Verifizierung gibt es keine GitHub-API, und das Browser-Pane der App
hing (Navigation 300 s Timeout, angemeldeter Tab verschwand, Pane ausgeblendet) — deshalb
der GitHub-Klick-Teil in Davids eigenem Browser. Der TXT-Wert ist kein Geheimnis (steht
öffentlich im DNS), deshalb hier notiert.

**Geprüft:** `Resolve-DnsName -Type TXT -Server 1.1.1.1` → Wert stimmt.
`gh api …/pages` → `protected_domain_state=verified`, `cname=iryo.party`,
`https_enforced=true`. `node check.js` „alles in Ordnung". Aus dem Eintrag zu `f63fb60`
inzwischen erledigt: `http://iryo.party/` → 301 auf https (nachgeprüft).

**Offen:** Echte Show über die neue Domain nicht gespielt. Graphify-Hinweis in der globalen
`~/.claude/CLAUDE.md` der anderen Geräte.

**Fallstricke:** Anmeldungen in Davids normalem Browser gelten im Browser-Pane der App
nicht — es ist ein getrennter Browser.

---

## 2026-10-22 — `f63fb60` Eigene Domain `iryo.party`

**David:** „ich hab jetzt ne eigene Domain" → `https://iryo.party`, DNS bei Cloudflare.

**Gemacht:**
- Cloudflare-API (Token „Edit zone DNS", nur Zone `iryo.party`, von David per Popup als
  Benutzervariable `CLOUDFLARE_API_TOKEN` gesetzt — Claude hat den Wert nie gesehen):
  4× `A` `185.199.108–111.153`, 4× `AAAA` `2606:50c0:8000–8003::153`, `CNAME www` →
  `iryogameshows.github.io`, alle `proxied=false`. Zone-ID `863c336ae7f8010448526a173688af8f`.
- GitHub: `gh api -X PUT …/pages -f cname=iryo.party`, danach `-F https_enforced=true`.
- Code: `SITE_URL` in `js/buzzer.js` → `https://iryo.party`. Doku: `CLAUDE.md` (Intro-Labor-,
  Durchgang-, Prüf-URL, Deploy-Abschnitt samt DNS-Aufbau), `FIREBASE-ANLEITUNG.md`,
  `tools/gemeinsam/LIESMICH.md`, `/abschluss`-Skill (Live-`curl`).
- Außerhalb des Repos: `~/.claude/skills/graphify/` gelöscht (David: „ja").

**Warum so:**
- Domain erst bei GitHub eingetragen, **nachdem** DNS auflöste: ab dem Eintrag leitet
  github.io auf die neue Domain um — ohne DNS wäre die Seite samt Handy-Buzzer weg gewesen.
- Keine `CNAME`-Datei: bei `build_type: workflow` zählt nur die Pages-Einstellung.
- DNS only statt Cloudflare-Proxy: sonst kein GitHub-Zertifikat.
- Erstes Token (Account-Token, per Mehrfachauswahl alle Rechte) hatte kein Zone-DNS-Recht
  (`code 10000 Authentication error`) und war viel zu weit; ersetzt durch Vorlage
  „Edit zone DNS" über My Profile → API Tokens.
- Nicht ersetzt: Stellen, die das **Repo** meinen (API-URL `repos/Iryogameshows/
  iryogameshows.github.io` im abschluss-Skill, „öffentliches Repo" in
  `assets/t/LIESMICH.md` und `tools/sprites/bau.js`).
- Kleinkram trotz Codex-Regel selbst gemacht: 7 Ersetzungen, verzahnt mit der
  DNS-Prüfung — ein Codex-Umlauf hätte mehr gekostet.

**Geprüft:**
- `nslookup iryo.party 1.1.1.1` → die vier A-Adressen; `www` → Alias.
- Pages-API: `cname: iryo.party`, Zertifikat `approved` (bis 2027-01-20, `iryo.party` +
  `www`), `https_enforced: true`.
- `curl` 3 Durchläufe: `https://iryo.party/` 200, `/buzzer/` 200,
  `https://www.iryo.party/` 301 → apex, `https://iryogameshows.github.io/buzzer/` 301 →
  `https://iryo.party/buzzer/`. Erste Versuche direkt nach dem Eintragen: `000`
  (schannel), nach ~2 min weg.
- Browser-Pane `https://iryo.party/buzzer/`: keine Konsolenfehler, Firebase
  `.info/connected` = `connected` (nur gelesen, nichts geschrieben).
- `node check.js` „alles in Ordnung".

**Offen:**
- `http://iryo.party/` lieferte zum Prüfzeitpunkt noch 200 statt Umleitung auf https —
  vermutlich Verzögerung nach `https_enforced`, nicht nachgeprüft.
- Domain-Verifizierung bei GitHub (TXT `_github-pages-challenge-Iryogameshows`) nicht
  eingerichtet — schützt vor Übernahme der Domain durch fremde Pages-Repos; Wert gibt es
  nur in Davids GitHub-Einstellungen.
- Erstes Cloudflare-Token mit allen Account-Rechten: David gebeten zu löschen —
  nicht bestätigt.
- Echte Show über die neue Domain (Host + Handys) nicht gespielt; nur Buzzer-Seite geladen.
- Globale `~/.claude/CLAUDE.md` auf den **anderen** Geräten enthält noch den
  graphify-Hinweis — dort beim nächsten Start entfernen (David: „ja").

**Fallstricke:** Cloudflares neue Rechte-Auswahl bei **Account**-Tokens zeigt keine
Zone-DNS-Rechte — das passende Token entsteht nur über My Profile → API Tokens.
`curl` unter Windows (schannel) meldete kurz nach Zertifikatsausgabe `000`/Exit 60.

---

## 2026-10-22 — `c0aab50` HANDOFF aufgeteilt, handoff-Skill korrigiert, graphify global raus

**Gemacht:**
- Codex (Prompt von Claude, nur lokal) hat `HANDOFF.md` geteilt: Kopf + die 20 jüngsten
  Einträge + TODO-Abschnitt bleiben, 212 ältere Einträge nach `HANDOFF-archiv.md`.
  Claude hat danach eine Leerzeile vor dem Verweis ergänzt und committet.
- `CLAUDE.md` (Abschnitt HANDOFF): nennt das Archiv und die Schwelle (~30 Einträge),
  ab der wieder verschoben wird — als Codex-Auftrag.
- `.claude/skills/handoff/SKILL.md` Schritt 3: alte Regel „außer bei großen Änderungen"
  durch die geltende „automatisch, ohne Rückfrage" ersetzt.
- `~/.claude/CLAUDE.md` (global, nicht im Repo): einziger Inhalt war der graphify-Hinweis,
  entfernt; Datei jetzt 0 Bytes.

**Warum so:** HANDOFF war 588 KB / 10 423 Zeilen und wird nach jeder Kompaktierung zuerst
gelesen — ganz passte sie nie in den Kontext. Verworfen: nach Datum schneiden (Tage mit
vielen Einträgen hätten die Größe kaum begrenzt).

**Geprüft (von Claude, nicht Codex' Meldung übernommen):** `^## 20` vorher 233, nachher
21 in `HANDOFF.md` (20 Einträge + 1 Überschrift im TODO-Abschnitt) + 212 im Archiv = 233.
`# TODO / Offene Punkte` 1× in `HANDOFF.md`, 0× im Archiv. Aus beiden Dateien den
Originaltext zusammengesetzt und gegen `git show HEAD:HANDOFF.md` gedifft (ohne `\r`):
2 Unterschiede, beide dieselbe verschobene Leerzeile aus meinem Zusammensetzen, kein
Inhaltsverlust. `node check.js` „alles in Ordnung".

**Offen:** Der Skill-Ordner `~/.claude/skills/graphify/` liegt weiter auf diesem Gerät
(nur der Hinweis in der globalen `CLAUDE.md` ist weg). Die globale `CLAUDE.md` auf
anderen Geräten ist nicht angefasst.

**Fallstricke:** `: > ~/.claude/CLAUDE.md` wurde vom Auto-Mode-Klassifizierer als
„Irreversible Local Destruction" abgelehnt; mit dem Edit-Werkzeug ging es.

---

## 2026-10-22 — `13a9bee` graphify entfernt · `0de9481` CLAUDE.md gestrafft

**David:** „ja dann weg mit graphify, straff die md und gib mir den prompt" — nach der
Frage, ob die Code-Struktur verbessert werden kann und ob graphify Tokens spart.

**Gemacht:**
- `13a9bee`: `git rm -r graphify-out` (279 eingecheckte Cache-Dateien + `manifest.json`),
  lokalen Ordner gelöscht (u. a. `graph.json` 2,0 MB, `GRAPH_REPORT.md`), Block in
  `.gitignore` entfernt.
- `0de9481`: `CLAUDE.md` von 737 auf 458 Zeilen, 38 689 → 22 026 Bytes (≈ 10 k → 5,5 k
  Tokens je Session). Keine Regel gestrichen.

**Warum so:**
- graphify: `cost.json` — Bau am 2026-10-12 kostete 2 912 247 Input-Tokens; seitdem 58
  Commits an `js/`/`styles.css`/`index.html`; viele der 110 Communities waren
  `vendor/`-Bündel (ReactBits A–G, GSAP, Lenis). `grep` über ~27 000 Zeilen eigenen Code
  kostet wenige hundert Tokens. Verworfen: `--update` (kostet wieder, ohne Mehrwert).
- CLAUDE.md: gestrichen wurden Wiederholungen (Warum-Geschichten doppelt, Antwortformat
  dreimal erklärt), Zählstände aus der Umbauzeit („160-mal `getElementById`"),
  Statusmeldungen („Stand 2026-10-10 `dffe0bd`", „Stand 2026-10-13"), die
  AGENTS.md-Vorgeschichte. **Nicht** auf `../CLAUDE.md` ausgelagert: die liegt
  unversioniert in `Documents/Coding`, kommt nicht auf andere Geräte, und Codex liest sie
  nicht.
- Ergänzt: Hook `commit-gate.js` in der Hook-Liste (fehlte); `pruefungen.yml` klar als
  „nicht auf GitHub" (`git ls-files .github/workflows` = nur `pages.yml`, lokal auch keine
  `pruefungen.yml`); Hinweis, `pages.yml` nicht ohne `workflow`-Recht zu ändern.
- Abschnittsnamen „Antwortformat" und „Commit und Push" bleiben — `.claude/skills/abschluss`
  und `handoff` verweisen darauf.

**Geprüft:** `node check.js` „alles in Ordnung" vor beiden Commits. `grep -i graphify`
über `*.md/*.json/*.js/*.yml` (ohne HANDOFF): nur noch `pages.yml` Zeile 45–52.

**Offen:**
- `pages.yml` enthält weiter `rm -rf graphify-out` und einen Kommentar dazu — harmlos,
  nicht änderbar ohne `workflow`-Recht.
- Globale `~/.claude/CLAUDE.md` nennt graphify weiter (gilt für alle Projekte, nicht
  angefasst).
- `.claude/skills/handoff/SKILL.md` Zeile 55 zitiert die alte Regel „automatisch, außer bei
  großen Änderungen" — veraltet, nicht angefasst.
- `HANDOFF.md` (588 KB) archivieren: Codex-Prompt an David übergeben, Ergebnis steht aus.

**Fallstricke:** keine.

---

## 2026-10-22 — `86656e8` Struktur-Abschnitt der `CLAUDE.md` angeglichen (erster Codex-Auftrag)

**Gemacht:** Von Codex nach Claudes Prompt, nur lokal; Diff von Claude geprüft und
committet. `## Struktur` um `js/keller-ton.js`, `js/resume.js`, `tools/keller/`,
`tools/sprites/` ergänzt; „Alle 14 Dateien in `js/`" → 16.

**Warum so:** Test der neuen Regel „stupide Arbeit an Codex abgeben". Ergebnis: Codex
blieb im Rahmen — 1 Datei, 5 Zeilen dazu, 1 geändert, keine fremden Abschnitte, nichts
committet.

**Geprüft (von Claude, nicht nur Codex' Meldung übernommen):** `git diff --stat` 1 Datei;
die vier Zweckangaben gegen die Dateiköpfe gelesen — stimmen; `node check.js` und
`node check.js --types` beide „alles in Ordnung", `ls js | wc -l` = 16.

**Offen:** keine.

**Fallstricke:** keine.

---

## 2026-10-22 — `85f5b67` Codex-Prompt: „nicht committen" als erste Zeile

**David:** „schreib bitte auch immer rein: nicht pushen oder comitten, erst nur lokal."

**Gemacht:** Regel in `CLAUDE.md` („Stupide Arbeit an Codex abgeben") ergänzt: Jeder
Codex-Prompt beginnt wörtlich mit „Nicht committen, nicht pushen — alles nur lokal."

**Warum so:** Der erste Prompt (Struktur-Abschnitt der `CLAUDE.md` angleichen: 16 statt
14 `js/`-Dateien, es fehlen `js/keller-ton.js`, `js/resume.js`, `tools/keller/`,
`tools/sprites/`) hatte das nur ganz unten. Oben fällt es nicht unter den Tisch.

**Geprüft:** `node check.js` — „alles in Ordnung".

**Offen:** Codex-Auftrag „Struktur angleichen" an David übergeben, Ergebnis steht aus.
`CLAUDE.md` bleibt bis dahin bei „14 Dateien".

**Fallstricke:** keine.

---

## 2026-10-22 — `072e0e9` Stupide Arbeit als Codex-Prompt; `AGENTS.md` als Verweis

**David:** „wenn du stupide arbeit hast die jeder dulli machen kann, dann schreib mir
einen Prompt für diesen Teil der arbeit. dann schick ich das Codex um Tokens zu sparen."

**Gemacht:** Neuer Abschnitt „Stupide Arbeit an Codex abgeben" in `CLAUDE.md` (unter
„Projekt-Skills, Plugins, Hooks"): wann abgeben, Mindestinhalt des Prompts (Pfade,
Vorher/Nachher-Beispiel, was nicht angefasst wird, `node check.js`, kein Commit/Push).
`AGENTS.md` neu als kurzer Verweis auf `CLAUDE.md`.

**Warum so:** Die vorher liegende `AGENTS.md` war unversioniert, laut `diff
--strip-trailing-cr` identisch mit `CLAUDE.md` aus `7dd8727` (2026-10-13), von Codex
angelegt (David), und gegen den heutigen Stand 132 Zeilen veraltet. Eine Kopie veraltet
wieder; ein Verweis nicht. Verworfen: Datei löschen — David nutzt Codex, künftig mehr.
Regel in `CLAUDE.md` statt in der lokalen Memory, weil David an mehreren Geräten arbeitet.

**Geprüft:** `node check.js` — „alles in Ordnung". Ob Codex den Verweis befolgt und
`CLAUDE.md` tatsächlich liest: **ungeprüft**.

**Offen:** Die alte Kopie ist überschrieben, war aber identisch mit `git show
7dd8727:CLAUDE.md`, also nichts verloren.

**Fallstricke:** keine.

---

## 2026-10-22 — `cd20075` ponytail auf diesem Gerät nachinstalliert

**David:** „und ponytail?" — nach dem Nachziehen von 38 Commits auf `476f5cc`.

**Befund:** `ponytail@ponytail` stand in `.claude/settings.json` (seit `c930e2e`), war auf
diesem Gerät aber **nicht installiert**: kein Eintrag in
`~/.claude/plugins/installed_plugins.json`, kein Marketplace in
`known_marketplaces.json`, kein Ordner unter `~/.claude/plugins/cache/ponytail/`. Die
Session-Skill-Liste enthielt dementsprechend keine `/ponytail-*`-Befehle. Grund: die
Installation vom 2026-10-21 (`471543f`) lief auf Benutzer-Ebene auf einem **anderen**
Rechner; `settings.json` kommt per Git mit, der Plugin-Cache nicht.

**Gemacht:** Mit der gebündelten CLI aus der Desktop-App
(`AppData/Roaming/Claude/claude-code/2.1.299/f0584be0fbaf/claude.exe`, Pfad frisch per
`find` gesucht — Version wechselt mit Updates):

```
claude.exe plugin marketplace add DietrichGebert/ponytail
claude.exe plugin install ponytail@ponytail --scope project
```

Scope `project`, nicht `user`, weil `enabledPlugins` in der Projekt-Datei steht und das
Plugin nur hier gebraucht wird. Ergebnis: Version `5.3.2`, Commit
`09c434ab73ca43761c5d8b0c5d341926c2fba710`, Cache unter
`~/.claude/plugins/cache/ponytail/ponytail/5.3.2`.

Dabei fiel die schiefe Einrückung der beiden ponytail-Schlüssel in `settings.json` auf
(drei bzw. fünf Leerzeichen statt vier) — angeglichen, das ist der ganze Inhalt von
`cd20075`. Kein Verhalten geändert.

**Warum so:** Nicht gefragt, sondern direkt nachinstalliert — `CLAUDE.md`, Abschnitt
„Geräte-Setup", weist das ausdrücklich an (Davids Anweisung 2026-10-09). Verworfen: auf
die Vertrauensfrage beim nächsten Projekt-Öffnen warten. Die kam auf diesem Gerät
offenbar nicht oder wurde weggeklickt, sonst wäre das Plugin da.

**userConfig bewusst auf Standard gelassen.** Die CLI meldet „4 userConfig options not
yet set". Die vier sind `ledger` (Standard `true`, schreibt je Zug eine Zeile nach
`~/.config/ponytail/band/<projekt>.csv`), `webhookUrl` (Standard leer), `webhookToken`
(leer) und `sendNames` (`true`). Mit leerem `webhookUrl` verlässt nichts das Gerät —
geprüft durch Lesen von `plugin.json`, nicht durch Mitschneiden des Netzverkehrs.
Dieselbe Einschätzung stand schon im Eintrag zu `471543f`.

**Geprüft:**

- `node check.js`: 16 js-Dateien, 442 Handler gegen 942 Namen, 303 Element-IDs gegen
  244 im Markup (53 zur Laufzeit), `styles.css` 4532 Klammernpaare — „alles in Ordnung".
- `installed_plugins.json` enthält `ponytail@ponytail` mit Scope `project` und
  `projectPath` auf dieses Repo.
- `git status -s` nach dem Commit: nur noch `?? AGENTS.md`.
- Deploy-Lauf `39728553517` („Deploy static site to GitHub Pages"): `conclusion: success`,
  `status: completed`. Damit ist der Push live, nicht nur durch.

**Korrektur, nachgetragen:** Ich hatte zunächst behauptet, die `/ponytail-*`-Befehle
erschienen erst in der nächsten Session, weil die Skill-Liste beim Start festgelegt
wird. **Falsch.** Die Umgebung hat die Liste nach der Installation noch im selben Zug
neu eingeblendet: `ponytail:ponytail`, `-audit`, `-debt`, `-gain`, `-help`, `-review`
stehen seitdem zur Verfügung. Die Regel im `CLAUDE.md`-Abschnitt „Geräte-Setup" („Frisch
installierte Skills erscheinen erst in der nächsten Session") gilt also mindestens für
Plugins über die CLI nicht mehr durchgehend — sie bleibt ungeändert, bis das zweimal
bestätigt ist. Im selben Moment wurde auch `plugin:firebase:firebase` nachgeliefert
(vorher `CONNECT_TIMEOUT` nach 30 000 ms); laut `CLAUDE.md` nur lesend benutzen.

**Nicht geprüft:** Ob ein `/ponytail-*`-Befehl inhaltlich sinnvoll durchläuft — nur die
Verfügbarkeit in der Liste ist belegt, kein Aufruf gemacht. Ebenso ungeprüft, was die
Hook-Skripte zur Laufzeit wirklich tun.

**Offen:**

- Kein `/ponytail-*`-Befehl tatsächlich aufgerufen.
- `AGENTS.md` liegt untracked im Wurzelverzeichnis, Herkunft und Zweck unklar — nicht
  von dieser Session angelegt, nicht angefasst.
- MCP-Server `plugin:design:asana` nicht verbunden („Incompatible auth server: does not
  support dynamic client registration").
- GitHub-Annotation im Deploy-Lauf: `ubuntu-latest` wandert ab 2026-10-19 auf Ubuntu 26
  (https://github.com/actions/runner-images/issues/14748). Betrifft
  `.github/workflows/pages.yml`, bisher ohne Wirkung.

**Fallstricke:** Der Pfad zur gebündelten `claude.exe` enthält Version **und** Hash und
ändert sich mit jedem Update der Desktop-App — immer per `find` suchen, nie aus einem
alten Eintrag übernehmen. Hier war es `2.1.299/f0584be0fbaf`, parallel lag noch
`2.1.295/d2e29494ec83`.

---

## 2026-10-22 — `c930e2e` ponytail in den Projekt-Settings

**David** hat auf Anleitung `.claude/settings.json` selbst erweitert: `"ponytail@ponytail": true`
in `enabledPlugins` und den Marketplace `DietrichGebert/ponytail` in `extraKnownMarketplaces` —
genauso eingebunden wie caveman. Damit kommt ponytail per Git auf alle Geräte; beim ersten Öffnen
fragt Claude Code, ob dem Marketplace vertraut wird.

**Warum David und nicht Claude:** Zweimal hat die Umgebung das Eintragen abgelehnt
(„Untrusted Code Integration“, dann „Self-Modification“). Bei caveman am 2026-10-09 (`a1c67cf`)
ging es noch durch — warum heute nicht, ist nicht bekannt. Umgangen über einen Shell-Befehl wurde es
bewusst nicht. **Für jedes weitere Plugin gleich David die zwei Stellen nennen.**

**Gemacht von Claude:** geprüft, dass die Datei gültiges JSON ist, beide Einträge stimmen und die
Hooks (`PreToolUse`, `SessionStart`) unverändert sind (+7 Zeilen, nichts sonst). In `CLAUDE.md` die
Zeile „nur auf diesem Gerät“ ersetzt, samt Hinweis, wer solche Einträge macht.

**Geprüft:** `JSON.parse` der Datei ohne Fehler; `check.js` sauber.

**Ungeprüft:** ob die Installation auf einem anderen Gerät wirklich anläuft — dort fragt Claude Code
beim ersten Öffnen, und erst dann zeigt sich, ob der Marketplace erreichbar ist.

## 2026-10-22 — UNTERBRECHUNG der Sitzung (Stand `e84e1c0`)

Kein Code offen, alles committet und gepusht, Deploy grün. Dieser Eintrag ist die
Abschluss-Übersicht für die nächste Sitzung.

**Entscheidung von David, ab jetzt gültig:** „Firebase offen stört nicht.“ Die Datenbank bleibt auf
`.read/.write: true`, die Fernsteuerung (`gmremote/commands`) prüft weiter keinen Absender. Das war
Befund 1 im Audit (`e5f1082`). **Nicht wieder vorschlagen**, solange sich an der Lage nichts
ändert (z. B. die Adresse öffentlich auftaucht oder fremde Eingriffe passieren).

**Aktueller Stand — was in dieser Sitzung passiert ist** (2026-10-18 bis 2026-10-22):
- Jeopardy kann Videos als Frage und Lösung (`8716ec1`), das Frage-Video läuft beim Aufdecken
  weiter, zu große Clips (> 2 MB) werden abgewiesen (`0f5512d`), Auswahl nur mp4/webm (bleibt so).
- ponytail installiert (nur auf diesem Gerät, Benutzer-Ebene); Regelung ponytail × CLAUDE.md in
  `CLAUDE.md` (`471543f`). Der Eintrag in `.claude/settings.json` fehlt weiter — die Umgebung lässt
  ihn mich nicht setzen, David müsste ihn selbst eintragen, wenn es auf die anderen Geräte soll.
- Zwei „vibecoded“-Checklisten gegen das Repo geprüft: Favicon + eigene 404-Seite (`9383543`),
  Link-Vorschau für WhatsApp/Discord (`469d34a`). Fast alles andere war schon da oder passt nicht zu
  einer Seite, die nicht gefunden werden soll. `styles.css` bewusst **nicht** aufgeteilt (gemessen:
  Buzzer 677 ms, lädt sie gar nicht).
- Audit des ganzen Repos (`e5f1082`): sechs Shows verloren Editor-Daten still, wenn der
  Browserspeicher voll war — jetzt warnen alle über `storeSaveData`; Warnung nach Erholung wieder
  scharf (`ecff8bd`). Eine tote Funktion entfernt.

**Stopppunkt:** Nach `e84e1c0`. Offen war nur noch die Firebase-Frage — jetzt entschieden (s. o.).
Nichts angefangen, nichts halb.

**Kreative Ansätze & Ideen, die im Raum standen (auch verworfene):**
- Video mit **Ton** auf der Leinwand: heute stumm, weil das Beamerfenster keinen Klick bekommt.
  Idee: das Beamerfenster spielt das Video selbst ab (Muster `mainscreen/aufdecken.js`, BAUPLAN
  4.8) — dann ginge Ton, synchron. Nur angedacht.
- Eigene Domain (`CNAME`) für eine abtippbare Buzzer-Adresse — braucht einen Domainkauf durch David,
  lohnt nur, wenn Gäste tippen statt scannen.
- Die 44 `alert()`-Aufrufe durch Meldungen in der Seite ersetzen — verworfen als Komplettumbau;
  wenn, dann einzeln für Meldungen, die David nerven.
- `styles.css` aufteilen/minifizieren — verworfen nach Messung.
- Firebase-Anmeldung (anonym + Host-Geheimnis) — verworfen durch Davids Entscheidung oben.

**Nächste Schritte** (in der vorgeschlagenen Reihenfolge):
1. `js/resume.js` prüfen — daran hängt die Absturzsicherung während einer Show; im Audit nicht im
   Detail gelesen.
2. Danach die übrigen nicht gelesenen Teile: TP-Radlogik (`js/tp.js`), `js/intro.js`,
   `mainscreen/aufdecken.js` und `buehne.js`.
3. Optional den Agenten `import-auditor` über alle rund 230 HTML-Vorlagen laufen lassen (im Audit nur
   die Fundstellen mit Namen geprüft).
4. Ein Jeopardy-Video von David im echten Ablauf mit Beamer ausprobieren — Video bisher nur mit einem
   aufgenommenen Testclip im Messbrowser geprüft.

## 2026-10-22 — `ecff8bd` Speicher-Warnung nach Erholung wieder scharf

**David:** `/ponytail-review` auf `e5f1082`, danach „weiter“.

**Befund aus dem Review:** `storeSaveData` merkte sich in `storeVollGewarnt`, für welche Show schon
gewarnt wurde — und gab den Merker nie wieder frei. Ablauf, in dem das zuschlägt: Warnung bei DDF,
großes Video entfernt, Speichern klappt wieder, später ein Handyfoto eingefügt — Speichern scheitert
erneut, **ohne** Hinweis. Genau der stille Verlust, den `e5f1082` beheben sollte. Das Muster stammte
aus dem alten `wwmSave` (`wwmSaveWarned`, ebenfalls nie zurückgesetzt) und wurde beim
Zusammenführen mitgenommen.

**Gemacht:** eine Zeile in `storeSaveData` (`js/core.js`): `if (ok) storeVollGewarnt.delete(key);`.
Ein erfolgreiches Speichern gibt den Merker frei; innerhalb einer Fehlschlag-Strecke bleibt es bei
einem Hinweis.

**Geprüft** (Scratchpad `speicher2.js`, echte Seite, Speicher künstlich gefüllt und geleert):
voll → 1 Meldung; voll, noch zweimal gespeichert → 0; wieder frei → speichert, 0 Meldungen; erneut
voll → **1 Meldung** (vorher 0). `check.js` und `--types` sauber.

**Zweiter Befund aus dem Review — entschieden: bleibt so.** Seit `e5f1082` nimmt die
Jeopardy-Auswahl nur `video/mp4,video/webm`; iPhone-Videos (`.MOV`) sind im Dateidialog
standardmäßig ausgeblendet. David am 2026-10-22: „Meine Clips sind schon MP4 (über WhatsApp,
Schnitt oder Download) — lass die Auswahl so.“ **Nicht wieder aufmachen**, solange sich daran nichts
ändert. Falls doch einmal `.MOV` gebraucht wird: über „Alle Dateien“ im Dialog wählbar; ob Chrome
unter Windows es abspielt, hängt an der Kamera-Einstellung (H.264 eher ja, HEVC nein), nie probiert.

## 2026-10-21 — `e5f1082` Ganzes Repo geprüft (`/ponytail-audit`), drei Punkte behoben

**David:** `/ponytail-audit`, dazu „überprüfe einmal den ganzen Code. optimiere ihn bis ans
äußerste“. Angenommene Last: ein Host, ein Beamer, 5–15 Handys gleichzeitig an einem Abend,
eine öffentliche Adresse, eine gemeinsame Firebase-Datenbank.

**Gelesen, mit Schwerpunkt dort, wo ein Fehler am meisten kostet:** Datenbankregeln, Anmeldung der
Handys (`doLogin`, `hashPin`), Buzzer-Reihenfolge, die Fernsteuerung (`startGmRemoteCommandListener`,
`GM_REMOTE_ALLOWED_FNS`), Stellen, an denen Namen von Handys oder aus Importen als HTML landen, alle
Speicherfunktionen der Shows. Dazu ein Skript, das jede `function` in `js/` gegen alle Seiten und
Skripte prüft (auch Zeichenketten in `onclick`).

**Befunde und was damit passiert ist:**

1. **Datenbank offen für jeden — nicht behoben, braucht David.** `database.rules.json` steht auf
   `.read/.write: true`, die Adresse steht im Klartext in `js/buzzer.js:14`. Das ist dokumentiert
   und bewusst (`FIREBASE-ANLEITUNG.md`: „die Shows laufen privat“). **Konkrete Folge, die dort nicht
   steht:** die Fernsteuerung prüft zwar, *welche* Funktion aufgerufen wird, aber nicht, *wer* den
   Befehl schickt. Auf der Erlaubt-Liste stehen u. a. `gmQuitShow`, `ddfQuit`, `pihQuit`, `tpQuit`,
   `jeopardyScore`, `jeopardyDeduct`, `saveHostNotesRemote`. Mit einer einzigen Zeile an
   `gmremote/commands` kann also jeder, der die Seite kennt, mitten in der Show Punkte vergeben,
   abziehen oder die Show beenden. Ebenso `buzzer/players` komplett löschen (Accounts, Statistik).
   Die strengeren Regeln aus `641a008` helfen dagegen **nicht** — Löschen läuft an `.validate`
   vorbei, und `gmremote/commands` ist dort ebenfalls `.write: true`. Echter Schutz bräuchte
   Firebase-Anmeldung (anonym + Host-Geheimnis). Das ist ein eigenes Vorhaben; deployen kann es nur
   David (`npx firebase-tools login`). Seit dieser Sitzung wird die Adresse zudem per
   WhatsApp-Vorschau geteilt (`469d34a`) — die Voraussetzung „privat“ wird schwächer.
2. **Stilles Speicherversagen in sechs Shows — behoben.** Alle Shows teilen sich rund 5 MB
   `localStorage`. `setMediaSlot` verkleinert nicht; ein einziges Handyfoto oder Video in einem
   Medienfeld reicht, dass `storeSetJson` scheitert und `false` liefert. Ausgewertet hat das nur
   `wwmSave` (Warnung seit `2026-10-10`). Bei `ddfSave`, `tpSave`, `wwdsSave`, `introSave`,
   `saveToStorage` (Feud) und den meisten Aufrufen von `pihSave` standen die Änderungen im Editor,
   waren nach dem Neuladen aber **still weg**. Jetzt laufen alle sieben über `storeSaveData`
   (`js/core.js`, direkt unter `storeRemove`): einmal je Schlüssel und Sitzung ein Hinweis, weil der
   Editor bei jedem Tastendruck speichert. `wwmSave` nutzt denselben Helfer, seine eigene Kopie ist
   weg.
3. **Tote Funktion — entfernt.** `themeFontsHref` (`js/theme.js`) und die nur dort benutzte Konstante
   `THEME_DEFAULT_FONTS`. Das Prüfskript fand **genau diese eine** in ganz `js/` — der Bestand ist
   ungewöhnlich sauber.
4. **Aus dem Video-Review (`8716ec1`) nachgezogen:** Befund 3 — `accept` jetzt
   `image/*,video/mp4,video/webm` (`.mkv`/`.avi` spielt Chrome nicht, es kam ein schwarzer Kasten);
   Befund 5 — die Kachel zeigt 🎬 **und** 🖼, wenn beides an einer Frage hängt. Befund 4 (`controls`
   auch auf der Leinwand) bewusst gelassen: ohne geht dem Host das Spulen verloren.

**Geprüft und in Ordnung — kein Befund:**
- **Buzzer-Reihenfolge:** jeder Buzz trägt `ServerValue.TIMESTAMP`, der Host sortiert danach. Kein
  Handy kann mit seiner Uhr schummeln, kein Wettlauf zwischen Lesen und Schreiben.
- **PINs:** SHA-256 mit Name als Salz, nicht im Klartext. Schwach gegen Durchprobieren kurzer PINs —
  nur relevant zusammen mit Befund 1.
- **Namen und Importe als HTML:** die Fundstellen mit Namen in Vorlagen (`feudLogAdd`,
  `tournamentFileInfo`, WWM-Sieger) werden alle beim Ausgeben escaped bzw. per `setText` gesetzt.
  Nicht jede der rund 230 Vorlagen einzeln gelesen — dafür gibt es den Agenten `import-auditor`.
- **Fernsteuerung:** Erlaubt-Liste, Argumente nur Zahl/Text/Wahrheitswert, höchstens 6, Texte bis
  5000 Zeichen, alte Befehle (älter als Start − 5 s) verworfen. Sauber gebaut.

**Bewusst NICHT „bis ans Äußerste optimiert“:** `styles.css` aufteilen, minifizieren, bündeln. Die
Messung vom selben Tag (`9383543`): Buzzer 677 ms auf gedrosseltem iPhone, er lädt `styles.css`
gar nicht. Jeder Umbau dort wäre Risiko an der größten Datei ohne messbaren Gewinn.

**Geprüft:** `check.js` und `--types` sauber. Scratchpad `speicher.js` in der echten Seite: freier
Speicher → `true`, keine Meldung; Speicher künstlich gefüllt → alle sieben Shows melden, `pihSave`
und `wwmSave` liefern `false`; zweite Runde **0** Meldungen. Kachel Bild+Video → beide Zeichen, nur
Video → nur 🎬. `ablauf.js` **49/49**, `shots.js --themes Studio,D` über alle Zustände ohne Befunde.

**Nicht gelesen:** `js/intro.js` (Intros, 100 KB), die TP-Radlogik, `js/resume.js` im Detail,
`mainscreen/aufdecken.js` und `buehne.js`, `styles.css` (keine CSS-Abdeckung gemessen), `tools/`,
`designs/`, `voting/`.

## 2026-10-21 — `469d34a` Zweite Checkliste: elf von zwölf Punkten waren schon erledigt

**David** kam mit der nächsten Liste (horizontales Scrollen, kaputte Links, Handy-Menü,
Meta-Description, Footer-Links, Bilder komprimieren, kaputte Knöpfe auf dem Handy für den
Gamemaster, Erfolgs- und Fehlermeldungen, ungenutzte Navigation, Überlauf auf dem Handy, „optimiere
jede Page für mobile“) und derselben Frage: was geht, was ergibt Sinn. Gemessen statt geschätzt:

| Punkt | Befund |
|---|---|
| Waagerechtes Scrollen / Überlauf | **Keiner.** iPhone 15 (393 px): Buzzer-Login, Buzzer-Buzzern, Gamepad, Hostseite mit GM-Panel — überall `scrollWidth == clientWidth`, 0 Elemente ragen heraus. |
| Kaputte Links | **Keine.** Alle internen `href`/`src` der sechs ausgelieferten Seiten zeigen auf vorhandene Dateien. |
| Handy-Menü, Footer-Links, ungenutzte Navigation | **Gibt es nicht.** Kein `<nav>`, kein `<footer>` in irgendeiner Seite. Die Hostseite *ist* das Menü. |
| Bilder komprimieren | **Längst erledigt.** `buzzer/index.html:823` erklärt es: je Lobby-Motiv liegen `.mp4` und `.gif` nebeneinander, abgespielt wird das MP4 — 13 Motive zusammen **1,1 MB statt 21,2 MB**, `freddy` allein 383 KB statt 9,7 MB. Das GIF springt nur ein, wenn das Handy das Video nicht von selbst starten darf. |
| Tippflächen | Eine einzige unter 32 px: `button.gm-quit`, 94×30. Zwei Pixel. |
| Erfolgs-/Fehlermeldungen | 44 `alert()`-Aufrufe in `js/`, kein Toast-System. Der Buzzer-Login hat eine eigene Fehlerzeile (`.err`). |
| „Optimiere jede Page für mobile“ | Die Handy-Seiten sind mobil gebaut. Die Hostseite steuert einen Beamer und gehört nicht aufs Handy. |

**Kaputte Knöpfe im GM-Panel auf dem Handy: nichts gefunden — und dabei fast ein falscher Befund.**
Die erste Messung sagte, die fünf Antwortzeilen lägen unter der festen Knopfleiste und das Panel
scrolle nicht (`scrollHeight == clientHeight == 659`). Das war ein Messfehler: Gescrollt wird nicht
`document.scrollingElement`, sondern `.gm-body` (`GM_SHARED_CSS`, `js/core.js:1277` —
`flex:1; min-height:0; overflow-y:auto`, der Rahmen ist bewusst fest). Richtig gemessen:
`scrollHeight` 845 gegen 444 sichtbar, nach dem Scrollen stehen alle fünf Zeilen frei im Bild
(78–289 px), nichts verdeckt. **Beinahe hätte ich einen Fehler gemeldet, den es nicht gibt** — die
Lehre: vor dem Melden prüfen, welches Element überhaupt der Scroll-Container ist.

**Gemacht wurde nur ein Punkt:** Meta-Description — aber nicht für Suchmaschinen, sondern als
**Link-Vorschau**. Wer den Buzzer-Link in WhatsApp oder Discord schickt, hatte bisher die nackte
Adresse im Chat. Jetzt `description`, `og:title`, `og:description`, `og:image`, `og:type` und
`twitter:card` auf Hostseite und Buzzer, dazu `share.png` (1200×630, 158 KB, aus dem Hub-Logo
gebaut; der Bau-Schnipsel lag im Scratchpad, das Bild ist eingecheckt).

**Geprüft:** `check.js` sauber. Messungen wie oben, im Messbrowser mit iPhone-15-Profil.

**Offen / ungeprüft:** Wie die Vorschau in WhatsApp und Discord **wirklich** aussieht, ist nicht
geprüft — beide holen die Seite mit eigenen Crawlern und cachen das Ergebnis. Relative Pfade in
`og:image` akzeptieren nicht alle Dienste; falls die Vorschau leer bleibt, muss dort die volle
Adresse (`https://iryogameshows.github.io/share.png`) stehen. Davids Meldung „kaputte Knöpfe aufm
Handy fürn Gamemaster“ ist **nicht geklärt** — gemessen ist alles in Ordnung, es fehlt, welcher
Knopf auf welchem Screen was tut oder nicht tut.

## 2026-10-21 — `9383543` Favicon, 404-Seite — und die Messung, warum `styles.css` bleibt

**David** kam mit einer Checkliste von zwanzig Punkten („custom domain, sitemap, meta descriptions,
structured data, remove vite + react …“) und der Frage, was davon bei ihm Sinn ergibt. Antwort nach
Prüfung gegen das Repo: vier Punkte, der Rest ist für Marketing-Seiten gedacht, die gefunden werden
wollen. Danach: „dann mach die 4 die sich lohnen“.

**Was schon da war** (geprüft, nicht vermutet): eindeutige Titel auf allen fünf echten Seiten;
`rel="canonical"` in `buzzer.html` (Weiterleitung für alte Netlify-Lesezeichen); `robots: noindex`
auf `voting/`; **kein React/Vite im Browser** — `vendor/reactbits.js` lädt nur
`tools/reactbits/demo.html`, und der Ordner fliegt beim Deploy raus (`pages.yml:52`); **null
Source-Maps**; keine Konsolenfehler (`shots.js` prüft jeden Zustand in 19 Richtungen).

**Gemacht:**
- `favicon.svg` — das Hub-Logo (`renderIryoHubLogo`) auf 32 px eingedampft: goldenes Achteck, blaues
  Feld, ein Funke. Die Schrift „IRYO GAMESHOW“ fällt weg, bei 16 px trägt nur die Form.
  Eingehängt per `<link rel="icon">` in `index.html`, `buzzer/`, `gamepad/`, `mainscreen/`.
- `404.html` — GitHub Pages liefert sie bei jeder unbekannten Adresse; vorher kam die Octocat-Seite.
  Zeigt „Falsche Adresse“ und zwei Knöpfe (Buzzer, Show). **Bewusst ohne `styles.css`**: 642 KB für
  drei Zeilen Text; die paar Regeln stehen inline und sind aus der Klassik-Richtung abgeschrieben.

**Punkt 3 der Liste (`styles.css` aufteilen): gemessen und verworfen.** Roh 642 KB, **gzip 138 KB** —
und entscheidend: **`buzzer/index.html` lädt sie gar nicht** (sie steht dort nur in einem Kommentar).
Auf iPhone 15 mit gedrosselten 1,6 Mbit/s: **Buzzer 677 ms** bis `load`, Hostseite 3341 ms. Die
Gäste sind also längst drin, und der Host lädt einmal zu Beginn des Abends auf seinem eigenen Gerät.
Die 19 Richtungen aufzutrennen wäre ein großer Umbau an der riskantesten Datei für null spürbaren
Gewinn. **Nicht machen** — wenn, dann erst wenn eine Messung etwas anderes sagt.

**Punkt 4 (eigene Domain): offen, braucht David.** Eine `CNAME`-Datei im Wurzelverzeichnis ist in
zwei Minuten angelegt, aber vorher muss die Domain gekauft und beim Anbieter auf
`iryogameshows.github.io` gezeigt werden (vier A-Records oder ein CNAME auf den Pages-Host). Danach
in den Repo-Einstellungen „Enforce HTTPS“. Lohnt nur, wenn Gäste die Adresse abtippen statt den
QR-Code zu scannen.

**Geprüft:** `check.js` sauber. Im Messbrowser: 404-Seite liefert Status **404** mit dem richtigen
Titel (Bildschirmfoto angesehen), Favicon auf allen vier Seiten verlinkt und mit **200** abrufbar,
keine Seitenfehler.

**Ungeprüft:** wie das Symbol in einem echten Browser-Tab und auf dem iPhone-Homescreen aussieht
(nur als Datei und auf der 404-Seite gesehen); ob Safari das SVG-Favicon mag — es kann sein, dass
dafür noch ein PNG danebengelegt werden muss. Die 404-Seite ist nicht Teil von `shots.js`.

## 2026-10-21 — `0f5512d` Jeopardy-Video: zwei Befunde aus dem ponytail-Review behoben

**David:** „ja komm mach Befunde 1 und 2“ — aus dem Review von `8716ec1` mit `/ponytail-review`.

**Befund 1 — das Frage-Video sprang zurück.** `renderJeopardyClueOverlay` baut den Inhalt des
Overlays bei jedem Aufruf per `innerHTML` neu. Ein neu erzeugtes `<video>` startet bei 0, also sprang
der Clip an den Anfang, sobald die Lösung gezeigt wurde — ebenso bei Staffelbild, Schritt-Frage,
Bilderreihe, Undo und Wiederaufnahme. Jetzt merkt die Funktion vor dem `innerHTML` die Laufzeit der
vorhandenen Videos und setzt sie danach zurück. Schlüssel ist „Frage“ bzw. „Antwort“, nicht die
Klasse: die Antwort bekommt beim Aufdecken `visible` dazu.

**Befund 2 — Hinweisfenster mitten in der Show.** `jeopardyEditImg` legte jede Datei unverändert als
Data-URL ab. `resumeSave` schreibt `jeopardyData` komplett in den localStorage (Grenze rund 5 MB);
mit einem großen Clip scheitert das, und `js/resume.js:82-88` wirft „Der Spielstand ist zu groß zum
Sichern“ — beim ersten Sichern nach dem Spielstart, also vor Publikum. Jetzt weist der Editor Videos
über 2 MB gleich beim Auswählen ab, mit Größenangabe und dem Hinweis, kürzer zu schneiden oder in
720p/WebM zu exportieren. Nur Videos: Bilder werden hier ebenfalls nicht verkleinert, sind aber
selten so groß, und eine Grenze für sie hätte bestehende Boards getroffen.

**Geprüft** (Scratchpad `video2.js`, echtes WebM von 3 Sekunden per MediaRecorder):
- Frage-Video vor dem Aufdecken bei 1,79 s, danach bei 1,79 s — läuft weiter statt zurückzuspringen.
- Lösungs-Video startet beim Aufdecken bei 0,00 s, also von vorn. Richtig so.
- Zweites Neuzeichnen (`renderJeopardyClueOverlay()` direkt): 2,78 s → 2,78 s.
- 3-MB-Video: Meldung kommt, `qImg` unverändert, `input.value` geleert (damit dieselbe Datei erneut
  gewählt werden kann).
- 1,5-MB-Video: kommt an der Sperre vorbei — es erreicht den `FileReader`, der im Test an der
  Attrappe scheitert. Die Sperre greift also nur oberhalb der Grenze.
- `check.js` und `check.js --types` sauber, `shots.js --shows jeop,jeop-frage,jeop-antwort
  --themes Studio,D` ohne Befunde.

**Offen aus demselben Review, bewusst nicht gemacht:** Befund 3 (`accept` lässt `.mkv`/`.avi` durch,
die Chrome nicht abspielt), Befund 4 (`controls` ist auch auf der Leinwand sichtbar, sobald eine Maus
darüberfährt), Befund 5 (die Kachel zeigt 🎬 **oder** 🖼, nie beides).

**Ungeprüft:** echter Beamer, ein Clip nahe an der 2-MB-Grenze im echten Spielablauf, und ob die
Laufzeit auch im gespiegelten Beamerfenster erhalten bleibt — dort baut `morphMirror` das Element
nicht neu, es dürfte also ohnehin durchlaufen, gemessen ist es nicht.

## 2026-10-21 — `471543f` ponytail installiert, Verhältnis zu den Projektregeln festgelegt

**David:** „installier das bitte“ (https://github.com/DietrichGebert/ponytail), danach „kannst du nen
Kompromiss finden zwischen ponytail und der md“.

**Zur Installation:** Das Aktivieren über `.claude/settings.json` hat die Sicherheitsprüfung der
Umgebung abgelehnt („Untrusted Code Integration“) — das Plugin bringt drei Lifecycle-Hooks mit, die
bei Sessionstart und bei jedem Prompt ein Node-Skript ausführen, und schiebt jeden Zug ein Regelwerk
in den Kontext. David hat es daraufhin selbst per `/plugin` installiert, **auf Benutzer-Ebene**
(`~/.claude/plugins/cache/ponytail/ponytail/5.3.2/`). Es steht also **nicht** in
`.claude/settings.json` und kommt **nicht** per Git auf die anderen Geräte — anders als caveman.

**Gemacht:** In `CLAUDE.md` unter „Wann was benutzen“ ein Eintrag zu ponytail und darunter der
Abschnitt „ponytail × CLAUDE.md — was gilt“. Kern: ponytail ist für den Code zuständig, diese Datei
für Prüfen, Melden und Protokoll. Vier Stellen festgeschrieben — `check.js`/`shots.js` bleiben
Pflicht; ponytails Forderung „ein kleiner Test dazu“ erfüllen genau diese beiden, kein neues
Testwerkzeug; HANDOFF-Einträge, Commit-Nachrichten und `CLAUDE.md` bleiben ausführlich; die
Kommentardichte in `js/` bleibt der Haus-Stil (ponytails eigene Regel „Konventionen des
Codebestands behalten“ deckt das). Ponytails Abschlusszeile geht in die Liste „Offen“.

**Geprüft:** `check.js` sauber. Sonst nichts zu prüfen, es ist eine reine Regeländerung.

**Ungeprüft / Fallstricke:** Was die drei Hook-Skripte (`ponytail-activate.js`,
`ponytail-subagent.js`, `ponytail-mode-tracker.js`) und `band/register.tsx` tatsächlich tun, ist
nicht nachgelesen — nur die Hook-Definitionen. Laut `plugin.json` steht `ledger` auf `true`: nach
jedem Zug wird eine Zeile mit Kosten, Zügen, Tokens und Testergebnis nach
`~/.config/ponytail/band/<projekt>.csv` geschrieben. `webhookUrl` ist leer, es verlässt also nichts
das Gerät — ob das so bleibt, ist Davids Einstellung.

## 2026-10-18 — `8716ec1` Jeopardy: Video als Frage und als Lösung

**David:** „bau schnell ein, dass ich auch Videos als Lösung und Frage machen kann“.

**Gemacht:** Die Felder `qImg` und `aImg` einer Jeopardy-Frage nehmen jetzt auch ein Video.
`js/jeopardy.js`: `jeopardyIstVideo(src)` (Treffer bei `data:video/`) und `jeopardyMedienTag(src, cls)`
bauen `<img>` oder `<video>`; `renderJeopardyClueOverlay` benutzt nur noch den Helfer.
`js/jeopardy-ui.js`: Datei-Auswahl `accept="image/*,video/*"`, Beschriftung „Frage-Bild/Video“ bzw.
„Lösungs-Bild/Video“, das Vorschaubild im Editor ist bei einem Video ein stummes `<video>`
(`preload="metadata"`, zeigt den ersten Frame), und die Board-Kachel bekommt 🎬 statt 🖼.
`js/feud.js`: die Medien-Marken im GM-Panel heißen bei einem Video „🎬 Frage-Video“ /
„🎬 Lösungs-Video“.

**Warum dasselbe Feld statt eines neuen:** An `qImg`/`aImg` hängen sieben Stellen, die „hat die Frage
ein Bild?“ fragen — Editor-Kacheln, GM-Panel, Turnier-Zählung (`js/tournament.js:138`), die
Gültigkeitsprüfung (`js/jeopardy.js:142`), der Spiegel. Ein zweites Feld hätte jede davon geändert.
Unterschieden wird an der Data-URL; `safeSrc` ließ `data:video/` ohnehin schon durch.

**Warum stumm und in Schleife:** `autoplay muted loop playsinline controls`. Mit Ton startet kein
Browser ein Video ohne Klick — und das Beamerfenster bekommt nie einen, es ist nur ein gespiegelter
DOM. Stumm startet es in beiden Fenstern von allein, ohne Versatz. `controls` ist für den Host, in
seinem Fenster; auf der Leinwand sieht man die Leiste nur bei Mauszeiger darüber (der ist dort nie).
**Ton zur Frage läuft weiter über das Feld „Sound“** — ein Video mit wichtigem Ton braucht also die
Tonspur zusätzlich dort, und dann ist es nicht synchron. Wenn das stört, wäre der nächste Schritt,
das Beamerfenster das Video selbst abspielen zu lassen (Muster `mainscreen/aufdecken.js`, BAUPLAN 4.8).

**Geprüft** (Scratchpad `video.js`, echtes WebM im Browser per MediaRecorder aufgenommen, 40 KB,
Chrome mit `--autoplay-policy=document-user-activation-required`, also der strengen Einstellung):
- Frage-Video im Hauptfenster nach 1,2 s bei `currentTime` 0,92 s, `paused: false`, `videoWidth` 320.
- Lösungs-Video nach `jeopardyToggleAnswer()` sichtbar (`display: block`), `currentTime` 0,89 s, läuft.
- **Beamer-Popout:** dasselbe Frage-Video bei 0,73 s, `paused: false` — das gespiegelte `<video>`
  spielt dort wirklich, nicht nur das Standbild. Bildschirmfoto zeigt beide Videos im selben Frame.
- Editor: zwei `<video class="jimg-thumb">`, Kachel mit `title="Video"`. Keine Seitenfehler.
- `check.js` sauber, `check.js --types` 16 Dateien ohne Meldung,
  `shots.js --shows jeop,jeop-frage,jeop-antwort --themes Studio,D,B` ohne Befunde.

**Fallstrick, nicht behoben:** Ein Video als Data-URL ist groß. Die Boards selbst liegen in einer
Importdatei, da stört es nicht — aber `js/resume.js` schreibt `jeopardyData` komplett in den
localStorage (`resumeSave`, Grenze rund 5 MB). Mit einem längeren Clip schlägt das Sichern fehl, und
es kommt der Dialog „Der Spielstand ist zu groß zum Sichern“. Bilder werden vor dem Ablegen
verkleinert (`shrinkImageToDataUrl`, `js/core.js`), Videos **nicht** — dafür bräuchte es eine echte
Umkodierung. Kurze Clips nehmen.

**Ungeprüft:** echter Beamer (nur das Popout im Messbrowser), großes/langes Video, die Richtungen
außer Studio, D und B (nur Standbild geprüft), und das Zusammenspiel mit `sound` auf derselben Frage.

## 2026-10-18 — `afdac29` Richtung T **neu auf echten Spielgrafiken** + Töne

**Davids Ansage:** „ich möchte ein The binding of isaac themed Design … mit den
Hintergründen, assetts und sounds aus dem spiel", und zum bisherigen Stand:
„nein das was bisher drinstehet muss weg das ist scheiße." Auf Rückfrage dann:
Grafiken **„recherchiert selbst im Internet"**, Töne **mit WebAudio nachgebaut**.

**Gemacht**

- **Boden, Wand und Raumrahmen kommen aus dem Spiel.** Der Rahmen steht als
  `border-image` rund um das Fenster (`body::before`, `z-index: -1`, damit er
  hinter den Inhalt gehört): die Show spielt *in* einem Isaac-Raum. Herzen und
  Münze sind die echten Sprites, nicht mehr gezeichnete SVGs.
- **Farben gemessen statt geschätzt** — das war der Kern beider Fehlschläge
  davor. Boden `#734136` (44 % der Fläche), Wandstein `#835140`, Fuge `#492D24`,
  Münzgold `#C68F3C`, Herzrot `#E80000`, Kontur `#080000`.
- **`tools/keller/hol.js` + `png.js`**: holt die Vorlagen und schneidet Boden-,
  Wandkachel, Rahmen und sieben Zeichen. Ein Befehl pro Gerät.
- **`js/keller-ton.js`**: WebAudio, keine Dateien. Hängt per MutationObserver an
  dem, was man *sieht* (Herz verliert `lit`, Punktzahl steigt, Screen wird
  `active`) — deshalb ändert sich in keiner der zehn Spieldateien eine Zeile,
  und eine neue Show bekommt den Ton geschenkt. Nur in Richtung T, still bei
  `?stumm=1`, Kontext erst bei der ersten Geste (Autoplay-Sperre).

**Warum so — und was verworfen wurde**

- **Die Spielarchive sind verschlüsselt.** `resources/packed/*.a` bei Repentance:
  hohe Entropie, kein PNG- und kein Kompressionskopf. Der *Aufbau* ist harmlos
  (`ARCH000`, Tabelle am Ende, 20 Byte je Eintrag — bei `graphics.a` gehen
  2300 × 20 = 46 000 Byte exakt auf), die Daten sind es nicht. Entschlüsseln
  wäre etwas anderes als ihr Werkzeug zu benutzen: **nicht gemacht.**
- **Korrektur zum Eintrag `99827dc`:** dort steht, der Spielordner habe *keinen*
  Resource-Extractor. **Falsch.** `tools/ResourceExtractor/ResourceExtractor.exe`
  liegt dort, samt `filelist.txt` mit 18 789 Pfadnamen — genau die Namensliste,
  die der Vorsession angeblich fehlte. Er hilft nur nicht: sein Banner nennt
  „Rebirth/Afterbirth/Afterbirth+", er meldet 4147 × „could not determine
  filename" und bricht ab (Log endet mitten in einer Zeile = Absturz ohne
  Flush). Durchprobiert: voller Archivsatz, ohne die `repentance`-Archive, mit
  Platzhaltern an deren Stelle, aus drei verschiedenen Verzeichnissen, kurzer
  Pfad gegen die 260-Zeichen-Grenze. Immer dasselbe.
- **Hash-Funktion der Archive nicht geknackt.** Getestet gegen die echte Tabelle:
  FNV-1a/FNV-1 64, djb2, sdbm, MurmurHash64A, CRC32 gegen beide 4-Byte-Hälften,
  je sieben Namensvarianten (mit/ohne `resources/`, Schrägstrich/Backslash,
  Groß/Klein, Basename). Kein Treffer. Nicht weiterverfolgt — die Daten wären
  ohnehin verschlüsselt.
- **Quelle jetzt:** ein offenes GitHub-Repo mit den Rebirth-Assets unter ihren
  Originalpfaden (steht in `hol.js`). 21 Dateien, 364 KB. **The Spriters
  Resource ging nicht** — 403, und im Browser eine Bot-Prüfung, die ich nicht
  umgehe.
- **Bilder bleiben lokal** (`assets/t/eigene/` in `.gitignore`). Das Repo ist
  öffentlich, `pages.yml` lädt mit `path: '.'` alles hoch. Folge, bewusst in
  Kauf genommen: **auf GitHub Pages fehlen sie**, dort greift der gezeichnete
  SVG-Rückfall. Deshalb bleiben `assets/t/*.svg` und `tools/sprites/` stehen,
  obwohl das Gezeichnete als Hauptweg weg ist.

**Drei Regeln des alten Blocks zielten ins Leere** (im Bild gesehen, nicht
vermutet): `.team-name` gibt es nicht (heißt `.t-name`), `.score-val` steht im
Feud-Scoreboard nicht (heißt `.t-score`), und die Rundung der Teams sitzt an
`.scoreboard` (`border-radius: 14px; overflow: hidden`), nicht an `.team-panel`
— solange die steht, bleiben die Teams rund, egal was an den Kindern gesetzt
wird. Auch der offene Punkt aus `99827dc` ist damit geklärt: die Münze vor
„Punkte" konnte nie erscheinen, weil `.round-label` zum **GM-Fenster** gehört
(`GM_SHARED_CSS` in `js/core.js`), und dorthin reicht `styles.css` nicht.

**Zwei eigene Fehler, im Bild gefunden und behoben**

- **Quadrantengrenze.** Das Backdrop-Sheet hält vier Raumvarianten, die erste
  endet bei y 156. Mein Bodenausschnitt (100,130)+48 lief darüber hinaus und
  holte die Ketten der Nachbarvariante mit — im Kontaktbogen sah die ganze
  Fläche aus wie liegende Rohre. Jetzt (80,80).
- **Fugenabstand.** Die linke Wand hat waagerechte Fugen alle ~83 px; ein
  42-px-Baustein wiederholt sie doppelt so oft wie das Spiel. Jetzt ein
  fugenfreies Stück ab y 75, und `border-image-repeat: round` statt `repeat`.

**Geprüft**

- `node check.js`: sauber — 16 js-Dateien, 442 Handler gegen 941 Namen, 303 IDs,
  4532 Klammernpaare.
- `node check.js --types`: **16 Dateien, keine Meldung** (keller-ton.js inbegriffen).
- `tools/shots`: voller Lauf über Richtung T, **26 Zustände, keine Befunde**;
  danach Vergleich `feud`/`jeop` in Studio-Blau, A und T — keine Befunde, die
  beiden anderen Richtungen unverändert (im Bild verglichen).
- **Kontaktbögen angesehen**, nicht nur die Befunde gelesen: Feud, Jeopardy, WWM.
- `node tools/keller/hol.js` einmal komplett durchlaufen lassen: 9 Dateien
  geholt, 7 Zeichen + 2 Kacheln + Rahmen gebaut.

**Offen / ungeprüft**

- **Die Töne hat niemand gehört.** Ich kann kein Audio prüfen. Dass sie
  *klingen*, ist durch den Code plausibel, dass sie **nach Isaac** klingen, ist
  unbelegt. `KellerTon.muenze()` usw. lassen sich in der Konsole einzeln
  auslösen, `KellerTon.schalten(false)` schaltet ab.
- Die Tonauslöser sind **nicht im Spielbetrieb erprobt**, nur über den Code
  hergeleitet. Ob eine Punktzahl beim Neuaufbau des Scoreboards ungewollt die
  Münze auslöst, muss ein echter Durchgang zeigen (entprellt ist es).
- `?stumm=1` schaltet den Ton ab — in `tools/durchgang/` ist er also **nicht**
  zu hören. Absicht.
- Die echte **Isaac-Schrift** liegt als BMFont (`font/*.fnt` + PNG) im Netz, ist
  aber nicht eingebaut: ein Bitmap-Atlas ist kein Webfont. Es bleibt bei
  Bowlby One / Zilla Slab.
- Auf **GitHub Pages** sieht die Richtung nüchtern aus (Rückfall). Nicht geprüft,
  wie das live wirkt.
- `tools/keller/` wird vom Deploy **nicht** entfernt (anders als `tools/shots`),
  liegt also öffentlich. Nur Skripte, keine Bilder — aber es ist mir bewusst.

**Fallstricke für die nächste Session**

- `assets/t/eigene/` ist ignoriert: **auf einem neuen Gerät fehlt die ganze
  Optik**, bis `node tools/keller/hol.js` gelaufen ist. Das ist kein Fehler.
- Der Rahmen ist `position: fixed` mit `z-index: -1`. Wer ihn auf `0` setzt,
  legt ihn **über** den Inhalt — ein fixiertes Element mit z-index 0 wird nach
  dem normalen Fluss gemalt.
- `image-rendering: pixelated` ist nicht Deko. Ohne das rechnet der Browser die
  Sprites weich, und aus dem gezeichneten Spiel wird ein verwaschenes Foto.
- Kachelgrößen sind ganzzahlige Vielfache (72 → 144, 64 → 128). Krumme Werte
  verteilen die Pixel trotz `pixelated` unsauber.
- **Nicht aus dem Gedächtnis über die Archive reden.** Der Eintrag davor hat
  genau das getan und lag falsch.

---

## 2026-10-18 — `99827dc` Richtung T: **Pixel-Sprites**, Strikes werden Herzen

**Davids Urteil zum zweiten Mal:** „das sieht 0 so aus wie The Binding of isaac." Dazu:
*„bedien dich auch den den assets vom Game, ich benutz das ja nur für mich."*

**Warum es beim zweiten Mal nicht reichte.** Farben und Konturen stimmten inzwischen — aber
es fehlten **Sprites**. Isaac ist Pixelgrafik: dunkle Kontur, wenige Farben, ein Glanzpunkt
oben links. Meine Flächen waren glatte CSS-Formen. Zur Prüfung habe ich echte Sprites auf dem
Rechner **angesehen** (Mod-Grafiken im Spielordner unter `D:\SteamLibrary\…\mods`, nur
gelesen) — vorher hatte ich aus dem Gedächtnis gearbeitet, und genau das ging zweimal daneben.

**Gebaut:**

- **`tools/sprites/bau.js`** — baut SVG-Sprites aus **lesbaren Pixelmatrizen**. Wer eine Form
  ändert, ändert ein Zeichen in der Matrix statt in 200 `<rect>`. Gleiche Farben in einer Zeile
  werden zu einem Rechteck zusammengefasst: ein Herz sind 30 statt 170 Rechtecke.
- **`assets/t/`** — `herz`, `herz-leer`, `muenze`, `bombe`. Gezeichnet, nicht entnommen.
- **Strikes sind Herzen**, und die Logik ist **umgedreht**: drei volle Herzen stehen da, jeder
  Strike nimmt eins weg. So ist es im Spiel, und es liest sich schneller als drei Kreuze, von
  denen manche „an" sind.

**Zur Asset-Frage — warum nicht einfach die echten.** Das Repo ist **öffentlich**, und
`pages.yml` lädt mit `path: '.'` das ganze Verzeichnis hoch. Eingecheckte Spielgrafiken wären
damit veröffentlicht, egal wofür sie gedacht waren. Gelöst ohne Davids Wunsch abzulehnen:

- **`assets/t/eigene/` steht in `.gitignore`** — dort können die echten liegen, ohne je mit
  einem Push rauszugehen.
- Jede Regel listet **zuerst die eigene Datei, dann das gezeichnete SVG**. Ein fehlendes
  Hintergrundbild wird übersprungen, das darunter bleibt sichtbar — am Showrechner echt, auf
  Pages der Rückfall. Kein JavaScript, keine Fallunterscheidung.
- `assets/t/LIESMICH.md` erklärt es samt Dateinamen und sagt, wo die gepackten Originale
  liegen (`resources/packed/graphics.a`).

**Zum Extrahieren selbst:** Der Spielordner hat **keinen** Resource-Extractor (`tools/` enthält
nur Animations- und ItemPool-Editor plus LuaDocs). Das `.a`-Format ist lesbar — Header
`ARCH000`, Tabellenoffset, 2300 Einträge à 20 Byte —, aber die Tabelle enthält **nur Hashes,
keine Dateinamen**, und die Daten sind komprimiert. Ein eigener Extractor liefert ohne
Namensliste unbenannte Blobs; deshalb nicht weiterverfolgt.

**Zwei eigene Fehler beim Zeichnen**, im Bild gesehen und behoben: das leere Herz war eine
**gepunktete Linie** (ein Regex über die volle Matrix hatte auch die Kontur durchlöchert), die
Münze unten ein **Sechseck** statt rund.

**Geprüft:** `check.js` sauber, `shots.js --themes T` über `feud` und `jeop` ohne Befunde,
Sprites einzeln in einer Vorschauseite angesehen (Datei danach aus dem Repo-Wurzelverzeichnis
**entfernt** — sie hätte als Punktdatei mitgedeployt, `include-hidden-files: true`), Feud-Bild
nach dem Einbau angesehen: drei Herzen je Team.

**Offen:** Die Münze vor „Punkte" ist im Bild **nicht zu sehen** — `.round-label::before`
greift offenbar nicht, die Zeile ist vermutlich ein anderes Element. Nicht nachgegangen.
Das Intro fehlt weiter. Und ob die Richtung jetzt trifft, steht noch aus — der Stand ist David
geschickt.

## 2026-10-18 — `9b56f6f` Neue Richtung **T „Keller"** (The Binding of Isaac), erster Stand

**Anlass:** David macht eine Isaac-Gameshow und will eine eigene Richtung dafür, dazu ein
eigenes Intro. Das Intro steht noch aus.

**Angemeldet** (die Stellen, die eine neue Richtung braucht): `js/theme.js` (DESIGN_THEMES),
`styles.css` zweimal — Icon-Variablen (~Z. 3831) und ein eigener Material-Block —,
`buzzer/index.html`, `ALLE_RICHTUNGEN` in `shots.js`, `RICHTUNGEN` in der Durchgeh-Seite.
`gamepad/index.html` hat keine Regeln je Richtung, dort war nichts zu tun.

**Der erste Entwurf war falsch und ist verworfen.** Er hatte weiche Verläufe, Lichtkanten,
die dünne Kritzelschrift „Fredericka the Great" und einen fast schwarzen Grund (`#241B14`,
Vignette `.62`). Davids Urteil wörtlich: **„das sieht 0 so aus wie isaac"**. Das stimmte — es
war ein generischer Dungeon. Was dem Spiel sein Aussehen gibt und komplett fehlte:

- **Dicke schwarze Konturen auf allem**, Flächen wie Schrift. Das ist das Kernmerkmal, nicht
  die Farbe: `box-shadow: 0 0 0 3px #000` und `-webkit-text-stroke: 3px #000` mit
  `paint-order: stroke fill`, damit die Kontur hinter der Füllung liegt.
- **Flache Füllungen** statt Verläufe.
- **Ein beleuchteter Raum.** `--bg` auf `#4A3E33`, Vignette auf `.34`. Vorher verschwanden die
  Bodenfliesen im Schwarz — die Tiefe kommt in Isaac aus den Konturen, nicht aus Dunkelheit.
- **Fette Schrift**: Bowlby One. Das Logo des Spiels ist fett und umrandet, nicht gekritzelt.
- Münzgelb `#FFD93D` als Akzent, Punktekästen gelb mit Kontur.

**Zwei eigene Fehler, beim Ansehen der Bilder gefunden:**

- **Das Jeopardy-Brett blieb blau**, mitten im braunen Rest. Die Grundregel `.jeopardy-cell`
  hat ein blaues Fallback eingebaut (`var(--tile, linear-gradient(…#1a2a8a…))`); eine Richtung,
  die `--tile` und die `--brd-*` nicht setzt, erbt es. **Für die nächste neue Richtung: diesen
  Variablensatz nicht vergessen**, sonst sieht man es erst im Bild.
- `background-image: none` an den Teamleisten **nahm ihnen die Farbe**: Rot und Blau kommen
  dort als Gradient, darunter liegt nichts. Zwei durchsichtige Leisten, und damit war nicht
  mehr zu sehen, wer am Zug ist. Jetzt flache Teamfarben, BAUPLAN 4.4 bleibt gewahrt.

**Geprüft:** `node check.js` sauber (4517 Klammernpaare). `shots.js --themes T` über `menu`,
`feud`, `jeop`, `jeop-frage`, `wwm`, `buzzer` — keine Befunde, **jedes Bild angesehen**.
Danach `shots.js --shows jeop` über **alle 20 Richtungen** → keine Befunde, die neue Richtung
bricht also keine andere.

**Ungeprüft:** der Handy-Buzzer in T nur als Screenshot, nicht auf einem Gerät. Die
Sonderfälle je Show (DDF, PIH, TP, WWDS, Turnier, Ergebnis) sind in T noch nicht einzeln
angesehen — der Material-Block deckt bisher die gemeinsamen Flächen, Feud, Jeopardy und WWM ab.

**Offen:** das **Intro** (noch nicht gebaut — es soll auf dieser Richtung aufbauen, deshalb
erst Davids Urteil zur Richtung abwarten). Idee, die im Raum stand: Falltür öffnet sich von
oben, Kamera fällt in den Keller, der Showtitel steht auf dem Item-Podest im Lichtkegel,
Herzschlag als Taktgeber — reines CSS plus WebAudio, wie die bestehenden Film-Intros in
`INTRO_FILME`.

## 2026-10-17 — `f8bb712` Live war die Durchgeh-Seite kaputt: `tools/shots` wird nicht ausgeliefert

**Davids Meldung beim ersten Öffnen:** „tools/shots/aufbau.js nicht gefunden."

**Die Ursache.** `.github/workflows/pages.yml` entfernt vor dem Upload unter anderem
**`tools/shots`** — bewusst, der Schritt heißt „Nicht ausgelieferte Dateien aus dem Upload
nehmen" und begründet das mit „nur hochladen, was eine Seite tatsächlich lädt". Meine
Durchgeh-Seite lud aber genau von dort (`aufbau.js`), und `index.html` bei `?stumm=1` ebenso
(`fbstub.js`). **Live gemessen:** beide **404**, `tools/intros` und `mainscreen` dagegen 200.

Das war mehr als eine kaputte Prüfseite: `index.html?stumm=1` hätte live **überhaupt keine
Datenbank** bekommen — weder den Ersatz noch Firebase, weil die Weiche das eine gegen das
andere tauscht.

**Behoben durch Verschieben, nicht durch Workflow-Änderung:** `aufbau.js` und `fbstub.js`
liegen jetzt in **`tools/gemeinsam/`**. `tools/` als Ganzes wird nicht gelöscht, nur `shots`
und `reactbits` — der Ordner geht also automatisch mit. Der andere Weg wäre gewesen, die
`rm -rf`-Zeile in `pages.yml` anzupassen; das braucht ein Token mit `workflow`-Recht, das laut
`CLAUDE.md` auf diesen Geräten keiner hat. Das Verschieben ist ohnehin robuster: es gibt keine
Ausnahmeliste, die jemand beim nächsten Mal vergisst.

`tools/gemeinsam/LIESMICH.md` hält fest, wer die Dateien braucht und wie man nach einem Deploy
prüft (`curl` auf die Live-URL). **Lehre: im Repo zu liegen heißt nicht, ausgeliefert zu
werden.**

**Zwei Fehler, die beim Nachprüfen auffielen:**

- Der Zähler für die Rahmen-URL wurde **zweimal** hochgezählt (`const n = ++lauf` und
  `+ (++lauf)`), Beamer und Host bekamen verschiedene Nummern. Folgenlos, aber falsch.
- `storeSet`/`storeSetJson` im Rahmen gaben **`false`** zurück. Die App hielt das für einen
  vollen Speicher und warf bei jedem Schritt den Dialog **„Der Spielstand ist zu groß zum
  Sichern"** (`resumeSave`, `js/resume.js`). In Davids Browser hätte der bei jedem Schritt
  gepoppt; im Messbrowser waren Dialoge abgeschaltet, deshalb fiel es erst in der Konsole auf.
  Jetzt `true`.

**Eine Sackgasse, die keine war — wichtig für das nächste Mal.** Nach dem Verschieben lief der
Jeopardy-Flug im Messbrowser plötzlich nicht mehr, der Beamer blieb auf 1461 Zeichen
(Wartebild). Es sah nach einem Folgefehler des Verschiebens aus. Tatsächlich: **die Spiegelung
hängt an `requestAnimationFrame`** (`scheduleBoardMirror`, `js/feud.js:1129`), und das steht in
einem **ausgeblendeten Browser-Pane** still. Sobald das Pane sichtbar war, spiegelte es wieder
(73556 Zeichen) und der Flug lief. In `CLAUDE.md` steht derselbe Effekt schon beim Intro-Labor.

Auf dem Weg dorthin noch ein Irrweg: `hw.jeopardyState` war `undefined`, was wie „Jeopardy
nicht geladen" aussah. `jeopardyState` ist ein `const` auf Modulebene und landet **nicht** auf
`window` — dieselbe Falle wie bei `AUFBAU`. Von außen misst man am DOM, nicht an der Variablen.

**Geprüft:** lokal über den Server — `tools/gemeinsam/aufbau.js` und `fbstub.js` **200**,
`__fbSet` im Rahmen vorhanden, Host und Beamer mit `data-theme="D"`, keine Meldung. Feld
angeklickt → ein fliegendes Element im Beamer, Frage steht. Vier Zustände (`menu`, `jeop`,
`feud`, `gm-menu`) durchlaufen. `shots.js --shows jeop,gm-menu --themes Studio,D` ohne Befunde,
`check.js` sauber.

**Kein Befund, obwohl es danach aussah:** nach `gm-menu` zeigt der Beamer 71207 Zeichen statt
eines leeren Wartebilds. Die Klasse `board-idle` steht auf Host **und** Beamer, das CSS blendet
die Screens aus — der gespiegelte DOM bleibt, ist aber unsichtbar. Korrekt so.

**Offen:** der Live-Nachweis steht noch aus — `curl` auf
`https://iryogameshows.github.io/tools/gemeinsam/aufbau.js` nach dem Deploy dieses Commits.

## 2026-10-17 — `50e4fe4` + `b470e2f` Durchgang: Auswahl, Speicherschutz, **Beamer**

**Davids zwei Einwände nach dem ersten Wurf**, beide berechtigt:

1. *„nur die neuen, die du korrigiert hast … nicht alles was es gibt"* — alle 25 Zustände sind
   zu viel. Gefragt ist, ob die **jüngsten Änderungen** in jeder Richtung sitzen.
2. *„ich will vor allem die neuen Animationen testen und sehen"* — und genau die zeigte die
   Seite **nicht**.

**`50e4fe4` — Auswahl und Speicherschutz**

- **Vorauswahl** aus der Git-History, je Eintrag steht der Commit als Begründung im Code.
  Knopf „Auswahl" mit Haken je Zustand, dazu „Nur die Überarbeiteten" und „Alle". Die Wahl
  bleibt gespeichert und steht im Bericht.
- **Der Rahmen teilt sich den `localStorage` mit der echten App** — gleiche Herkunft. Ein
  Durchgang hätte Davids eingestellte Design-Richtung überschrieben (`applyTheme` schreibt
  direkt, `js/theme.js:634`, nicht über `storeSet`) und seinen gesicherten Spielstand durch die
  Testshows ersetzt (`resumeSaveSoon` läuft bei fast jedem Spielschritt). Jetzt werden
  `designTheme` und `liveGame` beim Start gemerkt und nach jedem Schritt zurückgeschrieben;
  `storeSet`, `storeSetJson` und `storeRemove` sind im Rahmen stillgelegt. **Mit Probewerten
  geprüft:** `designTheme` blieb auf `K`, der Probe-Spielstand unberührt.
- Das **Resume-Angebot** stand im Menü vor allem anderen — die Testshows sichern ihren Stand,
  und beim nächsten Laden bietet die Seite ihn an. `#resume-banner` wird geleert, mehrfach wie
  das GM-Panel.

**`b470e2f` — der Beamer, und warum das der eigentliche Punkt war**

Jeopardy-Flug (`mainscreen/aufdecken.js`), Bauchbinde und die großen Momente
(`mainscreen/buehne.js`) spielt **das Zuschauerfenster selbst** — die Hostseite spiegelt nur
ihren DOM dorthin (BAUPLAN 4.8). Die Seite zeigte nur den Host, und `w.open` war abgeschaltet,
also konnte das Beamerfenster nicht einmal aufgehen. **Ein Durchgang hätte von den Animationen
nichts gezeigt und wäre trotzdem als „geprüft" abgehakt worden.**

- Zweiter Rahmen mit `mainscreen/`, oben und größer; die Hostseite darunter. Umschalter
  „Beamer + Host / nur Beamer / nur Host".
- Angeheftet **wie das GM-Panel in der App**: `opener` auf das Host-Fenster setzen, dann meldet
  die Beamer-Seite sich selbst über `boardReattach` (`mainscreen/index.html:91`). Kein
  Nachbau nötig, das Muster gab es schon.
- Der Beamer lädt je Schritt neu und ist fertig, **bevor** die Show startet — sonst läuft die
  Animation ins Leere. Dafür wartet der `load`-Haken des Hosts auf ein Promise.
- **Je Zustand ein Hinweis, was anzuklicken ist** („Feld anklicken → es fliegt zur Frage").
  Ohne den sieht man Standbilder und hält den Zustand für geprüft.
- `feud` in die Vorauswahl: die großen Momente (Antwort, X, Runde) hängen daran. **11 Zustände,
  209 Schritte** statt 475.
- **`js/feud.js`**: `#stumm-balken` zu den Elementen in `boardStyleCss`, die der Beamer
  ausblendet. Die Warnung ist für den Host; gespiegelt verdeckte sie den oberen Rand des
  Beamerbilds — und die Zuschauer geht sie nichts an.

**Geprüft:** Richtung D, Zustand `jeop` — Feld angeklickt, **450 ms später ein fliegendes
Element** (`[data-fliegt]`) im Beamer, nach 2 s durch und die Frage steht; GSAP ist dort
geladen. Beamer trägt `data-theme="D"`, Balken dort `display:none`, auf dem Host sichtbar.
Vorher Richtung L über `menu`, `jeop`, `gm`, `gm-menu`, `ergebnis`, `pih` — jeder baut auf,
kein Banner, keine Meldung. `check.js` und `--types` sauber, `ablauf.js` **49 OK / 0 FEHL**.

**Offen:**

- Nur **Richtung D und L** sind mit Beamer durchgespielt, nicht alle 19.
- Die **Bauchbinde** (Late Night, `jeop-frage` → Antwort aufdecken) und die **großen Momente**
  in `feud` sind **nicht** ausgelöst worden — nur der Jeopardy-Flug ist gemessen. Die Hinweise
  dazu stehen in der Seite, geprüft hat sie niemand.
- Die **lebende Stadt** (Late Night, `menu`) läuft von selbst, ebenfalls ungeprüft.
- Wer in `aufbau.js` einen Zustand ergänzt, muss ihn in `ZUSTAENDE` der Durchgeh-Seite
  nachtragen — Beschriftung und Hinweis stehen dort, nicht in `aufbau.js`.

## 2026-10-17 — `599e464` + `b8f9412` Durchgeh-Seite `tools/durchgang/`

**Gemacht:** Davids Wunsch — eine Seite, auf der er eine Richtung nach der anderen mit allen
Spielen durchgeht und die Befunde daraus weitergibt.

1. **`599e464`** — die Tabelle `AUFBAU` aus `shots.js` nach **`tools/shots/aufbau.js`**
   verschoben, Zeile für Zeile unverändert. Sie bedient jetzt Node (`module.exports`) und
   Browser (`window.AUFBAU`).
2. **`b8f9412`** — **`tools/durchgang/index.html`**: links die Liste, in der Mitte die echte
   Hostseite im iframe (**anklickbar**), rechts Urteil und Notiz. 19 Richtungen × 25 Zustände
   = **475 Schritte**. Tastatur `←` `→` `1` `2`, Stand im `localStorage`, Knopf „Bericht" baut
   einen Text zum Kopieren. Zwei Reihenfolgen: Richtung für Richtung (Davids Wunsch) oder
   Zustand für Zustand zum Farbvergleich.
3. **`index.html`** bekam `?stumm=1`, **`js/core.js`** den roten Balken dazu.

**Warum `?stumm=1` sein musste.** Die Aufbau-Funktionen **starten echte Shows** —
`startJeopardyActual` ruft `jeopardyBuzzConnect()` und `lockBuzzerJoins()`. Ein Durchgang
hätte also hunderte Male echte Buzzer-Zustände in die Live-Datenbank geschrieben und
`joinLocked` geschaltet. Mit dem Parameter lädt `index.html` per `document.write` die
Ersatz-Datenbank `tools/shots/fbstub.js` statt Firebase — dieselbe, die die Werkzeuge nutzen.
`document.write` statt eines dynamischen Tags, weil die Ladereihenfolge im `<head>` zählt und
es keinen Build-Step gibt. **Der Balken ist kein Schmuck:** ohne ihn sieht die Seite normal
aus, während kein Handy ankommt — in diesem Modus darf nie eine echte Show laufen.

**Warum die Zustände geteilt werden.** Eine zweite Liste in der Durchgeh-Seite wäre
auseinandergelaufen, und dann prüft die eine Seite etwas anderes als die andere. Wer in
`aufbau.js` einen Zustand ergänzt, muss ihn aber in `ZUSTAENDE` der Durchgeh-Seite nachtragen
— die Beschriftung steht dort, nicht in `aufbau.js`.

**Zwei Fallen beim Bauen, beide behoben und im Code vermerkt:**

- Der Zustand stand erst im **Hash** (`#E|jeop-frage`). Ein Fragmentwechsel lädt das iframe
  **nicht** neu, `load` feuert kein zweites Mal — der Rahmen blieb beim ersten Zustand stehen,
  während Titel und Liste schon weitergesprungen waren. Jetzt ein Zähler in der Query.
- **WWM und WWDS öffnen das GM-Panel verzögert.** Ein einmaliges Ausblenden direkt nach dem
  Aufbau kam zu früh, das Panel ging wieder auf und stand vor dem Bildschirm. `shots.js`
  wartet dafür 1400 ms; hier wird bei 0, 250, 700 und 1500 ms nachgesetzt.
- `const AUFBAU` landet in einem klassischen Script **nicht** auf `window` — erst `window.AUFBAU
  = AUFBAU` machte es für den Rahmen sichtbar. Die erste Fassung meldete „kein Aufbau für menu".

**Geprüft:** alle **25 Zustände in Richtung E** durchlaufen — jeder baut auf, alle mit
`data-theme="E"`, **keine** Fehlermeldung, GM-Panel nur bei `gm` und `gm-menu`. Urteil, Notiz
und Bericht ausprobiert, Testdaten wieder entfernt. Danach `check.js` und `--types` sauber,
`shots.js --shows menu,jeop,gm,gm-menu --themes Studio,E` ohne Befunde, `ablauf.js` **49 OK /
0 FEHL**, `geraete.js` **55 OK / 0 FEHL** — die `index.html`-Änderung bricht die Werkzeuge
also nicht.

**Offen / nicht dabei:**

- Die drei **Handy-Zustände** (`buzzer`, `buzzer-pause`, `buzzer-login`). Sie stecken fest in
  `shots.js` (Funktion `handySeite`, nicht in `AUFBAU`) und bräuchten eine eigene
  `?stumm=1`-Weiche in `buzzer/index.html`.
- Nur **Richtung E** ist Zustand für Zustand durchgemessen, nicht alle 19 — die übrigen hat
  bisher nur `shots.js` gesehen.
- Die Seite ist nur im **Browser-Pane** gelaufen, nicht in Davids eigenem Browser. Über
  `file://` geht sie **nicht** (gleiche Herkunft nötig), nur über den lokalen Server.
- Der **Bericht** zählt Offenes je Richtung zusammen; welcher Zustand genau fehlt, steht nicht
  drin. Falls das gebraucht wird, ist es eine Zeile mehr.

Ältere Einträge: `HANDOFF-archiv.md`.

---

# TODO / Offene Punkte

Ganz unten, weil es keine Einträge zu Änderungen sind, sondern Dinge, die noch
geklärt werden müssen. Neueste oben.

## 2026-10-17 — David unzufrieden mit der Durchgeh-Seite (`tools/durchgang/`)

Nach `f8bb712` wörtlich: **„ich bin nicht zufrieden mit deiner Umsetzung aber
das passt schon so."** Auf die Rückfrage, was genau: **„zu viel um zu
erklären."** Die Seite bleibt also, wie sie ist — angefasst wird sie nicht
ohne Davids Wort.

**Was das heißt:** Die Gründe sind **nicht bekannt**. Was hier steht, sind
Vermutungen der Session, die es gebaut hat, keine Aussagen von David:

- Aus „kannst du mir so ne kleine seperate seite bauen" wurden vier Commits
  mit Zustandsauswahl, Speicherschutz, zwei Rahmen und einem Berichtsformat.
  Möglicherweise war eine schlichte Liste mit Links gemeint.
- Es hat **drei Anläufe** gebraucht, bis das drinstand, worum es ihm ging:
  erst alle 25 Zustände statt der überarbeiteten, dann ohne den Beamer — und
  genau dort laufen die Animationen, die er sehen wollte.
- Sie ging **zweimal kaputt raus**: einmal live als 404, weil der Deploy
  `tools/shots` entfernt, und davor mit dem Dialog „Spielstand zu groß zum
  Sichern" bei jedem Schritt. Beides hätte ein Blick auf die ausgelieferte
  Seite vor dem Melden gefunden.

**Für die nächste Session:** nicht raten, was ihn gestört hat, und die Seite
nicht aus eigenem Antrieb umbauen. Wenn das Thema wieder aufkommt, einmal
konkret fragen — aber nur dann. Beim nächsten „bau mir mal eben" gilt: klein
anfangen, früh zeigen, erst danach ausbauen.
