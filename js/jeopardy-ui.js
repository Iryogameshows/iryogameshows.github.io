// @ts-check
/* Jeopardy, Teil 2: Buzzer-Steuerung, Host-Sperre, Wertung, Editor.

   Herausgeloest aus index.html (Zeilen 6302-6881). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
// Question loaded but NOT armed yet — buzzers are live, an early buzz = penalty
function jeopardyBuzzPrepare(){
  jeopardyBuzzer.round = nextRoundId(jeopardyBuzzer.round); // neue Frage → Sperren zurücksetzen
  jeopardyBuzzer.excluded = [];
  jeopardyBuzzer.poppedForQuestion = false; // Anzeige wieder verdeckt, bis jemand buzzert
  if (jeopardyBuzzer.mode === 'firebase' && jeopardyBuzzer.fbRef){
    jeopardyBuzzer.fbRef.update({ round: jeopardyBuzzer.round, live: true, armed: false, armStart: 0, buzzes: null, excluded: null }).catch(()=>{});
  } else if (jeopardyBuzzer.mode === 'sse' && jeopardyBuzzer.connected){
    fetch(BUZZER_URL + '/prepare', { method:'POST' }).catch(()=>{});
  }
  jeopardyBuzzer.armed = false; jeopardyBuzzer.results = [];
  renderBuzzer();
  updateGamemaster();
}

// Question revealed for the FIRST time — fresh arm, no exclusions
function jeopardyBuzzArm(){
  if (jeopardyBuzzer.mode === 'firebase' && jeopardyBuzzer.fbRef){
    jeopardyBuzzer.fbRef.update({ round: jeopardyBuzzer.round, live: true, armed: true, armStart: firebase.database.ServerValue.TIMESTAMP, buzzes: null }).catch(()=>{});
    jeopardyBuzzer.armed = true; jeopardyBuzzer.results = [];
  } else if (jeopardyBuzzer.mode === 'sse' && jeopardyBuzzer.connected){
    fetch(BUZZER_URL + '/arm', { method:'POST' }).catch(()=>{});
    jeopardyBuzzer.armed = true; jeopardyBuzzer.results = [];
  } else {
    // Offline-Fallback: Tastatur
    jeopardyBuzzer.results = [];
    jeopardyBuzzer.armed = true;
    jeopardyBuzzer.start = performance.now();
  }
  renderBuzzer();
  updateGamemaster();
}

// Buzzer nach falscher Antwort wieder freigeben — NUR der zuletzt Erste bleibt gesperrt,
// alle anderen (auch die, die schon an 2./3. Stelle gebuzzert haben) dürfen wieder ran.
function jeopardyBuzzReopen(){
  if (jeopardyBuzzer.results.length){
    const firstName = jeopardyBuzzer.results[0].name;
    if (!jeopardyBuzzer.excluded.includes(firstName)) jeopardyBuzzer.excluded.push(firstName);
  }
  jeopardyBuzzer.round = nextRoundId(jeopardyBuzzer.round);
  if (jeopardyBuzzer.mode === 'firebase' && jeopardyBuzzer.fbRef){
    const excludedObj = {};
    jeopardyBuzzer.excluded.forEach(n => excludedObj[n] = true);
    jeopardyBuzzer.fbRef.update({
      round: jeopardyBuzzer.round, live: true, armed: true,
      armStart: firebase.database.ServerValue.TIMESTAMP, buzzes: null,
      excluded: excludedObj,
    }).catch(()=>{});
    jeopardyBuzzer.armed = true; jeopardyBuzzer.results = [];
  } else {
    // Offline-Fallback: Tastatur
    jeopardyBuzzer.results = [];
    jeopardyBuzzer.armed = true;
    jeopardyBuzzer.start = performance.now();
  }
  renderBuzzer();
  updateGamemaster();
}

// Question closed — buzzers off
function jeopardyBuzzClose(){
  jeopardyBuzzer.excluded = [];
  jeopardyBuzzer.poppedForQuestion = false;
  if (jeopardyBuzzer.mode === 'firebase' && jeopardyBuzzer.fbRef){
    jeopardyBuzzer.fbRef.update({ live: false, armed: false, armStart: 0, buzzes: null, excluded: null }).catch(()=>{});
  } else if (jeopardyBuzzer.mode === 'sse' && jeopardyBuzzer.connected){
    fetch(BUZZER_URL + '/close', { method:'POST' }).catch(()=>{});
  }
  jeopardyBuzzer.armed = false; jeopardyBuzzer.results = [];
  renderBuzzer();
}

// Manuelles Ein-/Ausblenden der Buzzer-Anzeige oben rechts (GM-Wunsch)
function jeopardyBuzzToggleHidden(){
  jeopardyBuzzer.hidden = !jeopardyBuzzer.hidden;
  renderBuzzer();
  updateGamemaster();
}

// Keyboard fallback (nur wenn kein Server verbunden ist)
function jeopardyKeyHandler(e){
  if (!jeopardyState.active) return;
  const tag = (e.target && e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  const k = e.key === ' ' ? ' ' : (e.key || '').toLowerCase();
  if (k === ' ') { e.preventDefault(); jeopardyBuzzArm(); return; }
  if (jeopardyBuzzer.connected) return; // Handys übernehmen das Buzzern
  const team = jeopardyBuzzer.keys.indexOf(k);
  if (team < 0 || team >= jeopardyState.teamCount) return;
  if (!jeopardyBuzzer.armed) return;
  const name = jeopardyState.teamNames[team];
  if (jeopardyBuzzer.excluded.includes(name)) return;
  if (jeopardyBuzzer.results.some(r => r.name === name)) return;
  const rt = (performance.now() - jeopardyBuzzer.start) / 1000;
  jeopardyBuzzer.results.push({ name, t: rt });
  recordReaction(name, rt, 'Jeopardy');
  SFX.buzz();
  if (jeopardyBuzzer.results.length === 1) jeopardyBuzzer.poppedForQuestion = true;
  renderBuzzer();
  updateGamemaster();
}
document.addEventListener('keydown', jeopardyKeyHandler);

function renderBuzzer(){
  let el = document.getElementById('jeopardy-buzzer');
  const boardShown = screenActive('jeopardy-screen');
  // Bleibt komplett unsichtbar im Main-Fenster: solange kein Feld offen ist,
  // manuell ausgeblendet wurde, oder noch niemand für diese Frage gebuzzert hat.
  const shouldShow = jeopardyState.active && boardShown && !jeopardyBuzzer.hidden
    && !!jeopardyState.currentClue && jeopardyBuzzer.poppedForQuestion;
  if (!shouldShow) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'jeopardy-buzzer'; document.body.appendChild(el); }
  const rows = jeopardyBuzzer.results.map((r, idx) => `
    <div class="jbz-row ${idx === 0 ? 'first' : ''}">
      <span class="jbz-rank">${idx + 1}</span>
      <span class="jbz-name">${escapeHtml(r.name)}</span>
      <span class="jbz-time">${r.t.toFixed(2)}s</span>
    </div>`).join('');
  el.innerHTML = `
    <div class="jbz-title"><span>🔔 Buzzer</span><span class="${jeopardyBuzzer.armed ? 'jbz-armed' : 'jbz-idle'}">${jeopardyBuzzer.armed ? '● SCHARF' : '○ AUS'}</span></div>
    ${rows || '<div style="font-size:.7rem;color:rgba(255,255,255,.35);text-align:center;padding:6px 0;">Noch niemand</div>'}`;
}

// Buzzer-Beitritts-URL als großen QR-Code anzeigen
function jeopardyJoinUrl(){
  if (jeopardyBuzzer.joinUrl && jeopardyBuzzer.joinUrl.startsWith('http')) return jeopardyBuzzer.joinUrl;
  const origin = (location.origin && location.origin !== 'null') ? location.origin : '';
  return origin ? origin + '/buzzer' : '';
}
function showJeopardyQR(){
  const url = jeopardyJoinUrl();
  let ov = document.getElementById('qr-overlay');
  if (ov) ov.remove();
  ov = document.createElement('div');
  ov.id = 'qr-overlay';
  ov.innerHTML = `<div class="qr-card">
    <div class="qr-title">Scan zum Mitspielen</div>
    <div id="qr-box"></div>
    <div class="qr-url">${url || '(Seite lokal geöffnet — bitte über ' + SITE_URL + ' öffnen)'}</div>
    <div class="qr-hint">Klicken zum Schließen</div>
  </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', () => closeJeopardyQR());
  if (url && window.QRCode){
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.62;
    new QRCode(document.getElementById('qr-box'), {
      text: url, width: size, height: size,
      colorDark: '#0b0e2c', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }
  updateGamemaster();
}
function closeJeopardyQR(){
  const ov = document.getElementById('qr-overlay');
  if (ov) { ov.remove(); updateGamemaster(); }
}
// Ein Button im GM-Fenster für auf/zu, statt getrennter show/close-Aktionen
function toggleJeopardyQR(){
  if (document.getElementById('qr-overlay')) closeJeopardyQR();
  else showJeopardyQR();
}

// Öffnet den QR-Code als eigenes, verschiebbares Fenster (z.B. für einen
// zweiten Bildschirm/Beamer) - zusätzlich zum Vollbild-Overlay auf der Hauptseite.
let qrPopoutWin = null;
function popOutQR(){
  if (qrPopoutWin && !qrPopoutWin.closed) { qrPopoutWin.focus(); return; }
  const url = jeopardyJoinUrl();
  qrPopoutWin = window.open('', 'QRCode', 'width=380,height=480,resizable=yes');
  if (!qrPopoutWin) return; // vom Browser blockiert (kein direkter Klick als Auslöser)
  qrPopoutWin.document.open();
  qrPopoutWin.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<title>QR-Code</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
<style>
  :root{color-scheme:dark;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0b0e2c;color:#fff;font-family:'Inter',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:16px;padding:20px;text-align:center;}
  h2{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:3px;color:#FFD23F;text-transform:uppercase;margin:0;}
  #qr-box{background:#fff;padding:16px;border-radius:16px;line-height:0;}
  .url{color:#FFD23F;font-weight:700;word-break:break-all;font-size:.9rem;}
</style></head><body>
  <h2>Scan zum Mitspielen</h2>
  <div id="qr-box"></div>
  <div class="url">${url || '(Seite lokal geöffnet)'}</div>
<script>
  if (window.QRCode) {
    new QRCode(document.getElementById('qr-box'), {
      text: ${JSON.stringify(url)},
      width: 260, height: 260,
      colorDark: '#0b0e2c', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }
<\/script>
</body></html>`);
  qrPopoutWin.document.close();
}

// ── PASSWORT-GATE (nur Host-Seite; die /buzzer-Seite ist NICHT geschützt) ──
const HOST_PASSWORD = 'keller2024'; // hier dein Wunsch-Passwort setzen
function ensureHostGate(){
  if (storeGet('hostUnlocked') === HOST_PASSWORD) return;
  const gate = document.createElement('div');
  gate.id = 'host-gate';
  gate.innerHTML = `
    <div class="hg-title">🔒 Host-Bereich</div>
    <div class="hg-sub">Diese Seite ist die Spielsteuerung. Bitte Passwort eingeben, um fortzufahren.</div>
    <div class="hg-row">
      <input id="hg-input" type="password" placeholder="Passwort" autocomplete="off">
      <button class="btn btn-primary" id="hg-go">OK</button>
    </div>`;
  document.body.appendChild(gate);
  const input = /** @type {HTMLInputElement} */ (gate.querySelector('#hg-input'));
  const tryUnlock = () => {
    if (input.value === HOST_PASSWORD){
      // Merken ist Komfort, nicht Bedingung: schlägt es fehl, geht die Sperre
      // trotzdem auf - sonst käme der Host gar nicht ins Spiel.
      storeSet('hostUnlocked', HOST_PASSWORD);
      gate.remove();
    } else {
      gate.classList.add('err');
      input.value = '';
      setTimeout(() => gate.classList.remove('err'), 400);
    }
  };
  gate.querySelector('#hg-go').addEventListener('click', tryUnlock);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
  setTimeout(() => input.focus(), 50);
}
ensureHostGate();
renderFeudMediaSlots();

// Team-Namen-Felder auf den Setup-Screens: bei jeder Änderung sofort an die
// Lobby (Handys + Setup-Panel) weitergeben, auch das 3.-Team-Kästchen.
['team1-name','team2-name','team3-name'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { if (feudBuzzer.fbRef) broadcastFeudSetupTeamNames(); });
});
document.getElementById('enable-team3').addEventListener('change', () => { if (feudBuzzer.fbRef) broadcastFeudSetupTeamNames(); });
['jt1-name','jt2-name','jt3-name'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => { if (jeopardyBuzzer.presenceRef) broadcastJeopardySetupTeamNames(); });
});
document.getElementById('jeopardy-enable-team3').addEventListener('change', () => { if (jeopardyBuzzer.presenceRef) broadcastJeopardySetupTeamNames(); });

function jeopardyToggleAnswer() {
  if (!jeopardyState.currentClue) return;
  jeopardyState.answerShown = !jeopardyState.answerShown;
  renderJeopardyClueOverlay();
  updateGamemaster();
}

function jeopardyScore(teamIdx) {
  if (!jeopardyState.currentClue) return;
  if (!jeopardyTeamMayAnswer(teamIdx)) return;
  jeopardySnapshot();
  const { col, row } = jeopardyState.currentClue;
  const val = jeopardyClueValue();
  jeopardyState.scores[teamIdx] += val;
  jeopardyState.used[col][row] = true;
  jeopardyState.currentClue = null;
  jeopardyState.answerShown = false;
  jeopardyState.currentIsDaily = false;
  jeopardyState.ddTeam = null;
  jeopardyState.ddPending = false;
  jeopardyState.questionRevealed = false;
  SFX.correct();
  jeopardyStopSound(true);
  jeopardyBuzzClose();
  closeJeopardyClue();
  renderJeopardyScores();
  renderJeopardyBoard();
  updateGamemaster();
  if (jeopardyBoardComplete()) jeopardyAdvanceBoard();
}

// Deduct HALF the question value on a wrong answer
function jeopardyDeduct(teamIdx) {
  if (!jeopardyState.currentClue) return;
  if (!jeopardyTeamMayAnswer(teamIdx)) return;
  jeopardySnapshot();
  jeopardyState.scores[teamIdx] -= jeopardyDeductValue();
  SFX.wrong();
  renderJeopardyScores();
  updateGamemaster();
}

// Das Team des ersten Buzzers (aus der Lobby-Zuteilung), oder null wenn unbekannt.
function jeopardyBuzzTeam() {
  const r = jeopardyBuzzer.results[0];
  if (!r || r.team === undefined || r.team === null) return null;
  if (r.team < 0 || r.team >= jeopardyState.teamNames.length) return null;
  return r.team;
}

// Falsche Antwort des Buzzer-Teams: Hälfte abziehen und den Buzzer für die
// übrigen Teams wieder freigeben (der zuletzt Erste bleibt gesperrt).
function jeopardyWrongReopen(teamIdx) {
  jeopardyDeduct(teamIdx);
  jeopardyBuzzReopen();
}

function jeopardySkip() {
  if (!jeopardyState.currentClue) return;
  jeopardySnapshot();
  const { col, row } = jeopardyState.currentClue;
  jeopardyState.used[col][row] = true;
  jeopardyState.currentClue = null;
  jeopardyState.answerShown = false;
  jeopardyState.currentIsDaily = false;
  jeopardyState.ddTeam = null;
  jeopardyState.ddPending = false;
  jeopardyState.questionRevealed = false;
  jeopardyStopSound(true);
  jeopardyBuzzClose();
  closeJeopardyClue();
  renderJeopardyBoard();
  updateGamemaster();
  if (jeopardyBoardComplete()) jeopardyAdvanceBoard();
}

function closeJeopardyClue() {
  const ov = document.getElementById('jeopardy-clue-ov');
  if (ov) ov.remove();
  // Läuft gerade eine Schätzfrage, holt das die Handys zurück in den Buzzer-Screen
  if (jeopardyEstimate.open) jeopardyEstimateClose();
}

function showJeopardyBoardTransition() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  addBlackBackdrop();
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="danger-title-sign">${DANGER_SVG}</div>
    <div class="welcome-line1">Weiter geht's mit</div>
    <div class="welcome-line2" style="color:#FFD23F;">Board ${jeopardyState.currentBoard + 2}</div>
  `, 1500, () => {
    jeopardyState.currentBoard++;
    jeopardyState.used = jBoard().map(() => new Array(JEOPARDY_VALUES.length).fill(false));
    jeopardyState.currentClue = null;
    jeopardyState.answerShown = false;
    jeopardyHistory = [];
    showScreen('jeopardy-screen');
    renderJeopardyScores();
    renderJeopardyBoard();
    updateGamemaster();
    fadeOutBackdrop(document.querySelector('.black-backdrop'));
  });
}

function showJeopardyResults() {
  jeopardyBuzzDisconnect();
  const bz = document.getElementById('jeopardy-buzzer');
  if (bz) bz.remove();
  setClass('gm-bar', 'visible', false);
  const maxScore = Math.max(...jeopardyState.scores);
  const winners = jeopardyState.teamNames.filter((_, i) => jeopardyState.scores[i] === maxScore);
  setHtml('final-scores', jeopardyState.teamNames.map((name, i) =>
    `${name}: <strong>${jeopardyState.scores[i]}</strong> Punkte`).join('<br>'));
  setText('winner-text', winners.length > 1 ? 'Unentschieden!' : `${winners[0]} gewinnt!`);
  jeopardyState.active = false;
  closeJeopardyClue();
  const recordedToTournament = tournamentAutoRecordIfActive(jeopardyState.teamNames, jeopardyState.scores);
  showEl('tour-goto-btn', recordedToTournament);
  if (!recordedToTournament) offerTournamentResult('Jeopardy', jeopardyState.teamNames, jeopardyState.scores);
  recordAccountGameResult(jeopardyState.teamNames, jeopardyState.scores);
  showScreen('result-screen');
  updateGamemaster();
  if (winners.length === 1) confetti();
}

// ── JEOPARDY EDIT ──
/** Ein Feld aus einem beliebigen Board - der Editor arbeitet auch am gerade
 *  nicht bespielten.
 *  @returns {JeopardyClue} */
function jeopardyClue(b,col,row){ return jeopardyData.boards[b].categories[col].clues[row]; }
function jeopardyEditMedia(b,col,row,slot,input){
  const c = jeopardyClue(b,col,row);
  c.media = c.media || [];
  setMediaSlot(c.media, slot, input, renderJeopardyEditor);
}
function jeopardyEditImg(b,col,row,field,input){
  const f = input.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    const c = jeopardyClue(b,col,row);
    c[field] = r.result; c[field + 'Name'] = f.name; // Dateiname zum Identifizieren merken
    renderJeopardyEditor();
  };
  r.readAsDataURL(f);
}
/** Bild als Kategorie-Kopf setzen. Der Name bleibt erhalten und dient dem
 *  Host weiter als Beschriftung.
 *  @param {number} b  @param {number} col  @param {HTMLInputElement} input */
function jeopardyEditCatImg(b, col, input){
  const f = input.files && input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const cat = jeopardyData.boards[b].categories[col];
    cat.img = String(r.result); cat.imgName = f.name;
    renderJeopardyEditor();
  };
  r.readAsDataURL(f);
}
/** @param {number} b  @param {number} col */
function jeopardyClearCatImg(b, col){
  const cat = jeopardyData.boards[b].categories[col];
  delete cat.img; delete cat.imgName;
  renderJeopardyEditor();
}
function jeopardyClearImg(b,col,row,field){
  const c = jeopardyClue(b,col,row);
  delete c[field]; delete c[field + 'Name'];
  renderJeopardyEditor();
}
// Kleines Thumbnail eines gesetzten Jeopardy-Bilds mit Hover-Vorschau + Löschen.
function jimgThumb(clue, field, b, col, row, label) {
  if (!clue[field]) return '';
  const name = clue[field + 'Name'] || label;
  return `<span style="display:inline-flex;align-items:center;gap:5px;">
    <img class="jimg-thumb" src="${clue[field]}" data-preview-name="${escAttr(name)}" alt="">
    <button onclick="jeopardyClearImg(${b},${col},${row},'${field}')" style="background:none;border:none;color:#FF8A80;cursor:pointer;font-size:.8rem;padding:0 2px;" title="${escAttr(name)} entfernen">✕</button>
  </span>`;
}
function jeopardyEditStaged(b,col,row,cb){
  const c = jeopardyClue(b,col,row); c.staged = cb.checked;
  if(c.staged){ if(!c.stageCols) c.stageCols = 3; if(!c.stageRows) c.stageRows = 3; }
  renderJeopardyEditor();
}
function jeopardyEditGrid(b,col,row,val){
  const [cols,rows] = val.split('x').map(Number);
  const c = jeopardyClue(b,col,row); c.stageCols = cols; c.stageRows = rows;
}
function jeopardyEditSeries(b,col,row,cb){
  const c = jeopardyClue(b,col,row); c.series = cb.checked;
  if(c.series){ if(!c.seriesImgs) c.seriesImgs = []; if(!c.seriesCount) c.seriesCount = 5; }
  renderJeopardyEditor();
}
function jeopardyEditSeriesCount(b,col,row,val){
  const c = jeopardyClue(b,col,row); c.seriesCount = Math.max(2, Math.min(5, Number(val)||5));
  renderJeopardyEditor();
}
function jeopardyEditSeriesImg(b,col,row,idx,input){
  const f = input.files[0]; if(!f) return;
  const r = new FileReader();
  r.onload = () => {
    const c = jeopardyClue(b,col,row);
    c.seriesImgs = c.seriesImgs || []; c.seriesImgs[idx] = String(r.result);
    c.seriesNames = c.seriesNames || []; c.seriesNames[idx] = f.name; // Dateiname zum Identifizieren
    renderJeopardyEditor();
  };
  r.readAsDataURL(f);
}
function jeopardyClearSeriesImg(b,col,row,idx){
  const c = jeopardyClue(b,col,row);
  if(c.seriesImgs) c.seriesImgs[idx] = null;
  if(c.seriesNames) c.seriesNames[idx] = null;
  renderJeopardyEditor();
}

// Welches Feld im Board-Editor gerade zum Bearbeiten offen ist.
let jeopardyEditSel = { b: 0, col: 0, row: 0 };
function jeopardySelectClue(b, col, row){ jeopardyEditSel = { b, col, row }; renderJeopardyEditor(); }

// Kleine Status-Icons einer Frage fürs Board-Gitter.
function jeopardyCellBadges(clue){
  const hasImg = clue.qImg || clue.aImg || clue.stageImg || (clue.seriesImgs || []).some(Boolean);
  let b = '';
  if (hasImg)        b += '<span title="Bild">🖼</span>';
  if (clue.sound)    b += '<span title="Sound">🔊</span>';
  if (clue.staged)   b += '<span title="Staffeln">🧩</span>';
  if (clue.series)   b += '<span title="Bilder-Reihe">🎴</span>';
  if (clue.estimate) b += '<span title="Schätzfrage">📊</span>';
  return b;
}

// Das komplette Bearbeiten-Formular EINER Frage (unter dem Board-Gitter).
function jeopardyClueEditorHtml(b, col, row){
  const clue = jeopardyClue(b, col, row);
  const esc = s => escAttr(s);
  const cat = jeopardyData.boards[b].categories[col];
  const catName = cat.name || ('Kategorie ' + (col + 1));
  const uploadLbl = 'display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);cursor:pointer;color:rgba(255,255,255,.7);font-size:.68rem;font-weight:700;';
  const inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border-radius:7px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.35);color:#fff;font-family:inherit;font-size:.86rem;outline:none;';
  const gridOpts = [[2,2],[3,2],[4,2],[3,3],[5,1]];
  return `<div style="background:#0F1436;border:1px solid rgba(255,210,63,.35);border-radius:11px;padding:13px;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
      <span style="color:#FFD23F;font-size:.85rem;font-weight:800;">${escAttr(catName)} · ${JEOPARDY_VALUES[row]}</span>
    </div>
    <input type="text" placeholder="Frage / Clue" value="${esc(clue.q)}" onchange="jeopardyData.boards[${b}].categories[${col}].clues[${row}].q=this.value;renderJeopardyEditor()" style="${inp}font-weight:600;margin-bottom:7px;">
    <input type="text" placeholder="Lösung" value="${esc(clue.a)}" onchange="jeopardyData.boards[${b}].categories[${col}].clues[${row}].a=this.value;renderJeopardyEditor()" style="${inp}margin-bottom:9px;">
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
      <label style="${uploadLbl}">🖼 Frage-Bild<input type="file" accept="image/*" style="display:none;" onchange="jeopardyEditImg(${b},${col},${row},'qImg',this)"></label>
      ${jimgThumb(clue,'qImg',b,col,row,'Frage-Bild')}
      <label style="${uploadLbl}">🖼 Lösungs-Bild<input type="file" accept="image/*" style="display:none;" onchange="jeopardyEditImg(${b},${col},${row},'aImg',this)"></label>
      ${jimgThumb(clue,'aImg',b,col,row,'Lösungs-Bild')}
      <label style="${uploadLbl}">🔊 Sound<input type="file" accept="audio/*" style="display:none;" onchange="jeopardyEditImg(${b},${col},${row},'sound',this)"></label>
      ${clue.sound?`<span style="display:inline-flex;align-items:center;gap:5px;font-size:.65rem;color:#22C55E;">🔊 ${escAttr(clue.soundName||'Sound')}<button onclick="jeopardyClearImg(${b},${col},${row},'sound')" style="background:none;border:none;color:#FF8A80;cursor:pointer;font-size:.8rem;padding:0 2px;">✕</button></span>`:''}
      <label style="${uploadLbl}background:${clue.staged?'rgba(255,210,63,.15)':'rgba(255,255,255,.08)'};">
        <input type="checkbox" ${clue.staged?'checked':''} onchange="jeopardyEditStaged(${b},${col},${row},this)" style="accent-color:#FFD23F;"> 🧩 Staffeln
      </label>
      ${clue.staged?`
        <label style="${uploadLbl}">Staffel-Bild<input type="file" accept="image/*" style="display:none;" onchange="jeopardyEditImg(${b},${col},${row},'stageImg',this)"></label>
        ${clue.stageImg ? jimgThumb(clue,'stageImg',b,col,row,'Staffel-Bild') : '<span style="font-size:.65rem;color:#FF8A80;">kein Bild</span>'}
        <select onchange="jeopardyEditGrid(${b},${col},${row},this.value)" style="padding:4px 8px;border-radius:6px;background:rgba(0,0,0,.3);color:#fff;border:1px solid rgba(255,255,255,.12);font-size:.68rem;">
          ${gridOpts.map(([c2,r2])=>`<option value="${c2}x${r2}" ${(clue.stageCols||3)===c2&&(clue.stageRows||3)===r2?'selected':''}>${c2}×${r2} = ${c2*r2} Felder</option>`).join('')}
        </select>
      `:''}
      <label style="${uploadLbl}background:${clue.series?'rgba(255,210,63,.15)':'rgba(255,255,255,.08)'};">
        <input type="checkbox" ${clue.series?'checked':''} onchange="jeopardyEditSeries(${b},${col},${row},this)" style="accent-color:#FFD23F;"> 🎴 Bilder-Reihe
      </label>
      <label style="${uploadLbl}background:${clue.estimate?'rgba(255,210,63,.15)':'rgba(255,255,255,.08)'};" title="Statt Buzzer geben alle Handys eine Schätzung ein">
        <input type="checkbox" ${clue.estimate?'checked':''} onchange="jeopardyData.boards[${b}].categories[${col}].clues[${row}].estimate=this.checked;renderJeopardyEditor();" style="accent-color:#FFD23F;"> 📊 Schätzfrage
      </label>
      ${clue.estimate?`
        <label style="${uploadLbl}background:${clue.estimateText?'rgba(255,210,63,.15)':'rgba(255,255,255,.08)'};" title="Die Handys bekommen die normale Tastatur statt des Ziffernblocks - für Antworten wie Namen oder Orte">
          <input type="checkbox" ${clue.estimateText?'checked':''} onchange="jeopardyData.boards[${b}].categories[${col}].clues[${row}].estimateText=this.checked;renderJeopardyEditor();" style="accent-color:#FFD23F;"> 🔤 Buchstaben
        </label>
      `:''}
      ${clue.series?`
        <select onchange="jeopardyEditSeriesCount(${b},${col},${row},this.value)" title="Anzahl Bilder" style="padding:4px 8px;border-radius:6px;background:rgba(0,0,0,.3);color:#fff;border:1px solid rgba(255,255,255,.12);font-size:.68rem;">
          ${[2,3,4,5].map(n=>`<option value="${n}" ${jeopardySeriesCount(clue)===n?'selected':''}>${n} Bilder</option>`).join('')}
        </select>
        ${Array.from({length: jeopardySeriesCount(clue)}, (_,idx)=>{
          const has = clue.seriesImgs && clue.seriesImgs[idx];
          if (!has) return `<label style="${uploadLbl}" title="Bild ${idx+1}">＋ ${idx+1}<input type="file" accept="image/*" style="display:none;" onchange="jeopardyEditSeriesImg(${b},${col},${row},${idx},this)"></label>`;
          const nm = (clue.seriesNames && clue.seriesNames[idx]) || ('Bild ' + (idx+1));
          return `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="font-size:.62rem;color:#22C55E;font-weight:700;">${idx+1}</span><img class="jimg-thumb" src="${clue.seriesImgs[idx]}" data-preview-name="${escAttr(nm)}" alt=""><button onclick="jeopardyClearSeriesImg(${b},${col},${row},${idx})" style="background:none;border:none;color:#FF8A80;cursor:pointer;font-size:.8rem;padding:0 2px;" title="${escAttr(nm)} entfernen">✕</button></span>`;
        }).join('')}
      `:''}
    </div>
    <label style="display:block;font-size:.65rem;color:rgba(255,255,255,.4);margin:9px 0 4px;">Einblendungen (0-3 Bilder/Videos)</label>
    ${mediaSlotsHtml(clue.media || (clue.media = []), (slot, inputExpr) => `jeopardyEditMedia(${b},${col},${row},${slot},${inputExpr})`)}
    <input type="text" placeholder="📝 Notiz für den Host" value="${esc(clue.note)}" onchange="jeopardyData.boards[${b}].categories[${col}].clues[${row}].note=this.value" style="${inp}margin-top:7px;border-color:rgba(255,210,63,.25);background:rgba(255,210,63,.05);font-size:.82rem;">
  </div>`;
}

function renderJeopardyEditor() {
  const grid = document.getElementById('jeopardy-editor-grid');
  const esc = s => escAttr(s);
  const sel = jeopardyEditSel;
  const cols = JEOPARDY_CATS;
  let html = '';
  jeopardyData.boards.forEach((board, b) => {
    html += `<div class="page-title" style="margin:${b===0?'0':'26px'} 0 10px;"><em>Board ${b+1}</em></div>`;
    // Kopfzeile: Kategorienamen + Daily-Double-Schalter
    html += `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;margin-bottom:6px;">`;
    board.categories.forEach((cat, col) => {
      html += `<div style="display:flex;flex-direction:column;gap:3px;min-width:0;">
        <input type="text" value="${esc(cat.name)}" placeholder="Kategorie ${col+1}" onchange="jeopardyData.boards[${b}].categories[${col}].name=this.value;renderJeopardyEditor()" style="width:100%;box-sizing:border-box;padding:7px 6px;border-radius:7px;border:1px solid rgba(255,210,63,.3);background:rgba(0,0,0,.3);color:#FFD23F;font-family:inherit;font-size:.74rem;font-weight:700;text-align:center;outline:none;">
        ${cat.img
          ? `<span style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">
              <img class="jimg-thumb" src="${esc(cat.img)}" data-preview-name="${esc(cat.imgName || 'Kategorie-Bild')}" alt="">
              <button onclick="jeopardyClearCatImg(${b},${col})" style="background:none;border:none;color:#FF8A80;cursor:pointer;font-size:.8rem;padding:0 2px;" title="Bild entfernen, wieder Name anzeigen">✕</button>
            </span>`
          : `<label style="display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:3px 6px;border-radius:6px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);cursor:pointer;color:rgba(255,255,255,.6);font-size:.6rem;font-weight:700;" title="Bild statt Name im Kategorie-Kopf zeigen - der Name bleibt für dich als Beschriftung">🖼 Bild<input type="file" accept="image/*" style="display:none;" onchange="jeopardyEditCatImg(${b},${col},this)"></label>`}
        <label style="display:inline-flex;align-items:center;justify-content:center;gap:4px;font-size:.6rem;font-weight:700;color:${cat.noDD?'rgba(255,255,255,.3)':'#FFD23F'};cursor:pointer;" title="Daily Double in dieser Kategorie erlauben">
          <input type="checkbox" ${cat.noDD?'':'checked'} onchange="jeopardyData.boards[${b}].categories[${col}].noDD=!this.checked;renderJeopardyEditor()" style="accent-color:#FFD23F;transform:scale(.85);"> ★ DD
        </label>
      </div>`;
    });
    html += `</div>`;
    // Spielbrett: eine Zeile pro Wert, ein Feld pro Kategorie
    html += `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;">`;
    for (let row = 0; row < JEOPARDY_VALUES.length; row++){
      for (let col = 0; col < cols; col++){
        const clue = board.categories[col].clues[row];
        const filled = !!(clue.q || clue.a);
        const isSel = sel.b === b && sel.col === col && sel.row === row;
        html += `<div onclick="jeopardySelectClue(${b},${col},${row})" style="cursor:pointer;min-height:50px;border-radius:8px;display:flex;align-items:center;justify-content:center;position:relative;background:${isSel?'#3a2e00':(filled?'rgba(255,255,255,.05)':'rgba(255,255,255,.02)')};border:1px solid ${isSel?'#FFD23F':(filled?'rgba(255,255,255,.1)':'rgba(255,255,255,.05)')};">
          <span style="color:${filled?'#FFD23F':'rgba(255,255,255,.35)'};font-weight:700;font-size:1rem;">${JEOPARDY_VALUES[row]}</span>
          <span style="position:absolute;top:3px;right:4px;font-size:.6rem;line-height:1;display:flex;gap:1px;">${jeopardyCellBadges(clue)}</span>
          <span style="position:absolute;bottom:3px;left:5px;font-size:.62rem;line-height:1;color:${filled?'#22C55E':'rgba(255,255,255,.25)'};">${filled?'✓':'○'}</span>
        </div>`;
      }
    }
    html += `</div>`;
    // Bearbeiten-Panel unter dem Board, dem die Auswahl gehört
    if (sel.b === b){
      html += `<div style="margin-top:10px;">${jeopardyClueEditorHtml(b, sel.col, sel.row)}</div>`;
    }
  });
  grid.innerHTML = html;
}

function exportJeopardy() { downloadJSON(jeopardyData, 'jeopardy-boards.json'); }

function importJeopardy(e) {
  readJsonFile(e, d => {
    let boards = null;
    if (Array.isArray(d.boards)) boards = d.boards;
    else if (Array.isArray(d.categories)) boards = [d, makeEmptyBoard(2)]; // legacy single-board file
    else if (Array.isArray(d)) boards = d; // bare array of boards
    if (!boards) throw new Error('Ungültiges Format');
    // Normalise to exactly 2 boards
    while (boards.length < JEOPARDY_BOARDS) boards.push(makeEmptyBoard(boards.length + 1));
    boards = boards.slice(0, JEOPARDY_BOARDS);
    jeopardyData = { boards };
    renderJeopardyEditor();
  });
}

