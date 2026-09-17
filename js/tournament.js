// @ts-check
/* Turnier: mehrtaegige Gameshow mit gleichen Teams und gewichteten Spielen.

   Herausgeloest aus index.html (Zeilen 3269-3553). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
// Gespeichert wird alles in Firebase unter 'tournament', damit es über mehrere
// Geräte und Tage hinweg synchron bleibt (localStorage nur als Offline-Fallback).
let tournament = null; // { name, teams:[..], games:[{game, weight, date, scores:[..], done}] }
let tournamentRef = null;

function tournamentConnect(){
  if (tournamentRef || !window.firebase) return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    tournamentRef = firebase.database().ref('tournament');
    tournamentRef.on('value', (snap) => {
      tournament = snap.val() || null;
      if (tournament && !Array.isArray(tournament.games)) tournament.games = [];
      storeSetJson('tournamentCache', tournament);
      if (document.getElementById('tournament-screen').classList.contains('active')) renderTournament();
    });
  } catch {}
}
function loadTournament(){
  tournament = storeGetJson('tournamentCache', null);
  tournamentConnect();
}
function saveTournament(){
  storeSetJson('tournamentCache', tournament);
  if (tournamentRef) tournamentRef.set(tournament).catch(()=>{});
  renderTournament();
  if (gamemasterWin && !gamemasterWin.closed) updateGamemaster();
}

// Welche Turnierspiele die App selbst starten kann (führt direkt in den
// jeweiligen Setup-/Lobby-Screen), und welches Icon dafür in der Übersicht steht.
const TOURNAMENT_STARTABLE = { 'Family Feud': 'setup-screen', 'Jeopardy': 'jeopardy-setup-screen', 'Wer wird Millionär': 'wwm-setup-screen' };
// Nutzt die echten, handgezeichneten Logos (STAR_SVG/DANGER_SVG) statt
// generischer Emoji - jede Einbindung braucht aber eine eigene Gradient-ID,
// sonst kollidieren mehrere Zeilen im Spielplan auf dieselbe id="sg"/"dg".
function tournamentGameIcon(name, uid){
  if (name === 'Family Feud') return `<span class="tour-icon-svg">${STAR_SVG.replace('id="sg"', `id="sg-t${uid}"`).replace('url(#sg)', `url(#sg-t${uid})`)}</span>`;
  if (name === 'Jeopardy') return `<span class="tour-icon-svg">${DANGER_SVG.replace('id="dg"', `id="dg-t${uid}"`).replace('url(#dg)', `url(#dg-t${uid})`)}</span>`;
  if (name === 'Wer wird Millionär') return '💰';
  return '🎮';
}
// Wenn gesetzt: dieses Spiel läuft gerade als Teil des Turniers (über "Spiel
// starten" im Spielplan gestartet) - beim Spielende wird sein Ergebnis
// automatisch in dieses Spielplan-Feld eingetragen, keine manuelle Eingabe nötig.
let activeTournamentGameIndex = null;
// Deckt ein geheimes Spiel vorzeitig auf - vom GM-Panel aus bedienbar, während
// die Turnierübersicht (für die Zuschauer) offen ist.
function tournamentRevealSecret(i){
  if (!tournament || !tournament.games[i]) return;
  tournament.games[i].secret = false;
  saveTournament(); // rendert Turnierübersicht + GM-Panel neu
}
function tournamentStartGame(i){
  if (!tournament || !tournament.games[i]) return;
  const g = tournament.games[i];
  const screen = TOURNAMENT_STARTABLE[g.game];
  if (!screen) { alert('Dieser Spieltyp kann nicht automatisch gestartet werden - bitte manuell spielen und "Ergebnis eintragen" nutzen.'); return; }
  activeTournamentGameIndex = i;
  showScreen(screen);
}
// Trägt (falls über "Spiel starten" aktiv) das gerade beendete Spiel automatisch
// ins Turnier ein - per Namensabgleich, sonst per Index/Reihenfolge. Gibt zurück
// ob tatsächlich automatisch eingetragen wurde (steuert die Buttons auf dem
// Ergebnis-Bildschirm).
function tournamentAutoRecordIfActive(gameTeamNames, gameScores){
  if (activeTournamentGameIndex === null || !tournament) return false;
  const gi = activeTournamentGameIndex;
  activeTournamentGameIndex = null;
  const g = tournament.games[gi];
  if (!g) return false;
  const sameLength = gameTeamNames.length === tournament.teams.length;
  g.scores = tournament.teams.map((t, ti) => {
    const byName = gameTeamNames.findIndex(n => n.trim().toLowerCase() === t.trim().toLowerCase());
    if (byName >= 0) return Number(gameScores[byName]) || 0;
    return sameLength ? (Number(gameScores[ti]) || 0) : 0;
  });
  g.done = true;
  saveTournament();
  return true;
}
function tournamentCreate(){
  const name = fieldVal('tour-name').trim() || 'Keller-Turnier';
  const teams = [1,2,3].map(i => fieldVal('tour-team'+i).trim()).filter(Boolean);
  if (teams.length < 2) return alert('Mindestens 2 Teams eingeben!');
  tournament = { name, teams, games: [], created: Date.now() };
  saveTournament();
}
// Standard-Gewichtung pro Spieltyp - wird beim Auswählen automatisch ins
// Gewichtungsfeld übernommen (kann vor dem Hinzufügen noch manuell geändert werden).
const TOURNAMENT_DEFAULT_WEIGHTS = { 'Family Feud': 1, 'Jeopardy': 2, 'Wer wird Millionär': 1, 'Wer weiß denn sowas': 1, 'Der Dümmste fliegt': 1, 'Sonstiges': 1 };
function tournamentGameTypeChanged(){
  const type = fieldVal('tour-game-type');
  fieldSet('tour-game-weight', TOURNAMENT_DEFAULT_WEIGHTS[type] || 1);
}
function tournamentAddGame(){
  const game = fieldVal('tour-game-type');
  const weight = Math.max(1, parseInt(fieldVal('tour-game-weight')) || 1);
  const date = fieldVal('tour-game-date').trim();
  const secret = fieldChecked('tour-game-secret');
  tournament.games.push({ game, weight, date, scores: null, done: false, secret });
  saveTournament();
}
function tournamentRemoveGame(i){
  if (!confirm('Dieses Spiel aus dem Turnier entfernen?')) return;
  tournament.games.splice(i, 1);
  saveTournament();
}
function tournamentDelete(){
  if (!confirm('Turnier wirklich komplett löschen? Alle Ergebnisse gehen verloren.')) return;
  tournament = null;
  storeRemove('tournamentCache');
  if (tournamentRef) tournamentRef.remove().catch(()=>{});
  renderTournament();
}
function tournamentEnterResult(i){
  const g = tournament.games[i];
  const scores = [];
  for (const t of tournament.teams){
    const v = prompt(`Punkte für "${t}" in ${g.game}:`, '0');
    if (v === null) return; // abgebrochen
    scores.push(Number(v) || 0);
  }
  g.scores = scores; g.done = true;
  saveTournament();
}

// Turnierpunkte pro Spiel: Platz 1 bekommt weight × Teamanzahl Punkte, Platz 2 eins
// weniger usw. Bei Punktgleichheit teilen sich Teams den besseren Rang.
function tournamentGamePoints(g, teamCount){
  if (!g.done || !g.scores) return new Array(teamCount).fill(0);
  // Gewichtung absichern: ein Turnier, das noch aus der Zeit vor den
  // Gewichten im Speicher liegt, hat kein weight - die Multiplikation
  // ergäbe NaN und die gesamte Tabelle zeigte NaN statt Punkten.
  const weight = Number(g.weight) || 1;
  // Nur so viele Ergebnisse berücksichtigen, wie es Teams gibt. Sonst schreibt
  // ein Spiel mit mehr Ergebnissen als Teams über das Punktefeld hinaus.
  const ranked = g.scores.slice(0, teamCount)
    .map((s, i) => ({ s: Number(s) || 0, i }))
    .sort((a, b) => b.s - a.s);
  const pts = new Array(teamCount).fill(0);
  let rank = 0;
  for (let k = 0; k < ranked.length; k++){
    if (k > 0 && ranked[k].s < ranked[k-1].s) rank = k;
    pts[ranked[k].i] = (teamCount - rank) * weight;
  }
  return pts;
}
function tournamentTotals(){
  const totals = new Array(tournament.teams.length).fill(0);
  tournament.games.forEach(g => {
    tournamentGamePoints(g, tournament.teams.length).forEach((p, i) => totals[i] += p);
  });
  return totals;
}

function renderTournament(){
  const el = document.getElementById('tournament-content');
  if (!el) return;
  if (!tournament){
    // Setup-Formular: neues Turnier anlegen
    el.innerHTML = `
      <div class="editor-card">
        <label>Turniername</label>
        <input type="text" id="tour-name" placeholder="z.B. Die große Keller Gameshow 2026">
        <label>Teams (feste Teams für alle Tage, min. 2)</label>
        <input type="text" id="tour-team1" placeholder="Team 1">
        <input type="text" id="tour-team2" placeholder="Team 2">
        <input type="text" id="tour-team3" placeholder="Team 3 (optional)">
        <div class="editor-actions">
          <button class="btn btn-primary" onclick="tournamentCreate()">Turnier anlegen</button>
        </div>
      </div>`;
    return;
  }
  const totals = tournamentTotals();
  const maxT = Math.max(...totals, 1);
  const order = totals.map((t, i) => ({ t, i })).sort((a, b) => b.t - a.t);
  const medals = ['🥇','🥈','🥉'];
  const standings = order.map((o, rank) => `
    <div class="q-list-item" style="${rank===0 && o.t>0 ? 'border-color:rgba(255,210,63,.35);background:rgba(255,210,63,.06);' : ''}">
      <span class="q-label"><span class="q-num">${medals[rank]||rank+1+'.'}</span><strong>${tournament.teams[o.i]}</strong></span>
      <div style="display:flex;align-items:center;gap:12px;flex:1;max-width:50%;">
        <div style="flex:1;height:10px;background:rgba(255,255,255,.06);border-radius:5px;overflow:hidden;">
          <div style="width:${Math.round(o.t/maxT*100)}%;height:100%;background:linear-gradient(90deg,#FFD23F,#F0B800);border-radius:5px;transition:width .5s;"></div>
        </div>
        <span style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:#FFD23F;min-width:36px;text-align:right;">${o.t}</span>
      </div>
    </div>`).join('');

  const gamesHtml = tournament.games.map((g, i) => {
    const pts = tournamentGamePoints(g, tournament.teams.length);
    const hidden = g.secret && !g.done;
    const icon = hidden ? '❓' : tournamentGameIcon(g.game, i);
    const label = hidden ? '???' : g.game;
    const result = g.done
      ? tournament.teams.map((t, ti) => `${t}: ${g.scores[ti]} <span style="color:#FFD23F;">(+${pts[ti]})</span>`).join(' · ')
      : '<span style="color:rgba(255,255,255,.35);">Noch nicht gespielt</span>';
    const canAutoStart = !hidden && !g.done && TOURNAMENT_STARTABLE[g.game];
    return `
      <div class="q-list-item" style="flex-wrap:wrap;gap:6px;">
        <span class="q-label"><span class="q-num">${i+1}.</span><span style="margin-right:2px;">${icon}</span><strong>${label}</strong>${(!hidden && g.date) ? `<span class="q-meta">${g.date}</span>` : ''}<span class="q-meta" style="color:#FFD23F;">Gewichtung ×${g.weight}</span></span>
        <div class="q-btns">
          ${canAutoStart ? `<button class="btn btn-accent" onclick="tournamentStartGame(${i})">▶ Spiel starten</button>` : ''}
          <button class="btn btn-secondary" onclick="tournamentEnterResult(${i})">${g.done ? 'Ergebnis ändern' : 'Ergebnis eintragen'}</button>
          <button class="btn btn-danger" onclick="tournamentRemoveGame(${i})">Del</button>
        </div>
        <div style="width:100%;font-size:.78rem;color:rgba(255,255,255,.6);">${result}</div>
      </div>`;
  }).join('') || `<div class="q-list-item" style="justify-content:center;color:rgba(255,255,255,.35);">Noch keine Spiele geplant.</div>`;

  const allDone = tournament.games.length > 0 && tournament.games.every(g => g.done);
  el.innerHTML = `
    <div class="page-title" style="margin-bottom:10px;"><em>${tournament.name}</em></div>
    <div class="q-list" style="margin-bottom:20px;">${standings}</div>
    ${allDone ? `<div class="edit-bar" style="margin-bottom:20px;"><button class="btn btn-primary" onclick="tournamentCelebrate()">🏆 Sieger feiern!</button></div>` : ''}
    <div class="page-title" style="font-size:.9rem;margin-bottom:8px;">Spielplan</div>
    <div class="q-list" style="margin-bottom:14px;">${gamesHtml}</div>
    <div class="editor-card">
      <label>Spiel hinzufügen</label>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <select id="tour-game-type" onchange="tournamentGameTypeChanged()" style="flex:2;min-width:150px;padding:11px 14px;border-radius:8px;border:1.5px solid rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.95rem;font-weight:600;outline:none;">
          <option>Family Feud</option>
          <option>Jeopardy</option>
          <option>Wer wird Millionär</option>
          <option>Wer weiß denn sowas</option>
          <option>Der Dümmste fliegt</option>
          <option>Sonstiges</option>
        </select>
        <input type="number" id="tour-game-weight" value="${TOURNAMENT_DEFAULT_WEIGHTS['Family Feud']}" min="1" title="Gewichtung" style="flex:0 0 80px;margin-bottom:0;text-align:center;" placeholder="×">
        <input type="text" id="tour-game-date" placeholder="z.B. Freitag" style="flex:1;min-width:110px;margin-bottom:0;">
        <button class="btn btn-accent" onclick="tournamentAddGame()">+ Hinzufügen</button>
      </div>
      <label style="display:flex;align-items:center;gap:7px;font-size:.8rem;font-weight:600;color:rgba(255,255,255,.7);margin-top:10px;">
        <input type="checkbox" id="tour-game-secret" style="width:auto;margin:0;"> 🔒 Geheim halten (zeigt "???" im Spielplan, bis das Spiel gespielt wurde)
      </label>
      <div style="font-size:.7rem;color:rgba(255,255,255,.35);margin-top:8px;">Gewichtung = wie viel das Spiel zählt. Platz 1 bekommt (Teamanzahl × Gewichtung) Turnierpunkte, Platz 2 entsprechend weniger.</div>
    </div>
    <div class="edit-bar" style="margin-top:12px;">
      <button class="btn btn-danger" onclick="tournamentDelete()">Turnier löschen</button>
    </div>`;
}

function tournamentCelebrate(){
  const totals = tournamentTotals();
  const max = Math.max(...totals);
  const winners = tournament.teams.filter((_, i) => totals[i] === max);
  document.getElementById('winner-text').textContent = winners.length > 1
    ? 'Unentschieden im Turnier!'
    : `${winners[0]} gewinnt das Turnier! 🏆`;
  document.getElementById('final-scores').innerHTML = tournament.teams
    .map((t, i) => `${t}: <strong>${totals[i]}</strong> Turnierpunkte`).join('<br>');
  document.getElementById('tour-record-btn').style.display = 'none';
  showScreen('result-screen');
  confetti(true);
}

// Nach Spielende: passt das Ergebnis zu einem offenen Turnier-Spiel? Dann Button zeigen.
let pendingTournamentResult = null;
function offerTournamentResult(gameName, gameTeamNames, gameScores){
  const btn = document.getElementById('tour-record-btn');
  btn.style.display = 'none';
  pendingTournamentResult = null;
  if (!tournament) return;
  const gi = tournament.games.findIndex(g => !g.done && g.game === gameName);
  if (gi < 0) return;
  // Punkte den Turnier-Teams zuordnen: erst über Namensgleichheit, sonst über die Reihenfolge
  const scores = tournament.teams.map((t, i) => {
    const byName = gameTeamNames.findIndex(n => n.trim().toLowerCase() === t.trim().toLowerCase());
    const src = byName >= 0 ? byName : i;
    return Number(gameScores[src]) || 0;
  });
  pendingTournamentResult = { gi, scores };
  btn.style.display = '';
}
function tournamentRecordPending(){
  if (!pendingTournamentResult || !tournament) return;
  const { gi, scores } = pendingTournamentResult;
  tournament.games[gi].scores = scores;
  tournament.games[gi].done = true;
  saveTournament();
  pendingTournamentResult = null;
  document.getElementById('tour-record-btn').style.display = 'none';
  showScreen('tournament-screen');
}

