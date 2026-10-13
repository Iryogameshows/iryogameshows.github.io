// Ersatz-Firebase als kleiner Server fuer geraete.js: EINE Datenbank im
// Node-Prozess, an der Host, Handys und Gamepad haengen - auch ueber
// Browser-Grenzen hinweg (Chromium und WebKit teilen keinen BroadcastChannel,
// darum reicht fbshared.js hier nicht). Gegenstueck im Browser: fbrelay.js.
//
// Was er wie das echte Firebase macht:
//   - ServerValue.TIMESTAMP wird beim EINTREFFEN auf dem Server gesetzt. Ein
//     Handy mit langer Leitung buzzert also wirklich spaeter.
//   - transaction() ist ein Vergleichen-und-Setzen auf dem Server.
//   - onDisconnect() laeuft, wenn die Verbindung abreisst oder die Seite
//     geschlossen/neu geladen wird.
//   - Ein Geraet kann man vom Netz nehmen (offline) oder verzoegern (delay).
//     Offline: .info/connected wird false, Schreibvorgaenge warten beim
//     Geraet und gehen nach der Rueckkehr raus, dann kommt der volle Stand.
// Nur fuer Tests. Die Live-Datenbank wird nie beruehrt.
'use strict';

const P = p => String(p || '').split('/').filter(Boolean);
const clone = v => (v == null ? null : JSON.parse(JSON.stringify(v)));
// Schluessel sortiert, damit der Vergleich in transaction() nicht an der Reihenfolge scheitert.
const fest = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)
  ? Object.keys(x).sort().reduce((o, s) => (o[s] = x[s], o), {}) : x));

module.exports = function relay() {
  const root = {};
  const clients = new Map();            // id -> { id, g, res, ondc: Map(path -> op) }
  const geraete = new Map();            // name -> { offline, delay }
  const zaehl = {};                     // 'typ pfad' -> Anzahl, fuer Pruefungen
  const g = n => { if (!geraete.has(n)) geraete.set(n, { offline: false, delay: 0 }); return geraete.get(n); };

  function get(p) { let n = root; for (const k of P(p)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : clone(n); }
  function setRaw(p, v) {
    const ks = P(p);
    if (!ks.length) { for (const k in root) delete root[k]; if (v && typeof v === 'object') Object.assign(root, v); return; }
    let n = root;
    for (let i = 0; i < ks.length - 1; i++) { if (n[ks[i]] == null || typeof n[ks[i]] !== 'object') n[ks[i]] = {}; n = n[ks[i]]; }
    if (v === null || v === undefined) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = v;
  }
  function ts(v, jetzt, alt) {
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return jetzt;
      if (v['.sv'] && v['.sv'].increment !== undefined) return (typeof alt === 'number' ? alt : 0) + v['.sv'].increment;
      const o = Array.isArray(v) ? [] : {}; for (const k in v) o[k] = ts(v[k], jetzt, alt && typeof alt === 'object' ? alt[k] : undefined); return o;
    }
    return v;
  }

  // Nachricht an einen Client, mit der Verzoegerung seines Geraets. Offline: verworfen
  // (der Client bekommt beim Wiederverbinden ohnehin den vollen Stand).
  function an(c, m) {
    const st = g(c.g);
    if (st.offline) return;
    const raus = () => { if (!g(c.g).offline && clients.has(c.id)) c.res.write('data: ' + JSON.stringify(m) + '\n\n'); };
    if (st.delay) setTimeout(raus, st.delay); else raus();
  }
  function anwenden(op) {
    const jetzt = Date.now();
    let fertig;
    if (op.type === 'set') fertig = { type: 'set', path: op.path, value: ts(clone(op.value), jetzt, get(op.path)) };
    else {
      const v = {};
      for (const k in op.value) v[k] = ts(clone(op.value[k]), jetzt, get(op.path + '/' + k));
      fertig = { type: 'update', path: op.path, value: v };
    }
    if (fertig.type === 'set') setRaw(fertig.path, fertig.value);
    else for (const k in fertig.value) setRaw(fertig.path + '/' + k, fertig.value[k]);
    for (const c of clients.values()) an(c, { type: 'op', op: fertig });
  }
  function onDisconnectAusfuehren(c) {
    const ops = [...c.ondc.values()];
    c.ondc.clear();
    ops.forEach(anwenden);
  }

  function body(req) {
    return new Promise(r => { let s = ''; req.on('data', d => s += d); req.on('end', () => { try { r(JSON.parse(s)); } catch { r({}); } }); });
  }

  /** @returns {boolean} true, wenn die Anfrage dem Relay gehoerte */
  function handle(req, res) {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith('/__fb/')) return false;
    /* CORS offen: WebKit behandelt das srcdoc-iframe des Gamepads gelegentlich
       als fremden Ursprung und blockte dann die Verbindung ("access control
       checks", 2 von 10 Laeufen). Echtes Firebase erlaubt das ebenfalls. */
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return true; }
    if (url.pathname === '/__fb/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': hallo\n\n');
      const c = { id: url.searchParams.get('id'), g: url.searchParams.get('g') || '?', res, ondc: new Map() };
      clients.set(c.id, c);
      an(c, { type: 'stand', root: clone(root) });
      /* Baut der Browser die Verbindung neu auf (WebKit unter Last), kommt die
         neue mit derselben id, bevor die alte 'close' meldet. Frueher loeschte
         das 'close' der alten dann die NEUE - das Geraet bekam keine Updates
         mehr (iPhone sah "scharf" nie, 2026-10-13). Nur sich selbst austragen. */
      req.on('close', () => { if (clients.get(c.id) === c) clients.delete(c.id); onDisconnectAusfuehren(c); });
      const puls = setInterval(() => { try { res.write(': puls\n\n'); } catch {} }, 10000);
      req.on('close', () => clearInterval(puls));
      return true;
    }
    if (url.pathname === '/__fb/op' && req.method === 'POST') {
      body(req).then(({ id, g: gname, op }) => {
        const st = g(gname || '?');
        if (st.offline) { res.writeHead(503); res.end(); return; }
        const weiter = () => {
          if (g(gname).offline) { res.writeHead(503); res.end(); return; }
          const c = clients.get(id);
          let antwort = { ok: true };
          if (op) zaehl[op.type + ' ' + op.path] = (zaehl[op.type + ' ' + op.path] || 0) + 1;
          if (!op) antwort = { ok: false };
          else if (op.type === 'set' || op.type === 'update') anwenden(op);
          else if (op.type === 'tx') {
            const cur = get(op.path);
            if (fest(cur) === fest(op.erwartet)) anwenden({ type: 'set', path: op.path, value: op.value });
            else antwort = { ok: false, aktuell: cur };
          }
          else if (op.type === 'ondc' && c) c.ondc.set(op.path, op.op);
          else if (op.type === 'ondc-cancel' && c) c.ondc.delete(op.path);
          const raus = () => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(antwort)); };
          if (st.delay) setTimeout(raus, st.delay); else raus();
        };
        if (st.delay) setTimeout(weiter, st.delay); else weiter();
      });
      return true;
    }
    res.writeHead(404); res.end();
    return true;
  }

  return {
    handle,
    get,
    /** Startwerte, ohne dass ein Browser schreibt. */
    set(p, v) { anwenden({ type: 'set', path: p, value: v }); },
    /** Geraet vom Netz nehmen bzw. zurueckholen. */
    offline(name, aus) {
      const st = g(name);
      const betroffen = [...clients.values()].filter(c => c.g === name);
      if (aus) {
        betroffen.forEach(c => c.res.write('data: ' + JSON.stringify({ type: 'weg' }) + '\n\n'));
        st.offline = true;
        betroffen.forEach(onDisconnectAusfuehren);
      } else {
        st.offline = false;
        betroffen.forEach(c => an(c, { type: 'stand', root: clone(root) }));
      }
    },
    /** Leitung eines Geraets verzoegern, in Millisekunden je Richtung. */
    delay(name, ms) { g(name).delay = ms; },
    /** Wie oft kam ein Schreibvorgang dieser Art an diesem Pfad an? */
    zaehler: (typ, pfad) => zaehl[typ + ' ' + pfad] || 0,
    clients: () => [...clients.values()].map(c => c.g),
  };
};
