// @ts-check
/* Firebase, Buzzer, Lobby, Team-Verteilung, QR-Code und GM-Fernsteuerung.
   Wird von allen Spielen benutzt.

   Herausgeloest aus index.html (Zeilen 5718-6301). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
// ── JEOPARDY BUZZER ──
// Primär: Firebase (Handys über Internet). Fallback: lokaler Node-Server (SSE). Notfall: Tastatur.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBuXYp1w65nR8tqJIKFS_v_9QSD7_0kR20",
  authDomain: "keller-buzzer.firebaseapp.com",
  databaseURL: "https://keller-buzzer-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "keller-buzzer",
  storageBucket: "keller-buzzer.firebasestorage.app",
  messagingSenderId: "589064661958",
  appId: "1:589064661958:web:1c1024eab161ad8e53e0c7",
};
const BUZZER_URL = storeGet('buzzerUrl') || 'http://localhost:3777';
// Wo die Seite oeffentlich liegt. Wird nur gebraucht, wenn index.html lokal per
// Doppelklick geoeffnet wurde - dann gibt es kein location.origin, aus dem sich
// die Buzzer-Adresse fuer den QR-Code ableiten liesse.
const SITE_URL = 'https://iryogameshows.github.io';
const BUZZER_FALLBACK_URL = SITE_URL + '/buzzer';
let jeopardyBuzzer = {
  armed: false, start: 0, results: [], keys: ['a', 'l', 'b'],
  connected: false, joinUrl: '', es: null, mode: 'none', fbRef: null, round: 0,
  excluded: [],       // Namen, die für die aktuelle Frage gesperrt sind (falsch geantwortet)
  presenceRef: null, presence: [], // verbundene Handys (Firebase-Presence)
  hidden: false,      // manuell vom GM ausgeblendet
  poppedForQuestion: false, // true sobald der Erste bei der aktuellen Frage gebuzzert hat
};

function jeopardyBuzzInitFirebase(){
  if (jeopardyBuzzer.fbRef) return true;
  if (!window.firebase || !FIREBASE_CONFIG.databaseURL) return false;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    jeopardyBuzzer.fbRef = firebase.database().ref('buzzer');
    return true;
  } catch { return false; }
}

// ── LOBBY / TEAM-ZUTEILUNG (gemeinsam für Jeopardy- und Family-Feud-Buzzer) ──
// Sendet die aktuellen Teamnamen an alle verbundenen Handys, damit sie ihren
// zugeteilten Team-Namen/Farbe anzeigen können.
// Welcher Buzzer (Family Feud oder Jeopardy) gerade gemeint ist - explizit
// gesetzt beim Betreten der jeweiligen Setup- und Spiel-Screens. Verlässt
// sich NICHT auf jeopardyState.active, weil das auf den Setup-Screens vor
// dem eigentlichen Spielstart noch gar nicht gesetzt ist.
let activeBuzzerContext = 'feud';
function currentBuzzer(){ return activeBuzzerContext === 'jeopardy' ? jeopardyBuzzer : feudBuzzer; }

// Beim tatsächlichen Spielstart: alle bis dahin gejointen Namen einfrieren.
// Neue Namen können sich ab jetzt nicht mehr über /buzzer/ eintragen - nur
// wer schon in der Lobby war, darf (z.B. nach Reload) mit demselben Namen
// wieder reinkommen.
function lockBuzzerJoins(buzzer){
  if (!buzzer.fbRef) return;
  const names = buzzer.presence.map(p => p.name);
  buzzer.fbRef.update({ joinLocked: true, lockedNames: names }).catch(()=>{});
}

function buzzerBroadcastTeams(names){
  const ref = currentBuzzer().fbRef;
  if (ref) ref.child('teamNames').set(names || []).catch(()=>{});
}
// Team-Zuteilungen leben jetzt am Account (buzzer/players/{key}/team), nicht
// mehr an der flüchtigen Presence - sie sind also von Haus aus permanent und
// überleben Disconnects UND das Ende eines Spiels. Ein neues Spiel setzt sie
// NICHT mehr automatisch zurück; der Host tut das explizit über einen der
// drei "Teams zurücksetzen"-Buttons (Lobby-Panel, Spielerübersicht, GM-Panel).
// Vom GM-Fenster, Setup-Screen oder der Spielerübersicht aufgerufen: weist
// einen Spieler (per Account-Key) einem Team zu. Presence wird als schnelle
// Kopie mitgeschrieben (falls der Spieler gerade online ist).
function assignPlayerTeam(key, teamIdx){
  firebase.database().ref('buzzer/players/' + key + '/team').set(teamIdx).catch(e => console.error('assignPlayerTeam failed', e));
  const presenceRef = currentBuzzer().presenceRef;
  if (presenceRef) presenceRef.child(key).update({ team: teamIdx }).catch(()=>{});
}
// Alle Team-Zuteilungen löschen (für ein frisches Event) - wirkt auf ALLE
// jemals angelegten Accounts, nicht nur die gerade verbundenen.
function resetAllPlayerTeams(silent){
  if (!silent && !confirm('Team-Zuteilung aller Spieler zurücksetzen?')) return;
  firebase.database().ref('buzzer/players').once('value').then(snap => {
    const updates = {};
    snap.forEach(child => { updates[child.key + '/team'] = null; });
    if (Object.keys(updates).length) firebase.database().ref('buzzer/players').update(updates).catch(()=>{});
  }).catch(()=>{});
  const pr = currentBuzzer().presenceRef;
  if (pr) pr.once('value').then(s => {
    const v = s.val() || {};
    Object.keys(v).forEach(id => pr.child(id).update({ team: null }).catch(()=>{}));
  });
}
// Rückwärtskompatibler Name für alte Aufrufer.
function resetAllTeams(){ resetAllPlayerTeams(false); }
// Baut die kleinen Team-Zuweisungs-Buttons neben einem Spieler in der GM-Präsenzliste.
// prefix ist 'opener.' innerhalb der GM-Popup-Vorlagen, oder leer, wenn direkt
// auf der Hauptseite gerendert (z.B. im Setup-Screen-Lobby-Panel). p.id ist
// hier der Account-Key (Presence-Key == Account-Key).
function playerTeamButtonsHtml(p, teamNames, prefix){
  prefix = prefix || '';
  return teamNames.map((name, i) => `<button class="pr-team-btn ${p.team===i?'active':''}" onclick="${prefix}assignPlayerTeam('${p.id}',${i})">${name}</button>`).join('');
}
// Avatar und Farbe stammen aus fremden Accounts und landen hier in einem
// style-Attribut bzw. im Markup - beides muss escaped werden.
function playerAvatarHtml(p){
  return `<span class="pmini-av" style="background:${escAttr(p.color||'#888')};">${escapeHtml(p.avatar||'👤')}</span>`;
}

// Rendert die Lobby-Liste direkt auf dem Setup-Screen (nicht im GM-Popup) -
// game ist 'feud' oder 'jeopardy', bestimmt welchen Buzzer/Teamnamen-Satz wir zeigen.
// Welche Eingabefelder/Container zu welchem Spielmodus gehören. Vorher stand
// das als feud/jeopardy-Verzweigung im Code - mit dem dritten Modus wurde das
// unübersichtlich.
const LOBBY_SETUP = {
  feud:     { container:'feud-setup-lobby',     screen:'setup-screen',            names:['team1-name','team2-name','team3-name'], team3:'enable-team3' },
  jeopardy: { container:'jeopardy-setup-lobby', screen:'jeopardy-setup-screen',   names:['jt1-name','jt2-name','jt3-name'],       team3:'jeopardy-enable-team3' },
  wwds:     { container:'wwds-setup-lobby',     screen:'wwds-setup-screen',       names:['wwds-t1-name','wwds-t2-name','wwds-t3-name'], team3:'wwds-enable-team3' },
};
function lobbyTeamNames(game){
  const cfg = LOBBY_SETUP[game];
  const val = (id, fb) => fieldVal(id) || fb;
  const names = [val(cfg.names[0], 'Team 1'), val(cfg.names[1], 'Team 2')];
  if (fieldChecked(cfg.team3)) names.push(val(cfg.names[2], 'Team 3'));
  return names;
}

function renderSetupLobby(game){
  const cfg = LOBBY_SETUP[game];
  if (!cfg) return;
  const isJeopardy = game === 'jeopardy';
  const container = document.getElementById(cfg.container);
  if (!container) return;
  // Wer weiss denn sowas buzzert nicht - es braucht nur Presence und
  // Teamzuteilung, deshalb läuft es über dieselbe Verbindung wie Feud.
  const buzzer = isJeopardy ? jeopardyBuzzer : feudBuzzer;
  const teamNames = lobbyTeamNames(game);
  const teamTagColors = ['#E8453C','#3B82F6','#22C55E'];
  const rows = buzzer.presence.length
    ? buzzer.presence.map(p => {
        const teamTag = (p.team !== undefined && p.team !== null)
          ? `<span class="player-team-tag" style="background:${teamTagColors[p.team]||'#888'}22;color:${teamTagColors[p.team]||'#888'};">${teamNames[p.team] || ('Team '+(p.team+1))}</span>`
          : `<span class="player-team-tag" style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.35);">kein Team</span>`;
        return `<div class="pr-row"><span class="pr-dot"></span>${playerAvatarHtml(p)}<span style="flex:1;">${escapeHtml(p.name)}</span>${teamTag}</div>`;
      }).join('')
    : `<div class="pr-empty">Noch niemand verbunden — QR-Code scannen zum Beitreten</div>`;
  container.innerHTML = `
    <div class="panel-head"><span>👥 Lobby</span><span class="badge">${buzzer.presence.length}</span></div>
    <div class="pr-list">${rows}</div>
    <div class="panel-row">
      <button class="btn btn-secondary" onclick="toggleJeopardyQR()">${document.getElementById('qr-overlay') ? '✕ QR schließen' : '📱 QR-Code zeigen'}</button>
      <button class="btn btn-secondary" onclick="popOutQR()">🗗 QR als Fenster</button>
      <button class="btn btn-primary" onclick="openPlayersScreen('${cfg.screen}')">👥 Teams zuteilen</button>
      <button class="btn btn-secondary" onclick="resetAllTeams()">↺ Teams zurücksetzen</button>
    </div>`;
}

// Hängt die Spiel-Listener eines Buzzer-Kontexts an - gezielt auf die einzelnen
// Felder statt auf den ganzen /buzzer-Knoten. Der enthält nämlich auch players
// (sämtliche Accounts inklusive PIN-Hashes) und presence. Ein Listener darauf
// lud all das mit und feuerte bei JEDER fremden Änderung: lud ein Spieler nur
// seine Seite neu, ging deshalb das komplette Gamemaster-HTML erneut nach
// Firebase und das Handy-Panel des Hosts baute sich neu auf.
// Feud und Jeopardy hatten dafür zwei fast identische Kopien dieses Blocks.
// Rundennummer für Buzzer, Schätzfrage und Abstimmung. Die Handys setzen ihre
// Sperre ("schon gebuzzert/abgegeben/gewählt") zurück, sobald diese Zahl sich
// ÄNDERT - sie muss also nur eindeutig sein, nicht fortlaufend.
// Vorher war es ein Zähler, der bei 0 startete. Lud der Host seine Seite mitten
// in der Show neu, fing er wieder von vorn an: die nächste Runde bekam erneut
// die 1, und jedes Handy, das die 1 schon gesehen hatte, hielt seine Sperre
// weiter - der Spieler konnte nicht mehr buzzern und niemand wusste warum.
// Die Uhrzeit ist über Neuladen und Geräte hinweg eindeutig; das Maximum
// verhindert Gleichstand bei zwei Runden in derselben Millisekunde.
function nextRoundId(prev){ return Math.max(Date.now(), (prev || 0) + 1); }

function attachBuzzerGameListeners(bz, label, render, onFirstBuzz){
  let armStart = 0, armStartKnown = false, raw = {};
  const refresh = () => { render(); updateGamemaster(); };
  const apply = () => {
    // Ohne armStart wäre die Reaktionszeit gegen 0 gerechnet - das landet in
    // der Bestenliste und ist dort nicht mehr zu unterscheiden.
    if (!armStartKnown) return;
    const seen = {};
    const prev = bz.results;
    const wasEmpty = prev.length === 0;
    bz.results = Object.values(raw)
      .filter(b => b && b.name && b.ts)
      .sort((a, b) => a.ts - b.ts)
      .filter(b => { if (seen[b.name]) return false; seen[b.name] = 1; return true; })
      .map(b => ({ name: b.name, t: Math.max(0, (b.ts - armStart) / 1000), team: b.team, account: b.account }));
    noteNewBuzzes(prev, bz.results, label);
    if (wasEmpty && bz.results.length > 0) {
      bz.poppedForQuestion = true;
      if (onFirstBuzz) onFirstBuzz(bz.results[0]);
    }
    refresh();
  };
  bz.fbRef.child('armed').on('value', s => { bz.armed = !!s.val(); refresh(); });
  bz.fbRef.child('excluded').on('value', s => { bz.excluded = Object.keys(s.val() || {}); refresh(); });
  bz.fbRef.child('armStart').on('value', s => { armStart = s.val() || 0; armStartKnown = true; apply(); });
  bz.fbRef.child('buzzes').on('value', s => { raw = s.val() || {}; apply(); });
}

function jeopardyBuzzConnect(){
  // 1) Firebase
  if (jeopardyBuzzInitFirebase()){
    jeopardyBuzzer.mode = 'firebase';
    jeopardyBuzzer.connected = true;
    const origin = (location.origin && location.origin !== 'null') ? location.origin : '';
    jeopardyBuzzer.joinUrl = origin ? origin + '/buzzer' : BUZZER_FALLBACK_URL;
    // Sauberer Start: Board ist sichtbar, also muss der Buzzer beim Verbinden
    // deaktiviert sein - auch wenn von einer vorherigen Session noch "live"
    // in Firebase hängengeblieben ist.
    jeopardyBuzzer.fbRef.update({ live: false, armed: false, armStart: 0, buzzes: null, excluded: null }).catch(()=>{});
    if (jeopardyBuzzer.presenceRef) {
      // Schon verbunden (z.B. seit dem Setup-Screen) - keine zweiten Listener anhängen.
      renderBuzzer();
      updateGamemaster();
      return;
    }
    // Sobald der Erste buzzert, ploppt die Anzeige auf (in poppedForQuestion).
    attachBuzzerGameListeners(jeopardyBuzzer, 'Jeopardy', renderBuzzer);
    // Presence: welche Handys sind gerade verbunden (inkl. Team-Zuteilung)
    jeopardyBuzzer.presenceRef = firebase.database().ref('buzzer/presence');
    jeopardyBuzzer.presenceRef.on('value', (snap) => {
      const v = snap.val() || {};
      jeopardyBuzzer.presence = Object.entries(v)
        .filter(([id, p]) => p && p.name)
        .map(([id, p]) => ({ id, name: p.name, ts: p.ts, team: (p.team === undefined ? null : p.team), avatar: p.avatar, color: p.color }))
        .sort((a, b) => (a.ts || 0) - (b.ts || 0));
      renderSetupLobby('jeopardy');
      updateGamemaster();
    });
    renderBuzzer();
    updateGamemaster();
    return;
  }
  // 2) Lokaler Node-Server (SSE)
  if (jeopardyBuzzer.es) return;
  try {
    const es = new EventSource(BUZZER_URL + '/events');
    jeopardyBuzzer.es = es;
    jeopardyBuzzer.mode = 'sse';
    es.onopen = () => { jeopardyBuzzer.connected = true; renderBuzzer(); updateGamemaster(); };
    es.onerror = () => { jeopardyBuzzer.connected = false; renderBuzzer(); };
    es.onmessage = (e) => {
      try {
        const s = JSON.parse(e.data);
        jeopardyBuzzer.connected = true;
        jeopardyBuzzer.armed = s.armed;
        jeopardyBuzzer.results = s.buzzes || [];
        if (s.ip) jeopardyBuzzer.joinUrl = 'http://' + s.ip + ':' + s.port + '/';
        renderBuzzer();
        updateGamemaster();
      } catch {}
    };
  } catch { jeopardyBuzzer.connected = false; }
}

function jeopardyBuzzDisconnect(){
  if (jeopardyBuzzer.fbRef) { try { jeopardyBuzzer.fbRef.off(); } catch {} }
  if (jeopardyBuzzer.presenceRef) { try { jeopardyBuzzer.presenceRef.off(); } catch {} }
  if (jeopardyBuzzer.es) { jeopardyBuzzer.es.close(); jeopardyBuzzer.es = null; }
  jeopardyBuzzer.connected = false;
  jeopardyBuzzer.mode = 'none';
  jeopardyBuzzer.presence = [];
  // Refs zurücksetzen, damit ein späterer connect() wieder frische Listener anhängt
  // (sonst hält das idempotente Connect-Guard fälschlich für "schon verbunden").
  jeopardyBuzzer.fbRef = null;
  jeopardyBuzzer.presenceRef = null;
}

// ── FAMILY FEUD BUZZER ──
// Nutzt dieselbe Firebase-"buzzer"-Anbindung und dieselbe /buzzer-Beitrittsseite
// wie Jeopardy - entscheidet, welches Team pro Runde zuerst antworten darf.
let feudBuzzer = {
  armed: false, results: [], connected: false, joinUrl: '', fbRef: null, round: 0,
  excluded: [],       // wer bei diesem Buzz-Duell schon draußen ist (falls neu geöffnet wird)
  presenceRef: null, presence: [],
  hidden: false,      // manuell vom GM ausgeblendet
  poppedForQuestion: false,
};

function feudBuzzConnect(){
  if (feudBuzzer.fbRef) {
    // Schon verbunden (z.B. seit dem Setup-Screen) - nur den Buzzer für die
    // neue Runde sauber zurücksetzen, keine zweiten Firebase-Listener anhängen.
    feudBuzzer.connected = true;
    feudBuzzer.fbRef.update({ live: false, armed: false, armStart: 0, buzzes: null, excluded: null }).catch(()=>{});
    renderFeudBuzzer();
    updateGamemaster();
    return;
  }
  if (!jeopardyBuzzInitFirebase()){ feudBuzzer.connected = false; return; }
  feudBuzzer.connected = true;
  feudBuzzer.fbRef = firebase.database().ref('buzzer');
  const origin = (location.origin && location.origin !== 'null') ? location.origin : '';
  feudBuzzer.joinUrl = origin ? origin + '/buzzer' : BUZZER_FALLBACK_URL;
  // Sauberer Start: neue Runde beginnt immer mit deaktiviertem Buzzer.
  feudBuzzer.fbRef.update({ live: false, armed: false, armStart: 0, buzzes: null, excluded: null }).catch(()=>{});
  // Team des Spielers, der zuerst gebuzzert hat, ist schon bekannt (vom Host
  // zugeteilt) → automatisch als Startteam übernehmen, kein manueller GM-Klick
  // nötig, keine Verwechslungsgefahr bei den Strikes. Schließt den Buzzer NICHT
  // - das Zeiten-Fenster bleibt stehen, bis die nächste Runde vorbereitet wird
  // (feudBuzzPrepare() setzt es dann zurück).
  attachBuzzerGameListeners(feudBuzzer, 'Family Feud', renderFeudBuzzer, (first) => {
    const winnerTeam = first.team;
    if (winnerTeam !== undefined && winnerTeam !== null && winnerTeam >= 0 && winnerTeam < state.teamNames.length) {
      feudAutoSetStartTeam(winnerTeam);
    }
  });
  feudBuzzer.presenceRef = firebase.database().ref('buzzer/presence');
  feudBuzzer.presenceRef.on('value', (snap) => {
    const v = snap.val() || {};
    feudBuzzer.presence = Object.entries(v)
      .filter(([id, p]) => p && p.name)
      .map(([id, p]) => ({ id, name: p.name, ts: p.ts, team: (p.team === undefined ? null : p.team), avatar: p.avatar, color: p.color }))
      .sort((a, b) => (a.ts||0) - (b.ts||0));
    renderSetupLobby('feud');
    updateGamemaster();
  });
  renderFeudBuzzer();
  updateGamemaster();
}

// Aufgerufen, sobald der Family-Feud-Setup-Screen erscheint: verbindet die
// Lobby schon vor dem eigentlichen Spielstart, damit Spieler per QR-Code
// beitreten und der Host sie schon hier den Teams zuteilen kann. Teams
// bleiben zwischen Spielen bestehen (Accounts sind permanent) - der Host
// setzt sie nur explizit über einen der "Teams zurücksetzen"-Buttons zurück.
// Alle drei Lobbys laufen gleich an: Kontext setzen, verbinden, beim ersten
// Mal die Beitrittssperre loesen, Teamnamen an die Handys schicken, Liste
// zeichnen. Unterschiedlich ist nur, welche Verbindung dahintersteckt -
// Jeopardy hat eine eigene, Feud und "Wer weiss denn sowas" teilen sich eine
// (dort wird nicht gebuzzert, es braucht nur Presence und Teamzuteilung).
// Welche Eingabefelder die Teamnamen liefern, steht in LOBBY_SETUP. Das las
// vorher nur die WWDS-Fassung aus; Feud und Jeopardy hatten dieselben IDs
// noch einmal fest verdrahtet.
function ensureLobbyConnected(game){
  activeBuzzerContext = game;
  const isJeopardy = game === 'jeopardy';
  const buzzer = isJeopardy ? jeopardyBuzzer : feudBuzzer;
  // Vor dem Verbinden pruefen - danach steht die Referenz immer.
  const isFresh = !buzzer.fbRef;
  (isJeopardy ? jeopardyBuzzConnect : feudBuzzConnect)();
  // Nur beim ersten Verbinden: eine noch offene Sperre aus der letzten Show
  // wuerde sonst neue Gaeste aussperren.
  if (isFresh && buzzer.fbRef) buzzer.fbRef.update({ joinLocked: false, lockedNames: null }).catch(()=>{});
  broadcastSetupTeamNames(game);
}
function broadcastSetupTeamNames(game){
  buzzerBroadcastTeams(lobbyTeamNames(game));
  renderSetupLobby(game);
}

// Diese Namen ruft das Markup direkt auf (oninput=...) und showScreen() waehlt
// nach ihnen aus - sie bleiben als Einstiegspunkte bestehen.
function ensureFeudLobbyConnected(){ ensureLobbyConnected('feud'); }
function ensureWwdsLobbyConnected(){ ensureLobbyConnected('wwds'); }
function ensureJeopardyLobbyConnected(){ ensureLobbyConnected('jeopardy'); }
function broadcastFeudSetupTeamNames(){ broadcastSetupTeamNames('feud'); }
function broadcastWwdsSetupTeamNames(){ broadcastSetupTeamNames('wwds'); }
function broadcastJeopardySetupTeamNames(){ broadcastSetupTeamNames('jeopardy'); }

function feudBuzzDisconnect(){
  if (feudBuzzer.fbRef) { try { feudBuzzer.fbRef.off(); } catch {} }
  if (feudBuzzer.presenceRef) { try { feudBuzzer.presenceRef.off(); } catch {} }
  feudBuzzer.connected = false;
  feudBuzzer.presence = [];
  const el = document.getElementById('feud-buzzer');
  if (el) el.remove();
  // Refs zurücksetzen, damit ein späterer connect() wieder frische Listener anhängt
  // (sonst hält das idempotente Connect-Guard fälschlich für "schon verbunden").
  feudBuzzer.fbRef = null;
  feudBuzzer.presenceRef = null;
}

// Neue Runde geladen, Frage noch verdeckt - Buzzer live, aber noch nicht scharf
function feudBuzzPrepare(){
  feudBuzzer.round = nextRoundId(feudBuzzer.round);
  feudBuzzer.excluded = [];
  feudBuzzer.poppedForQuestion = false;
  if (feudBuzzer.fbRef) feudBuzzer.fbRef.update({ round: feudBuzzer.round, live: true, armed: false, armStart: 0, buzzes: null, excluded: null }).catch(()=>{});
  feudBuzzer.armed = false; feudBuzzer.results = [];
  renderFeudBuzzer();
}

// GM deckt die Frage auf → Buzzer-Duell scharf: wer zuerst buzzert, darf antworten
function feudBuzzArm(){
  if (feudBuzzer.fbRef) feudBuzzer.fbRef.update({ round: feudBuzzer.round, live: true, armed: true, armStart: firebase.database.ServerValue.TIMESTAMP, buzzes: null }).catch(()=>{});
  feudBuzzer.armed = true; feudBuzzer.results = [];
  renderFeudBuzzer();
  updateGamemaster();
}

// Runde vorbei - Buzzer wieder aus
function feudBuzzClose(){
  feudBuzzer.excluded = [];
  feudBuzzer.poppedForQuestion = false;
  if (feudBuzzer.fbRef) feudBuzzer.fbRef.update({ live: false, armed: false, armStart: 0, buzzes: null, excluded: null }).catch(()=>{});
  feudBuzzer.armed = false; feudBuzzer.results = [];
  renderFeudBuzzer();
}

function feudBuzzToggleHidden(){
  feudBuzzer.hidden = !feudBuzzer.hidden;
  renderFeudBuzzer();
  updateGamemaster();
}

// GM entscheidet anhand der Buzz-Reihenfolge, welches Team zuerst antwortet
function feudSetStartTeam(i){
  saveSnapshot();
  state.currentTeam = i;
  feudBuzzClose();
  updateActiveTeam();
  updateGamemaster();
}

function feudToggleMedia(slot) {
  const q = state.roundQuestions[state.currentRound];
  if (!q) return;
  toggleMediaSlot(q.media || [], slot);
}

// Wie feudSetStartTeam(), aber ohne den Buzzer zu schließen - das Buzzer-
// Zeiten-Fenster bleibt sichtbar stehen, bis die nächste Frage vorbereitet
// wird (feudBuzzPrepare() setzt Ergebnisse/Anzeige dann zurück).
function feudAutoSetStartTeam(i){
  if (state.currentTeam === i) return; // schon gesetzt, z.B. durch GM-Klick
  saveSnapshot();
  state.currentTeam = i;
  feudBuzzer.armed = false; // Duell entschieden, keine weiteren Buzzes werten
  if (feudBuzzer.fbRef) feudBuzzer.fbRef.update({ armed: false }).catch(()=>{});
  updateActiveTeam();
  updateGamemaster();
}

function renderFeudBuzzer(){
  let el = document.getElementById('feud-buzzer');
  const boardShown = document.getElementById('game-screen').classList.contains('active');
  const shouldShow = state.roundQuestions && state.roundQuestions.length && boardShown
    && !feudBuzzer.hidden && feudBuzzer.poppedForQuestion;
  if (!shouldShow) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'feud-buzzer'; document.body.appendChild(el); }
  const rows = feudBuzzer.results.map((r, idx) => `
    <div class="jbz-row ${idx === 0 ? 'first' : ''}">
      <span class="jbz-rank">${idx + 1}</span>
      <span class="jbz-name">${escapeHtml(r.name)}</span>
      <span class="jbz-time">${r.t.toFixed(2)}s</span>
    </div>`).join('');
  el.innerHTML = `
    <div class="jbz-title"><span>🔔 Buzzer</span><span class="${feudBuzzer.armed ? 'jbz-armed' : 'jbz-idle'}">${feudBuzzer.armed ? '● SCHARF' : '○ AUS'}</span></div>
    ${rows || '<div style="font-size:.7rem;color:rgba(255,255,255,.35);text-align:center;padding:6px 0;">Noch niemand</div>'}`;
}

// ── GM-GAMEPAD (Handy-Fernbedienung für das Gamemaster-Fenster) ──
// Spiegelt den Inhalt des GM-Popups per Firebase auf /gm/ (Handy), und nimmt
// von dort Befehle entgegen. Nur Funktionen aus dieser Liste dürfen per
// Fernbefehl ausgeführt werden (kein beliebiger window[name]-Aufruf).
const GM_REMOTE_ALLOWED_FNS = new Set([
  'addStrike','assignPlayerTeam','feudBuzzToggleHidden','feudSetStartTeam','feudToggleMedia','finaleMarkMiss','finaleNextReveal',
  'finalePickAnswer','gmAdvance','gmSkipTutorial',
  'jeopardyAnnounceDaily','jeopardySetDdTeam','jeopardyBuzzReopen','jeopardyBuzzToggleHidden','jeopardyDeduct',
  'jeopardyPlaySound','jeopardyRevealQuestion','jeopardyScore','jeopardySeriesReveal','jeopardySkip','jeopardyStageReveal',
  'jeopardyStopSound','jeopardyToggleAnswer','jeopardyToggleMedia','jeopardyUndo','jeopardyWrongReopen','nextRound','openJeopardyClue',
  'jeopardyEstimateOpen','jeopardyEstimateClose','jeopardyEstimateReopen',
  'wwdsAdjustBet','wwdsSetGuess','wwdsShowTieGuesses','wwdsStartMaster','wwdsMasterSet','wwdsRevealMaster','wwdsAfterMaster',
  'wwdsPick','wwdsSelect','wwdsLock','wwdsReveal','wwdsNext','wwdsAudience','wwdsStartTimer',
  'wwdsRevealTie','wwdsToggleMedia','gmBackToMenu','gmPlayAgain','gmGotoTournament',
  'revealAll','revealAnswer','revealQuestion','setGmFeudTab','toggleJeopardyQR','popOutQR','switchTeam',
  'undoLast','updateActiveTeam','updateGamemaster','wwmSelect','wwmToggleMedia','saveHostNotesRemote',
  'tournamentStartGame','tournamentRevealSecret',
]);

function gmRemoteInitFirebase() {
  if (!window.firebase || !FIREBASE_CONFIG.databaseURL) return false;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    return true;
  } catch { return false; }
}

let gmRemoteHtmlRef = null;
function gmRemoteRef() {
  if (!gmRemoteHtmlRef) { gmRemoteInitFirebase(); gmRemoteHtmlRef = firebase.database().ref('gmremote/html'); }
  return gmRemoteHtmlRef;
}

// Baut das Skript, das die per Firebase empfangene GM-Seite auf dem Handy
// lauffähig macht: läuft dort kein window.opener (kein echtes Popup), wird
// ein Proxy eingesetzt, der jeden "opener.xxx(...)"-Aufruf per Firebase an
// den Host zurücksendet - die GM-HTML selbst bleibt dadurch unverändert.
function gmRemoteBridgeScript() {
  return `
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"><\/script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js"><\/script>
<script>
(function(){
  if (window.opener) return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(${JSON.stringify(FIREBASE_CONFIG)});
    const cmdRef = firebase.database().ref('gmremote/commands');
    window.opener = new Proxy({}, { get(t, prop) {
      return function(...args) { cmdRef.push({ fn: String(prop), args, t: Date.now() }); };
    }});
  } catch(e) {}
})();
<\/script>`;
}

// Das GM-HTML ist je nach Modus 20-40 KB gross. updateGamemaster() läuft aber
// bei jeder Kleinigkeit - Buzz, Punkt, Presence -, teilweise mehrfach in
// derselben Aktion. Deshalb zwei Bremsen: identisches HTML gar nicht erst
// senden, und schnell aufeinanderfolgende Änderungen zu einem Schreibvorgang
// zusammenfassen. Es zählt immer der letzte Stand, nie ein übersprungener.
const GM_PUSH_MS = 120;
let gmPushTimer = null, gmPushPending = null, gmLastPush = 0, gmLastPushedHtml = null;
function pushGamemasterHtmlToFirebase(html) {
  if (!gmRemoteInitFirebase()) return;
  if (html === gmLastPushedHtml) return;
  gmPushPending = html;
  if (gmPushTimer) return;
  const wait = Math.max(0, GM_PUSH_MS - (Date.now() - gmLastPush));
  gmPushTimer = setTimeout(() => {
    gmPushTimer = null;
    const pending = gmPushPending;
    gmPushPending = null;
    if (pending === null) return;
    gmLastPush = Date.now();
    gmLastPushedHtml = pending;
    try {
      gmRemoteRef().set(pending.replace('<head>', '<head>' + gmRemoteBridgeScript()));
    } catch (e) {}
  }, wait);
}

// Ersetzt document.open()/write()/close() an allen GM-Render-Stellen: schreibt
// wie bisher ins Popup UND spiegelt dieselbe HTML nach Firebase fürs Handy.
function commitGamemasterHtml(html) {
  // Statt jedes Mal das ganze iframe-Dokument neu zu schreiben (document.write),
  // wird nur reingepatcht was sich wirklich geändert hat (per morphMirror, siehe
  // Board-Popout weiter oben). Das lässt z.B. das Notizen-Textfeld beim Tippen
  // in Ruhe, statt es bei jedem GM-Update (Buzz, Punktestand, …) zu resetten.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  morphMirror(gamemasterWin.document.head, doc.head);
  morphMirror(gamemasterWin.document.body, doc.body);
  pushGamemasterHtmlToFirebase(html);
}

let gmRemoteListenerStarted = false;
function startGmRemoteCommandListener() {
  if (gmRemoteListenerStarted) return;
  if (!gmRemoteInitFirebase()) return;
  gmRemoteListenerStarted = true;
  const startedAt = Date.now();
  const ref = firebase.database().ref('gmremote/commands');
  ref.on('child_added', (snap) => {
    const cmd = snap.val();
    snap.ref.remove().catch(() => {});
    if (!cmd || !cmd.fn || !cmd.t || cmd.t < startedAt - 5000) return;
    if (!GM_REMOTE_ALLOWED_FNS.has(cmd.fn)) return;
    // Der Zugriff ueber den Namen kann alles Moegliche liefern. Erst
    // unknown, dann engt die typeof-Pruefung darunter auf etwas Aufrufbares
    // ein - das ist zugleich die eigentliche Absicherung zur Laufzeit.
    const fn = /** @type {unknown} */ (window[cmd.fn]);
    if (typeof fn === 'function') { try { fn(...(cmd.args || [])); } catch (e) {} }
  });
}

