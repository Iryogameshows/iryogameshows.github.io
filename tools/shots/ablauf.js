// Durchlauf Host + Handy mit EINER gemeinsamen Ersatz-Datenbank (fbshared.js,
// BroadcastChannel zwischen den Tabs - die Live-Datenbank wird nie beruehrt).
//
//   cd tools/shots && node ablauf.js
//
// Prueft, was Screenshots nicht zeigen: welchen Screen das Handy in welchem
// Moment der Show hat. Fuenf Shows in einer Host-Sitzung - Feud, Trivial
// Pursuit, Jeopardy, Der Duemmste fliegt, Der Preis ist heiss: je Einrichtung
// und Intro Lobby, danach Buzzer, Rad, Eingabefeld oder Abstimmung; Stimme und
// Gebot gehen vom Handy zum Host; 48-h-Ablauf von Teams; Spieleruebersicht
// "zuletzt". Zeilen mit INFO sind Beobachtungen ohne Soll-Wert. Entstanden 2026-10-13 (HANDOFF a0468d9 und folgende).
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
      // Mitspieler ohne Handy-Tab fuer DDF und PIH (Teilnehmer-Auswahl).
      anna: { name: 'Anna', team: null, avatar: '🦊', color: '#22C55E', seen: now, stats: { buzzes: 0, wins: 0, games: 0 } },
      bert: { name: 'Bert', team: null, avatar: '🐻', color: '#F59E0B', seen: now, stats: { buzzes: 0, wins: 0, games: 0 } },
      carla: { name: 'Carla', team: null, avatar: '🐱', color: '#A855F7', seen: now, stats: { buzzes: 0, wins: 0, games: 0 } },
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

  await host.evaluate(() => { tpQuit(); });
  await warte(300);

  const weg = () => host.evaluate(() => document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay,.tut-overlay').forEach(e => e.remove()));
  const start = fn => host.evaluate(fn => { const r = Math.random; Math.random = () => 0; window[fn](); Math.random = r; }, fn);

  // ── Show 3: Jeopardy ──
  await host.evaluate(() => { showScreen('menu-screen'); showScreen('jeopardy-setup-screen'); });
  await warte(400);
  check('Jeopardy-Einrichtung: Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await start('startJeopardyActual');
  await warte(500);
  check('Jeopardy-Intro laeuft: Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await weg();
  // Normales Feld (kein Daily Double, keine Eingabefrage): Buzzer.
  const feld = await host.evaluate(() => {
    showScreen('jeopardy-screen'); renderJeopardyScores(); renderJeopardyBoard();
    const b = jeopardyState.currentBoard, cats = jeopardyData.boards[b].categories;
    for (let c = 0; c < cats.length; c++) for (let r = 0; r < cats[c].clues.length; r++)
      if (!jeopardyIsDaily(c, r) && !jeopardyTyped(jeopardyClue(b, c, r))) { openJeopardyClue(c, r); return [c, r]; }
    return null;
  });
  await warte(400);
  check('Jeopardy-Frage geoeffnet: Handy am Buzzer', feld && (await screen()) === 'screen-buzz', { feld, screen: await screen() });
  // Eingabefrage (Schaetzfrage): Eingabefeld statt Buzzer.
  const feld2 = await host.evaluate(() => {
    jeopardyBuzzClose(); closeJeopardyClue(); jeopardyState.currentClue = null; jeopardyState.ddPending = false;
    const b = jeopardyState.currentBoard, cats = jeopardyData.boards[b].categories;
    for (let c = 0; c < cats.length; c++) for (let r = 0; r < cats[c].clues.length; r++)
      if (!jeopardyIsDaily(c, r) && !jeopardyState.used[c][r] && !(c === 0 && r === 0 && false)) {
        const cl = jeopardyClue(b, c, r); if (jeopardyState.currentClue) return null;
        if (cl && !(jeopardyState.used[c][r])) { cl.estimate = true; openJeopardyClue(c, r); return [c, r]; }
      }
    return null;
  });
  await warte(400);
  check('Jeopardy-Schaetzfrage: Handy im Eingabefeld', feld2 && (await screen()) === 'screen-estimate', { feld2, screen: await screen() });
  await host.evaluate(() => { jeopardyEstimateClose(); closeJeopardyClue(); jeopardyBuzzClose(); showScreen('menu-screen'); });
  await warte(300);

  // ── Show 4: Der Duemmste fliegt ──
  await host.evaluate(() => showScreen('ddf-setup-screen'));
  await warte(500);
  check('DDF-Einrichtung: Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await host.evaluate(() => Object.assign(roster('ddf'), { selected: new Set(['sony', 'anna', 'bert', 'carla']), guests: [], seeded: true }));
  await start('startDdf');
  await warte(500);
  check('DDF-Intro laeuft: Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await weg();
  await host.evaluate(() => { showScreen('ddf-screen'); ddfRenderRound(); });
  await warte(300);
  check('DDF Fragerunde (kein Buzzer im Spiel): Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await host.evaluate(() => { ddfReveal(); ddfBeginVote(); });
  await warte(400);
  check('DDF Abstimmung: Handy stimmt ab', (await screen()) === 'screen-vote', await screen());
  // Handy stimmt wirklich ab (erster Kandidat), dann wertet der Host aus.
  await handy.evaluate(() => sendVote(voteCands[0].key));
  await warte(400);
  check('DDF Stimme vom Handy kommt beim Host an', await host.evaluate(() => Object.keys(ddfState.votes || {}).length === 1), await host.evaluate(() => ddfState.votes));
  await host.evaluate(() => ddfEvaluateVote());
  await warte(400);
  check('DDF nach der Auswertung: Abstimmung auf dem Handy zu', (await screen()) !== 'screen-vote', await screen());
  console.log('INFO DDF nach der Abstimmung zeigt das Handy:', await screen());
  await host.evaluate(() => ddfQuit());
  await warte(300);

  // ── Show 5: Der Preis ist heiss ──
  await host.evaluate(() => { showScreen('menu-screen'); showScreen('pih-setup-screen'); });
  await warte(500);
  check('PIH-Einrichtung: Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await host.evaluate(() => Object.assign(roster('pih'), { selected: new Set(['sony', 'anna', 'bert', 'carla']), guests: [], seeded: true }));
  await start('startPih');
  await warte(500);
  check('PIH-Intro laeuft: Handy in der Lobby', (await screen()) === 'screen-lobby', await screen());
  await weg();
  await host.evaluate(() => { showScreen('pih-screen'); pihRenderRound(); pihBeginBids(); });
  await warte(400);
  check('PIH Gebote offen: Handy im Eingabefeld', (await screen()) === 'screen-estimate', await screen());
  // Handy bietet wirklich, dann wertet der Host aus.
  await handy.fill('#est-input', '42'); await handy.click('#est-send');
  await warte(400);
  check('PIH Gebot vom Handy kommt beim Host an', await host.evaluate(() => Object.keys(pihState.bids || {}).length === 1), await host.evaluate(() => pihState.bids));
  await host.evaluate(() => pihEvaluate());
  await warte(400);
  check('PIH nach der Auswertung: Eingabe auf dem Handy zu', (await screen()) !== 'screen-estimate', await screen());
  console.log('INFO PIH nach der Auswertung zeigt das Handy:', await screen());
  await host.evaluate(() => pihQuit());
  await warte(300);

  // ── Spieleruebersicht ──
  await host.evaluate(() => { openPlayersScreen('menu-screen'); });
  await warte(400);
  const txt = await host.evaluate(() => document.getElementById('players-content').innerText);
  check('Uebersicht zeigt "zuletzt" fuer Offline-Spieler', /Alt[\s\S]*zuletzt vor 2 Tagen/.test(txt), txt.replace(/\s+/g, ' ').slice(0, 300));
  await host.screenshot({ path: OUT + '/ablauf-spieler.png' });

  check('Keine JS-Fehler Host', errors.host.length === 0, errors.host);
  check('Keine JS-Fehler Handy', errors.handy.length === 0, errors.handy);
  await browser.close(); srv.close();
  console.log(`\n${ok} OK, ${fail} FEHL`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
