// Show mit echten Geraeteprofilen: Host (Chrome, 1280x720), vier Spieler-
// Handys - zwei iPhones in WebKit (Safari-Engine), zwei Androids in Chromium -
// und das Gamepad auf einem iPhone. Alle haengen an EINER Ersatz-Datenbank
// (relay.js im Testprozess, fbrelay.js im Browser); die Live-Datenbank wird nie
// beruehrt.
//
//   cd tools/shots && node geraete.js
//
// Einmal pro Geraet vorher: npx playwright@1.48.2 install webkit
// (Version = playwright-core in package.json).
//
// Prueft: Anmelden auf drei Wegen (gespeichert, PIN getippt, neuer Account),
// Feud-Intro und Tutorial vom Gamepad, Buzzer-Wettlauf mit Server-Zeitstempel
// (alle Handys zeigen dieselbe Reihenfolge), Leitung mit 350 ms Verzoegerung,
// zu frueh gedrueckt (Sperre), Netzabriss am Handy und am Gamepad (Banner,
// Presence, Befehl wartet und kommt nach), Neuladen von Handy und Host mitten
// im Spiel, Nachzuegler wird gesperrt, Beenden vom Gamepad (iOS-Rueckfrage),
// Trivial-Pursuit-Rad mit zwei gleichzeitigen Fingern (genau ein Dreh),
// DDF-Abstimmung und Preis-ist-heiss-Gebote von allen vier Handys per
// Antippen bzw. Tippen. Je Handy und Zustand: kein waagerechtes Scrollen,
// keine JS-Fehler. Bilder nach out/geraete-*.png.
//
// Was hier NICHT abgedeckt ist: echtes iOS (WebKit unter Windows ist dieselbe
// Engine, aber nicht iOS-Safari), Bildschirmsperre/Wake-Lock, App-Wechsel,
// echte Funkaussetzer, wie es sich in der Hand anfuehlt.
// Endet mit Code 1, wenn ein Punkt fehlschlaegt.
'use strict';
const REPO = require('path').resolve(__dirname, '..', '..');
const { chromium, webkit, devices } = require('playwright-core');
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const relay = require('./relay')();
const STUB = fs.readFileSync(path.join(__dirname, 'fbrelay.js'), 'utf8');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.gif': 'image/gif', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((req, res) => {
  if (relay.handle(req, res)) return;
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(REPO, p);
  if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
let ok = 0, fail = 0;
const check = (n, c, i) => { (c ? ok++ : fail++); console.log((c ? 'OK   ' : 'FEHL ') + n + (i === undefined ? '' : '  ' + JSON.stringify(i))); };
const warte = ms => new Promise(r => setTimeout(r, ms));
/** Bedingung bis zu ms Millisekunden lang abfragen. */
async function bis(fn, ms = 4000) { const ende = Date.now() + ms; for (;;) { try { if (await fn()) return true; } catch {} if (Date.now() > ende) return false; await warte(100); } }
const hashPin = (name, pin) => crypto.createHash('sha256').update('keller:' + name.trim().toLowerCase() + ':' + pin).digest('hex');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(p => p && fs.existsSync(p));

(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const stub = STUB.split('__BASIS__').join(base);
  const browser = { chromium: await chromium.launch({ executablePath: CHROME, headless: true }), webkit: await webkit.launch({ headless: true }) };
  const errors = {};

  // Startdaten: drei Accounts, Carla legt sich ihren erst am Handy an.
  const now = Date.now();
  relay.set('buzzer/players', {
    sony: { name: 'Sony', team: 0, avatar: '😀', color: '#E8453C', seen: now, stats: { buzzes: 0, wins: 0, games: 0 } },
    anna: { name: 'Anna', team: 1, avatar: '🦊', color: '#22C55E', seen: now, stats: { buzzes: 0, wins: 0, games: 0 } },
    bert: { name: 'Bert', team: 0, avatar: '🐻', color: '#F59E0B', pin: hashPin('Bert', '12345'), seen: now, stats: { buzzes: 0, wins: 0, games: 0 } },
  });

  /** Neues Geraet: eigener Kontext (eigener Speicher, eigenes Profil), Firebase umgeleitet. */
  async function geraet(name, engine, profil, opts = {}) {
    const p = Object.assign({}, profil); delete p.defaultBrowserType;
    const ctx = await browser[engine].newContext(Object.assign(p, { locale: 'de-DE' }));
    await ctx.addInitScript(g => { window.__geraet = g; }, name);
    if (opts.konto) await ctx.addInitScript(k => { try { if (!localStorage.getItem('buzzAccount')) localStorage.setItem('buzzAccount', JSON.stringify(k)); } catch {} }, opts.konto);
    await ctx.route('**/firebase-database-compat.js', r => r.fulfill({ contentType: 'application/javascript', body: stub }));
    await ctx.route('**/firebase-app-compat.js', async r => {
      try { await r.fulfill({ response: await r.fetch() }); }
      catch { await r.fulfill({ contentType: 'application/javascript', body: 'window.firebase={apps:[],initializeApp(c){const a={options:c};this.apps.push(a);return a;}};' }); }
    });
    ctx.setDefaultTimeout(8000);
    const page = await ctx.newPage();
    errors[name] = [];
    /* Ausgenommen: WebKit meldet einen Abbruch der Test-Datenbank-Verbindung
       (EventSource auf /__fb/events, z. B. wenn das Gamepad sein iframe neu
       aufbaut) als "access control checks". Das betrifft nur das Testwerkzeug;
       fbrelay.js verbindet neu und holt den vollen Stand. */
    page.on('pageerror', e => { const t = String(e); if (/EventSource cannot load .*\/__fb\/events/.test(t)) return; errors[name].push(t.slice(0, 200)); });
    page.on('dialog', d => d.accept());
    return page;
  }

  // ── Host ──
  const host = await geraet('host', 'chromium', { viewport: { width: 1280, height: 720 } });
  await host.goto(base + '/', { waitUntil: 'domcontentloaded' });
  await host.waitForFunction(() => typeof lobbyNeueShow === 'function' && document.readyState !== 'loading');
  const hostVorbereiten = () => host.evaluate(() => { const g = document.getElementById('host-gate'); if (g) g.style.display = 'none'; window.open = () => null; if (window.SFX) SFX.enabled = false; });
  await hostVorbereiten();
  await host.evaluate(() => showScreen('setup-screen'));

  // ── Handys ──
  const handys = [
    { name: 'iphone15', engine: 'webkit', profil: devices['iPhone 15'], konto: { key: 'sony', name: 'Sony', avatar: '😀', color: '#E8453C', pin: '1' } },
    { name: 'iphoneSE', engine: 'webkit', profil: devices['iPhone SE'], konto: { key: 'anna', name: 'Anna', avatar: '🦊', color: '#22C55E', pin: '1' } },
    { name: 'pixel7', engine: 'chromium', profil: devices['Pixel 7'] },
    { name: 'galaxyS9', engine: 'chromium', profil: devices['Galaxy S9+'] },
  ];
  for (const h of handys) {
    h.page = await geraet(h.name, h.engine, h.profil, { konto: h.konto });
    await h.page.goto(base + '/buzzer/', { waitUntil: 'domcontentloaded' });
  }
  const H = Object.fromEntries(handys.map(h => [h.name, h]));
  const screen = h => h.page.evaluate(() => (document.querySelector('.screen.active') || {}).id || '-');
  const screens = async () => Object.fromEntries(await Promise.all(handys.map(async h => [h.name, await screen(h)])));
  const alle = async id => bis(async () => Object.values(await screens()).every(s => s === id), 5000);
  async function passt(label) {
    for (const h of handys) {
      const r = await h.page.evaluate(() => ({ breit: document.documentElement.scrollWidth, fenster: innerWidth }));
      if (r.breit > r.fenster + 1) check(`${label}: ${h.name} ohne waagerechtes Scrollen`, false, r);
    }
  }
  async function bilder(label) { for (const h of handys) await h.page.screenshot({ path: `${OUT}/geraete-${label}-${h.name}.png` }); }

  // Pixel 7: PIN tippen. Galaxy: neuen Account anlegen.
  const px = H.pixel7.page;
  await px.waitForSelector('#login-name', { state: 'visible' });
  await px.locator('#login-name').tap(); await px.keyboard.type('Bert');
  await px.locator('#login-pin').tap(); await px.keyboard.type('12345');
  await px.locator('#screen-login .btn').tap();
  const gx = H.galaxyS9.page;
  await gx.waitForSelector('#login-name', { state: 'visible' });
  await gx.locator('#login-name').tap(); await gx.keyboard.type('Carla');
  await gx.locator('#login-pin').tap(); await gx.keyboard.type('carla1');
  await gx.locator('#screen-login .btn').tap();
  check('Galaxy: neuer Name fuehrt zum Account-Anlegen', await bis(async () => (await screen(H.galaxyS9)) === 'screen-signup', 10000));
  await gx.locator('#screen-signup .btn:not(.ghost)').tap();
  check('Alle vier Handys angemeldet und in der Lobby', await alle('screen-lobby'), await screens());
  check('Carla-Account liegt in der Datenbank, PIN gehasht', relay.get('buzzer/players/carla/pin') === hashPin('Carla', 'carla1'));
  check('Host sieht vier Handys (Presence)', await bis(() => Object.keys(relay.get('buzzer/presence') || {}).length === 4), Object.keys(relay.get('buzzer/presence') || {}));
  relay.set('buzzer/players/carla/team', 1);   // Teams: Rot = Sony, Bert; Blau = Anna, Carla
  await passt('Lobby'); await bilder('lobby');

  // ── Gamepad ──
  const pad = await geraet('gamepad', 'webkit', devices['iPhone 15 Pro Max']);
  await pad.goto(base + '/gamepad/', { waitUntil: 'domcontentloaded' });
  const gp = pad.frameLocator('#gmFrame');
  const gpKnopf = t => gp.locator('button', { hasText: t });
  /* Buzzern per Touch. Unter Last (CI, paralleler Lauf) kam ein WebKit-Tap
     gelegentlich nicht als pointerdown an - der Wettlauf zaehlte dann nur zwei
     Buzzes und drei Folgepunkte schlugen fehl (2026-10-13, 1 von 7 Laeufen).
     Deshalb: tippen, bis das Handy selbst "gebuzzert" meldet, hoechstens 3x.
     force: der scharfe Buzzer pulsiert (CSS-Animation); ohne force wartet
     Playwright, bis er stillsteht - in WebKit oft nie, beide iPhones fielen
     dann ganz aus (4 von 10 Laeufen). Ein Finger wartet auch nicht. */
  const buzzere = async page => {
    const fehler = [];
    for (let i = 0; i < 3; i++) {
      await page.locator('#buzz').tap({ timeout: 2000, force: true }).catch(e => fehler.push(String(e).split(/\r?\n/)[0].slice(0, 120)));
      if (await bis(() => page.evaluate(() => buzzedThisRound), 800)) return true;
    }
    return { fehler, server: relay.get('buzzer/armed'), zustand: await page.evaluate(() => ({ fb: __fbGet('buzzer/armed'), fbRunde: __fbGet('buzzer/round'), runde: lastRound, aus: document.getElementById('buzz').disabled, armed, live, gesperrt: locked(), online, screen: document.querySelector('.screen.active').id,
      oben: (() => { const r = document.getElementById('buzz').getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e ? e.id || e.className : null; })() })) };
  };
  const zaehle = async loc => { for (let i = 0; ; i++) { try { return await loc.count(); } catch (e) { if (i > 6) throw e; await warte(300); } } };

  // ── Feud: Intro vom Gamepad ──
  await host.evaluate(() => { const r = Math.random; Math.random = () => 0; startGameActual(); Math.random = r; });
  check('Feud-Intro: alle Handys in der Lobby', await alle('screen-lobby'), await screens());
  check('Gamepad zeigt die Zwischensequenz', await bis(async () => (await zaehle(gpKnopf('Weiter'))) > 0, 15000));
  for (let i = 0; i < 8 && !(await host.evaluate(() => !!activeTutorialSkip)); i++) { await gpKnopf('Weiter').first().tap(); await warte(2500); }
  check('Gamepad "Weiter" fuehrt bis ins Tutorial', await host.evaluate(() => !!activeTutorialSkip));
  check('Gamepad: "Tutorial überspringen" da', await bis(async () => (await zaehle(gpKnopf('Tutorial überspringen'))) > 0));
  await gpKnopf('Tutorial überspringen').first().tap();
  check('Tutorial vom Gamepad uebersprungen', await bis(() => host.evaluate(() => !activeTutorialSkip)));
  // Rest des Intros (Pause, zweite Begruessung) ebenfalls vom Gamepad, bis das Spiel steht.
  for (let i = 0; i < 10; i++) {
    if (await host.evaluate(() => !gmActiveOverlay() && screenActive('game-screen'))) break;
    if ((await zaehle(gpKnopf('Weiter'))) > 0) await gpKnopf('Weiter').first().tap().catch(() => {});
    await warte(2000);
  }
  check('Intro komplett vom Gamepad durchgeklickt: Spiel steht', await host.evaluate(() => !gmActiveOverlay() && screenActive('game-screen')));
  check('Erste Frage vorbereitet: alle am Buzzer', await alle('screen-buzz'), await screens());

  // Zu frueh: Galaxy drueckt, bevor die Frage aufgedeckt ist -> 3 s gesperrt.
  await gx.locator('#buzz').dispatchEvent('pointerdown', { isPrimary: true, pointerType: 'touch', button: 0 });
  check('Zu frueh gedrueckt: Galaxy kurz gesperrt', await gx.evaluate(() => locked()));

  // Wettlauf: alle vier fast gleichzeitig. Die Reihenfolge bestimmt der Server-Zeitstempel.
  await host.evaluate(() => revealQuestion());
  check('Frage aufgedeckt: Buzzer scharf (ausser dem gesperrten)', await bis(() => Promise.all(['iphone15', 'iphoneSE', 'pixel7'].map(n => H[n].page.evaluate(() => armed && !document.getElementById('buzz').disabled))).then(a => a.every(Boolean))));
  await warte(3100);   // Sperre der Galaxy laeuft ab
  /* Wie viele durchkommen, ist offen: wechselt mit dem ersten Buzz das Team,
     macht der Host den Buzzer zu (feudAutoSetStartTeam). Wer danach drueckt,
     ist zu spaet. Geprueft wird deshalb: jeder angenommene Buzz kommt an,
     keiner doppelt, und wer zu spaet war, wird nicht bestraft. */
  const NAME = { iphone15: 'Sony', iphoneSE: 'Anna', pixel7: 'Bert', galaxyS9: 'Carla' };
  const getippt = await Promise.all(handys.map(h => buzzere(h.page)));
  const angenommen = handys.filter((h, i) => getippt[i] === true).map(h => NAME[h.name]);
  await bis(async () => (await host.evaluate(() => feudBuzzer.results.length)) === angenommen.length, 5000);
  const hostReihe = await host.evaluate(() => feudBuzzer.results.map(r => r.name));
  check('Wettlauf: jeder angenommene Buzz kommt beim Host an, keiner doppelt',
    angenommen.length > 0 && hostReihe.length === angenommen.length && angenommen.every(n => hostReihe.includes(n)) && new Set(hostReihe).size === hostReihe.length, { hostReihe, angenommen });
  for (const [i, h] of handys.entries()) if (getippt[i] !== true)
    check(`Wettlauf: ${h.name} zu spaet - nicht gesperrt, "Zu spät"`, !getippt[i].zustand.gesperrt && await h.page.evaluate(() => /Zu spät/.test(document.getElementById('status').textContent)), getippt[i]);
  const handyReihen = await Promise.all(handys.map(h => h.page.evaluate(() => results.map(r => r.name))));
  check('Wettlauf: jedes Handy zeigt dieselbe Reihenfolge wie der Host', handyReihen.every(r => r.join() === hostReihe.join()), handyReihen);
  check('Gamepad: Buzzer-Liste mit dem Ersten', await bis(async () => (await gp.locator('body').textContent()).includes(hostReihe[0])));
  await passt('Buzz'); await bilder('buzz');
  // Neuladen nach dem eigenen Buzz, gleiche Runde: kein zweiter Buzz moeglich.
  // Am liebsten ein iPhone (WebKit), sonst wer eben gebuzzert hat.
  const neu = handys.find(h => h.engine === 'webkit' && hostReihe.includes(NAME[h.name])) || handys.find(h => hostReihe.includes(NAME[h.name]));
  await neu.page.reload({ waitUntil: 'domcontentloaded' });
  await bis(async () => (await screen(neu)) === 'screen-buzz', 6000);
  await warte(800);
  check(`${neu.name} neu geladen nach eigenem Buzz: Buzzer bleibt gesperrt`, await neu.page.evaluate(() => buzzedThisRound && document.getElementById('buzz').disabled),
    await neu.page.evaluate(() => ({ buzzedThisRound, aus: document.getElementById('buzz').disabled })));

  // Duell entschieden, gezielt: Team Rot ist dran, Carla (Blau) buzzert zuerst ->
  // der Host macht zu. Anna drueckt danach: "Zu spät", keine Strafe.
  await host.evaluate(() => { state.currentTeam = 0; updateActiveTeam(); feudBuzzPrepare(); feudBuzzArm(); });
  await bis(() => gx.evaluate(() => armed && !document.getElementById('buzz').disabled), 5000);
  await buzzere(gx);
  check('Duell entschieden: Host macht den Buzzer zu', await bis(() => relay.get('buzzer/armed') === false, 4000));
  const sp = H.iphoneSE.page;
  check('Duell entschieden: iPhone SE zeigt "Zu spät", Knopf aus', await bis(() => sp.evaluate(() => /Zu spät/.test(document.getElementById('status').textContent) && document.getElementById('buzz').disabled), 4000),
    await sp.evaluate(() => ({ status: document.getElementById('status').textContent, aus: document.getElementById('buzz').disabled })));
  await sp.locator('#buzz').tap({ force: true, timeout: 2000 }).catch(() => {});
  await warte(400);
  check('Duell entschieden: Druck danach bestraft nicht (keine Sperre)', await sp.evaluate(() => !locked() && !buzzedThisRound));
  await sp.screenshot({ path: `${OUT}/geraete-zuspaet-iphoneSE.png` });

  // Runde 2 mit langer Leitung am iPhone 15: es drueckt VOR dem Pixel (der Pixel
  // drueckt erst, wenn das iPhone den Druck bestaetigt hat), kommt aber 800 ms spaeter an. Wie bei Firebase gewinnt die Ankunft.
  relay.delay('iphone15', 800);
  await host.evaluate(() => { feudBuzzPrepare(); feudBuzzArm(); });
  check('Runde 2: auch das iPhone mit Verzoegerung ist scharf', await bis(() => H.iphone15.page.evaluate(() => armed && !document.getElementById('buzz').disabled), 5000));
  await buzzere(H.iphone15.page); await buzzere(px);
  await bis(() => host.evaluate(() => feudBuzzer.results.length === 2), 5000);
  const r2 = await host.evaluate(() => feudBuzzer.results.map(r => r.name));
  check('Lange Leitung: wer zuerst ANKOMMT, buzzert zuerst (Bert vor Sony)', r2.join() === 'Bert,Sony', r2);
  relay.delay('iphone15', 0);

  // ── Netzabriss Handy ──
  relay.offline('pixel7', true);
  check('Pixel offline: Banner "Verbindung verloren"', await bis(() => px.evaluate(() => document.getElementById('conn').classList.contains('show') && /Verbindung verloren/.test(document.getElementById('conn').textContent))));
  check('Pixel offline: Buzzer gesperrt', await px.evaluate(() => document.getElementById('buzz').disabled));
  check('Pixel offline: faellt beim Host aus der Presence (onDisconnect)', await bis(() => !(relay.get('buzzer/presence') || {}).bert));
  await warte(500);   // Banner faehrt in 0,25 s ein
  const ueber = await px.evaluate(() => ({ banner: document.getElementById('conn').getBoundingClientRect().bottom, knoepfe: document.getElementById('topbar').getBoundingClientRect().top }));
  check('Pixel offline: Banner verdeckt Einstellungen/Abmelden nicht', ueber.banner <= ueber.knoepfe, ueber);
  await px.screenshot({ path: `${OUT}/geraete-offline-pixel7.png` });
  relay.offline('pixel7', false);
  check('Pixel zurueck: "Wieder verbunden"', await bis(() => px.evaluate(() => /Wieder verbunden/.test(document.getElementById('conn').textContent))));
  check('Pixel zurueck: wieder in der Presence', await bis(() => !!(relay.get('buzzer/presence') || {}).bert));
  await host.evaluate(() => { feudBuzzPrepare(); feudBuzzArm(); });
  await bis(() => px.evaluate(() => !document.getElementById('buzz').disabled));
  await buzzere(px);
  check('Pixel nach Netzabriss: Buzz kommt an', await bis(() => host.evaluate(() => feudBuzzer.results.some(r => r.name === 'Bert'))));

  // ── Netzabriss Gamepad: Strike wartet und kommt nach der Rueckkehr an ──
  await bis(async () => (await zaehle(gpKnopf('Strike'))) > 0);
  const strikes = await host.evaluate(() => state.teamStrikes[state.currentTeam]);
  relay.offline('gamepad', true);
  check('Gamepad offline: Banner', await bis(() => pad.evaluate(() => document.getElementById('conn').classList.contains('show'))));
  await warte(500);
  const ueberPad = await pad.evaluate(() => ({ banner: document.getElementById('conn').getBoundingClientRect().bottom, panel: document.getElementById('gmFrame').getBoundingClientRect().top }));
  check('Gamepad offline: Banner verdeckt die Kopfzeile (Beenden) nicht', ueberPad.banner <= ueberPad.panel, ueberPad);
  await pad.screenshot({ path: `${OUT}/geraete-offline-gamepad.png` });
  await gpKnopf('Strike').first().tap();
  await warte(800);
  check('Gamepad offline: Strike kommt (noch) nicht an', await host.evaluate(n => state.teamStrikes[state.currentTeam] === n, strikes));
  relay.offline('gamepad', false);
  check('Gamepad zurueck: verspaeteter Strike kommt an', await bis(() => host.evaluate(n => state.teamStrikes[state.currentTeam] === n + 1, strikes)));

  // ── Neuladen mitten im Spiel ──
  await H.iphoneSE.page.reload({ waitUntil: 'domcontentloaded' });
  check('iPhone SE neu geladen: zurueck am Buzzer, nicht in der Lobby', await bis(async () => (await screen(H.iphoneSE)) === 'screen-buzz', 6000), await screen(H.iphoneSE));
  await host.reload({ waitUntil: 'load' }); await hostVorbereiten();
  check('Host F5: Feud laeuft weiter', await bis(() => host.evaluate(() => resumeCurrentShow() === 'feud' && screenActive('game-screen')), 6000));
  check('Host F5: Handys bleiben im Spiel (keine Lobby)', await bis(async () => Object.values(await screens()).every(s => s !== 'screen-lobby'), 5000), await screens());
  check('Host F5: Gamepad bekommt wieder ein Spielpanel', await bis(async () => (await zaehle(gp.locator('.gm-header .gm-quit'))) === 1, 6000));

  // Nachzuegler: neuer Account mitten in der Show wird gesperrt.
  const spaet = await geraet('nachzuegler', 'chromium', devices['Pixel 5']);
  await spaet.goto(base + '/buzzer/', { waitUntil: 'domcontentloaded' });
  await spaet.waitForSelector('#login-name', { state: 'visible' });
  await spaet.locator('#login-name').tap(); await spaet.keyboard.type('Dora');
  await spaet.locator('#login-pin').tap(); await spaet.keyboard.type('dora12');
  await spaet.locator('#screen-login .btn').tap();
  await spaet.locator('#screen-signup .btn:not(.ghost)').tap().catch(() => {});
  check('Nachzuegler mitten in der Show: gesperrt', await bis(() => spaet.evaluate(() => document.querySelector('.screen.active').id === 'screen-blocked'), 5000),
    await spaet.evaluate(() => document.querySelector('.screen.active').id));
  await spaet.context().close();

  // ── Beenden vom Gamepad (Rueckfrage wie auf dem iPhone, wird bestaetigt) ──
  await gp.locator('.gm-quit').tap();
  check('Gamepad Beenden: Host im Menue', await bis(() => host.evaluate(() => resumeCurrentShow() === '' && screenActive('menu-screen'))));
  check('Gamepad Beenden: alle Handys zurueck in der Lobby', await alle('screen-lobby'), await screens());

  const weg = () => host.evaluate(() => document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay,.tut-overlay').forEach(e => e.remove()));
  const start = fn => host.evaluate(fn => { const r = Math.random; Math.random = () => 0; window[fn](); Math.random = r; }, fn);

  // ── Trivial Pursuit: zwei Finger aus Team Rot gleichzeitig am Rad ──
  await host.evaluate(() => showScreen('tp-setup-screen'));
  await start('startTp'); await warte(500); await weg();
  await host.evaluate(() => { showScreen('tp-screen'); tpBuildWheel(); tpRender(); });
  check('TP: Team Rot (Sony, Bert) hat das Rad', await bis(async () => (await screen(H.iphone15)) === 'screen-tpspin' && (await screen(H.pixel7)) === 'screen-tpspin'), await screens());
  // 600 ms Leitung bei beiden: keiner sieht den Dreh des anderen, bevor er selbst drueckt
  // (200 ms reichten unter Last nicht, dann kam der zweite Finger schon zu spaet).
  relay.delay('iphone15', 600); relay.delay('pixel7', 600);
  // Wer zu spaet kommt, findet den Knopf schon gesperrt - der Tap darf dann ins Leere gehen.
  await Promise.all([H.iphone15.page, px].map(p => p.locator('#tpspin-btn').tap({ timeout: 2000 }).catch(() => {})));
  await warte(3000);
  relay.delay('iphone15', 0); relay.delay('pixel7', 0);
  check('TP: beide Finger haben wirklich gedrueckt (zwei Versuche am Server)', relay.zaehler('tx', 'buzzer/tpspin/by') >= 2, relay.zaehler('tx', 'buzzer/tpspin/by'));
  const dreher = relay.get('buzzer/tpspin/by');
  check('TP: zwei gleichzeitige Finger, genau ein Dreh', !!dreher && ['Sony', 'Bert'].includes(dreher.name), dreher);
  const gesehen = await Promise.all([H.iphone15, H.pixel7].map(h => h.page.evaluate(() => document.getElementById('tpspin-sub').textContent)));
  check('TP: beide Handys zeigen denselben Dreher', gesehen.every(t => t.startsWith(dreher && dreher.name)), gesehen);
  await passt('TP'); await bilder('tp');
  await host.evaluate(() => tpQuit()); await warte(300);

  // ── DDF: alle vier stimmen per Antippen ab ──
  await host.evaluate(() => { showScreen('menu-screen'); showScreen('ddf-setup-screen'); });
  await warte(400);
  await host.evaluate(() => Object.assign(roster('ddf'), { selected: new Set(['sony', 'anna', 'bert', 'carla']), guests: [], seeded: true }));
  await start('startDdf'); await warte(500); await weg();
  await host.evaluate(() => { showScreen('ddf-screen'); ddfRenderRound(); ddfReveal(); ddfBeginVote(); });
  check('DDF: alle vier in der Abstimmung', await alle('screen-vote'), await screens());
  await passt('DDF'); await bilder('ddf');
  for (const h of handys) await h.page.locator('.vote-opt').first().tap();
  check('DDF: vier Stimmen beim Host', await bis(() => host.evaluate(() => Object.keys(ddfState.votes || {}).length === 4)), await host.evaluate(() => ddfState.votes));
  await host.evaluate(() => ddfQuit()); await warte(300);

  // ── Preis ist heiss: alle vier tippen ein Gebot ──
  await host.evaluate(() => { showScreen('menu-screen'); showScreen('pih-setup-screen'); });
  await warte(400);
  await host.evaluate(() => Object.assign(roster('pih'), { selected: new Set(['sony', 'anna', 'bert', 'carla']), guests: [], seeded: true }));
  await start('startPih'); await warte(500); await weg();
  await host.evaluate(() => { showScreen('pih-screen'); pihRenderRound(); pihBeginBids(); });
  check('PIH: alle vier im Eingabefeld', await alle('screen-estimate'), await screens());
  const gebote = ['390.000', '42', '1.299,99', '7'];
  for (let i = 0; i < handys.length; i++) {
    const p = handys[i].page;
    await p.locator('#est-input').tap(); await p.keyboard.type(gebote[i]); await p.locator('#est-send').tap();
  }
  check('PIH: vier Gebote beim Host', await bis(() => host.evaluate(() => Object.keys(pihState.bids || {}).length === 4)), await host.evaluate(() => pihState.bids));
  await passt('PIH'); await bilder('pih');
  await host.evaluate(() => pihQuit()); await warte(300);

  for (const [n, e] of Object.entries(errors)) check('Keine JS-Fehler: ' + n, e.length === 0, e);
  await Promise.all(Object.values(browser).map(b => b.close())); srv.close();
  console.log(`\n${ok} OK, ${fail} FEHL`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
