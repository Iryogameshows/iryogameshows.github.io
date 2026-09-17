// @ts-check
/* Wer weiss denn sowas.

   Herausgeloest aus index.html (Zeilen 7252-8045). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */

// ══════════ WER WEISS DENN SOWAS ══════════
// Format (ARD): 12 Kategorien, Teams wählen abwechselnd. Jede Frage hat 3
// Antworten und bringt 500 €. Publikumsjoker 1x pro Team. Danach die
// Masterfrage mit Einsatz (richtig = Einsatz dazu, falsch = Einsatz weg).
// Gleichstand wird per Schätzfrage entschieden.
const WWDS_LETTERS = ['A','B','C'];
const WWDS_WIN = 500;
const WWDS_COLORS = ['red','blue','green'];
const WWDS_HEX  = ['#E8453C','#3B82F6','#22C55E'];

let wwdsData = {
  categories: [
    { cat:'Tiere',     q:'Wie viele Herzen hat ein Regenwurm?', answers:['1','5','10'], correct:1, note:'Genau genommen 5 Aortenbögen.', media:[] },
    { cat:'Sprache',   q:'Woher stammt der Ausdruck „Hals- und Beinbruch"?', answers:['Aus dem Jiddischen','Aus der Zirkussprache','Aus dem Bergbau'], correct:0, note:'Von „hatslokhe un brokhe" – Glück und Segen.', media:[] },
    { cat:'Essen',     q:'Wodurch bekommen Laugenbrezeln ihre braune Farbe?', answers:['Karamell','Natronlauge','Malzzusatz'], correct:1, note:'', media:[] },
    { cat:'Alltag',    q:'Warum sind Tennisbälle gelb?', answers:['Wegen des Farbfernsehens','Wegen der Haltbarkeit','Wegen des Rasens'], correct:0, note:'Seit 1972 – besser sichtbar im TV.', media:[] },
    { cat:'Körper',    q:'Wozu dient Gänsehaut ursprünglich?', answers:['Zur Abkühlung','Zum Aufstellen des Fells','Zur Schweißbildung'], correct:1, note:'Relikt aus der Zeit mit dichtem Körperfell.', media:[] },
    { cat:'Technik',   q:'Wofür stand das „i" beim ersten iMac?', answers:['Internet','Innovation','Individuell'], correct:0, note:'', media:[] },
    { cat:'Geschichte',q:'Wie lange dauerte der kürzeste Krieg der Geschichte?', answers:['38 Minuten','7 Stunden','3 Tage'], correct:0, note:'Großbritannien–Sansibar, 1896.', media:[] },
    { cat:'Weltall',   q:'Welche Farbe hat ein Sonnenuntergang auf dem Mars?', answers:['Rot','Grün','Blau'], correct:2, note:'Der Staub streut rotes Licht weg.', media:[] },
    { cat:'Musik',     q:'Wie viele Tasten hat ein Standard-Klavier?', answers:['76','88','96'], correct:1, note:'', media:[] },
    { cat:'Sport',     q:'Wozu dienen die Dellen im Golfball?', answers:['Für mehr Reichweite','Für besseren Griff','Für weniger Gewicht'], correct:0, note:'Die Dimples verringern den Luftwiderstand.', media:[] },
    { cat:'Verkehr',   q:'Warum wird das Licht im Flugzeug beim Start gedimmt?', answers:['Um Strom zu sparen','Damit Passagiere schlafen','Zur Gewöhnung der Augen'], correct:2, note:'Für den Notfall – Augen sind sofort dunkeladaptiert.', media:[] },
    { cat:'Kurioses',  q:'Welches Produkt wurde als erstes per Barcode gescannt?', answers:['Kaugummi','Cornflakes','Milch'], correct:0, note:'Wrigley\'s, 1974 in Ohio.', media:[] },
  ],
  master: { q:'Wie viele Haare verliert ein Mensch im Schnitt pro Tag?', answers:['ca. 30','ca. 100','ca. 300'], correct:1, note:'', media:[] },
  tiebreakers: [
    { q:'Wie viele Knochen hat ein erwachsener Mensch?', answer:206, note:'' },
    { q:'Wie hoch ist der Eiffelturm in Metern?', answer:330, note:'' },
    { q:'Wie viele Liter Blut pumpt das Herz pro Tag?', answer:7000, note:'' },
  ]
};

let wwdsState = {
  active:false, teamCount:2, teamNames:[], scores:[],
  currentTeam:0, used:[], currentCat:null,
  selected:null, locked:false, revealed:false,
  audienceUsed:[], audienceShown:false, audienceData:null,
  phase:'pick',            // pick | question | bet | master | tie | done
  bets:[], masterPick:[], masterRevealed:false,
  tieIdx:0, tieGuesses:[], tieRevealed:false, tieGuessesShown:false,
  timer:0, timerInt:null, timeUp:false,
};

function wwdsMoney(n){ return (n||0).toLocaleString('de-DE') + ' €'; }
function wwdsQPerTeam(){ return Math.floor(wwdsData.categories.length / wwdsState.teamCount); }

function wwdsToggleTeam3(){
  const on = fieldChecked('wwds-enable-team3');
  document.getElementById('wwds-t3-card').style.display = on ? '' : 'none';
  const n = on ? 3 : 2;
  const per = Math.floor(wwdsData.categories.length / n);
  document.getElementById('wwds-split-info').textContent =
    `${wwdsData.categories.length} Kategorien · je ${per} Fragen pro Team · max. ${wwdsMoney(per*WWDS_WIN)} in der Hauptrunde`;
  // Drittes Team an-/abschalten ändert die Auswahl auf den Handys
  if (document.getElementById('wwds-setup-lobby')) broadcastWwdsSetupTeamNames();
}

// ── START ──
function startWwds(){
  if (!wwdsData.categories.length) return alert('Keine Kategorien angelegt!');
  openBoardPopout();
  startWwdsActual();
}
function startWwdsActual(){
  jeopardyState.active = false;
  wwmState.active = false;
  finaleState.active = false;

  wwdsState.teamCount = fieldChecked('wwds-enable-team3') ? 3 : 2;
  wwdsState.teamNames = [];
  wwdsState.scores = [];
  wwdsState.audienceUsed = [];
  wwdsState.bets = [];
  wwdsState.masterPick = [];
  wwdsState.tieGuesses = [];
  for (let i = 0; i < wwdsState.teamCount; i++){
    wwdsState.teamNames.push(fieldVal(`wwds-t${i+1}-name`) || `Team ${i+1}`);
    wwdsState.scores.push(0);
    wwdsState.audienceUsed.push(false);
    wwdsState.bets.push(0);
    wwdsState.masterPick.push(null);
    wwdsState.tieGuesses.push(null);
  }
  wwdsState.used = new Array(wwdsData.categories.length).fill(false);
  wwdsState.currentTeam = Math.floor(Math.random() * wwdsState.teamCount);
  // Endgültige Teamnamen an die Handys, danach keine neuen Beitritte mehr
  activeBuzzerContext = 'wwds';
  buzzerBroadcastTeams(wwdsState.teamNames);
  lockBuzzerJoins(feudBuzzer);
  wwdsState.currentCat = null;
  wwdsState.phase = 'pick';
  wwdsState.masterRevealed = false;
  wwdsState.tieIdx = 0;
  wwdsState.tieRevealed = false;
  wwdsState.active = true;
  wwdsStopTimer();

  showScreen('wwds-screen');
  renderWwds();
  setTimeout(() => openGamemaster(), 120);
}

// ── TIMER (20 s, blockiert nicht – der Host entscheidet) ──
function wwdsStopTimer(){
  if (wwdsState.timerInt) clearInterval(wwdsState.timerInt);
  wwdsState.timerInt = null;
}
function wwdsStartTimer(){
  wwdsStopTimer();
  wwdsState.timer = 20;
  wwdsState.timeUp = false;
  wwdsState.timerInt = setInterval(() => {
    wwdsState.timer--;
    if (wwdsState.timer <= 0){
      wwdsState.timer = 0;
      wwdsState.timeUp = true;
      wwdsStopTimer();
      SFX.wrong();
    } else if (wwdsState.timer <= 5) SFX.tick();
    wwdsRenderTimer();
    updateGamemaster();
  }, 1000);
  wwdsRenderTimer();
}
function wwdsRenderTimer(){
  const el = document.getElementById('wwds-timer');
  if (!el) return;
  el.textContent = wwdsState.timeUp ? 'Zeit!' : String(wwdsState.timer);
  el.className = 'wwds-timer' + (wwdsState.timeUp ? ' done' : (wwdsState.timer <= 5 ? ' urgent' : ''));
}

// ── RENDER ──
function renderWwds(){
  wwdsRenderTeams();
  const info = document.getElementById('wwds-info');
  const turn = document.getElementById('wwds-turn');
  const p = wwdsState.phase;
  info.textContent = p === 'bet' ? 'Einsätze für die Masterfrage'
    : p === 'master' ? 'Masterfrage'
    : p === 'tie' ? 'Schätzfrage (Stichfrage)'
    : `Hauptrunde · ${wwdsState.used.filter(Boolean).length} / ${wwdsData.categories.length}`;
  turn.textContent = (p === 'pick' || p === 'question') ? wwdsState.teamNames[wwdsState.currentTeam] : '—';

  const stage = document.getElementById('wwds-stage');
  if (p === 'pick') stage.innerHTML = wwdsGridHtml();
  else if (p === 'question') stage.innerHTML = wwdsQuestionHtml();
  else if (p === 'bet') stage.innerHTML = wwdsBetHtml();
  else if (p === 'master') stage.innerHTML = wwdsMasterHtml();
  else if (p === 'tie') stage.innerHTML = wwdsTieHtml();
  wwdsRenderTimer();
}

function wwdsRenderTeams(){
  document.getElementById('wwds-teams').innerHTML = wwdsState.teamNames.map((n,i) => {
    const isTurn = (wwdsState.phase === 'pick' || wwdsState.phase === 'question') && wwdsState.currentTeam === i;
    let lock = '';
    if (wwdsState.phase === 'master')
      lock = wwdsState.masterRevealed
        ? (wwdsState.masterPick[i] === null ? '—' : WWDS_LETTERS[wwdsState.masterPick[i]])
        : (wwdsState.masterPick[i] === null ? '' : '✓');
    if (wwdsState.phase === 'bet') lock = wwdsMoney(wwdsState.bets[i]);
    if (wwdsState.phase === 'tie')
      lock = wwdsState.tieGuesses[i] === null ? '' : (wwdsState.tieRevealed ? String(wwdsState.tieGuesses[i]) : '✓');
    const per = wwdsQPerTeam();
    return `<div class="wwds-team ${WWDS_COLORS[i]} ${isTurn?'on':''}">
      <div class="wt-name">${n}</div>
      <div class="wt-money">${wwdsMoney(wwdsState.scores[i])}</div>
      <div class="wt-meta">Joker ${wwdsState.audienceUsed[i]?'verbraucht':'frei'} · ${per} Fragen</div>
      ${lock ? `<div class="wt-lock">${lock}</div>` : ''}
    </div>`;
  }).join('');
}

function wwdsGridHtml(){
  return `<div class="wwds-sub" style="margin-bottom:12px;">
      <strong style="color:#FFD23F;">${wwdsState.teamNames[wwdsState.currentTeam]}</strong> wählt eine Kategorie
    </div>
    <div class="wwds-grid">` +
    wwdsData.categories.map((c,i) => `
      <div class="wwds-cat ${wwdsState.used[i]?'done':''}" ${wwdsState.used[i]?'':`onclick="wwdsPick(${i})"`}>
        <span class="wc-num">${i+1}</span>
        <span class="wc-name">${c.cat || 'Kategorie'}</span>
      </div>`).join('') + `</div>`;
}

function wwdsQuestionHtml(){
  const c = wwdsData.categories[wwdsState.currentCat];
  return `<div style="text-align:center;"><span class="wwds-cat-chip">${c.cat||''}</span></div>
    <div style="display:flex;justify-content:center;margin-bottom:10px;"><div class="wwds-timer" id="wwds-timer">20</div></div>
    <div class="wwds-q" style="margin-bottom:14px;">${c.q}</div>
    <div class="wwds-opts">${wwdsOptsHtml(c, wwdsState.selected, wwdsState.revealed, i => `wwdsSelect(${i})`)}</div>
    ${wwdsAudienceHtml(c)}`;
}

function wwdsOptsHtml(q, sel, revealed, onClickFn, tags){
  return q.answers.map((a,i) => {
    let cls = '';
    if (revealed && i === q.correct) cls = 'right';
    else if (revealed && i === sel && i !== q.correct) cls = 'bad';
    else if (!revealed && sel === i) cls = 'sel';
    const tagHtml = (tags && tags[i] && tags[i].length)
      ? `<span class="wo-tags">${tags[i].map(t => `<span class="wwds-tag" style="background:${t.color}">${t.label}</span>`).join('')}</span>` : '';
    const click = onClickFn ? ` onclick="${onClickFn(i)}"` : '';
    return `<div class="wwds-opt ${cls}"${click}>
      <span class="wo-let">${WWDS_LETTERS[i]}</span><span>${a}</span>${tagHtml}
    </div>`;
  }).join('');
}

function wwdsAudienceHtml(c){
  if (!wwdsState.audienceShown || !wwdsState.audienceData) return '';
  return `<div class="wwds-aud">` + c.answers.map((a,i) =>
    `<div class="wwds-abar" style="height:${Math.max(6, wwdsState.audienceData[i])}%">
       <span class="wa-pct">${wwdsState.audienceData[i]}%</span><span class="wa-let">${WWDS_LETTERS[i]}</span>
     </div>`).join('') + `</div>`;
}

function wwdsBetHtml(){
  return `<div class="wwds-banner">Die Masterfrage</div>
    <div class="wwds-sub" style="margin:6px 0 14px;">Jedes Team setzt einen Teil seines Guthabens.<br>
      Richtig = Einsatz kommt dazu · Falsch = Einsatz geht ab.</div>` +
    wwdsState.teamNames.map((n,i) => `
      <div class="wwds-bet-row">
        <span style="min-width:120px;text-align:right;font-weight:700;color:${WWDS_HEX[i]};">${n}</span>
        <span style="color:rgba(255,255,255,.4);font-size:.8rem;">Guthaben ${wwdsMoney(wwdsState.scores[i])}</span>
        <span style="min-width:110px;padding:9px 12px;border-radius:8px;background:rgba(0,0,0,.35);
              border:1.5px solid rgba(255,255,255,.12);text-align:center;
              font-family:'Bebas Neue',sans-serif;font-size:1.4rem;color:#FFD23F;">${wwdsMoney(wwdsState.bets[i])}</span>
      </div>`).join('') +
    `<div class="wwds-sub" style="margin-top:16px;">Einsätze setzt und startet der Host über den Gamemaster.</div>`;
}

function wwdsMasterHtml(){
  const m = wwdsData.master;
  const tags = m.answers.map((_, i) =>
    wwdsState.teamNames.map((n, t) => (wwdsState.masterRevealed && wwdsState.masterPick[t] === i)
      ? { label:n, color:WWDS_HEX[t] } : null).filter(Boolean));
  return `<div style="text-align:center;"><span class="wwds-cat-chip">Masterfrage</span></div>
    <div style="display:flex;justify-content:center;margin-bottom:10px;"><div class="wwds-timer" id="wwds-timer">20</div></div>
    <div class="wwds-q" style="margin-bottom:14px;">${m.q}</div>
    <div class="wwds-opts">${wwdsOptsHtml(m, null, wwdsState.masterRevealed, null, tags)}</div>
    <div class="wwds-sub" style="margin-top:12px;">${wwdsState.masterRevealed
      ? 'Aufgelöst.' : 'Die Teams legen ihre Antwort fest — sichtbar erst bei der Auflösung.'}</div>`;
}

function wwdsTieHtml(){
  const t = wwdsData.tiebreakers[wwdsState.tieIdx];
  if (!t) return `<div class="wwds-banner">Keine Schätzfrage hinterlegt</div>
    <div style="text-align:center;margin-top:14px;"><button class="btn btn-primary" onclick="wwdsFinish(true)">Trotzdem beenden</button></div>`;
  return `<div style="text-align:center;"><span class="wwds-cat-chip">Stichfrage ${wwdsState.tieIdx+1}</span></div>
    <div class="wwds-banner">Gleichstand!</div>
    <div class="wwds-sub" style="margin:6px 0 14px;">Wer am nächsten dran ist, gewinnt.</div>
    <div class="wwds-q" style="margin-bottom:14px;">${t.q}</div>` +
    wwdsState.teamNames.map((n,i) => wwdsState.scores[i] === Math.max(...wwdsState.scores) ? `
      <div class="wwds-bet-row">
        <span style="min-width:120px;text-align:right;font-weight:700;color:${WWDS_HEX[i]};">${n}</span>
        <span class="wwds-guess ${wwdsState.tieGuessesShown ? 'shown' : ''}">${
          wwdsState.tieGuesses[i] === null ? '—'
            : (wwdsState.tieGuessesShown ? wwdsState.tieGuesses[i] : '000')}</span>
      </div>` : '').join('') +
    (wwdsState.tieRevealed
      ? `<div class="wwds-banner" style="margin-top:14px;">Richtig: ${t.answer}</div>`
      : `<div class="wwds-sub" style="margin-top:14px;">${wwdsState.tieGuessesShown
            ? 'Die Auflösung kommt gleich…'
            : 'Die Schätzungen sind abgegeben — noch nicht verraten!'}</div>`);
}

// ── HAUPTRUNDE ──
function wwdsPick(i){
  if (wwdsState.phase !== 'pick' || wwdsState.used[i]) return;
  wwdsState.currentCat = i;
  wwdsState.selected = null;
  wwdsState.locked = false;
  wwdsState.revealed = false;
  wwdsState.audienceShown = false;
  wwdsState.audienceData = null;
  wwdsState.phase = 'question';
  resetMediaOverlay();
  renderWwds();
  wwdsStartTimer();
  updateGamemaster();
}

function wwdsSelect(i){
  if (wwdsState.phase !== 'question' || wwdsState.locked || wwdsState.revealed) return;
  wwdsState.selected = i;
  renderWwds();
  updateGamemaster();
}

function wwdsLock(){
  if (wwdsState.phase !== 'question' || wwdsState.selected === null || wwdsState.locked) return;
  wwdsState.locked = true;
  wwdsStopTimer();
  renderWwds();
  updateGamemaster();
}

function wwdsReveal(){
  if (wwdsState.phase !== 'question' || !wwdsState.locked || wwdsState.revealed) return;
  wwdsState.revealed = true;
  wwdsStopTimer();
  const c = wwdsData.categories[wwdsState.currentCat];
  if (wwdsState.selected === c.correct){
    wwdsState.scores[wwdsState.currentTeam] += WWDS_WIN;
    SFX.correct();
  } else SFX.wrong();
  renderWwds();
  updateGamemaster();
}

function wwdsNext(){
  if (wwdsState.phase !== 'question' || !wwdsState.revealed) return;
  wwdsState.used[wwdsState.currentCat] = true;
  wwdsState.currentCat = null;
  wwdsState.audienceShown = false;
  wwdsStopTimer();
  // Hauptrunde vorbei, sobald jedes Team gleich oft dran war
  const done = wwdsState.used.filter(Boolean).length;
  const total = wwdsQPerTeam() * wwdsState.teamCount;
  if (done >= total){ wwdsToBetting(); return; }
  wwdsState.currentTeam = (wwdsState.currentTeam + 1) % wwdsState.teamCount;
  wwdsState.phase = 'pick';
  renderWwds();
  updateGamemaster();
}

function wwdsAudience(){
  if (wwdsState.phase !== 'question') return;
  const t = wwdsState.currentTeam;
  if (wwdsState.audienceUsed[t] || wwdsState.revealed) return;
  const c = wwdsData.categories[wwdsState.currentCat];
  // Publikum liegt meistens, aber nicht immer richtig
  const right = 45 + Math.floor(Math.random()*30);
  let rest = 100 - right;
  const a = [0,0,0];
  a[c.correct] = right;
  const others = [0,1,2].filter(i => i !== c.correct);
  const first = Math.floor(Math.random() * (rest+1));
  a[others[0]] = first;
  a[others[1]] = rest - first;
  wwdsState.audienceData = a;
  wwdsState.audienceShown = true;
  wwdsState.audienceUsed[t] = true;
  renderWwds();
  updateGamemaster();
}

function wwdsToggleMedia(slot){
  const c = wwdsState.phase === 'master' ? wwdsData.master : wwdsData.categories[wwdsState.currentCat];
  if (!c) return;
  toggleMediaSlot(c.media || [], slot);
}

// ── MASTERFRAGE ──
function wwdsToBetting(){
  wwdsStopTimer();
  wwdsState.phase = 'bet';
  wwdsState.bets = wwdsState.scores.map(s => Math.min(500, s));
  renderWwds();
  updateGamemaster();
}
// Einsatz kommt ausschliesslich aus dem Gamemaster (Knöpfe, auch vom Handy) -
// der Hauptbildschirm zeigt ihn nur an.
function wwdsAdjustBet(i, delta){
  if (wwdsState.phase !== 'bet') return;
  const cur = wwdsState.bets[i] || 0;
  const next = delta === 'max' ? wwdsState.scores[i] : delta === 'min' ? 0 : cur + delta;
  wwdsState.bets[i] = Math.max(0, Math.min(Math.floor(next), wwdsState.scores[i]));
  renderWwds();
  updateGamemaster();
}
function wwdsStartMaster(){
  wwdsState.phase = 'master';
  wwdsState.masterPick = wwdsState.teamNames.map(() => null);
  wwdsState.masterRevealed = false;
  resetMediaOverlay();
  renderWwds();
  wwdsStartTimer();
  updateGamemaster();
}
function wwdsMasterSet(team, i){
  if (wwdsState.phase !== 'master' || wwdsState.masterRevealed) return;
  wwdsState.masterPick[team] = (wwdsState.masterPick[team] === i) ? null : i;
  renderWwds();
  updateGamemaster();
}
function wwdsRevealMaster(){
  if (wwdsState.phase !== 'master' || wwdsState.masterRevealed) return;
  wwdsState.masterRevealed = true;
  wwdsStopTimer();
  const m = wwdsData.master;
  let anyRight = false;
  wwdsState.teamNames.forEach((_, i) => {
    if (wwdsState.masterPick[i] === null) return;
    if (wwdsState.masterPick[i] === m.correct){ wwdsState.scores[i] += wwdsState.bets[i]; anyRight = true; }
    else wwdsState.scores[i] = Math.max(0, wwdsState.scores[i] - wwdsState.bets[i]);
  });
  anyRight ? SFX.correct() : SFX.wrong();
  renderWwds();
  updateGamemaster();
}
function wwdsAfterMaster(){
  if (!wwdsState.masterRevealed) return;
  const max = Math.max(...wwdsState.scores);
  const leaders = wwdsState.scores.filter(s => s === max).length;
  if (leaders > 1){ wwdsToTie(); return; }
  wwdsFinish();
}

// ── STICHFRAGE ──
function wwdsToTie(){
  wwdsStopTimer();
  wwdsState.phase = 'tie';
  wwdsState.tieRevealed = false;
  wwdsState.tieGuessesShown = false;
  wwdsState.tieGuesses = wwdsState.teamNames.map(() => null);
  renderWwds();
  updateGamemaster();
}
// Wird aus dem Gamemaster aufgerufen. Absichtlich OHNE updateGamemaster():
// das Handy-Pad lädt sein Panel bei jeder Aktualisierung komplett neu, dabei
// ginge eine gerade getippte Zahl im Nachbarfeld verloren. Der Hauptbildschirm
// wird trotzdem sofort mitgezogen.
function wwdsSetGuess(i, v){
  wwdsState.tieGuesses[i] = (v === '' ? null : Math.floor(Number(String(v).replace(',', '.')) || 0));
  renderWwds();
}
// Zwischenschritt vor der Auflösung: erst werden die abgegebenen Schätzungen
// gleichzeitig sichtbar (vorher unscharf), dann kommt die richtige Antwort.
function wwdsShowTieGuesses(){
  if (wwdsState.phase !== 'tie' || wwdsState.tieGuessesShown) return;
  const max = Math.max(...wwdsState.scores);
  const tied = wwdsState.teamNames.map((_,i) => i).filter(i => wwdsState.scores[i] === max);
  if (tied.some(i => wwdsState.tieGuesses[i] === null)) return alert('Alle beteiligten Teams müssen erst schätzen!');
  wwdsState.tieGuessesShown = true;
  SFX.point();
  renderWwds();
  updateGamemaster();
}

function wwdsRevealTie(){
  const t = wwdsData.tiebreakers[wwdsState.tieIdx];
  if (!t) return;
  const max = Math.max(...wwdsState.scores);
  const tied = wwdsState.teamNames.map((_,i) => i).filter(i => wwdsState.scores[i] === max);
  if (tied.some(i => wwdsState.tieGuesses[i] === null)) return alert('Alle beteiligten Teams müssen schätzen!');
  wwdsState.tieGuessesShown = true;
  wwdsState.tieRevealed = true;
  const dist = tied.map(i => Math.abs(wwdsState.tieGuesses[i] - t.answer));
  const best = Math.min(...dist);
  const winners = tied.filter((_, k) => dist[k] === best);
  renderWwds();
  updateGamemaster();
  if (winners.length === 1){
    // Stichfrage-Sieger bekommt symbolisch 1 € mehr → eindeutiger Gewinner
    wwdsState.scores[winners[0]] += 1;
    SFX.correct();
    setTimeout(() => wwdsFinish(), 1200);
  } else {
    SFX.wrong();
    setTimeout(() => {
      wwdsState.tieIdx++;
      if (wwdsState.tieIdx >= wwdsData.tiebreakers.length){ wwdsFinish(true); return; }
      wwdsToTie();
    }, 1500);
  }
}

// ── ENDE ──
function wwdsFinish(forceDraw){
  wwdsStopTimer();
  wwdsState.phase = 'done';
  wwdsState.active = false;
  document.getElementById('gm-bar').classList.remove('visible');
  const max = Math.max(...wwdsState.scores);
  const winners = wwdsState.teamNames.filter((_, i) => wwdsState.scores[i] === max);
  document.getElementById('final-scores').innerHTML = wwdsState.teamNames.map((n,i) =>
    `${n}: <strong>${wwdsMoney(wwdsState.scores[i])}</strong>`).join('<br>');
  document.getElementById('winner-text').textContent =
    (forceDraw || winners.length > 1) ? 'Unentschieden!' : `${winners[0]} gewinnt!`;
  document.getElementById('tour-record-btn').style.display = 'none';
  const recorded = tournamentAutoRecordIfActive(wwdsState.teamNames, wwdsState.scores);
  document.getElementById('tour-goto-btn').style.display = recorded ? '' : 'none';
  if (!recorded) offerTournamentResult('Wer weiß denn sowas', wwdsState.teamNames, wwdsState.scores);
  recordAccountGameResult(wwdsState.teamNames, wwdsState.scores);
  showScreen('result-screen');
  updateGamemaster();
  if (!forceDraw && winners.length === 1) confetti();
}

// ── GAMEMASTER ──
function wwdsControlsHtml(pfx){
  const s = wwdsState;
  let b = '';
  if (s.phase === 'pick'){
    b += `<span class="gm-label">Kategorie wählen lassen</span>`;
  } else if (s.phase === 'question'){
    if (!s.locked){
      b += `<button class="gm-btn gm-gold" onclick="${pfx}wwdsLock()">✓ Antwort loggen</button>`;
      if (!s.audienceUsed[s.currentTeam])
        b += `<button class="gm-btn gm-blue" onclick="${pfx}wwdsAudience()">👥 Publikum</button>`;
      b += `<button class="gm-btn gm-gray" onclick="${pfx}wwdsStartTimer()">⏱ Zeit neu</button>`;
    } else if (!s.revealed){
      b += `<button class="gm-btn gm-gold" onclick="${pfx}wwdsReveal()">Auflösen</button>`;
    } else {
      b += `<button class="gm-btn gm-gold" onclick="${pfx}wwdsNext()">Weiter →</button>`;
    }
  } else if (s.phase === 'bet'){
    b += `<button class="gm-btn gm-gold" onclick="${pfx}wwdsStartMaster()">Masterfrage starten</button>`;
  } else if (s.phase === 'master'){
    if (!s.masterRevealed){
      b += `<button class="gm-btn gm-gold" onclick="${pfx}wwdsRevealMaster()">Auflösen</button>`;
      b += `<button class="gm-btn gm-gray" onclick="${pfx}wwdsStartTimer()">⏱ Zeit neu</button>`;
    } else {
      b += `<button class="gm-btn gm-gold" onclick="${pfx}wwdsAfterMaster()">Weiter →</button>`;
    }
  } else if (s.phase === 'tie'){
    if (!s.tieGuessesShown) b += `<button class="gm-btn gm-blue" onclick="${pfx}wwdsShowTieGuesses()">👁 Schätzungen aufdecken</button>`;
    if (!s.tieRevealed) b += `<button class="gm-btn gm-gold" onclick="${pfx}wwdsRevealTie()">Auflösen</button>`;
  }
  return b;
}
function wwdsBarButtons(){ return wwdsControlsHtml(''); }

function updateGamemasterWwds(){
  const s = wwdsState;
  const isMaster = s.phase === 'master';
  const q = isMaster ? wwdsData.master
          : (s.currentCat !== null ? wwdsData.categories[s.currentCat] : null);

  let body = '';
  if (s.phase === 'pick'){
    body = `<div class="question">Kategorie-Auswahl</div>
      <div class="answer-list">` + wwdsData.categories.map((c,i) =>
        `<div class="answer" style="${s.used[i]
          ? 'opacity:.35;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)'
          : 'background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3);cursor:pointer'}"
          ${s.used[i]?'':`onclick="opener.wwdsPick(${i})"`}>
          <span><span class="num">${i+1}.</span> <span class="text">${c.cat||'—'}</span></span>
          <span class="pts">${s.used[i]?'gespielt':'frei'}</span>
        </div>`).join('') + `</div>`;
  } else if (q){
    const teamTag = (i) => s.teamNames.map((n,t) =>
      (isMaster && s.masterPick[t] === i) ? `<span style="color:${WWDS_HEX[t]};font-size:.7rem;font-weight:700;"> ●${n}</span>` : '').join('');
    body = `<div class="question">${q.q}</div>
      ${qNoteHtml(q.note)}
      <div class="answer-list">` + q.answers.map((a,i) => {
        const right = i === q.correct;
        const sel = !isMaster && s.selected === i;
        let bg = 'rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3)';
        if (right) bg = 'rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.45)';
        if (sel)   bg = 'rgba(245,158,11,.2);border:1px solid rgba(245,158,11,.5)';
        const click = (!isMaster && !s.locked) ? ` onclick="opener.wwdsSelect(${i})"` : '';
        return `<div class="answer" style="background:${bg};cursor:${click?'pointer':'default'}"${click}>
          <span><span class="num">${WWDS_LETTERS[i]}</span> <span class="text">${escapeHtml(a)}</span>${right?' <span style="color:#22C55E;font-size:.7rem;">✔ richtig</span>':''}${teamTag(i)}</span>
        </div>`;
      }).join('') + `</div>
      ${mediaControlButtonsHtml(q.media, 'wwdsToggleMedia')}`;

    if (isMaster && !s.masterRevealed){
      body += `<div class="hint-line">Antwort je Team festlegen:</div>` +
        s.teamNames.map((n,t) => `<div class="panel-row" style="align-items:center;gap:6px;">
          <span style="min-width:90px;color:${WWDS_HEX[t]};font-weight:700;font-size:.75rem;">${n}</span>` +
          [0,1,2].map(i => `<button class="gm-btn ${s.masterPick[t]===i?'gold':'gray'} sm"
             onclick="opener.wwdsMasterSet(${t},${i})">${WWDS_LETTERS[i]}</button>`).join('') +
        `</div>`).join('');
    }
    body += `<div class="hint-line">${
      isMaster ? (s.masterRevealed ? 'Aufgelöst.' : 'Teams setzen ihre Antwort.')
      : (s.revealed ? 'Aufgelöst.' : s.locked ? 'Geloggt — jetzt auflösen.'
        : s.selected !== null ? 'Antwort ' + WWDS_LETTERS[s.selected] + ' gewählt.' : 'Keine Antwort gewählt.')
    }${s.timeUp && !s.revealed && !s.masterRevealed ? ' <b style="color:#E8453C;">Zeit abgelaufen!</b>' : ''}</div>`;
  } else if (s.phase === 'bet'){
    body = `<div class="question">Einsätze für die Masterfrage</div>
      <div class="hint-line">Richtig = Einsatz kommt dazu · Falsch = Einsatz geht ab</div>` +
      s.teamNames.map((n,i) => `
        <div class="panel" style="margin-bottom:8px;">
          <div class="panel-head">
            <span style="color:${WWDS_HEX[i]}">${n}</span>
            <span class="badge">${wwdsMoney(s.bets[i])} von ${wwdsMoney(s.scores[i])}</span>
          </div>
          <div class="panel-row" style="flex-wrap:wrap;gap:5px;">
            <button class="gm-btn gray sm" onclick="opener.wwdsAdjustBet(${i},'min')">0</button>
            <button class="gm-btn gray sm" onclick="opener.wwdsAdjustBet(${i},-500)">−500</button>
            <button class="gm-btn gray sm" onclick="opener.wwdsAdjustBet(${i},-100)">−100</button>
            <button class="gm-btn gray sm" onclick="opener.wwdsAdjustBet(${i},100)">+100</button>
            <button class="gm-btn gray sm" onclick="opener.wwdsAdjustBet(${i},500)">+500</button>
            <button class="gm-btn gold sm" onclick="opener.wwdsAdjustBet(${i},'max')">Alles</button>
          </div>
        </div>`).join('');
  } else if (s.phase === 'tie'){
    const t = wwdsData.tiebreakers[s.tieIdx];
    const max = Math.max(...s.scores);
    const tied = s.teamNames.map((_,i) => i).filter(i => s.scores[i] === max);
    body = `<div class="question">${t ? t.q : 'Keine Schätzfrage hinterlegt'}</div>
      ${t ? `<div class="hint-line">Richtige Antwort: <b style="color:#FFD23F;">${t.answer}</b></div>` : ''}
      <div class="hint-line">Schätzungen hier eintragen — der Hauptbildschirm zeigt sie mit an.</div>` +
      tied.map(i => `
        <div class="panel-row" style="align-items:center;gap:8px;margin-bottom:6px;">
          <span style="min-width:100px;color:${WWDS_HEX[i]};font-weight:700;font-size:.8rem;">${s.teamNames[i]}</span>
          <input type="number" inputmode="decimal" placeholder="Schätzung"
            value="${s.tieGuesses[i] === null ? '' : s.tieGuesses[i]}"
            onchange="opener.wwdsSetGuess(${i}, this.value)"
            style="flex:1;padding:9px 12px;border-radius:8px;border:1.5px solid rgba(255,255,255,.15);background:rgba(0,0,0,.35);color:#fff;font-family:inherit;font-weight:700;text-align:center;outline:none;">
        </div>`).join('');
  }

  const scoreRows = s.teamNames.map((n,i) =>
    `<div class="money"><span style="color:${WWDS_HEX[i]}">${n}</span><strong>${wwdsMoney(s.scores[i])}</strong></div>`).join('');

  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}
  .money{display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:3px;}
  .money strong{color:#FFD23F;}
  .tm{font-size:.72rem;color:rgba(255,255,255,.5);}
</style></head><body>
  ${gmHeaderHtml('Gamemaster', `Wer weiß denn sowas · ${
    s.phase === 'master' ? 'Masterfrage' : s.phase === 'bet' ? 'Einsätze'
    : s.phase === 'tie' ? 'Stichfrage' : `Hauptrunde ${s.used.filter(Boolean).length}/${wwdsQPerTeam()*s.teamCount}`}`)}
  <div class="gm-body">
  <div class="gm-main">${body}</div>
  <div class="gm-side">
  <div class="panel">
    <div class="panel-head"><span>💰 Stand</span></div>
    ${scoreRows}
    <div class="tm">${(s.phase==='question'||s.phase==='master') ? (s.timeUp?'Zeit abgelaufen':'Timer: '+s.timer+' s') : ''}</div>
    ${(s.phase==='pick'||s.phase==='question') ? `<div class="tm">Am Zug: <b style="color:${WWDS_HEX[s.currentTeam]}">${s.teamNames[s.currentTeam]}</b></div>` : ''}
  </div>
  ${gmNotesPanelHtml()}
  </div>
  </div>
  <div class="gm-actions">${wwdsControlsHtml('opener.')}</div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}

// ── GAMEMASTER: ERGEBNIS-SCREEN (für alle Spielmodi) ──
function gmBackToMenu(){ showScreen('menu-screen'); updateGamemaster(); }
function gmGotoTournament(){ showScreen('tournament-screen'); updateGamemaster(); }
function gmPlayAgain(){
  const btn = /** @type {HTMLElement|null} */ (
    document.querySelector('#result-screen .result-btns .btn-primary'));
  if (btn) btn.click();
}

function updateGamemasterResult(){
  const winner = (document.getElementById('winner-text') || {}).textContent || '';
  const scores = (document.getElementById('final-scores') || {}).innerHTML || '';
  const tourVisible = (document.getElementById('tour-goto-btn') || {}).style?.display === '';
  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}
  .win{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;color:#FFD23F;letter-spacing:2px;text-align:center;margin-bottom:10px;}
  .sc{font-size:.95rem;line-height:2;text-align:center;color:rgba(255,255,255,.75);}
  .sc strong{color:#FFD23F;}
</style></head><body>
  ${gmHeaderHtml('Gamemaster', 'Spiel beendet')}
  <div class="gm-body">
  <div class="gm-main">
    <div class="win">🏆 ${winner}</div>
    <div class="panel"><div class="sc">${scores}</div></div>
  </div>
  <div class="gm-side">${gmNotesPanelHtml()}</div>
  </div>
  <div class="gm-actions">
    <button class="gm-btn gold" onclick="opener.gmBackToMenu()">🏠 Zum Menü</button>
    <button class="gm-btn blue" onclick="opener.gmPlayAgain()">↻ Nochmal spielen</button>
    ${tourVisible ? `<button class="gm-btn gray" onclick="opener.gmGotoTournament()">🏆 Turnierübersicht</button>` : ''}
  </div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}

// ── EDITOR ──
let wwdsEditOpen = 0;
function wwdsToggleOpen(i){ wwdsEditOpen = (wwdsEditOpen === i ? -1 : i); renderWwdsEditor(); }

function renderWwdsEditor(){
  const g = document.getElementById('wwds-editor-grid');
  const inp = 'width:100%;box-sizing:border-box;padding:8px 11px;border-radius:8px;border:1.5px solid rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.88rem;outline:none;';
  const optRow = (q, path, j) => `
    <div style="display:flex;gap:8px;margin-bottom:5px;align-items:center;">
      <label style="display:flex;align-items:center;gap:5px;color:${q.correct===j?'#22C55E':'rgba(255,255,255,.4)'};font-size:.8rem;font-weight:700;min-width:44px;">
        <input type="radio" name="wwds-c-${path}" ${q.correct===j?'checked':''}
          onchange="${path}.correct=${j};renderWwdsEditor();" style="accent-color:#22C55E;"> ${WWDS_LETTERS[j]}
      </label>
      <input type="text" value="${escAttr(q.answers[j])}"
        onchange="${path}.answers[${j}]=this.value" style="flex:1;${inp}">
    </div>`;

  g.innerHTML = `<div class="page-title" style="font-size:.8rem;margin-bottom:10px;"><em>Kategorien</em> (Hauptrunde)</div>` +
    wwdsData.categories.map((c,i) => {
      const p = `wwdsData.categories[${i}]`;
      const isOpen = wwdsEditOpen === i;
      const answered = (c.answers || []).filter(a => a && a.trim()).length;
      const mediaCount = (c.media || []).filter(Boolean).length;
      const head = `<div onclick="wwdsToggleOpen(${i})" style="display:flex;align-items:center;gap:9px;cursor:pointer;padding:9px 11px;background:${isOpen?'#1A2150':'#141A3D'};border:1px solid ${isOpen?'rgba(255,210,63,.4)':'rgba(255,255,255,.07)'};border-radius:9px;${isOpen?'border-bottom-left-radius:0;border-bottom-right-radius:0;':''}">
        <span style="color:#6C74A8;font-size:.9rem;">${isOpen?'▾':'▸'}</span>
        <span style="color:#FFD23F;font-weight:700;font-size:.78rem;flex-shrink:0;">${i+1}.</span>
        <span style="flex:1;min-width:0;color:${c.cat?'#F0EDE2':'rgba(255,255,255,.4)'};font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escAttr(c.cat)||'— ohne Namen —'}${c.q?` <span style="color:rgba(255,255,255,.45);font-weight:400;">· ${escAttr(c.q)}</span>`:''}</span>
        <span style="display:flex;align-items:center;gap:6px;flex-shrink:0;font-size:.66rem;">
          ${mediaCount?`<span style="color:#FFD23F;">🖼${mediaCount}</span>`:''}
          <span style="color:${answered>=3?'#22C55E':'#FFB74D'};">${answered}/3</span>
        </span>
      </div>`;
      const body = isOpen ? `<div style="padding:12px;background:#0F1436;border:1px solid rgba(255,210,63,.25);border-top:none;border-radius:0 0 9px 9px;">
        <div style="display:flex;gap:8px;margin-bottom:6px;">
          <input type="text" value="${escAttr(c.cat)}" placeholder="Kategoriename"
            onchange="${p}.cat=this.value;renderWwdsEditor();" style="flex:1;${inp}">
          <button class="btn btn-danger" style="padding:4px 10px;font-size:.7rem;flex-shrink:0;" onclick="wwdsDeleteCategory(${i})">Del</button>
        </div>
        <input type="text" value="${escAttr(c.q)}" placeholder="Frage"
          onchange="${p}.q=this.value;renderWwdsEditor();" style="${inp}margin-bottom:8px;font-weight:600;">
        ${[0,1,2].map(j => optRow(c, p, j)).join('')}
        <label style="display:block;font-size:.65rem;color:rgba(255,255,255,.4);margin:8px 0 4px;">Einblendungen (0-3 Bilder/Videos)</label>
        ${mediaSlotsHtml(c.media || (c.media = []), (slot, inputExpr) => `wwdsEditMedia(${i},${slot},${inputExpr})`)}
        <input type="text" placeholder="📝 Notiz für den Host" value="${escAttr(c.note)}"
          onchange="${p}.note=this.value" style="${inp}margin-top:6px;border-color:rgba(255,210,63,.25);background:rgba(255,210,63,.05);">
      </div>` : '';
      return `<div style="margin-bottom:7px;">${head}${body}</div>`;
    }).join('') +
    `<div class="page-title" style="font-size:.8rem;margin:18px 0 10px;"><em>Masterfrage</em></div>
     <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06);">
       <input type="text" value="${escAttr(wwdsData.master.q)}" placeholder="Masterfrage"
         onchange="wwdsData.master.q=this.value" style="${inp}margin-bottom:8px;font-weight:600;">
       ${[0,1,2].map(j => optRow(wwdsData.master, 'wwdsData.master', j)).join('')}
       <input type="text" placeholder="📝 Notiz für den Host" value="${escAttr(wwdsData.master.note)}"
         onchange="wwdsData.master.note=this.value" style="${inp}margin-top:6px;border-color:rgba(255,210,63,.25);background:rgba(255,210,63,.05);">
     </div>
     <div class="page-title" style="font-size:.8rem;margin:18px 0 10px;"><em>Schätzfragen</em> (bei Gleichstand)</div>` +
    wwdsData.tiebreakers.map((t,i) => `
      <div style="display:flex;gap:8px;margin-bottom:6px;align-items:center;">
        <input type="text" value="${escAttr(t.q)}" placeholder="Schätzfrage"
          onchange="wwdsData.tiebreakers[${i}].q=this.value" style="flex:3;${inp}">
        <input type="number" value="${escAttr(t.answer)}" placeholder="Zahl"
          onchange="wwdsData.tiebreakers[${i}].answer=Number(this.value)" style="flex:1;${inp}text-align:center;">
        <button class="btn btn-danger" style="padding:6px 10px;font-size:.7rem;" onclick="wwdsDeleteTiebreaker(${i})">✕</button>
      </div>`).join('');
}
function wwdsEditMedia(i, slot, input){
  const c = wwdsData.categories[i];
  c.media = c.media || [];
  setMediaSlot(c.media, slot, input, renderWwdsEditor);
}
function wwdsAddCategory(){
  wwdsData.categories.push({ cat:'Neue Kategorie', q:'Neue Frage', answers:['','',''], correct:0, note:'', media:[] });
  wwdsEditOpen = wwdsData.categories.length - 1;
  renderWwdsEditor(); wwdsSave();
}
function wwdsDeleteCategory(i){
  if (confirm('Kategorie löschen?')){ wwdsData.categories.splice(i,1); renderWwdsEditor(); wwdsSave(); }
}
function wwdsAddTiebreaker(){
  wwdsData.tiebreakers.push({ q:'Neue Schätzfrage', answer:0, note:'' });
  renderWwdsEditor(); wwdsSave();
}
function wwdsDeleteTiebreaker(i){
  wwdsData.tiebreakers.splice(i,1); renderWwdsEditor(); wwdsSave();
}
function exportWwds(){ downloadJSON(wwdsData, 'wer-weiss-denn-sowas.json'); }
function importWwds(e){
  readJsonFile(e, d => {
    const cats = Array.isArray(d.categories) ? d.categories : (Array.isArray(d) ? d : null);
    if (!cats) throw new Error('Ungültiges Format');
    wwdsData = {
      categories: cats.map(x => ({
        cat: x.cat || x.category || '',
        q: x.q || x.question || '',
        answers: (x.answers || ['','','']).slice(0,3),
        correct: Number(x.correct) || 0,
        note: x.note || '', media: x.media || []
      })),
      master: d.master
        ? { q:d.master.q||'', answers:(d.master.answers||['','','']).slice(0,3), correct:Number(d.master.correct)||0, note:d.master.note||'', media:d.master.media||[] }
        : wwdsData.master,
      tiebreakers: Array.isArray(d.tiebreakers)
        ? d.tiebreakers.map(t => ({ q:t.q||'', answer:Number(t.answer)||0, note:t.note||'' }))
        : wwdsData.tiebreakers
    };
    renderWwdsEditor(); wwdsSave();
  });
}
function wwdsSave(){ storeSetJson('wwdsData', wwdsData); }
function wwdsLoad(){ wwdsData = storeGetJson('wwdsData', wwdsData); }
wwdsLoad();

