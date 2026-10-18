# `assets/t/` — Grafiken für die Richtung T „Keller"

Richtung T ist *The Binding of Isaac*. Sie arbeitet mit **echten Grafiken
aus dem Spiel** — Boden, Wand, Raumecke, Herzen, Münze. Die liegen in
`assets/t/eigene/` und sind **nicht eingecheckt**.

## Auf einem neuen Gerät: ein Befehl

```bash
node tools/keller/hol.js
```

Holt die Vorlagen und schneidet daraus Bodenkachel, Wandkachel, Raumrahmen
und die Zeichen. Danach sieht die Richtung aus wie gedacht. Ohne diesen
Schritt bleibt sie nüchtern: Farben, Konturen und Steinformen stehen, aber
die Bilder fehlen.

## Warum die Bilder nicht im Repo liegen

Dieses Repo liegt **öffentlich** auf `iryogameshows.github.io`, und der
Deploy lädt das ganze Verzeichnis hoch (`.github/workflows/pages.yml`,
`path: '.'`). Was hier eingecheckt wird, steht im Netz. Die Grafiken von
*The Binding of Isaac* gehören Nicalis — sie einzuchecken hieße, sie zu
veröffentlichen. `assets/t/eigene/` steht deshalb in `.gitignore`.

Die Folge, bewusst in Kauf genommen: **auf GitHub Pages fehlen sie.** Dort
greift der Rückfall. Am Showrechner siehst du das Spiel.

## Warum nicht aus der eigenen Installation

Naheliegend wäre, die Dateien aus dem gekauften Spiel zu nehmen. Sie liegen
in `<Steam>\The Binding of Isaac Rebirth\resources\packed\` (`graphics.a`,
`sfx.a`). Diese Archive sind bei Repentance **verschlüsselt**: die Einträge
haben hohe Entropie, keinen PNG- und keinen Kompressionskopf.

Der Aufbau selbst ist harmlos und schnell gelesen — Kennung `ARCH000`, ein
Offset auf die Tabelle am Dateiende, dort 20 Byte je Eintrag (8 Byte
Namens-Hash, Offset, Länge, Prüfsumme; bei `graphics.a` gehen 2300 × 20 =
46 000 Byte exakt auf). Die **Daten** dahinter sind es nicht.

Das mitgelieferte `tools/ResourceExtractor/ResourceExtractor.exe` hilft
nicht: sein eigener Banner nennt „Rebirth/Afterbirth/Afterbirth+", es findet
zu keinem Eintrag einen Namen („could not determine filename for entry …")
und bricht mitten im Lauf ab — das Log endet mitten in einer Zeile. Am
2026-10-18 durchprobiert: voller Archivsatz, ohne die `repentance`-Archive,
mit Platzhaltern an deren Stelle, aus verschiedenen Verzeichnissen. Immer
dasselbe.

Eine Verschlüsselung zu umgehen ist etwas anderes, als das beiliegende
Werkzeug zu benutzen. Deshalb kommen die Vorlagen aus einer offenen Quelle
im Netz (steht in `tools/keller/hol.js`).

## Was wie geschnitten wird

Die Zahlen im Skript sind **am vergrößerten Bild gemessen**, nicht geraten.
Zum Nachsehen:

```bash
node tools/keller/png.js assets/t/eigene/backdrop/01_basement.png /tmp/gross.png 5 60 0 60 100
```

| Vorlage | Maß | daraus |
|---|---|---|
| `backdrop/01_basement.png` | 468×468 | Boden, Wand, Raumrahmen |
| `ui/ui_hearts.png` | 80×32, Raster 16×16 | voll (0,0), halb (16,0), leer (32,0), Seele (0,16) |
| `pickups/coin.png` | 544×192, Raster 68×64 | Münze aus Feld (0,0) |
| `pickups/bomb.png` | 160×192, Raster 32×32 | Bombe aus Feld (0,0) |

Zwei Fallen, beide am 2026-10-18 im Bild aufgefallen und behoben:

- **Die Quadrantengrenze.** Das Backdrop-Sheet hält vier Raumvarianten; die
  erste endet bei y 156. Ein Bodenausschnitt darüber hinaus holt die Ketten
  der Nachbarvariante mit herein — sie sahen im Kontaktbogen aus wie
  liegende Rohre.
- **Der Fugenabstand.** Die linke Wand hat waagerechte Fugen alle ~83 px.
  Ein 42-px-Baustein wiederholt sie doppelt so oft wie das Spiel. Deshalb
  nimmt `hol.js` für die Seiten ein fugenfreies Stück ab y 75.

Die Böden im Spiel sind **keine Kacheln** (sie haben verstreute Flecken).
`hol.js` baut deshalb Spiegelkacheln: ein Feld und seine drei Spiegelungen,
dadurch treffen an jeder Kante gleiche Pixel aufeinander.

## Der Rückfall

Die SVGs hier (`herz.svg`, `herz-leer.svg`, `muenze.svg`, `bombe.svg`) sind
**gezeichnet, nicht entnommen**, gebaut aus Pixelmatrizen:

```bash
cd tools/sprites && node bau.js
```

Sie stehen in `styles.css` als **zweite** Quelle hinter den echten Dateien:
in einer `background-image`-Liste nimmt der Browser die erste, die lädt.
Fehlt `assets/t/eigene/`, greifen sie — ohne JavaScript, ohne
Fallunterscheidung. Das ist der Zustand auf GitHub Pages.

## Töne

Kommen **nicht** aus dem Spiel, sondern aus `js/keller-ton.js`: WebAudio,
keine Dateien, kein Nachladen. Gründe: `sfx.a` ist genauso verschlüsselt wie
die Grafiken, und die Show läuft vor Publikum und muss ohne Netz auskommen.
Davids Entscheidung vom 2026-10-18.
