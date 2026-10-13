// Durchlauf Host + Handy mit EINER gemeinsamen Ersatz-Datenbank (fbshared.js,
// BroadcastChannel zwischen den Tabs - die Live-Datenbank wird nie beruehrt).
//
//   cd tools/shots && node ablauf.js
//
// Prueft, was Screenshots nicht zeigen: welchen Screen das Handy in welchem
// Moment der Show hat. Zwei Shows hintereinander (Feud, dann Trivial Pursuit):
// Handy im Intro in der Lobby, nach der ersten Frage am Buzzer, bei der
// zweiten Einrichtung wieder in der Lobby; 48-h-Ablauf von Teams; Spieler-
// uebersicht "zuletzt". Entstanden 2026-10-13 (HANDOFF a0468d9 und folgende).
// Endet mit Code 1, wenn ein Punkt fehlschlaegt.
'use strict';
const REPO = require('path').resolve(__dirname, '..', '..');
const { chromium } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path');
const STUB = fs.readFileSync(path.join(__dirname, 'fbshared.js'), 'utf8');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.gif': 'image/gif' };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(REPO, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
let ok = 0, fail = 0;
const check = (n, c, i) => { (c ? ok++ : fail++); console.log((c ? 'OK   ' : 'FEHL ') + n + (i === undefined ? '' : '  ' + JSON.stringify(i))); };
const warte = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch({ executablePath: [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(p => p && fs.existsSync(p)), headless: true });
  const ctx = await browser.newContext();
  await ctx.route('**/firebase-database-compat.js', r => r.fulfill({ contentType: 'application/javascript', body: STUB }));
  const errors = { host: [], handy: [] };

  const host = await ctx.newPage(); await host.setViewportSize({ width: 1280, height: 720 });
  host.on('pageerror', e => errors.host.push(String(e))); host.on('dialog', d => d.accept());
  await host.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await host.waitForFunction(() => typeof lobbyNeueShow === 'function' && document.readyState !== 'loading');
  await host.evaluate(() => { const g = document.getElementById('host-gate'); if (g) g.style.display = 'none'; window.open = () => null; if (window.SFX) SFX.enabled = false; });
  // Accounts anlegen: Sony (wird gleich am Handy eingeloggt), Alt (49 h weg, Team 1)
  await host.evaluate(() => {
    const H = 3600000, now = Date.now();
    firebase.database().ref('buzzer/players').set({
      sony: { name: 'Sony', team: 0, avatar: '😀', color: '#E8453C', stats: { buzzes: 0, wins: 0, games: 0 } },
      alt: { name: 'Alt', team: 1, avatar: '🙂', color: '#3B82F6', seen: now - 49 * H, stats: { buzzes: 0, wins: 0, games: 0 } },
    });
  });

  const handy = await ctx.newPage(); await handy.setViewportSize({ width: 390, height: 844 });
  handy.on('pageerror', e => errors.handy.push(String(e)));
  await handy.addInitScript(() => localStorage.setItem('buzzAccount', JSON.stringify({ key: 'sony', name: 'Sony', avatar: '😀', color: '#E8453C', pin: '1' })));
  await handy.goto(base + '/buzzer/', { waitUntil: 'domcontentloaded' });
  await handy.waitForFunction(() => typeof refreshRoot === 'function');
  await warte(800);
  const screen = () => handy.evaluate(() => (document.querySelector('.screen.active') || {}).id || '-');

  check('Handy nach Login: Lobby', (await screen()) === 'screen-lobby', await screen());
  check('Handy hat seen gestempelt', typeof (await host.evaluate(() => __fbGet('buzzer/players/sony/seen'))) === 'number');

  // ── Show 1: Feud ──
  await host.evaluate(() => showScreen('setup-screen'));
  await warte(400);
  const nachSetup = await host.evaluate(() => ({ alt: __fbGet('buzzer/players/alt/team'), sony: __fbGet('buzzer/players/sony/team') }));
  check('Einrichtung: Alt (49 h) Team weg, Sony behaelt Team', nachSetup.alt === null && nachSetup.sony === 0, nachSetup);
  await host.evaluate(() => { const r = Math.random; Math.random = () => 0; startGameActual(); Math.random = r; });
  await warte(500);
  check('Feud-Intro laeuft: Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await host.evaluate(() => { document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay,.tut-overlay').forEach(e => e.remove()); showScreen('game-screen'); loadRound(); });
  await warte(500);
  check('Feud erste Frage vorbereitet: Handy am Buzzer', (await screen()) === 'screen-buzz', await screen());
  await host.evaluate(() => revealQuestion());
  await warte(300);
  check('Frage aufgedeckt: Buzzer scharf', await handy.evaluate(() => !document.getElementById('buzz').disabled));
  await host.evaluate(() => { feudBuzzEndRound(); });
  await warte(300);
  check('Zwischen zwei Fragen: Handy bleibt am Buzzer', (await screen()) === 'screen-buzz', await screen());
  // Feud verlassen (wie ueber das Menue)
  await host.evaluate(() => { feudBuzzDisconnect(); showScreen('menu-screen'); });
  await warte(300);

  // ── Show 2: Trivial Pursuit, gleiche Host-Sitzung ──
  await host.evaluate(() => showScreen('tp-setup-screen'));
  await warte(400);
  check('Zweite Einrichtung (TP): Handy zurueck in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await host.evaluate(() => { const r = Math.random; Math.random = () => 0; startTp(); Math.random = r; });
  await warte(500);
  check('TP-Intro laeuft: Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await host.evaluate(() => { document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay,.tut-overlay').forEach(e => e.remove()); showScreen('tp-screen'); tpBuildWheel(); tpRender(); });
  await warte(500);
  check('TP nach Intro: Team Rot (Sony) bekommt das Rad', (await screen()) === 'screen-tpspin', await screen());
  await handy.screenshot({ path: OUT + '/ablauf-tpspin.png' });

  // ── Spieleruebersicht ──
  await host.evaluate(() => { tpQuit(); openPlayersScreen('menu-screen'); });
  await warte(400);
  const txt = await host.evaluate(() => document.getElementById('players-content').innerText);
  check('Uebersicht zeigt "zuletzt" fuer Offline-Spieler', /Alt[\s\S]*zuletzt vor 2 Tagen/.test(txt), txt.replace(/\s+/g, ' ').slice(0, 300));
  await host.screenshot({ path: OUT + '/ablauf-spieler.png' });

  check('Keine JS-Fehler Host', errors.host.length === 0, errors.host);
  check('Keine JS-Fehler Handy', errors.handy.length === 0, errors.handy);
  await browser.close(); srv.close();
  console.log(`\n${ok} OK, ${fail} FEHL`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
