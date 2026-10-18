/* ══ Assets fuer die Design-Richtung T ("Keller") holen ═══════════════════

   Aufruf aus dem Wurzelverzeichnis:   node tools/keller/hol.js

   Legt assets/t/eigene/ an: Bodenkachel, Wandkachel, Raumrahmen, Herzen,
   Muenze, Bombe, Schluessel. Ohne diesen Ordner sieht Richtung T nuechtern
   aus - Farbe und Kontur stehen, aber die Bilder fehlen.

   WARUM ES DIESES SKRIPT GIBT. assets/t/eigene/ steht in .gitignore, kommt
   also nicht per Git auf die anderen Geraete: das Repo ist oeffentlich und
   pages.yml laedt mit path: '.' alles hoch. Spielgrafiken gehoeren da nicht
   hinein. Das Skript dagegen schon - es ist nur eine Bauanleitung.

   WARUM NICHT AUS DER EIGENEN INSTALLATION. Naheliegend waere, die Dateien
   aus dem gekauften Spiel zu nehmen. Sie liegen dort in resources/packed/
   (graphics.a, sfx.a). Diese Archive sind bei Repentance VERSCHLUESSELT:
   die Eintraege haben hohe Entropie, keinen PNG- und keinen Kompressions-
   kopf. Der mitgelieferte tools/ResourceExtractor/ResourceExtractor.exe
   stammt laut seinem eigenen Banner aus Afterbirth+-Zeiten, findet zu
   keinem Eintrag einen Namen ("could not determine filename for entry ...")
   und bricht mitten im Lauf ab. Am 2026-10-18 durchprobiert: mit allen 22
   Archiven, ohne die repentance-Archive, mit Platzhaltern - immer dasselbe.
   Eine Verschluesselung zu umgehen ist etwas anderes als ihr Werkzeug zu
   benutzen, deshalb kommen die Dateien aus einer offenen Quelle im Netz.

   Davids Entscheidung dazu am 2026-10-18: "recherchiert selbst im Internet".
   Die Toene sind nicht dabei - die baut js/keller-ton.js mit WebAudio nach. */

const fs = require('fs');
const path = require('path');
const png = require('./png.js');

const WURZEL = path.resolve(__dirname, '..', '..');
const ZIEL = path.join(WURZEL, 'assets', 't', 'eigene');
const QUELLE = 'https://raw.githubusercontent.com/Anveio/isaac-rebirth-browser/main'
             + '/references/isaac/rebirth/resources';

/* Was geholt wird. Bewusst wenige Dateien: gebraucht werden ein Backdrop
   (Boden, Wand, Raumecke) und die Sprites, die im HUD vorkommen. */
const HOLEN = [
  ['gfx/backdrop/01_basement.png', 'backdrop/01_basement.png'],
  ['gfx/backdrop/02_cellar.png',   'backdrop/02_cellar.png'],
  ['gfx/backdrop/03_caves.png',    'backdrop/03_caves.png'],
  ['gfx/backdrop/05_depths.png',   'backdrop/05_depths.png'],
  ['gfx/ui/ui_hearts.png',         'ui/ui_hearts.png'],
  ['gfx/ui/hudpickups.png',        'ui/hudpickups.png'],
  ['gfx/items/pick ups/pickup_002_coin.png', 'pickups/coin.png'],
  ['gfx/items/pick ups/pickup_016_bomb.png', 'pickups/bomb.png'],
  ['gfx/items/pick ups/pickup_003_key.png',  'pickups/key.png']
];

/* Zuschnitte. Die Zahlen sind am vergroesserten Bild gemessen, nicht
   geraten - siehe assets/t/LIESMICH.md. */
const ICONS = [
  ['pickups/coin.png', 'icon/muenze.png',      0,  0, 68, 64],
  ['pickups/bomb.png', 'icon/bombe.png',       0,  0, 32, 32],
  ['pickups/key.png',  'icon/schluessel.png',  0,  0, 32, 32],
  ['ui/ui_hearts.png', 'icon/herz.png',        0,  0, 16, 16],
  ['ui/ui_hearts.png', 'icon/herz-halb.png',  16,  0, 16, 16],
  ['ui/ui_hearts.png', 'icon/herz-leer.png',  32,  0, 16, 16],
  ['ui/ui_hearts.png', 'icon/herz-seele.png',  0, 16, 16, 16]
];

const p = (rel) => path.join(ZIEL, rel);
function sorgeFuerOrdner(datei) { fs.mkdirSync(path.dirname(datei), { recursive: true }); }

async function hole() {
  console.log('Hole nach', ZIEL);
  for (const [quelle, ziel] of HOLEN) {
    const url = QUELLE + '/' + quelle.split('/').map(encodeURIComponent).join('/');
    const datei = p(ziel);
    sorgeFuerOrdner(datei);
    const antwort = await fetch(url);
    if (!antwort.ok) throw new Error(`${quelle}: HTTP ${antwort.status}`);
    const daten = Buffer.from(await antwort.arrayBuffer());
    fs.writeFileSync(datei, daten);
    console.log(`  ok  ${ziel.padEnd(28)} ${daten.length} Byte`);
  }
}

/** Schneidet ein Einzelbild aus einem Sheet und nimmt den durchsichtigen
 *  Rand weg. */
function icon(quelle, ziel, ax, ay, aw, ah) {
  const { w, rgba } = png.lesePng(p(quelle));
  let minX = aw, minY = ah, maxX = -1, maxY = -1;
  for (let y = 0; y < ah; y++) for (let x = 0; x < aw; x++) {
    if (rgba[((ay + y) * w + (ax + x)) * 4 + 3] > 8) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const aus = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const s = ((ay + minY + y) * w + (ax + minX + x)) * 4, d = (y * bw + x) * 4;
    aus[d] = rgba[s]; aus[d + 1] = rgba[s + 1]; aus[d + 2] = rgba[s + 2]; aus[d + 3] = rgba[s + 3];
  }
  sorgeFuerOrdner(p(ziel));
  png.schreibePng(p(ziel), bw, bh, aus);
  console.log(`  ${ziel.padEnd(28)} ${bw}x${bh}`);
}

/** Nahtlose Kachel: ein Feld und seine drei Spiegelungen. An jeder Kante
 *  treffen dadurch gleiche Pixel aufeinander. Noetig, weil die Boeden im
 *  Spiel verstreute Flecken haben und keine echte Kachel sind. */
function kachel(quelle, ziel, ax, ay, k) {
  const { w, rgba } = png.lesePng(p(quelle));
  const G = k * 2;
  const aus = Buffer.alloc(G * G * 4);
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    const qx = ax + (x < k ? x : G - 1 - x);
    const qy = ay + (y < k ? y : G - 1 - y);
    const s = (qy * w + qx) * 4, d = (y * G + x) * 4;
    aus[d] = rgba[s]; aus[d + 1] = rgba[s + 1]; aus[d + 2] = rgba[s + 2]; aus[d + 3] = 255;
  }
  sorgeFuerOrdner(p(ziel));
  png.schreibePng(p(ziel), G, G, aus);
  console.log(`  ${ziel.padEnd(28)} ${G}x${G} (gespiegelt, deshalb nahtlos)`);
}

/** Der Raumrahmen als Bild mit neun Feldern fuer border-image.
 *
 *  Die Masse stammen aus dem Backdrop 01_basement.png: das Bild beginnt
 *  bei (10,11) - davor steht schwarzer Rand -, und bei y 53 endet die
 *  Wand und faengt der Boden an. Daraus 42 px je Feld.
 *
 *  Die linke Kante kommt aus y 75 und nicht aus y 53: die linke Wand hat
 *  waagerechte Fugen im Abstand von rund 83 px, ein 42-px-Baustein von
 *  weiter oben wiederholt sie doppelt so oft, und daraus wird ein Muster,
 *  das wie liegende Rohre aussieht (am 2026-10-18 im Kontaktbogen
 *  gesehen und korrigiert). */
function rahmen(quelle, ziel, k) {
  const { w, h, rgba } = png.lesePng(p(quelle));
  const x0 = 10, y0 = 11;
  const hol = (sx, sy, spiegelX, spiegelY) => {
    const out = Buffer.alloc(k * k * 4);
    for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) {
      const qx = Math.min(sx + (spiegelX ? k - 1 - x : x), w - 1);
      const qy = Math.min(sy + (spiegelY ? k - 1 - y : y), h - 1);
      const s = (qy * w + qx) * 4, d = (y * k + x) * 4;
      out[d] = rgba[s]; out[d + 1] = rgba[s + 1]; out[d + 2] = rgba[s + 2]; out[d + 3] = 255;
    }
    return out;
  };
  const G = k * 3;
  const aus = Buffer.alloc(G * G * 4);
  const setze = (teil, zx, zy) => {
    for (let y = 0; y < k; y++) for (let x = 0; x < k; x++) {
      const s = (y * k + x) * 4, d = ((zy + y) * G + (zx + x)) * 4;
      aus[d] = teil[s]; aus[d + 1] = teil[s + 1]; aus[d + 2] = teil[s + 2]; aus[d + 3] = teil[s + 3];
    }
  };
  const ecke = [x0, y0], oben = [x0 + k, y0], links = [x0, y0 + 64], mitte = [x0 + k + 20, y0 + k + 20];
  setze(hol(ecke[0],  ecke[1],  false, false), 0,     0);
  setze(hol(oben[0],  oben[1],  false, false), k,     0);
  setze(hol(ecke[0],  ecke[1],  true,  false), k * 2, 0);
  setze(hol(links[0], links[1], false, false), 0,     k);
  setze(hol(mitte[0], mitte[1], false, false), k,     k);
  setze(hol(links[0], links[1], true,  false), k * 2, k);
  setze(hol(ecke[0],  ecke[1],  false, true),  0,     k * 2);
  setze(hol(oben[0],  oben[1],  false, true),  k,     k * 2);
  setze(hol(ecke[0],  ecke[1],  true,  true),  k * 2, k * 2);
  sorgeFuerOrdner(p(ziel));
  png.schreibePng(p(ziel), G, G, aus);
  console.log(`  ${ziel.padEnd(28)} ${G}x${G} (border-image-slice: ${k})`);
}

(async function () {
  await hole();
  console.log('Schneide:');
  for (const satz of ICONS) icon(...satz);
  /* Boden aus (80,80): sicher INNERHALB des ersten Raums im Sheet. Das
     Sheet haelt vier Raumvarianten, die Grenze liegt bei y 156 - ein
     Ausschnitt darueber hinaus holt die Ketten der Nachbarvariante mit
     herein (passiert, im Bild als "Rohre" aufgefallen). */
  kachel('backdrop/01_basement.png', 'boden.png', 80, 80, 36);
  kachel('backdrop/01_basement.png', 'wand.png',  64, 16, 32);
  rahmen('backdrop/01_basement.png', 'rahmen.png', 42);
  console.log('\nFertig. Richtung T im Hauptmenue waehlen ("Keller").');
})().catch((e) => { console.error('Fehlgeschlagen:', e.message); process.exit(1); });
