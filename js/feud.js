// @ts-check
/* Family Feud samt Intros, Tutorials, Finale und den Gamemaster-Panels.

   Herausgeloest aus index.html (Zeilen 3554-5183). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
// ── GAME ──
function startGame() {
  if(!questions.length) return alert('Keine Fragen!');
  openBoardPopout();
  startGameActual();
}
function startGameActual() {
  jeopardyState.active = false;
  wwmState.active = false;
  wwdsState.active = false;
  state.teamCount = fieldChecked('enable-team3') ? 3 : 2;
  state.scores = new Array(state.teamCount).fill(0);
  state.teamStrikes = new Array(state.teamCount).fill(0);
  state.currentRound = 0; state.currentTeam = Math.floor(Math.random() * state.teamCount);
  state.roundQuestions = shuffled(questions);
  finaleState.questions = shuffled(finaleQuestions);
  finaleState.active = false;
  finaleState.scores = [0, 0];
  finaleState.teamAnswers = [[], []];

  const names = [];
  for (let i = 0; i < state.teamCount; i++) {
    names.push(fieldVal(`team${i+1}-name`) || `Team ${i+1}`);
  }
  state.teamNames = names;

  buildScoreboard();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Black backdrop stays behind all overlays so nothing flashes through
  const old = document.querySelector('.black-backdrop');
  if (old) old.remove();
  addBlackBackdrop();

  openGamemaster(); // schon jetzt öffnen, damit Intro/Tutorial vom GM-Fenster aus steuerbar sind
  activeBuzzerContext = 'feud';
  feudBuzzConnect();
  lockBuzzerJoins(feudBuzzer);
  showIntro();
}

function buildScoreboard() {
  const sb = document.getElementById('scoreboard');
  sb.innerHTML = state.teamNames.map((name, i) => `
    <div class="team-panel ${TEAM_COLORS[i]}" id="team${i}-display">
      <div class="t-name" id="team${i}-label">${name}</div>
      <div class="t-score" id="team${i}-score">0</div>
      <div class="team-strikes" id="team${i}-strikes">
        <span class="strike-pip">✕</span>
        <span class="strike-pip">✕</span>
        <span class="strike-pip">✕</span>
      </div>
    </div>
  `).join('');
}

// Flow: Star → Welcome → Tutorial → Black pause → Welcome2 → Game
function showIntro() {
  const overlay = document.createElement('div');
  overlay.className = 'intro-overlay';
  overlay.innerHTML = STAR_SVG;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', () => closeOverlay(overlay, afterStar));
}

function afterStar() {
  if (!fieldChecked('enable-gameshow-intro')) return showWelcomeIntro();
  const variant = fieldVal('intro-variant');
  if (variant === 'bday') showBirthdayIntro(showWelcomeIntro);
  else showGameshowIntro(showWelcomeIntro);
}

// Intro-Auswahl nur zeigen, wenn ein Intro läuft; Namensfeld nur beim Geburtstag
function toggleIntroPicker() {
  const on = fieldChecked('enable-gameshow-intro');
  const picker = document.getElementById('intro-picker');
  picker.style.display = on ? '' : 'none';
  const bday = fieldVal('intro-variant') === 'bday';
  showEl('bday-name', bday);
  showEl('bday-name-label', bday);
}

// Anpassbarer Show-Name im Intro: "___ Feud". Default "Keller".
function getFeudName() {
  const v = storeGet('feudShowName');
  if (v !== null) return v.trim() || 'Keller';
  return 'Keller';
}
function saveFeudName() {
  const v = fieldVal('feud-show-name');
  storeSet('feudShowName', v);
}
function feudTitle() { return getFeudName() + ' Feud'; }

function showWelcomeIntro() {
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="welcome-star">${STAR_SVG}</div>
    <div class="welcome-line1">Willkommen zu</div>
    <div class="welcome-line2">${feudTitle()}</div>
  `, 1800, showTutorialThenGame);
}

function showTutorialThenGame() {
  showTutorialFlow(() => { showBlackPause(); });
}

function showGameshowIntro(onDone) {
  const overlay = document.createElement('div');
  overlay.id = 'kg-overlay';
  overlay.innerHTML = `
    <div id="kg">
      <div class="wall"></div>
      <div class="floor"></div>
      <div class="cone coneL"></div>
      <div class="cone coneR"></div>
      <div class="cord"><div class="bulb"></div></div>
      <div class="frame" id="kgframe"></div>
      <div class="header"><span class="star">★</span>Die Große Keller Gameshow<span class="star">★</span></div>
      <div class="screen s1"><p class="big">HERZLICH</p><p class="big pink">WILLKOMMEN!</p></div>
      <div class="screen s2"><p class="big">DIE GROSSE</p><p class="big">KELLER</p><p class="big pink sm">GAMESHOW</p></div>
      <div class="screen s3"><p class="lbl">Das erwartet euch</p><p class="big">EINE 2-TEILIGE</p><p class="big pink sm">GAMESHOW</p></div>
      <div class="screen s4"><p class="lbl">Heute Abend spielen wir</p><p class="big">GAMESHOW</p><p class="big pink">NUMMER 1</p></div>
      <div class="screen s5"><p class="lbl">Und morgen…</p><p class="big pink">? ? ?</p><p class="sub">eine noch unbekannte Show</p></div>
      <div class="screen s6">
        <div class="teamrow">
          <svg width="70" height="70" viewBox="0 0 70 70"><ellipse cx="35" cy="38" rx="27" ry="29" fill="#6DD3B0" stroke="#111" stroke-width="4"/><circle cx="26" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="45" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="27" cy="35" r="3.5" fill="#111"/><circle cx="46" cy="35" r="3.5" fill="#111"/><path d="M27 49 q8 8 17 0" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/></svg>
          <svg width="70" height="70" viewBox="0 0 70 70"><ellipse cx="35" cy="38" rx="27" ry="29" fill="#F58BB8" stroke="#111" stroke-width="4"/><circle cx="26" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="45" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="25" cy="35" r="3.5" fill="#111"/><circle cx="44" cy="35" r="3.5" fill="#111"/><path d="M27 49 q8 8 17 0" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/></svg>
        </div>
        <p class="lbl">An beiden Tagen gilt</p><p class="big">DIESELBEN TEAMS</p></div>
      <div class="screen s7"><p class="lbl">Wer nach 2 Tagen vorn liegt, gewinnt</p><p class="euro">30&thinsp;€</p><p class="sub">…aufs Gewinner-Team aufgeteilt!</p></div>
      <div class="kg-hint">Klicken um fortzufahren</div>
    </div>`;
  runKgIntro(overlay, onDone);
}

// Name des Geburtstagskinds im Intro (wie getFeudName: merkbar, überschreibbar)
function getBdayName() {
  const v = storeGet('bdayName');
  if (v !== null) return v.trim() || 'Ajdin';
  return 'Ajdin';
}
function saveBdayName() {
  storeSet('bdayName', fieldVal('bday-name'));
}

function showBirthdayIntro(onDone) {
  const name = getBdayName().toUpperCase();
  const blob = (fill) => `<svg width="70" height="70" viewBox="0 0 70 70"><ellipse cx="35" cy="38" rx="27" ry="29" fill="${fill}" stroke="#111" stroke-width="4"/><circle cx="26" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="45" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="27" cy="35" r="3.5" fill="#111"/><circle cx="46" cy="35" r="3.5" fill="#111"/><path d="M27 49 q8 8 17 0" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  const cake = `
    <div class="cake">
      <div class="flame f1"></div><div class="flame f2"></div><div class="flame f3"></div>
      <div class="candle c1"></div><div class="candle c2"></div><div class="candle c3"></div>
      <div class="icing"></div>
      <div class="tier t2"></div>
      <div class="tier t1"></div>
      <div class="plate"></div>
    </div>`;

  const overlay = document.createElement('div');
  overlay.id = 'kg-overlay';
  overlay.innerHTML = `
    <div id="kgb">
      <div class="wall"></div>
      <div class="floor"></div>
      <div class="cone coneL"></div>
      <div class="cone coneR"></div>
      <div class="cord"><div class="bulb"></div></div>
      <div class="frame"></div>
      <div class="header"><span class="star">★</span>Die Große ${getBdayName()}-Geburtstagsshow<span class="star">★</span></div>
      <div class="screen s1"><p class="big">HERZLICH</p><p class="big pink">WILLKOMMEN!</p></div>
      <div class="screen s2"><p class="lbl">Heute steigt</p><p class="big">${name}S</p><p class="big pink sm">GEBURTSTAGSSHOW</p></div>
      <div class="screen s3">${cake}<p class="lbl">Der Grund für das ganze Theater</p><p class="big xl pink">${name}</p></div>
      <div class="screen s4"><p class="lbl">Das erwartet euch</p><p class="big">SPIEL, SPASS</p><p class="big pink sm">UND CHAOS</p></div>
      <div class="screen s5">
        <div class="teamrow">${blob('#6DD3B0')}${blob('#F58BB8')}</div>
        <p class="lbl">Und es gilt</p><p class="big">TEAM GEGEN TEAM</p>
      </div>
      <div class="screen s6"><p class="lbl">Für das Siegerteam gibt es</p><p class="big mint sm">EWIGE EHRE</p><p class="sub">…und Angeberrechte bis nächstes Jahr</p></div>
      <div class="screen s7">${cake}<p class="big">HAPPY BIRTHDAY</p><p class="big pink xl">${name}!</p></div>
      <div class="kg-hint">Klicken um fortzufahren</div>
    </div>`;

  // Luftballons steigen nur an den Rändern auf. Quer durch die Mitte gelegt
  // wandern sie sonst hinter Torte und Schrift durch und werden als Teil des
  // Bildes gelesen statt als Deko.
  const stage = overlay.firstElementChild;
  const lanes = [3, 11, 19, 79, 87, 95];
  ['#FF5DA2','#FFC93C','#7FE5B0','#8FB8FF','#FF8A5C','#C9A0FF'].forEach((c, i) => {
    const b = document.createElement('div');
    b.className = 'balloon';
    b.style.background = c;
    b.style.borderTopColor = c;
    b.style.left = (lanes[i] + Math.random() * 3) + '%';
    b.style.animationDuration = (13 + Math.random() * 9) + 's';
    b.style.animationDelay = (i * 2.6 + Math.random() * 2) + 's';
    b.style.transform = 'scale(' + (0.7 + Math.random() * 0.4) + ')';
    stage.appendChild(b);
  });

  runKgIntro(overlay, onDone);
}

// Gemeinsamer Ablauf beider Gameshow-Intros (Tag 1 und Tag 2): Marquee-Birnen
// und Funken aufbauen, Sequenz abspielen, per Klick beenden (frühestens nach
// 1,5s), bei Resize neu aufbauen. Der jeweilige Bildinhalt kommt vom Aufrufer.
function runKgIntro(overlay, onDone) {
  document.body.appendChild(overlay);
  const kg = overlay.firstElementChild;
  const frame = kg.querySelector('.frame');
  const cols = ['#FFD24D', '#FF5DA2'];
  function build() {
    frame.innerHTML = '';
    kg.querySelectorAll('.spark').forEach(e => e.remove());
    const W = kg.clientWidth || 680, H = kg.clientHeight || 470, step = 40;
    let i = 0;
    function mb(x, y) { const b = document.createElement('div'); b.className = 'mb'; b.style.left = x + 'px'; b.style.top = y + 'px'; const c = cols[i % 2]; b.style.background = c; b.style.boxShadow = '0 0 10px 2px ' + c; b.style.animationDelay = (i * 0.07) + 's'; frame.appendChild(b); i++; }
    for (let x = 20; x <= W - 20; x += step) mb(x, 14);
    for (let y = 14 + step; y <= H - 40; y += step) mb(W - 14, y);
    for (let x2 = W - 20; x2 >= 20; x2 -= step) mb(x2, H - 14);
    for (let y2 = H - 14 - step; y2 > 14; y2 -= step) mb(14, y2);
    for (let s = 0; s < 12; s++) { const sp = document.createElement('div'); sp.className = 'spark'; sp.style.left = (8 + Math.random() * 84) + '%'; sp.style.top = (14 + Math.random() * 54) + '%'; sp.style.animationDelay = (Math.random() * 1.8) + 's'; kg.appendChild(sp); }
  }
  build();
  // Der Rahmen wird pixelgenau aus kg.clientWidth/-Height berechnet. Läuft
  // build() zu früh (Layout noch nicht fertig) oder ändert sich die Bühne
  // später (Fullscreen am Beamer, verzögertes Layout), säße die rechte/linke
  // Lämpchen-Spalte an der falschen Stelle - z.B. mitten im Bild. Ein
  // ResizeObserver auf der Bühne baut den Rahmen bei JEDER Größenänderung
  // sauber neu (build() leert vorher das Frame), plus ein rAF-Nachbau, sobald
  // das erste Layout steht.
  requestAnimationFrame(() => requestAnimationFrame(() => { if (!done) build(); }));
  kg.classList.add('play');
  let done = false;
  const ro = ('ResizeObserver' in window) ? new ResizeObserver(() => { if (!done) build(); }) : null;
  if (ro) ro.observe(kg);
  function finish() {
    if (done) return;
    done = true;
    if (ro) ro.disconnect();
    overlay.classList.add('leaving');
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      overlay.remove();
      if (onDone) onDone();
    };
    // Screens inside the sequence (.s1-.s7) have their own finite kgBeat
    // animations whose animationend bubbles up here too — ignore those.
    overlay.addEventListener('animationend', (e) => {
      if (e.target !== overlay) return;
      cleanup();
    });
    setTimeout(cleanup, 900); // kgFadeOut is .8s; safety net if animationend is missed
  }
  // No auto-advance — the host must click to continue after the last statement
  let canSkip = false;
  setTimeout(() => { canSkip = true; }, 1500);
  overlay.addEventListener('click', () => { if (canSkip) finish(); });
  const onResize = () => { if (!done) build(); else window.removeEventListener('resize', onResize); };
  window.addEventListener('resize', onResize);
}

// Gemeinsame Tutorial-Engine: zeigt eine Reihe Slides (HTML-Strings), weiter
// per Klick, mit Fortschrittspunkten und Überspringen-Button. onDone (optional)
// läuft nach der letzten Slide bzw. beim Überspringen - im FF-Intro führt das
// direkt weiter ins Spiel, beim Tutorial-Button schließt es einfach.
// Solange ein Tutorial läuft, hängt hier seine Abbruchfunktion - der
// Überspringen-Knopf sitzt nur noch im Gamemaster, nicht mehr auf dem
// Bildschirm, den die Zuschauer sehen.
let activeTutorialSkip = null;

function runTutorial(slides, onDone) {
  let current = 0;
  const ov = document.createElement('div');
  ov.className = 'tut-overlay overlay-enter';
  ov.innerHTML = `
    ${slides.map((s, i) => `<div class="tut-slide ${i === 0 ? 'active' : ''}" data-idx="${i}">${s}</div>`).join('')}
    <div class="tut-progress">${slides.map((_, i) => `<div class="tut-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}</div>
    <div class="tut-hint">Klicken zum Fortfahren</div>
  `;
  document.body.appendChild(ov);
  const finish = () => { activeTutorialSkip = null; closeOverlay(ov, onDone); };
  activeTutorialSkip = finish;
  ov.addEventListener('click', () => {
    const allSlides = ov.querySelectorAll('.tut-slide');
    const allDots = ov.querySelectorAll('.tut-dot');
    allSlides[current].classList.remove('active');
    allSlides[current].classList.add('exit');
    allDots[current].classList.remove('active');
    current++;
    if (current >= slides.length) { finish(); return; }
    allDots[current].classList.add('active');
    setTimeout(() => { allSlides[current].classList.add('active'); }, 100);
  });
}

const TUT_STAR = `<svg viewBox="0 0 100 100" width="100" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="tsg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FFE066"/><stop offset="50%" stop-color="#FFD23F"/><stop offset="100%" stop-color="#C6930A"/>
  </linearGradient></defs>
  <polygon points="50,5 61,38 96,38 68,58 79,91 50,72 21,91 32,58 4,38 39,38" fill="url(#tsg)"/>
</svg>`;

// Deckt alle Family-Feud-Regeln ab: Teams, Handy-Buzzer, Board, Strikes,
// Einblendungen, Finale, Sieg.
function feudTutorialSlides() {
  return [
    `<div class="tut-star-anim" style="margin-bottom:10px;">${TUT_STAR}</div>
     <div class="tut-big tut-gold">${feudTitle()}</div>`,
    `<div class="tut-icon">⚔️</div>
     <div class="tut-big tut-white" style="font-size:3rem;">Teams treten<br>gegeneinander an</div>
     <div class="tut-sub">2 oder 3 Teams spielen um Punkte.<br>Pro Runde gibt es eine Frage mit versteckten Antworten.</div>`,
    `<div class="tut-icon">📱</div>
     <div class="tut-big tut-white" style="font-size:2.6rem;">Per Handy dabei</div>
     <div class="tut-buzz-demo"><div class="tut-buzz-btn red">BUZZ</div><div class="tut-buzz-btn blue">BUZZ</div></div>
     <div class="tut-sub">Die Spieler scannen den QR-Code und buzzern vom Handy.<br>Wer zuerst buzzert, darf für sein Team antworten.</div>`,
    `<div class="tut-big tut-gold" style="font-size:2.5rem; margin-bottom:10px;">Das Board</div>
     <div class="tut-board-demo">
       <div class="tut-tile-demo tut-tile-green"><div class="tut-tile-num">1</div><div class="tut-tile-text">Verschlafen</div><div class="tut-tile-pts">40</div></div>
       <div class="tut-tile-demo tut-tile-blue"><div class="tut-tile-num">2</div><div class="tut-tile-placeholder"></div></div>
       <div class="tut-tile-demo tut-tile-blue"><div class="tut-tile-num">3</div><div class="tut-tile-placeholder"></div></div>
       <div class="tut-tile-demo tut-tile-blue"><div class="tut-tile-num">4</div><div class="tut-tile-placeholder"></div></div>
     </div>
     <div class="tut-sub">Richtige Antwort? Feld wird aufgedeckt.<br>Je beliebter die Antwort, desto mehr Punkte.</div>`,
    `<div class="tut-big tut-red" style="font-size:3rem;">Strikes!</div>
     <div class="tut-strikes-demo"><div class="tut-x on">✕</div><div class="tut-x on">✕</div><div class="tut-x on">✕</div></div>
     <div class="tut-sub">Falsche Antwort? Strike!<br>Bei 3 Strikes ist das nächste Team dran —<br>rät es richtig, kassiert es die Punkte.</div>`,
    `<div class="tut-media-demo"><div class="tut-media-tile">🖼️</div><div class="tut-media-tile">🎬</div><div class="tut-media-tile">🖼️</div></div>
     <div class="tut-big tut-white" style="font-size:2.4rem; margin-top:14px;">Einblendungen</div>
     <div class="tut-sub">Zu manchen Fragen blendest du Bilder oder Videos ein –<br>die Zuschauer sehen sie auf dem großen Bildschirm.</div>`,
    `<div class="tut-icon tut-trophy-bounce">🔥</div>
     <div class="tut-big tut-gold" style="font-size:2.8rem;">Das große Finale</div>
     <div class="tut-sub">Zum Schluss spielen die besten Teams das Finale.<br>Bei 3 Teams scheidet das schwächste vorher aus.</div>`,
    `<div class="tut-icon tut-trophy-bounce">🏆</div>
     <div class="tut-big tut-gold" style="font-size:3rem;">Am Ende gewinnt...</div>
     <div class="tut-sub">...das Team mit den meisten Punkten!<br>Viel Spaß beim Spielen.</div>`
  ];
}

// Deckt alle Jeopardy-Regeln ab: Board/Kategorien, Buzzer & Sperre, Punkte/
// Abzug, Daily Double, zwei Runden, Sieg.
function jeopardyTutorialSlides() {
  return [
    `<div class="tut-danger">${DANGER_SVG}</div>
     <div class="tut-big tut-gold">Jeopardy</div>`,
    `<div class="tut-big tut-gold" style="font-size:2.4rem; margin-bottom:12px;">Kategorien &amp; Punkte</div>
     <div class="tut-jboard">
       <div class="tut-jcat">Musik</div><div class="tut-jcat">Sport</div><div class="tut-jcat">Kino</div>
       <div class="tut-jcell">100</div><div class="tut-jcell">100</div><div class="tut-jcell pick">100</div>
       <div class="tut-jcell">300</div><div class="tut-jcell used">300</div><div class="tut-jcell">300</div>
       <div class="tut-jcell">500</div><div class="tut-jcell">500</div><div class="tut-jcell">500</div>
     </div>
     <div class="tut-sub">Wähle ein Feld aus einer Kategorie.<br>Je höher der Wert, desto schwerer die Frage.</div>`,
    `<div class="tut-icon">📱</div>
     <div class="tut-big tut-white" style="font-size:2.5rem;">Wer zuerst buzzert</div>
     <div class="tut-buzz-demo"><div class="tut-buzz-btn red">BUZZ</div><div class="tut-buzz-btn blue">BUZZ</div></div>
     <div class="tut-sub">Frage wird gezeigt, dann buzzern alle vom Handy.<br>Falsch geraten? 3 Sekunden gesperrt – die anderen dürfen.</div>`,
    `<div class="tut-big tut-white" style="font-size:2.4rem; margin-bottom:6px;">Richtig oder falsch</div>
     <div class="tut-scorerow"><div class="tut-scorechip good">✓ + Punkte</div><div class="tut-scorechip bad">✕ Abzug</div></div>
     <div class="tut-sub">Richtige Antwort gibt den Feldwert gutgeschrieben,<br>eine falsche zieht Punkte ab.</div>`,
    `<div class="tut-dd">★ Daily Double ★</div>
     <div class="tut-sub" style="margin-top:16px;">Ein Feld versteckt das Daily Double.<br>Du sagst es dramatisch an, bevor die Frage kommt.</div>`,
    `<div class="tut-icon">🎬</div>
     <div class="tut-big tut-white" style="font-size:2.4rem;">Zwei Runden</div>
     <div class="tut-sub">Nach dem ersten Board geht es mit einem<br>zweiten, schwereren Board weiter.</div>`,
    `<div class="tut-icon tut-trophy-bounce">🏆</div>
     <div class="tut-big tut-gold" style="font-size:3rem;">Am Ende gewinnt...</div>
     <div class="tut-sub">...das Team mit den meisten Punkten!<br>Viel Erfolg.</div>`
  ];
}

function wwdsTutorialSlides() {
  return [
    `<div class="tut-star-anim" style="margin-bottom:10px;">
       <svg viewBox="0 0 100 100" width="100" xmlns="http://www.w3.org/2000/svg">
         <defs><linearGradient id="wtsg" x1="0" y1="0" x2="0" y2="1">
           <stop offset="0%" stop-color="#FFE066"/><stop offset="50%" stop-color="#FFD23F"/><stop offset="100%" stop-color="#C6930A"/>
         </linearGradient></defs>
         <polygon points="50,5 61,38 96,38 68,58 79,91 50,72 21,91 32,58 4,38 39,38" fill="url(#wtsg)"/>
       </svg>
     </div>
     <div class="tut-big tut-gold" style="font-size:3.2rem;">Wer weiß<br>denn sowas?</div>`,
    `<div class="tut-big tut-gold" style="font-size:2.4rem;margin-bottom:12px;">${wwdsData.categories.length} Kategorien</div>
     <div class="tut-wwds-grid">
       ${wwdsData.categories.slice(0,8).map((c,i) => `<div class="tut-wwds-cat ${i===2?'pick':''} ${i===5?'used':''}">${escapeHtml(c.cat||'—')}</div>`).join('')}
     </div>
     <div class="tut-sub">Die Teams sind <b>abwechselnd</b> dran.<br>Wer am Zug ist, wählt eine Kategorie.</div>`,
    `<div class="tut-big tut-white" style="font-size:2.3rem;margin-bottom:4px;">Drei Antworten</div>
     <div class="tut-wwds-opts">
       <div class="tut-wwds-opt"><span>A</span>Eine davon</div>
       <div class="tut-wwds-opt right"><span>B</span>ist richtig</div>
       <div class="tut-wwds-opt"><span>C</span>Die anderen nicht</div>
     </div>
     <div class="tut-sub">Ihr habt <b>20 Sekunden</b> Beratungszeit.<br>Richtig geraten gibt <b>500 €</b>.</div>`,
    `<div class="tut-icon">👥</div>
     <div class="tut-big tut-white" style="font-size:2.4rem;">Publikumsjoker</div>
     <div class="tut-sub">Jedes Team darf <b>einmal</b> das Publikum fragen.<br>Vorsicht: das Publikum irrt sich auch mal.</div>`,
    `<div class="tut-big tut-gold" style="font-size:2.6rem;margin-bottom:6px;">Die Masterfrage</div>
     <div class="tut-scorerow">
       <div class="tut-scorechip good">✓ Einsatz dazu</div>
       <div class="tut-scorechip bad">✕ Einsatz weg</div>
     </div>
     <div class="tut-sub">Am Ende setzt jedes Team einen Teil seines Geldes.<br>Richtig verdoppelt, falsch kostet.</div>`,
    `<div class="tut-icon tut-trophy-bounce">🏆</div>
     <div class="tut-big tut-gold" style="font-size:3rem;">Am Ende gewinnt...</div>
     <div class="tut-sub">...das Team mit dem meisten Geld.<br>Bei Gleichstand entscheidet eine Schätzfrage.</div>`
  ];
}

function showTutorialFlow(onDone) { runTutorial(feudTutorialSlides(), onDone); }
function showJeopardyTutorial() { runTutorial(jeopardyTutorialSlides()); }
function showWwdsTutorial() { runTutorial(wwdsTutorialSlides()); }

function showBlackPause() {
  const ov = document.createElement('div');
  ov.className = 'intro-overlay overlay-enter';
  ov.style.cursor = 'pointer';
  document.body.appendChild(ov);
  ov.addEventListener('click', () => closeOverlay(ov, showWelcome));
}

function showWelcome() {
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="welcome-star">${STAR_SVG}</div>
    <div class="welcome-line1">Los geht's</div>
    <div class="welcome-line2">Runde 1</div>
  `, 1800, () => {
    showScreen('game-screen');
    loadRound();
    setTimeout(() => openGamemaster(), 120);
    fadeOutBackdrop(document.querySelector('.black-backdrop'));
  });
}


function revealQuestion() {
  const el = document.getElementById('question-display');
  if (!el.classList.contains('hidden-q')) return;
  el.classList.remove('hidden-q');
  state.questionRevealed = true;
  feudBuzzArm(); // Buzzer-Duell scharf: wer zuerst buzzert, darf antworten
}

function loadRound() {
  if (state.currentRound >= state.roundQuestions.length) return endGame();
  const q = state.roundQuestions[state.currentRound];
  state.roundPoints = 0;
  state.teamStrikes = new Array(state.teamCount).fill(0);
  state.revealed = new Array(q.answers.length).fill(false);
  state.questionRevealed = false;
  state.allOut = false;
  actionHistory = [];
  resetMediaOverlay();

  setText('round-info', `Runde ${state.currentRound+1} / ${state.roundQuestions.length}`);

  const qEl = document.getElementById('question-display');
  qEl.classList.add('hidden-q');
  qEl.querySelector('.q-inner').textContent = q.question;

  feudBuzzPrepare(); // Buzzer live, aber noch nicht scharf - Frage ist ja noch verdeckt
  updateScores(); updateRoundPts(); updateStrikes(); renderBoard(); updateActiveTeam(); updateGamemaster();
}

function renderBoard() {
  const q = state.roundQuestions[state.currentRound];
  const board = document.getElementById('answer-board');
  const twoCol = q.answers.length > 4;
  board.className = 'answers' + (twoCol ? ' split' : '');
  board.style.gridTemplateRows = twoCol ? 'repeat(4, 1fr)' : '';
  board.innerHTML = q.answers.map((a,i) => {
    const revealed = state.revealed[i];
    const missed = state.allOut && !revealed;
    let cls = '';
    if (revealed) cls = 'open';
    else if (missed) cls = 'open missed';
    const clickable = !revealed && !state.allOut;
    return `
      <div class="tile ${cls}" ${clickable ? `onclick="revealAnswer(${i})"` : ''}>
        <div class="tile-inner">
          <div class="tile-num">${i+1}</div>
          <div class="tile-center"><span class="tile-answer">${a.text}</span></div>
          <div class="tile-pts">${a.points}</div>
        </div>
      </div>`;
  }).join('');
}

function revealAnswer(i) {
  if (state.revealed[i] || state.allOut) return;
  saveSnapshot();
  const q = state.roundQuestions[state.currentRound];
  state.revealed[i] = true;
  state.roundPoints += q.answers[i].points;
  SFX.point();
  updateRoundPts(); renderBoard(); showFlash(); updateGamemaster();
  if (state.revealed.every(Boolean)) {
    state.scores[state.currentTeam] += state.roundPoints;
    state.roundPoints = 0;
    updateScores(); updateRoundPts();
  }
}
function showFlash(){const f=document.createElement('div');f.className='reveal-flash';document.body.appendChild(f);f.addEventListener('animationend',()=>f.remove());}

function revealAll() {
  saveSnapshot();
  const q = state.roundQuestions[state.currentRound];
  q.answers.forEach((a,i) => { state.revealed[i] = true; });
  state.roundPoints = 0;
  updateRoundPts(); renderBoard(); updateGamemaster();
}

function addStrike() {
  if (state.allOut) return;
  const t = state.currentTeam;
  if (state.teamStrikes[t] >= 3) return;
  saveSnapshot();
  state.teamStrikes[t]++;
  SFX.wrong();
  updateStrikes();
  showStrikeOverlay();
  updateGamemaster();
  // Jeder Strike gibt sofort ans nächste noch nicht ausgeschiedene Team weiter
  // (switchTeam() überspringt bereits 3x gestrikte Teams von selbst).
  setTimeout(() => {
    if (!switchTeam()) updateStrikes();
    updateGamemaster();
  }, 750);
}
function showStrikeOverlay(){
  const o=document.createElement('div');o.className='strike-overlay';
  o.innerHTML='<span class="big-x">✕</span>';
  document.body.appendChild(o);setTimeout(()=>o.remove(),750);
}
function updateStrikes(){
  for (let i = 0; i < state.teamCount; i++) {
    const el = document.getElementById(`team${i}-strikes`);
    if (!el) continue;
    el.classList.toggle('active-strikes', state.currentTeam === i);
    el.querySelectorAll('.strike-pip').forEach((pip, j) => {
      const wasLit = pip.classList.contains('lit');
      const shouldLit = j < state.teamStrikes[i];
      pip.classList.toggle('lit', shouldLit);
    });
  }
}
function updateRoundPts(){ setText('round-pts', state.roundPoints); }

function switchTeam() {
  for (let attempt = 1; attempt <= state.teamCount; attempt++) {
    const next = (state.currentTeam + attempt) % state.teamCount;
    if (state.teamStrikes[next] < 3) {
      state.currentTeam = next;
      updateActiveTeam();
      return true;
    }
  }
  // All teams out — reveal board, don't auto-advance
  state.allOut = true;
  state.roundPoints = 0;
  updateRoundPts();
  renderBoard();
  return false;
}
function updateActiveTeam() {
  for (let i = 0; i < state.teamCount; i++) {
    setClass(`team${i}-display`, 'active-team', state.currentTeam === i);
  }
}
function updateScores() {
  for (let i = 0; i < state.teamCount; i++) {
    const el = document.getElementById(`team${i}-score`);
    const next = String(state.scores[i]);
    // Nur bei echter Aenderung anfassen: updateScores() laeuft bei jedem
    // Rendern mit, der Impuls soll aber nur bei vergebenen Punkten kommen.
    if (el.textContent === next) continue;
    el.textContent = next;
    el.classList.remove('score-bump');
    void el.offsetWidth; // Reflow erzwingen, sonst startet die Animation nicht neu
    el.classList.add('score-bump');
  }
}

function nextRound() {
  if (!state.revealed.every(Boolean)) {
    state.scores[state.currentTeam] += state.roundPoints;
    state.roundPoints = 0; updateScores();
  }
  state.currentRound++; loadRound();
}

function endGame() {
  setClass('gm-bar', 'visible', false);
  feudBuzzDisconnect(); // ab jetzt läuft das Finale, kein Buzzer mehr nötig
  if (state.teamCount === 3) {
    const sorted = state.scores.map((s,i) => ({score:s, idx:i})).sort((a,b) => b.score - a.score);
    finaleState.teams = [sorted[0].idx, sorted[1].idx];
    showFinaleIntroScreen(() => showEliminationScreen(sorted[2].idx));
  } else {
    finaleState.teams = [0, 1];
    showFinaleIntroScreen(showFinaleMatchup);
  }
}

function showResults() {
  // Falls wir aus einer Intro-/Finale-Sequenz kommen (z.B. kein Finale, weil
  // keine Finale-Fragen angelegt sind), liegt noch der schwarze Backdrop
  // (z-index 1999) über allem - sonst bleibt das Ergebnis dahinter schwarz.
  fadeOutBackdrop(document.querySelector('.black-backdrop'));
  const maxScore = Math.max(...state.scores);
  const winners = state.teamNames.filter((_, i) => state.scores[i] === maxScore);
  setHtml('final-scores', state.teamNames.map((name, i) =>
    `${name}: <strong>${state.scores[i]}</strong> Punkte`
  ).join('<br>'));
  setText('winner-text', winners.length > 1 ? 'Unentschieden!' : `${winners[0]} gewinnt!`);
  const recordedToTournament = tournamentAutoRecordIfActive(state.teamNames, state.scores);
  showEl('tour-goto-btn', recordedToTournament);
  if (!recordedToTournament) offerTournamentResult('Family Feud', state.teamNames, state.scores);
  recordAccountGameResult(state.teamNames, state.scores);
  showScreen('result-screen');
  if (winners.length === 1) confetti();
}

function showEliminationScreen(eliminatedIdx) {
  showClickOverlay('elim-overlay overlay-enter', `
    <div class="elim-text">Ausgeschieden</div>
    <div class="elim-team">${state.teamNames[eliminatedIdx]}</div>
    <div class="elim-sub">Die besten zwei Teams spielen das Finale</div>
  `, 2500, showFinaleMatchup);
}

function showFinaleIntroScreen(onDone) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  if (!document.querySelector('.black-backdrop')) addBlackBackdrop();
  showClickOverlay('finale-click-overlay', `
    <div class="welcome-star">${STAR_SVG}</div>
    <div class="welcome-line1">Jetzt kommt</div>
    <div class="welcome-line2">Das große Finale</div>
  `, 2000, onDone);
}

function showFinaleMatchup() {
  showClickOverlay('finale-click-overlay', `
    <div class="welcome-star">${STAR_SVG}</div>
    <div class="welcome-line2" style="font-size:3.5rem;">${state.teamNames[finaleState.teams[0]]}</div>
    <div class="welcome-line1" style="animation-delay:1s;">vs</div>
    <div class="welcome-line2" style="font-size:3.5rem;animation-delay:1.2s;">${state.teamNames[finaleState.teams[1]]}</div>
  `, 2500, () => {
    if (finaleState.questions.length === 0) { showResults(); return; }
    startFinale();
  }, 'gap:16px;');
}

function startFinale() {
  finaleState.active = true;
  finaleState.currentTeamIdx = 0;
  finaleState.currentQ = 0;
  finaleState.scores = [0, 0];
  finaleState.teamAnswers = [[], []];
  finaleState.phase = 'answer';
  finaleState.revealQ = 0;
  showScreen('finale-screen');
  showEl('finale-timer', false);
  renderFinaleScores();
  loadFinaleQuestion();
  fadeOutBackdrop(document.querySelector('.black-backdrop'));
  if (gamemasterWin && !gamemasterWin.closed) updateGamemaster();
}

// Punktestand, den ein Team bis einschliesslich der gerade aufgedeckten Frage
// erreicht hat. Waehrend des Antwortens steht in finaleState.scores schon die
// Endsumme - in der Aufloesung soll sie sich aber Frage fuer Frage aufbauen.
function finaleRevealedScore(idx) {
  let sum = 0;
  for (let qi = 0; qi <= finaleState.revealQ && qi < finaleState.questions.length; qi++) {
    const a = finaleState.teamAnswers[idx][qi];
    if (a >= 0 && finaleState.questions[qi].answers[a]) sum += finaleState.questions[qi].answers[a].points;
  }
  return sum;
}

function renderFinaleScores() {
  const el = document.getElementById('finale-scores');
  // Fast Money: solange die Teams antworten, bleibt der Stand verborgen -
  // sonst sieht das zweite Team (und das Publikum) schon vorab, was zu
  // schlagen ist. Eingeblendet wird er erst in der Aufloesung.
  if (finaleState.phase !== 'reveal') {
    el.style.display = 'none';
    el.innerHTML = '';
    return;
  }
  el.style.display = '';
  el.innerHTML = finaleState.teams.map((ti, idx) => `
    <div class="finale-score-card active">
      <div class="finale-score-name">${state.teamNames[ti]}</div>
      <div class="finale-score-pts" id="finale-pts-${idx}">${finaleRevealedScore(idx)}</div>
    </div>
  `).join('');
}

function loadFinaleQuestion() {
  if (finaleState.currentQ >= finaleState.questions.length) {
    if (finaleState.currentTeamIdx === 0) {
      finaleState.currentTeamIdx = 1;
      finaleState.currentQ = 0;
      showFinaleSwitch();
      return;
    }
    startFinaleReveal();
    return;
  }
  const q = finaleState.questions[finaleState.currentQ];
  const ti = finaleState.teams[finaleState.currentTeamIdx];
  setText('finale-team-label', state.teamNames[ti] + ' spielt');
  setText('finale-q-info', `Frage ${finaleState.currentQ + 1} / ${finaleState.questions.length}`);
  setText('finale-question', q.question);
  document.getElementById('finale-question').className = 'finale-big-q';
  showEl('finale-board', false);
  renderFinaleScores();
  updateGamemaster();
}

function finalePickAnswer(i) {
  const q = finaleState.questions[finaleState.currentQ];
  finaleState.teamAnswers[finaleState.currentTeamIdx][finaleState.currentQ] = i;
  finaleState.scores[finaleState.currentTeamIdx] += q.answers[i].points;
  // Die Punktekarte existiert waehrend des Antwortens nicht (siehe
  // renderFinaleScores) - der Stand wird erst in der Aufloesung gezeigt.
  const ptsEl = document.getElementById(`finale-pts-${finaleState.currentTeamIdx}`);
  if (ptsEl) ptsEl.textContent = String(finaleState.scores[finaleState.currentTeamIdx]);
  showFlash();
  updateGamemaster();
  finaleState.currentQ++;
  setTimeout(() => loadFinaleQuestion(), 800);
}

function finaleMarkMiss() {
  finaleState.teamAnswers[finaleState.currentTeamIdx][finaleState.currentQ] = -1;
  updateGamemaster();
  finaleState.currentQ++;
  setTimeout(() => loadFinaleQuestion(), 500);
}

function startFinaleReveal() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const bd = addBlackBackdrop();
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="welcome-star">${STAR_SVG}</div>
    <div class="welcome-line1">Und jetzt</div>
    <div class="welcome-line2">Die Auflösung</div>
  `, 1500, () => {
    finaleState.phase = 'reveal';
    finaleState.revealQ = 0;
    showScreen('finale-screen');
    setText('finale-team-label', 'Auflösung');
    loadRevealQuestion();
    fadeOutBackdrop(bd);
  });
}

function loadRevealQuestion() {
  if (finaleState.revealQ >= finaleState.questions.length) {
    showFinaleResults();
    return;
  }
  const q = finaleState.questions[finaleState.revealQ];
  const qi = finaleState.revealQ;
  setText('finale-q-info', `Auflösung · Frage ${qi + 1} / ${finaleState.questions.length}`);
  setText('finale-question', q.question);
  document.getElementById('finale-question').className = 'q-text';
  showEl('finale-board', true);
  setHtml('finale-board', q.answers.map((a, i) => {
    const team1Picked = finaleState.teamAnswers[0][qi] === i;
    const team2Picked = finaleState.teamAnswers[1][qi] === i;
    let indicator = '';
    if (team1Picked || team2Picked) {
      const names = [];
      if (team1Picked) names.push(state.teamNames[finaleState.teams[0]]);
      if (team2Picked) names.push(state.teamNames[finaleState.teams[1]]);
      indicator = `<span style="font-size:.65rem;color:#FFD23F;font-weight:700;margin-left:8px;">← ${names.join(', ')}</span>`;
    }
    return `
      <div class="tile open">
        <div class="tile-inner">
          <div class="tile-num">${i+1}</div>
          <div class="tile-center"><span class="tile-answer">${a.text}</span>${indicator}</div>
          <div class="tile-pts">${a.points}</div>
        </div>
      </div>`;
  }).join(''));

  let revealDiv = document.getElementById('finale-reveal-comparison');
  if (!revealDiv) {
    revealDiv = document.createElement('div');
    revealDiv.id = 'finale-reveal-comparison';
    document.getElementById('finale-screen').appendChild(revealDiv);
  }
  const team1Ans = finaleState.teamAnswers[0][qi];
  const team2Ans = finaleState.teamAnswers[1][qi];
  const team1Text = team1Ans >= 0 ? q.answers[team1Ans].text : 'Nicht auf dem Board';
  const team2Text = team2Ans >= 0 ? q.answers[team2Ans].text : 'Nicht auf dem Board';
  const team1Pts = team1Ans >= 0 ? q.answers[team1Ans].points : 0;
  const team2Pts = team2Ans >= 0 ? q.answers[team2Ans].points : 0;
  revealDiv.className = 'finale-reveal-cards';
  revealDiv.innerHTML = `
    <div class="finale-reveal-team">
      <div class="finale-reveal-name">${state.teamNames[finaleState.teams[0]]}</div>
      <div class="finale-reveal-answer" style="color:${team1Ans >= 0 ? '#22C55E' : '#E8453C'}">${team1Text}</div>
      <div class="finale-reveal-pts">${team1Pts}</div>
    </div>
    <div class="finale-reveal-team">
      <div class="finale-reveal-name">${state.teamNames[finaleState.teams[1]]}</div>
      <div class="finale-reveal-answer" style="color:${team2Ans >= 0 ? '#22C55E' : '#E8453C'}">${team2Text}</div>
      <div class="finale-reveal-pts">${team2Pts}</div>
    </div>
  `;
  renderFinaleScores();
  updateGamemaster();
}

function finaleNextReveal() {
  finaleState.revealQ++;
  loadRevealQuestion();
}

function showFinaleResults() {
  const revealDiv = document.getElementById('finale-reveal-comparison');
  if (revealDiv) revealDiv.remove();
  finaleState.active = false;
  for (let i = 0; i < 2; i++) state.scores[finaleState.teams[i]] += finaleState.scores[i];
  showResults();
}

function showFinaleSwitch() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const bd = addBlackBackdrop();
  showClickOverlay('welcome-overlay overlay-enter', `
    <div class="welcome-star">${STAR_SVG}</div>
    <div class="welcome-line1">Jetzt spielt</div>
    <div class="welcome-line2">${state.teamNames[finaleState.teams[1]]}</div>
  `, 1500, () => {
    showScreen('finale-screen');
    loadFinaleQuestion();
    fadeOutBackdrop(bd);
  });
}

// ── GAMESCREEN (Zuschauer-Bildschirm als eigenes Fenster) ──
// Öffnet beim Spielstart ein zweites, ganz normales Browserfenster und
// spiegelt danach automatisch alles, was im Hauptfenster passiert (Boards,
// Overlays, Konfetti, Buzzer-Anzeige) hinein - ohne dass jede einzelne
// Render-Funktion angefasst werden muss. Das Hauptfenster bleibt dabei für
// den Host nutzbar (Menü, GM-Panel usw.).
let boardWin = null;
let boardMirrorObserver = null;
let boardMirrorScheduled = false;

// Der Gamescreen ist einfach ein zweites, ganz normales Browserfenster - der
// Host zieht es selbst auf den Zuschauer-Bildschirm und macht es bei Bedarf
// per F11 im Browser fullscreen. Frühere Versionen haben versucht, Position/
// Größe/Vollbild per JS zu erzwingen (Window-Management-API, moveTo/resizeTo,
// requestFullscreen) - das war je nach Browser/Fenstermanager unzuverlässig
// und hat mehr Probleme verursacht als gelöst.
function openBoardPopout() {
  boardWin = window.open('', 'Board', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  if (!boardWin) return; // vom Browser blockiert (Pop-up-Blocker)
  // Frueher wurde der Inhalt des <style>-Blocks hier hineinkopiert. Seit die
  // Stile in styles.css liegen, wird die Datei verlinkt - absolut aufgeloest,
  // weil das Popout auf about:blank startet und relative Pfade dort ins Leere
  // laufen. Nebeneffekt: der DDF-/PIH-Block ist jetzt auch dabei, den hat die
  // alte Variante nie erwischt (er stand im body, nicht im head).
  // Bewusst die URL aus dem Dokument statt eines festen Pfades: seit der
  // Deploy ein ?v=<commit> anhaengt, waere styles.css ohne Parameter eine
  // ANDERE Adresse - das Popout haette sich die alte Fassung aus dem Cache
  // geholt, waehrend das Hauptfenster die neue zeigt.
  const cssLink = /** @type {HTMLLinkElement|null} */ (
    document.querySelector('link[rel="stylesheet"][href*="styles.css"]'));
  const cssHref = new URL(cssLink ? cssLink.getAttribute('href') : 'styles.css', location.href).href;
  boardWin.document.open();
  boardWin.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@500;700;900&family=Luckiest+Guy&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${cssHref}">
<style>
body{pointer-events:none;}
/* Alles, was nur der Host sieht, bleibt im Zuschauerfenster aus. Die Liste
   hinkte den neuen Shows hinterher: WWDS, Der Duemmste fliegt, Der Preis ist
   heiss und Trivial Pursuit fehlten samt ihren Editoren, ebenso die
   Spielerliste, das Turnier und die Notizen. Wechselte der Host waehrend der
   Show dorthin, stand das auf der Leinwand. */
#gm-bar,#gm-embed-overlay,#host-gate,#qr-overlay,
#menu-screen,#players-screen,#tournament-screen,#host-notes-screen,#reaction-board-screen,
#setup-screen,#edit-screen,
#jeopardy-setup-screen,#jeopardy-edit-screen,
#wwm-setup-screen,#wwm-edit-screen,
#wwds-setup-screen,#wwds-edit-screen,
#ddf-setup-screen,#ddf-edit-screen,
#pih-setup-screen,#pih-edit-screen,
#tp-setup-screen,#tp-edit-screen{display:none!important;}
</style></head><body></body></html>`);
  boardWin.document.close();
  startBoardMirror();
}

// Patcht target so es source entspricht, ohne unveränderte Knoten neu zu
// erschaffen. Ein simples innerHTML-Replace (frühere Variante) hat bei JEDER
// Mutation irgendwo im Mainscreen (Score-Update, Buzzer-Ping, GM-Refresh, …)
// den kompletten Popout-DOM neu aufgebaut - das hat u.a. bereits fertige
// CSS-Animationen (Stern-Intro etc.) und laufende Videos in den Einblendungen
// bei jeder Kleinigkeit von vorn starten lassen. Reines DOM-Patching lässt
// unveränderte Knoten (und ihre Animationen/Videos) in Ruhe.
function morphMirror(target, source) {
  if (target.nodeType === 1 && source.nodeType === 1) {
    const targetAttrs = target.attributes;
    for (let i = targetAttrs.length - 1; i >= 0; i--) {
      const name = targetAttrs[i].name;
      if (!source.hasAttribute(name)) target.removeAttribute(name);
    }
    for (let i = 0; i < source.attributes.length; i++) {
      const attr = source.attributes[i];
      if (target.getAttribute(attr.name) !== attr.value) target.setAttribute(attr.name, attr.value);
    }
  }
  let tChild = target.firstChild;
  let sChild = source.firstChild;
  while (sChild) {
    if (!tChild) {
      target.appendChild(sChild.cloneNode(true));
      sChild = sChild.nextSibling;
      continue;
    }
    const nextT = tChild.nextSibling;
    if (tChild.nodeType !== sChild.nodeType || tChild.nodeName !== sChild.nodeName) {
      target.replaceChild(sChild.cloneNode(true), tChild);
    } else if (sChild.nodeType === Node.TEXT_NODE || sChild.nodeType === Node.COMMENT_NODE) {
      if (tChild.nodeValue !== sChild.nodeValue) tChild.nodeValue = sChild.nodeValue;
    } else if (sChild.nodeType === Node.ELEMENT_NODE) {
      morphMirror(tChild, sChild);
    }
    tChild = nextT;
    sChild = sChild.nextSibling;
  }
  while (tChild) {
    const next = tChild.nextSibling;
    target.removeChild(tChild);
    tChild = next;
  }
}
function scheduleBoardMirror() {
  if (!boardWin || boardWin.closed || boardMirrorScheduled) return;
  boardMirrorScheduled = true;
  requestAnimationFrame(() => {
    boardMirrorScheduled = false;
    if (!boardWin || boardWin.closed) return;
    morphMirror(boardWin.document.body, document.body);
  });
}
function startBoardMirror() {
  if (boardMirrorObserver) boardMirrorObserver.disconnect();
  boardMirrorObserver = new MutationObserver(scheduleBoardMirror);
  boardMirrorObserver.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
  scheduleBoardMirror();
}

// ── GAMEMASTER ──
// Das GM-"Fenster" ist kein separates Popup mehr, sondern ein iframe direkt
// im Mainscreen (das Popout mit dem Board läuft ja jetzt eigenständig als
// Gamescreen - der Mainscreen ist damit frei für die Steuerung). Die ganze
// bestehende GM-Logik (commitGamemasterHtml, onclick="opener.xxx()" usw.)
// bleibt unverändert: contentWindow.opener wird manuell auf das Hauptfenster
// gesetzt, damit "opener.xxx()" in den generierten GM-Templates weiter
// funktioniert, obwohl es sich technisch nicht mehr um ein echtes Popup handelt.
function openGamemaster() {
  const overlay = document.getElementById('gm-embed-overlay');
  const frame = /** @type {HTMLIFrameElement} */ (document.getElementById('gm-embed-frame'));
  overlay.classList.add('visible');
  if (!gamemasterWin) {
    gamemasterWin = frame.contentWindow;
    gamemasterWin.opener = window;
  }
  updateGamemaster();
  startGmPoller();
  startGmRemoteCommandListener();
}
// Wird gezeigt, solange ein "Klicken zum Fortfahren"-Overlay (Intro, Tutorial,
// Zwischensequenz) den Hauptbildschirm blockiert - der Host muss dafür nicht
// an den Hauptbildschirm, sondern klickt hier "Weiter".
function updateGamemasterOverlay() {
  const hasTutSkip = !!activeTutorialSkip;
  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
  :root{color-scheme:dark;}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#0b0e2c;color:#fff;padding:20px;display:flex;flex-direction:column;min-height:100vh;align-items:center;justify-content:center;gap:20px;text-align:center;}
  h2{font-size:.65rem;text-transform:uppercase;letter-spacing:3px;color:rgba(255,255,255,.4);}
  .intro-hint{font-size:.85rem;color:rgba(255,255,255,.5);max-width:280px;line-height:1.5;}
  .gm-btn{padding:16px 30px;border:none;border-radius:10px;font-family:'Inter',sans-serif;font-size:1rem;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1.5px;transition:transform .08s ease-out,box-shadow .12s ease-out,filter .1s;box-shadow:0 4px 0 rgba(0,0,0,.3),0 6px 16px rgba(0,0,0,.25);}
  .gm-btn:hover{filter:brightness(1.12);transform:translateY(-2px);box-shadow:0 6px 0 rgba(0,0,0,.3),0 10px 20px rgba(0,0,0,.3);}
  .gm-btn:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.3),0 2px 8px rgba(0,0,0,.2);filter:brightness(.96);}
  .gm-btn.gold{background:linear-gradient(180deg,#FFD23F,#F0B800);color:#1a1200;}
  .gm-btn.gray{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1);}
</style></head><body>
  <h2>Zwischensequenz läuft</h2>
  <div class="intro-hint">Die Zuschauer sehen gerade eine Einleitung oder Zwischensequenz. Du musst den Hauptbildschirm nicht anfassen — steuere hier weiter.</div>
  <button class="gm-btn gold" onclick="opener.gmAdvance()">Weiter ▶</button>
  ${hasTutSkip ? `<button class="gm-btn gray" onclick="opener.gmSkipTutorial()">Tutorial überspringen</button>` : ''}
</body></html>`;
  commitGamemasterHtml(gmHtml);
}
// Solange die Turnierübersicht offen ist, kann der Host geheime Spiele im
// Spielplan vom GM-Panel aus live für die Zuschauer aufdecken.
function updateGamemasterTournament() {
  const rows = !tournament ? '' : tournament.games.map((g, i) => {
    const hidden = g.secret && !g.done;
    const label = hidden ? '??? (geheim)' : g.game;
    return `<div class="panel-row" style="justify-content:space-between;align-items:center;">
      <span>${i+1}. ${label}${g.done ? ' ✓' : ''}</span>
      ${hidden ? `<button class="gm-btn gold sm" onclick="opener.tournamentRevealSecret(${i})">🔓 Aufdecken</button>` : ''}
    </div>`;
  }).join('');
  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}</style></head><body>
  ${gmHeaderHtml('Gamemaster', tournament ? `Turnier · ${tournament.name}` : 'Turnier')}
  <div class="gm-body">
  <div class="gm-main">
  ${tournament
    ? `<div class="panel"><div class="panel-head"><span>📋 Spielplan</span></div>${rows || '<div class="hint-line">Noch keine Spiele geplant.</div>'}</div>`
    : `<div class="hint-line">Noch kein Turnier angelegt.</div>`}
  </div>
  <div class="gm-side">${gmNotesPanelHtml()}</div>
  </div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}
function updateGamemaster() {
  updateGMBar();
  if (!gamemasterWin || gamemasterWin.closed) return;
  if (gmActiveOverlay()) return updateGamemasterOverlay();
  if (wwmState.active) return updateGamemasterWwm();
  if (wwdsState.active) return updateGamemasterWwds();
  if (jeopardyState.active) return updateGamemasterJeopardy();
  if (ddfState.active) return updateGamemasterDdf();
  if (pihState.active) return updateGamemasterPih();
  if (tpState.active) return updateGamemasterTp();
  if (finaleState.active) return updateGamemasterFinale();
  if (screenActive('tournament-screen')) return updateGamemasterTournament();
  // Ohne diesen Zweig bleibt das GM-Fenster am Spielende auf dem letzten Stand
  // stehen: alle Modus-Flags sind aus, und der Feud-Fallback unten steigt bei
  // fehlender Frage wortlos aus - der Host kam nicht mehr zurück ins Menü.
  if (screenActive('result-screen')) return updateGamemasterResult();
  const q = state.roundQuestions[state.currentRound];
  if (!q) return;

  const strikesHtml = state.teamNames.map((name, i) => {
    const dots = [0,1,2].map(j => `<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;font-size:.7rem;font-weight:900;transition:all .25s ease;${j < state.teamStrikes[i] ? 'background:radial-gradient(circle, rgba(232,69,60,.35), rgba(198,40,40,.45));border:2px solid #E8453C;color:#FF6B6B;box-shadow:0 0 10px rgba(232,69,60,.25);' : 'background:rgba(255,255,255,.04);border:2px solid rgba(255,255,255,.1);color:rgba(255,255,255,.1);'}">✕</span>`).join('');
    return `<div style="display:flex;flex-direction:column;gap:6px;padding:8px 10px;border-radius:10px;${state.currentTeam===i?'background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.2);':'border:1px solid rgba(255,255,255,.06);'}">
      <span style="font-size:.6rem;font-weight:700;letter-spacing:2px;color:${state.currentTeam===i?'#FFD23F':'rgba(255,255,255,.3)'};text-transform:uppercase;">${name}</span>
      <div style="display:flex;gap:6px;">${dots}</div>
    </div>`;
  }).join('');

  const feudPresenceCount = feudBuzzer.presence.length;
  const feudPresenceRows = feudBuzzer.presence.length
    ? feudBuzzer.presence.map(p => `<div class="pr-row" style="flex-wrap:wrap;gap:6px;"><span class="pr-dot"></span>${playerAvatarHtml(p)}<span style="flex:1;">${escapeHtml(p.name)}</span>${playerTeamButtonsHtml(p, state.teamNames, 'opener.')}</div>`).join('')
    : `<div class="pr-empty">Noch niemand verbunden</div>`;
  const feudConnChip = feudBuzzer.connected
    ? `<span class="chip chip-ok">● Server verbunden</span>`
    : `<span class="chip chip-bad">● Offline</span>`;
  const feudConnectPanel = `
    <details class="panel">
      <summary class="panel-head">
        <span>👥 Verbunden</span>
        <span class="badge">${feudPresenceCount}</span>
        <span class="car">▸</span>
      </summary>
      <div class="pr-list" style="margin-top:8px;">${feudPresenceRows}</div>
      <div class="panel-row">
        <button class="gm-btn gray sm" onclick="opener.toggleJeopardyQR()">${document.getElementById('qr-overlay') ? '✕ QR schließen' : '📱 QR-Code'}</button>
        <button class="gm-btn gray sm" onclick="opener.popOutQR()">🗗 QR als Fenster</button>
        <button class="gm-btn gray sm" onclick="opener.feudBuzzToggleHidden();opener.updateGamemaster();">${feudBuzzer.hidden ? '👁 Anzeige einblenden' : '🙈 Anzeige ausblenden'}</button>
      </div>
    </details>`;
  const feudBuzzPanel = `
    <details class="panel" ${feudBuzzer.results.length ? 'open' : ''}>
      <summary class="panel-head"><span>🔔 Buzzer-Duell</span>${feudConnChip}<span class="car">▸</span></summary>
      <div style="margin-top:8px;">
      ${feudBuzzer.results.length
        ? feudBuzzer.results.map((r,idx) => `<div class="pr-row buzz-row ${idx===0?'first':''}"><span class="pr-rank">${idx+1}.</span>${escapeHtml(r.name)}<span class="buzz-time">${r.t.toFixed(2)}s</span></div>`).join('')
        : `<div class="hint-line">🔔 Buzzer ${feudBuzzer.armed?'scharf — warte auf Buzz…':'aus'}</div>`}
      <div class="panel-row" style="margin-top:8px;">
        ${state.teamNames.map((name,i) => `<button class="gm-btn gray sm" onclick="opener.feudSetStartTeam(${i})">→ ${name} beginnt</button>`).join('')}
      </div>
      </div>
    </details>`;

  const controlsHtml = `
    ${!state.allOut ? `<button class="gm-btn red" onclick="opener.addStrike()">Strike</button>` : ''}
    ${!state.allOut ? `<button class="gm-btn gray" onclick="opener.switchTeam();opener.updateActiveTeam();opener.updateGamemaster();">Team wechseln</button>` : ''}
    <button class="gm-btn gray" onclick="opener.revealAll()">Alle aufdecken</button>
    <button class="gm-btn orange" onclick="opener.undoLast()">↩ Undo</button>
    <button class="gm-btn gold" onclick="opener.nextRound()">Nächste Runde</button>`;

  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}</style></head><body>
  ${gmHeaderHtml('Gamemaster', `Family Feud · Runde ${state.currentRound+1} / ${state.roundQuestions.length}`)}
  <div class="gm-body">
  <div class="gm-main">
  <div class="gm-tabs">
    <button class="gm-tab ${gmFeudTab==='question'?'active':''}" onclick="opener.setGmFeudTab('question')">Aktuelle Frage</button>
    <button class="gm-tab ${gmFeudTab==='order'?'active':''}" onclick="opener.setGmFeudTab('order')">Reihenfolge</button>
  </div>
  ${gmFeudTab === 'order' ? `
  <div class="order-list">
    ${state.roundQuestions.map((rq,i) => `<div class="order-item ${i===state.currentRound?'current':(i<state.currentRound?'done':'')}">
      <span class="order-num">${i+1}.</span> <span>${rq.question}</span>
    </div>`).join('')}
  </div>
  ` : `
  <div class="active-team-label">${state.allOut ? '⚠ Alle Teams out' : 'Am Zug: ' + state.teamNames[state.currentTeam]}</div>
  <div class="strikes-section">${strikesHtml}</div>
  <div class="question" onclick="opener.revealQuestion()" style="cursor:pointer;">${q.question}</div>
  ${qNoteHtml(q.note)}
  <div class="answer-list">
  ${q.answers.map((a,i) => `<div class="answer ${state.revealed[i]?'shown':'hidden'}" ${!state.revealed[i] ? `onclick="opener.revealAnswer(${i})"` : ''}>
    <span><span class="num">${i+1}.</span> <span class="text">${a.text}</span></span>
    <span class="pts">${a.points}</span>
  </div>`).join('')}
  </div>
  ${mediaControlButtonsHtml(q.media, 'feudToggleMedia')}
  `}
  </div>
  <div class="gm-side">
  ${gmNotesPanelHtml()}
  ${feudBuzzPanel}
  ${feudConnectPanel}
  </div>
  </div>
  <div class="gm-actions">${controlsHtml}</div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}

function updateGamemasterFinale() {
  if (finaleState.phase === 'reveal') { updateGamemasterFinaleReveal(); return; }
  const q = finaleState.questions[finaleState.currentQ];
  if (!q) return;
  const ti = finaleState.teams[finaleState.currentTeamIdx];

  const scoresHtml = finaleState.teams.map((t, idx) => `
    <span style="color:${idx===finaleState.currentTeamIdx?'#FFD23F':'rgba(255,255,255,.4)'};font-weight:700;">
      ${state.teamNames[t]}: ${finaleState.scores[idx]}
    </span>`).join(' · ');

  const otherIdx = finaleState.currentTeamIdx === 0 ? 1 : 0;
  const otherAnswer = finaleState.teamAnswers[otherIdx] != null ? finaleState.teamAnswers[otherIdx][finaleState.currentQ] : undefined;

  const answersHtml = q.answers.map((a, i) => {
    const taken = otherAnswer === i;
    if (taken) return `
      <div class="answer" style="background:rgba(100,100,100,.1);border:1px solid rgba(100,100,100,.2);opacity:.4;cursor:default;">
        <span><span class="num">${i+1}.</span> <span class="text">${a.text}</span> <span style="font-size:.7rem;color:rgba(255,255,255,.3);margin-left:6px;">(vergeben)</span></span>
        <span class="pts" style="color:rgba(255,215,0,.3);">${a.points}</span>
      </div>`;
    return `
      <div class="answer hidden" style="cursor:pointer" onclick="opener.finalePickAnswer(${i})">
        <span><span class="num">${i+1}.</span> <span class="text">${a.text}</span></span>
        <span class="pts">${a.points}</span>
      </div>`;
  }).join('');

  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}</style></head><body>
  ${gmHeaderHtml('Gamemaster', `Finale · Frage ${finaleState.currentQ+1} / ${finaleState.questions.length}`)}
  <div class="gm-body">
  <div class="gm-main">
  <div class="active-team-label">Am Zug: ${state.teamNames[ti]}</div>
  <div style="font-size:.85rem;">${scoresHtml}</div>
  <div class="question">${q.question}</div>
  <div class="answer-list">${answersHtml}</div>
  </div>
  <div class="gm-side">${gmNotesPanelHtml()}</div>
  </div>
  <div class="gm-actions">
    <button class="gm-btn red" onclick="opener.finaleMarkMiss()">Nicht auf dem Board</button>
  </div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}

function updateGamemasterFinaleReveal() {
  const q = finaleState.questions[finaleState.revealQ];
  if (!q) return;
  const qi = finaleState.revealQ;
  const team1Ans = finaleState.teamAnswers[0][qi];
  const team2Ans = finaleState.teamAnswers[1][qi];
  const team1Text = team1Ans >= 0 ? q.answers[team1Ans].text : 'Nicht auf dem Board';
  const team2Text = team2Ans >= 0 ? q.answers[team2Ans].text : 'Nicht auf dem Board';
  const team1Pts = team1Ans >= 0 ? q.answers[team1Ans].points : 0;
  const team2Pts = team2Ans >= 0 ? q.answers[team2Ans].points : 0;

  const scoresHtml = finaleState.teams.map((t, idx) => `
    <span style="color:#FFD23F;font-weight:700;">
      ${state.teamNames[t]}: ${finaleState.scores[idx]}
    </span>`).join(' · ');

  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}
  .team-result{padding:10px 14px;border-radius:8px;font-weight:600;font-size:.9rem;display:flex;justify-content:space-between;align-items:center;}
</style></head><body>
  ${gmHeaderHtml('Gamemaster', `Auflösung · Frage ${qi+1} / ${finaleState.questions.length}`)}
  <div class="gm-body">
  <div class="gm-main">
  <div style="font-size:.85rem;">${scoresHtml}</div>
  <div class="question">${q.question}</div>
  <div class="team-result" style="background:rgba(${team1Ans>=0?'34,197,94':'232,69,60'},.1);border:1px solid rgba(${team1Ans>=0?'34,197,94':'232,69,60'},.3);">
    <span>${state.teamNames[finaleState.teams[0]]}: <strong>${team1Text}</strong></span>
    <span style="color:#FFD23F;font-weight:700;">${team1Pts} Pkt</span>
  </div>
  <div class="team-result" style="background:rgba(${team2Ans>=0?'34,197,94':'232,69,60'},.1);border:1px solid rgba(${team2Ans>=0?'34,197,94':'232,69,60'},.3);">
    <span>${state.teamNames[finaleState.teams[1]]}: <strong>${team2Text}</strong></span>
    <span style="color:#FFD23F;font-weight:700;">${team2Pts} Pkt</span>
  </div>
  </div>
  <div class="gm-side">${gmNotesPanelHtml()}</div>
  </div>
  <div class="gm-actions">
    <button class="gm-btn gold" onclick="opener.finaleNextReveal()">Nächste Frage</button>
  </div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}

function updateGamemasterJeopardy() {
  const teamColors = [['#E8453C','#C62828'],['#3B82F6','#1D4ED8'],['#22C55E','#16a34a']];
  const scoresHtml = jeopardyState.teamNames.map((name, i) => `
    <div class="score-card" style="border-left:4px solid ${teamColors[i][0]};">
      <div class="score-name">${name}</div>
      <div class="score-val">${jeopardyState.scores[i]}</div>
    </div>`).join('');

  // ── Verbunden-Panel (Presence) + Steuerung — immer sichtbar, unabhängig vom Frage-Status ──
  const presenceCount = jeopardyBuzzer.presence.length;
  const presenceRows = jeopardyBuzzer.presence.length
    ? jeopardyBuzzer.presence.map(p => `<div class="pr-row" style="flex-wrap:wrap;gap:6px;"><span class="pr-dot"></span>${playerAvatarHtml(p)}<span style="flex:1;">${escapeHtml(p.name)}</span>${playerTeamButtonsHtml(p, jeopardyState.teamNames, 'opener.')}</div>`).join('')
    : `<div class="pr-empty">Noch niemand verbunden</div>`;
  const connChip = jeopardyBuzzer.connected
    ? `<span class="chip chip-ok">● Server verbunden</span>`
    : `<span class="chip chip-bad">● Offline</span>`;
  const connectPanel = `
    <details class="panel">
      <summary class="panel-head">
        <span>👥 Verbunden</span>
        <span class="badge">${presenceCount}</span>
        <span class="car">▸</span>
      </summary>
      <div class="pr-list" style="margin-top:8px;">${presenceRows}</div>
      <div class="panel-row">
        <button class="gm-btn gray sm" onclick="opener.toggleJeopardyQR()">${document.getElementById('qr-overlay') ? '✕ QR schließen' : '📱 QR-Code'}</button>
        <button class="gm-btn gray sm" onclick="opener.popOutQR()">🗗 QR als Fenster</button>
        <button class="gm-btn gray sm" onclick="opener.jeopardyBuzzToggleHidden();opener.updateGamemaster();">${jeopardyBuzzer.hidden ? '👁 Anzeige einblenden' : '🙈 Anzeige ausblenden'}</button>
      </div>
    </details>`;

  let body;
  let sideHtml;
  let controlsHtml;
  if (jeopardyState.currentClue && jeopardyState.ddPending) {
    // Daily Double — private warning before it pops on the main screen
    body = `
      <div class="round-label warn">⚠ Achtung — Daily Double</div>
      <div class="scores-row">${scoresHtml}</div>
      <div class="dd-card">
        <div class="dd-title">★ DAILY DOUBLE ★</div>
        <div class="dd-sub">Dieses Feld ist das versteckte Daily Double.<br>
          Nur das Team, das es gewählt hat, darf antworten — es gibt <b>doppelte Punkte</b>
          (${JEOPARDY_VALUES[jeopardyState.currentClue.row] * 2}), bei falscher Antwort
          −${Math.round(JEOPARDY_VALUES[jeopardyState.currentClue.row] / 2)}.</div>
        <div class="dd-sub" style="margin-top:10px;">Welches Team hat das Feld gewählt?</div>
        <div class="btn-grid" style="margin-top:6px;">
          ${jeopardyState.teamNames.map((name, i) => `
            <button class="gm-btn" style="background:${jeopardyState.ddTeam === i
                ? `linear-gradient(180deg,${teamColors[i][0]},${teamColors[i][1]})`
                : 'rgba(255,255,255,.06)'};color:#fff;border:1px solid ${teamColors[i][0]};"
              onclick="opener.jeopardySetDdTeam(${i})">${jeopardyState.ddTeam === i ? '✓ ' : ''}${escapeHtml(name)}</button>`).join('')}
        </div>
      </div>`;
    sideHtml = connectPanel;
    controlsHtml = `
        ${jeopardyState.ddTeam === null
          ? `<span class="hint-line">Erst das Team wählen, dann ansagen.</span>`
          : `<button class="gm-btn gold" onclick="opener.jeopardyAnnounceDaily()">★ Ansagen &amp; Frage aufdecken</button>`}
        <button class="gm-btn orange" onclick="opener.jeopardyUndo()">↩ Undo</button>`;
  } else if (jeopardyState.currentClue) {
    // Clue control view
    const { col, row } = jeopardyState.currentClue;
    const cat = jBoard()[col];
    const clue = cat.clues[row];
    const val = jeopardyClueValue();
    const minus = jeopardyDeductValue();
    const ddBadge = jeopardyState.currentIsDaily ? ` <span class="dd-inline">★ DAILY DOUBLE</span>` : '';
    // Automatische Wertung: das Team des ersten Buzzers ist aus der Lobby bekannt.
    // Beim Daily Double wird nicht gebuzzert - dort zählt nur das wählende Team.
    const buzzTeam = jeopardyState.currentIsDaily ? null : jeopardyBuzzTeam();
    const buzzName = buzzTeam !== null && jeopardyBuzzer.results[0] ? jeopardyBuzzer.results[0].name : '';
    // Eine Zeile pro Team: Name, Punktestand und beide Knöpfe an einem Ort.
    // Beim Daily Double bleibt nur das wählende Team übrig - so können die
    // Punkte gar nicht erst beim falschen Team landen.
    // Wer gebuzzert hat, steht oben und ist hervorgehoben; sein Minus-Knopf
    // öffnet den Buzzer gleich wieder für die anderen.
    const wertbar = jeopardyState.teamNames
      .map((name, i) => ({ name, i }))
      .filter(t => jeopardyTeamMayAnswer(t.i))
      .sort((a, b) => Number(b.i === buzzTeam) - Number(a.i === buzzTeam));
    const scoreRows = `<div class="score-rows">${wertbar.map(({ name, i }) => {
      const dran = i === buzzTeam;
      return `
      <div class="score-row${dran ? ' buzzed' : ''}" style="--team:${teamColors[i][0]};">
        <span class="sr-name">${escapeHtml(name)}</span>
        <span class="sr-val">${jeopardyState.scores[i]}</span>
        ${dran ? `<span class="sr-buzz">🔔 ${escapeHtml(buzzName)}</span>` : ''}
        <span class="sr-gap"></span>
        <span class="sr-btns">
          <button class="sr-btn plus" onclick="opener.jeopardyScore(${i})">+${val}</button>
          <button class="sr-btn minus" onclick="opener.${dran ? `jeopardyWrongReopen(${i})` : `jeopardyDeduct(${i})`}">−${minus}</button>
        </span>
      </div>`;
    }).join('')}</div>`;
    const staged = clue.staged && clue.stageImg;
    let stageBtn = '';
    if (staged){
      const g = jeopardyStageGrid(clue);
      const done = jeopardyState.stageRevealed.length;
      stageBtn = done < g.total
        ? `<button class="gm-btn gold" onclick="opener.jeopardyStageReveal()">🧩 Feld aufdecken (${done}/${g.total})</button>`
        : `<span class="hint-ok">✓ Bild komplett aufgedeckt</span>`;
    }
    const series = clue.series && jeopardySeriesImgs(clue).length > 0;
    let seriesBtn = '';
    if (series){
      const total = jeopardySeriesImgs(clue).length;
      const done = jeopardyState.seriesRevealed;
      seriesBtn = done < total
        ? `<button class="gm-btn gold" onclick="opener.jeopardySeriesReveal()">🎴 Nächstes Bild (${done}/${total})</button>`
        : `<span class="hint-ok">✓ Alle Bilder aufgedeckt</span>`;
    }
    const media = [
      clue.qImg ? '<span class="tag tag-blue">🖼 Frage-Bild</span>' : '',
      staged ? '<span class="tag tag-gold">🧩 Staffel-Bild</span>' : '',
      series ? `<span class="tag tag-gold">🎴 Bilder-Reihe (${jeopardySeriesImgs(clue).length})</span>` : '',
      clue.aImg ? '<span class="tag tag-green">🖼 Lösungs-Bild</span>' : '',
      clue.sound ? '<span class="tag tag-purple">🔊 Sound</span>' : '',
    ].filter(Boolean).join(' ');
    const soundBtn = clue.sound
      ? (jeopardySoundPlaying()
          ? `<button class="gm-btn purple" onclick="opener.jeopardyStopSound()">⏹ Sound stoppen</button>`
          : `<button class="gm-btn purple" onclick="opener.jeopardyPlaySound()">🔊 Sound abspielen</button>`)
      : '';
    const excludedTag = jeopardyBuzzer.excluded.length
      ? `<div class="excl-tag">🚫 Gesperrt: ${jeopardyBuzzer.excluded.join(', ')}</div>` : '';
    // Schätzfrage: statt der Buzzer-Reihenfolge die eingegangenen Schätzungen
    const buzzHtml = clue.estimate
      ? `<div class="panel">
          <div class="panel-head">
            <span>📊 Schätzungen</span>
            <span class="badge">${jeopardyEstimate.answers.length}</span>
          </div>
          <div class="answer-list" style="margin-top:8px;">${jeopardyEstimateListHtml()}</div>
          <div class="hint-line">${jeopardyEstimate.open
            ? 'Eingabe auf den Handys ist <b>offen</b>.'
            : 'Eingabe ist <b>geschlossen</b>.'}</div>
        </div>`
      : jeopardyBuzzer.results.length
      ? `<div class="panel">
          <div class="panel-head"><span>🔔 Buzzer-Reihenfolge</span></div>
          ${jeopardyBuzzer.results.map((r,idx)=>`<div class="pr-row buzz-row ${idx===0?'first':''}"><span class="pr-rank">${idx+1}.</span>${escapeHtml(r.name)}<span class="buzz-time">${r.t.toFixed(2)}s</span></div>`).join('')}
          ${excludedTag}
        </div>`
      : jeopardyState.currentIsDaily
      // Beim Daily Double wird nicht gebuzzert - ein Hinweis auf den Buzzer
      // wäre hier schlicht falsch.
      ? `<div class="hint-line">★ Daily Double — kein Buzzer, nur <b>${escapeHtml(jeopardyState.teamNames[jeopardyState.ddTeam] || '')}</b> antwortet ${connChip}</div>`
      : `<div class="hint-line">🔔 Buzzer ${jeopardyBuzzer.armed?'scharf — warte auf Buzz…':'aus'} ${connChip}${excludedTag}</div>`;
    const revealed = jeopardyState.questionRevealed;
    body = `
      <div class="round-label">${revealed ? 'Frage offen' : 'Frage verdeckt'} · ${escapeHtml(cat.name)} · ${val}${ddBadge}</div>
      ${revealed ? '' : `<div class="scores-row">${scoresHtml}</div>`}
      <div class="clue-box">
        ${clue.q?`<div class="clue-q">${escapeHtml(clue.q)}</div>`:''}
        ${media?`<div class="media-row">${media}</div>`:''}
        <div class="clue-a">Lösung: <strong>${escapeHtml(clue.a||'(nur Bild)')}</strong></div>
      </div>
      ${qNoteHtml(clue.note)}
      ${mediaControlButtonsHtml(clue.media, 'jeopardyToggleMedia')}
      ${!revealed ? `
        <div class="info-card">
          Frage ist noch <b>verdeckt</b> (nur du siehst sie oben).<br>${clue.estimate
            ? 'Beim Aufdecken öffnet sich auf allen Handys das <b>Schätz-Eingabefeld</b>.'
            : 'Buzzer sind <b>live</b> — wer jetzt buzzert, wird 3&nbsp;Sek. gesperrt.'}
        </div>
      ` : `
        ${(staged||series||soundBtn)?`<div class="btn-grid">${stageBtn}${seriesBtn}${soundBtn}</div>`:''}
        ${scoreRows}
      `}`;
    sideHtml = `${buzzHtml}${connectPanel}`;
    controlsHtml = !revealed ? `
          <button class="gm-btn gold" onclick="opener.jeopardyRevealQuestion()">👁 Frage aufdecken</button>
          <button class="gm-btn gray" onclick="opener.jeopardySkip()">Überspringen</button>
          <button class="gm-btn orange" onclick="opener.jeopardyUndo()">↩ Undo</button>` : `
          <button class="gm-btn blue" onclick="opener.jeopardyToggleAnswer()">${jeopardyState.answerShown ? 'Lösung verbergen' : 'Lösung zeigen'}</button>
          ${clue.estimate
            ? (jeopardyEstimate.open
                ? `<button class="gm-btn gray" onclick="opener.jeopardyEstimateClose()">📊 Eingabe schließen</button>`
                : `<button class="gm-btn gray" onclick="opener.jeopardyEstimateReopen()">📊 Eingabe neu öffnen</button>`)
            : jeopardyState.currentIsDaily
            // Kein "Buzzer neu" beim Daily Double: es hat nie jemand gebuzzert,
            // und ein zweiter Versuch für die anderen wäre gegen die Regel.
            ? ''
            : `<button class="gm-btn gray" onclick="opener.jeopardyBuzzReopen()">🔔 Buzzer neu (1. gesperrt)</button>`}
          <button class="gm-btn gray" onclick="opener.jeopardySkip()">Niemand / Überspringen</button>
          <button class="gm-btn orange" onclick="opener.jeopardyUndo()">↩ Undo</button>`;
  } else {
    // Board mirror view
    const cats = jBoard();
    const cols = cats.length;
    let boardHtml = `<div class="jboard" style="grid-template-columns:repeat(${cols},1fr);">`;
    cats.forEach(cat => {
      boardHtml += `<div class="jcat">${escapeHtml(cat.name)}</div>`;
    });
    JEOPARDY_VALUES.forEach((val, row) => {
      cats.forEach((cat, col) => {
        const used = jeopardyState.used[col][row];
        boardHtml += used
          ? `<div class="jcell used"></div>`
          // Ohne escAttr zerlegt ein Anfuehrungszeichen in der Frage
          // ("Ich bin ein Berliner") das title-Attribut und damit die Zelle.
          : `<div class="jcell" onclick="opener.openJeopardyClue(${col},${row})" title="${escAttr(cat.clues[row].q)}">${val}</div>`;
      });
    });
    boardHtml += `</div>`;
    body = `
      <div class="round-label">Board ${jeopardyState.currentBoard + 1} / ${JEOPARDY_BOARDS} · Feld wählen</div>
      <div class="scores-row">${scoresHtml}</div>
      ${boardHtml}`;
    sideHtml = connectPanel;
    controlsHtml = `<button class="gm-btn orange" onclick="opener.jeopardyUndo()">↩ Undo</button>`;
  }

  const gmHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<meta name="color-scheme" content="dark">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>${GM_SHARED_CSS}
  .dd-card{background:linear-gradient(180deg,rgba(255,210,63,.14),rgba(245,158,11,.06));border:1px solid rgba(255,210,63,.4);border-radius:12px;padding:20px;text-align:center;}
  .dd-title{font-family:'Bebas Neue',sans-serif;font-size:1.9rem;color:#FFD23F;letter-spacing:3px;}
  .dd-sub{font-size:.8rem;color:rgba(255,255,255,.7);margin-top:8px;line-height:1.55;}
  .jboard{display:grid;gap:3px;}
  .jcat{background:linear-gradient(180deg,#1a2a8a,#111d6e);text-align:center;padding:6px 3px;font-size:.5rem;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:#fff;display:flex;align-items:center;justify-content:center;min-height:36px;line-height:1.2;border-radius:5px;}
  .jcell{background:linear-gradient(180deg,#1a2a8a,#111d6e);text-align:center;font-family:'Bebas Neue',sans-serif;font-size:1.25rem;color:#FFD23F;display:flex;align-items:center;justify-content:center;min-height:40px;cursor:pointer;border-radius:5px;transition:background .12s, transform .1s;}
  .jcell:hover{background:linear-gradient(180deg,#2a3eb0,#1a2e8a);transform:scale(1.03);}
  .jcell.used{background:#080c1e;cursor:default;}
  .clue-box{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px;}
  .clue-q{font-size:1rem;font-weight:700;line-height:1.5;margin-bottom:10px;}
  .clue-a{font-size:.92rem;color:#4ADE80;font-weight:700;padding-top:10px;border-top:1px dashed rgba(255,255,255,.1);}
</style></head><body>
  <div class="gm-header">
    <div class="gm-title">JEOPARDY<small>Gamemaster</small></div>
    ${connChip}
  </div>
  <div class="gm-body">
    <div class="gm-main">${body}</div>
    <div class="gm-side">${gmNotesPanelHtml()}${sideHtml}</div>
  </div>
  <div class="gm-actions">${controlsHtml}</div>
</body></html>`;
  commitGamemasterHtml(gmHtml);
}

function confetti(big){
  SFX.fanfare(big);
  const c=['#FFD23F','#E8453C','#3B82F6','#22C55E','#F97316','#fff'];
  const count = big ? 160 : 80;
  for(let i=0;i<count;i++){
    const p=document.createElement('div');p.className='confetti-p';
    p.style.cssText=`left:${Math.random()*100}vw;width:${5+Math.random()*8}px;height:${5+Math.random()*8}px;background:${c[Math.floor(Math.random()*c.length)]};animation-duration:${1.5+Math.random()*2.5}s;animation-delay:${Math.random()*(big?1.2:1)}s;border-radius:${Math.random()>.5?'50%':'2px'}`;
    document.body.appendChild(p);p.addEventListener('animationend',()=>p.remove());
  }
  if (big){
    // Zweite Konfetti-Welle für den großen Moment (Jackpot / Turniersieger)
    setTimeout(() => {
      for(let i=0;i<100;i++){
        const p=document.createElement('div');p.className='confetti-p';
        p.style.cssText=`left:${Math.random()*100}vw;width:${5+Math.random()*8}px;height:${5+Math.random()*8}px;background:${c[Math.floor(Math.random()*c.length)]};animation-duration:${1.5+Math.random()*2.5}s;animation-delay:${Math.random()}s;border-radius:${Math.random()>.5?'50%':'2px'}`;
        document.body.appendChild(p);p.addEventListener('animationend',()=>p.remove());
      }
    }, 500);
  }
}

// ── TUTORIAL ──
function showTutorial() { runTutorial(feudTutorialSlides()); }

function toggleGMBar() {
  const bar = document.getElementById('gm-bar');
  const gameActive = screenActive('game-screen');
  const finaleActive = screenActive('finale-screen');
  const jeopardyActive = screenActive('jeopardy-screen');
  const wwmActive = screenActive('wwm-screen');
  const wwdsActive = screenActive('wwds-screen');
  const resultActive = screenActive('result-screen');
  // Während eines Tutorials ist kein Screen aktiv - die Leiste soll sich aber
  // öffnen lassen, weil dort jetzt der Überspringen-Knopf sitzt.
  if (!gameActive && !finaleActive && !jeopardyActive && !wwmActive && !wwdsActive && !resultActive && !activeTutorialSkip) return;
  bar.classList.toggle('visible');
  if (bar.classList.contains('visible')) updateGMBar();
}

function updateGMBar() {
  const bar = document.getElementById('gm-bar');
  if (!bar.classList.contains('visible')) return;

  // Zuerst prüfen: ein laufendes Tutorial liegt über allem anderen
  if (activeTutorialSkip) {
    bar.innerHTML = `<span class="gm-label">Tutorial</span>
      <button class="gm-btn gm-gold" onclick="gmAdvance()">Weiter ▶</button>
      <button class="gm-btn gm-gray" onclick="gmSkipTutorial();updateGMBar();">Überspringen</button>`;
    return;
  }

  if (wwmState.active) {
    bar.innerHTML = `<span class="gm-label">Millionär</span>` + wwmBarButtons();
    return;
  }

  if (wwdsState.active) {
    bar.innerHTML = `<span class="gm-label">Sowas</span>` + wwdsBarButtons();
    return;
  }

  if (screenActive('result-screen')) {
    bar.innerHTML = `<span class="gm-label">Spiel beendet</span>
      <button class="gm-btn gm-gold" onclick="gmBackToMenu()">🏠 Zum Menü</button>
      <button class="gm-btn gm-blue" onclick="gmPlayAgain()">↻ Nochmal spielen</button>`;
    return;
  }

  if (jeopardyState.active) {
    if (jeopardyState.ddPending) {
      bar.innerHTML = `
        <span class="gm-label" style="color:#FFD23F;">★ Daily Double</span>
        <button class="gm-btn gm-gold" onclick="jeopardyAnnounceDaily();updateGMBar();">★ Ansagen &amp; aufdecken</button>
        <button class="gm-btn gm-blue" onclick="jeopardyUndo();updateGMBar();">↩ Undo</button>
      `;
      return;
    }
    if (jeopardyState.currentClue && !jeopardyState.questionRevealed) {
      bar.innerHTML = `
        <span class="gm-label">Jeopardy</span>
        <button class="gm-btn gm-gold" onclick="jeopardyRevealQuestion();updateGMBar();">👁 Frage aufdecken</button>
        <button class="gm-btn gm-gray" onclick="jeopardySkip();updateGMBar();">Überspringen</button>
        <button class="gm-btn gm-blue" onclick="jeopardyUndo();updateGMBar();">↩ Undo</button>
      `;
      return;
    }
    if (jeopardyState.currentClue) {
      // Beim Daily Double bleibt auch in der Sternleiste nur das wählende Team.
      const teamBtns = jeopardyState.teamNames.map((name, i) => ({ name, i }))
        .filter(t => jeopardyTeamMayAnswer(t.i))
        .map(({ name, i }) =>
        `<button class="gm-btn" style="background:linear-gradient(180deg,${['#E8453C','#3B82F6','#22C55E'][i]},${['#C62828','#1D4ED8','#16a34a'][i]});color:#fff;" onclick="jeopardyScore(${i})">✓ ${escapeHtml(name)} +${jeopardyClueValue()}</button>`).join('');
      const cc = jBoard()[jeopardyState.currentClue.col].clues[jeopardyState.currentClue.row];
      let stageBtn = '';
      if (cc.staged && cc.stageImg){
        const g = jeopardyStageGrid(cc); const done = jeopardyState.stageRevealed.length;
        if (done < g.total) stageBtn = `<button class="gm-btn gm-gold" onclick="jeopardyStageReveal();updateGMBar();">🧩 Feld (${done}/${g.total})</button>`;
      }
      let soundBtn = '';
      if (cc.sound) soundBtn = jeopardySoundPlaying()
        ? `<button class="gm-btn" style="background:linear-gradient(180deg,#8B5CF6,#6D28D9);color:#fff;" onclick="jeopardyStopSound();updateGMBar();">⏹ Sound</button>`
        : `<button class="gm-btn" style="background:linear-gradient(180deg,#8B5CF6,#6D28D9);color:#fff;" onclick="jeopardyPlaySound();updateGMBar();">🔊 Sound</button>`;
      bar.innerHTML = `
        <span class="gm-label">Jeopardy</span>
        ${stageBtn}
        ${soundBtn}
        ${teamBtns}
        <button class="gm-btn gm-blue" onclick="jeopardyToggleAnswer();updateGMBar();">${jeopardyState.answerShown ? 'Lösung verbergen' : 'Lösung zeigen'}</button>
        ${cc.estimate
          ? (jeopardyEstimate.open
              ? `<button class="gm-btn gm-gray" onclick="jeopardyEstimateClose();updateGMBar();">📊 Eingabe schließen (${jeopardyEstimate.answers.length})</button>`
              : `<button class="gm-btn gm-gray" onclick="jeopardyEstimateReopen();updateGMBar();">📊 Eingabe neu öffnen</button>`)
          : jeopardyState.currentIsDaily
          ? ''
          : `<button class="gm-btn gm-gray" onclick="jeopardyBuzzReopen();updateGMBar();">🔔 Buzzer neu</button>`}
        <button class="gm-btn gm-gray" onclick="jeopardySkip();updateGMBar();">Überspringen</button>
        <button class="gm-btn gm-blue" onclick="jeopardyUndo();updateGMBar();">↩ Undo</button>
      `;
    } else {
      bar.innerHTML = `
        <span class="gm-label">Jeopardy</span>
        <button class="gm-btn gm-blue" onclick="jeopardyUndo();updateGMBar();">↩ Undo</button>
      `;
    }
    return;
  }

  if (finaleState.active) {
    const isReveal = finaleState.phase === 'reveal';
    bar.innerHTML = `
      <span class="gm-label">${isReveal ? 'Auflösung' : 'Finale'}</span>
      ${isReveal
        ? `<button class="gm-btn gm-gold" onclick="finaleNextReveal()">Nächste Frage</button>`
        : `<button class="gm-btn gm-red" onclick="finaleMarkMiss()">Nicht auf dem Board</button>`
      }
    `;
    return;
  }

  const q = state.roundQuestions[state.currentRound];
  if (!q) return;
  bar.innerHTML = `
    <span class="gm-label">Runde ${state.currentRound+1}</span>
    ${!state.allOut ? `<button class="gm-btn gm-red" onclick="addStrike()">Strike</button>` : ''}
    ${!state.allOut ? `<button class="gm-btn gm-gray" onclick="switchTeam();updateActiveTeam();updateGamemaster();updateGMBar();">Team wechseln</button>` : ''}
    <button class="gm-btn gm-gray" onclick="revealAll();updateGMBar();">Alle aufdecken</button>
    <button class="gm-btn gm-blue" onclick="undoLast();updateGMBar();">↩ Undo</button>
    <button class="gm-btn gm-gold" onclick="nextRound()">Nächste Runde</button>
  `;
}

loadFromStorage();
loadReactionBoard();
loadHostNotes();
loadTournament();
ensureImgHoverPreview();
ensureEditorTopBtn();
renderMenuIcons();
renderIryoHubLogo();
// Schriftart „Luckiest Guy" ist evtl. beim ersten Zeichnen noch nicht geladen -> danach neu rendern.
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (screenActive('menu-screen')) renderIryoHubLogo(); });
setText('sfx-toggle', SFX.enabled ? '🔊 Sound an' : '🔇 Sound aus');

// ── MENU ──
function handleLogoClick() {
  const gameActive = screenActive('game-screen');
  const finaleActive = screenActive('finale-screen');
  const jeopardyActive = screenActive('jeopardy-screen');
  const wwmActive = screenActive('wwm-screen');
  if (gameActive || finaleActive || jeopardyActive || wwmActive) toggleGMBar();
}

