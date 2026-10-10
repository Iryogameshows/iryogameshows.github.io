---
name: abschluss
description: Schliesst einen fertigen Arbeitsschritt ab - Repo-Stand, check.js, ggf. Design-Pruefung, Code-Commit, HANDOFF-Eintrag mit Hash als eigener Commit, Push, Deploy-Nachweis, Antwort an David mit "Offen" und "Naechste Schritte". Aufruf, wenn eine Aenderung fertig ist und raus soll.
argument-hint: "[Thema des Arbeitsschritts]"
---

# Abschluss: $ARGUMENTS

Fasst zusammen, was die CLAUDE.md nach jeder Aenderung verlangt. Ein Schritt
ohne HANDOFF-Eintrag und ohne nachgewiesenen Deploy ist nicht fertig.

## 1 · Vor dem Commit

1. `git fetch origin && git status -sb`. Bei `behind`: `git merge --ff-only origin/master`.
2. `node check.js` muss "alles in Ordnung" melden (die Commit-Sperre
   `.claude/hooks/commit-gate.js` erzwingt das ohnehin).
3. Nach groesseren Aenderungen `node check.js --types`.
4. Aussehen oder Layout geaendert (`styles.css`, `js/theme.js`, GM-Panel,
   `buzzer/`, `gamepad/`): `/design-pruefung` - Befunde und Kontaktbogen.
5. **Gross?** (neue Show, Struktur, Loeschen, `.github/`, Firebase-Regeln
   oder -Daten, `.claude/`, CLAUDE.md, Verlauf umschreiben, Diff ueber ~10
   Dateien oder mehrere hundert Zeilen, Pruefung rot): erst David fragen.

## 2 · Commits

1. Nur die Dateien des Schritts stagen (`git add <pfade>`, nicht `-A`).
   `git status --short` vorher ansehen - nichts Fremdes mitnehmen.
2. Code-Commit: Betreff, was und warum; im Text die Messwerte. Am Ende die
   Attributionszeile aus der Session.
3. Hash ablesen, HANDOFF-Eintrag nach `/handoff` schreiben (oben, Datum und
   Hash in der Ueberschrift; Gemacht, Warum so, Geprueft mit Zahlen, Offen,
   Fallstricke) und als eigenen Commit `HANDOFF: Eintrag zu <hash>`.

## 3 · Push und Deploy

1. `git fetch origin && git status -sb`, dann `git push origin master`.
2. Deploy nachweisen - der Push allein zaehlt nicht:
   `gh run list --limit 1` bzw. `gh run watch`. Ohne `gh`: die Action-API
   `https://api.github.com/repos/Iryogameshows/iryogameshows.github.io/actions/runs?per_page=1`
   (Hash und `conclusion`). Dazu eine Stichprobe der Live-Datei
   (`curl -s https://iryogameshows.github.io/<datei> | grep -c <marker>`).
3. Schlaegt der Lauf fehl, ist der Schritt nicht fertig: Ursache suchen,
   melden.

## 4 · Antwort an David

- Backslash vor jedem Absatz (CLAUDE.md "Antwortformat").
- Ergebnis mit Zahlen; Geprueftes als geprueft, Vermutetes als Vermutung.
- Der Satz "Steht in der HANDOFF.md."
- Am Ende, in dieser Reihenfolge:
  - **Offen:** was nicht behoben oder nicht geprueft ist, ein Punkt je Zeile
    (oder "keine").
  - **Naechste Schritte:** nummeriert in der vorgeschlagenen Reihenfolge
    (oder "keine").
