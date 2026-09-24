// @ts-check
/* Der Preis ist heiss.

   Herausgeloest aus index.html (Zeilen 8821-9605). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
/* ═══ DER PREIS IST HEISS ═══════════════════════════════════════════════════
   Ein Artikel, alle schätzen gleichzeitig den Preis, wer am nächsten dran ist
   bekommt den Punkt.

   Die Eingabe läuft über dieselbe Firebase-Leitung wie die Jeopardy-
   Schätzfrage (buzzer/estimate). Das ist Absicht: es ist exakt dieselbe
   Interaktion - "alle tippen eine Zahl" - und der Host moderiert immer nur
   ein Spiel gleichzeitig. Teams braucht es dafuer keine: seit der Buzzer
   nicht mehr teamgebunden ist, zeigt das Handy die Eingabe ohnehin jedem.

   Spieler werden wie bei DDF über eine uid identifiziert, nie über den Namen.
   ════════════════════════════════════════════════════════════════════════ */

const PIH_MAX_MEDIA = 3;

let pihData = {
  items: [
    { name:'Eine Kugel Eis in der Eisdiele',      price:1.80,   note:'Stand 2025, Durchschnitt Deutschland.', media:[] },
    { name:'Ein Jahr Netflix Standard',           price:161.88, note:'13,49 € im Monat.',                     media:[] },
    { name:'Ein Bundesliga-Fußball (Matchball)',  price:149.95, note:'',                                      media:[] },
    { name:'Eine Waschmaschine, Mittelklasse',    price:449.00, note:'',                                      media:[] },
    { name:'Ein Döner',                           price:7.50,   note:'Großstadt, 2025.',                      media:[] },
    { name:'Ein Kleinwagen, neu',                 price:18500,  note:'Basismodell ohne Extras.',              media:[] },
  ]
};

const PIH_RULES = [
  { key:'under',   label:'Nur drunter zählt',
    hint:'Wie im Original: Wer über dem Preis liegt, ist raus. Von den übrigen gewinnt das höchste Gebot. Sind alle drüber, gibt es keinen Punkt.' },
  { key:'closest', label:'Nächstdran gewinnt',
    hint:'Der kleinste Abstand gewinnt, egal ob drüber oder drunter. Versöhnlicher — gut, wenn die Preise schwer zu schätzen sind.' },
];

let pihState = {
  active:false,
  players:[],          // [{ uid, label, name, avatar, color, key, score }]
  order:[], idx:0,     // gemischte Artikelreihenfolge
  roundTime:30,
  rule:'under',
  phase:'show',        // show → bid → result → done
  timer:0, timerInt:null, timeUp:false,
  bids:{},             // von den Handys (Firebase spiegelt hier herein)
  hostBids:{},         // vom Host für Gäste ohne Handy eingetragen
  lastResult:null,     // { price, rows, winners }
};

/* ── Setup ─────────────────────────────────────────────────────────────── */

// Teilnehmerauswahl wie bei DDF - der gemeinsame Code steckt in roster.js.

function renderPihRulePick(){
  const box = document.getElementById('pih-rule-pick');
  const hint = document.getElementById('pih-rule-hint');
  if (!box) return;
  box.innerHTML = PIH_RULES.map(r =>
    `<button class="btn ${pihState.rule === r.key ? 'btn-primary' : 'btn-secondary'}" style="padding:7px 13px;font-size:.75rem;"
       onclick="pihSetRule('${r.key}')">${r.label}</button>`).join('');
  const cur = PIH_RULES.find(r => r.key === pihState.rule);
  if (hint) hint.textContent = cur ? cur.hint : '';
}
function pihSetRule(key){
  pihState.rule = key;
  renderPihRulePick();
  pihSaveSettings();
}

function pihShuffledOrder(){ return shuffledIndices(pihData.items.length); }

function startPih(){
  const people = rosterContestants('pih');
  if (!people.length) { alert('Mindestens ein Teilnehmer — per QR beitreten lassen oder Gäste eintragen.'); return; }

  const usable = pihData.items.filter(it => typeof it.price === 'number' && isFinite(it.price));
  if (!usable.length) { alert('Keine Artikel mit gültigem Preis vorhanden.'); return; }
  if (usable.length < pihData.items.length)
    alert(`${pihData.items.length - usable.length} Artikel ohne gültigen Preis werden übersprungen.`);

  const wanted = Math.max(0, Number(fieldVal('pih-rounds')) || 0);
  const time   = Math.max(0, Number(fieldVal('pih-time')) || 0);

  // Nur Artikel mit Preis in die Runde nehmen - ein Artikel ohne Preis wäre
  // nicht auflösbar und würde das Spiel mitten drin blockieren.
  let order = pihShuffledOrder().filter(i => typeof pihData.items[i].price === 'number' && isFinite(pihData.items[i].price));
  if (wanted > 0) order = order.slice(0, wanted);

  pihState = {
    active:true,
    players: people.map((p,i) => ({
      uid: p.key || ('guest:' + i),
      label: rosterLabelFor(people, i),
      name:p.name, avatar:p.avatar, color:p.color, key:p.key, score:0,
    })),
    order, idx:0,
    roundTime: time,
    rule: pihState.rule,
    phase:'show',
    timer:0, timerInt:null, timeUp:false,
    bids:{}, hostBids:{},
    lastResult:null,
  };
  pihSaveSettings();
  showScreen('pih-screen');
  pihRenderRound();
}

/* ── Anzeige ───────────────────────────────────────────────────────────── */

const PIH_MONEY = new Intl.NumberFormat('de-DE', { style:'currency', currency:'EUR' });
function pihMoney(n){ return (typeof n === 'number' && isFinite(n)) ? PIH_MONEY.format(n) : '—'; }

function pihCurrentItem(){ return pihData.items[pihState.order[pihState.idx]] || null; }
function pihByUid(uid){ return pihState.players.find(p => p.uid === uid) || null; }

// Zahl aus einer Eingabe lesen. Dieselben Regeln wie parseEstimate auf dem
// Handy, damit "1.299,90", "1,299.90" und "1299.9" alle dasselbe ergeben.
function pihParsePrice(s){
  s = String(s == null ? '' : s).trim().replace(/[€\s]/g, '');
  if (!s) return null;
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))      s = s.replace(/\./g,'').replace(',','.');  // 1.299,90
  else if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g,'');                    // 1,299.90
  else                                             s = s.replace(',','.');                    // 12,5
  const n = Number(s);
  return isFinite(n) ? n : null;
}

// picked: uids, die hervorgehoben werden (Rundensieger bzw. Gesamtsieger).
/* Die Wertung. Sie stand in Beitrittsreihenfolge da und jede Karte sah gleich
   aus - wer fuehrt, musste man sich aus fuenf Zahlen zusammensuchen. Jetzt
   steht sie sortiert, mit Platzziffer, und die Spitze ist hervorgehoben.

   Bei Gleichstand bleibt die urspruengliche Reihenfolge stehen (die Sortierung
   faellt auf den Ausgangsindex zurueck). Ohne das springen zwei
   Punktgleiche zwischen zwei Runden ohne Grund umeinander, und der Host
   sucht seine Leute jedes Mal neu.

   Gleiche Punktzahl heisst gleicher Platz: zwei mit je einem Punkt stehen
   beide auf 2., nicht auf 2. und 3. */
function pihRenderScores(picked){
  const box = document.getElementById('pih-scores');
  if (!box) return;
  const hot = picked || [];
  // rank gehoert von Anfang an ins Objekt: wird es erst spaeter angehaengt,
  // kennt die Typpruefung die Eigenschaft nicht (TS2339).
  const ranked = pihState.players.map((p, i) => ({ p, i, rank: 0 }))
    .sort((a, b) => b.p.score - a.p.score || a.i - b.i);
  let rank = 0, prev = null;
  ranked.forEach((r, idx) => {
    if (r.p.score !== prev) { rank = idx + 1; prev = r.p.score; }
    r.rank = rank;
  });
  const best = ranked.length ? ranked[0].p.score : 0;
  box.innerHTML = ranked.map(r => {
    const p = r.p;
    const av = p.avatar ? playerAvatarHtml(p) + ' ' : '';
    // Die Krone nur, wenn ueberhaupt schon jemand gepunktet hat - zu Beginn
    // stehen alle auf null, und fuenf Kronen sagen nichts.
    const fuehrt = best > 0 && p.score === best;
    const cls = 'pih-score'
      + (hot.includes(p.uid) ? ' picked' : '')
      + (fuehrt ? ' lead' : '')
      + (p.score ? '' : ' leer');
    return `<div class="${cls}">
      <span class="pih-rank">${fuehrt ? '👑' : r.rank + '.'}</span>
      <span class="pih-score-name">${av}${escAttr(p.label)}</span>
      <span class="pih-score-pts">${p.score}</span>
    </div>`;
  }).join('');
}

// Erstes Bild steht fest auf der Bühne - es ist der Artikel, um den es geht.
// Weitere Bilder liegen hinter der Leiste, wie bei DDF.
function pihRenderStage(){
  const stage = document.getElementById('pih-stage');
  const bar = document.getElementById('pih-media-bar');
  const it = pihCurrentItem();
  if (!stage || !bar || !it) return;
  const media = (it.media || []).filter(Boolean);
  const first = media[0];
  stage.innerHTML = first
    ? (first.type === 'video' ? `<video src="${first.data}" autoplay muted loop></video>` : `<img src="${first.data}">`)
    : '';
  bar.innerHTML = media.slice(1).map((m,i) =>
    `<button class="btn btn-secondary" style="padding:5px 11px;font-size:.75rem;"
       onclick="pihShowMedia(${i+1})">🖼 Bild ${i+2}</button>`).join('');
}
function pihShowMedia(i){
  const it = pihCurrentItem();
  if (!it) return;
  activeMediaSlot = (activeMediaSlot === i) ? null : i;
  renderMediaOverlay((it.media || []).filter(Boolean));
}

function pihRenderRound(){
  const it = pihCurrentItem();
  if (!it) { pihFinish(); return; }

  pihRenderScores(pihState.phase === 'result' && pihState.lastResult ? pihState.lastResult.winners : []);
  setHtml('pih-item', escAttr(it.name));
  pihRenderStage();

  // Preis und Notiz erst bei der Auflösung - vorher wäre das Spiel vorbei.
  const priceEl = document.getElementById('pih-price');
  const noteEl  = document.getElementById('pih-note');
  const shown = pihState.phase === 'result';
  priceEl.innerHTML = shown ? pihMoney(Number(it.price)) : '';
  noteEl.innerHTML  = (shown && it.note) ? escAttr(it.note) : '';

  pihRenderBidGrid();
  pihRenderControls();
}

function pihRenderControls(){
  const box = document.getElementById('pih-controls');
  if (!box) return;
  if (pihState.phase === 'show') {
    box.innerHTML = `
      <button class="btn btn-primary" onclick="pihBeginBids()">Gebote öffnen</button>
      <button class="btn btn-secondary" onclick="pihSkip()">Artikel überspringen</button>
      <button class="btn btn-secondary" onclick="pihQuit()">Beenden</button>`;
  } else if (pihState.phase === 'bid') {
    box.innerHTML = `
      <button class="btn btn-primary" onclick="pihEvaluate()">Auflösen</button>
      <button class="btn btn-secondary" onclick="pihQuit()">Beenden</button>`;
  } else if (pihState.phase === 'result') {
    const last = pihState.idx + 1 >= pihState.order.length;
    box.innerHTML = `
      <button class="btn btn-primary" onclick="pihAfterResult()">${last ? 'Endstand' : 'Weiter'}</button>
      <button class="btn btn-secondary" onclick="pihQuit()">Beenden</button>`;
  } else {
    box.innerHTML = `<button class="btn btn-secondary" onclick="pihQuit()">Beenden</button>`;
  }
}

function pihRenderBidGrid(){
  const grid = document.getElementById('pih-bid-grid');
  if (!grid) return;
  const hint = t => `<div style="width:100%;text-align:center;color:#9a9a9a;font-size:.85rem;margin-bottom:6px;">${t}</div>`;

  if (pihState.phase === 'bid') {
    const guests = pihGuestBidders();
    // Während der Gebote sieht niemand die Zahlen - nur wie viele schon da sind.
    grid.innerHTML =
      hint('Gebote laufen — auf den Handys eintippen') +
      `<div id="pih-bid-progress" style="width:100%;text-align:center;font-size:1.6rem;font-weight:800;margin-bottom:8px;"></div>` +
      (guests.length ? hint('Gäste ohne Handy — Gebot eintragen:') +
        guests.map(g => {
          const i = pihState.players.indexOf(g);
          return `<div class="pih-bid-row" id="pih-guest-row-${i}">
            <span class="pih-bid-name">${escAttr(g.label)}</span>
            <input id="pih-bid-input-${i}" type="text" inputmode="decimal" placeholder="z.B. 12,90"
                   style="width:120px;padding:5px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.8rem;outline:none;"
                   onkeydown="if(event.key==='Enter')pihHostBid(${i})">
            <button class="btn btn-secondary" style="padding:5px 10px;font-size:.7rem;" onclick="pihHostBid(${i})">OK</button>
          </div>`;
        }).join('') : '');
    pihUpdateBidProgress();
    return;
  }

  if (pihState.phase === 'result' && pihState.lastResult) {
    const { rows } = pihState.lastResult;
    if (!rows.length) { grid.innerHTML = hint('Es ist kein Gebot eingegangen.'); return; }
    grid.innerHTML = rows.map(r => {
      const diff = r.num === null ? ''
        : (r.diff === 0 ? 'genau' : (r.diff > 0 ? '+' : '−') + pihMoney(Math.abs(r.diff)).replace('€','').trim());
      return `<div class="pih-bid-row${r.win ? ' win' : ''}${r.bust ? ' bust' : ''}">
        <span class="pih-bid-name">${r.win ? '🏅 ' : ''}${escAttr(r.label)}${r.exact ? ' <span style="color:#FFD23F;font-size:.7rem;">PUNKTGENAU +1</span>' : ''}</span>
        <span class="pih-bid-val">${r.num === null ? escAttr(r.value) : pihMoney(r.num)}</span>
        <span class="pih-bid-diff">${diff}</span>
      </div>`;
    }).join('');
    return;
  }

  if (pihState.phase === 'done') {
    const rank = [...pihState.players].sort((a,b) => b.score - a.score);
    const medals = ['🥇','🥈','🥉'];
    grid.innerHTML = hint('Endstand') + rank.map((p,i) =>
      `<div class="pih-bid-row${i === 0 && p.score > 0 ? ' win' : ''}">
         <span class="pih-bid-name">${medals[i] || (i+1)+'.'} ${escAttr(p.label)}</span>
         <span class="pih-bid-val">${p.score} ${p.score === 1 ? 'Punkt' : 'Punkte'}</span>
       </div>`).join('');
    return;
  }

  grid.innerHTML = '';
}

function pihUpdateBidProgress(){
  const el = document.getElementById('pih-bid-progress');
  if (!el) return;
  const { done, total } = pihBidProgress();
  el.innerHTML = `${done} / ${total} <span style="font-size:.9rem;font-weight:600;color:#9a9a9a;">Gebote</span>`;
}

// Host trägt das Gebot eines Gastes ein. Getrennt von pihState.bids, weil dort
// Firebase die Handy-Gebote hereinspiegelt und eingetragene wieder wegwürfe.
function pihHostBid(i){
  const p = pihState.players[i];
  const inp = fieldEl('pih-bid-input-' + i);
  if (!p || !inp) return;
  const num = pihParsePrice(inp.value);
  if (num === null) { inp.style.borderColor = '#e23b3b'; return; }
  inp.style.borderColor = 'rgba(255,210,63,.6)';
  pihState.hostBids = pihState.hostBids || {};
  pihState.hostBids[p.uid] = { name: p.name, value: inp.value.trim(), num, ts: Date.now() };
  // Bewusst kein Neuaufbau des Grids: andere Gäste tippen vielleicht gerade.
  pihUpdateBidProgress();
}

/* ── Gebote über die Handys ───────────────────────────────────────────── */

let pihBidRound = 0;

const pihBids = makeRoundChannel('buzzer/estimate', 'answers', bids => {
  pihState.bids = bids;
  // Nur den Zähler auffrischen, nicht das ganze Grid: dort stehen die
  // Eingabefelder der Gäste und ein Neuaufbau würde das Getippte wegwerfen.
  if (pihState.phase === 'bid') pihUpdateBidProgress();
});

function pihBeginBids(){
  const it = pihCurrentItem();
  if (!it) return;
  pihState.phase = 'bid';
  pihState.bids = {};
  pihState.hostBids = {};
  pihBidRound = nextRoundId(pihBidRound);

  pihBids.detach();
  const ref = pihBids.open();
  if (ref) {
    ref.set({
      active: true,
      round: pihBidRound,
      question: 'Was kostet: ' + (it.name || '?'),
      answers: null,
    }).then(() => pihBids.attach()).catch(()=>{});
  }
  if (pihState.roundTime) pihStartTimer();
  pihRenderRound();
}

function pihCloseBids(){
  pihBids.detach();
  if (pihBids.ref) pihBids.ref.update({ active: false }).catch(()=>{});
}

function pihPhoneBidders(){ return pihState.players.filter(p => p.key); }
function pihGuestBidders(){ return pihState.players.filter(p => !p.key); }

// Handy-Gebote und vom Host eingetragene Gast-Gebote zusammengeführt.
// Gebote von Leuten, die gar nicht mitspielen, fallen dabei raus.
function pihAllBids(){
  const out = {};
  const phones = new Set(pihPhoneBidders().map(p => p.uid));
  Object.keys(pihState.bids || {}).forEach(k => { if (phones.has(k)) out[k] = pihState.bids[k]; });
  const guests = new Set(pihGuestBidders().map(p => p.uid));
  Object.keys(pihState.hostBids || {}).forEach(k => { if (guests.has(k)) out[k] = pihState.hostBids[k]; });
  return out;
}

function pihBidProgress(){
  return { done: Object.keys(pihAllBids()).length, total: pihState.players.length };
}

/* ── Auflösung ─────────────────────────────────────────────────────────── */

function pihEvaluate(){
  const it = pihCurrentItem();
  if (!it) return;
  const price = Number(it.price);
  const all = pihAllBids();

  // Erst prüfen, dann schließen: sonst wäre die Eingabe auf den Handys zu,
  // während der Host noch in der Gebotsphase feststeckt.
  if (!Object.keys(all).length) { alert('Es wurde noch kein Gebot abgegeben.'); return; }

  pihStopTimer();
  pihCloseBids();

  const rows = pihState.players.map(p => {
    const b = all[p.uid];
    if (!b) return null;
    const num = (typeof b.num === 'number' && isFinite(b.num)) ? b.num : null;
    return {
      uid: p.uid, label: p.label,
      value: b.value == null ? '' : String(b.value),
      num,
      diff: num === null ? null : num - price,
      // Durchgestrichen wird nur, wo Überbieten wirklich rausfliegt. Bei
      // "Nächstdran gewinnt" ist ein Gebot über dem Preis völlig normal.
      bust: pihState.rule === 'under' && num !== null && num > price,
      win: false, exact: false,
    };
  }).filter(Boolean);

  let winners = [];
  if (pihState.rule === 'under') {
    // Original: über dem Preis ist raus, von den übrigen gewinnt das höchste.
    const under = rows.filter(r => r.num !== null && r.num <= price);
    if (under.length) {
      const best = Math.max(...under.map(r => r.num));
      winners = under.filter(r => r.num === best);
    }
  } else {
    const valid = rows.filter(r => r.num !== null);
    if (valid.length) {
      const best = Math.min(...valid.map(r => Math.abs(r.diff)));
      winners = valid.filter(r => Math.abs(r.diff) === best);
    }
  }

  // Punkt für den Rundensieg, ein zweiter für den punktgenauen Treffer.
  // Cent-Toleranz, weil 19,99 getippt und 19.99 gespeichert sonst an der
  // Gleitkomma-Darstellung scheitern könnte.
  winners.forEach(r => {
    r.win = true;
    const p = pihByUid(r.uid);
    if (!p) return;
    p.score += 1;
    if (Math.abs(r.num - price) < 0.005) { r.exact = true; p.score += 1; }
  });

  // Sieger oben, danach nach Abstand. Gebote ohne Zahl ganz ans Ende.
  // Die Number() stehen da, weil win und der Null-Vergleich Wahrheitswerte
  // sind: JavaScript rechnet damit klaglos, die Typpruefung nicht. Nicht
  // wieder wegkuerzen.
  rows.sort((a,b) =>
    (Number(b.win) - Number(a.win)) ||
    (Number(a.num === null) - Number(b.num === null)) ||
    (Math.abs(a.diff ?? Infinity) - Math.abs(b.diff ?? Infinity)));

  pihState.lastResult = { price, rows, winners: winners.map(r => r.uid) };
  pihState.phase = 'result';
  pihRenderRound();
}

function pihAfterResult(){
  if (pihState.idx + 1 >= pihState.order.length) { pihFinish(); return; }
  pihNext();
}

function pihSkip(){
  if (pihState.idx + 1 >= pihState.order.length) { pihFinish(); return; }
  pihNext();
}

function pihNext(){
  pihStopTimer();
  pihCloseBids();
  activeMediaSlot = null; renderMediaOverlay(null);
  pihState.bids = {}; pihState.hostBids = {}; pihState.lastResult = null;
  pihState.idx++;
  pihState.phase = 'show';
  pihState.timeUp = false;
  pihRenderRound();
}

function pihStartTimer(){ startRoundClock(pihState, 'pih-timer'); }
function pihStopTimer(){ stopRoundClock(pihState, 'pih-timer'); }

function pihFinish(){
  pihStopTimer();
  pihCloseBids();
  activeMediaSlot = null; renderMediaOverlay(null);
  pihState.phase = 'done';
  pihState.active = false;
  pihState.timeUp = false;

  const rank = [...pihState.players].sort((a,b) => b.score - a.score);
  const top = rank.length && rank[0].score > 0 ? rank.filter(p => p.score === rank[0].score) : [];
  pihRenderScores(top.map(p => p.uid));

  setText('pih-timer', '');
  setHtml('pih-item', top.length === 1 ? `🏆 ${escAttr(top[0].label)} gewinnt!`
    : top.length     ? `🏆 Gleichstand: ${top.map(p => escAttr(p.label)).join(', ')}`
                     : 'Spiel beendet');
  setHtml('pih-stage', '');
  setHtml('pih-media-bar', '');
  setHtml('pih-price', '');
  setHtml('pih-note', '');
  pihRenderBidGrid();
  setHtml('pih-controls', `
    <button class="btn btn-primary" onclick="showScreen('pih-setup-screen')">Nochmal</button>
    <button class="btn btn-secondary" onclick="showScreen('menu-screen')">Zum Menü</button>`);
}

function pihQuit(){
  pihStopTimer();
  pihCloseBids();
  activeMediaSlot = null; renderMediaOverlay(null);
  pihState.active = false;
  showScreen('menu-screen');
}

/* ── Editor ────────────────────────────────────────────────────────────── */

// Aufbau wie im DDF-Editor: Zeile mit Name und Preis direkt tippbar, Bild und
// Notiz hinter dem ▸-Ausklapper, oben das Feld zum Masseneinfügen.
let pihEditOpen = -1;
let pihBulkVisible = false;

function renderPihEditor(){
  const box = document.getElementById('pih-editor');
  if (!box) return;

  const fieldCss = 'min-width:0;box-sizing:border-box;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.85rem;outline:none;';
  const noteCss  = 'width:100%;box-sizing:border-box;margin-top:8px;padding:7px 10px;border-radius:6px;border:1px solid rgba(255,210,63,.25);background:rgba(255,210,63,.05);color:#fff;font-family:inherit;font-size:.82rem;outline:none;';
  const sectCss  = 'display:block;font-size:.65rem;color:rgba(255,255,255,.4);margin:0 0 4px;';
  const n = pihData.items.length;

  const toolbar = `<div class="editor-toolbar">
    <span class="pih-card-head">${n} ${n === 1 ? 'Artikel' : 'Artikel'}</span>
    <button class="btn btn-secondary btn-xs" onclick="pihToggleBulk()">${pihBulkVisible ? '✕ Abbrechen' : '⇊ Mehrere einfügen'}</button>
  </div>`;

  const bulk = pihBulkVisible ? bulkPanelHtml({
    id: 'pih-bulk-text',
    label: 'Ein Artikel pro Zeile · Name und Preis mit „#" (Vorrang), „/", „|", Tabulator oder „;" trennen.',
    placeholder: 'Eine Kugel Eis / 1,80&#10;Ein Döner / 7,50&#10;Ein Kleinwagen, neu / 18500',
    onAdd: 'pihBulkAdd()',
  }) : '';

  const rows = pihData.items.map((it,i) => {
    const isOpen = pihEditOpen === i;
    const imgCount = (it.media||[]).filter(Boolean).length;
    const hasExtra = imgCount || (it.note && it.note.trim());
    const bad = it.price == null || !isFinite(it.price);
    const row = `<div style="display:flex;align-items:center;gap:7px;padding:5px 8px;background:#141A3D;border:1px solid ${isOpen?'rgba(255,210,63,.4)':'rgba(255,255,255,.07)'};border-radius:8px;${isOpen?'border-bottom-left-radius:0;border-bottom-right-radius:0;':''}">
      <span style="color:#FFD23F;font-weight:700;font-size:.72rem;width:26px;text-align:right;flex-shrink:0;">${i+1}.</span>
      <input id="pih-n-${i}" type="text" value="${escAttr(it.name)}" placeholder="Artikel" style="flex:3 1 0;${fieldCss}" oninput="pihData.items[${i}].name=this.value;pihSave()">
      <input type="text" value="${escAttr(pihPriceText(it.price))}" placeholder="Preis €" style="flex:1 1 0;max-width:120px;${fieldCss}${bad?'border-color:#e23b3b;':''}" oninput="pihSetPrice(${i},this)" onkeydown="pihPriceKey(event,${i})">
      <button tabindex="-1" onclick="pihToggleOpen(${i})" title="Bild &amp; Notiz" style="flex-shrink:0;background:none;border:none;cursor:pointer;color:${hasExtra?'#FFD23F':'#6C74A8'};font-size:.85rem;padding:2px 4px;display:inline-flex;align-items:center;gap:2px;">${isOpen?'▾':'▸'}<span style="font-size:.6rem;">${imgCount?('🖼'+imgCount):(it.note&&it.note.trim()?'📝':'')}</span></button>
      <button tabindex="-1" class="btn btn-danger" style="padding:5px 9px;font-size:.68rem;flex-shrink:0;" onclick="pihDeleteItem(${i})" title="Löschen">🗑</button>
    </div>`;
    const body = isOpen ? `<div class="pih-card" style="padding:12px;background:#0F1436;border:1px solid rgba(255,210,63,.25);border-top:none;border-radius:0 0 8px 8px;">
      <label style="${sectCss}">🖼 Bilder zum Artikel (max. ${PIH_MAX_MEDIA}) — das erste steht im Spiel groß auf der Bühne</label>
      ${mediaSlotsHtml(it.media||[], (s,expr) => `pihSetMedia(${i},${s},${expr})`, PIH_MAX_MEDIA)}
      <input type="text" value="${escAttr(it.note||'')}" placeholder="📝 Notiz für den Host (erscheint bei der Auflösung)" style="${noteCss}" oninput="pihData.items[${i}].note=this.value;pihSave()">
    </div>` : '';
    return `<div style="margin-bottom:5px;">${row}${body}</div>`;
  }).join('');

  box.innerHTML = toolbar + bulk + (n
    ? rows + `<button class="btn btn-secondary" style="width:100%;margin-top:6px;padding:9px;font-size:.75rem;" onclick="pihAddItem()">+ Artikel</button>`
    : `<div style="text-align:center;color:rgba(255,255,255,.4);font-size:.85rem;padding:20px;">
         Noch keine Artikel — „⇊ Mehrere einfügen", „+ Artikel" oder JSON importieren.
       </div>`);
}

// Der Preis steht als Zahl im Datensatz, im Feld aber in deutscher Schreibweise.
function pihPriceText(n){ return (typeof n === 'number' && isFinite(n)) ? String(n).replace('.', ',') : ''; }

// Kein Neuaufbau beim Tippen - der würde den Cursor ans Feldende werfen.
// Stattdessen färbt sich der Rahmen, solange die Eingabe keine Zahl ergibt.
function pihSetPrice(i, input){
  const num = pihParsePrice(input.value);
  pihData.items[i].price = num;
  input.style.borderColor = (input.value.trim() && num === null) ? '#e23b3b' : '';
  pihSave();
}
function pihPriceKey(e, i){
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (i === pihData.items.length - 1) pihAddItem();
  else { const nx = document.getElementById('pih-n-' + (i+1)); if (nx) nx.focus(); }
}

function pihToggleOpen(i){ pihEditOpen = (pihEditOpen === i ? -1 : i); renderPihEditor(); }
function pihToggleBulk(){
  pihBulkVisible = !pihBulkVisible;
  renderPihEditor();
  if (pihBulkVisible) { const t = document.getElementById('pih-bulk-text'); if (t) t.focus(); }
}

function pihBulkAdd(){
  const lines = bulkLines('pih-bulk-text');
  if (!lines) return;
  const added = lines.map(line => {
    const { left: name, right: price } = splitBulkLine(line);
    return { name, price: price ? pihParsePrice(price) : null, note: '', media: [] };
  }).filter(it => it.name);
  if (!added.length) { alert('Keine Zeilen erkannt.\nFormat: Artikel | Preis (eine pro Zeile)'); return; }
  pihData.items = pihData.items.concat(added);
  fieldSet('pih-bulk-text', '');
  pihBulkVisible = false;
  renderPihEditor();
  pihSave();
}

function pihSetMedia(i, slot, input){
  const it = pihData.items[i];
  if (!it) return;
  if (!Array.isArray(it.media)) it.media = [];
  setMediaSlot(it.media, slot, input, () => { pihSave(); renderPihEditor(); });
}

function pihAddItem(){
  pihData.items.push({ name:'', price:null, note:'', media:[] });
  pihEditOpen = -1;
  renderPihEditor(); pihSave();
  const el = document.getElementById('pih-n-' + (pihData.items.length - 1));
  if (el) el.focus();
}
function pihDeleteItem(i){
  if (!confirm('Artikel löschen?')) return;
  pihData.items.splice(i,1);
  if (pihEditOpen === i) pihEditOpen = -1;
  renderPihEditor(); pihSave();
}

function exportPih(){ downloadJSON(pihData, 'der-preis-ist-heiss.json'); }
function importPih(e){
  readJsonFile(e, d => {
    const list = Array.isArray(d.items) ? d.items : (Array.isArray(d) ? d : null);
    if (!list) throw new Error('Datei braucht ein Array "items"');
    pihData = {
      items: list.map(x => ({
        name: x.name || x.artikel || x.title || '',
        price: typeof x.price === 'number' ? x.price : pihParsePrice(x.price ?? x.preis),
        note: x.note || x.notiz || '',
        media: (x.media || []).slice(0, PIH_MAX_MEDIA),
      }))
    };
    renderPihEditor(); pihSave();
  });
}

function pihSave(){ storeSetJson('pihData', pihData); }
function pihLoad(){ pihData = storeGetJson('pihData', pihData); }
pihLoad();

function pihSaveSettings(){
  storeSetJson('pihSettings', {
    rounds: Number(fieldVal('pih-rounds')) || 0,
    time: pihState.roundTime,
    rule: pihState.rule,
  });
}
function pihLoadSettings(){
  const s = storeGetJson('pihSettings');
  if (!s) return;
  if (s.rule && PIH_RULES.some(r => r.key === s.rule)) pihState.rule = s.rule;
  if (s.rounds != null) fieldSet('pih-rounds', s.rounds);
  if (s.time   != null && fieldSet('pih-time', s.time)) pihState.roundTime = s.time;
}

