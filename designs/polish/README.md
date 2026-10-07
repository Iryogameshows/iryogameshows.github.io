# Politur der Entwürfe

Die Dateien in `designs/s/` sind ein **Export** (die Quelle liegt nicht im Repo).
Die Skripte hier haben die Richtungen A, D, E, I, L, O, R und S nachträglich
„hochwertiger“ gemacht: Verläufe, Schatten, Korn und Papier, Glanz, einzelne
Animationen. Sie schreiben die Dateien in `designs/s/` direkt um.

Aufruf aus dem Wurzelverzeichnis, je Richtung ein Skript:

    node designs/polish/polish-D.js

**Nur auf einem frischen Export ausführen.** Die Skripte sind nicht idempotent,
ein zweiter Lauf legt die Schatten ein zweites Mal an. Wer neu exportiert, führt
sie danach wieder aus (oder holt die Dateien vorher mit
`git checkout -- designs/s/<Richtung>-*.html`).

`lib.js` hat die gemeinsamen Helfer (Rauschen als data-URI, Farbabstufung,
`run`, `injectHead`). `polish-E2.js` ergänzt die SVG-Fächer in `E-Jeopardy.html`.
Wo ein Skript Animationen einbaut (O, S), steht ein `<style id="iryo-polish">`
im Kopf der Dateien; `prefers-reduced-motion` schaltet sie ab.
