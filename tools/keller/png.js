// PNG lesen und schreiben, ohne Abhaengigkeiten - gebraucht von hol.js,
// um aus den Sprite-Sheets des Spiels die Kacheln und Zeichen zu schneiden.
// Kann auch allein: node png.js <quelle> <ziel> <faktor> [x y w h]
// vergroessert ein Bild mit Nearest Neighbour, um Pixelgrafik anzusehen.
const fs = require('fs');
const zlib = require('zlib');

function lesePng(datei) {
  const b = fs.readFileSync(datei);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('kein PNG: ' + datei);
  let p = 8, w = 0, h = 0, tiefe = 0, farbtyp = 0, idat = [], palette = null, trns = null;
  while (p < b.length) {
    const len = b.readUInt32BE(p);
    const typ = b.toString('latin1', p + 4, p + 8);
    const daten = b.subarray(p + 8, p + 8 + len);
    if (typ === 'IHDR') {
      w = daten.readUInt32BE(0); h = daten.readUInt32BE(4);
      tiefe = daten[8]; farbtyp = daten[9];
      if (daten[12] !== 0) throw new Error('Interlace wird nicht unterstuetzt');
    } else if (typ === 'PLTE') palette = Buffer.from(daten);
    else if (typ === 'tRNS') trns = Buffer.from(daten);
    else if (typ === 'IDAT') idat.push(Buffer.from(daten));
    else if (typ === 'IEND') break;
    p += 12 + len;
  }
  if (tiefe !== 8) throw new Error('nur 8 Bit je Kanal, hier: ' + tiefe);
  const kanaele = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[farbtyp];
  if (!kanaele) throw new Error('Farbtyp ' + farbtyp + ' nicht unterstuetzt');

  const roh = zlib.inflateSync(Buffer.concat(idat));
  const zeile = w * kanaele;
  const aus = Buffer.alloc(h * zeile);
  let q = 0;
  for (let y = 0; y < h; y++) {
    const filter = roh[q++];
    const ziel = y * zeile;
    const oben = (y - 1) * zeile;
    for (let i = 0; i < zeile; i++) {
      const x = roh[q + i];
      const a = i >= kanaele ? aus[ziel + i - kanaele] : 0;
      const b2 = y > 0 ? aus[oben + i] : 0;
      const c = (i >= kanaele && y > 0) ? aus[oben + i - kanaele] : 0;
      let v;
      if (filter === 0) v = x;
      else if (filter === 1) v = x + a;
      else if (filter === 2) v = x + b2;
      else if (filter === 3) v = x + ((a + b2) >> 1);
      else if (filter === 4) {
        const pp = a + b2 - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b2), pc = Math.abs(pp - c);
        v = x + (pa <= pb && pa <= pc ? a : (pb <= pc ? b2 : c));
      } else throw new Error('Filter ' + filter);
      aus[ziel + i] = v & 0xff;
    }
    q += zeile;
  }

  // auf RGBA bringen
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    let r, g, bl, al = 255;
    const s = i * kanaele;
    if (farbtyp === 0) { r = g = bl = aus[s]; }
    else if (farbtyp === 4) { r = g = bl = aus[s]; al = aus[s + 1]; }
    else if (farbtyp === 2) { r = aus[s]; g = aus[s + 1]; bl = aus[s + 2]; }
    else if (farbtyp === 6) { r = aus[s]; g = aus[s + 1]; bl = aus[s + 2]; al = aus[s + 3]; }
    else if (farbtyp === 3) {
      const idx = aus[s];
      r = palette[idx * 3]; g = palette[idx * 3 + 1]; bl = palette[idx * 3 + 2];
      if (trns && idx < trns.length) al = trns[idx];
    }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = bl; rgba[i * 4 + 3] = al;
  }
  return { w, h, rgba };
}

function schreibePng(datei, w, h, rgba) {
  const zeile = w * 4;
  const roh = Buffer.alloc(h * (zeile + 1));
  for (let y = 0; y < h; y++) {
    roh[y * (zeile + 1)] = 0;
    rgba.copy(roh, y * (zeile + 1) + 1, y * zeile, (y + 1) * zeile);
  }
  const stuecke = [];
  const stueck = (typ, daten) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(daten.length);
    const kopf = Buffer.concat([Buffer.from(typ, 'latin1'), daten]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(kopf) >>> 0);
    return Buffer.concat([len, kopf, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  stuecke.push(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  stuecke.push(stueck('IHDR', ihdr));
  stuecke.push(stueck('IDAT', zlib.deflateSync(roh, { level: 6 })));
  stuecke.push(stueck('IEND', Buffer.alloc(0)));
  fs.writeFileSync(datei, Buffer.concat(stuecke));
}

const crcTab = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c; }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTab[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

module.exports = { lesePng, schreibePng };
if (require.main !== module) return;

// ---- Hauptteil ----
const [quelle, ziel, faktorS, xs, ys, ws, hs] = process.argv.slice(2);
const faktor = Number(faktorS) || 4;
const bild = lesePng(quelle);
const ax = xs !== undefined ? Number(xs) : 0;
const ay = ys !== undefined ? Number(ys) : 0;
const aw = ws !== undefined ? Number(ws) : bild.w - ax;
const ah = hs !== undefined ? Number(hs) : bild.h - ay;

const nw = aw * faktor, nh = ah * faktor;
const aus = Buffer.alloc(nw * nh * 4);
for (let y = 0; y < nh; y++) {
  const sy = ay + Math.floor(y / faktor);
  for (let x = 0; x < nw; x++) {
    const sx = ax + Math.floor(x / faktor);
    const s = (sy * bild.w + sx) * 4, d = (y * nw + x) * 4;
    // Schachbrett hinter durchsichtigen Stellen, damit man sie sieht
    const a = bild.rgba[s + 3];
    if (a === 0) {
      const k = (Math.floor(x / (faktor * 2)) + Math.floor(y / (faktor * 2))) % 2 ? 90 : 60;
      aus[d] = k; aus[d + 1] = k; aus[d + 2] = k; aus[d + 3] = 255;
    } else {
      aus[d] = bild.rgba[s]; aus[d + 1] = bild.rgba[s + 1]; aus[d + 2] = bild.rgba[s + 2]; aus[d + 3] = 255;
    }
  }
}
schreibePng(ziel, nw, nh, aus);
console.log(`${quelle} (${bild.w}x${bild.h}) -> ${ziel} (${nw}x${nh}), Ausschnitt ${ax},${ay} ${aw}x${ah}, Faktor ${faktor}`);
