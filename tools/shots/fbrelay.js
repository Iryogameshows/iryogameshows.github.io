/* Ersatz fuer firebase-database-compat.js fuer geraete.js: haengt an relay.js
   (Server im Testprozess) statt an der Live-Datenbank. Laeuft in Chromium und
   WebKit gleich. __BASIS__ wird beim Ausliefern durch die Server-Adresse
   ersetzt, __geraet setzt geraete.js per Init-Skript (auch in iframes).
   Nur fuer Tests. */
(function(){
  const BASIS = '__BASIS__';
  const GERAET = window.__geraet || '?';
  const ich = Math.random().toString(36).slice(2);
  const root = { '.info': { connected: false, serverTimeOffset: 0 } };
  const subs = [];
  window.__fbWrites = [];
  const P = p => String(p || '').split('/').filter(Boolean);
  const clone = v => (v == null ? null : JSON.parse(JSON.stringify(v)));
  function get(p){ let n = root; for (const k of P(p)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : clone(n); }
  // Lokal geschaetzter Wert fuer Serverwerte, bis der Server den echten schickt.
  function tsLokal(v, alt){
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return Date.now();
      if (v['.sv'] && v['.sv'].increment !== undefined) return (typeof alt === 'number' ? alt : 0) + v['.sv'].increment;
      const o = Array.isArray(v) ? [] : {}; for (const k in v) o[k] = tsLokal(v[k], alt && typeof alt === 'object' ? alt[k] : undefined); return o;
    }
    return v;
  }
  function setRaw(p, v){
    const ks = P(p);
    if (!ks.length) { for (const k in root) if (k !== '.info') delete root[k]; if (v && typeof v === 'object') Object.assign(root, v); return; }
    let n = root;
    for (let i = 0; i < ks.length - 1; i++) { if (n[ks[i]] == null || typeof n[ks[i]] !== 'object') n[ks[i]] = {}; n = n[ks[i]]; }
    if (v === null || v === undefined) delete n[ks[ks.length - 1]]; else n[ks[ks.length - 1]] = v;
  }
  const rel = (a, b) => { const A = P(a).join('/'), B = P(b).join('/'); return !A || !B || A === B || A.startsWith(B + '/') || B.startsWith(A + '/'); };
  function snap(p){
    const v = get(p);
    return { val: () => v, exists: () => v != null, key: P(p).pop() || null,
      get ref(){ return ref(p); },
      child: c => snap(p + '/' + c),
      forEach(fn){ if (v && typeof v === 'object') for (const k of Object.keys(v)) if (fn(snap(p + '/' + k)) === true) return true; return false; } };
  }
  let standDa = false;
  function melde(pfade){ if (!standDa) return; subs.slice().forEach(s => { if (pfade.some(t => rel(t, s.path))) s.cb(snap(s.path)); }); }
  function apply(op){
    if (op.type === 'set') setRaw(op.path, op.value);
    else for (const k in op.value) setRaw(op.path + '/' + k, op.value[k]);
    melde(op.type === 'set' ? [op.path] : Object.keys(op.value).map(k => op.path + '/' + k));
  }

  // ── Leitung zum Relay ──
  let online = false;
  const warteschlange = [];
  let sendet = false;
  async function abschicken(){
    if (sendet || !online) return;
    sendet = true;
    while (warteschlange.length && online) {
      const w = warteschlange[0];
      let r;
      try { r = await fetch(BASIS + '/__fb/op', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ich, g: GERAET, op: w.op }) }); }
      catch { break; }
      if (r.status !== 200) break;   // offline - nach der Rueckkehr weiter
      warteschlange.shift();
      w.fertig(await r.json());
    }
    sendet = false;
  }
  // Wie Firebase: ohne Netz wartet der Schreibvorgang, statt zu scheitern.
  function senden(op){ return new Promise(fertig => { warteschlange.push({ op, fertig }); abschicken(); }); }

  let bereit; const ready = new Promise(r => { bereit = r; });
  const es = new EventSource(BASIS + '/__fb/events?id=' + ich + '&g=' + encodeURIComponent(GERAET));
  es.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.type === 'stand') {
      setRaw('', m.root); root['.info'].connected = true; online = true;
      standDa = true; melde(['']); bereit(); abschicken();
    } else if (m.type === 'weg') {
      online = false; root['.info'].connected = false; melde(['.info/connected']);
    } else if (m.type === 'op') apply(m.op);
  };

  function write(type, path, value){
    const v = clone(value);
    window.__fbWrites.push([type, path, JSON.stringify(v)]);
    if (type === 'set') apply({ type, path, value: tsLokal(v, get(path)) });
    else { const o = {}; for (const k in v) o[k] = tsLokal(v[k], get(path + '/' + k)); apply({ type, path, value: o }); }
    return senden({ type, path, value: v }).then(() => undefined);
  }
  function ref(path){
    const r = {
      key: P(path).pop() || null,
      child: c => ref(path + '/' + c),
      set: v => write('set', path, v),
      update: v => write('update', path, v),
      remove: () => write('set', path, null),
      push(v){ const k = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); const c = ref(path + '/' + k); const pr = v === undefined ? Promise.resolve() : c.set(v); return Object.assign(pr, { key: k, ref: c }); },
      // Vergleichen-und-Setzen auf dem Server; verliert man, kommt der aktuelle Wert zurueck und fn laeuft erneut.
      transaction(fn, done){
        const versuch = async () => {
          const cur = get(path); const n = fn(cur);
          if (n === undefined) { done && done(null, false, snap(path)); return { committed: false, snapshot: snap(path) }; }
          const j = await senden({ type: 'tx', path, erwartet: cur, value: clone(n) });
          if (!j.ok) { setRaw(path, j.aktuell); melde([path]); return versuch(); }
          done && done(null, true, snap(path)); return { committed: true, snapshot: snap(path) };
        };
        return versuch();
      },
      on(ev, cb){
        if (ev === 'value') { subs.push({ path, cb }); if (standDa) setTimeout(() => cb(snap(path)), 0); }
        if (ev === 'child_added') {
          const seen = new Set();
          const neu = sn => { const v = sn.val(); if (!v || typeof v !== 'object') return;
            for (const k of Object.keys(v)) if (!seen.has(k)) { seen.add(k); cb(snap(path + '/' + k)); } };
          subs.push({ path, cb: neu, orig: cb }); if (standDa) setTimeout(() => neu(snap(path)), 0);
        }
        return cb;
      },
      off(ev, cb){ for (let i = subs.length - 1; i >= 0; i--) if (subs[i].path === path && (!cb || subs[i].cb === cb || subs[i].orig === cb)) subs.splice(i, 1); },
      once: () => ready.then(() => snap(path)),
      get: () => ready.then(() => snap(path)),
      onDisconnect: () => ({
        set: v => senden({ type: 'ondc', path, op: { type: 'set', path, value: clone(v) } }),
        update: v => senden({ type: 'ondc', path, op: { type: 'update', path, value: clone(v) } }),
        remove: () => senden({ type: 'ondc', path, op: { type: 'set', path, value: null } }),
        cancel: () => senden({ type: 'ondc-cancel', path }),
      }),
    };
    return new Proxy(r, { get: (t, p) => (p in t ? t[p] : (p === 'then' ? undefined : () => ref(path))) });
  }
  firebase.database = Object.assign(() => ({ ref: p => ref(p || ''), goOffline(){}, goOnline(){} }),
    { ServerValue: { TIMESTAMP: { '.sv': 'timestamp' }, increment: n => ({ '.sv': { increment: n } }) } });
  window.__fbGet = get;
})();
