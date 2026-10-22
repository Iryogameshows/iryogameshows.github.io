# `tools/gemeinsam/` — Dateien, die Werkzeug UND Seite brauchen

Hier liegt, was von **zwei Seiten** gebraucht wird: von den Prüfwerkzeugen in
`tools/shots/` (Node) und von einer Seite, die GitHub Pages ausliefert.

| Datei | Werkzeug | Seite |
|---|---|---|
| `aufbau.js` | `shots.js` per `require` | `tools/durchgang/` lädt es als Script in die Hostseite |
| `fbstub.js` | `shots.js` reicht den Inhalt als Ersatz für `firebase-database-compat.js` durch | `index.html` lädt es bei `?stumm=1` |

## Warum ein eigener Ordner

Der Deploy-Workflow (`.github/workflows/pages.yml`) löscht vor dem Upload
unter anderem **`tools/shots`** — bewusst: „Nur hochladen, was eine Seite
tatsächlich lädt."

Am 2026-10-17 lagen beide Dateien noch dort, und die Durchgeh-Seite lud sie per
URL. Live war das Ergebnis **404**: die Seite meldete „tools/shots/aufbau.js
nicht gefunden", und `index.html?stumm=1` hätte überhaupt keine Datenbank
bekommen — weder den Ersatz noch das echte Firebase. Gefunden hat es David beim
ersten Öffnen.

`tools/` als Ganzes wird nicht gelöscht, nur `shots` und `reactbits`. Dieser
Ordner geht also mit, ohne dass jemand den Workflow anfassen muss — und der
braucht ein Token mit `workflow`-Recht, das hier keiner hat (siehe `CLAUDE.md`).

## Regel

Wer hier etwas ablegt, prüft nach dem Deploy, dass es wirklich ankommt:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://iryo.party/tools/gemeinsam/aufbau.js
```

Und wer eine Datei aus `tools/shots/` in einer **Seite** verlinkt, verschiebt
sie zuerst hierher. Im Repo zu liegen heißt nicht, ausgeliefert zu werden.
