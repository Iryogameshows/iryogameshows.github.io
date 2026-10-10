/* Ersatz fuer firebase-database-compat.js in der Screenshot-Pruefung.

   shots.js liefert diese Datei anstelle des echten Skripts vom CDN aus
   (context.route). Damit gibt es schon beim Laden der Seite keine Verbindung
   zur Live-Datenbank - die Hostseite schreibt beim Laden (designPushToPhones),
   ein Stummschalten nach dem Laden kaeme zu spaet (BAUPLAN 5, HANDOFF 431a43e).

   Jeder Schreibversuch landet in window.__fbWrites, Lesungen kommen aus
   window.__fbStore. window.__fbSet(pfad, wert) loest die on('value')-
   Abonnenten aus - so laesst sich z. B. der Knoten "design" fuer den
   Handy-Buzzer setzen. */
(function(){
  const store = window.__fbStore = { '.info/connected': true };
  window.__fbWrites = []; window.__fbSubs = [];
  function snap(path){ const v = store[path]; return { val: () => (v === undefined ? null : v), exists: () => v !== undefined, forEach: () => false, key: path.split('/').pop() }; }
  function mkRef(path){
    return new Proxy(function(){}, { get: (t, p) => {
      if (p === 'then') return undefined;
      if (['set','update','push','remove','transaction','onDisconnect'].includes(p)) return (v) => { window.__fbWrites.push([p, path, typeof v === 'string' ? v : typeof v]); return p === 'onDisconnect' ? mkRef(path) : Object.assign(Promise.resolve(), { key: 'k' }); };
      if (p === 'on') return (ev, cb) => { if (ev === 'value') { const fire = () => cb(snap(path)); window.__fbSubs.push([path, fire]); setTimeout(fire, 0); } return cb; };
      if (p === 'once') return () => Promise.resolve(snap(path));
      if (p === 'child') return (c) => mkRef(path + '/' + c);
      if (p === 'catch' || p === 'finally') return () => Promise.resolve();
      if (p === 'key') return path.split('/').pop();
      return mkRef(path);
    }, apply: () => mkRef(path) });
  }
  const db = () => ({ ref: (p) => mkRef(p || ''), goOffline(){}, goOnline(){} });
  firebase.database = Object.assign(db, { ServerValue: { TIMESTAMP: 0, increment: () => 0 } });
  window.__fbSet = (path, v) => { store[path] = v; window.__fbSubs.filter(s => s[0] === path).forEach(s => s[1]()); };
  window.__stumm = true;
})();
