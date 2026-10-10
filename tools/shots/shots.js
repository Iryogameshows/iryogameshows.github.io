// Screenshot-Pruefung: alle Design-Richtungen in allen Shows auf einen Blick.
//
// Warum es das gibt: am 2026-10-10 fiel erst David auf, dass die Richtung E
// gar kein Spielbrett hatte und GM-Fenster, Gamepad und Handy-Buzzer in
// keiner Richtung gestaltet waren (HANDOFF 431a43e). Jede Scheibe war fuer
// sich geprueft, das Ganze nie. Dieses Skript macht "Design kaputt" zu einer
// Pruefung wie check.js statt zu einem Zufallsfund.
//
//   cd tools/shots && npm install        (einmal pro Geraet)
//   node shots.js                        alle Shows, alle Richtungen, 1280x720
//   node shots.js --shows jeop,buzzer --themes E,J --size 1920x1080
//   node shots.js --basis                Studio-Blau als Vergleichsstand merken
//   node shots.js --vergleich            Studio-Blau gegen den Stand vergleichen
//
// Ergebnis in tools/shots/out/: je Show ein Kontaktbogen bogen-<show>.png
// (alle Richtungen nebeneinander) und die Einzelbilder. Am Ende eine Liste
// der Befunde; gibt es welche, endet das Skript mit Code 1.
//
// Gemessen wird je Bild: JavaScript-Fehler der Seite, ob die Richtung
// angekommen ist (data-theme), und ob der Screen hoeher ist als das Fenster
// (dann steht unten etwas ausserhalb des Beamer-Bildes).
//
// Firebase: firebase-database-compat.js wird durch fbstub.js ersetzt, bevor
// die Seite laedt. Es gibt also keine Verbindung zur Live-Datenbank, auch
// nicht durch das Schreiben beim Laden der Hostseite (BAUPLAN 5).
//
// Der Browser ist ein vorhandener Chrome oder Edge (playwright-core laedt
// keinen eigenen). Anderer Pfad: Umgebungsvariable CHROME.
'use strict';
const { chromium } = require('playwright-core');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const STUB = fs.readFileSync(path.join(__dirname, 'fbstub.js'), 'utf8');
const ALLE_RICHTUNGEN = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
const ALLE_SHOWS = ['feud', 'jeop', 'wwm', 'wwds', 'gm', 'buzzer', 'buzzer-login'];

// ── Argumente ──
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : dflt; };
const flag = (name) => args.includes('--' + name);
const SHOWS = opt('shows', ALLE_SHOWS.join(',')).split(',');
const THEMES = flag('basis') || flag('vergleich') ? [''] : (opt('themes') !== undefined ? opt('themes').split(',').map(t => (t === 'Studio' || t === 'X') ? '' : t) : ALLE_RICHTUNGEN);
const [W, H] = opt('size', '1280x720').split('x').map(Number);
const OUT = path.resolve(opt('out', path.join(__dirname, 'out')));
fs.mkdirSync(OUT, { recursive: true });

// ── Statischer Server ueber das Repo - unabhaengig vom Dev-Server ──
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
function server() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => resolve(s));
  });
}

function browserPfad() {
  const kandidaten = [process.env.CHROME,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  const p = kandidaten.find(k => k && fs.existsSync(k));
  if (!p) { console.error('Kein Chrome/Edge gefunden. Pfad per Umgebungsvariable CHROME angeben.'); process.exit(2); }
  return p;
}

// ── Aufbau je Show, laeuft in der Seite ──
// Spielstart wie im echten Ablauf, Intro und Overlays danach weggeraeumt.
// Math.random steht beim Start auf 0, damit Startteam und Reihenfolge der
// Fragen in jedem Lauf gleich sind (fuer --vergleich).
const AUFBAU = {
  feud: () => {
    const mr = Math.random; Math.random = () => 0; startGameActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('game-screen'); loadRound(); revealQuestion(); revealAnswer(0); revealAnswer(2);
  },
  jeop: () => {
    const mr = Math.random; Math.random = () => 0; startJeopardyActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('jeopardy-screen');
    jeopardyState.used[0][0] = true; jeopardyState.used[2][1] = true;
    renderJeopardyScores(); renderJeopardyBoard();
  },
  wwm: () => {
    startWwmActual();
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('wwm-screen'); loadWwmQuestion();
  },
  wwds: () => {
    const mr = Math.random; Math.random = () => 0; startWwdsActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
  },
};
AUFBAU.gm = AUFBAU.feud;

async function hostSeite(page, base, show, t) {
  await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof startGameActual === 'function' && document.readyState !== 'loading');
  await page.evaluate(async (t) => {
    const g = document.getElementById('host-gate'); if (g) g.style.display = 'none';
    if (window.SFX) SFX.enabled = false;
    applyTheme(t);
    await document.fonts.ready;
  }, t);
  await page.evaluate(AUFBAU[show]);
  // WWM/WWDS oeffnen das GM-Fenster mit Verzoegerung - erst danach ausblenden.
  await page.waitForTimeout(1400);
  await page.evaluate(async () => { await document.fonts.ready; });
  if (show === 'gm') {
    await page.evaluate(() => { updateGamemaster(); document.getElementById('gm-embed-overlay').classList.add('visible'); });
    await page.waitForTimeout(500);
  } else {
    await page.evaluate(() => { const o = document.getElementById('gm-embed-overlay'); if (o) o.classList.remove('visible'); });
    await page.waitForTimeout(200);
  }
}

async function handySeite(page, base, show, t) {
  await page.goto(base + '/buzzer/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof __fbSet === 'function' && typeof applyBuzzColor === 'function');
  await page.evaluate((t) => __fbSet('design', t), t);
  await page.waitForTimeout(300);
  await page.evaluate(async () => { await document.fonts.ready; });
  if (show === 'buzzer') {
    await page.evaluate(() => {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('screen-buzz').classList.add('active');
      const chip = document.getElementById('team-chip'); chip.textContent = 'Team Rot'; chip.style.background = '#E8453C';
      applyBuzzColor(0);
      const b = document.getElementById('buzz'); b.disabled = false; b.classList.add('armed');
      const st = document.getElementById('status'); st.textContent = 'BEREIT — jetzt buzzern!'; st.style.color = 'var(--accent-text)';
      document.getElementById('hint').textContent = 'Platz 2';
    });
  }
  await page.waitForTimeout(400);
}

// Berechnete Stile aller sichtbaren Elemente - fuer --basis/--vergleich.
const STIL_SCHNAPPSCHUSS = () => {
  const felder = ['color', 'backgroundColor', 'backgroundImage', 'fontFamily', 'fontSize', 'fontWeight', 'borderTopColor', 'borderRadius', 'boxShadow', 'width', 'height', 'paddingTop', 'marginTop'];
  const wurzel = document.querySelector('.screen.active') || document.body;
  const res = {};
  wurzel.querySelectorAll('*').forEach((e, i) => {
    if (/^(SCRIPT|STYLE|LINK)$/.test(e.tagName) || !e.getClientRects().length) return;
    const c = getComputedStyle(e);
    res[i + ':' + e.tagName + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '')] = felder.map(f => c[f]).join(' | ');
  });
  return res;
};

async function kontaktbogen(page, show, bilder) {
  if (!bilder.length) return;
  const spalten = show.startsWith('buzzer') ? 10 : 4;
  const html = bilder.map(([t, f]) => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption>${t}</figcaption></figure>`).join('');
  await page.setViewportSize({ width: 2000, height: 1000 });
  await page.setContent(`<style>body{margin:0;background:#777;display:grid;grid-template-columns:repeat(${spalten},1fr);gap:4px;font:bold 20px sans-serif}figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;right:0;bottom:0;background:#000;color:#ff0;padding:2px 8px}</style>${html}`);
  await page.screenshot({ path: path.join(OUT, `bogen-${show}.png`), fullPage: true });
}

(async () => {
  const srv = await server();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ executablePath: browserPfad(), headless: true });
  const ctx = await browser.newContext();
  await ctx.route('**/firebase-database-compat.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
  await ctx.route(/firebasedatabase\.app|firebaseio\.com/, r => r.abort());
  await ctx.addInitScript(() => { window.alert = () => {}; window.confirm = () => true; window.open = () => null; });
  const page = await ctx.newPage();
  const befunde = [];
  let fehler = [];
  page.on('pageerror', e => fehler.push(e.message));

  for (const show of SHOWS) {
    if (!AUFBAU[show] && !show.startsWith('buzzer')) { befunde.push(`unbekannte Show: ${show}`); continue; }
    const handy = show.startsWith('buzzer');
    const bilder = [];
    for (const t of THEMES) {
      const name = t || 'Studio';
      fehler = [];
      await page.setViewportSize(handy ? { width: 390, height: 844 } : { width: W, height: H });
      try {
        if (handy) await handySeite(page, base, show, t); else await hostSeite(page, base, show, t);
      } catch (e) { befunde.push(`${show} ${name}: Aufbau fehlgeschlagen - ${e.message.split('\n')[0]}`); continue; }
      const m = await page.evaluate(() => ({
        theme: document.documentElement.getAttribute('data-theme') || '',
        ueber: document.documentElement.scrollHeight - innerHeight,
        screen: (document.querySelector('.screen.active') || {}).id || '',
      }));
      if (m.theme !== t) befunde.push(`${show} ${name}: data-theme ist "${m.theme}"`);
      if (!handy && show !== 'gm' && m.ueber > 1) befunde.push(`${show} ${name}: ${m.ueber} px hoeher als das Fenster (${W}x${H}, Screen ${m.screen})`);
      fehler.forEach(f => befunde.push(`${show} ${name}: JS-Fehler - ${f}`));
      const datei = path.join(OUT, `${show}-${name}.png`);
      if (show === 'gm') await page.locator('#gm-embed-frame').screenshot({ path: datei });
      else await page.screenshot({ path: datei });
      bilder.push([name, datei]);

      if (flag('basis') || flag('vergleich')) {
        const stil = show === 'gm'
          ? await (await (await page.$('#gm-embed-frame')).contentFrame()).evaluate(STIL_SCHNAPPSCHUSS)
          : await page.evaluate(STIL_SCHNAPPSCHUSS);
        const f = path.join(OUT, `basis-${show}-${W}x${H}.json`);
        if (flag('basis')) { fs.writeFileSync(f, JSON.stringify(stil, null, 1)); console.log(`${show}: Basis mit ${Object.keys(stil).length} Elementen gemerkt`); }
        else if (!fs.existsSync(f)) befunde.push(`${show}: keine Basis (${path.basename(f)}) - erst mit --basis anlegen`);
        else {
          const alt = JSON.parse(fs.readFileSync(f, 'utf8'));
          const schluessel = [...new Set([...Object.keys(alt), ...Object.keys(stil)])];
          const anders = schluessel.filter(k => alt[k] !== stil[k]);
          console.log(`${show}: ${schluessel.length} Elemente verglichen, ${anders.length} abweichend`);
          anders.slice(0, 8).forEach(k => befunde.push(`${show} Studio-Blau weicht ab: ${k}\n    alt ${alt[k] || '(fehlt)'}\n    neu ${stil[k] || '(fehlt)'}`));
          if (anders.length > 8) befunde.push(`${show}: ... und ${anders.length - 8} weitere Abweichungen`);
        }
      }
      // Schreibversuche zaehlen nur zur Kontrolle - die Live-DB erreicht keiner.
      const w = await page.evaluate(() => (window.__fbWrites || []).length);
      console.log(`${show.padEnd(12)} ${name.padEnd(6)} ${m.screen || '-'}  ${m.ueber > 1 ? m.ueber + ' px zu hoch' : 'passt'}  (${w} Schreibversuche abgefangen)`);
    }
    if (!flag('basis') && !flag('vergleich')) await kontaktbogen(page, show, bilder);
  }

  await browser.close();
  srv.close();
  console.log(`\nBilder: ${OUT}`);
  if (befunde.length) { console.log(`\n${befunde.length} Befund(e):`); befunde.forEach(b => console.log('  - ' + b)); process.exit(1); }
  console.log('\nkeine Befunde');
})().catch(e => { console.error('FEHLER', e.message); process.exit(2); });
