/* Ersatz fuer firebase-database-compat.js fuer ablauf.js: verbindet mehrere Tabs desselben
   Browser-Kontexts ueber BroadcastChannel zu EINER Datenbank verbindet.
   Nur fuer Tests: Host-Tab und Handy-Tab sehen gegenseitig ihre Schreibvorgaenge,
   die Live-Datenbank wird nie beruehrt. */
(function(){
  const root = { '.info': { connected: true, serverTimeOffset: 0 } };
  const ch = new BroadcastChannel('fbtest');
  const subs = [];
  window.__fbWrites = [];
  const P = p => String(p || '').split('/').filter(Boolean);
  const clone = v => (v == null ? null : JSON.parse(JSON.stringify(v)));
  function get(p){ let n = root; for (const k of P(p)) { if (n == null || typeof n !== 'object') return null; n = n[k]; } return n === undefined ? null : clone(n); }
  function ts(v){
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return Date.now();
      if (v['.sv'] && v['.sv'].increment !== undefined) return v['.sv'].increment;
      const o = Array.isArray(v) ? [] : {}; for (const k in v) o[k] = ts(v[k]); return o;
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
  function apply(op){
    if (op.type === 'set') setRaw(op.path, op.value);
    else for (const k in op.value) setRaw(op.path + '/' + k, op.value[k]);
    const touched = op.type === 'set' ? [op.path] : Object.keys(op.value).map(k => op.path + '/' + k);
    subs.slice().forEach(s => { if (touched.some(t => rel(t, s.path))) s.cb(snap(s.path)); });
  }
  function write(type, path, value){
    const op = { type, path, value: ts(clone(value)) };
    window.__fbWrites.push([type, path, JSON.stringify(op.value)]);
    apply(op); ch.postMessage(op);
    return Promise.resolve();
  }
  /* Ein neuer Tab fragt mit 'hallo' nach dem Stand; die Antwort ('stand') gilt
     nur ihm und nur die erste. Frueher ging sie als set '' an ALLE: jedes
     Neuladen des Gamepad-iframes loeste beim Gamepad ein Update aus, das das
     iframe wieder neu lud - eine Endlosschleife, die es nur im Test gab. */
  const ich = Math.random().toString(36).slice(2);
  let standDa = false;
  ch.onmessage = e => {
    const m = e.data;
    if (m.type === 'hallo') { ch.postMessage({ type: 'stand', an: m.von, value: clone(Object.fromEntries(Object.entries(root).filter(([k]) => k !== '.info'))) }); return; }
    if (m.type === 'stand') { if (m.an === ich && !standDa) { standDa = true; apply({ type: 'set', path: '', value: m.value }); bereit(); } return; }
    apply(m);
  };
  let bereit; const ready = new Promise(r => { bereit = r; setTimeout(r, 400); });
  ch.postMessage({ type: 'hallo', von: ich });
  function ref(path){
    const r = {
      key: P(path).pop() || null,
      child: c => ref(path + '/' + c),
      set: v => write('set', path, v),
      update: v => write('update', path, v),
      remove: () => write('set', path, null),
      push(v){ const k = 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); const c = ref(path + '/' + k); const pr = v === undefined ? Promise.resolve() : c.set(v); return Object.assign(pr, { key: k }); },
      transaction(fn, done){ const cur = get(path); const n = fn(cur); const ok = n !== undefined; const pr = ok ? write('set', path, n) : Promise.resolve(); pr.then(() => done && done(null, ok, snap(path))); return pr; },
      on(ev, cb){
        if (ev === 'value') { const s = { path, cb }; subs.push(s); setTimeout(() => cb(snap(path)), 0); }
        /* child_added wie bei Firebase: erst fuer alle vorhandenen Kinder, danach fuer jedes
           neue. Braucht der Host fuer die Befehle vom Gamepad (gmremote/commands). */
        if (ev === 'child_added') {
          const seen = new Set();
          const melde = sn => { const v = sn.val(); if (!v || typeof v !== 'object') return;
            for (const k of Object.keys(v)) if (!seen.has(k)) { seen.add(k); cb(snap(path + '/' + k)); } };
          subs.push({ path, cb: melde, orig: cb }); setTimeout(() => melde(snap(path)), 0);
        }
        return cb;
      },
      off(ev, cb){ for (let i = subs.length - 1; i >= 0; i--) if (subs[i].path === path && (!cb || subs[i].cb === cb || subs[i].orig === cb)) subs.splice(i, 1); },
      once: () => ready.then(() => snap(path)),
      get: () => ready.then(() => snap(path)),
      onDisconnect: () => ({ remove: () => Promise.resolve(), cancel: () => Promise.resolve(), set: () => Promise.resolve(), update: () => Promise.resolve() }),
    };
    return new Proxy(r, { get: (t, p) => (p in t ? t[p] : (p === 'then' ? undefined : () => ref(path))) });
  }
  firebase.database = Object.assign(() => ({ ref: p => ref(p || ''), goOffline(){}, goOnline(){} }),
    { ServerValue: { TIMESTAMP: { '.sv': 'timestamp' }, increment: n => ({ '.sv': { increment: n } }) } });
  window.__fbGet = get;
})();
