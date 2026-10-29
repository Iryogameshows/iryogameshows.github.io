// Aufbau je Show: welcher Bildschirm mit welchem Inhalt gezeigt wird.
//
// Steht in einer eigenen Datei, weil ZWEI Seiten sie brauchen:
//   - tools/shots/shots.js  (Screenshots, per require)
//   - tools/durchgang/      (Durchgeh-Seite, per <script src> im iframe)
// Doppelt gepflegt waeren die Zustaende frueher oder spaeter verschieden,
// und dann prueft die eine Seite etwas anderes als die andere.
//
// Jede Funktion laeuft IM KONTEXT DER HOSTSEITE (index.html) - sie darf
// deshalb showScreen, startJeopardyActual, jeopardyState usw. direkt
// benutzen. Kein require, kein import: der Browser laedt die Datei als
// klassisches Script.

// ── Aufbau je Show, laeuft in der Seite ──
// Spielstart wie im echten Ablauf, Intro und Overlays danach weggeraeumt.
// Math.random steht beim Start auf 0, damit Startteam und Reihenfolge der
// Fragen in jedem Lauf gleich sind (fuer --vergleich).
const AUFBAU = {
  // Host-Seiten seit dem Design-Rework 2026-10-14: Menue und Feud-Setup
  // (Teamkarten, Lobby, Knoepfe) - vorher in keiner Richtung angesehen.
  menu: () => { showScreen('menu-screen'); },
  setup: () => { showScreen('setup-screen'); },
  feud: () => {
    const mr = Math.random; Math.random = () => 0; startGameActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('game-screen'); loadRound(); revealQuestion(); revealAnswer(0); revealAnswer(2);
  },
  jeop: () => {
    const mr = Math.random; Math.random = () => 0; startJeopardyActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('jeopardy-screen');
    jeopardyState.used[0][0] = true; jeopardyState.used[2][1] = true;
    renderJeopardyScores(); renderJeopardyBoard();
  },
  // Jeopardy-Frage offen und aufgedeckt, bzw. mit Antwort (2026-10-15: das
  // Aufdecken war in keinem Zustand zu sehen). Ein Daily Double wird
  // uebersprungen, damit es ein normales Feld ist.
  'jeop-frage': () => {
    const mr = Math.random; Math.random = () => 0; startJeopardyActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('jeopardy-screen');
    let c = 3; while (c > 0 && jeopardyIsDaily(c, 2)) c--;
    openJeopardyClue(c, 2); jeopardyRevealQuestion();
  },
  /* Zahlenstrahl mit zwei gelegten Dingen, eins davon falsch - so sind beide
     Rueckmeldungen (gruen, rot) im Bild. Die Dinge werden hier in das leere
     Feld geschrieben: im mitgelieferten Board steht keine Strahl-Frage, und
     die Pruefung soll nicht an Davids Fragen haengen.
     Math.random bleibt die ganze Zeit auf 0 - die Reihenfolge der Dinge wird
     gemischt, und --vergleich braucht in jedem Lauf dasselbe Bild. */
  'jeop-strahl': () => {
    const mr = Math.random; Math.random = () => 0;
    startJeopardyActual();
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('jeopardy-screen');
    let c = 3; while (c > 0 && jeopardyIsDaily(c, 2)) c--;
    const clue = jBoard()[c].clues[2];
    clue.q = 'Was kostet mehr?';
    clue.strahl = true;
    clue.strahlUnit = '€';
    clue.strahlCount = 4;
    clue.strahlTexts = ['Kinokarte', 'Döner', 'Monat Streaming', 'Tankfüllung'];
    clue.strahlValues = [12, 7, 18, 95];
    openJeopardyClue(c, 2);
    jeopardyRevealQuestion();
    jeopardyStrahlPlatz(0, 'Anna');     // irgendwohin - richtig oder falsch entscheidet der Wert
    jeopardyStrahlPlatz(2, 'Ben');
    Math.random = mr;
  },
  'jeop-antwort': () => {
    const mr = Math.random; Math.random = () => 0; startJeopardyActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('jeopardy-screen');
    let c = 3; while (c > 0 && jeopardyIsDaily(c, 2)) c--;
    openJeopardyClue(c, 2); jeopardyRevealQuestion(); jeopardyToggleAnswer();
  },
  wwm: () => {
    startWwmActual();
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('wwm-screen'); loadWwmQuestion();
  },
  wwds: () => {
    const mr = Math.random; Math.random = () => 0; startWwdsActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
  },
  // WWDS mit offener Frage und eingeloggter Antwort (2026-10-15: bis dahin
  // war nur die Kategorie-Auswahl im Bild).
  'wwds-frage': () => {
    const mr = Math.random; Math.random = () => 0; startWwdsActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    wwdsPick(0); wwdsSelect(1); wwdsStopTimer();
  },
  // Hoechster WWDS-Fall: Frage offen plus Publikumsjoker.
  'wwds-joker': () => {
    const mr = Math.random; Math.random = () => 0; startWwdsActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    wwdsPick(0); wwdsStopTimer();
    const mr2 = Math.random; Math.random = () => 0.5; wwdsAudience(); Math.random = mr2;
  },
  // Masterfrage aufgeloest: beide Teams haben getippt, Team-Marken an den
  // Antworten und die Zeile darunter - der hoechste Fall dieser Phase.
  'wwds-master': () => {
    const mr = Math.random; Math.random = () => 0; startWwdsActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    wwdsState.scores = wwdsState.scores.map(() => 1500);
    wwdsToBetting(); wwdsStartMaster();
    wwdsMasterSet(0, 1); wwdsMasterSet(1, 2); wwdsRevealMaster(); wwdsStopTimer();
  },
  // Die drei Zustaende, die bis 73803b1 nicht gemessen waren (HANDOFF dort).
  // Jeweils der hoechste Fall: die Runde mit den meisten Antworten, eine
  // Frage ueber zwei Zeilen, Publikumsjoker eingeblendet.
  'feud-lang': () => {
    const mr = Math.random; Math.random = () => 0; startGameActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    const rq = state.roundQuestions;
    const i = rq.reduce((b, q, k) => q.answers.length > rq[b].answers.length ? k : b, 0);
    rq[i] = Object.assign({}, rq[i], { question: 'Nennt etwas, das man auf einer langen Autofahrt mit der ganzen Familie unbedingt dabeihaben sollte!' });
    state.currentRound = i;
    showScreen('game-screen'); loadRound(); revealQuestion(); revealAnswer(0); revealAnswer(2);
  },
  'feud-finale': () => {
    const mr = Math.random; Math.random = () => 0; startGameActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    // Finalfragen gibt es nur per Import (finaleQuestions startet leer) -
    // dann die Rundenfragen nehmen, sie haben dieselbe Form.
    if (!finaleState.questions.length) finaleState.questions = state.roundQuestions.slice();
    const fq = finaleState.questions;
    const i = fq.reduce((b, q, k) => q.answers.length > fq[b].answers.length ? k : b, 0);
    finaleState.teams = [0, 1];
    finaleState.teamAnswers = [fq.map(() => 0), fq.map(() => -1)];
    finaleState.scores = [0, 0];
    finaleState.phase = 'reveal';
    finaleState.revealQ = i;
    showScreen('finale-screen');
    showEl('finale-timer', false); // wie startFinale(), das hier uebersprungen wird
    setText('finale-team-label', 'Auflösung');
    loadRevealQuestion();
  },
  // Finale, Antwortphase: Team spielt, grosse Frage, Uhr sichtbar
  // (2026-10-15, vorher nur die Aufloesung gemessen).
  'feud-finale-frage': () => {
    const mr = Math.random; Math.random = () => 0; startGameActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    if (!finaleState.questions.length) finaleState.questions = state.roundQuestions.slice();
    finaleState.teams = [0, 1];
    startFinale();
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showEl('finale-timer', true); setText('finale-timer', 20);
  },
  // DDF, PIH, TP, Ergebnis, Turnier: bis c9fbea7 nie gemessen. Je der hoechste
  // uebliche Zustand - acht Spieler mit Handy-Account (Gaeste ohne Handy
  // bekommen zusaetzlich Eingabezeilen fuer den Host, das ist ein eigener
  // Fall), DDF in der Abstimmung, PIH mit allen Geboten aufgeloest, TP mit
  // gezogener Frage und Loesung, Turnierstand mit vier Teams und sechs Spielen.
  ddf: () => {
    allPlayers = ['Anna', 'Bert', 'Carla', 'Dieter', 'Eva', 'Frank', 'Gina', 'Hugo'].map((name, i) => ({ key: 'p' + i, name, avatar: '🦊', color: '#E8453C' }));
    Object.assign(roster('ddf'), { selected: new Set(allPlayers.map(p => p.key)), guests: [], seeded: true });
    const mr = Math.random; Math.random = () => 0; startDdf(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('ddf-screen'); ddfReveal(); ddfBeginVote();
  },
  // DDF nach der Abstimmung, spaeter im Spiel: Hugo ist raus, Gina auf dem
  // letzten Herz, Dieter verliert gerade eins (2026-10-15, vorher nur die
  // laufende Abstimmung gemessen).
  'ddf-ergebnis': () => {
    allPlayers = ['Anna', 'Bert', 'Carla', 'Dieter', 'Eva', 'Frank', 'Gina', 'Hugo'].map((name, i) => ({ key: 'p' + i, name, avatar: '🦊', color: '#E8453C' }));
    Object.assign(roster('ddf'), { selected: new Set(allPlayers.map(p => p.key)), guests: [], seeded: true });
    const mr = Math.random; Math.random = () => 0; startDdf(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('ddf-screen'); ddfReveal(); ddfBeginVote();
    const pl = ddfState.players;
    pl[7].lives = 0; pl[7].out = true; pl[6].lives = 1;
    ddfState.lastCounts = { [pl[3].uid]: 4, [pl[1].uid]: 2, [pl[0].uid]: 1 };
    ddfVoteOut(pl[3].uid);
  },
  pih: () => {
    allPlayers = ['Anna', 'Bert', 'Carla', 'Dieter', 'Eva', 'Frank', 'Gina', 'Hugo'].map((name, i) => ({ key: 'p' + i, name, avatar: '🦊', color: '#E8453C' }));
    Object.assign(roster('pih'), { selected: new Set(allPlayers.map(p => p.key)), guests: [], seeded: true });
    const mr = Math.random; Math.random = () => 0; startPih(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    // Artikel mit Foto (4:3) - der uebliche Fall, das Bild teilt sich die Hoehe mit der Gebotsliste.
    const it = pihCurrentItem();
    if (it) it.media = [{ type: 'image', data: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#8a8f99"/><circle cx="400" cy="300" r="160" fill="#c9ccd2"/></svg>') }];
    showScreen('pih-screen'); pihRenderRound(); pihBeginBids();
    pihState.players.forEach((p, i) => { pihState.bids[p.uid] = { name: p.name, value: String(10 + i * 7), num: 10 + i * 7, ts: i }; });
    pihEvaluate();
  },
  // Bietphase: Foto gross, darunter nur Hinweis und Zaehler.
  'pih-gebot': () => {
    allPlayers = ['Anna', 'Bert', 'Carla', 'Dieter', 'Eva', 'Frank', 'Gina', 'Hugo'].map((name, i) => ({ key: 'p' + i, name, avatar: '🦊', color: '#E8453C' }));
    Object.assign(roster('pih'), { selected: new Set(allPlayers.map(p => p.key)), guests: [], seeded: true });
    const mr = Math.random; Math.random = () => 0; startPih(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    // Artikel mit Foto (4:3) - der uebliche Fall, das Bild teilt sich die Hoehe mit der Gebotsliste.
    const it = pihCurrentItem();
    if (it) it.media = [{ type: 'image', data: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#8a8f99"/><circle cx="400" cy="300" r="160" fill="#c9ccd2"/></svg>') }];
    showScreen('pih-screen'); pihRenderRound(); pihBeginBids();
  },
  tp: () => {
    const mr = Math.random; Math.random = () => 0; startTp(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('tp-screen'); tpBuildWheel(); tpRender();
    const mr2 = Math.random; Math.random = () => 0; tpDrawQuestion(0); Math.random = mr2;
    tpShowAnswer();
  },
  ergebnis: () => {
    const mr = Math.random; Math.random = () => 0; startGameActual(); Math.random = mr;
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    state.scores = state.scores.map((_, i) => 180 - i * 45);
    showResults();
    document.querySelectorAll('.confetti-p').forEach(e => e.remove());
  },
  turnier: () => {
    const spiele = Object.keys(TOURNAMENT_GAMES);
    tournament = tournamentClean({
      name: 'Spieleabend', teams: ['Team Rot', 'Team Blau', 'Team Grün', 'Team Gelb'],
      games: spiele.concat(spiele).slice(0, 6).map((game, i) => ({
        game, weight: 1 + (i % 2), date: '2026-10-10', secret: false,
        done: i < 4, scores: i < 4 ? [300 - i * 20, 250, 180 + i * 30, 120] : null,
      })),
    });
    tournamentShowBoard();
  },
  // Host-Seite des Turniers (Spielplan-Editor, Depot offen). Kommt nicht auf
  // die Leinwand und darf scrollen - deshalb ohne Hoehenpruefung
  // (HOST_SEITEN). Da fuer die Farben in hellen Richtungen (56de705 ff.).
  'turnier-host': () => {
    const spiele = Object.keys(TOURNAMENT_GAMES);
    tournament = tournamentClean({
      name: 'Spieleabend', teams: ['Team Rot', 'Team Blau', 'Team Grün', 'Team Gelb'],
      games: spiele.concat(spiele).slice(0, 6).map((game, i) => ({
        game, weight: 1 + (i % 2), date: 'Freitag', secret: i === 5,
        done: i < 3, scores: i < 3 ? [300 - i * 20, 250, 180 + i * 30, 120] : null,
      })),
    });
    tournamentDataOpen = true;
    showScreen('tournament-screen'); renderTournament();
  },
  'wwm-joker': () => {
    startWwmActual();
    document.querySelectorAll('.intro-overlay,.black-backdrop,.welcome-overlay').forEach(e => e.remove());
    showScreen('wwm-screen'); loadWwmQuestion();
    const mr = Math.random; Math.random = () => 0.5; wwmAudience(); Math.random = mr;
  },
};
AUFBAU.gm = AUFBAU.feud;
// gm-menu baut Jeopardy auf; beendet wird danach in hostSeite().
AUFBAU['gm-menu'] = AUFBAU.jeop;

// Node (shots.js) und Browser (Durchgeh-Seite) aus einer Datei bedienen.
// Im Browser muss AUFBAU ausdruecklich ans window: ein const auf oberster
// Ebene eines klassischen Scripts landet dort NICHT von allein (anders als
// var), und die Durchgeh-Seite greift aus ihrem Rahmen darauf zu.
if (typeof module !== 'undefined' && module.exports) module.exports = { AUFBAU };
else if (typeof window !== 'undefined') window.AUFBAU = AUFBAU;
