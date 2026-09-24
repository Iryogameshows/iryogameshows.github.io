// @ts-check
/* Der Duemmste fliegt.

   Herausgeloest aus index.html (Zeilen 8046-8820). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
/* ══════════════════════════════════════════════════════════════════════════
   DER DÜMMSTE FLIEGT
   Einzelspieler mit Leben. Alle bekommen dieselbe Frage, danach stimmen die
   Verbliebenen ab - der Gewählte verliert ein Herz. Bei null Herzen ist er
   raus, der Letzte gewinnt.
   ══════════════════════════════════════════════════════════════════════════ */

const DDF_MAX_MEDIA = 5;

let ddfData = {
  questions: [
    { q:'Welches Tier kann nicht rückwärts laufen?', answer:'Das Känguru', note:'Der dicke Schwanz steht im Weg.', qMedia:[], aMedia:[] },
    { q:'Wie viele Streifen hat die Flagge der USA?', answer:'13', note:'Für die 13 Gründerstaaten.', qMedia:[], aMedia:[] },
    { q:'In welchem Land steht die Chinesische Mauer nicht?', answer:'In der Mongolei', note:'', qMedia:[], aMedia:[] },
    { q:'Was ist schwerer: ein Kilo Federn oder ein Kilo Blei?', answer:'Gleich schwer', note:'Der Klassiker.', qMedia:[], aMedia:[] },
    { q:'Wie viele Minuten hat ein Fußballspiel ohne Nachspielzeit?', answer:'90', note:'', qMedia:[], aMedia:[] },
    { q:'Welcher Planet ist der Sonne am nächsten?', answer:'Merkur', note:'', qMedia:[], aMedia:[] },
  ]
};

// Identität läuft durchgehend über uid, nie über den Namen: zwei Teilnehmer
// dürfen gleich heißen, ohne sich gegenseitig Herzen abzuziehen. Für Accounts
// ist uid der Account-Key, für Gäste ein beim Start vergebener Pseudokey.
let ddfState = {
  active:false,
  players:[],            // [{ uid, name, avatar, color, key, lives, out }]
  maxLives:3,
  roundTime:30,
  order:[], idx:0,       // gemischte Fragenreihenfolge
  // question → answer → vote → [runoffAnnounce → vote] → [tiebreak] → result → done
  phase:'question',
  timer:0, timerInt:null, timeUp:false,
  votes:{},              // von den Handys (Firebase spiegelt hier herein)
  hostVotes:{},          // vom Host für Gäste ohne Handy eingetragen
  runoff:null,           // uids der Stichwahl-Kandidaten
  tied:null,             // uids bei Gleichstand
  lastCounts:null,       // { uid: Stimmen }
  loser:null,            // uid
};

/* ── Setup ─────────────────────────────────────────────────────────────── */

// Teilnehmer werden aus den Spieler-Accounts gewählt - nicht nur aus den
// gerade verbundenen Geräten. Wer offline ist, kann trotzdem mitspielen: der
// Host tippt für ihn, das Handy braucht DDF ohnehin nur zum Beitreten.
// Die Auswahl selbst steckt in roster.js, geteilt mit Der Preis ist heiß.

// avoid: Fragenindex, der nicht vorne stehen soll. Beim Nachmischen ist das
// die zuletzt gestellte Frage, sonst käme sie sofort ein zweites Mal.
function ddfShuffledOrder(avoid){
  const a = shuffledIndices(ddfData.questions.length);
  if (a.length > 1 && a[0] === avoid) [a[0], a[1]] = [a[1], a[0]];
  return a;
}

function startDdf(){
  const people = rosterContestants('ddf');
  if (people.length < 2) { alert('Mindestens zwei Teilnehmer — per QR beitreten lassen oder Gäste eintragen.'); return; }
  if (!ddfData.questions.length) { alert('Keine Fragen vorhanden.'); return; }

  const lives = Math.max(1, Number(fieldVal('ddf-lives')) || 3);
  const time  = Math.max(0, Number(fieldVal('ddf-time')) || 0);

  ddfState = {
    active:true,
    // uid einmal hier vergeben und nie wieder ändern: Accounts über ihren Key,
    // Gäste über ihre Position - so bleiben auch zwei "Max" auseinander.
    players: people.map((p,i) => ({
      uid: p.key || ('guest:' + i),
      label: rosterLabelFor(people, i),
      name:p.name, avatar:p.avatar, color:p.color, key:p.key, lives, out:false,
    })),
    maxLives: lives,
    roundTime: time,
    order: ddfShuffledOrder(-1),
    idx: 0,
    phase:'question',
    timer:0, timerInt:null, timeUp:false,
    votes:{}, hostVotes:{},
    runoff:null, tied:null, lastCounts:null, loser:null,
  };
  ddfSaveSettings();
  showScreen('ddf-screen');
  ddfRenderRound();
}

/* ── Anzeige ───────────────────────────────────────────────────────────── */

function ddfAlive(){ return ddfState.players.filter(p => !p.out); }

function ddfByUid(uid){ return ddfState.players.find(p => p.uid === uid) || null; }

// Anzeigename zu einer uid - für Listen, die nur uids führen (lastCounts, tied).
function ddfNameOf(uid){ const p = ddfByUid(uid); return p ? p.label : ''; }

/* Die Wertung. picked ist die uid des hervorzuhebenden Spielers (Verlierer
   bzw. Sieger).

   Sortiert wird nach Spielstand, nicht nach Beitrittsreihenfolge: wer noch
   drin ist, steht vorn, danach die Ausgeschiedenen. Das haelt das laufende
   Feld zusammen - bei acht Teilnehmern standen die drei noch Lebenden sonst
   verteilt zwischen den Ausgeschiedenen, und der Host musste bei jeder
   Abstimmung neu suchen.

   Innerhalb einer Gruppe entscheidet die urspruengliche Reihenfolge (die
   Sortierung faellt auf den Ausgangsindex zurueck). Ohne das tauschen zwei
   Gleichstehende nach jeder Runde grundlos die Plaetze.

   Bewusst NICHT nach Leben sortiert: in diesem Spiel entscheidet die
   Abstimmung, nicht der Punktestand - eine Rangfolge nach Herzen waere eine
   Aussage, die das Spiel gar nicht macht. */
function ddfRenderPlayers(picked){
  const box = document.getElementById('ddf-players');
  if (!box) return;
  const sorted = ddfState.players
    .map((p, i) => ({ p, i }))
    .sort((a, b) => (a.p.out === b.p.out ? a.i - b.i : (a.p.out ? 1 : -1)));
  const alive = ddfState.players.filter(p => !p.out).length;
  box.innerHTML = sorted.map(({ p }) => {
    let hearts = '';
    for (let i = 0; i < ddfState.maxLives; i++)
      hearts += `<span class="ddf-heart ${i < p.lives ? 'full' : 'empty'}">❤</span>`;
    // Letztes Herz: der Moment, auf den in dieser Show alles zulaeuft. Er
    // steht bisher nur in der Zahl der roten Herzen - bei fuenf Leben sieht
    // man den Unterschied zwischen zwei und einem erst auf den zweiten Blick.
    const cls = 'ddf-player'
      + (p.out ? ' out' : '')
      + (!p.out && p.lives === 1 ? ' last' : '')
      + (picked === p.uid ? ' picked' : '');
    const av = p.avatar ? playerAvatarHtml(p) + ' ' : '';
    return `<div class="${cls}">
      <div class="ddf-player-name">${av}${escAttr(p.label)}</div>
      <div class="ddf-hearts">${hearts}</div>
    </div>`;
  }).join('');
  setText('ddf-alive', alive === 1 ? 'Einer übrig' : alive + ' noch dabei');
}

function ddfCurrentQuestion(){ return ddfData.questions[ddfState.order[ddfState.idx]] || null; }

// Ist die Antwort schon aufgedeckt? Ab dem Aufdecken bleibt sie den Rest der
// Runde stehen - auch während Abstimmung, Stichwahl und Ergebnis.
function ddfAnswerRevealed(){
  return ddfState.phase !== 'question' && ddfState.phase !== 'done';
}

// Bild-Leiste: Zusatzbilder zur Frage und - nach dem Aufdecken - zur Antwort.
let ddfLastMediaArr = 'qMedia';

function ddfRenderMediaBar(){
  const bar = document.getElementById('ddf-media-bar');
  const q = ddfCurrentQuestion();
  if (!bar || !q) return;
  const btn = (arrName, i, label) =>
    `<button class="btn btn-secondary" style="padding:5px 11px;font-size:.75rem;"
       onclick="ddfShowMedia('${arrName}', ${i})">${label}</button>`;
  let html = (q.qMedia||[]).map((m,i) => m ? btn('qMedia', i, `🖼 Frage ${i+1}`) : '').join('');
  if (ddfAnswerRevealed())
    html += (q.aMedia||[]).map((m,i) => m ? btn('aMedia', i, `🖼 Antwort ${i+1}`) : '').join('');
  bar.innerHTML = html;
}

function ddfShowMedia(which, i){
  const q = ddfCurrentQuestion();
  if (!q) return;
  const arr = q[which] || [];
  activeMediaSlot = (activeMediaSlot === i && ddfLastMediaArr === which) ? null : i;
  ddfLastMediaArr = which;
  renderMediaOverlay(arr);
}

function ddfRenderRound(){
  const q = ddfCurrentQuestion();

  // Das Ergebnis der letzten Abstimmung muss stehenbleiben, auch wenn dadurch
  // nur noch einer übrig ist - sonst sieht niemand, wie das Spiel ausging.
  // Erst "Weiter" ruft ddfFinish() auf.
  if (!q || (ddfAlive().length <= 1 && ddfState.phase !== 'result')) { ddfFinish(); return; }

  ddfRenderPlayers(ddfState.phase === 'result' ? ddfState.loser : null);
  setHtml('ddf-question', escAttr(q.q));
  const ans = document.getElementById('ddf-answer');
  ans.style.display = ddfAnswerRevealed() ? '' : 'none';
  ans.innerHTML = escAttr(q.answer);
  setHtml('ddf-note', (ddfAnswerRevealed() && q.note) ? escAttr(q.note) : '');

  ddfRenderMediaBar();
  ddfRenderVoteGrid();
  ddfRenderControls();
}

function ddfRenderControls(){
  const box = document.getElementById('ddf-controls');
  if (!box) return;
  if (ddfState.phase === 'question') {
    box.innerHTML = `
      <button class="btn btn-primary" onclick="ddfReveal()">Antwort zeigen</button>
      ${ddfState.roundTime ? `<button class="btn btn-secondary" onclick="ddfStartTimer()">Zeit starten</button>` : ''}
      <button class="btn btn-secondary" onclick="ddfQuit()">Beenden</button>`;
  } else if (ddfState.phase === 'answer') {
    box.innerHTML = `
      <button class="btn btn-primary" onclick="ddfBeginVote()">Zur Abstimmung</button>
      <button class="btn btn-secondary" onclick="ddfNext()">Frage überspringen</button>
      <button class="btn btn-secondary" onclick="ddfQuit()">Beenden</button>`;
  } else if (ddfState.phase === 'vote') {
    const { done, total } = ddfVoteProgress();
    box.innerHTML = `
      <button class="btn btn-primary" onclick="ddfEvaluateVote()">Auswerten${done < total ? ' (vorzeitig)' : ''}</button>
      <button class="btn btn-secondary" onclick="ddfQuit()">Beenden</button>`;
  } else if (ddfState.phase === 'runoffAnnounce') {
    box.innerHTML = `
      <button class="btn btn-primary" onclick="ddfStartRunoff()">🔁 Stichwahl starten</button>
      <button class="btn btn-secondary" onclick="ddfQuit()">Beenden</button>`;
  } else if (ddfState.phase === 'result') {
    box.innerHTML = `
      <button class="btn btn-primary" onclick="ddfAfterResult()">Weiter</button>
      <button class="btn btn-secondary" onclick="ddfQuit()">Beenden</button>`;
  } else {
    box.innerHTML = `<button class="btn btn-secondary" onclick="ddfQuit()">Beenden</button>`;
  }
}

function ddfRenderVoteGrid(){
  const grid = document.getElementById('ddf-vote-grid');
  if (!grid) return;
  const hint = t => `<div style="width:100%;text-align:center;color:#9a9a9a;font-size:.85rem;margin-bottom:6px;">${t}</div>`;

  if (ddfState.phase === 'vote') {
    const { done, total } = ddfVoteProgress();
    const cands = ddfCandidates();
    const guests = ddfGuestVoters();
    // Bewusst nur die Anzahl - wer wen gewählt hat, bleibt bis zum Schluss verborgen.
    grid.innerHTML =
      hint(ddfState.runoff ? '🔁 Stichwahl läuft — auf den Handys abstimmen' : 'Abstimmung läuft — auf den Handys abstimmen') +
      `<div style="width:100%;text-align:center;font-size:1.6rem;font-weight:800;margin-bottom:8px;">
         ${done} / ${total} <span style="font-size:.9rem;font-weight:600;color:#9a9a9a;">Stimmen</span>
       </div>` +
      (guests.length ? hint('Gäste ohne Handy — Stimme eintragen:') +
        guests.map(g => {
          const chosen = ddfState.hostVotes[g.uid];
          return `<div style="width:100%;display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:6px;">
            <span style="min-width:110px;text-align:right;font-size:.8rem;color:#9a9a9a;">${escAttr(g.label)} →</span>
            ${cands.map(c =>
              `<button class="btn ${chosen === c.uid ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px;font-size:.7rem;"
                onclick="ddfHostVote(${escJsArg(g.uid)}, ${escJsArg(c.uid)})">${escAttr(c.label)}</button>`
            ).join('')}
          </div>`;
        }).join('') : '');
    return;
  }

  if (ddfState.phase === 'runoffAnnounce') {
    grid.innerHTML = hint('Gleichstand zwischen: <b>' +
      (ddfState.tied || []).map(u => escAttr(ddfNameOf(u))).join('</b>, <b>') + '</b>');
    return;
  }

  if (ddfState.phase === 'tiebreak') {
    grid.innerHTML = hint('Auch die Stichwahl endet gleich — du entscheidest:') +
      (ddfState.tied || []).map(u =>
        `<button class="btn btn-danger ddf-vote-btn" onclick="ddfVoteOut(${escJsArg(u)})">${escAttr(ddfNameOf(u))}</button>`
      ).join('');
    return;
  }

  if (ddfState.phase === 'result') {
    const c = ddfState.lastCounts || {};
    const rows = Object.keys(c).sort((a,b) => c[b]-c[a])
      .map(u => `<div style="display:flex;gap:10px;align-items:center;justify-content:center;font-size:1rem;${u===ddfState.loser?'font-weight:800;color:#e23b3b;':''}">
          <span style="min-width:140px;text-align:right;">${escAttr(ddfNameOf(u))}</span>
          <span style="min-width:40px;text-align:left;">${c[u]}</span>
        </div>`).join('');
    grid.innerHTML = hint('Ergebnis — wer wen gewählt hat, bleibt geheim') +
      `<div style="width:100%;">${rows}</div>` +
      hint(`<b>${escAttr(ddfNameOf(ddfState.loser))}</b> verliert ein Herz.`);
    return;
  }

  grid.innerHTML = '';
}

// Host trägt die Stimme eines Gastes ohne Handy ein. Bewusst getrennt von
// ddfState.votes: dort spiegelt Firebase die Handy-Stimmen herein und würde
// eingetragene Gast-Stimmen bei jeder Aktualisierung wieder wegwerfen.
function ddfHostVote(voterKey, candKey){
  ddfState.hostVotes = ddfState.hostVotes || {};
  ddfState.hostVotes[voterKey] = candKey;
  ddfRenderRound();
}

/* ── Ablauf ────────────────────────────────────────────────────────────── */

function ddfReveal(){ ddfStopTimer(); ddfState.phase = 'answer'; ddfRenderRound(); }

/* ── Abstimmung über die Handys ──────────────────────────────────────────
   Läuft über buzzer/ddfvote, nach demselben Muster wie die Schätzfrage:
   der Host öffnet die Runde, die Handys schreiben ihre Stimme, der Host
   wertet aus. Während der Abstimmung sieht niemand mehr als die Anzahl der
   abgegebenen Stimmen; am Ende zeigt der Host die Stimmenzahl pro Spieler,
   aber nie, wer wen gewählt hat.
   ──────────────────────────────────────────────────────────────────────── */

let ddfVoteRound = 0;

const ddfVotes = makeRoundChannel('buzzer/ddfvote', 'votes', votes => {
  ddfState.votes = votes;
  if (ddfState.phase === 'vote') ddfRenderRound();
});

// candidates: wer gewählt werden kann. voters: wer abstimmen darf.
// Beides sind die noch lebenden Spieler - Selbstvotum ist erlaubt.
function ddfBeginVote(candidates){
  const alive = ddfAlive();
  const cands = candidates || alive;
  ddfState.phase = 'vote';
  ddfState.votes = {};
  ddfState.hostVotes = {};
  ddfState.runoff = candidates ? cands.map(p => p.uid) : null;
  ddfVoteRound = nextRoundId(ddfVoteRound);

  ddfVotes.detach();
  const ref = ddfVotes.open();
  if (ref) {
    ref.set({
      active: true,
      round: ddfVoteRound,
      // key ist die uid: das Handy schickt sie unverändert zurück.
      candidates: cands.map(p => ({ key: p.uid, name: p.label, avatar: p.avatar || null, color: p.color || null })),
      voters: alive.filter(p => p.key).map(p => p.key),
      votes: null,
    }).then(() => ddfVotes.attach()).catch(()=>{});
  }
  ddfRenderRound();
}

function ddfCloseVote(){
  ddfVotes.detach();
  if (ddfVotes.ref) ddfVotes.ref.update({ active: false }).catch(()=>{});
}

// Abstimmen dürfen alle noch lebenden Spieler. Wer einen Account hat, stimmt
// per Handy ab; für Gäste ohne Account trägt der Host ein.
function ddfPhoneVoters(){ return ddfAlive().filter(p => p.key); }
function ddfGuestVoters(){ return ddfAlive().filter(p => !p.key); }

// Wer gewählt werden kann - in der Stichwahl nur die Gleichstand-Kandidaten.
function ddfCandidates(){
  const alive = ddfAlive();
  return ddfState.runoff ? alive.filter(p => ddfState.runoff.includes(p.uid)) : alive;
}

// Handy-Stimmen und vom Host eingetragene Gast-Stimmen zusammengeführt, in
// beiden Fällen nach uid des Wählers. Stimmen von Ausgeschiedenen fallen raus.
// Handys schreiben unter ihrem Account-Key - der ist für Accounts die uid.
function ddfAllVotes(){
  const out = {};
  const phones = new Set(ddfPhoneVoters().map(p => p.uid));
  Object.keys(ddfState.votes || {}).forEach(k => { if (phones.has(k)) out[k] = ddfState.votes[k]; });
  const guests = new Set(ddfGuestVoters().map(p => p.uid));
  Object.keys(ddfState.hostVotes || {}).forEach(k => { if (guests.has(k)) out[k] = ddfState.hostVotes[k]; });
  return out;
}

function ddfVoteProgress(){
  return { done: Object.keys(ddfAllVotes()).length, total: ddfAlive().length };
}

// { uid: Stimmen } - nur für die aktuell wählbaren Kandidaten.
function ddfVoteCounts(){
  const counts = {};
  ddfCandidates().forEach(p => counts[p.uid] = 0);
  Object.values(ddfAllVotes()).forEach(uid => {
    if (counts[uid] !== undefined) counts[uid]++;
  });
  return counts;
}

// Auswerten: Höchstzahl gewinnt (bzw. verliert). Bei Gleichstand Stichwahl
// zwischen den Betroffenen; steht es dann wieder gleich, entscheidet der Host.
function ddfEvaluateVote(){
  const counts = ddfVoteCounts();
  const max = Math.max(...Object.values(counts), 0);
  const top = Object.keys(counts).filter(u => counts[u] === max);

  // Erst prüfen, dann schließen: sonst wäre die Abstimmung auf den Handys zu,
  // während der Host noch in der Vote-Phase feststeckt.
  if (max === 0) { alert('Es wurde noch keine Stimme abgegeben.'); return; }

  ddfState.lastCounts = counts;
  ddfCloseVote();

  if (top.length > 1) {
    if (ddfState.runoff) {
      // Stichwahl schon gelaufen und immer noch gleich - der Host löst auf.
      ddfState.phase = 'tiebreak';
      ddfState.tied = top;
      ddfRenderRound();
      return;
    }
    ddfState.phase = 'runoffAnnounce';
    ddfState.tied = top;
    ddfRenderRound();
    return;
  }

  ddfApplyLoss(top[0]);
}

function ddfApplyLoss(uid){
  const p = ddfByUid(uid);
  if (!p || p.out) return;
  p.lives--;
  if (p.lives <= 0) { p.lives = 0; p.out = true; }
  ddfState.phase = 'result';
  ddfState.loser = p.uid;
  ddfRenderRound();   // hebt den Verlierer über ddfRenderPlayers(loser) hervor
}
// Manuelle Auswahl - für Gäste ohne Handy und als Notausgang des Hosts.
function ddfVoteOut(uid){ ddfCloseVote(); ddfApplyLoss(uid); }

function ddfStartRunoff(){
  const tied = ddfState.tied || [];
  ddfBeginVote(ddfAlive().filter(p => tied.includes(p.uid)));
}

function ddfAfterResult(){
  if (ddfAlive().length <= 1) { ddfFinish(); return; }
  ddfNext();
}

function ddfNext(){
  ddfStopTimer();
  ddfCloseVote();
  activeMediaSlot = null; renderMediaOverlay(null);
  ddfState.votes = {}; ddfState.hostVotes = {}; ddfState.runoff = null; ddfState.tied = null;
  ddfState.lastCounts = null; ddfState.loser = null;
  const lastQ = ddfState.order[ddfState.idx];
  ddfState.idx++;
  ddfState.phase = 'question';
  ddfState.timeUp = false;
  if (ddfState.idx >= ddfState.order.length) {
    // Fragen alle - von vorn, sonst endet das Spiel vor dem letzten Spieler.
    ddfState.order = ddfShuffledOrder(lastQ);
    ddfState.idx = 0;
  }
  ddfRenderRound();
}

function ddfStartTimer(){ startRoundClock(ddfState, 'ddf-timer'); }
function ddfStopTimer(){ stopRoundClock(ddfState, 'ddf-timer'); }

function ddfFinish(){
  ddfStopTimer();
  ddfCloseVote();
  activeMediaSlot = null; renderMediaOverlay(null);
  ddfState.phase = 'done';
  ddfState.active = false;
  ddfState.timeUp = false;
  const winner = ddfAlive()[0];
  ddfRenderPlayers(winner ? winner.uid : null);
  // Direkt leeren: ddfStopTimer() lässt ein "Zeit um!" bewusst stehen, auf dem
  // Siegerbild hat es nichts zu suchen.
  setText('ddf-timer', '');
  setHtml('ddf-question', winner ? `🏆 ${escAttr(winner.name)} gewinnt!` : 'Spiel beendet');
  showEl('ddf-answer', false);
  setHtml('ddf-note', '');
  setHtml('ddf-media-bar', '');
  setHtml('ddf-vote-grid', '');
  setHtml('ddf-controls', `
    <button class="btn btn-primary" onclick="showScreen('ddf-setup-screen')">Nochmal</button>
    <button class="btn btn-secondary" onclick="showScreen('menu-screen')">Zum Menü</button>`);
}

function ddfQuit(){
  ddfStopTimer();
  ddfCloseVote();
  activeMediaSlot = null; renderMediaOverlay(null);
  ddfState.active = false;
  showScreen('menu-screen');
}

/* ── Editor ────────────────────────────────────────────────────────────── */

// Optik bewusst wie im Jeopardy-Editor: goldene Nummer, Frage und Antwort in
// einer Zeile (2:1), kleine graue Sektionslabels, gold getöntes Notizfeld.
// Schnelle Massen-Erfassung: Frage + Antwort sind immer direkt tippbar,
// Tab springt Frage→Antwort→nächste Zeile, Enter legt eine neue Frage an.
// Bilder/Notiz stecken hinter dem ▸-Ausklapper (bei DDF selten gebraucht).
function renderDdfEditor(){
  const box = document.getElementById('ddf-editor');
  if (!box) return;

  // min-width:0 ist hier entscheidend: ein Flex-Element bekommt sonst
  // min-width:auto und darf nicht unter seine Eigenbreite schrumpfen.
  const fieldCss = 'min-width:0;box-sizing:border-box;padding:8px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.85rem;outline:none;';
  const noteCss  = 'width:100%;box-sizing:border-box;margin-top:8px;padding:7px 10px;border-radius:6px;border:1px solid rgba(255,210,63,.25);background:rgba(255,210,63,.05);color:#fff;font-family:inherit;font-size:.82rem;outline:none;';
  const sectCss  = 'display:block;font-size:.65rem;color:rgba(255,255,255,.4);margin:0 0 4px;';
  const n = ddfData.questions.length;

  const toolbar = `<div class="editor-toolbar">
    <span class="ddf-card-head" style="margin:0;">${n} ${n === 1 ? 'Frage' : 'Fragen'}</span>
    <button class="btn btn-secondary btn-xs" onclick="ddfToggleBulk()">${ddfBulkVisible ? '✕ Abbrechen' : '⇊ Mehrere einfügen'}</button>
  </div>`;

  const bulk = ddfBulkVisible ? bulkPanelHtml({
    id: 'ddf-bulk-text',
    label: 'Eine Frage pro Zeile · Frage und Antwort mit „#" (Vorrang), „/", „|", Tabulator oder „;" trennen (Antwort optional).',
    placeholder: 'Welches Tier kann nicht rückwärts laufen? / Das Känguru&#10;Wie viele Streifen hat die US-Flagge? / 13&#10;Frage ganz ohne Antwort',
    onAdd: 'ddfBulkAdd()',
  }) : '';

  const rows = ddfData.questions.map((q,i) => {
    const isOpen = ddfEditOpen === i;
    const imgCount = (q.qMedia||[]).filter(Boolean).length + (q.aMedia||[]).filter(Boolean).length;
    const hasExtra = imgCount || (q.note && q.note.trim());
    const row = `<div style="display:flex;align-items:center;gap:7px;padding:5px 8px;background:#141A3D;border:1px solid ${isOpen?'rgba(255,210,63,.4)':'rgba(255,255,255,.07)'};border-radius:8px;${isOpen?'border-bottom-left-radius:0;border-bottom-right-radius:0;':''}">
      <span style="color:#FFD23F;font-weight:700;font-size:.72rem;width:26px;text-align:right;flex-shrink:0;">${i+1}.</span>
      <input id="ddf-q-${i}" type="text" value="${escAttr(q.q)}" placeholder="Frage / Aufgabe" style="flex:3 1 0;${fieldCss}" oninput="ddfData.questions[${i}].q=this.value;ddfSave()">
      <input type="text" value="${escAttr(q.answer)}" placeholder="Antwort" style="flex:2 1 0;${fieldCss}" oninput="ddfData.questions[${i}].answer=this.value;ddfSave()" onkeydown="ddfAnswerKey(event,${i})">
      <button tabindex="-1" onclick="ddfToggleOpen(${i})" title="Bilder &amp; Notiz" style="flex-shrink:0;background:none;border:none;cursor:pointer;color:${hasExtra?'#FFD23F':'#6C74A8'};font-size:.85rem;padding:2px 4px;display:inline-flex;align-items:center;gap:2px;">${isOpen?'▾':'▸'}<span style="font-size:.6rem;">${imgCount?('🖼'+imgCount):(q.note&&q.note.trim()?'📝':'')}</span></button>
      <button tabindex="-1" class="btn btn-danger" style="padding:5px 9px;font-size:.68rem;flex-shrink:0;" onclick="ddfDeleteQuestion(${i})" title="Löschen">🗑</button>
    </div>`;
    const body = isOpen ? `<div style="padding:12px;background:#0F1436;border:1px solid rgba(255,210,63,.25);border-top:none;border-radius:0 0 8px 8px;">
      <label style="${sectCss}">🖼 Bilder zur Frage (max. ${DDF_MAX_MEDIA})</label>
      ${mediaSlotsHtml(q.qMedia||[], (s,expr) => `ddfSetMedia(${i},'qMedia',${s},${expr})`, DDF_MAX_MEDIA)}
      <label style="${sectCss}">🖼 Bilder zur Antwort (max. ${DDF_MAX_MEDIA})</label>
      ${mediaSlotsHtml(q.aMedia||[], (s,expr) => `ddfSetMedia(${i},'aMedia',${s},${expr})`, DDF_MAX_MEDIA)}
      <input type="text" value="${escAttr(q.note||'')}" placeholder="📝 Notiz für den Host" style="${noteCss}" oninput="ddfData.questions[${i}].note=this.value;ddfSave()">
    </div>` : '';
    return `<div style="margin-bottom:5px;">${row}${body}</div>`;
  }).join('');

  box.innerHTML = toolbar + bulk + (n
    ? rows + `<button class="btn btn-secondary" style="width:100%;margin-top:6px;padding:9px;font-size:.75rem;" onclick="ddfAddQuestion()">+ Frage</button>`
    : `<div class="ddf-card" style="text-align:center;color:rgba(255,255,255,.4);font-size:.85rem;">
         Noch keine Fragen — „⇊ Mehrere einfügen", „+ Frage" oder JSON importieren.
       </div>`);
}
let ddfEditOpen = -1;
function ddfToggleOpen(i){ ddfEditOpen = (ddfEditOpen === i ? -1 : i); renderDdfEditor(); }

let ddfBulkVisible = false;
function ddfToggleBulk(){
  ddfBulkVisible = !ddfBulkVisible;
  renderDdfEditor();
  if (ddfBulkVisible) { const t = document.getElementById('ddf-bulk-text'); if (t) t.focus(); }
}
// Massen-Import: eine Zeile pro Frage, "Frage # Antwort" (auch /, |, Tab oder ;
// als Trenner; Antwort optional). "#" hat Vorrang vor "/"; sonst wird am ersten
// Trennzeichen getrennt, damit ein "/" in der Antwort (z.B. "km/h") heil bleibt.
// Ans Ende angehängt.
function ddfBulkAdd(){
  const lines = bulkLines('ddf-bulk-text');
  if (!lines) return;
  let added = 0;
  lines.forEach(line => {
    const { left: q, right: answer } = splitBulkLine(line);
    if (!q) return;
    ddfData.questions.push({ q, answer, note:'', qMedia:[], aMedia:[] });
    added++;
  });
  if (!added) { alert('Keine Zeilen erkannt.\nFormat: Frage | Antwort (eine pro Zeile)'); return; }
  const bulkBox = fieldEl('ddf-bulk-text');
  if (bulkBox) bulkBox.value = '';
  ddfBulkVisible = false;
  ddfSave(); renderDdfEditor();
}
// Enter im Antwort-Feld: in der letzten Zeile neue Frage anlegen, sonst zur
// nächsten Frage springen - so tippt man Fragen zügig durch.
function ddfAnswerKey(e, i){
  if (e.key !== 'Enter') return;
  e.preventDefault();
  if (i >= ddfData.questions.length - 1) { ddfAddQuestion(); }
  else { const nx = document.getElementById('ddf-q-' + (i+1)); if (nx) nx.focus(); }
}

function ddfSetMedia(qi, which, slot, input){
  const q = ddfData.questions[qi];
  if (!q) return;
  if (!Array.isArray(q[which])) q[which] = [];
  setMediaSlot(q[which], slot, input, () => { ddfSave(); renderDdfEditor(); });
}

function ddfAddQuestion(){
  ddfData.questions.push({ q:'', answer:'', note:'', qMedia:[], aMedia:[] });
  ddfSave(); renderDdfEditor();
  const el = document.getElementById('ddf-q-' + (ddfData.questions.length - 1));
  if (el) el.focus();
}
function ddfDeleteQuestion(i){
  if (!confirm('Frage löschen?')) return;
  ddfData.questions.splice(i,1); ddfSave(); renderDdfEditor();
}

/* ── Import / Export ───────────────────────────────────────────────────── */

function exportDdf(){ downloadJSON(ddfData, 'der-duemmste-fliegt.json'); }
function importDdf(e){
  readJsonFile(e, d => {
    const list = Array.isArray(d.questions) ? d.questions : (Array.isArray(d) ? d : null);
    if (!list) throw new Error('Datei braucht ein Array "questions"');
    ddfData = {
      questions: list.map(x => ({
        q: x.q || x.question || x.frage || '',
        answer: x.answer || x.a || x.antwort || '',
        note: x.note || x.notiz || '',
        qMedia: (x.qMedia || x.questionMedia || []).slice(0, DDF_MAX_MEDIA),
        aMedia: (x.aMedia || x.answerMedia || []).slice(0, DDF_MAX_MEDIA),
      }))
    };
    renderDdfEditor(); ddfSave();
  });
}

function ddfSave(){ storeSetJson('ddfData', ddfData); }
function ddfLoad(){ ddfData = storeGetJson('ddfData', ddfData); }
ddfLoad();

// Herzen und Rundenzeit bleiben pro Gerät gemerkt - sonst muss der Host sie
// vor jeder Show neu eintippen.
function ddfSaveSettings(){
  storeSetJson('ddfSettings', { lives: ddfState.maxLives, time: ddfState.roundTime });
}
function ddfLoadSettings(){
  const s = storeGetJson('ddfSettings');
  if (!s) return;
  const lives = fieldEl('ddf-lives');
  const time  = fieldEl('ddf-time');
  if (lives && s.lives != null) lives.value = String(s.lives);
  if (time  && s.time  != null) time.value  = String(s.time);
}

