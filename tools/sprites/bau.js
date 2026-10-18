// Pixel-Sprites fuer die Design-Richtung T "Keller" bauen.
//
//   cd tools/sprites && node bau.js      -> schreibt nach assets/t/
//
// Warum ein Werkzeug und keine SVG-Dateien von Hand: ein Sprite steht hier
// als LESBARE Matrix. Wer ein Herz schmaler haben will, aendert ein Zeichen
// und laesst das Skript laufen, statt in 200 <rect>-Zeilen zu suchen.
//
// Gezeichnet, nicht entnommen: die Grafiken des Spiels gehoeren Nicalis und
// haetten in einem oeffentlichen Repo (iryogameshows.github.io) nichts zu
// suchen. Wer die echten will, legt sie lokal nach assets/t/eigene/ -
// styles.css nimmt sie dann vorrangig, und .gitignore haelt sie draussen.
// Siehe assets/t/LIESMICH.md.
'use strict';
const fs = require('fs');
const path = require('path');

const AUS = path.resolve(__dirname, '..', '..', 'assets', 't');

/* Die Farben. K ist die Kontur - in Isaac hat jedes Ding eine, und sie ist
   fast schwarz, nicht grau. Ohne sie sieht nichts nach dem Spiel aus. */
const FARBEN = {
  K: '#140B08',   // Kontur
  R: '#D83A32',   // Herz rot
  D: '#8E1F1C',   // Herz Schatten
  W: '#FFFFFF',   // Glanz
  G: '#F2C33C',   // Muenze gold
  B: '#A87A14',   // Muenze Schatten
  S: '#2B2B2B',   // Bombe
  H: '#5A5A5A',   // Bombe hell
  F: '#E8D7B0',   // Zuendschnur
  O: '#F28C28',   // Funke
};

/** Matrix -> SVG. Ein Punkt ist durchsichtig.
 *  @param {string[]} zeilen @returns {string} */
function svg(zeilen) {
  const h = zeilen.length, b = Math.max(...zeilen.map(z => z.length));
  /* Gleiche Farben in einer Zeile werden zu EINEM Rechteck zusammengefasst.
     Ein Herz sind sonst 170 Rechtecke; so sind es 30, und die Datei bleibt
     klein genug, um sie ohne schlechtes Gewissen inline zu benutzen. */
  const teile = [];
  zeilen.forEach((zeile, y) => {
    let x = 0;
    while (x < zeile.length) {
      const c = zeile[x];
      if (c === '.' || c === ' ') { x++; continue; }
      let n = 1;
      while (x + n < zeile.length && zeile[x + n] === c) n++;
      const farbe = FARBEN[c];
      if (!farbe) throw new Error(`Unbekanntes Zeichen "${c}" in Zeile ${y}`);
      teile.push(`<rect x="${x}" y="${y}" width="${n}" height="1" fill="${farbe}"/>`);
      x += n;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${b} ${h}" `
    + `width="${b}" height="${h}" shape-rendering="crispEdges">`
    + teile.join('') + '</svg>\n';
}

/* ── Die Sprites ──────────────────────────────────────────────────────────
   Jede Matrix ist so breit wie hoch, damit sie sich ohne Verzerrung
   skalieren laesst. Der Glanz sitzt immer oben links: so ist es im Spiel,
   und erst dadurch sieht eine Flaeche nach einem Koerper aus. */

const HERZ = [
  '................',
  '....KKK..KKK....',
  '...KRRRKKRRRK...',
  '..KRWWRRRRRRRK..',
  '..KRWWRRRRRRRK..',
  '..KRWRRRRRRRRK..',
  '..KRRRRRRRRRRK..',
  '..KRRRRRRRRRRK..',
  '...KRRRRRRRRK...',
  '...KDRRRRRRDK...',
  '....KDRRRRDK....',
  '.....KDRRDK.....',
  '......KDDK......',
  '.......KK.......',
  '................',
  '................',
];

/* Leeres Herz: dieselbe Silhouette, aber dunkel gefuellt statt durchsichtig.
   Erster Versuch war ein Regex ueber HERZ, der die Fuellung wegnahm - heraus
   kam eine gepunktete Linie, weil die Kontur dabei selbst Loecher bekam.
   Von Hand ist es eine Zeile mehr und sieht wie ein leeres Herzgefaess aus. */
const HERZ_LEER = [
  '................',
  '....KKK..KKK....',
  '...KDDDKKDDDK...',
  '..KDDDDDDDDDDK..',
  '..KDDDDDDDDDDK..',
  '..KDDDDDDDDDDK..',
  '..KDDDDDDDDDDK..',
  '..KDDDDDDDDDDK..',
  '...KDDDDDDDDK...',
  '...KDDDDDDDDK...',
  '....KDDDDDDK....',
  '.....KDDDDK.....',
  '......KDDK......',
  '.......KK.......',
  '................',
  '................',
];

/* Muenze. Der erste Zuschnitt war unten zu kantig - der Schatten lief als
   Treppe aus und die Scheibe sah wie ein Sechseck aus. Jetzt laeuft die
   Kontur in jeder Zeile eine Spalte weiter nach innen, dann ist sie rund. */
const MUENZE = [
  '....KKKK....',
  '..KKGGGGKK..',
  '.KGWWGGGGGK.',
  'KGWWGGGGGGGK',
  'KGWGGGGGGGGK',
  'KGGGGGGGGGGK',
  'KGGGGGGGGGBK',
  'KGGGGGGGGBBK',
  '.KGGGGGGBBK.',
  '..KKGGBBKK..',
  '....KKKK....',
];

const BOMBE = [
  '................',
  '..........FF....',
  '.........FOO....',
  '........FF......',
  '....KKKKK.......',
  '..KKSSSSSKK.....',
  '.KSHHSSSSSSK....',
  '.KSHSSSSSSSK....',
  'KSSSSSSSSSSSK...',
  'KSSSSSSSSSSSK...',
  'KSSSSSSSSSSSK...',
  '.KSSSSSSSSSK....',
  '.KSSSSSSSSSK....',
  '..KKSSSSSKK.....',
  '....KKKKK.......',
  '................',
];

const SPRITES = { herz: HERZ, 'herz-leer': HERZ_LEER, muenze: MUENZE, bombe: BOMBE };

fs.mkdirSync(AUS, { recursive: true });
let n = 0;
for (const [name, matrix] of Object.entries(SPRITES)) {
  const datei = path.join(AUS, name + '.svg');
  fs.writeFileSync(datei, svg(matrix));
  console.log(`${name}.svg  ${matrix[0].length}x${matrix.length}`);
  n++;
}
console.log(`\n${n} Sprites nach ${AUS}`);
