/* ══ Google-Schriften lokal ablegen ══════════════════════════════════════

   Aufruf aus dem Wurzelverzeichnis:   node tools/fonts/hol.js

   Sucht in allen ausgelieferten Dateien jede Adresse
   https://fonts.googleapis.com/css2?..., holt das CSS dazu, laedt die
   woff2-Dateien nach vendor/fonts/files/ und schreibt je Adresse ein CSS
   nach vendor/fonts/<name>.css. Danach ersetzt es die Adressen im Code:
     - HTML-Seiten: relativer Pfad je Ordnertiefe (404.html: absolut, weil
       GitHub sie unter jedem beliebigen Pfad ausliefert),
     - js/: FONT_BASE + '<name>.css' (FONT_BASE steht in js/theme.js und
       ist eine absolute Adresse - auch im Beamer-, GM- und Popup-Fenster
       und bei file:// richtig).

   WARUM. Bis 2026-10-23 kamen alle Schriften von fonts.googleapis.com:
   jeder Aufruf schickte die IP-Adresse an Google (LG Muenchen I,
   3 O 17493/20), und ohne Netz fielen alle Richtungen auf Ersatzschriften
   zurueck - obwohl die Show ausdruecklich ohne Netz laufen muss.

   Nur die Teilmengen latin und latin-ext werden geholt (Deutsch braucht
   nichts sonst); Kyrillisch, Griechisch, Vietnamesisch fallen weg.

   Neue Schrift: Google-Adresse wie gewohnt in den Code schreiben, dieses
   Skript erneut laufen lassen. Es ist wiederholbar. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'vendor', 'fonts');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const RX = /https:\/\/fonts\.googleapis\.com\/css2\?[^"'`\s)>]+/g;
const SKIP = /^(tools\/shots\/|tools\/reactbits\/|tools\/fonts\/|vendor\/|node_modules\/)|\.md$/;

const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(f => /\.(html|js)$/.test(f) && !SKIP.test(f));

const norm = u => u.replace(/&amp;/g, '&');
const urls = new Set();
for (const f of files) for (const m of fs.readFileSync(path.join(ROOT, f), 'utf8').match(RX) || []) urls.add(norm(m));

function nameOf(u) {
  const fam = [...new URL(u).searchParams.getAll('family')].map(s => s.split(':')[0].toLowerCase().replace(/\+| /g, '-'));
  return fam.join('_').slice(0, 60) + '-' + crypto.createHash('sha1').update(u).digest('hex').slice(0, 6);
}

async function get(u, bin) {
  const r = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(r.status + ' ' + u);
  return bin ? Buffer.from(await r.arrayBuffer()) : r.text();
}

(async () => {
  fs.mkdirSync(path.join(OUT, 'files'), { recursive: true });
  const map = {};
  let dl = 0;
  for (const u of urls) {
    const css = await get(u);
    // Bloecke "/* latin */ @font-face {...}" - nur latin und latin-ext behalten.
    const blocks = css.split(/(?=\/\* [a-z-]+ \*\/)/).filter(b => /^\/\* (latin|latin-ext) \*\//.test(b));
    if (!blocks.length) throw new Error('keine latin-Bloecke: ' + u);
    let out = '';
    for (let b of blocks) {
      for (const [, src] of b.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)) {
        const rel = 'files/' + new URL(src).pathname.split('/').slice(2).join('_');
        const dest = path.join(OUT, rel);
        if (!fs.existsSync(dest)) { fs.writeFileSync(dest, await get(src, true)); dl++; }
        b = b.split(src).join(rel);
      }
      out += b;
    }
    const name = nameOf(u) + '.css';
    fs.writeFileSync(path.join(OUT, name), '/* Quelle: ' + u + ' */\n' + out);
    map[u] = name;
  }

  let changed = 0;
  for (const f of files) {
    const p = path.join(ROOT, f);
    const src = fs.readFileSync(p, 'utf8');
    let txt = src;
    if (f.endsWith('.html')) {
      const pre = f === '404.html' ? '/' : '../'.repeat(f.split('/').length - 1);
      txt = txt.replace(RX, m => pre + 'vendor/fonts/' + map[norm(m)]);
    } else {
      // href="URL" steht in js/ nur in Template-Literalen (HTML fuer Popups) -> ${FONT_BASE}<name>;
      // "URL" / 'URL' als ganzer String -> FONT_BASE + '<name>'.
      txt = txt.replace(new RegExp(`href="(${RX.source})"`, 'g'), (_, m) => 'href="${FONT_BASE}' + map[norm(m)] + '"');
      txt = txt.replace(new RegExp(`(["'])(${RX.source})\\1`, 'g'), (_, q, m) => `FONT_BASE + '${map[norm(m)]}'`);
      txt = txt.replace(RX, m => '${FONT_BASE}' + map[norm(m)]);
    }
    // preconnect auf Google ist ohne Google-Schriften sinnlos
    txt = txt.replace(/^[ \t]*<link[^>]+rel="preconnect"[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\r?\n/gm, '');
    if (txt !== src) { fs.writeFileSync(p, txt); changed++; }
  }
  console.log(`${urls.size} Adressen, ${dl} Schriftdateien neu geladen, ${changed} Dateien umgestellt`);
})().catch(e => { console.error(e); process.exit(1); });
