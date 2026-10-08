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

/* Das Turnier liegt in Firebase (offene Regeln) und im localStorage, ist also
   fremde Eingabe: Namen, Spiel, Datum, Punkte landen als Markup im GM-Panel
   und auf der Leinwand. Beim Einlesen auf die erwartete Form bringen - Texte
   als String, Zahlen als Zahl - (Vorbild: tpSanitizeCats); die Ausgaben
   escapen zusaetzlich. Unbekannte Felder bleiben unveraendert erhalten. */
/** @param {any} t */
function tournamentClean(t){
  if (!t || typeof t !== 'object') return null;
  const str = (/** @type {any} */ v) => String(v == null ? '' : v);
  const num = (/** @type {any} */ v) => { const n = Number(v); return isFinite(n) ? n : 0; };
  const games = (Array.isArray(t.games) ? t.games : [])
    .filter((/** @type {any} */ g) => g && typeof g === 'object')
    .map((/** @type {any} */ g) => ({
      ...g,
      game: str(g.game), weight: num(g.weight), date: str(g.date),
      scores: Array.isArray(g.scores) ? g.scores.map(num) : null,
      done: !!g.done, secret: !!g.secret,
    }));
  const files = {};
  if (t.files && typeof t.files === 'object') {
    Object.keys(t.files).forEach(k => {
      const f = t.files[k];
      if (f && typeof f === 'object') files[k] = { ...f, name: str(f.name), at: num(f.at) };
    });
  }
  return {
    ...t,
    name: str(t.name),
    teams: (Array.isArray(t.teams) ? t.teams : []).map(str),
    games,
    files,
  };
}

function tournamentConnect(){
  if (tournamentRef || !window.firebase) return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    tournamentRef = firebase.database().ref('tournament');
    tournamentRef.on('value', (snap) => {
      tournament = tournamentClean(snap.val());
      storeSetJson('tournamentCache', tournament);
      if (screenActive('tournament-screen')) renderTournament();
    });
  } catch {}
}
function loadTournament(){
  tournament = tournamentClean(storeGetJson('tournamentCache', null));
  tournamentConnect();
}
function saveTournament(){
  storeSetJson('tournamentCache', tournament);
  if (tournamentRef) tournamentRef.set(tournament).catch(()=>{});
  renderTournament();
  if (gamemasterWin && !gamemasterWin.closed) updateGamemaster();
}


/* Welche Show der Turniermodus selbst oeffnen kann. Der Wert ist der
   Setup-Screen: gestartet wird dort, nicht von hier - der Host braucht ja noch
   Teamnamen, Lobby und Einstellungen.

   Ob eine Show ihr Ergebnis danach AUTOMATISCH eintraegt, ist eine andere
   Frage. Team-Shows koennen das (Feud, Jeopardy, WWDS, Trivial Pursuit), die
   teamlosen nicht: "Der Duemmste fliegt" und "Der Preis ist heiss" kennen
   Teilnehmer, keine Teams, und ein Turnier laeuft ueber feste Teams. Die geben
   ihren Platz am Ende nur frei (tournamentReleaseActive), der Host traegt das
   Ergebnis von Hand ein. */
/* Alles, was das Turnier ueber eine Show wissen muss, an einer Stelle.

   - setup   Der Setup-Screen. Er wird auch beim Direktstart betreten, denn an
             ihm haengen die Nebenwirkungen von showScreen(): Lobby verbinden,
             Einstellungen laden, Teilnehmerfelder bauen. Nur SICHTBAR wird er
             dabei nicht - das Zuschauerfenster zeigt ihn ohnehin nicht (siehe
             BOARD_PUBLIC_SCREENS), und der Host ist eine Zeile spaeter im Spiel.
   - start   Die Funktion, die die Show tatsaechlich startet.
   - lobby   Der Schluessel, unter dem die Teamnamen-Felder stehen (LOBBY_SETUP
             in buzzer.js) - daran werden die Turnier-Teams uebernommen.
             'pih' hat eigene Felder, null heisst: keine Teamnamen im Setup.
   - roster  Die Show braucht eine Teilnehmer-Auswahl. Dann KEIN Direktstart:
             der Host muss erst aussuchen, wer mitspielt.
   - import  Die Import-Funktion des Editors, fuer das Spieldaten-Depot.
   - info    Was gerade geladen ist, in einem Satz - fuer "Spieldaten pruefen".

   `roster` stand vorher nicht als eigenes Feld da, sondern als Wert IN `lobby`
   ('roster' statt eines Lobby-Schluessels). Das ging fuer "Der Duemmste
   fliegt" gerade noch auf, fuer "Der Preis ist heiss" nicht: die Show hat
   eigene Teamnamen-Felder und musste deshalb `lobby:'pih'` tragen - womit der
   Halt verlorenging und sie aus dem Turnier heraus durchstartete. Aufgefallen
   ist das nicht, weil im Test kein Handy verbunden war: rosterSeed() waehlt
   die verbundenen Accounts automatisch vor, und ohne Handys war die Liste
   leer, also brach startPih() mit einer Meldung ab. Mit verbundenen Handys
   waere die Show ohne Rueckfrage losgelaufen - mit einer Teilnehmerliste, die
   der Host nie gesehen hat.

   Zwei Fragen, zwei Felder. Ein Wert, der zwei Dinge bedeutet, faellt
   irgendwann auf die Nase.
   @type {Record<string, {setup:string, start:string, lobby:string|null, roster?:boolean, import:string, info:() => string}>} */
const TOURNAMENT_GAMES = {
  'Family Feud':         { setup:'setup-screen',          start:'startGame',    lobby:'feud',
                           import:'importQuestions',
                           info:() => `${(questions||[]).length} Fragen · ${(finaleQuestions||[]).length} Finalfragen` },
  'Jeopardy':            { setup:'jeopardy-setup-screen', start:'startJeopardy',lobby:'jeopardy',
                           import:'importJeopardy',
                           info:() => `${jeopardyData.boards.length} Boards · ${jeopardyFilledClues()} von ${jeopardyData.boards.length*JEOPARDY_CATS*JEOPARDY_VALUES.length} Feldern gefüllt` },
  'Wer wird Millionär':  { setup:'wwm-setup-screen',      start:'startWwm',     lobby:null,
                           import:'importWwm',
                           info:() => `${(wwmData.questions||[]).length} Fragen` },
  'Wer weiß denn sowas': { setup:'wwds-setup-screen',     start:'startWwds',    lobby:'wwds',
                           import:'importWwds',
                           info:() => `${(wwdsData.categories||[]).length} Kategorien` },
  'Der Dümmste fliegt':  { setup:'ddf-setup-screen',      start:'startDdf',     lobby:null, roster:true,
                           import:'importDdf',
                           info:() => `${(ddfData.questions||[]).length} Fragen` },
  'Der Preis ist heiß':  { setup:'pih-setup-screen',      start:'startPih',     lobby:'pih', roster:true,
                           import:'importPih',
                           info:() => `${(pihData.items||[]).length} Artikel` },
  'Trivial Pursuit':     { setup:'tp-setup-screen',       start:'startTp',      lobby:'tp',
                           import:'importTp',
                           info:() => `${tpData.categories.length} Kategorien · ${tpData.categories.reduce((n,c)=>n+c.questions.length,0)} Fragen` },
};
/** Wie viele Jeopardy-Felder ueberhaupt eine Frage tragen. @returns {number} */
function jeopardyFilledClues(){
  let n = 0;
  jeopardyData.boards.forEach(b => b.categories.forEach(c => c.clues.forEach(cl => {
    if ((cl.q || '').trim() || cl.qImg || cl.stageImg) n++;
  })));
  return n;
}
/** Rueckwaertskompatibler Name: der Setup-Screen je Spiel.
 *  @type {Record<string, string>} */
const TOURNAMENT_STARTABLE = Object.fromEntries(
  Object.entries(TOURNAMENT_GAMES).map(([k, v]) => [k, v.setup]));
/* Shows, die ihr Ergebnis direkt aus Teampunkten melden. Die uebrigen beiden
   melden auch, rechnen es aber erst ueber die Team-Zuordnung der Teilnehmer
   hoch (tournamentReportTeamless) - das steht als Hinweis in der Zeile, damit
   der Host weiss, dass er die Zuteilung vorher gemacht haben muss. */
const TOURNAMENT_AUTO_RESULT = new Set([
  'Family Feud', 'Jeopardy', 'Wer wird Millionär', 'Wer weiß denn sowas', 'Trivial Pursuit',
]);
// Nutzt die echten, handgezeichneten Logos statt generischer Emoji. Jede
// Einbindung braucht eine eigene Gradient-ID, sonst kollidieren mehrere Zeilen
// im Spielplan auf dieselbe id="sg"/"dg" - darum kuemmern sich starSvg() und
// dangerSvg() aus core.js. Das stand hier frueher von Hand, half aber nur
// innerhalb des Spielplans; die Kollision mit der Menuekachel blieb.
/** @param {string} name @returns {string} */
function tournamentGameIcon(name){
  if (name === 'Family Feud') return `<span class="tour-icon-svg">${starSvg()}</span>`;
  if (name === 'Jeopardy') return `<span class="tour-icon-svg">${dangerSvg()}</span>`;
  if (name === 'Wer wird Millionär') return '💰';
  if (name === 'Wer weiß denn sowas') return '🧠';
  if (name === 'Der Dümmste fliegt') return '❤';
  if (name === 'Der Preis ist heiß') return '🏷️';
  if (name === 'Trivial Pursuit') return '🥧';
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
/* Alter Name, damit nichts bricht, was ihn noch ruft (Handy-Gamepad, alte
   GM-Fenster). Er fuehrt auf denselben Weg wie der Knopf im Spielplan. */
function tournamentStartGame(i){ tournamentStartAt(i); }

/* ── Turnier-Teams in die Setup-Felder ─────────────────────────────────────
   Der Host tippte die Teamnamen vor jedem Spiel neu ein. Das ist nicht nur
   laestig: schreibt er einmal "Rote" statt "Die Roten", findet
   tournamentAutoRecordIfActive() den Namen nicht wieder und faellt auf die
   Reihenfolge zurueck - bei drei Teams landen die Punkte dann still beim
   falschen.

   Deshalb kommen die Namen jetzt aus dem Turnier. Die Felder stehen in
   LOBBY_SETUP (buzzer.js); "Der Preis ist heiss" hat eigene.
   @param {string} gameName */
function tournamentFillTeamNames(gameName){
  if (!tournament) return;
  const cfg = TOURNAMENT_GAMES[gameName];
  if (!cfg || !cfg.lobby) return;
  const teams = tournament.teams;
  if (cfg.lobby === 'pih'){
    fieldSet('pih-t1-name', teams[0] || '');
    fieldSet('pih-t2-name', teams[1] || '');
    return;
  }
  const setup = LOBBY_SETUP[cfg.lobby];
  if (!setup) return;
  setup.names.forEach((id, i) => fieldSet(id, teams[i] || ''));
  // Das dritte Team ist ein Haken, kein Feld - ohne ihn bliebe der dritte
  // Name stehen und wuerde trotzdem nicht mitspielen.
  const drei = fieldEl(setup.team3);
  if (drei) { drei.checked = teams.length >= 3; drei.dispatchEvent(new Event('change')); }
  broadcastSetupTeamNames(cfg.lobby);
}

/* Das naechste noch nicht gespielte Spiel im Plan.
   @returns {number} Index, oder -1 */
function tournamentNextGameIndex(){
  if (!tournament) return -1;
  return tournament.games.findIndex(g => !g.done);
}

/* ── Direktstart aus dem Turnier ───────────────────────────────────────────
   Davids Ablauf: nach dem Ergebnis steht der Turnierstand auf der Leinwand,
   und von dort geht es weiter - ohne Umweg ueber Menue und Lobby.

   Der Setup-Screen wird trotzdem betreten, aber nicht gezeigt: an ihm haengen
   die Nebenwirkungen von showScreen() (Lobby verbinden, Einstellungen laden,
   Teilnehmerfelder bauen), und ohne sie startet die Show halb eingerichtet.
   Sichtbar wird er nicht - das Zuschauerfenster zeigt keine Setup-Screens
   (BOARD_PUBLIC_SCREENS), und der Host ist eine Zeile spaeter im Spiel.

   "Der Duemmste fliegt" und "Der Preis ist heiss" bleiben auf ihrem
   Setup-Screen stehen: dort muss erst ausgesucht werden, WER mitspielt. Das
   kann kein Knopf erraten. */
function tournamentStartNext(){
  const i = tournamentNextGameIndex();
  if (i < 0) { alert('Alle Spiele im Plan sind gespielt.'); return; }
  tournamentStartAt(i);
}
/** @param {number} i */
function tournamentStartAt(i){
  if (!tournament || !tournament.games[i]) return;
  const g = tournament.games[i];
  const cfg = TOURNAMENT_GAMES[g.game];
  if (!cfg){
    alert(`"${g.game}" kann nicht automatisch gestartet werden — bitte von Hand spielen und das Ergebnis eintragen.`);
    return;
  }
  activeTournamentGameIndex = i;
  showScreen(cfg.setup);
  tournamentFillTeamNames(g.game);
  if (cfg.roster){
    // Kein Direktstart: der Host waehlt erst die Teilnehmer aus. Die
    // Teamnamen sind trotzdem schon eingetragen, er muss nur noch die
    // Teilnehmer bestaetigen und selbst starten.
    updateGamemaster();
    return;
  }
  const start = /** @type {unknown} */ (window[cfg.start]);
  if (typeof start === 'function') start();
}

/* Der Weg zum Turnierstand aus einem Spiel-Panel heraus.

   Family Feud, Jeopardy, "Wer wird Millionär" und "Wer weiß denn sowas" enden
   auf dem gemeinsamen Ergebnis-Screen; dort steht der Knopf schon. Trivial
   Pursuit, "Der Dümmste fliegt" und "Der Preis ist heiß" haben eigene
   Endzustaende auf ihrem eigenen Screen - bei ihnen fuehrte nach dem Spiel
   nur "Zum Menue" weiter, und der Host musste sich von dort durch das
   Turnier-Menue zurueckklicken. Diese Zeile schliesst die Luecke.
   @param {string} pfx @returns {string} */
function tournamentEndButtonHtml(pfx){
  if (!tournament) return '';
  return `<button class="gm-btn gm-gold" onclick="${pfx}tournamentShowBoard()">📊 Turnierstand anzeigen</button>`;
}

/* ── Spieldaten-Depot ──────────────────────────────────────────────────────
   "Ich will ihm vorhinein für alle Games die Fragen und Intros importieren
   können."

   Die Dateien selbst landen dort, wo sie hingehoeren - in jeopardyData,
   tpData, wwdsData und so weiter, ueber genau dieselbe Import-Funktion, die
   auch der Editor benutzt. Ins Turnier kommt nur, WELCHE Datei das war und
   wann. Das ist Absicht: das Turnier-Objekt liegt in Firebase, und ein
   Jeopardy-Board mit eingebetteten Bildern ist mehrere Megabyte gross - es
   dort mitzuschleppen wuerde jede Runde ausbremsen und die Datenbank fuellen.

   Was der Host wirklich braucht, ist die Kontrolle vor dem Abend: steht in
   "Jeopardy" das Board von heute oder noch das von letzter Woche? Dafuer
   reichen Dateiname, Uhrzeit und eine Zahl aus den echten Daten. */

/** @param {string} gameName @param {HTMLInputElement} input */
function tournamentImportFor(gameName, input){
  const cfg = TOURNAMENT_GAMES[gameName];
  const file = input.files && input.files[0];
  if (!cfg || !file) return;
  const fn = /** @type {unknown} */ (window[cfg.import]);
  if (typeof fn !== 'function') return;
  // Erst nach einem geglueckten Import merken - siehe onJsonImportOk in core.js.
  onJsonImportOk = (name) => {
    if (!tournament) return;
    if (!tournament.files) tournament.files = {};
    tournament.files[gameName] = { name, at: Date.now() };
    saveTournament();
  };
  fn({ target: input });
}

/** Das Intro gehoert zu keinem einzelnen Spiel - es laeuft vor jeder Show.
 *  @param {HTMLInputElement} input */
function tournamentImportIntro(input){
  if (!input.files || !input.files[0]) return;
  onJsonImportOk = (name) => {
    if (!tournament) return;
    if (!tournament.files) tournament.files = {};
    tournament.files['Intro'] = { name, at: Date.now() };
    saveTournament();
  };
  importIntro({ target: input });
}

/** Was zu einem Spiel geladen ist, in einer Zeile.
 *  @param {string} gameName @returns {string} */
function tournamentFileInfo(gameName){
  const f = (tournament && tournament.files && tournament.files[gameName]) || null;
  const cfg = TOURNAMENT_GAMES[gameName];
  const stand = cfg ? (() => { try { return cfg.info(); } catch { return ''; } })() : '';
  if (!f) return stand ? `keine Datei geladen · aktuell: ${stand}` : 'keine Datei geladen';
  const wann = new Date(f.at).toLocaleString('de-DE', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
  return `${f.name} · ${wann}${stand ? ' · ' + stand : ''}`;
}

/* "Nächste Spieldaten überprüfen": was steht fuer die noch offenen Spiele
   bereit? Bewusst ein alert und kein weiterer Screen - der Host drueckt das
   kurz vor dem Start, liest zwei Zeilen und macht weiter. Ein Screen mehr
   waere ein Screen mehr, den er waehrend der Show verlassen muss. */
function tournamentCheckData(){
  if (!tournament) return;
  const offen = tournament.games.filter(g => !g.done);
  if (!offen.length) { alert('Alle Spiele im Plan sind gespielt.'); return; }
  const zeilen = offen.map((g, n) => {
    const kopf = `${n+1}. ${g.game}${g.secret ? ' (geheim)' : ''}`;
    return TOURNAMENT_GAMES[g.game]
      ? `${kopf}\n     ${tournamentFileInfo(g.game)}`
      : `${kopf}\n     wird von Hand gespielt`;
  });
  const intro = tournament.files && tournament.files['Intro'];
  const introZeile = intro
    ? `\n\nIntro: ${intro.name}`
    : `\n\nIntro: keine Datei geladen (es gilt, was gerade eingestellt ist)`;
  alert('Spieldaten für die offenen Spiele:\n\n' + zeilen.join('\n') + introZeile);
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
/* Gibt den laufenden Turnier-Platz frei, ohne etwas einzutragen.

   Ohne das bliebe activeTournamentGameIndex nach einer teamlosen Show stehen -
   und die naechste Show, die ein Ergebnis meldet, schriebe es in DEREN Zeile.
   Der Fehler faellt erst beim Blick auf die Gesamtwertung auf, und dann weiss
   niemand mehr, woher die Zahl kam.
   @returns {boolean} ob ueberhaupt ein Platz offen war */
function tournamentReleaseActive(){
  if (activeTournamentGameIndex === null) return false;
  activeTournamentGameIndex = null;
  return true;
}

/* ── Teamlose Shows ins Turnier ────────────────────────────────────────────
   "Der Duemmste fliegt" und "Der Preis ist heiss" kennen Teilnehmer, keine
   Teams - das Turnier laeuft aber ueber feste Teams. Die Bruecke gibt es
   schon: jeder Spieler-Account traegt eine Team-Zuordnung aus der Lobby
   ("Teams zuteilen"). Damit laesst sich ein Einzelergebnis auf die Teams
   hochrechnen, ohne dass der Host etwas doppelt eintraegt.

   Gaeste ohne Account haben keine Zuordnung. Sie fallen nicht unter den
   Tisch, sie werden gemeldet - der Host sieht, dass ihre Punkte fehlen, und
   kann das Ergebnis von Hand nachbessern. */

/** @param {any[]} players Teilnehmer der Show (brauchen .key und .label)
 *  @param {(p:any) => number} punkteVon was ein Teilnehmer wert ist
 *  @returns {{scores:number[], zugeordnet:number, ohneTeam:string[]}} */
function tournamentTeamScoresFromPlayers(players, punkteVon){
  const n = tournament ? tournament.teams.length : 0;
  const scores = new Array(n).fill(0);
  const ohneTeam = [];
  let zugeordnet = 0;
  const byKey = new Map((allPlayers || []).map(p => [p.key, p]));
  (players || []).forEach(p => {
    const acc = p.key ? byKey.get(p.key) : null;
    const team = acc ? acc.team : null;
    if (team === undefined || team === null || team < 0 || team >= n){
      ohneTeam.push(p.label || p.name || '?');
      return;
    }
    scores[team] += Number(punkteVon(p)) || 0;
    zugeordnet++;
  });
  return { scores, zugeordnet, ohneTeam };
}

/** Meldet das Ergebnis einer teamlosen Show ans Turnier.
 *  @param {string} gameName
 *  @param {any[]} players
 *  @param {(p:any) => number} punkteVon
 *  @returns {string} Ein Satz fuer den Bildschirm - leer, wenn nichts anliegt */
function tournamentReportTeamless(gameName, players, punkteVon){
  if (!tournament){ tournamentReleaseActive(); return ''; }
  const { scores, zugeordnet, ohneTeam } = tournamentTeamScoresFromPlayers(players, punkteVon);
  if (!zugeordnet){
    // Niemand hat ein Team - hochrechnen waere geraten. Platz freigeben und
    // sagen, warum nichts passiert ist.
    tournamentReleaseActive();
    return 'Fürs Turnier: keine Team-Zuordnung gefunden — bitte von Hand eintragen.';
  }
  const recorded = tournamentAutoRecordIfActive(tournament.teams, scores);
  if (!recorded) offerTournamentResult(gameName, tournament.teams, scores);
  const stand = tournament.teams.map((n2, i) => n2 + ' ' + scores[i]).join(' · ');
  const rest = ohneTeam.length ? ` — ohne Team und deshalb nicht gezählt: ${ohneTeam.join(', ')}` : '';
  return (recorded ? 'Ins Turnier eingetragen: ' : 'Fürs Turnier bereit: ') + stand + rest;
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
const TOURNAMENT_DEFAULT_WEIGHTS = {
  'Family Feud': 1, 'Jeopardy': 2, 'Wer wird Millionär': 1, 'Wer weiß denn sowas': 1,
  'Der Dümmste fliegt': 1, 'Der Preis ist heiß': 1, 'Trivial Pursuit': 2, 'Sonstiges': 1,
};
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

/* ── Tabelle und Spielplan fuers Publikum ──────────────────────────────────
   Dieselben Zahlen wie in der Host-Ansicht, aber ohne einen einzigen Knopf.
   Sie stehen hier als eigene Funktionen, damit beide Ansichten aus derselben
   Rechnung kommen - zwei Kopien waeren zwei Staende, die auseinanderlaufen.
   @returns {string} */
function tournamentStandingsHtml(){
  const totals = tournamentTotals();
  const maxT = Math.max(...totals, 1);
  const order = totals.map((t, i) => ({ t, i })).sort((a, b) => b.t - a.t);
  const medals = ['🥇','🥈','🥉'];
  return order.map((o, rank) => `
    <div class="q-list-item" style="${rank===0 && o.t>0 ? 'border-color:rgba(255,210,63,.35);background:rgba(255,210,63,.06);' : ''}">
      <span class="q-label"><span class="q-num">${medals[rank]||rank+1+'.'}</span><strong>${escapeHtml(tournament.teams[o.i])}</strong></span>
      <div style="display:flex;align-items:center;gap:12px;flex:1;max-width:50%;">
        <div style="flex:1;height:10px;background:rgba(255,255,255,.06);border-radius:5px;overflow:hidden;">
          <div style="width:${Math.round(o.t/maxT*100)}%;height:100%;background:linear-gradient(90deg,#FFD23F,#F0B800);border-radius:5px;transition:width .5s;"></div>
        </div>
        <span style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:#FFD23F;min-width:36px;text-align:right;">${o.t}</span>
      </div>
    </div>`).join('');
}

function renderTournamentBoard(){
  const el = document.getElementById('tournament-board-content');
  if (!el) return;
  if (!tournament){
    el.innerHTML = `<div class="page-title"><em>🏆 Turnier</em></div>
      <div class="q-list-item" style="justify-content:center;color:rgba(255,255,255,.35);">Noch kein Turnier angelegt.</div>`;
    return;
  }
  const naechste = tournamentNextGameIndex();
  const plan = tournament.games.map((g, i) => {
    const verdeckt = g.secret && !g.done;
    const pts = tournamentGamePoints(g, tournament.teams.length);
    const stand = g.done
      ? tournament.teams.map((t, ti) => `${escapeHtml(t)} <b style="color:#FFD23F;">+${pts[ti]}</b>`).join(' · ')
      : (i === naechste ? '<span style="color:#FFD23F;font-weight:700;">jetzt</span>'
                        : '<span style="color:rgba(255,255,255,.3);">kommt noch</span>');
    return `<div class="q-list-item"${i === naechste && !g.done ? ' style="border-color:rgba(255,210,63,.35);"' : ''}>
      <span class="q-label"><span class="q-num">${i+1}.</span>
        <span style="margin-right:4px;">${verdeckt ? '❓' : tournamentGameIcon(g.game)}</span>
        <strong>${verdeckt ? '???' : escapeHtml(g.game)}</strong>
        <span class="q-meta" style="color:#FFD23F;">×${Number(g.weight) || 0}</span></span>
      <span style="font-size:.78rem;color:rgba(255,255,255,.6);">${stand}</span>
    </div>`;
  }).join('') || `<div class="q-list-item" style="justify-content:center;color:rgba(255,255,255,.35);">Noch keine Spiele geplant.</div>`;

  el.innerHTML = `
    <div class="page-title" style="margin-bottom:18px;"><em>🏆 ${escapeHtml(tournament.name)}</em></div>
    <div class="q-list" style="margin-bottom:24px;">${tournamentStandingsHtml()}</div>
    <div class="page-title" style="font-size:.9rem;margin-bottom:8px;">Spielplan</div>
    <div class="q-list">${plan}</div>`;
}

/* Turnierstand auf die Leinwand. Der Host bleibt danach am GM-Panel und
   startet von dort das naechste Spiel - er muss dafuer nicht zurueck ins
   Menue und durch die Lobby. */
function tournamentShowBoard(){
  showScreen('tournament-board-screen');
  updateGamemaster();
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
  const standings = tournamentStandingsHtml();

  const gamesHtml = tournament.games.map((g, i) => {
    const pts = tournamentGamePoints(g, tournament.teams.length);
    const hidden = g.secret && !g.done;
    const icon = hidden ? '❓' : tournamentGameIcon(g.game);
    const label = hidden ? '???' : g.game;
    const result = g.done
      ? tournament.teams.map((t, ti) => `${escapeHtml(t)}: ${Number(g.scores[ti]) || 0} <span style="color:#FFD23F;">(+${pts[ti]})</span>`).join(' · ')
      : '<span style="color:rgba(255,255,255,.35);">Noch nicht gespielt</span>';
    const canAutoStart = !hidden && !g.done && TOURNAMENT_STARTABLE[g.game];
    // Bei den teamlosen Shows kommt das Ergebnis von Hand. Das gehoert in die
    // Zeile, nicht in eine Fussnote: sonst wartet der Host nach dem Spiel
    // darauf, dass sich der Spielplan von selbst fuellt.
    const handEintrag = !hidden && !g.done && TOURNAMENT_STARTABLE[g.game] && !TOURNAMENT_AUTO_RESULT.has(g.game);
    return `
      <div class="q-list-item" style="flex-wrap:wrap;gap:6px;">
        <span class="q-label"><span class="q-num">${i+1}.</span><span style="margin-right:2px;">${icon}</span><strong>${escapeHtml(label)}</strong>${(!hidden && g.date) ? `<span class="q-meta">${escapeHtml(g.date)}</span>` : ''}<span class="q-meta" style="color:#FFD23F;">Gewichtung ×${Number(g.weight) || 0}</span></span>
        <div class="q-btns">
          ${canAutoStart ? `<button class="btn btn-accent" onclick="tournamentStartAt(${i})">▶ Spiel starten</button>` : ''}
          <button class="btn btn-secondary" onclick="tournamentEnterResult(${i})">${g.done ? 'Ergebnis ändern' : 'Ergebnis eintragen'}</button>
          <button class="btn btn-danger" onclick="tournamentRemoveGame(${i})">Del</button>
        </div>
        <div style="width:100%;font-size:.78rem;color:rgba(255,255,255,.6);">${result}${handEintrag ? ' <span style="color:rgba(255,210,63,.75);">· zählt über die Team-Zuordnung der Teilnehmer</span>' : ''}</div>
      </div>`;
  }).join('') || `<div class="q-list-item" style="justify-content:center;color:rgba(255,255,255,.35);">Noch keine Spiele geplant.</div>`;

  const allDone = tournament.games.length > 0 && tournament.games.every(g => g.done);
  const naechste = tournamentNextGameIndex();
  const naechsterName = naechste >= 0 ? tournament.games[naechste].game : '';
  el.innerHTML = `
    <div class="page-title" style="margin-bottom:10px;"><em>${escapeHtml(tournament.name)}</em></div>
    <div class="q-list" style="margin-bottom:20px;">${standings}</div>
    <div class="edit-bar" style="margin-bottom:20px;">
      <button class="btn btn-secondary" onclick="tournamentShowBoard()">📊 Turnierstand anzeigen</button>
      ${naechste >= 0 ? `<button class="btn btn-accent" onclick="tournamentStartNext()">▶ Nächstes Spiel: ${escapeHtml(naechsterName)}</button>` : ''}
      <button class="btn btn-secondary" onclick="tournamentCheckData()">📦 Spieldaten prüfen</button>
    </div>
    ${tournamentDataPanelHtml()}
    ${tournamentRenamePanelHtml()}
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
          <option>Der Preis ist heiß</option>
          <option>Trivial Pursuit</option>
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

/* Das Spieldaten-Depot auf dem Turnier-Screen: je Spieltyp im Plan eine Zeile
   mit "Laden" und dem, was gerade drinsteht. Nur die Spiele, die auch geplant
   sind - eine Liste aller sieben Shows waere an einem Abend mit dreien
   hauptsaechlich Rauschen.
   @returns {string} */
function tournamentDataPanelHtml(){
  if (!tournamentDataOpen){
    return `<div class="edit-bar" style="margin-bottom:20px;">
      <button class="btn btn-secondary btn-sm" onclick="tournamentToggleData()">📦 Spieldaten &amp; Intro laden</button>
    </div>`;
  }
  // Ein Spieltyp kann mehrfach im Plan stehen (zwei Jeopardy-Runden an einem
  // Abend); geladen wird er trotzdem nur einmal.
  const typen = [];
  tournament.games.forEach(g => {
    if (TOURNAMENT_GAMES[g.game] && !typen.includes(g.game)) typen.push(g.game);
  });
  const zeilen = typen.map(name => `
    <div class="q-list-item" style="flex-wrap:wrap;row-gap:6px;">
      <span class="q-label"><span style="margin-right:4px;">${tournamentGameIcon(name)}</span><strong>${escapeHtml(name)}</strong></span>
      <div class="q-btns">
        <label class="btn btn-secondary" style="padding:6px 14px;font-size:.7rem;cursor:pointer;">📥 Laden
          <input type="file" accept="application/json,.json" style="display:none;"
                 onchange="tournamentImportFor(${escJsArg(name)}, this)">
        </label>
      </div>
      <div style="width:100%;font-size:.72rem;color:rgba(255,255,255,.45);">${escapeHtml(tournamentFileInfo(name))}</div>
    </div>`).join('') || `<div class="q-list-item" style="justify-content:center;color:rgba(255,255,255,.35);">Erst Spiele in den Plan legen.</div>`;

  const intro = (tournament.files && tournament.files['Intro']) || null;
  return `<div class="editor-card" style="margin-bottom:20px;">
    <label>Spieldaten für diesen Abend</label>
    <div class="q-list">${zeilen}
      <div class="q-list-item" style="flex-wrap:wrap;row-gap:6px;">
        <span class="q-label"><span style="margin-right:4px;">🎬</span><strong>Intro</strong></span>
        <div class="q-btns">
          <label class="btn btn-secondary" style="padding:6px 14px;font-size:.7rem;cursor:pointer;">📥 Laden
            <input type="file" accept="application/json,.json" style="display:none;" onchange="tournamentImportIntro(this)">
          </label>
        </div>
        <div style="width:100%;font-size:.72rem;color:rgba(255,255,255,.45);">${
          intro ? escapeHtml(intro.name) : 'keine Datei geladen (es gilt, was gerade eingestellt ist)'}</div>
      </div>
    </div>
    <div class="editor-actions">
      <button class="btn btn-secondary" onclick="tournamentToggleData()">Zuklappen</button>
    </div>
    <div style="font-size:.7rem;color:rgba(255,255,255,.35);margin-top:8px;">
      Die Dateien gehen genau dorthin, wo auch der Editor sie ablegt — hier steht nur,
      welche es war. Ein Jeopardy-Board mit Bildern wäre zu groß, um es im Turnier
      mitzuschleppen; nach einem Neustart des Browsers gehört deshalb ein Blick auf
      „📦 Spieldaten prüfen“ dazu.
    </div>
  </div>`;
}
let tournamentDataOpen = false;
function tournamentToggleData(){
  tournamentDataOpen = !tournamentDataOpen;
  renderTournament();
}

/* ── Umbenennen ───────────────────────────────────────────────────────────
   Turniername und Teamnamen liessen sich nach dem Anlegen nicht mehr aendern
   - ein Tippfehler im Teamnamen stand den ganzen Abend da, und wer seine
   Teams erst nach dem ersten Spiel tauft, musste das Turnier neu anlegen und
   alle Ergebnisse verlieren.

   Umbenennen ist ungefaehrlich: die Punkte haengen am INDEX (scores[0] ist
   Team 1), nicht am Namen. Die Reihenfolge bleibt deshalb, wie sie ist -
   zwei Namen zu tauschen wuerde die Ergebnisse NICHT mittauschen. Genau
   deshalb gibt es hier kein Sortieren und kein Loeschen. */
let tournamentRenameOpen = false;
function tournamentToggleRename(){
  tournamentRenameOpen = !tournamentRenameOpen;
  renderTournament();
}
/** @returns {string} */
function tournamentRenamePanelHtml(){
  if (!tournamentRenameOpen){
    return `<div class="edit-bar" style="margin-bottom:20px;">
      <button class="btn btn-secondary btn-sm" onclick="tournamentToggleRename()">✏ Namen ändern</button>
    </div>`;
  }
  return `<div class="editor-card" style="margin-bottom:20px;">
    <label>Turniername</label>
    <input type="text" id="tour-rename-name" value="${escAttr(tournament.name)}" placeholder="Turniername">
    <label>Teams — nur die Namen, die Punkte bleiben an ihrem Platz</label>
    ${tournament.teams.map((t, i) => `
      <input type="text" id="tour-rename-team${i}" value="${escAttr(t)}" placeholder="Team ${i+1}">`).join('')}
    <div class="editor-actions">
      <button class="btn btn-primary" onclick="tournamentRenameSave()">Übernehmen</button>
      <button class="btn btn-secondary" onclick="tournamentToggleRename()">Abbrechen</button>
    </div>
    <div style="font-size:.7rem;color:rgba(255,255,255,.35);margin-top:8px;">
      Die Reihenfolge bleibt: Zeile 1 ist und bleibt das Team, das bisher als Erstes stand.
      Zwei Namen zu vertauschen tauscht die Punkte nicht mit.
    </div>
  </div>`;
}
function tournamentRenameSave(){
  if (!tournament) return;
  const name = fieldVal('tour-rename-name').trim();
  if (name) tournament.name = name;
  // Ein leer gelassenes Feld behaelt den alten Namen - ein namenloses Team
  // waere in der Tabelle eine Luecke.
  tournament.teams = tournament.teams.map((alt, i) => fieldVal('tour-rename-team' + i).trim() || alt);
  saveTournament();
  tournamentRenameOpen = false;
  renderTournament();
}

function tournamentCelebrate(){
  const totals = tournamentTotals();
  const max = Math.max(...totals);
  const winners = tournament.teams.filter((_, i) => totals[i] === max);
  setText('winner-text', winners.length > 1
    ? 'Unentschieden im Turnier!'
    : `${winners[0]} gewinnt das Turnier! 🏆`);
  setHtml('final-scores', tournament.teams
    .map((t, i) => `${escapeHtml(t)}: <strong>${totals[i]}</strong> Turnierpunkte`).join('<br>'));
  showEl('tour-record-btn', false);
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
/* Ergebnis eintragen - und BLEIBEN.

   Vorher sprang das hier direkt auf den Turnier-Screen. Damit stand die
   Werkstatt des Hosts (Spielplan-Editor, Ergebnis-Eingabe) auf der Leinwand,
   und das Sieger-Bild war weg, bevor jemand es gesehen hatte. Davids Ablauf
   ist ein anderer: eintragen, das Ergebnis stehen lassen, und erst wenn der
   Host so weit ist, "Turnierstand anzeigen" - dann wechselt die Leinwand. */
function tournamentRecordPending(){
  if (!pendingTournamentResult || !tournament) return;
  const { gi, scores } = pendingTournamentResult;
  tournament.games[gi].scores = scores;
  tournament.games[gi].done = true;
  saveTournament();
  pendingTournamentResult = null;
  showEl('tour-record-btn', false);
  showEl('tour-goto-btn', true);
  updateGamemaster();
}

