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

  // Das Zuschauerfenster gehoert zu jeder Show. Erst nach den Pruefungen:
  // ein abgebrochener Start soll kein leeres Fenster aufmachen.
  openBoardPopout();

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
  pihIntroThenGame();
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
  updateGamemaster();
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

  // Fuers Turnier: Punkte je Team, aufsummiert ueber die Teilnehmer.
  const turnierBericht = tournamentReportTeamless('Der Preis ist heiß', pihState.players, p => p.score);

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
  setHtml('pih-note', escAttr(turnierBericht));
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

/* ── Ordner einlesen ──────────────────────────────────────────────────────
   Ein ganzer Ordner Produktbilder auf einmal: je Bild ein Artikel. Name und
   Preis stehen im Dateinamen, das Bild wandert auf den ersten Medienplatz.

   Warum aus dem Dateinamen und nicht aus einer Begleitdatei: David benennt
   die Bilder beim Sammeln ohnehin, und eine zweite Datei, die zu den Bildern
   passen muss, ist eine Fehlerquelle mehr. Erkannt werden

     Kaffeemaschine_49,99.jpg     Kaffeemaschine - 49,99.jpg
     Kaffeemaschine 49,99 €.jpg   Kaffeemaschine # 49,99.jpg
     49,99 - Kaffeemaschine.jpg   03_Kaffeemaschine_49,99.jpg

   Eine blosse Zahl am Ende ohne Trennzeichen zaehlt bewusst NICHT als Preis:
   "Playstation 5.jpg" ist ein Name, kein Artikel fuer 5 Euro. Ohne erkannten
   Preis wird der Artikel trotzdem angelegt, nur mit leerem Preisfeld - das
   faellt im Editor durch den roten Rahmen sofort auf. */
let pihImportInfo = '';

/** Name und Preis aus einem Dateinamen.
 *  @param {string} fname @returns {{name:string, price:number|null}} */
function pihParseFileName(fname){
  let s = String(fname || '').replace(/\.[a-z0-9]{2,5}$/i, '');   // Endung weg
  s = s.replace(/^\s*\d{1,3}\s*[._)\-]\s*/, '');                // "03_" / "3. " weg
  let price = null, name = s;
  const nimm = (roh, rest) => {
    const n = pihParsePrice(roh);
    if (n !== null && n > 0) { price = n; name = rest; }
  };
  let m;
  if ((m = s.match(/^(.*?)\s*#\s*(.+)$/)))                                          nimm(m[2], m[1]);
  else if ((m = s.match(/^(.*?)[\s_|;,-]+([\d][\d.,]*)\s*(?:€|eur)\s*$/i)))          nimm(m[2], m[1]);
  else if ((m = s.match(/^(.*?)\s*[_|;]\s*([\d][\d.,]*)\s*$/)))                     nimm(m[2], m[1]);
  else if ((m = s.match(/^(.*?)\s+[-–]\s+([\d][\d.,]*)\s*$/)))                      nimm(m[2], m[1]);
  else if ((m = s.match(/^(.*?)[\s-]*(\d+[.,]\d{1,2})\s*$/)))                       nimm(m[2], m[1]);
  else if ((m = s.match(/^([\d][\d.,]*)\s*(?:€|eur)?\s*[_|;\-–]\s*(.+)$/i)))        nimm(m[1], m[2]);
  name = name.replace(/_+/g, ' ').replace(/\s{2,}/g, ' ')
             .replace(/^[\s\-–|;,.]+|[\s\-–|;,.]+$/g, '').trim();
  return { name, price };
}

/** @param {string} text */
function pihSetImportInfo(text){
  pihImportInfo = text;
  const el = document.getElementById('pih-import-info');
  if (!el) return;
  el.textContent = text;
  el.style.display = text ? '' : 'none';
}

/** Alle Bilder eines Ordners als Artikel anlegen.
 *  @param {HTMLInputElement} input */
async function pihImportFolder(input){
  const alle = [...(input.files || [])];
  input.value = '';                       // sonst loest derselbe Ordner kein zweites Mal aus
  const bilder = alle
    .filter(f => f.type.startsWith('image/'))
    .sort((a, b) => a.name.localeCompare(b.name, 'de', { numeric: true }));
  if (!bilder.length){
    alert(alle.length
      ? 'In dem Ordner sind keine Bilder.'
      : 'Kein Ordner ausgewählt.');
    return;
  }
  const neu = [];
  let ohnePreis = 0, unlesbar = 0;
  for (let i = 0; i < bilder.length; i++){
    const f = bilder[i];
    pihSetImportInfo(`Liest ${i + 1} von ${bilder.length} …`);
    const { name, price } = pihParseFileName(f.name);
    // 1280 px reichen fuer jede Leinwand und halten den Datensatz klein.
    const data = await shrinkImageToDataUrl(f, 1280, 0.82);
    if (!data){ unlesbar++; continue; }
    if (price === null) ohnePreis++;
    neu.push({
      name: name || f.name,
      price,
      note: '',
      media: [{ type: 'image', data, name: f.name }],
    });
  }
  if (!neu.length){ pihSetImportInfo(''); alert('Keins der Bilder ließ sich lesen.'); return; }
  pihData.items = pihData.items.concat(neu);
  pihEditOpen = -1;
  // pihSave meldet false, wenn localStorage voll ist. Das darf nicht still
  // bleiben: die Artikel stehen dann zwar im Editor, waeren aber nach dem
  // naechsten Neuladen weg.
  const gespeichert = pihSave();
  renderPihEditor();
  const teile = [`${neu.length} ${neu.length === 1 ? 'Artikel' : 'Artikel'} aus dem Ordner`];
  teile.push(ohnePreis ? `${ohnePreis} ohne erkannten Preis (rot markiert)` : 'alle mit Preis');
  if (unlesbar) teile.push(`${unlesbar} Datei(en) nicht lesbar`);
  if (!gespeichert) teile.push('⚠ NICHT gespeichert — Speicher voll. Exportiere als JSON, bevor du neu lädst.');
  pihSetImportInfo(teile.join(' · '));
  if (!gespeichert) alert('Die Artikel sind da, konnten aber nicht gespeichert werden — der Browser-Speicher ist voll.\nExportiere sie als JSON, sonst sind sie nach dem Neuladen weg.');
}

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
    <label class="btn btn-secondary btn-xs" style="cursor:pointer;" title="Einen ganzen Ordner mit Bildern einlesen. Name und Preis kommen aus dem Dateinamen, z.B. „Kaffeemaschine_49,99.jpg".">
      📁 Ordner einlesen
      <input type="file" webkitdirectory directory multiple style="display:none;" onchange="pihImportFolder(this)">
    </label>
  </div>
  <div id="pih-import-info" class="hint-line" style="${pihImportInfo ? '' : 'display:none;'}">${escapeHtml(pihImportInfo)}</div>`;

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

/** @returns {boolean} false, wenn der Browser-Speicher voll ist */
function pihSave(){ return storeSetJson('pihData', pihData); }
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


/* ── INTRO UND ANLEITUNG ───────────────────────────────────────────────────
   Wie bei Feud und Jeopardy: Zeichen, Anleitung, Titelkarte, dann das Spiel.
   Kein openGamemaster() - dieses Spiel hat kein GM-Panel, das Fenster zeigte
   sonst den Feud-Rückfall. */
function pihIntroThenGame(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const old = document.querySelector('.black-backdrop');
  if (old) old.remove();
  addBlackBackdrop();
  // Schon jetzt oeffnen, damit Intro und Anleitung vom GM-Fenster (und vom
  // Handy-Gamepad) aus weitergeklickt werden koennen.
  openGamemaster();
  // Erst das Show-Intro (falls eingeschaltet), dann das Zeichen dieser Show.
  runIntroThen(() => {
  const ov = document.createElement('div');
  ov.className = 'intro-overlay';
  ov.innerHTML = `<div class="game-intro-sign">${gameCardIcon('pih')}</div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', () => closeOverlay(ov, () => {
    runTutorial(pihTutorialSlides(), pihShowTitle);
  }));
  });
}

function pihShowTitle(){
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="game-title-sign">${gameCardIcon('pih')}</div>
    <div class="welcome-line1">Es beginnt</div>
    <div class="welcome-line2">Der Preis ist heiß</div>
  `, 1800, () => {
    showScreen('pih-screen');
    pihRenderRound();
    fadeOutBackdrop(document.querySelector('.black-backdrop'));
  });
}

function showPihTutorial(){ runTutorial(pihTutorialSlides()); }

/* Die Anleitung erklärt die Regel, die wirklich eingestellt ist. Beide Regeln
   nebeneinander zu zeigen wäre bequemer, aber genau daraus entsteht am Tisch
   der Streit: die Hälfte hat die andere Hälfte des Satzes behalten. */
function pihTutorialSlides(){
  const rule = PIH_RULES.find(r => r.key === pihState.rule) || PIH_RULES[0];
  const time = Math.max(0, Number(fieldVal('pih-time')) || 0);
  const under = pihState.rule === 'under';
  return [
    `<div class="tut-star-anim" style="margin-bottom:10px;">${gameCardIcon('pih')}</div>
     <div class="tut-big tut-gold" style="font-size:3rem;">Der Preis<br>ist heiß</div>
     <div class="tut-sub">Wie teuer ist das? Alle schätzen gleichzeitig.</div>`,

    `<div class="tut-icon">🏷️</div>
     <div class="tut-big tut-white" style="font-size:2.3rem;">Ein Artikel, ein Preis</div>
     <div class="tut-sub">Der Artikel kommt auf die Leinwand.
       ${time ? `Ihr habt <b>${time} Sekunden</b>, ` : 'Dann '}
       tippt jeder seinen Tipp ins Handy.<br>
       Niemand sieht, was die anderen schreiben.</div>`,

    `<div class="tut-big tut-gold" style="font-size:2.2rem;margin-bottom:10px;">${escapeHtml(rule.label)}</div>
     <div class="tut-pih-row">
       <div class="tut-pih-bid ${under ? 'bust' : ''}"><span>Anna</span><b>210 €</b></div>
       <div class="tut-pih-bid win"><span>Ben</span><b>185 €</b></div>
       <div class="tut-pih-bid"><span>Clara</span><b>120 €</b></div>
     </div>
     <div class="tut-pih-price">Echter Preis: 199 €</div>
     <div class="tut-sub">${escapeHtml(rule.hint)}</div>`,

    `<div class="tut-icon">👑</div>
     <div class="tut-big tut-white" style="font-size:2.3rem;">Ein Punkt pro Runde</div>
     <div class="tut-sub">Wer am besten geschätzt hat, bekommt ihn.<br>
       Bei Gleichstand bekommen ihn beide.</div>`,

    `<div class="tut-icon tut-trophy-bounce">🏆</div>
     <div class="tut-big tut-gold" style="font-size:2.8rem;">Die meisten Punkte<br>gewinnen</div>
     <div class="tut-sub">Die Wertung steht die ganze Zeit oben —<br>
       wer führt, trägt die Krone.</div>`,
  ];
}

/* Gebot eines Gastes setzen, ohne das Eingabefeld auf dem Hauptbildschirm zu
   brauchen. pihHostBid() liest es aus dem DOM des Hauptfensters - aus dem
   GM-Fenster heraus gibt es das Feld dort gar nicht. */
function pihHostBidValue(uid, value){
  const p = pihByUid(uid);
  if (!p) return;
  const num = pihParsePrice(value);
  pihState.hostBids = pihState.hostBids || {};
  if (num === null) { delete pihState.hostBids[uid]; }
  else pihState.hostBids[uid] = { name: p.name, value: String(value).trim(), num, ts: Date.now() };
  pihUpdateBidProgress();
  updateGamemaster();
}

/* ── GAMEMASTER-PANEL ──────────────────────────────────────────────────────
   Siehe ddf.js: ohne Panel ist die Show nur am Hauptrechner moderierbar, weil
   das Handy-Gamepad genau dieses Fenster spiegelt. */
function pihGmControlsHtml(pfx){
  const s = pihState;
  let b = '';
  if (s.phase === 'show'){
    b += `<button class="gm-btn gm-gold" onclick="${pfx}pihBeginBids()">Gebote öffnen</button>`;
    b += `<button class="gm-btn gm-gray" onclick="${pfx}pihSkip()">Artikel überspringen</button>`;
  } else if (s.phase === 'bid'){
    b += `<button class="gm-btn gm-gold" onclick="${pfx}pihEvaluate()">Auflösen</button>`;
    if (s.roundTime) b += `<button class="gm-btn gm-gray" onclick="${pfx}pihStartTimer()">⏱ Zeit neu</button>`;
  } else if (s.phase === 'result'){
    const last = s.idx + 1 >= s.order.length;
    b += `<button class="gm-btn gm-gold" onclick="${pfx}pihAfterResult()">${last ? 'Endstand' : 'Weiter →'}</button>`;
  }
  b += `<button class="gm-btn gm-gray" onclick="${pfx}pihQuit()">Beenden</button>`;
  return b;
}

function updateGamemasterPih(){
  const s = pihState;
  const it = pihCurrentItem();
  const prog = pihBidProgress();
  const rule = PIH_RULES.find(r => r.key === s.rule) || PIH_RULES[0];

  // Der echte Preis steht im GM-Fenster von Anfang an - der Host muss wissen,
  // worauf es hinauslaeuft, bevor er aufloest. Auf der Leinwand bleibt er bis
  // zur Aufloesung verdeckt.
  let body = it
    ? `<div class="question">${escapeHtml(it.name)}</div>
       <div class="hint-line">Echter Preis: <b style="color:#FFD23F;">${pihMoney(Number(it.price))}</b>${
         s.phase === 'result' ? ' <span style="color:#22C55E;">· aufgelöst</span>'
                              : ' <span style="color:rgba(255,255,255,.35);">· noch verdeckt</span>'}</div>
       ${qNoteHtml(it.note)}
       ${mediaControlButtonsHtml(it.media, 'pihShowMedia')}`
    : `<div class="hint-line">Kein Artikel offen.</div>`;

  body += `<div class="hint-line" style="margin-top:10px;">Regel: <b>${escapeHtml(rule.label)}</b></div>`;

  if (s.phase === 'bid'){
    body += `<div class="hint-line">Gebote: <b>${prog.done}/${prog.total}</b> abgegeben</div>`;
    const guests = pihGuestBidders();
    if (guests.length){
      body += `<div class="hint-line">Gäste ohne Handy hier eintragen:</div>` +
        guests.map(p => {
          const cur = s.hostBids && s.hostBids[p.uid] ? s.hostBids[p.uid].value : '';
          return `<div class="panel-row" style="align-items:center;gap:8px;margin-bottom:6px;">
            <span style="min-width:110px;font-weight:700;font-size:.8rem;">${escapeHtml(p.label)}</span>
            <input type="text" inputmode="decimal" placeholder="z.B. 12,90" value="${escAttr(cur)}"
              onchange="opener.pihHostBidValue(${escJsArg(p.uid)}, this.value)"
              style="flex:1;padding:9px 12px;border-radius:8px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.35);color:#fff;font-family:inherit;font-weight:700;text-align:center;outline:none;">
          </div>`;
        }).join('');
    }
  }

  if (s.phase === 'result' && s.lastResult){
    body += `<div class="answer-list" style="margin-top:10px;">` +
      s.lastResult.rows.map(r => `
        <div class="answer" style="${r.win ? 'background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.45)' : ''}">
          <span><span class="text" style="${r.bust ? 'text-decoration:line-through;opacity:.6;' : ''}">${escapeHtml(r.label)}</span></span>
          <span class="pts">${escapeHtml(r.value || '—')}${
            r.diff === null ? '' : ` <span class="tm">(${r.diff > 0 ? '+' : ''}${pihMoney(r.diff)})</span>`}</span>
        </div>`).join('') + `</div>`;
  }

  const rows = s.players.map(p =>
    `<div class="money"><span>${escapeHtml(p.label)}</span><strong>${p.score}</strong></div>`).join('');

  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}
  .money{display:flex;justify-content:space-between;gap:10px;font-size:.85rem;margin-bottom:3px;}
  .money strong{color:#FFD23F;}
  .tm{font-size:.72rem;color:rgba(255,255,255,.5);}
</style></head><body>
  ${gmHeaderHtml('Gamemaster', `Der Preis ist heiß · Artikel ${Math.min(s.idx + 1, s.order.length)}/${s.order.length}`)}
  <div class="gm-body">
  <div class="gm-main">${body}</div>
  <div class="gm-side">
  <div class="panel">
    <div class="panel-head"><span>🏆 Wertung</span></div>
    ${rows}
    <div class="tm">${s.roundTime ? (s.timeUp ? 'Zeit abgelaufen' : 'Timer: ' + s.timer + ' s') : ''}</div>
  </div>
  ${gmNotesPanelHtml()}
  </div>
  </div>
  <div class="gm-actions">${pihGmControlsHtml('opener.')}</div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}
