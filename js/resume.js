// @ts-check
/* Spielstand sichern und nach Neuladen/Absturz fortsetzen.

   Warum: bis 2026-10-10 lag der Stand einer laufenden Show nur im
   Arbeitsspeicher. Ein Neuladen, ein abgestuerzter Tab oder ein versehentlich
   geschlossenes Fenster mitten im Spieleabend - und Punkte, Runde, Leben waren
   weg. Gesichert wird jetzt nach jedem Schritt (updateGamemaster und
   showScreen rufen resumeSaveSoon), beim Laden der Seite steht im Menue
   "Laufendes Spiel fortsetzen?".

   Was NICHT mitkommt: laufende Timer, eine Raddrehung, und offene
   Handy-Runden (DDF-Abstimmung, PIH-Gebote, Jeopardy-Eingabe, TP-Dreh) -
   dort springt das Spiel auf den Schritt davor, der Host oeffnet neu. Die
   Eingaben der Handys aus der alten Runde gingen ohnehin mit der Verbindung
   verloren.

   Klassisches Skript wie alle anderen; laedt als letztes (nach tp.js), weil es
   die Funktionen aller Shows braucht. */

const RESUME_KEY = 'liveGame';
const RESUME_MAX_AGE_MS = 6 * 60 * 60 * 1000;   // aelter: kein Angebot mehr
/** @type {number|null} */
let resumeTimer = null;
let resumeTooBigWarned = false;
/* Waehrend des Wiederherstellens nicht gleich wieder sichern - der Stand ist
   in dem Moment halb gesetzt. */
let resumeRestoring = false;

/** Tiefe Kopie ohne die genannten Felder. @param {any} o @param {string[]} ohne */
function resumeCopy(o, ohne){
  /** @type {any} */
  const k = {};
  Object.keys(o).forEach(x => { if (ohne.indexOf(x) < 0) k[x] = o[x]; });
  return JSON.parse(JSON.stringify(k));
}

/** Welche Show laeuft gerade? '' wenn keine. */
function resumeCurrentShow(){
  if (jeopardyState.active) return 'jeopardy';
  if (wwmState.active) return 'wwm';
  if (wwdsState.active) return 'wwds';
  if (ddfState.active) return 'ddf';
  if (pihState.active) return 'pih';
  if (tpState.active) return 'tp';
  if (finaleState.active || feudTieChoice || screenActive('game-screen') || screenActive('finale-screen')) return 'feud';
  return '';
}

function resumeSaveSoon(){
  if (resumeRestoring) return;
  if (resumeTimer) clearTimeout(resumeTimer);
  resumeTimer = setTimeout(resumeSave, 400);
}

function resumeSave(){
  resumeTimer = null;
  if (resumeRestoring) return;
  const show = resumeCurrentShow();
  if (!show){
    /* Nur bei einem klaren Ende loeschen (Ergebnis, Menue, Setup). In
       Zwischensequenzen (schwarzer Uebergang, Overlays) steht oft kein Screen
       und kein Flag - dort bleibt der letzte Stand liegen. */
    const ende = ['result-screen', 'menu-screen'].some(screenActive)
      || !!document.querySelector('.screen.active[id$="-setup-screen"]');
    if (ende) storeRemove(RESUME_KEY);
    return;
  }
  /** @type {any} */
  const d = { v: 1, show, ts: Date.now(), turnier: activeTournamentGameIndex };
  if (show === 'feud'){
    d.state = resumeCopy(state, ['editingIndex', 'editingFinale', 'editingMedia']);
    d.finale = resumeCopy(finaleState, []);
    d.screen = screenActive('finale-screen') ? 'finale' : 'game';
    d.tie = feudTieChoice;
  }
  if (show === 'jeopardy'){ d.state = resumeCopy(jeopardyState, []); d.data = jeopardyData; }
  if (show === 'wwm') d.state = resumeCopy(wwmState, []);
  if (show === 'wwds') d.state = resumeCopy(wwdsState, ['timerInt']);
  if (show === 'ddf') d.state = resumeCopy(ddfState, ['timerInt']);
  if (show === 'pih') d.state = resumeCopy(pihState, ['timerInt']);
  if (show === 'tp') d.state = resumeCopy(tpState, ['spinning']);
  if (!storeSetJson(RESUME_KEY, d)){
    // Meist Jeopardy mit grossen Bildern: localStorage ist bei ~5 MB zu Ende.
    if (!resumeTooBigWarned){
      resumeTooBigWarned = true;
      alert('Der Spielstand ist zu groß zum Sichern (meist Bilder im Spiel). Nach einem Neuladen wäre er weg - das Spiel selbst läuft normal weiter.');
    }
  }
}

/** Das Angebot im Menue. */
function resumeOffer(){
  const box = document.getElementById('resume-banner');
  if (!box) return;
  const d = storeGetJson(RESUME_KEY, null);
  if (!d || d.v !== 1 || !d.show || !(Date.now() - d.ts < RESUME_MAX_AGE_MS)){
    box.innerHTML = '';
    return;
  }
  const namen = { feud:'Family Feud', jeopardy:'Jeopardy', wwm:'Wer wird Millionär', wwds:'Wer weiß denn sowas',
                  ddf:'Der Dümmste fliegt', pih:'Der Preis ist heiß', tp:'Trivial Pursuit' };
  const min = Math.max(1, Math.round((Date.now() - d.ts) / 60000));
  box.innerHTML = `<div class="resume-text">Laufendes Spiel: <b>${escapeHtml(namen[d.show] || d.show)}</b> · gesichert vor ${min} Min.</div>
    <button class="btn btn-primary" onclick="resumeGame()">▶ Fortsetzen</button>
    <button class="btn btn-secondary" onclick="resumeDiscard()">Verwerfen</button>`;
}
function resumeDiscard(){
  storeRemove(RESUME_KEY);
  resumeOffer();
}

/* Feud: Runde ohne loadRound() wieder aufbauen (das setzt den Stand zurueck). */
function resumeFeudRoundUi(){
  const q = state.roundQuestions[state.currentRound];
  setText('round-info', `Runde ${state.currentRound+1} / ${state.roundQuestions.length}`);
  const qEl = document.getElementById('question-display');
  if (qEl && q){
    qEl.classList.toggle('hidden-q', !state.questionRevealed);
    const inner = qEl.querySelector('.q-inner'); if (inner) inner.textContent = q.question;
  }
  updateScores(); updateRoundPts(); renderBoard(); updateStrikes(); updateActiveTeam();
}

/** @param {boolean} [ohneKlick] nach F5 automatisch: kein Beamerfenster
 *  oeffnen (ohne Nutzergeste blockt der Browser es) - ein noch offenes meldet
 *  sich selbst wieder an (boardReattach, mainscreen/index.html). */
function resumeGame(ohneKlick){
  const d = storeGetJson(RESUME_KEY, null);
  if (!d || d.v !== 1 || !d.show) return;
  resumeRestoring = true;
  try {
    // Der Klick ist die Nutzergeste - jetzt geht das Beamerfenster auf.
    if (!ohneKlick) openBoardPopout();
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay,.tut-overlay').forEach(e => e.remove());
    if (d.turnier !== undefined) activeTournamentGameIndex = d.turnier;
    const s = d.state || {};
    if (d.show === 'feud'){
      Object.assign(state, s);
      Object.assign(finaleState, d.finale || {});
      buildScoreboard();
      activeBuzzerContext = 'feud';
      feudBuzzConnect();
      /* Kein lockBuzzerJoins hier: die Sperre samt Namensliste steht seit dem
         Spielstart in Firebase. Gleich nach dem Verbinden ist die Presence-
         Liste noch leer - ein erneutes Sperren schrieb lockedNames: [] und
         sperrte damit jedes Handy aus (aufgefallen 2026-10-13, ablauf.js). */
      if (d.tie){
        feudTieChoice = d.tie;
        feudShowTieChoice();
      } else if (d.screen === 'finale' || finaleState.active){
        showScreen('finale-screen');
        if (finaleState.phase === 'reveal') loadRevealQuestion();
        else loadFinaleQuestion();
      } else {
        showScreen('game-screen');
        resumeFeudRoundUi();
        feudBuzzPrepare();   // live, nicht scharf - der Host arm't wie gewohnt
      }
    }
    if (d.show === 'jeopardy'){
      if (d.data && Array.isArray(d.data.boards)) jeopardyData = d.data;
      Object.assign(jeopardyState, s);
      jeopardyHistory = [];
      activeBuzzerContext = 'jeopardy';
      jeopardyBuzzConnect();
      jeopardyBuzzClose();
      showScreen('jeopardy-screen');
      renderJeopardyScores();
      renderJeopardyBoard();
      // Offene Frage bleibt offen; Buzzer/Eingabe oeffnet der Host neu
      // ("Buzzer neu" bzw. "Eingabe neu öffnen").
      if (jeopardyState.currentClue && !jeopardyState.ddPending) renderJeopardyClueOverlay();
    }
    if (d.show === 'wwm'){
      Object.assign(wwmState, s);
      showScreen('wwm-screen');
      renderWwm();
    }
    if (d.show === 'wwds'){
      Object.assign(wwdsState, s, { timerInt: null });
      activeBuzzerContext = 'wwds';
      feudBuzzConnect();
      showScreen('wwds-screen');
      renderWwds();
    }
    if (d.show === 'ddf'){
      Object.assign(ddfState, s, { timerInt: null });
      // Abstimmung lief: zurueck auf "Antwort steht", der Host startet neu.
      if (['vote', 'runoffAnnounce', 'tiebreak'].indexOf(ddfState.phase) >= 0){
        ddfState.phase = 'answer'; ddfState.votes = {}; ddfState.hostVotes = {};
        ddfState.runoff = null; ddfState.tied = null;
      }
      showScreen('ddf-screen');
      ddfRenderRound();
    }
    if (d.show === 'pih'){
      Object.assign(pihState, s, { timerInt: null });
      if (pihState.phase === 'bid'){ pihState.phase = 'show'; pihState.bids = {}; pihState.hostBids = {}; }
      showScreen('pih-screen');
      pihRenderRound();
    }
    if (d.show === 'tp'){
      Object.assign(tpState, s, { spinning: false });
      activeBuzzerContext = 'tp';
      feudBuzzConnect();
      showScreen('tp-screen');
      tpBuildWheel();
      // Rad ohne Drehung auf den gesicherten Winkel stellen.
      const rotor = document.getElementById('tp-wheel-rotor');
      if (rotor){
        rotor.style.transition = 'none';
        rotor.style.transform = `rotate(${tpState.angle}deg)`;
        void rotor.offsetWidth;
        rotor.style.transition = '';
      }
      tpRender();
      if (tpState.phase === 'steal') tpOpenSteal();   // Buzzer fuers Nachfassen wieder scharf
    }
    openGamemaster();
  } finally {
    resumeRestoring = false;
  }
  updateGamemaster();
}

/* Show beenden - aus dem GM-Panel, vom Handy-Gamepad und ueber den festen
   Knopf auf der Hostseite (Anweisung David, 2026-10-13: "ein Beenden-Button,
   der immer da ist"). Geht fuer jede Show und auch mitten im Intro: alles aus,
   Handys zurueck in die Lobby, gesicherter Stand weg, Menue.
   Rueckfrage macht der Knopf auf dem Geraet, auf dem gedrueckt wurde - hier
   nicht, sonst stuende ein Gamepad-Druck als Dialog auf dem Host-Rechner. */
function gmQuitShow(){
  const show = resumeCurrentShow();
  if (show === 'tp') tpQuit();
  else if (show === 'ddf') ddfQuit();
  else if (show === 'pih') pihQuit();
  if (show === 'wwds') wwdsStopTimer();
  try { jeopardyEstimateClose(); } catch {}
  try { jeopardyBuzzClose(); } catch {}
  try { feudBuzzEndRound(); } catch {}
  jeopardyState.active = false;
  wwmState.active = false;
  wwdsState.active = false;
  ddfState.active = false;
  pihState.active = false;
  tpState.active = false;
  finaleState.active = false;
  feudTieChoice = null;
  activeMediaSlot = null; renderMediaOverlay(null);
  document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay,.tut-overlay').forEach(e => e.remove());
  storeRemove(RESUME_KEY);
  // Beitrittssperre der beendeten Show loesen - sonst stehen Handys, die nicht
  // auf der Namensliste waren, bis zur naechsten Sitzung auf "gesperrt".
  try { firebase.database().ref('buzzer').update({ joinLocked: false, lockedNames: null }).catch(() => {}); } catch {}
  if (typeof lobbyNeueShow === 'function') lobbyNeueShow();
  showScreen('menu-screen');
  updateGamemaster();
}
function hostQuitClick(){
  if (confirm('Show beenden und zurück ins Menü?')) gmQuitShow();
}
/* Der feste Knopf auf der Hostseite steht, solange eine Show laeuft - auch im
   Intro, wo noch kein Spiel-Flag gesetzt ist, aber Overlays stehen. Ein
   Intervall statt Haken an jeder Stelle, die eine Show startet oder beendet. */
setInterval(() => {
  const an = resumeCurrentShow() !== ''
    || !!document.querySelector('.intro-overlay,.black-backdrop,.welcome-overlay,.tut-overlay');
  showEl('host-quit', an);
}, 700);

/* Nach F5 (Neuladen) laeuft das Spiel ohne Rueckfrage weiter (David,
   2026-10-13). Das Angebot im Menue bleibt fuer alles andere: neuer Tab,
   Absturz, Browser neu gestartet. Erst nach 'load', damit nichts aus dem
   Seitenaufbau das wiederhergestellte Spiel gleich wieder ueberdeckt. */
(function(){
  /** @type {any} */
  const nav = performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
  const d = storeGetJson(RESUME_KEY, null);
  const frisch = !!d && d.v === 1 && !!d.show && Date.now() - d.ts < RESUME_MAX_AGE_MS;
  if (nav && nav.type === 'reload' && frisch){
    window.addEventListener('load', () => setTimeout(() => resumeGame(true), 0));
    return;
  }
  resumeOffer();
})();
