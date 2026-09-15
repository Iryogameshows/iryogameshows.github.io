/* Jeopardy, Teil 1: Board, Fragen, Schaetzfrage, Medien, Sounds.

   Herausgeloest aus index.html (Zeilen 5184-5717). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
// ── JEOPARDY ──
const JEOPARDY_VALUES = [100, 200, 300, 400, 500];
const JEOPARDY_CATS = 5;
const JEOPARDY_BOARDS = 2;

function makeEmptyBoard(boardNum) {
  return {
    categories: Array.from({ length: JEOPARDY_CATS }, (_, c) => ({
      name: `Kategorie ${c + 1}`,
      clues: JEOPARDY_VALUES.map(v => ({ q: `Frage für ${v}`, a: 'Antwort' })),
    })),
  };
}

let jeopardyData = {
  boards: [ makeEmptyBoard(1), makeEmptyBoard(2) ],
};

let jeopardyState = {
  active: false,
  teamCount: 2,
  teamNames: [],
  scores: [],
  currentBoard: 0,
  used: [], // used[cat][row] = true/false (for current board)
  currentClue: null, // {col, row}
  answerShown: false,
  dailyDoubles: [],  // pro Board eins: [{ col, row, done }, …]
  ddPending: false,  // true while GM sees the warning but the question isn't shown yet
  currentIsDaily: false,
  ddTeam: null,      // welches Team das Daily Double gewählt hat - nur dieses darf antworten
  stageRevealed: [], // revealed tile indices for a staged-image clue
  seriesRevealed: 0, // wie viele Bilder einer Bilder-Reihe schon aufgedeckt sind (links → rechts)
  questionRevealed: false, // the question text is hidden until the GM reveals it
};

// Returns the categories array for the active board
function jBoard() { return jeopardyData.boards[jeopardyState.currentBoard].categories; }

let jeopardyHistory = [];

function jeopardySnapshot() {
  jeopardyHistory.push({
    scores: [...jeopardyState.scores],
    used: jeopardyState.used.map(c => [...c]),
    currentClue: jeopardyState.currentClue ? {...jeopardyState.currentClue} : null,
    answerShown: jeopardyState.answerShown,
    dd: jeopardyState.dailyDoubles.map(d => d ? {...d} : null),
    ddPending: jeopardyState.ddPending,
    currentIsDaily: jeopardyState.currentIsDaily,
    ddTeam: jeopardyState.ddTeam,
    stageRevealed: [...jeopardyState.stageRevealed],
    seriesRevealed: jeopardyState.seriesRevealed,
    questionRevealed: jeopardyState.questionRevealed,
  });
}

function jeopardyUndo() {
  if (!jeopardyHistory.length) return;
  const prev = jeopardyHistory.pop();
  jeopardyState.scores = prev.scores;
  jeopardyState.used = prev.used;
  jeopardyState.currentClue = prev.currentClue;
  jeopardyState.answerShown = prev.answerShown;
  jeopardyState.dailyDoubles = prev.dd || [];
  jeopardyState.ddPending = prev.ddPending;
  jeopardyState.currentIsDaily = prev.currentIsDaily;
  jeopardyState.ddTeam = prev.ddTeam === undefined ? null : prev.ddTeam;
  jeopardyState.stageRevealed = prev.stageRevealed || [];
  jeopardyState.seriesRevealed = prev.seriesRevealed || 0;
  jeopardyState.questionRevealed = prev.questionRevealed;
  renderJeopardyScores();
  renderJeopardyBoard();
  if (jeopardyState.currentClue) renderJeopardyClueOverlay();
  else closeJeopardyClue();
  updateGamemaster();
}

function startJeopardy() {
  openBoardPopout();
  startJeopardyActual();
}
function startJeopardyActual() {
  wwmState.active = false;
  wwdsState.active = false;
  finaleState.active = false;
  jeopardyState.teamCount = document.getElementById('jeopardy-enable-team3').checked ? 3 : 2;
  jeopardyState.teamNames = [];
  jeopardyState.scores = [];
  for (let i = 0; i < jeopardyState.teamCount; i++) {
    jeopardyState.teamNames.push(document.getElementById(`jt${i+1}-name`).value || `Team ${i+1}`);
    jeopardyState.scores.push(0);
  }
  jeopardyState.currentBoard = 0;
  jeopardyState.used = jBoard().map(() => new Array(JEOPARDY_VALUES.length).fill(false));
  jeopardyState.currentClue = null;
  jeopardyState.answerShown = false;
  jeopardyState.active = true;
  // Verstecktes Daily Double: EINS PRO BOARD, nur auf Feldern ab 300 Punkten
  // und nur in Kategorien, in denen es der Host erlaubt hat (cat.noDD !== true).
  const ddRows = JEOPARDY_VALUES.map((v, i) => i).filter(i => JEOPARDY_VALUES[i] >= 300);
  jeopardyState.dailyDoubles = jeopardyData.boards.map(board => {
    const spots = [];
    board.categories.forEach((cat, col) => {
      if (!cat.noDD) ddRows.forEach(row => spots.push({ col, row }));
    });
    return spots.length ? { ...spots[Math.floor(Math.random() * spots.length)], done: false } : null;
  });
  jeopardyState.ddPending = false;
  jeopardyState.currentIsDaily = false;
  jeopardyState.ddTeam = null;
  wwmState.active = false;
  jeopardyHistory = [];
  jeopardyBuzzer.hidden = false;
  jeopardyBuzzer.poppedForQuestion = false;
  activeBuzzerContext = 'jeopardy';
  jeopardyBuzzConnect();
  lockBuzzerJoins(jeopardyBuzzer);

  // Hide screens behind a black backdrop, then play intro
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const old = document.querySelector('.black-backdrop');
  if (old) old.remove();
  addBlackBackdrop();
  openGamemaster(); // schon jetzt öffnen, damit Intro vom GM-Fenster aus steuerbar ist
  showJeopardyIntro();
}

// ── JEOPARDY INTRO (Danger sign) ──
function showJeopardyIntro() {
  const ov = document.createElement('div');
  ov.className = 'intro-overlay';
  ov.innerHTML = `<div class="danger-intro-sign">${DANGER_SVG}</div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', () => closeOverlay(ov, afterJeopardyStar));
}

function afterJeopardyStar() {
  const introOn = document.getElementById('enable-jeopardy-intro');
  if (introOn && introOn.checked) showGameshowIntroTag2(showJeopardyTitle);
  else showJeopardyTitle();
}

function showGameshowIntroTag2(onDone) {
  const overlay = document.createElement('div');
  overlay.id = 'kg-overlay';
  overlay.innerHTML = `
    <div id="kg2">
      <div class="wall"></div>
      <div class="floor"></div>
      <div class="cone coneL"></div>
      <div class="cone coneR"></div>
      <div class="cord"><div class="bulb"></div></div>
      <div class="frame" id="kg2frame"></div>
      <div class="header"><span class="st">★</span>Die Große Keller Gameshow · <b>TAG 2</b><span class="st">★</span></div>
      <div class="screen s1"><p class="big">WILLKOMMEN</p><p class="big pink">ZURÜCK!</p></div>
      <div class="screen s2"><p class="lbl">Runde 2 von 2</p><p class="big">DAS GROSSE</p><p class="big pink sm">FINALE</p></div>
      <div class="screen s3"><p class="lbl">Gestern noch geheim…</p><p class="big pink"><span class="qm">?</span> <span class="qm">?</span> <span class="qm">?</span></p><p class="sub">heute wird sie gespielt!</p></div>
      <div class="screen s4">
        <div class="teamrow">
          <svg width="70" height="70" viewBox="0 0 70 70"><ellipse cx="35" cy="38" rx="27" ry="29" fill="#6DD3B0" stroke="#111" stroke-width="4"/><circle cx="26" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="45" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="27" cy="35" r="3.5" fill="#111"/><circle cx="46" cy="35" r="3.5" fill="#111"/><path d="M27 49 q8 8 17 0" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/></svg>
          <svg width="70" height="70" viewBox="0 0 70 70"><ellipse cx="35" cy="38" rx="27" ry="29" fill="#F58BB8" stroke="#111" stroke-width="4"/><circle cx="26" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="45" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="25" cy="35" r="3.5" fill="#111"/><circle cx="44" cy="35" r="3.5" fill="#111"/><path d="M27 49 q8 8 17 0" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/></svg>
        </div>
        <p class="lbl">Nichts ändert sich</p><p class="big">DIESELBEN TEAMS</p></div>
      <div class="screen s5">
        <div class="plus"><span class="pill">TAG 1</span><b>+</b><span class="pill">TAG 2</span></div>
        <p class="lbl">Jetzt zählt</p><p class="big green sm">DER GESAMTSTAND</p></div>
      <div class="screen s6"><p class="lbl">Wer am Ende vorn liegt, gewinnt</p><p class="euro">30&thinsp;€</p><p class="sub">…aufs Gewinner-Team aufgeteilt!</p></div>
      <div class="kg-hint">Klicken um fortzufahren</div>
    </div>`;
  runKgIntro(overlay, onDone);
}

function showJeopardyTitle() {
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="danger-title-sign">${DANGER_SVG}</div>
    <div class="welcome-line2" style="color:#FFD23F;">Jeopardy</div>
  `, 1800, () => {
    showScreen('jeopardy-screen');
    renderJeopardyScores();
    renderJeopardyBoard();
    setTimeout(() => openGamemaster(), 120);
    fadeOutBackdrop(document.querySelector('.black-backdrop'));
  });
}

function renderJeopardyScores() {
  document.getElementById('jeopardy-scores').innerHTML = jeopardyState.teamNames.map((name, i) => `
    <div class="jeopardy-team ${TEAM_COLORS[i]}">
      <div class="jt-name">${name}</div>
      <div class="jt-score" id="jscore-${i}">${jeopardyState.scores[i]}</div>
    </div>
  `).join('');
}

function renderJeopardyBoard() {
  const cats = jBoard();
  const cols = cats.length;
  const board = document.getElementById('jeopardy-board');
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  let html = '';
  // Category headers
  cats.forEach(cat => {
    html += `<div class="jeopardy-cat">${cat.name}</div>`;
  });
  // Value rows
  JEOPARDY_VALUES.forEach((val, row) => {
    cats.forEach((cat, col) => {
      const used = jeopardyState.used[col][row];
      html += `<div class="jeopardy-cell ${used ? 'used' : ''}" onclick="openJeopardyClue(${col},${row})">${used ? '' : val}</div>`;
    });
  });
  board.innerHTML = html;
  document.getElementById('jeopardy-board-label').textContent = `Board ${jeopardyState.currentBoard + 1} / ${JEOPARDY_BOARDS}`;
  renderJeopardyControls();
  renderBuzzer();
}

function jeopardyBoardComplete() {
  return jeopardyState.used.every(col => col.every(Boolean));
}

function jeopardyAdvanceBoard() {
  if (jeopardyState.currentBoard < JEOPARDY_BOARDS - 1) {
    showJeopardyBoardTransition();
  } else {
    showJeopardyResults();
  }
}

// Das Daily Double des AKTUELLEN Boards - jedes Board hat sein eigenes.
function jeopardyCurrentDd() {
  return jeopardyState.dailyDoubles[jeopardyState.currentBoard] || null;
}
function jeopardyIsDaily(col, row) {
  const dd = jeopardyCurrentDd();
  return !!dd && !dd.done && dd.col === col && dd.row === row;
}
// Der Punktwert dieser Frage: beim Daily Double das Doppelte. Auf dem Board
// steht weiterhin der normale Wert - dort darf sich das Daily Double nicht
// verraten, sonst ist die Überraschung weg.
function jeopardyClueValue() {
  if (!jeopardyState.currentClue) return 0;
  const base = JEOPARDY_VALUES[jeopardyState.currentClue.row];
  return jeopardyState.currentIsDaily ? base * 2 : base;
}
// Abgezogen wird immer die Hälfte des ORIGINALWERTS - beim Daily Double also
// nicht die Hälfte der verdoppelten Punkte.
function jeopardyDeductValue() {
  if (!jeopardyState.currentClue) return 0;
  return Math.round(JEOPARDY_VALUES[jeopardyState.currentClue.row] / 2);
}
// Beim Daily Double darf nur das Team antworten, das das Feld gewählt hat.
function jeopardyTeamMayAnswer(teamIdx) {
  if (!jeopardyState.currentIsDaily) return true;
  return jeopardyState.ddTeam === null || jeopardyState.ddTeam === teamIdx;
}
function jeopardySetDdTeam(i) {
  if (!jeopardyState.ddPending) return;
  jeopardyState.ddTeam = i;
  updateGamemaster();
}

function openJeopardyClue(col, row) {
  if (jeopardyState.used[col][row]) return;
  jeopardySnapshot();
  jeopardyState.currentClue = { col, row };
  jeopardyState.answerShown = false;
  jeopardyState.stageRevealed = [];
  jeopardyState.seriesRevealed = 0;
  jeopardyState.questionRevealed = false;
  jeopardyState.ddTeam = null;
  resetMediaOverlay();
  if (jeopardyIsDaily(col, row)) {
    // Daily Double: the question does NOT pop yet. The GM gets a private
    // warning so it can be announced, then revealed.
    jeopardyState.ddPending = true;
    jeopardyState.currentIsDaily = true;
    closeJeopardyClue(); // keep the board visible for the audience
  } else {
    jeopardyState.ddPending = false;
    jeopardyState.currentIsDaily = false;
    renderJeopardyClueOverlay();  // question line still blank
    jeopardyBuzzPrepare();        // buzzers live but NOT armed → early buzz = 3s lock
  }
  updateGamemaster();
}

// GM announces the Daily Double → clue frame pops (question still hidden)
function jeopardyAnnounceDaily() {
  if (!jeopardyState.ddPending) return;
  // Ohne wählendes Team keine Ansage - sonst stünde die Frage auf dem
  // Bildschirm und niemand wüsste, wer sie überhaupt beantworten darf.
  if (jeopardyState.ddTeam === null) { alert('Erst angeben, welches Team das Feld gewählt hat.'); return; }
  jeopardyState.ddPending = false;
  jeopardyState.questionRevealed = false;
  const dd = jeopardyCurrentDd();
  if (dd) dd.done = true;
  renderJeopardyClueOverlay();
  // KEIN jeopardyBuzzPrepare: beim Daily Double antwortet nur das Team, das
  // das Feld gewählt hat. Ein offener Buzzer würde die anderen einladen.
  jeopardyBuzzClose();
  updateGamemaster();
}

// GM reveals the actual question → now the buzzers go armed and the clock starts
function jeopardyRevealQuestion() {
  if (!jeopardyState.currentClue || jeopardyState.ddPending || jeopardyState.questionRevealed) return;
  jeopardyState.questionRevealed = true;
  renderJeopardyClueOverlay();
  // Schätzfragen laufen nicht über den Buzzer: statt zu armen wird auf den
  // Handys das Eingabefeld geöffnet und eingesammelt.
  // Das Daily Double ebenso wenig - dort antwortet ausschliesslich das Team,
  // das das Feld gewählt hat, ein scharfer Buzzer würde die anderen einladen.
  if (jeopardyCurrentClue() && jeopardyCurrentClue().estimate) jeopardyEstimateOpen();
  else if (jeopardyState.currentIsDaily) jeopardyBuzzClose();
  else jeopardyBuzzArm();
  updateGamemaster();
}

function jeopardyCurrentClue(){
  const c = jeopardyState.currentClue;
  if (!c) return null;
  return jBoard()[c.col].clues[c.row];
}

// ── SCHÄTZFRAGEN (Eingabe auf den Buzzer-Handys) ──
let jeopardyEstimate = { open:false, round:0, answers:[], ref:null, question:'' };

function jeopardyEstimateRef(){
  if (!jeopardyEstimate.ref){
    if (!jeopardyBuzzInitFirebase()) return null;
    jeopardyEstimate.ref = firebase.database().ref('buzzer/estimate');
    jeopardyEstimate.ref.child('answers').on('value', s => {
      const v = s.val() || {};
      jeopardyEstimate.answers = Object.values(v).filter(a => a && a.name);
      updateGamemaster();
    });
  }
  return jeopardyEstimate.ref;
}

function jeopardyEstimateOpen(){
  const clue = jeopardyCurrentClue();
  if (!clue) return;
  const r = jeopardyEstimateRef();
  jeopardyEstimate.open = true;
  jeopardyEstimate.round = nextRoundId(jeopardyEstimate.round);
  jeopardyEstimate.answers = [];
  jeopardyEstimate.question = clue.q || '';
  if (r) r.set({ active:true, round:jeopardyEstimate.round, question:jeopardyEstimate.question, answers:null }).catch(()=>{});
  updateGamemaster();
}

function jeopardyEstimateClose(){
  jeopardyEstimate.open = false;
  const r = jeopardyEstimateRef();
  if (r) r.update({ active:false }).catch(()=>{});
  updateGamemaster();
}

function jeopardyEstimateReopen(){
  jeopardyEstimateOpen();
}

// Sortierung: Zahlen aufsteigend zuerst, alles ohne Zahl danach in der
// Reihenfolge des Eingangs.
function jeopardyEstimateSorted(){
  const list = jeopardyEstimate.answers.slice();
  const nums = list.filter(a => typeof a.num === 'number' && isFinite(a.num));
  const rest = list.filter(a => !(typeof a.num === 'number' && isFinite(a.num)));
  nums.sort((a,b) => a.num - b.num || (a.ts||0) - (b.ts||0));
  rest.sort((a,b) => (a.ts||0) - (b.ts||0));
  return nums.concat(rest);
}

function jeopardyEstimateListHtml(){
  const rows = jeopardyEstimateSorted();
  if (!rows.length) return `<div class="pr-empty">Noch keine Schätzung abgegeben</div>`;
  const hex = ['#E8453C','#3B82F6','#22C55E'];
  return rows.map((a,i) => {
    const col = (typeof a.team === 'number' && hex[a.team]) ? hex[a.team] : 'rgba(255,255,255,.5)';
    const teamName = (typeof a.team === 'number' && jeopardyState.teamNames[a.team]) || '';
    return `<div class="answer" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);">
      <span><span class="num">${i+1}.</span> <span class="text">${escapeHtml(a.name)}</span>
        ${teamName ? `<span style="color:${col};font-size:.68rem;font-weight:700;"> ● ${escapeHtml(teamName)}</span>` : ''}</span>
      <span class="pts">${escapeHtml(String(a.value))}</span>
    </div>`;
  }).join('');
}

// Staged image helpers
function jeopardyStageGrid(clue){
  const cols = Math.max(1, Math.min(5, clue.stageCols || 3));
  const rows = Math.max(1, Math.min(4, clue.stageRows || 3));
  return { cols, rows, total: cols * rows };
}

function jeopardyStageHtml(clue){
  const { cols, rows, total } = jeopardyStageGrid(clue);
  let tiles = '';
  for (let i = 0; i < total; i++){
    const gone = jeopardyState.stageRevealed.includes(i);
    tiles += `<div class="jeopardy-stage-tile ${gone?'gone':''}"></div>`;
  }
  return `<div class="jeopardy-stage">
    <img src="${clue.stageImg}" alt="">
    <div class="jeopardy-stage-cover" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);">${tiles}</div>
  </div>`;
}

// Bilder-Reihe: eingestellte Anzahl (2-5) und die tatsächlich hochgeladenen Bilder
function jeopardySeriesCount(clue){ return Math.max(2, Math.min(5, clue.seriesCount || 5)); }
function jeopardySeriesImgs(clue){ return (clue.seriesImgs || []).slice(0, jeopardySeriesCount(clue)).filter(Boolean); }
function jeopardySeriesHtml(clue){
  const imgs = jeopardySeriesImgs(clue);
  const shown = jeopardyState.seriesRevealed;
  const cells = imgs.map((src, i) => `
    <div class="jeopardy-series-cell ${i < shown ? 'shown' : ''}">
      <img src="${src}" alt="">
      <div class="jeopardy-series-cover">${i+1}</div>
    </div>`).join('');
  return `<div class="jeopardy-series" style="grid-template-columns:repeat(${imgs.length},1fr);">${cells}</div>`;
}

// Renders the clue overlay on the MAIN screen from state (re-entrant).
// Updates an already-open overlay in place instead of destroying and
// recreating it, so the entrance animation doesn't restart and flash
// the board underneath on every reveal/toggle.
function renderJeopardyClueOverlay() {
  if (!jeopardyState.currentClue) { closeJeopardyClue(); return; }
  if (jeopardyState.ddPending) { closeJeopardyClue(); return; } // warning phase — nothing on the main screen yet
  const { col, row } = jeopardyState.currentClue;
  const cat = jBoard()[col];
  const clue = cat.clues[row];
  const val = JEOPARDY_VALUES[row];
  const staged = clue.staged && clue.stageImg;
  const series = clue.series && jeopardySeriesImgs(clue).length > 0;

  const qImgHtml = clue.qImg ? `<img class="jeopardy-clue-img" src="${clue.qImg}" alt="">` : '';
  const aImgHtml = clue.aImg ? `<img class="jeopardy-answer-img ${jeopardyState.answerShown?'visible':''}" src="${clue.aImg}" alt="">` : '';

  const revealed = jeopardyState.questionRevealed;
  const questionArea = revealed
    ? `${clue.q ? `<div class="jeopardy-clue-text">${clue.q}</div>` : ''}
       ${series ? jeopardySeriesHtml(clue) : staged ? jeopardyStageHtml(clue) : qImgHtml}`
    : `<div class="jeopardy-clue-blank">Frage verdeckt</div>`;

  let ov = document.getElementById('jeopardy-clue-ov');
  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'jeopardy-clue-overlay';
    ov.id = 'jeopardy-clue-ov';
    document.body.appendChild(ov);
  }
  ov.innerHTML = `
    ${jeopardyState.currentIsDaily ? `<div class="jeopardy-dd-banner">★ DAILY DOUBLE ★</div>` : ''}
    <div class="jeopardy-clue-cat">${cat.name}</div>
    <div class="jeopardy-clue-pts">${val}</div>
    ${questionArea}
    <div class="jeopardy-answer-text ${jeopardyState.answerShown?'visible':''}">${clue.a || ''}</div>
    ${revealed ? aImgHtml : ''}
  `;
  renderJeopardyControls();
}

// Reveal one more tile of a staged image
function jeopardyToggleMedia(slot) {
  if (!jeopardyState.currentClue) return;
  const { col, row } = jeopardyState.currentClue;
  const clue = jBoard()[col].clues[row];
  toggleMediaSlot(clue.media || [], slot);
}
function jeopardyStageReveal() {
  if (!jeopardyState.currentClue) return;
  const { col, row } = jeopardyState.currentClue;
  const clue = jBoard()[col].clues[row];
  if (!clue.staged || !clue.stageImg) return;
  const { total } = jeopardyStageGrid(clue);
  const hidden = [];
  for (let i = 0; i < total; i++) if (!jeopardyState.stageRevealed.includes(i)) hidden.push(i);
  if (!hidden.length) return;
  jeopardySnapshot();
  jeopardyState.stageRevealed.push(hidden[Math.floor(Math.random()*hidden.length)]);
  renderJeopardyClueOverlay();
  updateGamemaster();
}
// Reveal the next image of a Bilder-Reihe (links → rechts)
function jeopardySeriesReveal() {
  if (!jeopardyState.currentClue) return;
  const { col, row } = jeopardyState.currentClue;
  const clue = jBoard()[col].clues[row];
  if (!clue.series) return;
  const total = jeopardySeriesImgs(clue).length;
  if (jeopardyState.seriesRevealed >= total) return;
  jeopardySnapshot();
  jeopardyState.seriesRevealed++;
  renderJeopardyClueOverlay();
  updateGamemaster();
}

// ── JEOPARDY SOUND ──
let jeopardyAudio = null;
function jeopardySoundPlaying(){ return !!jeopardyAudio && !jeopardyAudio.paused; }
function jeopardyPlaySound(){
  if (!jeopardyState.currentClue) return;
  const { col, row } = jeopardyState.currentClue;
  const clue = jBoard()[col].clues[row];
  if (!clue.sound) return;
  jeopardyStopSound(true);
  jeopardyAudio = new Audio(clue.sound);
  jeopardyAudio.onended = () => { hideSoundFx(); jeopardyAudio = null; updateGamemaster(); };
  showSoundFx();
  jeopardyAudio.play().catch(() => {});
  updateGamemaster();
}
function jeopardyStopSound(silent){
  if (jeopardyAudio){ jeopardyAudio.onended = null; jeopardyAudio.pause(); jeopardyAudio = null; }
  hideSoundFx();
  if (!silent) updateGamemaster();
}
function showSoundFx(){
  hideSoundFx();
  const fx = document.createElement('div');
  fx.className = 'jeopardy-sound-fx';
  fx.id = 'jeopardy-sound-fx';
  let bars = '';
  for (let i = 0; i < 11; i++) bars += `<span class="jsfx-bar" style="animation-delay:${(i*0.09).toFixed(2)}s"></span>`;
  fx.innerHTML = `<div class="jsfx-ring">🔊</div><div class="jsfx-bars">${bars}</div>`;
  document.body.appendChild(fx);
}
function hideSoundFx(){ const el = document.getElementById('jeopardy-sound-fx'); if (el) el.remove(); }

