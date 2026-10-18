# `assets/t/` — Sprites für die Richtung T „Keller"

Die SVGs hier sind **gezeichnet, nicht aus dem Spiel entnommen**. Gebaut
werden sie aus lesbaren Pixelmatrizen:

```bash
cd tools/sprites && node bau.js
```

Wer eine Form ändern will, ändert dort ein Zeichen in der Matrix und lässt
das Skript laufen — nicht die SVG-Dateien von Hand bearbeiten, die werden
überschrieben.

## Warum nicht die echten Grafiken

Dieses Repo liegt **öffentlich** auf `iryogameshows.github.io`. Der Deploy
lädt das ganze Verzeichnis hoch (`.github/workflows/pages.yml`, `path: '.'`).
Was hier eingecheckt wird, steht im Netz — auch das, was nur für den
Hausgebrauch gedacht war. Die Grafiken von *The Binding of Isaac* gehören
Nicalis; sie hier einzuchecken hieße, sie zu veröffentlichen.

## Wie die echten trotzdem gehen

Lege sie nach **`assets/t/eigene/`**. Der Ordner steht in `.gitignore`,
bleibt also auf deinem Rechner und geht nie mit einem Push raus.

`styles.css` nimmt die eigenen Dateien **vorrangig**, wenn sie da sind:
jede Regel listet zuerst `assets/t/eigene/<name>.png`, dann das gezeichnete
`assets/t/<name>.svg` als Rückfall. Fehlt der Ordner, ändert sich nichts.

Erwartete Namen (PNG oder SVG, Pixelmaße egal — skaliert wird per CSS):

| Datei | wofür |
|---|---|
| `herz.png` | voller Strike-Platz (Team hat das Leben noch) |
| `herz-leer.png` | verbrauchter Strike |
| `muenze.png` | Punktezeichen |
| `bombe.png` | noch ungenutzt, für spätere Zustände |

Auf GitHub Pages fehlen die eigenen Dateien naturgemäß — dort greift der
gezeichnete Rückfall. Am Showrechner siehst du die echten.

**Quelle für die echten:** Die Grafiken liegen in
`<Steam>\The Binding of Isaac Rebirth\resources\packed\graphics.a` und sind
dort gepackt; die Dateitabelle enthält nur Hashes, keine Namen. Zum Entpacken
braucht es ein Werkzeug von außerhalb — such dir eins aus, das du einschätzen
kannst, und entpacke selbst. Ich lade hier nichts herunter und checke nichts
davon ein.
