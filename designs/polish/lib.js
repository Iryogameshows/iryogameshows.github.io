// Gemeinsame Helfer fuer die Politur-Skripte der Entwurfs-Richtungen (designs/s/<K>-*.html).
const fs = require('fs');
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const light = (h, t) => toHex(hex(h).map((v) => v + (255 - v) * t));
const dark = (h, t) => toHex(hex(h).map((v) => v * (1 - t)));
const rgba = (h, a) => 'rgba(' + hex(h).join(',') + ',' + a + ')';
/** Kachelbares Rauschen als data-URI (Farbe rgb, Deckkraft alpha, Feinheit freq). */
function noise({ rgb = [255, 255, 255], alpha = .3, freq = .9, oct = 2, seed = 7, size = 220 } = {}) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${oct}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${rgb[0] / 255}  0 0 0 0 ${rgb[1] / 255}  0 0 0 0 ${rgb[2] / 255}  0 0 0 ${alpha} 0'/></filter><rect width='${size}' height='${size}' filter='url(#n)'/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
}
const px = (s, prop) => { const m = new RegExp('(?:^|;)\s*' + prop + ':\s*(-?[\d.]+)px').exec(s); return m ? +m[1] : null; };
/** Fuehrt restyle(styleString, ctx) ueber alle style="..." der Dateien einer Richtung aus. */
function run(K, restyle) {
  const dir = 'designs/s/'; let n = 0, files = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.startsWith(K + '-'))) {
    const h = fs.readFileSync(dir + f, 'utf8');
    const h2 = h.replace(/style="([^"]*)"/g, (all, st) => { const r = restyle(st); if (r !== st) n++; return 'style="' + r + '"'; });
    if (h2 !== h) { fs.writeFileSync(dir + f, h2); files++; }
  }
  console.log(K + ': ' + n + ' Style-Attribute in ' + files + ' Dateien geaendert');
}
module.exports = { hex, toHex, light, dark, rgba, noise, px, run };

/** Haengt einen <style id="iryo-polish"> an das Ende von <head> aller Dateien einer Richtung (idempotent). */
function injectHead(K, css) {
  const dir = 'designs/s/'; let n = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.startsWith(K + '-'))) {
    let h = fs.readFileSync(dir + f, 'utf8');
    h = h.replace(/<style id="iryo-polish">[\s\S]*?<\/style>\s*/, '');
    h = h.replace('</head>', '<style id="iryo-polish">' + css + '</style>\n</head>');
    fs.writeFileSync(dir + f, h); n++;
  }
  console.log(K + ': <style id="iryo-polish"> in ' + n + ' Dateien');
}
module.exports.injectHead = injectHead;
