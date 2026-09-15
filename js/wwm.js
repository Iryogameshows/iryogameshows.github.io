/* Wer wird Millionaer.

   Herausgeloest aus index.html (Zeilen 6882-7251). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
// ── WER WIRD MILLIONÄR ──
const WWM_LADDER = [50,100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,500000,1000000];
const WWM_SAFE = [4, 9]; // Sicherheitsstufen: 500 € und 16.000 €
const WWM_LETTERS = ['A','B','C','D'];

let wwmData = {
  questions: [
    { q:'Welche Farbe hat der Himmel bei klarem Wetter tagsüber?', answers:['Blau','Grün','Rot','Gelb'], correct:0 },
    { q:'Wie viele Beine hat eine Spinne?', answers:['6','8','10','4'], correct:1 },
    { q:'Welches Tier bellt?', answers:['Katze','Kuh','Hund','Pferd'], correct:2 },
    { q:'Wie heißt die Hauptstadt von Deutschland?', answers:['München','Hamburg','Köln','Berlin'], correct:3 },
    { q:'Wie viele Tage hat eine Woche?', answers:['7','5','6','8'], correct:0 },
    { q:'Welches Planet ist der Sonne am nächsten?', answers:['Venus','Merkur','Mars','Erde'], correct:1 },
    { q:'Welches Element hat das Symbol O?', answers:['Gold','Osmium','Sauerstoff','Eisen'], correct:2 },
    { q:'In welchem Land steht der Eiffelturm?', answers:['Italien','Spanien','England','Frankreich'], correct:3 },
    { q:'Wie viele Kontinente gibt es?', answers:['7','5','6','8'], correct:0 },
    { q:'Wer malte die Mona Lisa?', answers:['Picasso','Da Vinci','Van Gogh','Monet'], correct:1 },
    { q:'Welches ist das größte Säugetier?', answers:['Elefant','Nashorn','Blauwal','Giraffe'], correct:2 },
    { q:'Wie viele Bundesländer hat Deutschland?', answers:['14','15','13','16'], correct:3 },
    { q:'Welches Jahr begann der Zweite Weltkrieg?', answers:['1939','1941','1918','1945'], correct:0 },
    { q:'Wie viele Herzkammern hat der Mensch?', answers:['3','2','4','1'], correct:2 },
    { q:'Welches chemische Element hat die Ordnungszahl 1?', answers:['Helium','Sauerstoff','Kohlenstoff','Wasserstoff'], correct:3 },
  ]
};

let wwmState = {
  active:false, name:'', currentQ:0, selected:null, locked:false, revealed:false,
  removed:[], lifelines:{fifty:false, phone:false, audience:false},
  audienceShown:false, audienceData:null, gameOver:false,
};

function wwmMoney(n){ return n.toLocaleString('de-DE') + ' €'; }

function startWwm(){
  // Prüfen bevor das Board-Fenster aufgeht: sonst steht ein leeres Fenster
  // offen und der Hauptbildschirm zeigt die Reste der letzten Runde.
  if (!wwmData.questions.length) { alert('Keine Fragen vorhanden.'); return; }
  openBoardPopout();
  startWwmActual();
}
function startWwmActual(){
  if (!wwmData.questions.length) { alert('Keine Fragen vorhanden.'); return; }
  jeopardyState.active = false;
  finaleState.active = false;
  wwdsState.active = false;
  wwmState.name = document.getElementById('wwm-name').value || 'Kandidat';
  wwmState.currentQ = 0;
  wwmState.lifelines = {fifty:false, phone:false, audience:false};
  wwmState.gameOver = false;
  wwmState.active = true;
  document.getElementById('wwm-name-label').textContent = wwmState.name;
  showScreen('wwm-screen');
  loadWwmQuestion();
  setTimeout(() => openGamemaster(), 120);
}

function loadWwmQuestion(){
  wwmState.selected = null;
  wwmState.locked = false;
  wwmState.revealed = false;
  wwmState.removed = [];
  wwmState.audienceShown = false;
  wwmState.audienceData = null;
  document.getElementById('wwm-audience').style.display = 'none';
  resetMediaOverlay();
  renderWwm();
  updateGamemaster();
}
function wwmToggleMedia(slot) {
  const q = wwmData.questions[wwmState.currentQ];
  if (!q) return;
  toggleMediaSlot(q.media || [], slot);
}

function renderWwm(){
  const q = wwmData.questions[wwmState.currentQ];
  if (!q) return;
  document.getElementById('wwm-info').textContent = `Frage ${wwmState.currentQ+1} / ${wwmData.questions.length}`;
  document.getElementById('wwm-name-label').textContent = wwmState.name;
  document.getElementById('wwm-question').textContent = q.q;
  document.getElementById('wwm-answers').innerHTML = q.answers.map((a,i) => {
    let cls = '';
    if (wwmState.removed.includes(i)) cls = 'removed';
    if (wwmState.revealed && i === q.correct) cls = 'correct';
    else if (wwmState.revealed && i === wwmState.selected && i !== q.correct) cls = 'wrong';
    else if (wwmState.selected === i && !wwmState.revealed) cls = 'selected';
    return `<div class="wwm-opt ${cls}" onclick="wwmSelect(${i})">
      <span class="wwm-letter">${WWM_LETTERS[i]}</span><span class="wwm-text">${escapeHtml(a)}</span>
    </div>`;
  }).join('');
  // Lifelines
  document.getElementById('wwm-lifelines').innerHTML = `
    <div class="wwm-ll ${wwmState.lifelines.fifty?'used':''}">50:50</div>
    <div class="wwm-ll ${wwmState.lifelines.phone?'used':''}">📞</div>
    <div class="wwm-ll ${wwmState.lifelines.audience?'used':''}">👥</div>`;
  // Ladder
  document.getElementById('wwm-ladder').innerHTML = WWM_LADDER.map((amt,i) => {
    let cls = 'wwm-rung';
    if (WWM_SAFE.includes(i)) cls += ' safe';
    if (i === wwmState.currentQ) cls += ' current';
    if (i < wwmState.currentQ) cls += ' won';
    return `<div class="${cls}"><span class="wwm-lvl">${i+1}</span><span class="wwm-amt">${wwmMoney(amt)}</span></div>`;
  }).join('');
  // Audience chart
  const aud = document.getElementById('wwm-audience');
  if (wwmState.audienceShown && wwmState.audienceData){
    aud.style.display = 'flex';
    aud.innerHTML = q.answers.map((a,i) => wwmState.removed.includes(i)
      ? ''
      : `<div class="wwm-abar" style="height:${Math.max(6,wwmState.audienceData[i])}%">
           <span class="wwm-apct">${wwmState.audienceData[i]}%</span>
           <span class="wwm-alet">${WWM_LETTERS[i]}</span>
         </div>`).join('');
  } else {
    aud.style.display = 'none';
  }
}

function wwmSelect(i){
  if (wwmState.locked || wwmState.revealed || wwmState.gameOver) return;
  if (wwmState.removed.includes(i)) return;
  wwmState.selected = i;
  renderWwm();
  updateGamemaster();
}

function wwmLock(){
  if (wwmState.selected === null || wwmState.locked) return;
  wwmState.locked = true;
  renderWwm();
  updateGamemaster();
}

function wwmReveal(){
  if (!wwmState.locked || wwmState.revealed) return;
  wwmState.revealed = true;
  const q = wwmData.questions[wwmState.currentQ];
  if (wwmState.selected === q.correct) SFX.correct(); else SFX.wrong();
  renderWwm();
  updateGamemaster();
}

function wwmNext(){
  const q = wwmData.questions[wwmState.currentQ];
  if (!wwmState.revealed) return;
  if (wwmState.selected === q.correct){
    const letzteFrage   = wwmState.currentQ >= wwmData.questions.length - 1;
    const oberstesFeld  = wwmState.currentQ >= WWM_LADDER.length - 1;
    if (letzteFrage || oberstesFeld){
      // Millionär ist nur, wer wirklich oben auf der Leiter ankommt. Wer mit
      // weniger als 15 Fragen spielt, hat vorher schon alle beantwortet - dann
      // stand hier "ist Millionär!" über einem Gewinn von 500 €.
      wwmEnd(WWM_LADDER[wwmState.currentQ], oberstesFeld);
    } else {
      wwmState.currentQ++;
      loadWwmQuestion();
    }
  } else {
    wwmEnd(wwmSecured(wwmState.currentQ), false);
  }
}

function wwmSecured(qIdx){
  let amt = 0;
  WWM_SAFE.forEach(s => { if (qIdx > s) amt = WWM_LADDER[s]; });
  return amt;
}

function wwmWalkAway(){
  if (wwmState.gameOver) return;
  const amt = wwmState.currentQ > 0 ? WWM_LADDER[wwmState.currentQ-1] : 0;
  wwmEnd(amt, false);
}

function wwmEnd(amount, jackpot){
  wwmState.gameOver = true;
  wwmState.active = false;
  document.getElementById('gm-bar').classList.remove('visible');
  document.getElementById('winner-text').textContent = jackpot
    ? `${wwmState.name} ist Millionär! 🎉`
    : `${wwmState.name} gewinnt ${wwmMoney(amount)}`;
  document.getElementById('final-scores').innerHTML = `Gewonnen: <strong>${wwmMoney(amount)}</strong>`;
  document.getElementById('tour-record-btn').style.display = 'none';
  const recordedToTournament = tournamentAutoRecordIfActive([wwmState.name], [amount]);
  document.getElementById('tour-goto-btn').style.display = recordedToTournament ? '' : 'none';
  showScreen('result-screen');
  updateGamemaster();
  if (amount > 0) confetti(jackpot);
}

// ── LIFELINES ──
function wwmFifty(){
  if (wwmState.lifelines.fifty || wwmState.revealed) return;
  const q = wwmData.questions[wwmState.currentQ];
  // An der tatsächlichen Antwortzahl entlang statt an fest verdrahteten vier:
  // eine importierte Frage kann auch drei haben, dann verwies [0,1,2,3] auf
  // eine Antwort, die es gar nicht gibt.
  const wrong = q.answers.map((_, i) => i).filter(i => i !== q.correct);
  // mischen, eine falsche stehen lassen, den Rest entfernen
  for (let i = wrong.length-1; i>0; i--){ const j = Math.floor(Math.random()*(i+1)); [wrong[i],wrong[j]]=[wrong[j],wrong[i]]; }
  wwmState.removed = wrong.slice(0, Math.max(0, wrong.length - 1));
  if (wwmState.selected !== null && wwmState.removed.includes(wwmState.selected)) wwmState.selected = null;
  wwmState.lifelines.fifty = true;
  renderWwm();
  updateGamemaster();
}

function wwmPhone(){
  if (wwmState.lifelines.phone) return;
  wwmState.lifelines.phone = true;
  renderWwm();
  updateGamemaster();
}

function wwmAudience(){
  if (wwmState.lifelines.audience || wwmState.revealed) return;
  const q = wwmData.questions[wwmState.currentQ];
  const active = q.answers.map((_, i) => i).filter(i => !wwmState.removed.includes(i));
  // gewichteter Zufall: die richtige Antwort bekommt den grossen Anteil
  const weights = {};
  let total = 0;
  active.forEach(i => { const w = (i===q.correct? 45+Math.random()*30 : 5+Math.random()*20); weights[i]=w; total+=w; });
  const data = new Array(q.answers.length).fill(0);
  let sum = 0;
  active.forEach((i,idx) => { let p = Math.round(weights[i]/total*100); data[i]=p; sum+=p; });
  // fix rounding to 100
  data[q.correct] += (100 - sum);
  wwmState.audienceData = data;
  wwmState.audienceShown = true;
  wwmState.lifelines.audience = true;
  renderWwm();
  updateGamemaster();
}

// ── WWM GAMEMASTER ──
function wwmControlsHtml(pfx){
  const q = wwmData.questions[wwmState.currentQ];
  let btns = '';
  if (!wwmState.locked){
    btns += `<button class="gm-btn gm-gold" onclick="${pfx}wwmLock()">✓ Antwort loggen</button>`;
    btns += `<button class="gm-btn gm-gray" onclick="${pfx}wwmWalkAway()">Auszahlen</button>`;
    if (!wwmState.lifelines.fifty) btns += `<button class="gm-btn gm-blue" onclick="${pfx}wwmFifty()">50:50</button>`;
    if (!wwmState.lifelines.phone) btns += `<button class="gm-btn gm-blue" onclick="${pfx}wwmPhone()">📞 Telefon</button>`;
    if (!wwmState.lifelines.audience) btns += `<button class="gm-btn gm-blue" onclick="${pfx}wwmAudience()">👥 Publikum</button>`;
  } else if (!wwmState.revealed){
    btns += `<button class="gm-btn gm-gold" onclick="${pfx}wwmReveal()">Auflösen</button>`;
  } else {
    if (wwmState.selected === q.correct){
      btns += `<button class="gm-btn gm-gold" onclick="${pfx}wwmNext()">Weiter →</button>`;
    } else {
      btns += `<button class="gm-btn gm-red" onclick="${pfx}wwmNext()">Beenden</button>`;
    }
  }
  return btns;
}

function wwmBarButtons(){ return wwmControlsHtml(''); }

function updateGamemasterWwm(){
  const q = wwmData.questions[wwmState.currentQ];
  if (!q) return;
  const answersHtml = q.answers.map((a,i) => {
    const isCorrect = i === q.correct;
    const removed = wwmState.removed.includes(i);
    const sel = wwmState.selected === i;
    let bg = 'rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.3)';
    if (isCorrect) bg = 'rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.45)';
    if (sel) bg = 'rgba(245,158,11,.2);border:1px solid rgba(245,158,11,.5)';
    return `<div class="answer" style="background:${bg};${removed?'opacity:.35;text-decoration:line-through;':''}cursor:${wwmState.locked?'default':'pointer'}" ${(!wwmState.locked && !removed)?`onclick="opener.wwmSelect(${i})"`:''}>
      <span><span class="num">${WWM_LETTERS[i]}</span> <span class="text">${escapeHtml(a)}</span>${isCorrect?' <span style="color:#22C55E;font-size:.7rem;">✔ richtig</span>':''}</span>
    </div>`;
  }).join('');
  const amtNow = WWM_LADDER[wwmState.currentQ];
  const secured = wwmSecured(wwmState.currentQ);
  const audHtml = wwmState.audienceShown && wwmState.audienceData
    ? `<div style="font-size:.8rem;margin-bottom:10px;color:rgba(255,255,255,.7);">Publikum: ${q.answers.map((a,i)=>wwmState.removed.includes(i)?'':`${WWM_LETTERS[i]} ${wwmState.audienceData[i]}%`).filter(Boolean).join(' · ')}</div>`
    : '';

  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}
  .money{display:flex;justify-content:space-between;font-size:.85rem;}
  .money strong{color:#FFD23F;}
  .ll{font-size:.72rem;color:rgba(255,255,255,.5);}
  .ll b{color:#FFD23F;}
</style></head><body>
  ${gmHeaderHtml('Gamemaster', `Millionär · Frage ${wwmState.currentQ+1} / ${wwmData.questions.length}`)}
  <div class="gm-body">
  <div class="gm-main">
  <div class="question">${q.q}</div>
  ${qNoteHtml(q.note)}
  <div class="answer-list">${answersHtml}</div>
  ${mediaControlButtonsHtml(q.media, 'wwmToggleMedia')}
  <div class="hint-line">
    ${wwmState.locked ? (wwmState.revealed ? 'Aufgelöst.' : 'Geloggt — jetzt auflösen.') : (wwmState.selected!==null ? 'Antwort '+WWM_LETTERS[wwmState.selected]+' gewählt.' : 'Keine Antwort gewählt.')}
  </div>
  </div>
  <div class="gm-side">
  <div class="panel">
    <div class="panel-head"><span>💰 Stand</span></div>
    <div class="money"><span>Frage um: <strong>${wwmMoney(amtNow)}</strong></span><span>Sicher: <strong>${wwmMoney(secured)}</strong></span></div>
    <div class="ll">Joker: 50:50 <b>${wwmState.lifelines.fifty?'✗':'✓'}</b> · Telefon <b>${wwmState.lifelines.phone?'✗':'✓'}</b> · Publikum <b>${wwmState.lifelines.audience?'✗':'✓'}</b></div>
    ${audHtml}
  </div>
  ${gmNotesPanelHtml()}
  </div>
  </div>
  <div class="gm-actions">${wwmControlsHtml('opener.')}</div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}

// ── WWM EDIT ──
function renderWwmEditor(){
  const grid = document.getElementById('wwm-editor-grid');
  grid.innerHTML = wwmData.questions.map((q,i) => `
    <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06);">
      <label>Frage ${i+1} <span style="color:#FFD23F;">(${wwmMoney(WWM_LADDER[i]||0)})</span>
        <button class="btn btn-danger" style="float:right;padding:4px 10px;font-size:.7rem;" onclick="wwmDeleteQuestion(${i})">Del</button>
      </label>
      <input type="text" value="${escAttr(q.q)}" onchange="wwmData.questions[${i}].q=this.value" style="width:100%;padding:9px 12px;border-radius:8px;border:1.5px solid rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.9rem;font-weight:600;outline:none;margin-bottom:8px;">
      ${q.answers.map((a,j) => `
        <div style="display:flex;gap:8px;margin-bottom:5px;align-items:center;">
          <label style="display:flex;align-items:center;gap:5px;color:${q.correct===j?'#22C55E':'rgba(255,255,255,.4)'};font-size:.8rem;font-weight:700;min-width:52px;">
            <input type="radio" name="wwm-correct-${i}" ${q.correct===j?'checked':''} onchange="wwmData.questions[${i}].correct=${j};renderWwmEditor();" style="accent-color:#22C55E;"> ${WWM_LETTERS[j]}
          </label>
          <input type="text" value="${escAttr(a)}" onchange="wwmData.questions[${i}].answers[${j}]=this.value" style="flex:1;padding:7px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.85rem;outline:none;">
        </div>`).join('')}
      <label style="display:block;font-size:.65rem;color:rgba(255,255,255,.4);margin:8px 0 4px;">Einblendungen (0-3 Bilder/Videos)</label>
      ${mediaSlotsHtml(q.media || (q.media = []), (slot, inputExpr) => `wwmEditMedia(${i},${slot},${inputExpr})`)}
      <input type="text" placeholder="📝 Notiz für den Host" value="${escAttr(q.note)}" onchange="wwmData.questions[${i}].note=this.value" style="width:100%;margin-top:6px;padding:7px 10px;border-radius:6px;border:1px solid rgba(255,210,63,.25);background:rgba(255,210,63,.05);color:#fff;font-family:inherit;font-size:.82rem;outline:none;">
    </div>`).join('');
}
function wwmEditMedia(i,slot,input){
  const q = wwmData.questions[i];
  q.media = q.media || [];
  setMediaSlot(q.media, slot, input, renderWwmEditor);
}

function wwmAddQuestion(){
  wwmData.questions.push({ q:'Neue Frage', answers:['','','',''], correct:0 });
  renderWwmEditor();
}
function wwmDeleteQuestion(i){
  if (confirm('Frage löschen?')){ wwmData.questions.splice(i,1); renderWwmEditor(); }
}
function exportWwm(){ downloadJSON(wwmData, 'millionaer-fragen.json'); }
function importWwm(e){
  readJsonFile(e, d => {
    let qs = Array.isArray(d.questions) ? d.questions : (Array.isArray(d) ? d : null);
    if (!qs) throw new Error('Ungültiges Format');
    // normalise
    // Auf vier Antworten bringen und correct in den gültigen Bereich zwingen.
    // Vorher wurde nur abgeschnitten: eine Datei mit zwei Antworten ergab eine
    // Frage, bei der 50:50 und der Publikumsjoker auf Nichts zugriffen, und
    // ein correct von 7 zeigte gar keine richtige Antwort an.
    qs = qs.map(x => {
      const answers = (Array.isArray(x.answers) ? x.answers : []).slice(0, 4)
        .map(a => String(a == null ? '' : a));
      while (answers.length < 4) answers.push('');
      let correct = Number(x.correct);
      if (!Number.isInteger(correct) || correct < 0 || correct >= answers.length) correct = 0;
      return { q:x.q||x.question||'', answers, correct, media:x.media||[], note:x.note||'' };
    });
    wwmData = { questions: qs };
    renderWwmEditor();
  });
}
