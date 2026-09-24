// @ts-check
/* ═══ TRIVIAL PURSUIT ═══════════════════════════════════════════════════════
   Sechs Kategorien, sechs Tortenstuecke. Wer alle sechs hat, spielt die
   Schlussfrage - und gewinnt erst, wenn die sitzt.

   Warum kein Spielbrett mit Feldern: das Brett ist im Original der
   Zufallsgenerator (Wuerfel plus Laufweg). Auf einem Beamer vor Publikum
   waere es totes Bild - man sieht Figuren kriechen, niemand hat etwas davon.
   Hier macht das Gluecksrad denselben Job in drei Sekunden und ist dabei das,
   was ein Spielbrett nie ist: eine Show. Die Regeln, auf die es ankommt
   (richtig = weiter, Stueck nur einmal je Kategorie, alle sechs = Finale),
   bleiben unveraendert.

   Die Teams kommen aus derselben Setup-Leiste wie bei Feud, Jeopardy und
   WWDS. Der Buzzer wird nur fuer das Nachfassen gebraucht: liegt das Team am
   Zug daneben, duerfen die anderen darum buzzern. Das ist der einzige Moment,
   in dem die Handys hier mitspielen - deshalb haengt das Spiel am
   feudBuzzer-Kanal und braucht keinen eigenen.
   ════════════════════════════════════════════════════════════════════════ */

/** Eine Frage. Beide Felder sind immer da, auch wenn sie leer sind - so muss
 *  keine Anzeige auf undefined pruefen.
 *  @typedef {{ q: string, a: string }} TpQuestion */

/** Eine Kategorie. Farbe und Zeichen gehoeren zur Kategorie, nicht zur
 *  Anzeige: Rad, Tortenstueck und Fragekarte muessen dieselbe Farbe zeigen,
 *  sonst ist nicht erkennbar, worum gerade gespielt wird.
 *  @typedef {{ name: string, color: string, icon: string, questions: TpQuestion[] }} TpCategory */

/* Wie viele Tortenstuecke es gibt, bestimmt der Host. Sechs sind das Original
   und die Voreinstellung; unter drei bleibt vom Spiel nichts uebrig, ueber
   acht wird das Rad unlesbar. Rad, Torte und Wertung rechnen deshalb ueberall
   mit tpCatCount(), nicht mit einer festen Zahl. */
const TP_MIN_CATS = 3;
const TP_MAX_CATS = 8;
function tpCatCount(){ return tpData.categories.length; }

/* Die sechs Kategorien sind fest - sie sind die sechs Tortenstuecke. Ihre
   Namen darf der Host aendern, ihre Anzahl nicht: bei fuenf oder sieben
   stimmt die Torte nicht mehr, und der ganze Reiz des Spiels haengt an den
   sechs Stuecken. Die Farben sind die des Originals. */
let tpData = {
  /** @type {TpCategory[]} */
  categories: [
    { name:'Erdkunde', color:'#3B82F6', icon:'🌍', questions:[
      { q:'Welches Land hat die meisten Zeitzonen?', a:'Frankreich (12, wegen der Ueberseegebiete)' },
      { q:'Durch wie viele Laender fliesst die Donau?', a:'Zehn' },
      { q:'Welche Hauptstadt liegt am hoechsten?', a:'La Paz, Bolivien' },
      { q:'Wie heisst die groesste Insel der Welt?', a:'Groenland' },
    ]},
    { name:'Unterhaltung', color:'#EC4899', icon:'🎬', questions:[
      { q:'Welcher Film gewann 2020 als erster nicht-englischsprachiger den Oscar als bester Film?', a:'Parasite' },
      { q:'Wie heisst der Schauspieler hinter Darth Vaders Maske in Episode IV?', a:'David Prowse' },
      { q:'Welche Band veroeffentlichte "The Dark Side of the Moon"?', a:'Pink Floyd' },
      { q:'Wie viele Staffeln hat "Breaking Bad"?', a:'Fuenf' },
    ]},
    { name:'Geschichte', color:'#FFD23F', icon:'📜', questions:[
      { q:'In welchem Jahr fiel die Berliner Mauer?', a:'1989' },
      { q:'Wer war der erste Bundeskanzler der Bundesrepublik?', a:'Konrad Adenauer' },
      { q:'Wie lange dauerte der Hundertjaehrige Krieg?', a:'116 Jahre' },
      { q:'Welches Reich regierte Kaiser Augustus?', a:'Das Roemische Reich' },
    ]},
    { name:'Kunst & Literatur', color:'#A16207', icon:'🎭', questions:[
      { q:'Wer schrieb "Die Verwandlung"?', a:'Franz Kafka' },
      { q:'In welchem Museum haengt die Mona Lisa?', a:'Louvre, Paris' },
      { q:'Wer malte "Die Sternennacht"?', a:'Vincent van Gogh' },
      { q:'Wie heisst der erste Band von Goethes "Faust"?', a:'Der Tragoedie erster Teil' },
    ]},
    { name:'Wissenschaft', color:'#22C55E', icon:'🔬', questions:[
      { q:'Welches Element hat die Ordnungszahl 1?', a:'Wasserstoff' },
      { q:'Wie viele Knochen hat ein erwachsener Mensch?', a:'206' },
      { q:'Wofuer steht DNA?', a:'Desoxyribonukleinsaeure' },
      { q:'Welcher Planet hat die meisten bestaetigten Monde?', a:'Saturn' },
    ]},
    { name:'Sport & Freizeit', color:'#F97316', icon:'⚽', questions:[
      { q:'Wie viele Spieler stehen bei einem Volleyballteam auf dem Feld?', a:'Sechs' },
      { q:'Welches Land gewann die erste Fussball-WM 1930?', a:'Uruguay' },
      { q:'Wie viele Loecher hat ein Golfplatz in der Standardrunde?', a:'18' },
      { q:'In welcher Sportart gibt es den Begriff "Hattrick" urspruenglich?', a:'Cricket' },
    ]},
  ],
};

let tpState = {
  active: false,
  /** @type {string[]} */
  teamNames: [],
  /** Wer welches Tortenstueck hat. wedges[team][kategorie]
   *  @type {boolean[][]} */
  wedges: [],
  turn: 0,
  /** spin = Rad drehen, question = Frage steht, answer = Antwort aufgedeckt,
   *  steal = Nachfassen laeuft, final = Schlussfrage, done = gewonnen.
   *  @type {'spin'|'question'|'answer'|'steal'|'final'|'done'} */
  phase: 'spin',
  cat: -1,
  /** @type {TpQuestion|null} */
  clue: null,
  /** Schon gestellte Fragen je Kategorie, damit sich in einer Show nichts
   *  wiederholt.
   *  @type {number[][]} */
  used: [],
  spinning: false,
  /** Wie weit das Rad insgesamt gedreht ist. Der Wert waechst immer weiter,
   *  nie zurueck - sonst dreht das Rad beim naechsten Mal rueckwaerts, weil
   *  CSS den kuerzesten Weg nimmt. */
  angle: 0,
  /** Welches Team gerade das Finale spielt, sonst -1. */
  finalTeam: -1,
  winner: -1,
  settings: { steal: true, again: true },
};

/* ── Start ──────────────────────────────────────────────────────────────── */

function tpToggleTeam3(){
  showEl('tp-t3-card', fieldChecked('tp-enable-team3'));
  broadcastTpSetupTeamNames();
}
/* Die sechs Kategorien auf dem Setup-Screen. Das ist nicht Schmuck: der Host
   sieht hier vor dem Start, was geladen ist und wie viele Fragen je Farbe
   bereitliegen. Eine leere Kategorie faellt sonst erst auf, wenn das Rad im
   Spiel darauf stehen bleibt - und dann ist der Zug weg. */
function renderTpCatPreview(){
  const html = tpData.categories.map(c => {
    const n = c.questions.length;
    return `<div class="tp-chip${n ? '' : ' leer'}" style="--c:${escAttr(c.color)};">
      <span class="tp-chip-icon">${c.icon}</span>
      <span class="tp-chip-name">${escAttr(c.name)}</span>
      <span class="tp-chip-count">${n ? n : '!'}</span>
    </div>`;
  }).join('');
  setHtml('tp-cat-preview', html);
  setText('tp-cat-head', tpData.categories.length + ' Tortenstücke');
}

function broadcastTpSetupTeamNames(){ broadcastSetupTeamNames('tp'); }
function ensureTpLobbyConnected(){ ensureLobbyConnected('tp'); }

function startTp(){
  // Eine Kategorie ohne Frage kann das Rad zwar treffen, aber nie vergeben -
  // das Tortenstueck bliebe fuer immer leer und niemand koennte gewinnen. Das
  // faellt sonst erst nach einer halben Stunde auf.
  const leer = tpData.categories.filter(c => !c.questions.length).map(c => c.name);
  if (leer.length){
    alert('Ohne Fragen geht es nicht: ' + leer.join(', ') + '\nDiese Tortenstücke wären nie zu gewinnen.');
    return;
  }
  // Das Zuschauerfenster gehoert zu jeder Show. Erst nach der Pruefung oben:
  // ein abgebrochener Start soll kein leeres Fenster aufmachen.
  openBoardPopout();

  const names = lobbyTeamNames('tp');
  tpState.active = true;
  tpState.teamNames = names;
  tpState.wedges = names.map(() => Array.from({ length: tpCatCount() }, () => false));
  tpState.used = Array.from({ length: tpCatCount() }, () => []);
  tpState.turn = 0;
  tpState.phase = 'spin';
  tpState.cat = -1;
  tpState.clue = null;
  tpState.angle = 0;
  tpState.spinning = false;
  tpState.finalTeam = -1;
  tpState.winner = -1;
  tpState.settings.steal = fieldChecked('tp-steal-check');
  tpState.settings.again = fieldChecked('tp-again-check');
  tpSaveSettings();

  activeBuzzerContext = 'tp';
  feudBuzzConnect();
  buzzerBroadcastTeams(names);
  lockBuzzerJoins(feudBuzzer);
  feudBuzzClose();

  tpIntroThenGame();
}

function tpQuit(){
  tpState.active = false;
  feudBuzzClose();
  showScreen('menu-screen');
  updateGamemaster();
}

/* ── Rad ────────────────────────────────────────────────────────────────── */

/* Das Rad wird einmal gebaut und danach nur noch gedreht. Wuerde es bei jedem
   Rendern neu aufgebaut, ginge die laufende Drehung verloren - ein frisches
   Element hat keine Animation. */
function tpBuildWheel(){
  const seg = 360 / tpCatCount();
  const stops = tpData.categories
    .map((c, i) => `${c.color} ${i*seg}deg ${(i+1)*seg}deg`)
    .join(',');
  const labels = tpData.categories.map((c, i) => {
    // Beschriftung in die Mitte des eigenen Segments drehen und dort wieder
    // aufrichten, sonst steht die Haelfte der Namen auf dem Kopf.
    const mid = i*seg + seg/2;
    return `<span class="tp-wlabel" style="transform:rotate(${mid}deg) translateY(-86px) rotate(${-mid}deg);">${c.icon}</span>`;
  }).join('');
  const rotor = document.getElementById('tp-wheel-rotor');
  if (rotor) rotor.style.background = `conic-gradient(${stops})`;
  setHtml('tp-wheel-labels', labels);
}

/** Welche Kategorien noch ungestellte Fragen haben.
 *  @returns {number[]} */
function tpOpenCats(){
  const open = [];
  for (let i = 0; i < tpCatCount(); i++){
    const cat = tpData.categories[i];
    if (cat && cat.questions.length > (tpState.used[i] || []).length) open.push(i);
  }
  return open;
}

/* Wie lange die Drehung laeuft. Muss zur transition-Dauer von .tp-wheel-rotor
   in styles.css passen: der Wert hier entscheidet, wann die Frage erscheint.
   Wer Bewegung reduziert hat, bekommt dort eine kurze Drehung - ohne diesen
   Zweig stuende das Rad danach fast drei Sekunden still herum. */
function tpSpinMs(){
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduced ? 500 : 3200;
}

function tpSpin(){
  if (tpState.spinning || tpState.phase !== 'spin' || !tpState.active) return;
  let pool = tpOpenCats();
  // Alles einmal durch: die Kategorien werden wieder freigegeben, statt das
  // Spiel abzubrechen. Eine Wiederholung ist unangenehmer als ein Abbruch
  // mitten in der Show - aber nur ein bisschen, und der Host merkt es sofort.
  if (!pool.length){
    tpState.used = Array.from({ length: tpCatCount() }, () => []);
    pool = tpOpenCats();
  }
  if (!pool.length) return;
  const cat = pool[Math.floor(Math.random() * pool.length)];

  tpState.spinning = true;
  tpRender();
  const seg = 360 / tpCatCount();
  // Der Zeiger steht oben. Damit die Mitte des Segments unter ihm landet,
  // muss um dessen Mittelwinkel zurueckgedreht werden - plus vier volle
  // Umdrehungen, damit es nach Drehen aussieht und nicht nach Umschalten.
  const target = 360*4 + (360 - (cat*seg + seg/2));
  tpState.angle += target;
  const rotor = document.getElementById('tp-wheel-rotor');
  if (rotor) rotor.style.transform = `rotate(${tpState.angle}deg)`;
  SFX.tick();
  setTimeout(() => {
    tpState.spinning = false;
    tpDrawQuestion(cat);
  }, tpSpinMs());
}

/** Zieht die naechste ungestellte Frage der Kategorie.
 *  @param {number} cat */
function tpDrawQuestion(cat){
  const category = tpData.categories[cat];
  if (!category || !category.questions.length) { tpNextTeam(); return; }
  const used = tpState.used[cat] || (tpState.used[cat] = []);
  const open = category.questions.map((_, i) => i).filter(i => !used.includes(i));
  const pick = open.length ? open[Math.floor(Math.random() * open.length)] : 0;
  used.push(pick);
  tpState.cat = cat;
  tpState.clue = category.questions[pick];
  tpState.phase = tpState.finalTeam >= 0 ? 'final' : 'question';
  SFX.point();
  tpRender();
  updateGamemaster();
}

/* ── Fragelauf ──────────────────────────────────────────────────────────── */

function tpShowAnswer(){
  if (tpState.phase !== 'question' && tpState.phase !== 'final' && tpState.phase !== 'steal') return;
  // Auch im Finale heisst der Zustand 'answer'. Ob es die Schlussfrage war,
  // steht in finalTeam - das entscheidet spaeter, wie geurteilt wird.
  tpState.phase = 'answer';
  tpRender();
  updateGamemaster();
}

/** Der Host urteilt ueber die Antwort des Teams am Zug.
 *  @param {boolean} ok */
function tpJudge(ok){
  if (tpState.finalTeam >= 0) return tpJudgeFinal(ok);
  if (tpState.cat < 0) return;
  if (ok){
    SFX.correct();
    tpAward(tpState.turn, tpState.cat);
    if (tpHasAll(tpState.turn)) return tpEnterFinal(tpState.turn);
    // Im Original darf weiterspielen, wer richtig liegt. Abschaltbar, weil ein
    // starkes Team sonst eine halbe Stunde am Stueck dran ist und der Rest
    // zusieht - auf einer Party ist das der sichere Weg, Leute zu verlieren.
    if (tpState.settings.again){ tpState.phase = 'spin'; tpState.clue = null; tpState.cat = -1; tpRender(); updateGamemaster(); return; }
    return tpNextTeam();
  }
  SFX.wrong();
  if (tpState.settings.steal && tpState.teamNames.length > 1) return tpOpenSteal();
  tpNextTeam();
}

/** Traegt ein Tortenstueck ein. Doppelt bekommt es niemand - genau das macht
 *  die Torte zum Fortschrittsbalken.
 *  @param {number} team
 *  @param {number} cat */
function tpAward(team, cat){
  if (!tpState.wedges[team]) return;
  if (tpState.wedges[team][cat]) return;
  tpState.wedges[team][cat] = true;
  SFX.fanfare(false);
}

/** @param {number} team */
function tpHasAll(team){
  const w = tpState.wedges[team] || [];
  return w.length === tpCatCount() && w.every(Boolean);
}

function tpNextTeam(){
  feudBuzzClose();
  tpState.turn = (tpState.turn + 1) % Math.max(1, tpState.teamNames.length);
  // Wer schon alle sechs Stuecke hat, spielt sofort wieder um die
  // Schlussfrage. Ohne diese Zeile faellt ein Finalist nach einem Fehlversuch
  // stillschweigend in den normalen Ablauf zurueck und kann nie gewinnen.
  tpState.finalTeam = tpHasAll(tpState.turn) ? tpState.turn : -1;
  tpState.phase = 'spin';
  tpState.clue = null;
  tpState.cat = -1;
  tpRender();
  updateGamemaster();
}

/* ── Nachfassen ─────────────────────────────────────────────────────────── */

function tpOpenSteal(){
  tpState.phase = 'steal';
  // Die Handys entscheiden nur die Reihenfolge, nicht die Wertung: wer zuerst
  // buzzert, darf zuerst sagen - ob es stimmt, urteilt weiterhin der Host.
  feudBuzzPrepare();
  feudBuzzArm();
  tpRender();
  updateGamemaster();
}

/** Ein anderes Team hat nachgefasst und lag richtig.
 *  @param {number} team */
function tpStealAward(team){
  if (tpState.phase !== 'steal' || tpState.cat < 0) return;
  SFX.correct();
  tpAward(team, tpState.cat);
  feudBuzzClose();
  if (tpHasAll(team)) return tpEnterFinal(team);
  // Wer nachfasst, ist als Naechstes dran - sonst lohnt sich das Nachfassen
  // nur halb und alle warten lieber ab.
  tpState.turn = team;
  tpState.phase = 'spin';
  tpState.clue = null;
  tpState.cat = -1;
  tpRender();
  updateGamemaster();
}

function tpStealNobody(){
  if (tpState.phase !== 'steal') return;
  SFX.wrong();
  tpNextTeam();
}

/* ── Schlussfrage ───────────────────────────────────────────────────────── */

/** @param {number} team */
function tpEnterFinal(team){
  tpState.finalTeam = team;
  tpState.phase = 'spin';
  tpState.clue = null;
  tpState.cat = -1;
  SFX.fanfare(true);
  tpRender();
  updateGamemaster();
}

/** @param {boolean} ok */
function tpJudgeFinal(ok){
  if (ok){
    tpState.winner = tpState.finalTeam;
    tpState.phase = 'done';
    SFX.fanfare(true);
    tpRender();
    updateGamemaster();
    return;
  }
  // Danebengelegen: die Torte bleibt, die Schlussfrage kommt beim naechsten
  // eigenen Zug wieder (siehe tpNextTeam). Ein Team, das alles hat, verliert
  // seinen Vorsprung nicht - es muss nur noch einmal ran.
  SFX.wrong();
  tpState.finalTeam = -1;
  tpNextTeam();
}

/* ── Anzeige ────────────────────────────────────────────────────────────── */

/** Die Torte eines Teams als SVG. Sechs Sektoren, gefuellt was da ist.
 *  @param {number} team
 *  @param {number} size
 *  @returns {string} */
function tpWedgeSvg(team, size){
  const r = 46, cx = 50, cy = 50;
  const owned = tpState.wedges[team] || [];
  const seg = 360 / tpCatCount();
  const parts = tpData.categories.map((c, i) => {
    const a0 = (i*seg - 90) * Math.PI/180;
    const a1 = ((i+1)*seg - 90) * Math.PI/180;
    const x0 = cx + r*Math.cos(a0), y0 = cy + r*Math.sin(a0);
    const x1 = cx + r*Math.cos(a1), y1 = cy + r*Math.sin(a1);
    const has = !!owned[i];
    return `<path d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0,1 ${x1.toFixed(2)},${y1.toFixed(2)} Z"
      fill="${has ? c.color : 'rgba(255,255,255,.05)'}" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>`;
  }).join('');
  return `<svg class="tp-pie" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${parts}
    <circle cx="${cx}" cy="${cy}" r="11" fill="#0b0e2c" stroke="rgba(255,255,255,.25)" stroke-width="1.5"/></svg>`;
}

function tpRenderTeams(){
  const html = tpState.teamNames.map((name, i) => {
    const count = (tpState.wedges[i] || []).filter(Boolean).length;
    const isTurn = i === tpState.turn && tpState.phase !== 'done';
    const isFinal = tpHasAll(i);
    return `<div class="tp-team ${TEAM_COLORS[i] || ''}${isTurn ? ' turn' : ''}">
      ${tpWedgeSvg(i, 92)}
      <div class="tp-team-name">${escAttr(name)}</div>
      <div class="tp-team-sub">${tpState.winner === i ? '🏆 Sieger' : isFinal ? '🏁 Schlussfrage' : count + ' von ' + tpCatCount()}</div>
    </div>`;
  }).join('');
  setHtml('tp-teams', html);
}

function tpCatChipHtml(){
  const c = tpData.categories[tpState.cat];
  if (!c) return '';
  return `<div class="tp-catchip" style="background:${c.color};">${c.icon} ${escAttr(c.name)}</div>`;
}

function tpRenderStage(){
  if (tpState.phase === 'done'){
    const name = tpState.teamNames[tpState.winner] || 'Das Team';
    setHtml('tp-stage', `<div class="tp-win">
      <div class="tp-win-title">🏆 ${escAttr(name)} gewinnt</div>
      <div class="tp-win-sub">Alle sechs Stücke und die Schlussfrage.</div>
      ${tpWedgeSvg(tpState.winner, 190)}
    </div>`);
    return;
  }
  if (tpState.phase === 'spin'){
    const finalNow = tpState.finalTeam >= 0 || tpHasAll(tpState.turn);
    setHtml('tp-stage', `<div class="tp-hint">
      ${finalNow
        ? 'Alle sechs Stücke sind da — jetzt geht es um die <b>Schlussfrage</b>. Rad drehen für die Kategorie.'
        : 'Rad drehen und die Kategorie ausspielen.'}
    </div>`);
    return;
  }
  const clue = tpState.clue;
  if (!clue) { setHtml('tp-stage', ''); return; }
  const answer = (tpState.phase === 'answer')
    ? `<div class="tp-answer">${escAttr(clue.a)}</div>`
    : `<div class="tp-answer hidden">Antwort verdeckt</div>`;
  const steal = tpState.phase === 'steal'
    ? `<div class="tp-steal">🔔 Nachfassen läuft — die anderen Teams dürfen buzzern.</div>`
    : '';
  setHtml('tp-stage', `${tpCatChipHtml()}
    <div class="tp-question">${escAttr(clue.q)}</div>
    ${answer}${steal}`);
}

function tpRenderControls(){
  const btn = (label, fn, cls) => `<button class="btn ${cls || 'btn-secondary'}" onclick="${fn}">${label}</button>`;
  let html = '';
  if (tpState.phase === 'spin'){
    html = btn(tpState.spinning ? 'dreht…' : '🎡 Rad drehen', 'tpSpin()', 'btn-primary');
  } else if (tpState.phase === 'question' || tpState.phase === 'final'){
    html = btn('Antwort zeigen', 'tpShowAnswer()', 'btn-primary')
         + btn('✓ Richtig', 'tpJudge(true)', 'btn-accent')
         + btn('✕ Falsch', 'tpJudge(false)', 'btn-danger');
  } else if (tpState.phase === 'answer'){
    html = btn('✓ Richtig', 'tpJudge(true)', 'btn-accent')
         + btn('✕ Falsch', 'tpJudge(false)', 'btn-danger');
  } else if (tpState.phase === 'steal'){
    html = tpState.teamNames.map((n, i) => i === tpState.turn ? '' :
      btn('✓ ' + escAttr(n), `tpStealAward(${i})`, 'btn-accent')).join('')
      + btn('Niemand', 'tpStealNobody()');
  }
  html += btn('Beenden', 'tpQuit()');
  setHtml('tp-controls', html);
}

function tpRender(){
  if (!tpState.active) return;
  tpRenderTeams();
  tpRenderStage();
  tpRenderControls();
  const finalNow = tpState.finalTeam >= 0;
  setText('tp-info', finalNow ? 'Schlussfrage' : 'Runde läuft');
  setText('tp-turn', tpState.phase === 'done'
    ? '—'
    : (tpState.teamNames[tpState.turn] || 'Team 1'));
}

/* ── Editor ─────────────────────────────────────────────────────────────── */

let tpEditOpen = 0;

function tpToggleCat(i){ tpEditOpen = (tpEditOpen === i ? -1 : i); renderTpEditor(); }

function renderTpEditor(){
  const html = tpData.categories.map((c, i) => {
    const open = tpEditOpen === i;
    const rows = c.questions.map((q, j) => `
      <div class="q-list-item" style="gap:8px;">
        <input type="text" value="${escAttr(q.q)}" placeholder="Frage" style="flex:3;min-width:0;" oninput="tpSetQ(${i},${j},this)">
        <input type="text" value="${escAttr(q.a)}" placeholder="Antwort" style="flex:2;min-width:0;" oninput="tpSetA(${i},${j},this)">
        <button class="btn btn-danger btn-sm" onclick="tpDelQuestion(${i},${j})">✕</button>
      </div>`).join('') || `<div class="pr-empty">Noch keine Frage in dieser Kategorie.</div>`;
    return `<div class="editor-card" style="border-left:6px solid ${c.color};">
      <div class="panel-head" onclick="tpToggleCat(${i})" style="cursor:pointer;">
        <span class="tp-cat-edit" onclick="event.stopPropagation()">
          <input type="color" class="tp-cat-color" value="${escAttr(c.color)}" title="Farbe des Tortenstücks"
                 oninput="tpSetCatColor(${i},this)">
          <input type="text" class="tp-cat-icon" value="${escAttr(c.icon)}" maxlength="4" title="Zeichen"
                 oninput="tpSetCatIcon(${i},this)">
          <input type="text" class="tp-cat-name" value="${escAttr(c.name)}" placeholder="Kategorie"
                 oninput="tpSetCatName(${i},this)">
        </span>
        <span class="badge">${c.questions.length}</span>
        <button class="btn btn-danger btn-sm" title="Kategorie löschen" ${tpCatCount() <= TP_MIN_CATS ? 'disabled' : ''}
                onclick="event.stopPropagation();tpDelCat(${i})">✕</button>
      </div>
      ${open ? `<div style="margin-top:10px;">${rows}
        <div class="panel-row">
          <button class="btn btn-accent btn-sm" onclick="tpAddQuestion(${i})">+ Frage</button>
        </div>
        ${bulkPanelHtml({ id:'tp-bulk-'+i, label:'Mehrere auf einmal (Frage # Antwort)',
          placeholder:'Wie hoch ist der Eiffelturm? # 330 Meter&#10;Wer schrieb Faust? # Goethe',
          onAdd:'tpBulkAdd('+i+')' })}
      </div>` : ''}
    </div>`;
  }).join('');
  setHtml('tp-editor-grid', html);
}

function tpSetQ(i, j, input){ tpData.categories[i].questions[j].q = input.value; tpSave(); }
function tpSetA(i, j, input){ tpData.categories[i].questions[j].a = input.value; tpSave(); }
function tpSetCatName(i, input){ tpData.categories[i].name = input.value; tpSave(); renderTpCatPreview(); }
function tpSetCatIcon(i, input){ tpData.categories[i].icon = input.value; tpSave(); renderTpCatPreview(); }
/* Die Farbe wird im Editor als Streifen am Kartenrand gezeigt - der muss
   mitgehen, deshalb hier ein Neuzeichnen. Name und Zeichen stehen in
   Eingabefeldern; die duerfen NICHT neu gebaut werden, sonst springt beim
   Tippen der Cursor ans Ende. */
function tpSetCatColor(i, input){
  tpData.categories[i].color = input.value;
  tpSave();
  renderTpEditor();
  renderTpCatPreview();
}

/* Startfarben fuer neue Kategorien. Der Host darf jede aendern - hier steht
   nur, womit eine neue anfaengt, damit zwei frische nicht denselben Ton
   bekommen und auf dem Rad verschmelzen. */
const TP_NEW_COLORS = ['#8B5CF6','#14B8A6','#F43F5E','#84CC16','#0EA5E9','#D946EF','#FB923C','#64748B'];

function tpAddCat(){
  if (tpCatCount() >= TP_MAX_CATS) { alert('Mehr als ' + TP_MAX_CATS + ' Tortenstücke werden auf dem Rad unlesbar.'); return; }
  const used = tpData.categories.map(c => String(c.color || '').toUpperCase());
  const color = TP_NEW_COLORS.find(c => !used.includes(c.toUpperCase())) || TP_NEW_COLORS[0];
  tpData.categories.push({ name:'Neue Kategorie', color, icon:'❓', questions:[] });
  tpEditOpen = tpCatCount() - 1;
  tpSave();
  renderTpEditor();
  renderTpCatPreview();
}

function tpDelCat(i){
  if (tpCatCount() <= TP_MIN_CATS) { alert('Unter ' + TP_MIN_CATS + ' Tortenstücken bleibt vom Spiel nichts übrig.'); return; }
  const c = tpData.categories[i];
  if (c.questions.length && !confirm('"' + c.name + '" mit ' + c.questions.length + ' Fragen löschen?')) return;
  tpData.categories.splice(i, 1);
  if (tpEditOpen >= tpCatCount()) tpEditOpen = tpCatCount() - 1;
  tpSave();
  renderTpEditor();
  renderTpCatPreview();
}
function tpAddQuestion(i){ tpData.categories[i].questions.push({ q:'', a:'' }); tpSave(); renderTpEditor(); }
function tpDelQuestion(i, j){ tpData.categories[i].questions.splice(j, 1); tpSave(); renderTpEditor(); }

function tpBulkAdd(i){
  const lines = bulkLines('tp-bulk-' + i);
  if (!lines || !lines.length) return;
  lines.forEach(line => {
    const { left, right } = splitBulkLine(line);
    if (left) tpData.categories[i].questions.push({ q:left, a:right });
  });
  tpSave();
  renderTpEditor();
}

/* ── Speichern ──────────────────────────────────────────────────────────── */

function tpSave(){ storeSetJson('tpData', tpData); }
function tpLoad(){ tpData = storeGetJson('tpData', tpData); }
function tpSaveSettings(){ storeSetJson('tpSettings', tpState.settings); }
/* Die Regeln stehen im Fragen-Editor, nicht mehr im Setup: es sind
   Eigenschaften der Fragerunde, kein Startparameter, und der Setup-Screen
   soll zeigen, was gespielt wird, statt wie. Sie werden deshalb sofort beim
   Umschalten gesichert - wer sie setzt und dann ueber das Menue in ein
   anderes Spiel geht, kommt sonst mit dem alten Stand zurueck. */
function tpSaveRules(){
  tpState.settings.again = fieldChecked('tp-again-check');
  tpState.settings.steal = fieldChecked('tp-steal-check');
  tpSaveSettings();
}
function tpLoadSettings(){
  tpState.settings = storeGetJson('tpSettings', tpState.settings);
  const el = fieldEl('tp-steal-check'); if (el) el.checked = !!tpState.settings.steal;
  const el2 = fieldEl('tp-again-check'); if (el2) el2.checked = !!tpState.settings.again;
}

function exportTp(){ downloadJSON(tpData, 'trivial-pursuit.json'); }
function importTp(e){
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(String(r.result));
      // Die Spanne ist Bedingung, nicht Empfehlung. Ohne diese Pruefung faellt
      // eine kaputte Datei erst mitten in der Show auf.
      if (!d || !Array.isArray(d.categories)
          || d.categories.length < TP_MIN_CATS || d.categories.length > TP_MAX_CATS){
        alert('Die Datei braucht ' + TP_MIN_CATS + ' bis ' + TP_MAX_CATS + ' Kategorien.');
        return;
      }
      tpData = d;
      tpSave();
      renderTpEditor();
    } catch { alert('Datei konnte nicht gelesen werden.'); }
  };
  r.readAsText(f);
  e.target.value = '';
}

tpLoad();

/* ── INTRO UND ANLEITUNG ───────────────────────────────────────────────────
   Wie bei Feud und Jeopardy: Zeichen, Anleitung, Titelkarte, dann das Spiel.
   Kein openGamemaster() - dieses Spiel hat kein GM-Panel. */
function tpIntroThenGame(){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const old = document.querySelector('.black-backdrop');
  if (old) old.remove();
  addBlackBackdrop();
  // Schon jetzt oeffnen, damit Intro und Anleitung vom GM-Fenster (und vom
  // Handy-Gamepad) aus weitergeklickt werden koennen.
  openGamemaster();
  const ov = document.createElement('div');
  ov.className = 'intro-overlay';
  ov.innerHTML = `<div class="game-intro-sign">${gameCardIcon('tp')}</div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', () => closeOverlay(ov, () => {
    runTutorial(tpTutorialSlides(), tpShowTitle);
  }));
}

function tpShowTitle(){
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="game-title-sign">${gameCardIcon('tp')}</div>
    <div class="welcome-line1">Es beginnt</div>
    <div class="welcome-line2">Trivial Pursuit</div>
  `, 1800, () => {
    showScreen('tp-screen');
    tpBuildWheel();
    tpRender();
    fadeOutBackdrop(document.querySelector('.black-backdrop'));
  });
}

function showTpTutorial(){ runTutorial(tpTutorialSlides()); }

/* Die Anleitung zeigt die echten Kategorien und die eingestellten Regeln -
   bei eigenen Kategorien wäre eine Erklärung mit "Erdkunde, Sport, ..."
   schlicht falsch. */
function tpTutorialSlides(){
  const n = tpCatCount();
  const chips = tpData.categories.map(c =>
    `<div class="tut-tp-chip" style="--c:${escAttr(c.color)};">${c.icon} ${escapeHtml(c.name)}</div>`).join('');
  const again = tpState.settings.again;
  const steal = tpState.settings.steal;
  return [
    `<div class="tut-star-anim" style="margin-bottom:10px;">${gameCardIcon('tp')}</div>
     <div class="tut-big tut-gold" style="font-size:3rem;">Trivial<br>Pursuit</div>
     <div class="tut-sub">${n} Tortenstücke. Wer alle hat, spielt um den Sieg.</div>`,

    `<div class="tut-big tut-white" style="font-size:2.2rem;margin-bottom:10px;">Das Rad entscheidet</div>
     <div class="tut-tp-chips">${chips}</div>
     <div class="tut-sub">Kein Würfeln, kein Laufweg: einmal drehen,<br>
       und die Kategorie steht fest.</div>`,

    `<div class="tut-icon">🥧</div>
     <div class="tut-big tut-gold" style="font-size:2.3rem;">Richtig = ein Stück</div>
     <div class="tut-sub">Jede Kategorie gibt es <b>einmal</b> — die Torte ist
       euer Fortschritt.<br>
       ${again ? 'Wer richtig liegt, dreht gleich nochmal.' : 'Danach ist das nächste Team dran.'}</div>`,

    steal
      ? `<div class="tut-icon">🔔</div>
         <div class="tut-big tut-white" style="font-size:2.3rem;">Falsch? Nachfassen!</div>
         <div class="tut-sub">Liegt das Team am Zug daneben, dürfen die anderen
           darum <b>buzzern</b>.<br>
           Wer nachfasst und trifft, bekommt das Stück <b>und</b> den Zug.</div>`
      : `<div class="tut-icon">➡️</div>
         <div class="tut-big tut-white" style="font-size:2.3rem;">Falsch? Weiter.</div>
         <div class="tut-sub">Liegt das Team daneben, ist das nächste dran.<br>
           Nachfassen ist in dieser Runde ausgeschaltet.</div>`,

    `<div class="tut-icon tut-trophy-bounce">🏆</div>
     <div class="tut-big tut-gold" style="font-size:2.5rem;">Alle ${n} Stücke<br>und dann?</div>
     <div class="tut-sub">Dann kommt die <b>Schlussfrage</b>.<br>
       Erst wenn die sitzt, ist das Spiel gewonnen —<br>
       daneben heißt: beim nächsten Zug nochmal.</div>`,
  ];
}

/* ── GAMEMASTER-PANEL ──────────────────────────────────────────────────────
   Siehe ddf.js: ohne Panel ist die Show nur am Hauptrechner moderierbar, weil
   das Handy-Gamepad genau dieses Fenster spiegelt. */
function tpGmControlsHtml(pfx){
  const s = tpState;
  let b = '';
  if (s.phase === 'spin'){
    b += `<button class="gm-btn gm-gold" onclick="${pfx}tpSpin()">${s.spinning ? 'dreht…' : '🎡 Rad drehen'}</button>`;
  } else if (s.phase === 'question' || s.phase === 'final'){
    b += `<button class="gm-btn gm-blue" onclick="${pfx}tpShowAnswer()">Antwort zeigen</button>`;
    b += `<button class="gm-btn gm-gold" onclick="${pfx}tpJudge(true)">✓ Richtig</button>`;
    b += `<button class="gm-btn gm-gray" onclick="${pfx}tpJudge(false)">✕ Falsch</button>`;
  } else if (s.phase === 'answer'){
    b += `<button class="gm-btn gm-gold" onclick="${pfx}tpJudge(true)">✓ Richtig</button>`;
    b += `<button class="gm-btn gm-gray" onclick="${pfx}tpJudge(false)">✕ Falsch</button>`;
  } else if (s.phase === 'steal'){
    s.teamNames.forEach((n, i) => {
      if (i === s.turn) return;
      b += `<button class="gm-btn gm-gold" onclick="${pfx}tpStealAward(${i})">✓ ${escapeHtml(n)}</button>`;
    });
    b += `<button class="gm-btn gm-gray" onclick="${pfx}tpStealNobody()">Niemand</button>`;
  }
  b += `<button class="gm-btn gm-gray" onclick="${pfx}tpQuit()">Beenden</button>`;
  return b;
}

function updateGamemasterTp(){
  const s = tpState;
  const cat = s.cat >= 0 ? tpData.categories[s.cat] : null;

  // Die Antwort steht im GM-Fenster IMMER, auch solange sie auf der Leinwand
  // verdeckt ist - sonst kann der Host nicht urteilen.
  let body;
  if (s.phase === 'done'){
    body = `<div class="question">🏆 ${escapeHtml(s.teamNames[s.winner] || 'Sieger')} gewinnt</div>
      <div class="hint-line">Alle ${tpCatCount()} Stücke und die Schlussfrage.</div>`;
  } else if (s.clue && cat){
    body = `<div class="hint-line">Kategorie: <b style="color:${escAttr(cat.color)};">${cat.icon} ${escapeHtml(cat.name)}</b>${
      s.finalTeam >= 0 ? ' · <b style="color:#FFD23F;">Schlussfrage</b>' : ''}</div>
      <div class="question">${escapeHtml(s.clue.q)}</div>
      <div class="hint-line">Antwort: <b style="color:#FFD23F;">${escapeHtml(s.clue.a)}</b>${
        s.phase === 'answer' ? ' <span style="color:#22C55E;">· aufgedeckt</span>'
                             : ' <span style="color:rgba(255,255,255,.35);">· noch verdeckt</span>'}</div>
      ${s.phase === 'steal' ? `<div class="hint-line">🔔 Nachfassen läuft — die anderen Teams dürfen buzzern.</div>` : ''}`;
  } else {
    body = `<div class="question">${s.finalTeam >= 0 ? 'Schlussfrage' : 'Rad drehen'}</div>
      <div class="hint-line">${s.finalTeam >= 0
        ? escapeHtml(s.teamNames[s.finalTeam] || 'Das Team') + ' hat alle Stücke — jetzt geht es um alles.'
        : 'Das Rad bestimmt die Kategorie.'}</div>`;
  }

  // Wer welches Stueck hat - als Liste, nicht als Torte: im GM-Fenster zaehlt
  // Ablesbarkeit, nicht Schauwert.
  const rows = s.teamNames.map((n, i) => {
    const w = s.wedges[i] || [];
    const chips = tpData.categories.map((c, j) =>
      `<span style="display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:3px;background:${
        w[j] ? escAttr(c.color) : 'rgba(255,255,255,.1)'};" title="${escAttr(c.name)}"></span>`).join('');
    return `<div class="money" style="${i === s.turn && s.phase !== 'done' ? 'color:#FFD23F;font-weight:700;' : ''}">
      <span>${escapeHtml(n)}${i === s.turn && s.phase !== 'done' ? ' ●' : ''}</span>
      <span>${chips} <strong>${w.filter(Boolean).length}/${tpCatCount()}</strong></span>
    </div>`;
  }).join('');

  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}
  .money{display:flex;justify-content:space-between;gap:10px;font-size:.85rem;margin-bottom:5px;align-items:center;}
  .money strong{color:#FFD23F;}
  .tm{font-size:.72rem;color:rgba(255,255,255,.5);}
</style></head><body>
  ${gmHeaderHtml('Gamemaster', `Trivial Pursuit · ${
    s.phase === 'done' ? 'Gewonnen' : s.finalTeam >= 0 ? 'Schlussfrage'
    : s.phase === 'steal' ? 'Nachfassen' : 'Am Zug: ' + (s.teamNames[s.turn] || '')}`)}
  <div class="gm-body">
  <div class="gm-main">${body}</div>
  <div class="gm-side">
  <div class="panel">
    <div class="panel-head"><span>🥧 Tortenstücke</span></div>
    ${rows}
  </div>
  ${gmNotesPanelHtml()}
  </div>
  </div>
  <div class="gm-actions">${tpGmControlsHtml('opener.')}</div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}
