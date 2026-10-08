---
name: handoff
description: Schreibt den HANDOFF.md-Eintrag zum letzten Arbeitsschritt (Gemacht, Warum so, Geprüft, Offen, Fallstricke) mit Datum und Commit-Hash und schickt ihn als eigenen kleinen Commit hinterher. Aufruf nach einem Code-Commit, optional mit Hash oder Thema als Argument.
disable-model-invocation: true
argument-hint: "[commit-hash oder Thema]"
---

# /handoff

Schreibt den Eintrag, den die CLAUDE.md nach jedem Commit verlangt. Ohne Eintrag ist der Arbeitsschritt nicht fertig.

## Vorher

1. `git fetch origin && git status -sb`. Bei `behind`: `git merge --ff-only origin/master`.
2. Den Commit bestimmen: Argument `$ARGUMENTS`, sonst `git log --oneline -5` ansehen und den letzten Code-Commit nehmen (nicht einen früheren `HANDOFF:`-Commit). Unklar, welcher gemeint ist: fragen.
3. `git show --stat <hash>` lesen. Den Eintrag aus dem Diff und dem Verlauf dieser Session schreiben, nicht aus dem Gedächtnis.
4. `HANDOFF.md` oben lesen (bis zum ersten `---` nach dem Kopf), damit der neue Eintrag zum Stil passt und nichts doppelt steht.

## Eintrag

Neu **oben**, direkt unter dem `---` nach dem Kopf der Datei:

```
## JJJJ-MM-TT — <Thema> (`<hash>`)

**Anlass.** Was David gewollt hat (sein Wortlaut, wenn kurz).

**Gemacht.** Was sich geändert hat, mit Dateinamen.

**Warum so.** Gründe, samt verworfener Wege. Eigene Annahmen als Annahme
kennzeichnen.

**Geprüft.** Was mit welchem Ergebnis geprüft wurde, mit Zahlen
(`node check.js`, Browser, Aktion).

**Ungeprüft.** Was nicht nachgesehen wurde, offen benannt.

**Offen.** Was liegen blieb.

**Fallstricke.** Was beim nächsten Mal stolpern lässt.

---
```

Regeln:
- Datum von heute (`date +%F`), Hash in Backticks, 7 Zeichen reichen.
- Nur Geprüftes als geprüft schreiben. Was in dieser Session nicht gelaufen ist, gehört unter „Ungeprüft“. Keine Vermutung als Tatsache.
- Fehlt ein Abschnitt inhaltlich (z. B. keine Fallstricke), trotzdem stehen lassen mit „keine bekannt“ - die Reihenfolge der Abschnitte ist fest.
- Deutsch, ohne Füllwörter.

## Danach

1. Eintrag als eigenen Commit: Message `HANDOFF: Eintrag zu <hash> (<Thema>)`, mit den Attributionszeilen aus der Session.
2. Commit-Sperre beachten: `node check.js` muss durchlaufen (der Hook prüft das bei Bash-Commits selbst).
3. Push richtet sich nach der Regel „Commit und Push - automatisch, außer bei großen Änderungen“ in der CLAUDE.md: bei kleinen Änderungen pushen und den Deploy-Lauf prüfen, bei großen vorher fragen.
4. In der Antwort an David ausdrücklich sagen: „Steht in der HANDOFF.md.“
