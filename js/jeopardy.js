// @ts-check
/* Jeopardy, Teil 1: Board, Fragen, Schaetzfrage, Medien, Sounds.

   Herausgeloest aus index.html (Zeilen 5184-5717). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
// ── JEOPARDY ──
const JEOPARDY_VALUES = [100, 200, 300, 400, 500];
const JEOPARDY_CATS = 5;
const JEOPARDY_BOARDS = 2;

/* Was in einem Feld stecken kann. q und a sind immer da - alles andere legt
   erst der Editor an, wenn der Host es braucht. Deshalb steht hier der
   vollstaendige Bauplan: wer eine neue Sorte Frage einbaut, traegt sie hier
   ein und bekommt sie ueberall angerechnet. */

/** Ein Medien-Platz (Bild oder Video), das der Host waehrend der Frage
 *  einblenden kann. null heisst: Platz frei.
 *  @typedef {{ type: 'image'|'video', data: string, name: string }|null} MediaSlot */

/** @typedef {Object} JeopardyClue
 *  @property {string} q            Fragetext
 *  @property {string} a            Antwort
 *  @property {string} [note]       Notiz, die nur der Spielleiter sieht
 *  @property {number} [pts]        eigener Punktwert statt des Zeilenwerts
 *  @property {string} [qImg]       Bild ODER Video zur Frage (Data-URL; ein
 *                                  Video erkennt man an data:video/, siehe
 *                                  jeopardyIstVideo)
 *  @property {string} [aImg]       Bild ODER Video zur Antwort (Data-URL)
 *  @property {boolean} [estimate]  Schaetzfrage: keine Buzzer, alle Handys tippen
 *                                  eine ZAHL ein, der Host sieht sie sortiert
 *  @property {boolean} [single]    Einzelantwort: keine Buzzer, auf jedem Handy
 *                                  geht ein Textfeld auf, jeder tippt seine eine
 *                                  Antwort. Der Host sieht sie in Eingangsreihenfolge
 *  @property {boolean} [estimateText] VERALTET - war die "Buchstaben"-Variante der
 *                                  Schaetzfrage. Beim Import wird daraus `single`;
 *                                  zur Laufzeit zaehlt nur noch `single`
 *  @property {boolean} [staged]    Staffelbild, das kachelweise aufgedeckt wird
 *  @property {string} [stageImg]
 *  @property {number} [stageCols]
 *  @property {number} [stageRows]
 *  @property {boolean} [steps]     Frage in Schritten, die nacheinander eingeblendet
 *                                  werden. Jeder Schritt ist eine Zeile, ein Bild
 *                                  oder beides - beliebig gemischt.
 *  @property {string[]} [stepTexts] Text je Schritt (bis zu 5)
 *  @property {(string|null)[]} [stepImgs] Bild je Schritt (Data-URL)
 *  @property {string[]} [stepNames] Dateiname je Schritt-Bild
 *  @property {number} [stepCount]  wie viele Schritte der Editor anbietet (2-5)
 *  @property {boolean} [series]    Bilderreihe, die von links nach rechts aufgeht
 *  @property {(string|null)[]} [seriesImgs]
 *  @property {string[]} [seriesNames]
 *  @property {number} [seriesCount]
 *  @property {boolean} [strahl]    Zahlenstrahl: die Teams ordnen Dinge der
 *                                  Reihe nach ein (Preis, Alter, Jahreszahl).
 *                                  Kein Buzzer - wer am Zug ist, legt auf dem
 *                                  Handy
 *  @property {string[]} [strahlTexts]  Beschriftung je Ding
 *  @property {number[]} [strahlValues] echter Wert je Ding - er bestimmt die
 *                                  richtige Reihenfolge, das Publikum sieht
 *                                  ihn erst beim Einordnen
 *  @property {string} [strahlUnit] Einheit hinter dem Wert ("€", "Jahre")
 *  @property {number} [strahlCount] wie viele Dinge der Editor anbietet (3-8)
 *  @property {(string|null)[]} [strahlImgs] Bild je Ding, auf Leinwandgroesse
 *                                  gerechnet - fuer Leinwand, GM-Panel und
 *                                  Handy-Briefmarke. Ein Ding darf ein Bild
 *                                  STATT eines Namens haben
 *  @property {(string|null)[]} [strahlThumbs] dasselbe Bild als Briefmarke
 *                                  (128 px, ~4 KB). Nur das geht an die
 *                                  Handys - der Kanal darf keine Nutzlast in
 *                                  Megabyte tragen (BAUPLAN 3.6)
 *  @property {(string|null)[]} [strahlNames] Dateiname je Ding-Bild, damit der
 *                                  Editor ein Bild wiedererkennt
 *  @property {string} [sound]      Ton als Data-URL
 *  @property {string} [soundName]
 *  @property {MediaSlot[]} [media] */

/** Eine Spalte des Boards.
 *  @typedef {Object} JeopardyCategory
 *  @property {string} name         mit Bild: nur noch für den Host (Editor, Fernbedienung)
 *  @property {JeopardyClue[]} clues
 *  @property {boolean} [noDD]      Kategorie vom Daily Double ausnehmen
 *  @property {string} [img]        Bild statt Name im Kopf der Spalte (Data-URL)
 *  @property {string} [imgName]    Dateiname dazu, zum Wiedererkennen im Editor */

/** Kopf einer Spalte fürs Publikum: das Bild, wenn eins gesetzt ist, sonst
 *  der Name. Der Name bleibt als alt-Text am Bild.
 *  @param {JeopardyCategory} cat
 *  @param {string} imgClass */
function jeopardyCatHeadHtml(cat, imgClass) {
  if (cat.img) return `<img class="${imgClass}" src="${safeSrc(cat.img)}" alt="${escAttr(cat.name)}">`;
  return escapeHtml(cat.name);
}

/** @param {number} boardNum
 *  @returns {{ categories: JeopardyCategory[] }} */
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
  stepsRevealed: 0,  // wie viele Schritte einer Schritt-Frage schon stehen (oben → unten)
  questionRevealed: false, // the question text is hidden until the GM reveals it
  /* Welche Teams fuer die offene Frage schon Punkte bekommen haben. Zaehlt nur
     bei Schaetzfrage und Einzelantwort: dort tippen alle, zwei Teams koennen
     gleich nah dranliegen, und die Frage bleibt offen, bis der Host sie
     abschliesst. Beim Buzzern ist sie mit der ersten Wertung ohnehin vorbei.
     @type {number[]} */
  scoredTeams: [],
  /* Der laufende Zahlenstrahl, oder null. Haelt nur INDIZES in die Dinge der
     Frage - die Texte und Werte stehen im Board und werden nicht verdoppelt.
     `reihe` ist immer richtig sortiert (ein falsch gelegtes Ding rutscht an
     seinen Platz), `fehler` zaehlt die falschen Zuege.
     @type {null|{reihe:number[], offen:number[], team:number,
                  spieler:{key:string,name:string}|null, zeiger:number[],
                  fehler:number, richtig:number[], zugNr:number, fertig:boolean,
                  letzter:null|{idx:number,platz:number,soll:number,
                                richtig:boolean,team:number,wer:string}}} */
  strahl: null,
};

// Returns the categories array for the active board
/** Die Kategorien des gerade bespielten Boards.
 *  @returns {JeopardyCategory[]} */
function jBoard() { return jeopardyData.boards[jeopardyState.currentBoard].categories; }

/* Was ein Feld wert ist. Normalerweise sagt das die Zeile (100 bis 500), aber
   jede Frage darf einen eigenen Wert tragen. Gedacht fuer die eine Frage, die
   deutlich schwerer ist als der Rest ihrer Zeile - ohne dass dafuer das ganze
   Board umgestellt werden muss.

   Bewusst eine einzige Stelle: an dem Wert haengen Spielbrett, Frage-Overlay,
   Fernbedienung, Editor, Gutschrift, Abzug und die Frage, wo das Daily Double
   liegen darf. Stuende die Rechnung mehrfach im Code, waere genau eine davon
   beim naechsten Mal vergessen.

   0 und Leer zaehlen als "nicht gesetzt", negative Werte ebenso - ein Feld,
   das nichts oder Minuspunkte bringt, waere kein Feld, sondern eine Falle. */
/** @param {JeopardyClue|null|undefined} clue @param {number} row @returns {number} */
function jeopardyValueOf(clue, row) {
  const eigen = clue ? Number(clue.pts) : NaN;
  if (isFinite(eigen) && eigen > 0) return Math.round(eigen);
  return JEOPARDY_VALUES[row];
}
/** Der Wert eines Feldes ueber seine Koordinaten, auf dem aktuellen Board.
 *  @param {number} col @param {number} row @returns {number} */
/** Hat das Feld ueberhaupt eine Frage - Text, Bild, Staffelbild, Reihe,
 *  Schritte oder Ton?  @param {JeopardyClue|null|undefined} c @returns {boolean} */
function jeopardyClueHasContent(c) {
  if (!c) return false;
  return !!(String(c.q || '').trim() || c.qImg || c.stageImg || c.sound
    || (c.seriesImgs || []).some(Boolean) || (c.stepTexts || []).some(t => String(t || '').trim())
    || (c.stepImgs || []).some(Boolean) || (c.strahlTexts || []).some(t => String(t || '').trim())
    || (c.strahlImgs || []).some(Boolean));
}
function jeopardyCellValue(col, row) {
  const cat = jBoard()[col];
  return jeopardyValueOf(cat && cat.clues[row], row);
}

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
    stepsRevealed: jeopardyState.stepsRevealed,
    questionRevealed: jeopardyState.questionRevealed,
    scoredTeams: [...jeopardyState.scoredTeams],
    // Tiefe Kopie: der Zahlenstrahl hat Felder in Feldern, eine flache liesse
    // das Undo in die gerade geaenderte Reihe zeigen.
    strahl: jeopardyState.strahl ? JSON.parse(JSON.stringify(jeopardyState.strahl)) : null,
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
  jeopardyState.stepsRevealed = prev.stepsRevealed || 0;
  jeopardyState.questionRevealed = prev.questionRevealed;
  jeopardyState.scoredTeams = prev.scoredTeams || [];
  jeopardyState.strahl = prev.strahl || null;
  // Die Handys hoeren am Kanal mit: ohne diese Zeile stuende dort nach einem
  // Undo weiter das naechste Ding, obwohl der Host zurueckgegangen ist.
  jeopardyStrahlSenden();
  renderJeopardyScores();
  renderJeopardyBoard();
  // Steht ein Daily Double noch vor seiner Ansage, bleibt das Board zu sehen -
  // das Overlay wuerde das DD auf der Leinwand verraten.
  if (jeopardyState.currentClue && !jeopardyState.ddPending) renderJeopardyClueOverlay();
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
  jeopardyState.teamCount = fieldChecked('jeopardy-enable-team3') ? 3 : 2;
  jeopardyState.teamNames = [];
  jeopardyState.scores = [];
  for (let i = 0; i < jeopardyState.teamCount; i++) {
    jeopardyState.teamNames.push(fieldVal(`jt${i+1}-name`) || `Team ${i+1}`);
    jeopardyState.scores.push(0);
  }
  jeopardyState.currentBoard = 0;
  jeopardyState.used = jBoard().map(() => new Array(JEOPARDY_VALUES.length).fill(false));
  jeopardyState.currentClue = null;
  jeopardyState.answerShown = false;
  jeopardyState.active = true;
  // Verstecktes Daily Double: EINS PRO BOARD, nur auf Feldern ab 300 Punkten
  // und nur in Kategorien, in denen es der Host erlaubt hat (cat.noDD !== true).
  // "Ab 300 Punkte" meint den Wert, den das Feld wirklich hat - traegt eine
  // Frage einen eigenen, zaehlt der. Sonst laege das Daily Double auf einer
  // 100er-Zeile, in der jemand 800 eingetragen hat, gar nicht erst.
  jeopardyState.dailyDoubles = jeopardyData.boards.map(board => {
    const spots = [];
    board.categories.forEach((cat, col) => {
      if (cat.noDD) return;
      cat.clues.forEach((clue, row) => {
        // Nur Felder mit Inhalt - ein DD auf einem leeren Feld waere eine leere Ansage.
        const hatFrage = jeopardyClueHasContent(clue);
        /* Kein Daily Double auf einem Zahlenstrahl: dort spielen ALLE Teams
           abwechselnd, das DD laesst aber nur das waehlende Team antworten.
           Beides zusammen ergibt keine spielbare Regel. */
        if (hatFrage && !jeopardyIstStrahl(clue) && jeopardyValueOf(clue, row) >= 300) spots.push({ col, row });
      });
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
  ov.innerHTML = `<div class="danger-intro-sign">${dangerSvg()}</div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', () => closeOverlay(ov, afterJeopardyStar));
}

function afterJeopardyStar() { runIntroThen(showJeopardyTitle); }

function showJeopardyTitle() {
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="danger-title-sign">${dangerSvg()}</div>
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
  setHtml('jeopardy-scores', jeopardyState.teamNames.map((name, i) => `
    <div class="jeopardy-team ${TEAM_COLORS[i]}">
      <div class="jt-name">${escapeHtml(name)}</div>
      <div class="jt-score" id="jscore-${i}">${jeopardyState.scores[i]}</div>
    </div>
  `).join(''));
}

function renderJeopardyBoard() {
  const cats = jBoard();
  const cols = cats.length;
  const board = document.getElementById('jeopardy-board');
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  let html = '';
  // Category headers
  cats.forEach(cat => {
    html += `<div class="jeopardy-cat${cat.img ? ' has-img' : ''}">${jeopardyCatHeadHtml(cat, 'jeopardy-cat-img')}</div>`;
  });
  // Value rows
  JEOPARDY_VALUES.forEach((_, row) => {
    cats.forEach((cat, col) => {
      const used = jeopardyState.used[col][row];
      const val = jeopardyValueOf(cat.clues[row], row);
      html += `<div class="jeopardy-cell ${used ? 'used' : ''}" onclick="openJeopardyClue(${col},${row})">${used ? '' : val}</div>`;
    });
  });
  board.innerHTML = html;
  setText('jeopardy-board-label', `Board ${jeopardyState.currentBoard + 1} / ${JEOPARDY_BOARDS}`);
  renderBuzzer();
}

function jeopardyBoardComplete() {
  return jeopardyState.used.every(col => col.every(Boolean));
}

let jeopardyAdvancing = false;
function jeopardyAdvanceBoard() {
  // Nur bei vollem Board ohne offene Frage, und nur einmal (Doppeltipp,
  // Fernbefehl) - sonst sprang das Spiel zwei Boards weiter.
  if (!jeopardyState.active || jeopardyAdvancing || jeopardyState.currentClue || !jeopardyBoardComplete()) return;
  jeopardyAdvancing = true;
  setTimeout(() => { jeopardyAdvancing = false; }, 2500);
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
  const base = jeopardyCellValue(jeopardyState.currentClue.col, jeopardyState.currentClue.row);
  return jeopardyState.currentIsDaily ? base * 2 : base;
}
// Abgezogen wird immer die Hälfte des ORIGINALWERTS - beim Daily Double also
// nicht die Hälfte der verdoppelten Punkte.
function jeopardyDeductValue() {
  if (!jeopardyState.currentClue) return 0;
  return Math.round(jeopardyCellValue(jeopardyState.currentClue.col, jeopardyState.currentClue.row) / 2);
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
  /* Solange eine Frage offen ist oder ein Daily Double auf seine Ansage
     wartet, oeffnet kein zweites Feld. Beim DD steht das Board fuer alle
     sichtbar und klickbar da - ein Klick daneben ueberschrieb die offene
     DD-Frage, das DD-Feld blieb ungespielt. Erst ansagen oder Undo. */
  if (jeopardyState.ddPending || jeopardyState.currentClue) return;
  jeopardySnapshot();
  jeopardyState.currentClue = { col, row };
  jeopardyState.answerShown = false;
  jeopardyState.stageRevealed = [];
  jeopardyState.seriesRevealed = 0;
  jeopardyState.stepsRevealed = 0;
  jeopardyState.questionRevealed = false;
  jeopardyState.ddTeam = null;
  // Die Eingabe-Anzeige im GM-Panel steht schon, bevor aufgedeckt wird. Ohne
  // diese zwei Zeilen zeigte sie die Liste der VORIGEN Frage und beschriftete
  // sich nach deren Sorte - "Noch keine Schätzung" ueber einer Wortfrage.
  jeopardyState.scoredTeams = [];
  jeopardyEstimate.locked = false;
  jeopardyEstimate.answers = [];
  jeopardyEstimate.single = jeopardySingle(jeopardyClue(jeopardyState.currentBoard, col, row));
  // Der Zahlenstrahl der vorigen Frage muss weg, bevor das Overlay zeichnet -
  // sonst stuende die alte Reihe unter der neuen Frage.
  jeopardyState.strahl = null;
  jeopardyStrahlSenden();
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
    /* Bei Schätzfrage und Einzelantwort wird nicht gebuzzert - dort waere ein
       scharfer oder auch nur offener Buzzer schlicht falsch. Bis hierher
       sprang das Handy trotzdem erst auf den Buzzer-Screen ("Achtung - noch
       NICHT buzzern!") und erst beim Aufdecken auf das Eingabefeld. Zwei
       Wechsel fuer eine Frage, und der erste zeigte etwas, das gar nicht kommt.

       Jetzt geht das Eingabefeld gleich auf, aber gesperrt: mit Schloss und
       dem Hinweis, dass es losgeht, sobald der Host die Frage zeigt. Die
       Frage selbst geht dabei NICHT mit - sie steht ja noch nicht auf der
       Leinwand, und ein Handy, das sie vorher zeigt, waere ein Leck. */
    if (jeopardyTyped(jeopardyCurrentClue())) { jeopardyBuzzClose(); jeopardyEstimatePrepare(); }
    /* Zahlenstrahl: auch hier wird nicht gebuzzert. Anders als beim Eingabe-
       feld geht auf den Handys aber noch NICHTS auf - der erste Zug braucht
       das erste Ding, und das waere vor dem Aufdecken die halbe Loesung. */
    else if (jeopardyIstStrahl(jeopardyCurrentClue())) jeopardyBuzzClose();
    else jeopardyBuzzPrepare();   // buzzers live but NOT armed → early buzz = 3s lock
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
  // Schätzfrage und Einzelantwort laufen nicht über den Buzzer: statt zu armen
  // wird auf den Handys das Eingabefeld geöffnet und eingesammelt.
  // Das Daily Double ebenso wenig - dort antwortet ausschliesslich das Team,
  // das das Feld gewählt hat, ein scharfer Buzzer würde die anderen einladen.
  if (jeopardyTyped(jeopardyCurrentClue())) jeopardyEstimateOpen();
  else if (jeopardyIstStrahl(jeopardyCurrentClue())) jeopardyStrahlStart();
  else if (jeopardyState.currentIsDaily) jeopardyBuzzClose();
  else jeopardyBuzzArm();
  updateGamemaster();
}

/** Das Feld, das gerade offen ist - oder null, wenn keins offen ist.
 *  @returns {JeopardyClue|null} */
function jeopardyCurrentClue(){
  const c = jeopardyState.currentClue;
  if (!c) return null;
  return jBoard()[c.col].clues[c.row];
}

/* Felder, bei denen auf den Handys getippt statt gebuzzert wird. Zwei Sorten,
   ein Kanal (buzzer/estimate):

   - Schätzfrage (📊): die Antwort ist eine ZAHL. Das Handy zeigt den
     Ziffernblock, der Host bekommt die Eingaben der Größe nach sortiert.
   - Einzelantwort (📝): die Antwort ist ein WORT. Das Handy zeigt die normale
     Tastatur, der Host bekommt die Eingaben in Eingangsreihenfolge.

   Vorher war die zweite Sorte ein Unterhaken der ersten (`estimateText`). Das
   war der Fehler: eine Worteingabe lief damit weiter durch die Zahlen-Logik -
   `parseEstimate` machte aus jeder Antwort ohne Ziffer `null`, und die
   Sortierung hängte sie in einen Rest-Block hinter die Zahlen. Wer eine reine
   Wortfrage stellte, sah eine Liste, die nach nichts sortiert war, und ein
   versehentlich gesetzter Zahlen-Haken kippte die ganze Frage still um. Jetzt
   sind es zwei gleichrangige Sorten, die sich gegenseitig ausschließen.
   @param {JeopardyClue|null} clue */
function jeopardyTyped(clue){ return !!clue && (!!clue.estimate || !!clue.single); }
/** Einzelantwort (Text) statt Schätzfrage (Zahl)? @param {JeopardyClue|null} clue */
function jeopardySingle(clue){ return !!clue && !!clue.single; }

// ── SCHÄTZFRAGE / EINZELANTWORT (Eingabe auf den Buzzer-Handys) ──
// `single` merkt sich, welche Sorte gerade offen ist - danach richtet sich
// Sortierung und Beschriftung, auch wenn das Feld inzwischen zu ist.
let jeopardyEstimate = { open:false, locked:false, round:0, answers:[], ref:null, question:'', single:false };

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

/* Das Eingabefeld auf den Handys aufmachen.

   `gesperrt` heisst: es steht schon da, nimmt aber noch nichts an - mit
   Schloss und dem Hinweis, dass es losgeht, sobald der Host die Frage zeigt.
   So gebaut, weil beides sonst zwei fast gleiche Funktionen waeren, die
   auseinanderlaufen, sobald am Kanal etwas dazukommt.

   Im gesperrten Zustand geht die FRAGE NICHT mit. Sie steht zu dem Zeitpunkt
   noch nicht auf der Leinwand; ein Handy, das sie vorher zeigt, waere ein
   Leck - und bei einer Schaetzfrage ein besonders wirksames, weil man dann in
   Ruhe nachsehen kann.
   @param {boolean} [gesperrt] */
function jeopardyEstimateOpen(gesperrt){
  const clue = jeopardyCurrentClue();
  if (!clue) return;
  const r = jeopardyEstimateRef();
  jeopardyEstimate.open = !gesperrt;
  jeopardyEstimate.locked = !!gesperrt;
  jeopardyEstimate.round = nextRoundId(jeopardyEstimate.round);
  jeopardyEstimate.answers = [];
  jeopardyEstimate.question = gesperrt ? '' : (clue.q || '');
  // estimateText ist die alte Schreibweise aus gespeicherten Boards - siehe
  // Typdefinition oben. Sie zaehlt hier noch mit, damit eine alte Datei nicht
  // still den Ziffernblock aufmacht.
  jeopardyEstimate.single = !!clue.single || !!clue.estimateText;
  // text sagt dem Handy, welche Tastatur es aufmachen soll. Es geht mit, nicht
  // hinterher: kaeme es als zweiter Schreibvorgang, stuende auf langsamen
  // Verbindungen fuer einen Moment der Ziffernblock offen - und wer in dem
  // Moment schon tippt, kommt an keinen Buchstaben.
  if (r) r.set({ active:true, locked: !!gesperrt, round:jeopardyEstimate.round,
                 question:jeopardyEstimate.question,
                 text: jeopardyEstimate.single, answers:null }).catch(()=>{});
  updateGamemaster();
}

/** Feld schon zeigen, aber gesperrt - beim Oeffnen der Frage. */
function jeopardyEstimatePrepare(){ jeopardyEstimateOpen(true); }

function jeopardyEstimateClose(){
  jeopardyEstimate.open = false;
  jeopardyEstimate.locked = false;
  const r = jeopardyEstimateRef();
  if (r) r.update({ active:false, locked:false }).catch(()=>{});
  updateGamemaster();
}

function jeopardyEstimateReopen(){
  jeopardyEstimateOpen();
}

// Sortierung: bei der Schätzfrage Zahlen aufsteigend zuerst, alles ohne Zahl
// danach in der Reihenfolge des Eingangs. Bei der Einzelantwort gibt es nichts
// zu sortieren - dort zaehlt nur, wer zuerst getippt hat.
function jeopardyEstimateSorted(){
  const list = jeopardyEstimate.answers.slice();
  if (jeopardyEstimate.single) return list.sort((a,b) => (a.ts||0) - (b.ts||0));
  const nums = list.filter(a => typeof a.num === 'number' && isFinite(a.num));
  const rest = list.filter(a => !(typeof a.num === 'number' && isFinite(a.num)));
  nums.sort((a,b) => a.num - b.num || (a.ts||0) - (b.ts||0));
  rest.sort((a,b) => (a.ts||0) - (b.ts||0));
  return nums.concat(rest);
}

function jeopardyEstimateListHtml(){
  const rows = jeopardyEstimateSorted();
  if (!rows.length) return `<div class="pr-empty">${jeopardyEstimate.single
    ? 'Noch keine Antwort abgegeben' : 'Noch keine Schätzung abgegeben'}</div>`;
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

// ── ZAHLENSTRAHL (Dinge der Reihe nach einordnen, auf den Handys) ──
/* Die Teams sortieren Dinge in eine wachsende Reihe: Preis, Alter, Jahreszahl.
   Wer am Zug ist, bekommt auf dem Handy das naechste Ding und die Luecken der
   Reihe als Knoepfe.

   Drei Festlegungen von David (2026-10-29), an denen der Rest haengt:

   - "immer abwechselnd eine Person pro Team": der Zug wandert von Team zu
     Team, und INNERHALB des Teams reihum durch die verbundenen Handys. Sonst
     legt der Lauteste alles allein.
   - Die Reihe WAECHST. Das erste Ding liegt von allein - ein erster "Zug" auf
     die leere Reihe waere keine Entscheidung.
   - Sofort aufdecken, und "alles oder nichts": nach jedem Zug steht der echte
     Wert da. Ein falsch gelegtes Ding rutscht trotzdem an seinen richtigen
     Platz, sonst waere "richtig eingeordnet" beim naechsten Zug nicht mehr
     definiert. Gezahlt wird nur eine fehlerfreie Reihe.

   Der Kanal ist buzzer/strahl, eine eigene Rundennummer je Zug (BAUPLAN 3.6).
   Verworfen: die Dinge schon beim Oeffnen der Frage an die Handys schicken -
   wer sie vor dem Aufdecken liest, hat die halbe Loesung. */

/** Wie viele Dinge der Editor anbietet (3-8).  @param {JeopardyClue} clue */
function jeopardyStrahlCount(clue){ return Math.max(3, Math.min(8, Number(clue.strahlCount) || 5)); }

/** Die fertigen Dinge einer Zahlenstrahl-Frage: jede Zeile mit Wert UND
 *  entweder Name oder Bild. Eine halb ausgefuellte Zeile faellt still raus -
 *  der Strahl kann sie nicht einsortieren.
 *
 *  Bilder: ein Ding darf ein Bild STATT eines Namens haben ("ordne die Fotos
 *  nach Baujahr"). Damit alles, was die Reihe zeichnet, weiter mit `.text`
 *  arbeiten kann, bekommt so ein Ding hier eine Ersatzbeschriftung
 *  ("Bild 3"). Die steht nur da, wo kein Bild hinpasst - in der Lueckenzeile
 *  auf dem Handy, im Tooltip, in der Fehlersuche.
 *  @param {JeopardyClue|null|undefined} clue
 *  @returns {{text:string, wert:number, img:string, thumb:string}[]} */
function jeopardyStrahlDinge(clue){
  if (!clue || !clue.strahl) return [];
  const out = [];
  for (let i = 0; i < jeopardyStrahlCount(clue); i++){
    const text = String((clue.strahlTexts || [])[i] || '').trim();
    const img = String((clue.strahlImgs || [])[i] || '');
    // Das verkleinerte Bild fehlt bei Fragen, die vor den Bildern angelegt
    // wurden, und bei importierten Dateien. Dann geht das grosse ans Handy -
    // besser ein zu grosser Schreibvorgang als ein leeres Kaestchen.
    const thumb = String((clue.strahlThumbs || [])[i] || '') || img;
    // Number(null) und Number('') sind 0 - eine leere Zeile stuende damit mit
    // 0 ganz links in der Reihe. Deshalb erst auf "leer" pruefen.
    // unknown: eine importierte Datei darf hier auch "" oder null tragen,
    // der Typ sagt number - ohne die Zusicherung meldet tsc den Vergleich.
    const roh = /** @type {unknown} */ ((clue.strahlValues || [])[i]);
    const wert = (roh === null || roh === undefined || roh === '') ? NaN : Number(roh);
    const label = text || (img ? 'Bild ' + (i + 1) : '');
    if (label && isFinite(wert)) out.push({ text: label, wert, img, thumb });
  }
  return out;
}

/** Ist das eine spielbare Zahlenstrahl-Frage? Unter drei Dingen gibt es nur
 *  einen einzigen Zug - das ist keine Runde.
 *  @param {JeopardyClue|null|undefined} clue */
function jeopardyIstStrahl(clue){ return jeopardyStrahlDinge(clue).length >= 3; }

/** Felder ohne Buzzer, bei denen mehrere Teams Punkte bekommen koennen und der
 *  Host die Frage selbst abschliesst: getippte Fragen und der Zahlenstrahl.
 *  @param {JeopardyClue|null|undefined} clue */
function jeopardyOhneBuzzer(clue){ return jeopardyTyped(clue) || jeopardyIstStrahl(clue); }

/** Wert mit Einheit, wie er am Ding steht.
 *  @param {number} wert @param {JeopardyClue} clue */
function jeopardyStrahlWert(wert, clue){
  const e = String(clue.strahlUnit || '').trim();
  return wert.toLocaleString('de-DE') + (e ? ' ' + e : '');
}

/* Punkte je richtig eingeordnetem Ding (David, 2026-10-31: "pro richtig
   eingeordnetem Item 100 Punkte").

   Ein fester Wert, NICHT der Feldwert: auf einem 500er-Feld waeren bei acht
   Dingen 3500 Punkte zu holen, mehr als in der halben Runde sonst. Der
   Feldwert steht beim Zahlenstrahl weiter auf dem Board, zaehlt aber nicht -
   ein Zahlenstrahl ist ueber die Zahl der Dinge gewichtet, nicht ueber die
   Zeile. Wer das aendern will, aendert diese eine Zahl. */
const STRAHL_PUNKTE = 100;

/* Wie viele Zeichen Bilddaten ein Zug hoechstens an die Handys schicken darf.
   150 000 Zeichen Base64 sind rund 110 KB - bei acht Dingen etwa 14 KB je
   Briefmarke, also mehr als die 128-px-Bilder brauchen. Reisst der Deckel
   (sehr grosse Briefmarken aus einer importierten Datei), laeuft die Runde
   ohne Bilder auf dem Handy weiter. */
const STRAHL_BILD_BUDGET = 150000;

// `offen` merkt sich, ob auf den Handys gerade ein Zahlenstrahl steht. Ohne
// das schriebe jedes geoeffnete Feld ein "active:false" in die Datenbank.
let jeopardyStrahlKanal = { ref: null, round: 0, offen: false };

/* Der Kanal zu den Handys. Der Listener haengt an buzzer/strahl/zug, nicht am
   ganzen Knoten: sonst loeste jeder eigene Schreibvorgang ihn wieder aus. */
function jeopardyStrahlRef(){
  if (!jeopardyStrahlKanal.ref){
    if (!jeopardyBuzzInitFirebase()) return null;
    jeopardyStrahlKanal.ref = firebase.database().ref('buzzer/strahl');
    jeopardyStrahlKanal.ref.child('zug').on('value', s => {
      const z = s.val();
      if (!z || typeof z.platz !== 'number') return;
      // Zug aus einer alten Runde (Nachzuegler, zweiter Finger): weg damit.
      if (z.round !== jeopardyStrahlKanal.round) return;
      jeopardyStrahlPlatz(z.platz, z.name || '');
    });
  }
  return jeopardyStrahlKanal.ref;
}

/* Den Stand an die Handys schicken. Immer ganz (set), nie in Teilen: ein
   halber Stand waere ein Handy, das ein Ding zur falschen Reihe anzeigt.
   Jeder Zug bekommt eine eigene round - daran erkennt das Handy, dass es
   wieder losgeht (BAUPLAN 3.6). */
function jeopardyStrahlSenden(){
  const s = jeopardyState.strahl;
  const clue = jeopardyCurrentClue();
  const nichts = !s || s.fertig || !s.offen.length || !clue;
  if (nichts && !jeopardyStrahlKanal.offen) return;
  const r = jeopardyStrahlRef();
  if (!r) return;
  if (nichts){ jeopardyStrahlClose(); return; }
  const dinge = jeopardyStrahlDinge(clue);
  jeopardyStrahlKanal.round = nextRoundId(jeopardyStrahlKanal.round);
  /* Bilder ans Handy: NUR die 128-px-Briefmarken, und nur solange sie
     zusammen unter STRAHL_BILD_BUDGET bleiben.

     BAUPLAN 3.6 sagt "nur Verweise nach Firebase, keine Nutzlast" - gemeint
     sind die mehreren Megabyte eines eingebetteten Boards. Ein Verweis geht
     hier aber nicht: das Handy ist ein fremdes Geraet und kommt an den
     localStorage des Hosts nicht heran. Ohne Bild muesste der Spieler die
     Dinge auf der Leinwand suchen, waehrend er auf das Handy tippt - genau
     das soll das Bild ersparen. Also die kleinste Form, die noch erkennbar
     ist, mit hartem Deckel: reisst der, geht die Runde mit Namen weiter statt
     an einem zu grossen Schreibvorgang zu haengen. */
  const platte = [dinge[s.offen[0]]].concat(s.reihe.map(i => dinge[i]));
  const budget = platte.reduce((n, d) => n + (d.thumb || '').length, 0);
  const bilder = budget > 0 && budget <= STRAHL_BILD_BUDGET;
  r.set({
    active: true,
    round: jeopardyStrahlKanal.round,
    team: s.team,
    key: s.spieler ? s.spieler.key : null,
    name: s.spieler ? s.spieler.name : null,
    frage: clue.q || '',
    einheit: String(clue.strahlUnit || ''),
    ding: dinge[s.offen[0]].text,
    // null, nicht '': ein leerer String laesst den alten Knoten stehen und
    // das Handy zeigte das Bild des vorigen Dinges weiter.
    dingBild: (bilder && dinge[s.offen[0]].thumb) || null,
    reihe: s.reihe.map(i => ({
      text: dinge[i].text, wert: dinge[i].wert,
      bild: (bilder && dinge[i].thumb) || null,
    })),
    zug: null,
  }).catch(()=>{});
  jeopardyStrahlKanal.offen = true;
}

function jeopardyStrahlClose(){
  if (!jeopardyStrahlKanal.offen) return;
  const r = jeopardyStrahlRef();
  if (r) r.update({ active: false, zug: null }).catch(()=>{});
  jeopardyStrahlKanal.offen = false;
}

/** Wer aus dem Team am Zug ist: reihum durch die verbundenen Handys dieses
 *  Teams, nach Namen sortiert (die Reihenfolge der Presence wechselt mit
 *  jedem Neuladen). Ohne Handy bleibt der Platz leer - dann legt der Host.
 *  @param {number} team @param {number} zeiger */
function jeopardyStrahlSpieler(team, zeiger){
  const leute = (jeopardyBuzzer.presence || [])
    .filter(p => p && p.name && cleanTeamIdx(p.team) === team)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'de'));
  if (!leute.length) return null;
  const p = leute[((zeiger % leute.length) + leute.length) % leute.length];
  return { key: String(p.id), name: String(p.name) };
}

/* Runde aufbauen und den ersten Zug vergeben. Das erste Ding wird ohne Zug
   gelegt (siehe oben), die uebrigen kommen gemischt - sonst liefe jede Runde
   in der Reihenfolge des Editors. */
function jeopardyStrahlStart(){
  const clue = jeopardyCurrentClue();
  const dinge = jeopardyStrahlDinge(clue);
  if (dinge.length < 3) return;
  const mix = dinge.map((_, i) => i);
  for (let i = mix.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    const h = mix[i]; mix[i] = mix[j]; mix[j] = h;
  }
  const teams = Math.max(1, jeopardyState.teamCount);
  jeopardyState.strahl = {
    reihe: [Number(mix.shift())],
    offen: mix,
    team: 0,
    spieler: null,
    zeiger: new Array(teams).fill(0),
    fehler: 0,
    richtig: new Array(teams).fill(0),
    zugNr: 0,
    /* Zaehlt die Urteile, die der Host von Hand geaendert hat. Steckt neben
       zugNr im Overlay-Datensatz, damit die Einrast-Animation auch bei einer
       Korrektur noch einmal laeuft - sonst blieb die Kachel gruen, obwohl im
       Panel schon "falsch" stand. */
    urteilNr: 0,
    fertig: false,
    letzter: null,
  };
  jeopardyStrahlZugVergeben();
}

/** Nächster Spieler am Zug, Kanal und Anzeigen auffrischen. */
function jeopardyStrahlZugVergeben(){
  const s = jeopardyState.strahl;
  if (!s) return;
  s.spieler = jeopardyStrahlSpieler(s.team, s.zeiger[s.team] || 0);
  jeopardyStrahlSenden();
  renderJeopardyClueOverlay();
  updateGamemaster();
}

/** Zug weiterreichen: innerhalb des Teams eine Person weiter, dann das
 *  nächste Team. Auch der Knopf "Zug überspringen" im GM-Panel. */
function jeopardyStrahlWeiter(){
  const s = jeopardyState.strahl;
  if (!s || s.fertig) return;
  s.zeiger[s.team] = (s.zeiger[s.team] || 0) + 1;
  s.team = (s.team + 1) % Math.max(1, jeopardyState.teamCount);
  jeopardyStrahlZugVergeben();
}

/* Das naechste Ding an Platz `platz` einsortieren (0 = ganz links).

   Gleiche Werte: jeder Platz zwischen ihnen ist richtig, deshalb zwei
   Grenzen statt einer. Zwei Dinge mit demselben Preis sind beim Abtippen
   schnell passiert, und ein "falsch" waere dort nicht zu erklaeren.
   @param {number} platz @param {string} [wer] */
function jeopardyStrahlPlatz(platz, wer){
  const s = jeopardyState.strahl;
  const clue = jeopardyCurrentClue();
  if (!s || s.fertig || !s.offen.length || !clue) return;
  const dinge = jeopardyStrahlDinge(clue);
  const idx = s.offen[0];
  const wert = dinge[idx].wert;
  const sollMin = s.reihe.filter(i => dinge[i].wert < wert).length;
  const sollMax = s.reihe.filter(i => dinge[i].wert <= wert).length;
  const p = Math.max(0, Math.min(s.reihe.length, Math.round(Number(platz) || 0)));
  const richtig = p >= sollMin && p <= sollMax;
  jeopardySnapshot();
  s.offen.shift();
  s.reihe.splice(sollMin, 0, idx);
  s.zugNr++;
  /* Punkte sofort, nicht am Ende: der Punktestand bewegt sich mit jedem Zug,
     und das Publikum sieht, wofuer. Vorher wurde erst am Schluss gewertet,
     und nur die fehlerfreie Reihe zahlte ueberhaupt - bei vier bis sieben
     Zuegen ueber mehrere Teams endete das Feld meist mit 0 fuer alle.
     Dazu kam, dass die Zuege nicht gleich verteilt sind: bei 5 Dingen und
     3 Teams macht Team 1 zwei Zuege, die anderen je einen, und "die meisten
     richtigen" konnte damit nur Team 1 gewinnen (HANDOFF 2026-10-31).
     Je richtigem Ding ein fester Betrag hat beide Fehler nicht mehr. */
  if (richtig){
    s.richtig[s.team] = (s.richtig[s.team] || 0) + 1;
    jeopardyState.scores[s.team] += STRAHL_PUNKTE;
  } else s.fehler++;
  s.letzter = { idx, platz: p, soll: sollMin, richtig, team: s.team,
                wer: String(wer || (s.spieler && s.spieler.name) || ''),
                // true, sobald der Host das Urteil von Hand umgestellt hat
                // (jeopardyStrahlUrteil) - dann steht es so im Panel.
                vomHost: false };
  if (richtig) SFX.correct(); else SFX.wrong();
  // Der Punktestand hat sich gerade geaendert - auch das Board dahinter und
  // die Team-Zeilen im Panel muessen ihn tragen, nicht erst beim Abschluss.
  renderJeopardyScores();
  if (!s.offen.length){
    s.fertig = true;
    s.spieler = null;
    jeopardyStrahlSenden();
    renderJeopardyClueOverlay();
    updateGamemaster();
    return;
  }
  jeopardyStrahlWeiter();
}

/* Der Host stellt das Urteil des letzten Zuges um.

   Warum es das gibt, obwohl die Seite die Loesung kennt: die Reihenfolge
   steht fest, die Absicht nicht immer. Zwei Dinge mit demselben Wert sind
   schon abgedeckt (sollMin/sollMax), aber ein Tippfehler im Wert, ein Bild,
   das zwei Dinge zeigt, oder eine Frage, die der Host anders meint als sie
   dasteht, sind es nicht - und an jedem Urteil haengen seit 2026-10-31
   bare STRAHL_PUNKTE. Ohne Korrektur bliebe nur Undo, und das nimmt den Zug
   selbst zurueck.

   Bewusst nur der letzte Zug: ein Urteil von vor fuenf Zuegen nachtraeglich
   zu drehen waere fuer das Publikum nicht mehr nachvollziehbar.
   @param {boolean} richtig */
function jeopardyStrahlUrteil(richtig){
  const s = jeopardyState.strahl;
  if (!s || !s.letzter) return;
  const neu = !!richtig;
  if (s.letzter.richtig === neu) return;
  jeopardySnapshot();
  const t = s.letzter.team;
  /* Die Punkte gehen mit. Ohne das stuende im Panel "falsch", und die 100
     vom Zug lagen trotzdem auf dem Konto. */
  if (neu){
    s.richtig[t] = (s.richtig[t] || 0) + 1;
    jeopardyState.scores[t] += STRAHL_PUNKTE;
    // Relativ rechnen, nicht gegen null (BAUPLAN 3.8): fehler kann durch
    // mehrere Korrekturen hintereinander laufen.
    s.fehler = Math.max(0, s.fehler - 1);
    SFX.correct();
  } else {
    s.richtig[t] = Math.max(0, (s.richtig[t] || 0) - 1);
    jeopardyState.scores[t] -= STRAHL_PUNKTE;
    s.fehler++;
    SFX.wrong();
  }
  s.letzter.richtig = neu;
  s.letzter.vomHost = true;
  s.urteilNr = (s.urteilNr || 0) + 1;
  renderJeopardyScores();
  renderJeopardyClueOverlay();
  updateGamemaster();
}

/** Was ein Team in diesem Zahlenstrahl schon verdient hat.
 *  @param {number} team @returns {number} */
function jeopardyStrahlPunkte(team){
  const s = jeopardyState.strahl;
  return s ? (s.richtig[team] || 0) * STRAHL_PUNKTE : 0;
}

/** Der Stand als eine Zeile: nur Teams, die etwas geholt haben.
 *  Leer, solange niemand richtig lag - eine Reihe aus lauter Nullen sagt
 *  nichts und nimmt auf der Leinwand Platz weg (BAUPLAN 4.5).
 *  @returns {string} */
function jeopardyStrahlStandText(){
  const s = jeopardyState.strahl;
  if (!s) return '';
  return s.richtig
    .map((n, i) => n ? `${jeopardyState.teamNames[i] || ('Team ' + (i + 1))} +${n * STRAHL_PUNKTE}` : '')
    .filter(Boolean)
    .join(' · ');
}

/** Woran das Overlay erkennt, dass sich am letzten Zug etwas geaendert hat:
 *  Zugnummer UND Zahl der Host-Korrekturen. Eine Quelle fuer beide Stellen
 *  (schreiben und vergleichen), sonst laeuft die Animation irgendwann bei
 *  jedem Neuzeichnen - genau der Fehler, den `zugNeu` verhindern soll.
 *  @returns {string} */
function jeopardyStrahlZugKey(){
  const s = jeopardyState.strahl;
  return s ? s.zugNr + ':' + (s.urteilNr || 0) : '';
}

/** Die Reihe auf der Leinwand: links klein, rechts groß.
 *  `zugNeu` sagt, ob seit dem letzten Zeichnen ein Zug dazugekommen ist - nur
 *  dann bekommt das Ding seine Einrast-Animation. Ohne das lief sie bei jedem
 *  Neuzeichnen wieder (Lösung zeigen, Bild aufdecken, Undo), wie bei data-neu
 *  weiter oben.
 *  @param {JeopardyClue} clue @param {boolean} zugNeu */
function jeopardyStrahlHtml(clue, zugNeu){
  const s = jeopardyState.strahl;
  if (!s) return '';
  const dinge = jeopardyStrahlDinge(clue);
  const l = s.letzter;
  /* Mit Bild tragen die Kacheln die Klasse `bild`: dann schrumpfen sie von
     selbst mit, sobald acht davon in der Reihe liegen (styles.css). Der Name
     steht trotzdem darunter - auf drei Metern ist ein Foto allein oft nicht
     eindeutig, und bei Bildern ohne Namen ist es die Ersatzbeschriftung. */
  const items = s.reihe.map(i => {
    const neu = zugNeu && !!l && l.idx === i;
    const d = dinge[i];
    const cls = 'jeopardy-strahl-item' + (d.img ? ' bild' : '')
      + (neu ? (l.richtig ? ' richtig' : ' falsch') : '');
    return `<div class="${cls}">
      ${d.img ? `<img class="jstr-b" src="${safeSrc(d.img)}" alt="">` : ''}
      <span class="jstr-t">${escapeHtml(d.text)}</span>
      <span class="jstr-w">${escapeHtml(jeopardyStrahlWert(d.wert, clue))}</span>
    </div>`;
  }).join('');
  const naechstesDing = s.offen.length ? dinge[s.offen[0]] : null;
  const naechstes = naechstesDing ? naechstesDing.text : '';
  /* Zwei Zeilen unter der Reihe, nicht eine: oben wer dran ist, darunter wer
     wieviel geholt hat. In einer Zeile stand der Teamname zweimal ("Team Rot
     ist dran · Team Rot +100", Screenshot 2026-10-31) - auf drei Metern liest
     sich das wie ein Fehler.

     Die Punktezeile gilt waehrend der Runde wie am Ende. Das ist seit
     2026-10-31 die ganze Wertung: je richtig eingeordnetem Ding
     STRAHL_PUNKTE, sofort gutgeschrieben. Solange niemand richtig lag,
     faellt die Zeile ganz weg statt lauter Nullen zu zeigen (BAUPLAN 4.5). */
  const stand = jeopardyStrahlStandText();
  const dran = s.fertig
    ? (stand ? 'Reihe komplett' : 'Reihe komplett — keine Punkte')
    : `${escapeHtml(jeopardyState.teamNames[s.team] || ('Team ' + (s.team + 1)))}${
        s.spieler ? ' · ' + escapeHtml(s.spieler.name) : ''} ist dran`;
  /* Das einzuordnende Ding gross darueber. Mit Bild ist das Bild die
     Hauptsache und der Name die Beschriftung darunter - danach wird
     eingeordnet, nicht nach dem Wort. */
  const dingHtml = !naechstesDing ? '' : naechstesDing.img
    ? `<div class="jeopardy-strahl-ding mit-bild">
         <img src="${safeSrc(naechstesDing.img)}" alt="">
         <span>${escapeHtml(naechstesDing.text)}</span>
       </div>`
    : `<div class="jeopardy-strahl-ding">${escapeHtml(naechstes)}</div>`;
  return `<div class="jeopardy-strahl" data-fertig="${s.fertig ? '1' : ''}">
    ${dingHtml}
    <div class="jeopardy-strahl-reihe">
      <span class="jstr-ende">klein</span>
      ${items}
      <span class="jstr-ende">groß</span>
    </div>
    <div class="jeopardy-strahl-zug${s.fertig && stand ? ' gut' : ''}${s.fertig && !stand ? ' schlecht' : ''}">${dran}</div>
    ${stand ? `<div class="jeopardy-strahl-punkte">${escapeHtml(stand)}</div>` : ''}
  </div>`;
}

// Staged image helpers
/** @param {JeopardyClue} clue */
function jeopardyStageGrid(clue){
  const cols = Math.max(1, Math.min(5, clue.stageCols || 3));
  const rows = Math.max(1, Math.min(4, clue.stageRows || 3));
  return { cols, rows, total: cols * rows };
}

/** @param {JeopardyClue} clue */
function jeopardyStageHtml(clue){
  const { cols, rows, total } = jeopardyStageGrid(clue);
  let tiles = '';
  for (let i = 0; i < total; i++){
    const gone = jeopardyState.stageRevealed.includes(i);
    tiles += `<div class="jeopardy-stage-tile ${gone?'gone':''}"></div>`;
  }
  return `<div class="jeopardy-stage">
    <img src="${safeSrc(clue.stageImg)}" alt="">
    <div class="jeopardy-stage-cover" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr);">${tiles}</div>
  </div>`;
}

// Bilder-Reihe: eingestellte Anzahl (2-5) und die tatsächlich hochgeladenen Bilder
/** @param {JeopardyClue} clue */
/* Schritt-Frage: bis zu 5 Schritte, die der Host einzeln einblendet - fuer
   "Wer bin ich?"-Fragen, bei denen jeder Hinweis den naechsten leichter macht.
   Ein Schritt ist eine Zeile, ein Bild oder beides, in beliebiger Mischung:
   1-4 Zeile und 5 Bild geht genauso wie 1+4 Zeile und 2+3+5 Bild. Gebaut wie
   die Bilder-Reihe: derselbe Zaehler im Zustand, derselbe Undo, derselbe Knopf
   in der Fernbedienung. */
/** Wie viele Schritte der Editor anbietet.
 *  @param {JeopardyClue} clue @returns {number} */
function jeopardyStepCount(clue){ return Math.max(2, Math.min(5, clue.stepCount || 5)); }
/** Die tatsaechlich gefuellten Schritte, in ihrer Reihenfolge. Ein leerer
 *  Schritt zwischendrin faellt raus, sonst blendet der Host ins Nichts.
 *  @param {JeopardyClue} clue
 *  @returns {{text:string, img:string|null}[]} */
function jeopardyStepItems(clue){
  const n = jeopardyStepCount(clue);
  const texts = clue.stepTexts || [];
  const imgs = clue.stepImgs || [];
  const out = [];
  for (let i = 0; i < n; i++){
    const text = (texts[i] || '').trim();
    const img = imgs[i] || null;
    if (text || img) out.push({ text, img });
  }
  return out;
}
/** @param {JeopardyClue} clue @returns {string} */
function jeopardyStepsHtml(clue){
  const items = jeopardyStepItems(clue);
  const shown = jeopardyState.stepsRevealed;
  // Die Zahlen gehen als CSS-Variablen mit: fuenf Schritte mit drei Bildern
  // passen sonst nicht auf die Leinwand, und die Loesung darunter rutscht aus
  // dem Bild. styles.css teilt die verfuegbare Hoehe damit auf.
  const imgs = Math.max(1, items.filter(it => it.img).length);
  return `<div class="jeopardy-steps" style="--jstep-n:${items.length};--jstep-imgs:${imgs};">${items.map((it, i) => `
    <div class="jeopardy-step ${i < shown ? 'shown' : ''}">
      ${it.text ? `<div class="jeopardy-step-text">${escapeHtml(it.text)}</div>` : ''}
      ${it.img ? `<img class="jeopardy-step-img" src="${safeSrc(it.img)}" alt="">` : ''}
    </div>`).join('')}</div>`;
}
function jeopardySeriesCount(clue){ return Math.max(2, Math.min(5, clue.seriesCount || 5)); }
/** @param {JeopardyClue} clue */
function jeopardySeriesImgs(clue){ return (clue.seriesImgs || []).slice(0, jeopardySeriesCount(clue)).filter(Boolean); }
/** @param {JeopardyClue} clue */
function jeopardySeriesHtml(clue){
  const imgs = jeopardySeriesImgs(clue);
  const shown = jeopardyState.seriesRevealed;
  const cells = imgs.map((src, i) => `
    <div class="jeopardy-series-cell ${i < shown ? 'shown' : ''}">
      <img src="${safeSrc(src)}" alt="">
      <div class="jeopardy-series-cover">${i+1}</div>
    </div>`).join('');
  return `<div class="jeopardy-series" style="grid-template-columns:repeat(${imgs.length},1fr);">${cells}</div>`;
}

// Renders the clue overlay on the MAIN screen from state (re-entrant).
// Updates an already-open overlay in place instead of destroying and
// recreating it, so the entrance animation doesn't restart and flash
// the board underneath on every reveal/toggle.
/** Frage Wort fuer Wort in <span class="jw" style="--i:n">: damit kann eine
 *  Richtung die Frage gestaffelt aufbauen (styles.css, Aufdecken). Ohne
 *  Richtungsregel sind die Spans unsichtbar fuer das Layout.
 *  @param {string} text
 *  @returns {string} */
function jeopardyWoerter(text) {
  let i = 0;
  return String(text).split(/(\s+)/).map(t => /^\s*$/.test(t) ? t : `<span class="jw" style="--i:${i++}">${escapeHtml(t)}</span>`).join('');
}

/* Frage und Lösung können ein Bild ODER ein Video sein. Beides liegt im
   selben Feld (qImg/aImg) - sonst müsste jede Stelle, die heute "hat die
   Frage ein Bild?" fragt (Editor, Kacheln, Turnier, Notizen, der Spiegel),
   ein zweites Feld mitprüfen. Unterschieden wird an der Data-URL.
   @param {string} [src] @returns {boolean} */
function jeopardyIstVideo(src) { return /^data:video\//i.test(String(src || '')); }
/* Das Video läuft stumm und in Schleife: so startet es im Hauptfenster UND
   im gespiegelten Beamerfenster von allein (Autoplay mit Ton sperren die
   Browser ohne Klick, und der Beamer bekommt keinen). Ton zur Frage kommt
   weiter über das Feld "Sound". Mit controls kann der Host in seinem Fenster
   spulen, ohne dass es die Leinwand stört.
   @param {string} [src] @param {string} cls @returns {string} */
function jeopardyMedienTag(src, cls) {
  if (!src) return '';
  return jeopardyIstVideo(src)
    ? `<video class="${cls}" src="${safeSrc(src)}" autoplay muted loop playsinline controls></video>`
    : `<img class="${cls}" src="${safeSrc(src)}" alt="">`;
}

function renderJeopardyClueOverlay() {
  if (!jeopardyState.currentClue) { closeJeopardyClue(); return; }
  if (jeopardyState.ddPending) { closeJeopardyClue(); return; } // warning phase — nothing on the main screen yet
  const { col, row } = jeopardyState.currentClue;
  const cat = jBoard()[col];
  const clue = cat.clues[row];
  const val = jeopardyValueOf(clue, row);
  const staged = clue.staged && clue.stageImg;
  const series = clue.series && jeopardySeriesImgs(clue).length > 0;
  const steps = clue.steps && jeopardyStepItems(clue).length > 0;
  const strahl = !!jeopardyState.strahl && jeopardyIstStrahl(clue);

  const qImgHtml = jeopardyMedienTag(clue.qImg, 'jeopardy-clue-img');
  const aImgHtml = jeopardyMedienTag(clue.aImg, 'jeopardy-answer-img' + (jeopardyState.answerShown ? ' visible' : ''));

  const revealed = jeopardyState.questionRevealed;
  let ov = document.getElementById('jeopardy-clue-ov');
  /* Ist seit dem letzten Zeichnen ein Zug dazugekommen? Die Antwort steht im
     DOM, nicht im Zustand: renderJeopardyClueOverlay laeuft auch aus anderen
     Gruenden, und nur der echte Zug darf die Animation spielen. */
  const zugNeu = !!jeopardyState.strahl
    && jeopardyStrahlZugKey() !== String((ov && ov.dataset.strahlZug) || '');
  const questionArea = revealed
    ? `${clue.q ? `<div class="jeopardy-clue-text">${jeopardyWoerter(clue.q)}</div>` : ''}
       ${steps ? jeopardyStepsHtml(clue) : ''}
       ${strahl ? jeopardyStrahlHtml(clue, zugNeu) : ''}
       ${series ? jeopardySeriesHtml(clue) : staged ? jeopardyStageHtml(clue) : qImgHtml}`
    : `<div class="jeopardy-clue-blank">Frage verdeckt</div>`;

  if (!ov) {
    ov = document.createElement('div');
    ov.className = 'jeopardy-clue-overlay';
    ov.id = 'jeopardy-clue-ov';
    document.body.appendChild(ov);
  }
  /* Welches Feld es war: das Beamerfenster laesst genau dieses Feld aus dem
     Raster zur Frage fliegen (GSAP, mainscreen/aufdecken.js). */
  ov.dataset.col = String(col);
  ov.dataset.row = String(row);
  /* Was ist gerade NEU dazugekommen? innerHTML baut bei jedem Aufruf alles
     neu - haengt die Einblend-Animation einfach an der Frage, liefe sie bei
     jedem Neuzeichnen wieder (Antwort zeigen, Bild aufdecken ...). Deshalb
     merkt sich das Overlay seinen Stand, und nur der Schritt verdeckt->Frage
     bzw. ->Antwort setzt data-neu. styles.css haengt die Animationen daran.
     Vorher ploppte die Frage einfach ins Bild (David 2026-10-15: "sieht billig aus"). */
  const stand = !revealed ? 'verdeckt' : jeopardyState.answerShown ? 'antwort' : 'frage';
  const vorher = ov.dataset.stand || '';
  ov.dataset.neu = stand === vorher ? '' : stand === 'antwort' ? (vorher === 'frage' ? 'antwort' : 'frage antwort') : stand;
  ov.dataset.stand = stand;
  ov.dataset.strahlZug = jeopardyStrahlZugKey();
  /* Laufende Videos weiterlaufen lassen: innerHTML baut auch das <video> neu,
     und ein neues Element startet bei 0. Ohne das sprang das Frage-Video an
     den Anfang, sobald die Loesung gezeigt wurde (oder ein Staffelbild, ein
     Schritt, ein Undo dazukam). Schluessel ist Frage/Antwort, nicht die
     Klasse - die Antwort bekommt beim Aufdecken "visible" dazu. */
  const videoZeit = {};
  ov.querySelectorAll('video').forEach(v => {
    videoZeit[v.classList.contains('jeopardy-clue-img') ? 'q' : 'a'] = v.currentTime;
  });
  ov.innerHTML = `
    ${jeopardyState.currentIsDaily ? `<div class="jeopardy-dd-banner">★ DAILY DOUBLE ★</div>` : ''}
    <div class="jeopardy-clue-cat">${jeopardyCatHeadHtml(cat, 'jeopardy-clue-cat-img')}</div>
    <div class="jeopardy-clue-pts">${val}</div>
    ${questionArea}
    <div class="jeopardy-answer-text ${jeopardyState.answerShown?'visible':''}">${escapeHtml(clue.a || '')}</div>
    ${revealed ? aImgHtml : ''}
  `;
  ov.querySelectorAll('video').forEach(v => {
    const t = videoZeit[v.classList.contains('jeopardy-clue-img') ? 'q' : 'a'];
    if (t) v.currentTime = t;
  });
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
// Naechsten Schritt einer Schritt-Frage einblenden (oben → unten)
function jeopardyStepsReveal() {
  if (!jeopardyState.currentClue) return;
  const { col, row } = jeopardyState.currentClue;
  const clue = jBoard()[col].clues[row];
  if (!clue.steps) return;
  const total = jeopardyStepItems(clue).length;
  if (jeopardyState.stepsRevealed >= total) return;
  jeopardySnapshot();
  jeopardyState.stepsRevealed++;
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
  // Der Editor legt Ton als Daten-URL ab. Aus einer Importdatei kann aber
  // jede URL kommen - ein Aufruf nach aussen bei jedem Abspielen.
  if (!clue.sound || !/^(data:|blob:)/i.test(String(clue.sound))) return;
  jeopardyStopSound(true);
  jeopardyAudio = new Audio(clue.sound);
  jeopardyAudio.onended = () => { hideSoundFx(); jeopardyAudio = null; updateGamemaster(); };
  showSoundFx(jeopardyClueHasVisuals(clue));
  jeopardyAudio.play().catch(() => {});
  updateGamemaster();
}
function jeopardyStopSound(silent){
  if (jeopardyAudio){ jeopardyAudio.onended = null; jeopardyAudio.pause(); jeopardyAudio = null; }
  hideSoundFx();
  if (!silent) updateGamemaster();
}
/** Steht auf der Leinwand etwas, das der Ton-Effekt nicht zudecken darf?
 *  Gemeint sind Bilder und aufgedeckte Schritte - also alles, was der Host
 *  gerade zum Raten hergezeigt hat. Ein blosser Fragetext zaehlt bewusst
 *  NICHT: bei der klassischen "welches Geraeusch ist das?"-Frage soll die
 *  grosse Anzeige den Bildschirm fuellen, dafuer ist sie da.
 *  @param {JeopardyClue} clue @returns {boolean} */
function jeopardyClueHasVisuals(clue){
  if (!jeopardyState.questionRevealed) return false;   // nur "Frage verdeckt" - nichts zu sehen
  if (clue.qImg) return true;
  if (clue.steps && jeopardyStepItems(clue).length) return true;
  if (clue.series && jeopardySeriesImgs(clue).length) return true;
  if (clue.staged && clue.stageImg) return true;
  if (jeopardyState.answerShown && clue.aImg) return true;
  return false;
}
/** Die Schallwellen-Anzeige.
 *  @param {boolean} [kompakt] true: klein unten rechts, ohne Abdunklung -
 *  fuer Fragen, bei denen gleichzeitig etwas auf der Leinwand steht. Die
 *  grosse Fassung deckt den ganzen Bildschirm ab und zeichnet ihn weich;
 *  bei einer Schritt-Frage waeren die schon eingeblendeten Hinweise damit
 *  kaum noch lesbar. Buzzer-Anzeige sitzt oben rechts, deshalb unten. */
function showSoundFx(kompakt){
  hideSoundFx();
  const fx = document.createElement('div');
  fx.className = 'jeopardy-sound-fx' + (kompakt ? ' compact' : '');
  fx.id = 'jeopardy-sound-fx';
  let bars = '';
  const n = kompakt ? 7 : 11;
  for (let i = 0; i < n; i++) bars += `<span class="jsfx-bar" style="animation-delay:${(i*0.09).toFixed(2)}s"></span>`;
  fx.innerHTML = `<div class="jsfx-ring">🔊</div><div class="jsfx-bars">${bars}</div>`;
  document.body.appendChild(fx);
}
function hideSoundFx(){ const el = document.getElementById('jeopardy-sound-fx'); if (el) el.remove(); }

