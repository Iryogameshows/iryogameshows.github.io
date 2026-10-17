// Welcher Chromium startet die Pruefwerkzeuge (shots.js, ablauf.js, geraete.js)?
//
// Reihenfolge: CHROME aus der Umgebung, dann der Systembrowser (Chrome oder
// Edge), dann der Chromium, den Playwright selbst mitbringt.
//
// Warum das hier eine eigene Datei ist - der Vorgang am 2026-10-17:
// Mitten in der Sitzung aktualisierte sich Edge auf 155. Danach brach JEDER
// Start ab ("Target page, context or browser has been closed", exitCode=0),
// derselbe Aufruf lief 25 Minuten vorher noch. Ursache: playwright-core 1.48.2
// startet mit --headless=old, und den alten Headless-Modus hat Chromium ab
// Version 132 entfernt. Behoben durch playwright-core 1.64.1 (startet Edge 155,
// geprueft). Die Browser-Wahl stand vorher dreimal als eigene Liste im Code -
// jetzt an einer Stelle, mit diesem Hinweis daneben.
//
// Playwrights eigener Chromium steht bewusst HINTEN: auf Davids Rechner laesst
// er sich nicht starten ("Side-by-Side-Konfiguration ungueltig" - die
// Visual-C++-Runtime fehlt, die Chrome und Edge selbst mitbringen). Als
// Rueckfall bleibt er trotzdem drin, fuer ein Geraet ohne Systembrowser:
//
//   cd tools/shots && npx playwright@1.64.1 install chromium
'use strict';
const fs = require('fs');
const { chromium } = require('playwright-core');

const SYSTEM_KANDIDATEN = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
];

/* Der Pfad fuer chromium.launch({ executablePath }).
   undefined heisst "Playwrights eigener Chromium" - genau das, was launch()
   ohne executablePath tut.
   @returns {string|undefined} */
function chromiumPfad() {
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) return process.env.CHROME;
  const sys = SYSTEM_KANDIDATEN.find(k => fs.existsSync(k));
  if (sys) return sys;
  try {
    const p = chromium.executablePath();
    if (p && fs.existsSync(p)) return undefined;
  } catch { /* playwright-core ohne Browser-Registry */ }
  console.error('Kein Chromium gefunden. Chrome oder Edge installieren, oder:');
  console.error('  cd tools/shots && npx playwright@1.64.1 install chromium');
  console.error('Eigener Pfad: Umgebungsvariable CHROME.');
  process.exit(2);
}

module.exports = { chromiumPfad };
