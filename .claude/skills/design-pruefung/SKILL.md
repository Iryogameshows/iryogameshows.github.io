---
name: design-pruefung
description: Prueft nach einer Aenderung an styles.css, js/theme.js, dem GM-Panel (GM_SHARED_CSS, themeGmHtml) oder den Handy-Seiten (buzzer/, gamepad/) alle 18 Design-Richtungen plus Studio-Blau mit tools/shots - Kontaktboegen ansehen, Befunde benennen, Studio-Blau gegen eine Basis vergleichen. Vor jedem Commit, der Aussehen oder Layout aendert.
argument-hint: "[shows, z. B. feud,jeop] [--size 1920x1080]"
---

# Design-Pruefung

Warum es das gibt: am 2026-10-10 hatte Richtung E kein Spielbrett, und
GM-Fenster, Gamepad und Handy-Buzzer waren in keiner Richtung gestaltet. Jede
Arbeitsscheibe war einzeln geprueft, das Ganze nie - gefunden hat es David
(HANDOFF `431a43e`). Diese Pruefung schaut immer aufs Ganze.

## Vorher

1. `git fetch origin && git status -sb`, bei `behind` erst `git merge --ff-only origin/master`.
2. Einmal pro Geraet: `cd tools/shots && npm install`.
3. **Vor** der Aenderung das Studio-Blau merken, wenn es unveraendert bleiben soll:
   `node tools/shots/shots.js --basis` (bei Bedarf zusaetzlich `--size 1920x1080`).
   Ohne Basis gibt es spaeter keinen Beleg fuer "Studio-Blau unveraendert".

## Pruefen

```bash
node tools/shots/shots.js                     # alle Shows, alle Richtungen, 1280x720 (~5 min)
node tools/shots/shots.js --shows $ARGUMENTS  # nur die beruehrten Shows
node tools/shots/shots.js --vergleich         # Studio-Blau gegen die Basis
```

Shows: `feud`, `jeop`, `wwm`, `wwds`, `gm`, `buzzer`, `buzzer-login`.
`--themes E,J,Studio` grenzt die Richtungen ein, `--size` die Fenstergroesse.

## Auswerten - beides, nicht nur eins

1. **Befunde lesen** (Ende der Ausgabe, Exit-Code 1 bei Befunden): JS-Fehler,
   Richtung nicht angekommen, Screen hoeher als das Fenster.
2. **Kontaktboegen ansehen**: `tools/shots/out/bogen-<show>.png` mit dem
   Read-Werkzeug oeffnen. Ein Brett im Studio-Blau auf fremdem Grund, eine
   unlesbare Schrift, ein angeschnittenes Feld meldet keine Messung. Je
   beruehrte Show den Bogen tatsaechlich ansehen, nicht annehmen.
3. Auffaelliges in Einzelbildern pruefen: `tools/shots/out/<show>-<Richtung>.png`.

## Berichten

- Mit Zahlen: wie viele Bilder, wie viele Befunde, wie viele Elemente im
  Vergleich und wie viele davon abweichend.
- Jeder Befund wird behoben oder ausdruecklich als offen benannt - nie still
  uebergangen. Abweichungen im `--vergleich` sind nur dann in Ordnung, wenn
  sie die gewollte Aenderung sind; das sagen.
- In den HANDOFF-Eintrag unter "Geprueft".

## Fallstricke

- Firebase ist durch `tools/shots/fbstub.js` ersetzt - kein Lauf erreicht die
  Live-DB. Eigene Ad-hoc-Tests ohne diesen Ersatz schreiben schon beim Laden
  der Hostseite (`designPushToPhones`, BAUPLAN 5).
- Die Pruefung zeigt je Show einen Zustand (Frage offen, zwei Antworten
  aufgedeckt). Publikumsjoker, Finale, zweizeilige Fragen sieht sie nicht -
  wer das aendert, prueft es zusaetzlich von Hand und sagt es.
- Bei der Arbeitskopie (CRLF) und Einfuegungen per Skript auf gemischte
  Zeilenenden achten.
