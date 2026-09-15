/* Gemeinsame Basis: Sound, Logos, Screenwechsel, Overlays, Medien,
   Gamemaster-Grundlagen, Fragen-Editor, Bestenliste, Accounts, Host-Notizen.

   Herausgeloest aus index.html (Zeilen 2122-3268). Die Dateien sind klassische
   Skripte, kein type="module": die App haengt an rund 330 Inline-Handlern im
   Markup, und die finden ihre Funktionen nur im globalen Scope. Die Ladereihen-
   folge in index.html entspricht exakt der frueheren Reihenfolge in der Datei. */
// ── SFX ── Synthetisierte Soundeffekte (Web Audio API, keine externen Dateien nötig)
const SFX = (() => {
  let ctx = null;
  function ac(){ if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function tone(freq, start, dur, type, gain, glideTo){
    const c = ac(); const o = c.createOscillator(); const g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, c.currentTime + start);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + start + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, c.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  }
  // Abgesichert, weil das hier beim Laden auf oberster Ebene läuft: wirft
  // localStorage (Datei per Doppelklick geöffnet, Speicher gesperrt), stirbt
  // sonst der komplette Skriptblock und es startet gar nichts mehr.
  let enabled = true;
  try { enabled = localStorage.getItem('sfxEnabled') !== 'off'; } catch {}
  return {
    get enabled(){ return enabled; },
    toggle(){
      enabled = !enabled;
      try { localStorage.setItem('sfxEnabled', enabled ? 'on' : 'off'); } catch {}
      return enabled;
    },
    buzz(){ if(!enabled) return; tone(880, 0, .09, 'square', .12); },
    point(){ if(!enabled) return; tone(660, 0, .07, 'triangle', .14); tone(990, .06, .09, 'triangle', .12); },
    correct(){ if(!enabled) return; tone(523, 0, .11, 'triangle', .16); tone(659, .09, .11, 'triangle', .16); tone(880, .18, .18, 'triangle', .16); },
    wrong(){ if(!enabled) return; tone(220, 0, .22, 'sawtooth', .16, 110); },
    tick(){ if(!enabled) return; tone(1200, 0, .04, 'square', .07); },
    fanfare(big){ if(!enabled) return;
      const notes = big ? [523,659,784,1047,1319,1568] : [523,659,784,1047];
      notes.forEach((f,i) => tone(f, i*.13, .3, 'triangle', big ? .2 : .16));
      if (big) tone(1568, notes.length*.13, .6, 'square', .1);
    },
  };
})();

// Drei Balken: der oberste voll golden (metallischer Verlauf), die zwei
// darunter nur mit goldenem Rand - das Family-Feud-Logo.
const STAR_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FFF6E0"/><stop offset="9%" stop-color="#F5CD5E"/><stop offset="45%" stop-color="#DDA828"/><stop offset="100%" stop-color="#A97A10"/>
  </linearGradient></defs>
  <rect x="10" y="10" width="80" height="20" rx="5" fill="url(#sg)"/>
  <rect x="10" y="40" width="80" height="20" rx="5" fill="none" stroke="url(#sg)" stroke-width="4"/>
  <rect x="10" y="70" width="80" height="20" rx="5" fill="none" stroke="url(#sg)" stroke-width="4"/>
</svg>`;

// Vier perspektivische 3D-Spalten, eine leuchtet golden - das Jeopardy-Logo.
const DANGER_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FFE066"/><stop offset="100%" stop-color="#F0B800"/>
  </linearGradient></defs>
  <polygon points="10,18 10,80 24,84 24,14" fill="#3a3f6b"/>
  <polygon points="30,20 30,82 44,86 44,16" fill="url(#dg)"/>
  <polygon points="50,22 50,84 64,88 64,18" fill="#3a3f6b"/>
  <polygon points="70,24 70,86 84,90 84,20" fill="#3a3f6b"/>
</svg>`;

const TEAM_COLORS = ['red','blue','green'];

// ── LOGO ──
// Das Symbol über dem Schriftzug - je Spiel ein eigenes, gezeichnet in einer
// 80×80-Box mit demselben Gold-Verlauf (url(#goldGrad)) wie der Schriftzug.
function logoIconMarkup(icon) {
  switch (icon) {
    case 'wwm': // Person am angewinkelten Studio-Monitor mit vier gleichen A/B/C/D-Pillen (Wer wird Millionär)
      return `<circle cx="40" cy="13" r="11" fill="url(#goldGrad)"/>
        <path d="M18,50 Q18,29 40,29 Q62,29 62,50 Z" fill="url(#goldGrad)"/>
        <polygon points="10,49 70,49 65,77 15,77" fill="url(#goldGrad)"/>
        <polygon points="14,52.5 66,52.5 61.5,73.5 18.5,73.5" fill="#0b0e2c"/>
        <g fill="none" stroke="url(#goldGrad)" stroke-width="1.8">
          <rect x="22" y="56.75" width="16" height="4.5" rx="2.25"/>
          <rect x="42" y="56.75" width="16" height="4.5" rx="2.25"/>
          <rect x="22" y="64.75" width="16" height="4.5" rx="2.25"/>
          <rect x="42" y="64.75" width="16" height="4.5" rx="2.25"/>
        </g>`;
    case 'wwds': // Zwei Teams (je 2 Personen) am Pult, Moderator mittig mit waagerechter Karte (Wer weiß denn sowas)
      return `<g transform="translate(0,10) scale(0.8)">
        <circle cx="12" cy="27" r="5.5" fill="url(#goldGrad)"/><path d="M5.5,49 Q5.5,38 12,38 Q18.5,38 18.5,49 Z" fill="url(#goldGrad)"/>
        <circle cx="28" cy="27" r="5.5" fill="url(#goldGrad)"/><path d="M21.5,49 Q21.5,38 28,38 Q34.5,38 34.5,49 Z" fill="url(#goldGrad)"/>
        <rect x="3" y="48" width="34" height="17" rx="2" fill="url(#goldGrad)"/><rect x="7" y="51" width="26" height="11" rx="1.5" fill="#0b0e2c"/>
        <circle cx="72" cy="27" r="5.5" fill="url(#goldGrad)"/><path d="M65.5,49 Q65.5,38 72,38 Q78.5,38 78.5,49 Z" fill="url(#goldGrad)"/>
        <circle cx="88" cy="27" r="5.5" fill="url(#goldGrad)"/><path d="M81.5,49 Q81.5,38 88,38 Q94.5,38 94.5,49 Z" fill="url(#goldGrad)"/>
        <rect x="63" y="48" width="34" height="17" rx="2" fill="url(#goldGrad)"/><rect x="67" y="51" width="26" height="11" rx="1.5" fill="#0b0e2c"/>
        <circle cx="50" cy="16" r="7" fill="url(#goldGrad)"/><path d="M39,47 Q39,30 50,30 Q61,30 61,47 Z" fill="url(#goldGrad)"/>
        <rect x="39" y="39" width="22" height="11" rx="2" fill="url(#goldGrad)" stroke="#0b0e2c" stroke-width="1.4"/><line x1="43" y1="44.5" x2="57" y2="44.5" stroke="#0b0e2c" stroke-width="1.2" opacity=".6"/>
        <circle cx="39" cy="44.5" r="2.6" fill="url(#goldGrad)"/><circle cx="61" cy="44.5" r="2.6" fill="url(#goldGrad)"/>
      </g>`;
    case 'ddf': // Drei Silhouetten, zwei heben den Arm, der Dritte (rechts) duckt sich - der Dümmste (Der Dümmste fliegt)
      return `<g transform="scale(0.8)">
        <path d="M17,56 Q9,41 7,22" fill="none" stroke="url(#goldGrad)" stroke-width="5" stroke-linecap="round"/>
        <path d="M8,64 Q8,41 20,41 Q32,41 32,64 Z" fill="url(#goldGrad)"/>
        <circle cx="20" cy="33" r="9" fill="url(#goldGrad)"/>
        <path d="M47,56 Q39,41 37,22" fill="none" stroke="url(#goldGrad)" stroke-width="5" stroke-linecap="round"/>
        <path d="M38,64 Q38,41 50,41 Q62,41 62,64 Z" fill="url(#goldGrad)"/>
        <circle cx="50" cy="33" r="9" fill="url(#goldGrad)"/>
        <path d="M68,64 Q68,45 80,45 Q92,45 92,64 Z" fill="url(#goldGrad)"/>
        <circle cx="80" cy="37" r="9" fill="url(#goldGrad)"/>
      </g>`;
    case 'pih': // Preisschild mit Flamme (Der Preis ist heiß)
      return `<path d="M50,20 Q43,11 50,2 Q52,9 58,6 Q63,15 56,20 Z" fill="url(#goldGrad)"/>
        <path d="M28,24 L74,24 L74,72 L28,72 L6,48 Z" fill="url(#goldGrad)"/>
        <circle cx="32" cy="48" r="5.5" fill="#0b0e2c"/>
        <rect x="44" y="37" width="24" height="5" rx="2.5" fill="#0b0e2c"/>
        <rect x="44" y="46" width="24" height="5" rx="2.5" fill="#0b0e2c"/>
        <rect x="44" y="55" width="14" height="5" rx="2.5" fill="#0b0e2c"/>`;
    case 'trophy': // Rangliste - Stern über absteigenden Balken, Gesamtwertung (Turnier)
      return `<path d="M40,5 L43.2,13.6 L52.4,14 L45.2,19.7 L47.6,28.5 L40,23.5 L32.4,28.5 L34.8,19.7 L27.6,14 L36.8,13.6 Z" fill="url(#goldGrad)"/>
        <rect x="14" y="40" width="52" height="10" rx="2.5" fill="url(#goldGrad)"/>
        <rect x="14" y="54" width="40" height="10" rx="2.5" fill="url(#goldGrad)" opacity=".72"/>
        <rect x="14" y="68" width="28" height="10" rx="2.5" fill="url(#goldGrad)" opacity=".5"/>`;
    default: // drei Balken - Family Feud / Menü
      return `<rect x="0" y="0" width="80" height="20" rx="5" fill="url(#goldGrad)"/>
        <rect x="0" y="30" width="80" height="20" rx="5" fill="none" stroke="url(#goldGrad)" stroke-width="6"/>
        <rect x="0" y="60" width="80" height="20" rx="5" fill="none" stroke="url(#goldGrad)" stroke-width="6"/>`;
  }
}
function renderLogo(line1, line2, size2, icon) {
  const fs2 = size2 || 48;
  // Zweite Zeile hing an einer festen Grundlinie (y=110), während ihre
  // Schriftgrösse variabel war - bei der Standardgrösse 48 lief sie deshalb
  // 24px in die Zeile darüber. Grundlinie und viewBox-Höhe richten sich jetzt
  // nach der tatsächlichen Schriftgrösse.
  const y1 = 76;
  const y2 = y1 + Math.round(fs2 * 0.78) + 6;
  const vbH = Math.max(120, y2 + 12);
  let inner;
  if (icon === 'danger') {
    inner = `<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFE066"/><stop offset="50%" stop-color="#FFD23F"/><stop offset="100%" stop-color="#C6930A"/>
        </linearGradient>
        <linearGradient id="goldText" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFF"/><stop offset="100%" stop-color="#FFE8A0"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g transform="translate(121.8,0) scale(0.6)">
        <polygon points="10,18 10,80 24,84 24,14" fill="#3a3f6b"/>
        <polygon points="30,20 30,82 44,86 44,16" fill="url(#goldGrad)"/>
        <polygon points="50,22 50,84 64,88 64,18" fill="#3a3f6b"/>
        <polygon points="70,24 70,86 84,90 84,20" fill="#3a3f6b"/>
      </g>
      <text x="150" y="98" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="32" fill="url(#goldText)" filter="url(#glow)" letter-spacing="2">${line1}</text>
    </svg>`;
  } else {
    inner = `<svg viewBox="0 0 300 ${line2 ? vbH : 120}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFF6E0"/><stop offset="9%" stop-color="#F5CD5E"/><stop offset="45%" stop-color="#DDA828"/><stop offset="100%" stop-color="#A97A10"/>
        </linearGradient>
        <linearGradient id="goldText" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFF"/><stop offset="100%" stop-color="#FFE8A0"/>
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <g transform="translate(127,6) scale(0.575)">${logoIconMarkup(icon)}</g>
      ${line2
        ? `<text x="150" y="${y1}" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="22" fill="url(#goldText)" filter="url(#glow)" letter-spacing="6">${line1}</text>
           <text x="150" y="${y2}" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="${fs2}" fill="url(#goldText)" filter="url(#glow)" letter-spacing="3">${line2}</text>`
        : `<text x="150" y="98" text-anchor="middle" font-family="'Bebas Neue',sans-serif" font-size="38" fill="url(#goldText)" filter="url(#glow)" letter-spacing="4">${line1}</text>`
      }
    </svg>`;
  }
  document.getElementById('main-logo').innerHTML = inner;
}

// Menü-Karten: das eigene Gold-Logo jedes Spiels statt eines Emojis.
function gameCardIcon(key){
  if (key === 'feud') return STAR_SVG;
  if (key === 'jeopardy') return DANGER_SVG;
  const gid = 'cg_' + key;
  const grad = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFF6E0"/><stop offset="9%" stop-color="#F5CD5E"/><stop offset="45%" stop-color="#DDA828"/><stop offset="100%" stop-color="#A97A10"/></linearGradient></defs>`;
  const body = logoIconMarkup(key).split('url(#goldGrad)').join('url(#' + gid + ')');
  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">${grad}${body}</svg>`;
}
function renderMenuIcons(){
  document.querySelectorAll('.menu-card-icon[data-game]').forEach(el => { el.innerHTML = gameCardIcon(el.getAttribute('data-game')); });
}

// Hub-Logo: das IRYO-GAMESHOW-Schild (Blau & Gold) statt Schriftzug + Balken.
function renderIryoHubLogo(){
  const el = document.getElementById('main-logo'); if (!el) return;
  const S = 2, W = 900, H = 500;
  const cv = document.createElement('canvas'); cv.width = W*S; cv.height = H*S;
  const ctx = cv.getContext('2d'); ctx.scale(S,S);
  const octPts = (x,y,w,h,c) => [[x+c,y],[x+w-c,y],[x+w,y+c],[x+w,y+h-c],[x+w-c,y+h],[x+c,y+h],[x,y+h-c],[x,y+c]];
  const rp = (pts,r) => { ctx.beginPath(); const n=pts.length; const m=[(pts[0][0]+pts[1][0])/2,(pts[0][1]+pts[1][1])/2]; ctx.moveTo(m[0],m[1]); for(let i=0;i<n;i++){ const c=pts[(i+1)%n],nx=pts[(i+2)%n]; ctx.arcTo(c[0],c[1],nx[0],nx[1],r);} ctx.closePath(); };
  const oct = (x,y,w,h,c,r) => rp(octPts(x,y,w,h,c),r);
  ctx.save(); ctx.shadowColor='rgba(0,0,0,.45)'; ctx.shadowBlur=26; ctx.shadowOffsetY=8; oct(65,26,770,448,96,28); ctx.fillStyle='#000'; ctx.fill(); ctx.restore();
  oct(65,26,770,448,96,28); let g=ctx.createLinearGradient(0,26,0,474); g.addColorStop(0,'#FBE6A6'); g.addColorStop(.5,'#E9C25A'); g.addColorStop(1,'#C79A34'); ctx.fillStyle=g; ctx.fill(); ctx.lineWidth=2.5; ctx.strokeStyle='rgba(20,15,5,.5)'; ctx.stroke();
  oct(77,38,746,424,86,25); g=ctx.createLinearGradient(0,38,0,462); g.addColorStop(0,'#2f6fbf'); g.addColorStop(1,'#1c4a8f'); ctx.fillStyle=g; ctx.fill();
  oct(91,52,718,396,76,22); g=ctx.createRadialGradient(450,215,50,450,250,430); g.addColorStop(0,'#22345f'); g.addColorStop(1,'#0f1b3a'); ctx.fillStyle=g; ctx.fill();
  ctx.save(); oct(91,52,718,396,76,22); ctx.clip(); ctx.fillStyle='rgba(255,255,255,.07)'; for(let yy=74;yy<440;yy+=30) for(let xx=112;xx<792;xx+=30){ ctx.beginPath(); ctx.arc(xx,yy,2,0,7); ctx.fill(); } ctx.restore();
  const fit = (txt,tw,sp) => { ctx.letterSpacing=sp+'px'; ctx.font='120px "Luckiest Guy", sans-serif'; return 120*tw/ctx.measureText(txt).width; };
  const block = (txt,y,size,sp,stops,side,ol) => { ctx.textAlign='center'; ctx.font='400 '+size+'px "Luckiest Guy", sans-serif'; ctx.letterSpacing=sp+'px'; ctx.lineJoin='round'; const dp=Math.round(size*0.13); ctx.lineWidth=size*0.16; ctx.strokeStyle=ol; ctx.strokeText(txt,450,y+dp); for(let d=dp;d>=1;d--){ ctx.fillStyle=side; ctx.fillText(txt,450,y+d); } ctx.lineWidth=size*0.14; ctx.strokeStyle=ol; ctx.strokeText(txt,450,y); const gg=ctx.createLinearGradient(0,y-size*0.82,0,y+size*0.14); stops.forEach(s=>gg.addColorStop(s[0],s[1])); ctx.fillStyle=gg; ctx.fillText(txt,450,y); };
  block('IRYO',258,Math.min(200,fit('IRYO',500,4)),4,[[0,'#FFF0B0'],[.5,'#F6C23A'],[1,'#D98A12']],'#8a5a08','#5a3a05');
  block('GAMESHOW',372,Math.min(112,fit('GAMESHOW',540,4)),4,[[0,'#FFFFFF'],[.5,'#DCE8FF'],[1,'#A9C4EE']],'#4a5f88','#28324e');
  const sparkle = (x,y,r,rot) => { const i=r*0.17; ctx.save(); ctx.translate(x,y); ctx.rotate((rot||0)*Math.PI/180); ctx.beginPath(); ctx.moveTo(0,-r); ctx.lineTo(i,-i); ctx.lineTo(r,0); ctx.lineTo(i,i); ctx.lineTo(0,r); ctx.lineTo(-i,i); ctx.lineTo(-r,0); ctx.lineTo(-i,-i); ctx.closePath(); ctx.fillStyle='#FFF3C8'; ctx.fill(); ctx.restore(); };
  [[152,128,19,8],[120,190,8,-6],[758,158,15,10],[150,352,12,-8],[766,338,9,12]].forEach(s=>sparkle(s[0],s[1],s[2],s[3]));
  cv.style.cssText = 'width:min(400px,88vw);height:auto;filter:drop-shadow(0 6px 24px rgba(0,0,0,.45));';
  el.innerHTML = ''; el.appendChild(cv);
}

let finaleQuestions = [];

let questions = [
  { question: "Nenne etwas, das man im Kühlschrank findet.", answers: [
    {text:"Milch",points:35},{text:"Butter",points:25},{text:"Käse",points:18},{text:"Eier",points:12},{text:"Wurst",points:10}]},
  { question: "Nenne einen Grund, warum man zu spät zur Arbeit kommt.", answers: [
    {text:"Verschlafen",points:40},{text:"Stau",points:28},{text:"Bus/Bahn verpasst",points:15},{text:"Auto springt nicht an",points:10},{text:"Kinder",points:7}]},
  { question: "Nenne etwas, das man am Strand macht.", answers: [
    {text:"Schwimmen",points:35},{text:"Sonnenbaden",points:25},{text:"Sandburg bauen",points:18},{text:"Eis essen",points:12},{text:"Volleyball spielen",points:10}]},
  { question: "Nenne ein Tier, das man im Zoo sieht.", answers: [
    {text:"Löwe",points:30},{text:"Elefant",points:25},{text:"Affe",points:20},{text:"Giraffe",points:15},{text:"Tiger",points:10}]},
  { question: "Nenne etwas, das man zum Frühstück isst.", answers: [
    {text:"Brötchen/Brot",points:35},{text:"Müsli/Cornflakes",points:25},{text:"Eier",points:18},{text:"Marmelade",points:12},{text:"Joghurt",points:10}]}
];

let state = {
  teamCount: 2,
  scores: [0,0],
  teamStrikes: [0,0],
  currentTeam: 0,
  currentRound: 0,
  roundPoints: 0,
  strikes: 0,
  revealed: [],
  questionRevealed: false,
  roundQuestions: [],
  editingIndex: -1,
  editingFinale: false,
  editingMedia: [],
  allOut: false,
};

let actionHistory = [];

function saveSnapshot() {
  actionHistory.push({
    scores: [...state.scores],
    revealed: [...state.revealed],
    roundPoints: state.roundPoints,
    teamStrikes: [...state.teamStrikes],
    currentTeam: state.currentTeam,
    allOut: state.allOut,
  });
}

function undoLast() {
  if (!actionHistory.length) return;
  const prev = actionHistory.pop();
  state.scores = prev.scores;
  state.revealed = prev.revealed;
  state.roundPoints = prev.roundPoints;
  state.teamStrikes = prev.teamStrikes;
  state.currentTeam = prev.currentTeam;
  state.allOut = prev.allOut;
  updateScores(); updateRoundPts(); renderBoard(); updateStrikes(); updateActiveTeam(); updateGamemaster();
}

let finaleState = {
  active: false,
  teams: [],
  questions: [],
  currentTeamIdx: 0,
  currentQ: 0,
  scores: [0, 0],
  teamAnswers: [[], []],
  phase: 'answer',
  revealQ: 0
};

let gamemasterWin = null;
let gmFeudTab = 'question'; // 'question' oder 'order' - welcher Tab im Family-Feud-GM-Fenster aktiv ist
function setGmFeudTab(tab) { gmFeudTab = tab; updateGamemaster(); }

// ── GM-FERNSTEUERUNG FÜR KLICK-OVERLAYS (Intro/Tutorial/Zwischensequenzen) ──
// Alle "Klicken zum Fortfahren"-Overlays im Spiel tragen eine dieser Klassen/IDs.
// Der GM-Button simuliert einfach einen echten Klick darauf - kein Umbau der
// einzelnen Overlay-Funktionen nötig, deckt auch künftige Overlays automatisch ab.
const GM_OVERLAY_SELECTOR = '.intro-overlay, .welcome-overlay, .tut-overlay, .elim-overlay, #kg-overlay, .finale-click-overlay';
function gmActiveOverlay() { return document.querySelector(GM_OVERLAY_SELECTOR); }
function gmAdvance() { const el = gmActiveOverlay(); if (el) el.click(); }
function gmSkipTutorial() {
  if (activeTutorialSkip) activeTutorialSkip();
}
let gmPollerStarted = false;
let gmLastOverlayPresent = false;
// Overlays erscheinen/verschwinden durch normale DOM-Operationen ohne updateGamemaster()
// aufzurufen - ein leichter Poller hält das GM-Fenster trotzdem synchron.
function startGmPoller() {
  if (gmPollerStarted) return;
  gmPollerStarted = true;
  setInterval(() => {
    if (!gamemasterWin || gamemasterWin.closed) return;
    const present = !!gmActiveOverlay();
    if (present !== gmLastOverlayPresent) {
      gmLastOverlayPresent = present;
      updateGamemaster();
    }
  }, 250);
}

function toggleTeam3() {
  const on = document.getElementById('enable-team3').checked;
  document.getElementById('team3-card').style.display = on ? '' : 'none';
}

function showScreen(id) {
  // Editor-Änderungen sichern, bevor er verlassen wird (die Felder schreiben
  // direkt ins Objekt, ohne selbst zu speichern).
  const leaving = document.querySelector('.screen.active');
  if (leaving && leaving.id === 'wwds-edit-screen' && id !== 'wwds-edit-screen') wwdsSave();
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'edit-screen') renderQuestionList();
  if (id === 'jeopardy-edit-screen') renderJeopardyEditor();
  if (id === 'wwm-edit-screen') renderWwmEditor();
  if (id === 'wwds-edit-screen') renderWwdsEditor();
  if (id === 'wwds-setup-screen') { wwdsToggleTeam3(); ensureWwdsLobbyConnected(); }
  if (id === 'ddf-edit-screen') renderDdfEditor();
  if (id === 'ddf-setup-screen') { ddfLoadSettings(); renderDdfPlayerInputs(); ensureDdfLobbyConnected(); }
  if (id === 'pih-edit-screen') renderPihEditor();
  if (id === 'pih-setup-screen') { pihLoadSettings(); renderPihRulePick(); renderPihPlayerInputs(); ensurePihLobbyConnected(); }
  if (id === 'setup-screen') ensureFeudLobbyConnected();
  if (id === 'jeopardy-setup-screen') ensureJeopardyLobbyConnected();
  if (id === 'reaction-board-screen') renderReactionBoard();
  if (id === 'players-screen') { ensurePlayersConnected(); setPlayersTab(playersTab); }
  if (id === 'tournament-screen') { renderTournament(); updateGamemaster(); }
  if (id === 'result-screen') renderResultLeaderboard();
  // Eingebettetes GM-Panel nur beim echten Rücksprung zum Hauptmenü wieder
  // ausblenden - bleibt bei internen Übergängen (z.B. Feud → Finale) sichtbar,
  // genau wie das alte Popup-Fenster das auch nie automatisch geschlossen hat.
  if (id === 'menu-screen') document.getElementById('gm-embed-overlay').classList.remove('visible');
  // Logo per context
  if (id === 'menu-screen') renderIryoHubLogo();
  else if (id === 'tournament-screen') renderLogo('TURNIER', null, null, 'trophy');
  else if (id.startsWith('jeopardy')) renderLogo('JEOPARDY', null, null, 'danger');
  else if (id.startsWith('wwds')) renderLogo('WER WEISS', 'DENN SOWAS', 22, 'wwds');
  else if (id.startsWith('wwm')) renderLogo('WER WIRD', 'MILLIONÄR', 22, 'wwm');
  else if (id.startsWith('ddf')) renderLogo('DER DÜMMSTE', 'FLIEGT', 22, 'ddf');
  else if (id.startsWith('pih')) renderLogo('DER PREIS', 'IST HEISS', 22, 'pih');
  else renderLogo('KELLER', 'FEUD');
  // WWDS-, DDF- und Turnier-Logo etwas größer und ein Stück tiefer.
  const logoBox = document.querySelector('.logo');
  const logoSvg = document.querySelector('#main-logo svg');
  const bigLogo = ['wwm-setup-screen','wwm-edit-screen','wwds-setup-screen','wwds-edit-screen','ddf-setup-screen','ddf-edit-screen','pih-setup-screen','pih-edit-screen','tournament-screen'].includes(id);
  if (logoBox) logoBox.style.marginTop = bigLogo ? '44px' : '';
  if (logoSvg) logoSvg.style.width = bigLogo ? 'min(600px, 92vw)' : '';
  // Beim Screenwechsel ganz nach oben und den Hoch-Button neu bewerten.
  window.scrollTo(0, 0);
  updateEditorTopBtn();
}

// Blendet einen .black-backdrop aus und entfernt ihn danach. Wie closeOverlay
// unten: wartet NICHT blind auf animationend, weil Browser CSS-Animationen auf
// Fenstern drosseln/pausieren, die gerade im Hintergrund sind (z.B. wenn der
// Host gerade auf den Gamescreen-Popout statt den Mainscreen schaut) - dann
// feuert animationend nie und der Backdrop bleibt für immer schwarz stehen.
// Legt den schwarzen Hintergrund an, der während Intro-/Zwischensequenzen
// verhindert, dass darunterliegende Screens durchblitzen.
function addBlackBackdrop() {
  const bd = document.createElement('div');
  bd.className = 'black-backdrop';
  document.body.appendChild(bd);
  return bd;
}
// Zeigt ein Vollbild-Overlay, das der Host per Klick weiterschaltet - der
// Klick zählt erst nach delayMs, damit ein Doppelklick am Ende der vorigen
// Sequenz nicht ausversehen gleich die nächste überspringt.
function showClickOverlay(className, html, delayMs, onNext, styleOverride) {
  const ov = document.createElement('div');
  ov.className = className;
  if (styleOverride) ov.style.cssText = styleOverride;
  ov.innerHTML = html;
  document.body.appendChild(ov);
  let canClick = false;
  setTimeout(() => { canClick = true; }, delayMs);
  ov.addEventListener('click', () => { if (canClick) closeOverlay(ov, onNext); });
  return ov;
}
function fadeOutBackdrop(bd) {
  if (!bd) return;
  let finished = false;
  const finish = () => { if (finished) return; finished = true; bd.remove(); };
  bd.classList.add('fade-out');
  bd.addEventListener('animationend', (e) => { if (e.target === bd) finish(); });
  setTimeout(finish, 700);
}
function closeOverlay(overlay, onDone) {
  if (!overlay || overlay.dataset.closing === 'true') return;
  overlay.dataset.closing = 'true';
  overlay.style.pointerEvents = 'none';
  overlay.style.animation = 'introOut .5s ease-in forwards';
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    overlay.remove();
    if (typeof onDone === 'function') onDone();
  };
  // Child elements (star SVGs, tile reveals, strike pops, etc.) have their own
  // finite CSS animations whose animationend bubbles up here too — ignore those,
  // only the overlay's own fade-out should trigger the close.
  overlay.addEventListener('animationend', (e) => {
    if (e.target !== overlay) return;
    finish();
  });
  // Safety net: if animationend never fires (tab backgrounded, reduced-motion, etc.)
  // don't leave the overlay stuck forever.
  setTimeout(finish, 700);
}

// ── EINBLENDUNGEN (0-3 Bilder/Videos pro Frage, für alle drei Spiele) ──
// arr ist das media-Array direkt auf der Frage/Clue (per Referenz mutiert,
// daher funktioniert das gleich für ein Live-Objekt wie für ein Temp-Array).
function setMediaSlot(arr, slot, input, afterFn) {
  if (!input) { arr[slot] = null; afterFn(); return; }
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    arr[slot] = { type: f.type.startsWith('video') ? 'video' : 'image', data: r.result, name: f.name };
    afterFn();
  };
  r.readAsDataURL(f);
}
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

// Wert als JS-Argument in ein onclick="..." schreiben. escAttr allein reicht
// dafür nicht: es lässt ' durch, und ein Name wie O'Brien zerlegt dann den
// Handler. JSON.stringify quotet korrekt, escAttr entschärft anschließend die
// dabei entstehenden " fürs HTML-Attribut.
function escJsArg(v) { return escAttr(JSON.stringify(v == null ? '' : v)); }

// Schwebende Bild-Vorschau: jedes Element mit data-preview-name (und optional
// einem inneren img/video oder data-preview-src) zeigt beim Hover ein
// vergrößertes Bild samt Dateiname an - so lässt sich jedes eingebaute Bild
// überall im Editor eindeutig identifizieren.
function ensureImgHoverPreview() {
  if (document.getElementById('img-hover-preview')) return;
  const el = document.createElement('div');
  el.id = 'img-hover-preview';
  el.innerHTML = '<img alt=""><video muted></video><div class="ihp-name"></div>';
  document.body.appendChild(el);
  const imgEl = el.querySelector('img'), vidEl = el.querySelector('video'), nameEl = el.querySelector('.ihp-name');
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest && e.target.closest('[data-preview-name]');
    if (!t) return;
    const inner = t.matches('img,video') ? t : t.querySelector('img,video');
    const src = t.getAttribute('data-preview-src') || (inner && inner.getAttribute('src')) || '';
    const isVideo = inner && inner.tagName === 'VIDEO';
    imgEl.style.display = (src && !isVideo) ? 'block' : 'none';
    vidEl.style.display = (src && isVideo) ? 'block' : 'none';
    if (src && !isVideo) imgEl.src = src;
    if (src && isVideo) vidEl.src = src;
    nameEl.textContent = t.getAttribute('data-preview-name') || '';
    el.style.display = 'block';
  });
  document.addEventListener('mousemove', (e) => {
    if (el.style.display !== 'block') return;
    const pad = 16, r = el.getBoundingClientRect();
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + r.width > innerWidth) x = e.clientX - r.width - pad;
    if (y + r.height > innerHeight) y = e.clientY - r.height - pad;
    el.style.left = Math.max(4, x) + 'px'; el.style.top = Math.max(4, y) + 'px';
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest('[data-preview-name]')) el.style.display = 'none';
  });
}
// Floating „nach ganz oben"-Button — nur in den Editor-Screens, sobald man
// ein Stück runtergescrollt hat.
function ensureEditorTopBtn() {
  if (document.getElementById('editor-top-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'editor-top-btn';
  btn.type = 'button';
  btn.title = 'Nach ganz oben';
  btn.setAttribute('aria-label', 'Nach ganz oben');
  btn.textContent = '↑';
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);
  window.addEventListener('scroll', updateEditorTopBtn, { passive: true });
}
function updateEditorTopBtn() {
  const btn = document.getElementById('editor-top-btn');
  if (!btn) return;
  const active = document.querySelector('.screen.active');
  const isEditor = !!active && active.id.endsWith('edit-screen');
  btn.classList.toggle('show', isEditor && window.scrollY > 200);
}
// buildOnClick(slot, inputExpr) liefert den onclick/onchange-Ausdruck als
// String - so kann jeder Editor (Feud/Jeopardy/WWM) seine eigene Adressierung
// (Temp-Array, Board/Spalte/Reihe, Fragen-Index...) mit einbacken.
function mediaSlotsHtml(arr, buildOnClick, count) {
  let html = '<div class="media-slots">';
  for (let i = 0; i < (count || 3); i++) {
    const m = arr[i];
    html += m
      ? `<div class="media-slot filled" data-preview-name="${escAttr(m.name || (m.type === 'video' ? 'Video' : 'Bild'))}">${m.type === 'video' ? `<video src="${m.data}" muted></video>` : `<img src="${m.data}">`}<button type="button" class="media-slot-remove" onclick="${buildOnClick(i, 'null')}">✕</button></div>`
      : `<label class="media-slot empty">+<input type="file" accept="image/*,video/*" style="display:none;" onchange="${buildOnClick(i, 'this')}"></label>`;
  }
  html += '</div>';
  return html;
}

// Welcher Slot (0-2) gerade auf dem Gamescreen gezeigt wird, spielübergreifend
// - wird bei jeder neuen Frage/jedem neuen Clue zurückgesetzt.
let activeMediaSlot = null;
function renderMediaOverlay(media) {
  let el = document.getElementById('media-overlay');
  if (activeMediaSlot === null || !media || !media[activeMediaSlot]) {
    if (el) el.remove();
    return;
  }
  const m = media[activeMediaSlot];
  if (!el) { el = document.createElement('div'); el.id = 'media-overlay'; document.body.appendChild(el); }
  el.innerHTML = m.type === 'video' ? `<video src="${m.data}" autoplay controls></video>` : `<img src="${m.data}">`;
}
// Klick auf denselben Slot blendet wieder aus, ein anderer Slot wechselt direkt um.
function toggleMediaSlot(media, slot) {
  activeMediaSlot = (activeMediaSlot === slot) ? null : slot;
  renderMediaOverlay(media);
  updateGamemaster();
}
function resetMediaOverlay() {
  activeMediaSlot = null;
  const el = document.getElementById('media-overlay');
  if (el) el.remove();
}
// Baut die kleinen Umschalt-Buttons fürs GM-Panel - nur für tatsächlich
// befüllte Slots, aktiver Slot hervorgehoben.
function mediaControlButtonsHtml(media, togglerName) {
  const filled = (media || []).map((m, i) => m ? i : -1).filter(i => i >= 0);
  if (!filled.length) return '';
  return `<div class="panel">
    <div class="panel-head"><span>🖼 Einblendungen</span></div>
    <div class="panel-row">
      ${filled.map(i => `<button class="gm-btn ${activeMediaSlot === i ? 'gold' : 'gray'} sm" onclick="opener.${togglerName}(${i})">${activeMediaSlot === i ? '✕ ' : ''}${i + 1}</button>`).join('')}
    </div>
  </div>`;
}

// ── GM-PANEL: gemeinsames Design ──
// Ein Stylesheet + Header/Notizen-Bausteine für alle GM-Templates (FF, Jeopardy,
// WWM, Finale), statt dass jedes Template seine eigenen, leicht abweichenden
// Kopien von .panel/.gm-btn/.chip usw. mitschleppt.
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const GM_SHARED_CSS = `
  :root{color-scheme:dark;}
  *{margin:0;padding:0;box-sizing:border-box}
  /* Fester Rahmen statt einer einzigen langen Seite: Kopfzeile und
     Aktions-Buttons bleiben immer sichtbar, nur die Mitte scrollt. So
     verschwinden die Buttons (Strike, Weiter, ...) nie hinter Buzzer-/
     Verbunden-Panels - kein Suchen mehr per Scrollen während des Spiels. */
  html,body{height:100%;}
  body{font-family:'Inter',sans-serif;color:#eef0fb;padding:0;display:flex;flex-direction:column;overflow:hidden;background:#0b0e2c;background-image:radial-gradient(ellipse 120% 60% at 50% -10%, rgba(40,60,160,.35) 0%, transparent 60%);}
  .gm-header{flex-shrink:0;padding:14px 16px 12px;background:linear-gradient(180deg, rgba(15,18,50,.98), rgba(15,18,50,.9));border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .gm-title{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:2px;color:#FFD23F;}
  .gm-title small{display:block;font-family:'Inter',sans-serif;font-size:.55rem;letter-spacing:2px;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;}
  .gm-body{padding:16px 20px;display:flex;flex-direction:column;gap:12px;flex:1;min-height:0;overflow-y:auto;}
  .gm-main{display:flex;flex-direction:column;gap:12px;min-width:0;}
  .gm-side{display:flex;flex-direction:column;gap:12px;min-width:0;}
  .gm-actions{flex-shrink:0;padding:12px 20px;display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid rgba(255,255,255,.1);background:linear-gradient(0deg, rgba(15,18,50,.98), rgba(15,18,50,.85));}
  /* Auf breiten Bildschirmen (Mainscreen: volle Monitorbreite) zwei Spalten
     statt einer einzigen, monitorbreit gestreckten Liste - links die eigentliche
     Aufgabe (Frage/Antworten), rechts Status & Nebensächliches (Notizen,
     Buzzer, Verbunden). Auf dem schmalen Gamepad-Handy bleibt es einspaltig,
     .gm-main/.gm-side stapeln sich dort einfach normal übereinander. */
  @media (min-width: 760px) {
    .gm-body{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,1fr);align-items:start;gap:20px;}
    .gm-actions{padding-left:20px;justify-content:flex-end;}
    .gm-actions .gm-btn{flex:0 0 auto;}
  }
  .chip{font-size:.62rem;font-weight:800;letter-spacing:.5px;padding:4px 9px;border-radius:99px;white-space:nowrap;}
  .chip-ok{background:rgba(34,197,94,.15);color:#4ADE80;border:1px solid rgba(34,197,94,.35);}
  .chip-bad{background:rgba(232,69,60,.15);color:#FF8A80;border:1px solid rgba(232,69,60,.35);}
  .round-label{display:inline-block;padding:5px 14px;border-radius:7px;background:rgba(255,210,63,.1);border:1px solid rgba(255,210,63,.25);font-size:.68rem;font-weight:800;color:#FFD23F;letter-spacing:1.5px;text-transform:uppercase;align-self:flex-start;}
  .round-label.warn{background:rgba(232,69,60,.15);border-color:rgba(232,69,60,.4);color:#FF8A80;}
  .round-label.green{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.3);color:#22C55E;}
  .dd-inline{color:#FFD23F;font-weight:800;}
  .scores-row{display:flex;gap:8px;flex-wrap:wrap;}
  .score-card{flex:1;min-width:80px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:9px 10px;}
  .score-card.active{border-color:rgba(255,210,63,.4);background:rgba(255,210,63,.07);}
  .score-name{font-size:.6rem;font-weight:800;letter-spacing:.5px;color:rgba(255,255,255,.55);text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .score-val{font-family:'Bebas Neue',sans-serif;font-size:1.65rem;color:#FFD23F;line-height:1.1;}
  .question{font-size:1.05rem;font-weight:700;line-height:1.5;color:rgba(255,255,255,.9)}
  .qnote{background:rgba(255,210,63,.08);border-left:3px solid #FFD23F;border-radius:0 8px 8px 0;padding:8px 12px;font-size:.8rem;color:rgba(255,240,200,.9);line-height:1.5;}
  .qnote b{color:#FFD23F;font-size:.65rem;letter-spacing:1.5px;text-transform:uppercase;display:block;margin-bottom:2px;}

  /* Wertung: eine Zeile pro Team. Vorher standen alle Plus-Knoepfe in einer
     Reihe und alle Minus-Knoepfe in einer zweiten - man musste dasselbe Team
     zweimal an unterschiedlichen Stellen suchen, weil die Namen verschieden
     breit sind. Jetzt liegen Name, Punktestand und beide Knoepfe beieinander. */
  .score-rows{display:flex;flex-direction:column;gap:6px;}
  .score-row{
    display:flex;align-items:center;gap:10px;
    background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);
    border-left:4px solid var(--team);border-radius:10px;padding:8px 10px 8px 12px;
  }
  .score-row.buzzed{background:rgba(255,210,63,.08);border-color:rgba(255,210,63,.45);border-left-color:var(--team);}
  /* Feste Breite fuer die Namensspalte: sonst beginnt das Punkte-Kaestchen in
     jeder Zeile woanders, weil die Namen verschieden lang sind. Den Abstand zu
     den Knoepfen macht .sr-gap, nicht der Name - der wuerde die Punkte sonst
     wieder nach rechts an die Knoepfe schieben. */
  .score-row .sr-name{
    flex:0 0 132px;min-width:0;font-size:.78rem;font-weight:800;letter-spacing:.3px;color:#fff;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  }
  .score-row .sr-val{
    flex-shrink:0;min-width:56px;text-align:center;
    font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:#FFD23F;line-height:1;
    font-variant-numeric:tabular-nums;
    background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.08);
    border-radius:8px;padding:3px 9px 1px;
  }
  .score-row .sr-gap{flex:1 1 auto;}
  .score-row .sr-buzz{color:#FFD23F;font-size:.68rem;font-weight:800;flex-shrink:0;}
  .score-row .sr-btns{display:flex;gap:6px;flex-shrink:0;}
  /* Feste Breite, damit die Knoepfe aller Zeilen exakt untereinander stehen. */
  .sr-btn{
    min-width:74px;padding:9px 10px;border:none;border-radius:8px;cursor:pointer;
    font-family:inherit;font-size:.85rem;font-weight:800;letter-spacing:.3px;
    font-variant-numeric:tabular-nums;transition:filter .12s,transform .06s;
  }
  .sr-btn:hover{filter:brightness(1.12);}
  .sr-btn:active{transform:translateY(1px);}
  .sr-btn.plus{background:linear-gradient(180deg,#22C55E,#16a34a);color:#06210f;}
  .sr-btn.minus{background:rgba(232,69,60,.12);border:1px solid rgba(232,69,60,.5);color:#FF8A80;}
  @media (max-width:420px){
    .score-row{flex-wrap:wrap;}
    /* Etwas schmaler als am Rechner, aber weiterhin fest - sonst faengt das
       Punkte-Kaestchen in jeder Zeile an einer anderen Stelle an. */
    .score-row .sr-name{flex:0 0 116px;}
    .score-row .sr-btns{width:100%;}
    .sr-btn{flex:1;}
  }
  .answer{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-radius:8px;font-weight:600;font-size:.9rem;transition:filter .1s;}
  .answer.hidden{background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);cursor:pointer;}
  .answer.hidden:hover{filter:brightness(1.3);}
  .answer.shown{background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.3);}
  .answer.shown .text{color:#22C55E}
  .answer-list{display:flex;flex-direction:column;gap:4px;}
  .num{color:#FFD23F;margin-right:10px;font-weight:700}
  .pts{color:#FFD23F;font-weight:700}
  .strikes-section{display:flex;gap:8px;flex-wrap:wrap;}
  .panel{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:10px 12px;}
  .panel-head{display:flex;align-items:center;justify-content:space-between;font-size:.62rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:8px;}
  .panel-row{display:flex;gap:6px;flex-wrap:wrap;}
  .badge{background:rgba(34,197,94,.18);color:#4ADE80;border-radius:99px;padding:1px 8px;font-size:.68rem;}
  .pr-list{display:flex;flex-direction:column;gap:4px;max-height:110px;overflow-y:auto;margin-bottom:8px;}
  .pr-row{display:flex;align-items:center;gap:7px;font-size:.78rem;font-weight:600;padding:3px 2px;}
  .pr-dot{width:7px;height:7px;border-radius:50%;background:#22C55E;box-shadow:0 0 6px #22C55E;flex-shrink:0;animation:gmPulse 1.6s ease-in-out infinite;}
  .pr-team-btn{padding:3px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:rgba(255,255,255,.6);font-size:.62rem;font-weight:700;cursor:pointer;}
  .pr-team-btn.active{background:rgba(255,210,63,.25);border-color:#FFD23F;color:#FFD23F;}
  @keyframes gmPulse{0%,100%{opacity:1}50%{opacity:.4}}
  .pr-empty{font-size:.72rem;color:rgba(255,255,255,.35);padding:4px 0;}
  .buzz-row{justify-content:flex-start;background:rgba(255,255,255,.03);border-radius:6px;padding:5px 8px;}
  .buzz-row.first{background:rgba(255,210,63,.12);box-shadow:inset 0 0 0 1px rgba(255,210,63,.3);}
  .pr-rank{color:#FFD23F;font-family:'Bebas Neue',sans-serif;font-size:1rem;width:18px;}
  .buzz-time{margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:1rem;}
  .hint-line{font-size:.72rem;color:rgba(255,255,255,.45);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .info-card{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.3);border-radius:10px;padding:11px 13px;font-size:.76rem;color:rgba(255,255,255,.8);text-align:center;line-height:1.55;}
  .hint-ok{font-size:.76rem;color:#4ADE80;font-weight:700;align-self:center;}
  .excl-tag{font-size:.68rem;color:#FF8A80;font-weight:700;}
  .btn-grid{display:flex;flex-wrap:wrap;gap:6px;}
  .gm-btn{padding:10px 16px;border:none;border-radius:8px;font-family:'Inter',sans-serif;font-size:.8rem;font-weight:700;cursor:pointer;text-transform:uppercase;letter-spacing:1px;transition:transform .08s ease-out,box-shadow .12s ease-out,filter .1s;box-shadow:0 2px 0 rgba(0,0,0,.3),0 3px 8px rgba(0,0,0,.2);}
  .gm-btn:hover{filter:brightness(1.15);transform:translateY(-1px);box-shadow:0 3px 0 rgba(0,0,0,.3),0 5px 12px rgba(0,0,0,.25);}
  .gm-btn:active{transform:translateY(2px);box-shadow:0 0 0 rgba(0,0,0,.3),0 1px 4px rgba(0,0,0,.15);filter:brightness(.96);}
  .gm-btn.red{background:linear-gradient(180deg,#E8453C,#C62828);color:#fff;}
  .gm-btn.gray{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1);}
  .gm-btn.gold{background:linear-gradient(180deg,#FFD23F,#F0B800);color:#1a1200;}
  .gm-btn.blue{background:linear-gradient(180deg,#3B82F6,#1D4ED8);color:#fff;}
  .gm-btn.orange{background:linear-gradient(180deg,#F97316,#C2410C);color:#fff;}
  .gm-btn.purple{background:linear-gradient(180deg,#8B5CF6,#6D28D9);color:#fff;}
  .gm-btn.danger-outline{background:rgba(232,69,60,.1);color:#FF8A80;border:1px solid rgba(232,69,60,.35);}
  .gm-btn.sm{padding:7px 10px;font-size:.68rem;flex:1;}
  .gm-btn.gm-red{background:linear-gradient(180deg,#E8453C,#C62828);color:#fff;}
  .gm-btn.gm-gray{background:rgba(255,255,255,.1);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.1);}
  .gm-btn.gm-gold{background:linear-gradient(180deg,#FFD23F,#F0B800);color:#1a1200;}
  .gm-btn.gm-blue{background:linear-gradient(180deg,#3B82F6,#1D4ED8);color:#fff;}
  .tag{font-size:.62rem;font-weight:800;padding:3px 8px;border-radius:99px;letter-spacing:.3px;}
  .tag-blue{background:rgba(59,130,246,.15);color:#93C5FD;}
  .tag-gold{background:rgba(255,210,63,.15);color:#FFD23F;}
  .tag-green{background:rgba(34,197,94,.15);color:#86EFAC;}
  .tag-purple{background:rgba(139,92,246,.18);color:#C4B5FD;}
  .media-row{display:flex;flex-wrap:wrap;gap:5px;}
  .gm-tabs{display:flex;gap:6px;}
  .gm-tab{flex:1;padding:8px;border:1px solid rgba(255,255,255,.1);border-radius:8px;background:rgba(255,255,255,.04);color:rgba(255,255,255,.6);font-family:'Inter',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;cursor:pointer;}
  .gm-tab.active{background:rgba(255,210,63,.12);border-color:rgba(255,210,63,.35);color:#FFD23F;}
  .order-list{display:flex;flex-direction:column;gap:6px;overflow-y:auto;}
  .order-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.06);font-size:.85rem;}
  .order-item.current{background:rgba(255,210,63,.1);border-color:rgba(255,210,63,.3);}
  .order-item.done{opacity:.4;text-decoration:line-through;}
  .order-num{color:#FFD23F;font-weight:700;min-width:1.4em;}
  .active-team-label{font-size:.7rem;color:#FFD23F;font-weight:700;letter-spacing:2px;text-transform:uppercase;}
  .top-row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
  /* Zugeklappte Panels (Notizen, Buzzer, Verbunden, …) - halten das Panel auf
     den ersten Blick kurz, Details sind trotzdem nur einen Klick entfernt. */
  summary.panel-head{cursor:pointer;list-style:none;}
  summary.panel-head::-webkit-details-marker{display:none;}
  details.panel:not([open]) > summary.panel-head{margin-bottom:0;}
  .car{transition:transform .15s;font-size:.7rem;color:rgba(255,255,255,.3);flex-shrink:0;}
  details[open] > summary.panel-head .car{transform:rotate(90deg);}
  .notes-panel textarea{margin-top:8px;width:100%;min-height:90px;padding:10px 11px;border-radius:8px;border:1.5px solid rgba(255,255,255,.1);background:rgba(0,0,0,.3);color:#fff;font-family:inherit;font-size:.82rem;line-height:1.6;outline:none;resize:vertical;}
`;
function gmHeaderHtml(title, subtitle, chip) {
  return `<div class="gm-header">
    <div class="gm-title">${title}${subtitle ? `<small>${subtitle}</small>` : ''}</div>
    ${chip || ''}
  </div>`;
}
// Notizen direkt im GM-Panel (und dank Firebase-Spiegelung automatisch auch im
// Gamepad fürs Handy) - zugeklappt by default, damit sie während des Spiels
// nicht im Weg sind, aber immer einen Klick entfernt.
function gmNotesPanelHtml() {
  let notes = '';
  try { notes = localStorage.getItem('hostNotes') || ''; } catch {}
  return `<details class="panel notes-panel">
    <summary class="panel-head"><span>📋 Notizen</span><span class="car">▸</span></summary>
    <textarea placeholder="Ablaufplan / Notizen…" oninput="opener.saveHostNotesRemote(this.value)">${escapeHtml(notes)}</textarea>
  </details>`;
}
// Notiz zu einer einzelnen Frage - steht direkt unter der Frage im GM-Panel
// (und damit auch am Gamepad), das Publikum sieht sie nie.
function qNoteHtml(note) {
  if (!note) return '';
  return `<div class="qnote"><b>📝 Frage-Notiz</b>${escapeHtml(note)}</div>`;
}

// ── EDIT ──
function renderQuestionList() {
  document.getElementById('question-list').innerHTML = questions.map((q,i) => `
    <div class="q-list-item">
      <span class="q-label"><span class="q-num">${i+1}.</span>${q.question}<span class="q-meta">${q.answers.length} Antworten</span></span>
      <div class="q-btns">
        <button class="btn btn-secondary" onclick="editQuestion(${i})">Edit</button>
        <button class="btn btn-danger" onclick="deleteQuestion(${i})">Del</button>
      </div>
    </div>`).join('');
  document.getElementById('finale-question-list').innerHTML = finaleQuestions.map((q,i) => `
    <div class="q-list-item">
      <span class="q-label"><span class="q-num">${i+1}.</span>${q.question}<span class="q-meta">${q.answers.length} Antworten</span></span>
      <div class="q-btns">
        <button class="btn btn-secondary" onclick="editQuestion(${i},true)">Edit</button>
        <button class="btn btn-danger" onclick="deleteQuestion(${i},true)">Del</button>
      </div>
    </div>`).join('');
}
function newQuestion(isFinale) {
  state.editingIndex = -1;
  state.editingFinale = !!isFinale;
  document.getElementById('edit-question').value = '';
  document.getElementById('edit-note').value = '';
  document.getElementById('answer-fields').innerHTML = '';
  for (let i = 0; i < 5; i++) addAnswerField();
  document.getElementById('edit-question').focus();
  state.editingMedia = [];
  renderFeudMediaSlots();
}
function editQuestion(i, isFinale) {
  state.editingIndex = i;
  state.editingFinale = !!isFinale;
  const list = isFinale ? finaleQuestions : questions;
  document.getElementById('edit-question').value = list[i].question;
  document.getElementById('edit-note').value = list[i].note || '';
  document.getElementById('answer-fields').innerHTML = '';
  list[i].answers.forEach(a => addAnswerField(a.text, a.points));
  document.getElementById('edit-question').focus();
  state.editingMedia = (list[i].media || []).slice();
  renderFeudMediaSlots();
}
function feudEditMedia(slot, input) { setMediaSlot(state.editingMedia, slot, input, renderFeudMediaSlots); }
function renderFeudMediaSlots() {
  document.getElementById('feud-media-slots').innerHTML = mediaSlotsHtml(state.editingMedia, (slot, inputExpr) => `feudEditMedia(${slot},${inputExpr})`);
}
function addAnswerField(text='', points='') {
  const f = document.getElementById('answer-fields');
  if (f.children.length >= 8) return;
  const r = document.createElement('div');
  r.className = 'answer-edit-row';
  r.innerHTML = `<input type="text" placeholder="Antwort" value="${text}"><input type="number" placeholder="Pkt" value="${points}" min="1"><button class="btn btn-danger" onclick="this.parentElement.remove()">✕</button>`;
  f.appendChild(r);
}
function saveQuestion() {
  try {
    const question = document.getElementById('edit-question').value.trim();
    if (!question) return alert('Bitte eine Frage eingeben!');
    const answers = [];
    document.querySelectorAll('#answer-fields .answer-edit-row').forEach(row => {
      const inp = row.querySelectorAll('input');
      const t = inp[0].value.trim(), p = parseInt(inp[1].value);
      if (t && p > 0) answers.push({text:t, points:p});
    });
    if (answers.length < 2) return alert('Mindestens 2 Antworten!');
    answers.sort((a,b) => b.points - a.points);
    const isFinale = state.editingFinale;
    const list = isFinale ? finaleQuestions : questions;
    const media = (state.editingMedia || []).filter(m => m);
    const note = document.getElementById('edit-note').value.trim();
    if (state.editingIndex >= 0) list[state.editingIndex] = {question, answers, media, note};
    else list.push({question, answers, media, note});
    saveToStorage(); renderQuestionList();
    state.editingIndex = -1; state.editingFinale = false; state.editingMedia = [];
    document.getElementById('edit-question').value = '';
    document.getElementById('edit-note').value = '';
    document.getElementById('answer-fields').innerHTML = '';
    renderFeudMediaSlots();
  } catch(err) { alert('Fehler beim Speichern: ' + err.message); }
}
function cancelEdit() { state.editingIndex = -1; state.editingFinale = false; state.editingMedia = []; renderFeudMediaSlots(); }
function deleteQuestion(i, isFinale) { if(confirm('Löschen?')){(isFinale?finaleQuestions:questions).splice(i,1);saveToStorage();renderQuestionList();} }
function downloadJSON(data, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
}
function exportQuestions() { downloadJSON(questions, 'family-feud-fragen.json'); }
function exportFinaleQuestions() { downloadJSON(finaleQuestions, 'family-feud-finale-fragen.json'); }
// Gemeinsames Datei-Handling für alle JSON-Importe (FF/Jeopardy/WWM):
// Datei lesen, BOM entfernen, parsen - apply(d) macht die formatspezifische
// Validierung und darf bei ungültigem Inhalt einfach werfen.
function readJsonFile(e, apply) {
  const file = e.target.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = () => {
    try { apply(JSON.parse(r.result.replace(/^﻿/, ''))); }
    catch(err) { alert('Import fehlgeschlagen' + (err && err.message ? ': ' + err.message : '')); }
  };
  r.onerror = () => { alert('Datei konnte nicht gelesen werden'); };
  r.readAsText(file, 'UTF-8'); e.target.value = '';
}
function importJSON(e, callback) {
  readJsonFile(e, d => {
    if(!Array.isArray(d)) throw new Error('Datei muss ein JSON-Array sein');
    callback(d);
    saveToStorage();
    renderQuestionList();
  });
}
function importQuestions(e) { importJSON(e, d => { questions = d; }); }
function importFinaleQuestions(e) { importJSON(e, d => { finaleQuestions = d; }); }
function saveToStorage(){
  try { localStorage.setItem('familyFeudQuestions',JSON.stringify(questions)); localStorage.setItem('familyFeudFinaleQuestions',JSON.stringify(finaleQuestions)); } catch {}
}
function loadFromStorage(){
  try { const s=localStorage.getItem('familyFeudQuestions');if(s){questions=JSON.parse(s);} } catch {}
  try { const f=localStorage.getItem('familyFeudFinaleQuestions');if(f){finaleQuestions=JSON.parse(f);} } catch {}
  try { const inp=document.getElementById('feud-show-name'); if(inp){ const v=localStorage.getItem('feudShowName'); if(v!==null) inp.value=v; } } catch {}
  try { const inp=document.getElementById('bday-name'); if(inp){ const v=localStorage.getItem('bdayName'); if(v!==null) inp.value=v; } } catch {}
}

// ── REAKTIONSZEIT-BESTENLISTE ── (übers ganze Event hinweg, geräteseitig gespeichert)
let reactionBoard = [];
function loadReactionBoard(){
  try { const s = localStorage.getItem('reactionBoard'); reactionBoard = s ? JSON.parse(s) : []; } catch { reactionBoard = []; }
}
function saveReactionBoard(){
  try { localStorage.setItem('reactionBoard', JSON.stringify(reactionBoard.slice(0, 300))); } catch {}
}
function recordReaction(name, t, game){
  if (!name || !(t >= 0)) return;
  reactionBoard.push({ name, t, game, ts: Date.now() });
  reactionBoard.sort((a,b) => a.t - b.t);
  saveReactionBoard();
  if (document.getElementById('reaction-board-screen').classList.contains('active')) renderReactionBoard();
}
function resetReactionBoard(){
  if (!confirm('Bestenliste wirklich löschen?')) return;
  reactionBoard = [];
  saveReactionBoard();
  renderReactionBoard();
}
function renderReactionBoard(){
  const list = document.getElementById('reaction-board-list');
  if (!reactionBoard.length){
    list.innerHTML = `<div class="q-list-item" style="justify-content:center;color:rgba(255,255,255,.35);">Noch keine Buzzer-Zeiten aufgezeichnet.</div>`;
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  list.innerHTML = reactionBoard.slice(0, 30).map((r, i) => `
    <div class="q-list-item">
      <span class="q-label"><span class="q-num">${medals[i] || (i+1)+'.'}</span>${escapeHtml(r.name)}<span class="q-meta">${escapeHtml(r.game)}</span></span>
      <span style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#FFD23F;">${r.t.toFixed(2)}s</span>
    </div>`).join('');
}
// Kompakte Version der Bestenliste, direkt auf dem Ergebnis-Bildschirm nach
// jedem Spielende (und damit auch am Ende eines Turniers, das denselben
// Ergebnis-Bildschirm nutzt) - kein extra Klick zur Bestenliste nötig.
function renderResultLeaderboard(){
  const el = document.getElementById('result-leaderboard');
  if (!el) return;
  if (!reactionBoard.length){ el.style.display = 'none'; return; }
  el.style.display = '';
  const medals = ['🥇','🥈','🥉'];
  el.querySelector('.q-list').innerHTML = reactionBoard.slice(0, 10).map((r, i) => `
    <div class="q-list-item">
      <span class="q-label"><span class="q-num">${medals[i] || (i+1)+'.'}</span>${escapeHtml(r.name)}<span class="q-meta">${escapeHtml(r.game)}</span></span>
      <span style="font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:#FFD23F;">${r.t.toFixed(2)}s</span>
    </div>`).join('');
}
// Neue Buzzes seit dem letzten Snapshot erkennen und in die Bestenliste aufnehmen
function noteNewBuzzes(prevResults, newResults, game){
  const prevNames = new Set(prevResults.map(r => r.name));
  let any = false;
  newResults.forEach(r => {
    if (!prevNames.has(r.name)){ recordReaction(r.name, r.t, game); recordAccountBuzz(r.account, r.t); any = true; }
  });
  if (any) SFX.buzz();
}
// Account-Statistik: Buzz-Anzahl + persönliche Bestzeit, dauerhaft am Account
// gespeichert (überlebt Geräte, Reloads, sogar Account-Reisen zwischen Events).
function recordAccountBuzz(accountKey, t){
  if (!accountKey || !(t >= 0)) return;
  const ref = firebase.database().ref('buzzer/players/' + accountKey + '/stats');
  ref.transaction(cur => {
    cur = cur || { buzzes: 0, bestBuzz: null, wins: 0, games: 0 };
    cur.buzzes = (cur.buzzes || 0) + 1;
    if (cur.bestBuzz === null || cur.bestBuzz === undefined || t < cur.bestBuzz) cur.bestBuzz = t;
    return cur;
  }).catch(()=>{});
}
// Am Spielende: allen Accounts, die aktuell einem der Teams zugeteilt sind,
// eine Teilnahme gutschreiben, und den Gewinner-Teams zusätzlich einen Sieg.
function recordAccountGameResult(teamNames, scores){
  if (!teamNames || !teamNames.length) return;
  const maxScore = Math.max(...scores);
  const winnerTeams = scores.map((s,i) => s === maxScore ? i : -1).filter(i => i >= 0);
  const singleWinner = winnerTeams.length === 1 ? winnerTeams[0] : -1;
  firebase.database().ref('buzzer/players').once('value').then(snap => {
    snap.forEach(child => {
      const p = child.val();
      if (!p || p.team === undefined || p.team === null || p.team >= teamNames.length) return;
      const ref = child.ref.child('stats');
      const won = p.team === singleWinner;
      ref.transaction(cur => {
        cur = cur || { buzzes: 0, bestBuzz: null, wins: 0, games: 0 };
        cur.games = (cur.games || 0) + 1;
        if (won) cur.wins = (cur.wins || 0) + 1;
        return cur;
      }).catch(()=>{});
    });
  }).catch(()=>{});
}

// ── SPIELER-ACCOUNTS (Übersicht + ewige Bestenliste) ──
// Alle jemals angelegten Accounts, live aus Firebase - unabhängig davon, ob
// sie gerade online sind. Team-Zuteilung, Avatar/Farbe und Statistik leben
// direkt am Account und sind damit geräteübergreifend und permanent.
let allPlayers = [];
let playersTab = 'list';
let playersRef = null;
let playersPresenceRef = null;
let onlinePlayerKeys = {}; // { accountKey: true } - wer gerade verbunden ist (Presence-Key == Account-Key)
// Merkt sich, von welchem Screen aus die Spielerübersicht geöffnet wurde
// (Hauptmenü oder ein Setup-Screen), damit "Zurück" dorthin zurückführt.
let playersReturnScreen = 'menu-screen';
function openPlayersScreen(returnTo){
  playersReturnScreen = returnTo || 'menu-screen';
  showScreen('players-screen');
}
function closePlayersScreen(){ showScreen(playersReturnScreen); }
function ensurePlayersConnected(){
  if (playersRef) return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    playersRef = firebase.database().ref('buzzer/players');
    playersRef.on('value', snap => {
      const v = snap.val() || {};
      allPlayers = Object.entries(v).map(([key, p]) => ({ key, ...p, stats: p.stats || { buzzes:0, bestBuzz:null, wins:0, games:0 } }));
      if (document.getElementById('players-screen').classList.contains('active')) setPlayersTab(playersTab, true);
      if (document.getElementById('ddf-setup-screen').classList.contains('active')) renderDdfLobby();
      if (document.getElementById('pih-setup-screen').classList.contains('active')) renderPihLobby();
    });
    playersPresenceRef = firebase.database().ref('buzzer/presence');
    playersPresenceRef.on('value', snap => {
      onlinePlayerKeys = {};
      const v = snap.val() || {};
      Object.keys(v).forEach(key => onlinePlayerKeys[key] = true);
      if (document.getElementById('players-screen').classList.contains('active') && playersTab === 'list') renderPlayersList();
      if (document.getElementById('ddf-setup-screen').classList.contains('active')) renderDdfLobby();
      if (document.getElementById('pih-setup-screen').classList.contains('active')) renderPihLobby();
    });
  } catch {}
}
function setPlayersTab(tab, silent){
  playersTab = tab;
  document.getElementById('players-tab-list').classList.toggle('active', tab === 'list');
  document.getElementById('players-tab-board').classList.toggle('active', tab === 'board');
  if (tab === 'list') renderPlayersList(); else renderPlayersLeaderboard();
}
// Aktuelle Teamnamen des zuletzt aktiven Kontexts (Feud/Jeopardy), zum
// Anzeigen des Team-Tags - fällt auf "Team N" zurück wenn kein Spiel offen ist.
function currentTeamLabel(i){
  const names = activeBuzzerContext === 'jeopardy' ? jeopardyState.teamNames
              : activeBuzzerContext === 'wwds' ? (wwdsState.teamNames.length ? wwdsState.teamNames : lobbyTeamNames('wwds'))
              : state.teamNames;
  return (names && names[i]) || ('Team ' + (i+1));
}
function renderPlayersList(){
  const el = document.getElementById('players-content');
  if (!allPlayers.length){
    el.innerHTML = `<div class="q-list-item" style="justify-content:center;color:rgba(255,255,255,.35);">Noch keine Spieler-Accounts angelegt.</div>`;
    return;
  }
  const sorted = [...allPlayers].sort((a,b) => {
    const aOn = !!onlinePlayerKeys[a.key], bOn = !!onlinePlayerKeys[b.key];
    if (aOn !== bOn) return aOn ? -1 : 1;
    return a.name.localeCompare(b.name, 'de');
  });
  const teamTagColors = ['#E8453C','#3B82F6','#22C55E'];
  el.innerHTML = `<div class="q-list">${sorted.map(p => {
    const teamTag = (p.team !== undefined && p.team !== null)
      ? `<span class="player-team-tag" style="background:${teamTagColors[p.team]||'#888'}22;color:${teamTagColors[p.team]||'#888'};">${currentTeamLabel(p.team)}</span>`
      : `<span class="player-team-tag" style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.35);">kein Team</span>`;
    const s = p.stats || {};
    const online = !!onlinePlayerKeys[p.key];
    const onlineDot = online ? `<span class="online-dot" title="Online"></span>` : `<span class="online-dot offline" title="Offline"></span>`;
    return `<div class="q-list-item player-row">
      <span class="q-label">${onlineDot}${playerAvatarHtml(p)}<b>${escapeHtml(p.name)}</b>${teamTag}
        <span class="player-stats">🔔${s.buzzes||0} · 🏆${s.wins||0}/${s.games||0}${s.bestBuzz!=null?' · ⚡'+s.bestBuzz.toFixed(2)+'s':''}</span>
      </span>
      <div class="q-btns">
        ${[0,1,2].map(i => `<button class="btn btn-secondary" style="padding:6px 10px;font-size:.7rem;" onclick="assignPlayerTeam('${p.key}',${i})">${currentTeamLabel(i)}</button>`).join('')}
        <button class="btn btn-danger" style="padding:6px 10px;font-size:.7rem;" onclick="assignPlayerTeam('${p.key}',null)">✕</button>
        <button class="btn btn-secondary" style="padding:6px 10px;font-size:.7rem;" onclick="resetPlayerPassword('${p.key}', ${escJsArg(p.name)})">🔑 Passwort</button>
        <button class="btn btn-danger" style="padding:6px 10px;font-size:.7rem;" onclick="deletePlayerAccount('${p.key}', ${escJsArg(p.name)})">🗑️ Löschen</button>
      </div>
    </div>`;
  }).join('')}</div>`;
}
async function deletePlayerAccount(key, name){
  if (!confirm(`Account "${name}" wirklich komplett löschen? Team, Avatar und Statistiken gehen dabei verloren. Das kann nicht rückgängig gemacht werden.`)) return;
  try {
    await firebase.database().ref('buzzer/players/' + key).remove();
    await firebase.database().ref('buzzer/presence/' + key).remove();
  } catch (e) { console.error('deletePlayerAccount failed', e); alert('Fehler beim Löschen.'); }
}
// PIN/Passwort ist am Account als Einweg-Hash (SHA-256) gespeichert und daher
// nie im Klartext einsehbar - der Host kann hier stattdessen ein neues setzen.
function playerKeyOf(name){ return (name||'').trim().toLowerCase().replace(/[.#$/\[\]]/g,'_').slice(0,40); }
async function hashPlayerPin(name, pin){
  const data = new TextEncoder().encode('keller:'+playerKeyOf(name)+':'+pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function resetPlayerPassword(key, name){
  const pin = prompt(`Neues Passwort/PIN für ${name} (mind. 5 Zeichen):`);
  if (pin === null) return;
  if (pin.length < 5) { alert('Passwort muss mind. 5 Zeichen haben.'); return; }
  const ph = await hashPlayerPin(name, pin);
  firebase.database().ref('buzzer/players/' + key + '/pin').set(ph)
    .then(() => alert(`Passwort für ${name} wurde zurückgesetzt.`))
    .catch(() => alert('Fehler beim Zurücksetzen.'));
}
function renderPlayersLeaderboard(){
  const el = document.getElementById('players-content');
  const withStats = allPlayers.filter(p => (p.stats?.games||0) > 0 || (p.stats?.buzzes||0) > 0);
  if (!withStats.length){
    el.innerHTML = `<div class="q-list-item" style="justify-content:center;color:rgba(255,255,255,.35);">Noch keine Spiele/Buzzes aufgezeichnet.</div>`;
    return;
  }
  const byWins = [...withStats].sort((a,b) => (b.stats.wins||0) - (a.stats.wins||0) || (b.stats.games||0) - (a.stats.games||0));
  const byBuzz = [...allPlayers].filter(p => p.stats?.bestBuzz != null).sort((a,b) => a.stats.bestBuzz - b.stats.bestBuzz);
  const medals = ['🥇','🥈','🥉'];
  el.innerHTML = `
    <div class="page-title" style="font-size:.85rem;margin-bottom:6px;">🏆 Meiste Siege</div>
    <div class="q-list" style="margin-bottom:20px;">${byWins.slice(0,15).map((p,i) => `
      <div class="q-list-item"><span class="q-label"><span class="q-num">${medals[i]||(i+1)+'.'}</span>${playerAvatarHtml(p)}${escapeHtml(p.name)}</span>
      <span style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;color:#FFD23F;">${p.stats.wins||0} Siege <span style="color:rgba(255,255,255,.3);font-size:.7rem;font-family:'Inter',sans-serif;">/ ${p.stats.games||0} Spiele</span></span></div>`).join('')}</div>
    <div class="page-title" style="font-size:.85rem;margin-bottom:6px;">⚡ Schnellste Buzzer</div>
    <div class="q-list">${byBuzz.slice(0,15).map((p,i) => `
      <div class="q-list-item"><span class="q-label"><span class="q-num">${medals[i]||(i+1)+'.'}</span>${playerAvatarHtml(p)}${escapeHtml(p.name)}</span>
      <span style="font-family:'Bebas Neue',sans-serif;font-size:1.2rem;color:#FFD23F;">${p.stats.bestBuzz.toFixed(2)}s</span></div>`).join('')}</div>`;
}

// ── HOST-NOTIZEN ── (automatisch gespeichert, geräteseitig)
function loadHostNotes(){
  try { document.getElementById('host-notes-text').value = localStorage.getItem('hostNotes') || ''; } catch {}
  renderNotesChecklist();
}
function saveHostNotes(){
  try { localStorage.setItem('hostNotes', document.getElementById('host-notes-text').value); } catch {}
  renderNotesChecklist();
}
// Wird von der Notizen-Box im GM-Panel (und darüber vom Gamepad-Handy) aufgerufen.
// Rendert bewusst NICHT das GM-Panel neu (kein updateGamemaster()) - sonst würde
// jeder Tastendruck das eigene Eingabefeld unterbrechen.
function saveHostNotesRemote(text){
  try { localStorage.setItem('hostNotes', text); } catch {}
  const el = document.getElementById('host-notes-text');
  if (el && el.value !== text) el.value = text;
  renderNotesChecklist();
}

// Zeilen, die mit "/" enden, werden als anklickbare Checkliste angezeigt -
// z.B. "Getränke nachfüllen /". Der erledigt-Status wird getrennt von den
// Notizen selbst gespeichert (per Zeilentext), damit er Bearbeitungen an
// anderen Zeilen übersteht.
function parseNoteChecklist(text){
  return (text || '').split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1 && l.endsWith('/'))
    .map(l => l.slice(0, -1).trim())
    .filter(Boolean);
}
function loadNotesChecked(){
  try { return new Set(JSON.parse(localStorage.getItem('hostNotesChecked') || '[]')); } catch { return new Set(); }
}
function saveNotesChecked(set){
  try { localStorage.setItem('hostNotesChecked', JSON.stringify([...set])); } catch {}
}
let noteChecklistItems = [];
function renderNotesChecklist(){
  const el = document.getElementById('host-notes-checklist');
  if (!el) return;
  const notesEl = document.getElementById('host-notes-text');
  noteChecklistItems = parseNoteChecklist(notesEl ? notesEl.value : '');
  if (!noteChecklistItems.length){ el.innerHTML = ''; el.style.display = 'none'; return; }
  const checked = loadNotesChecked();
  el.style.display = '';
  el.innerHTML = noteChecklistItems.map((text, i) => `
    <div class="note-check-item ${checked.has(text) ? 'done' : ''}" onclick="toggleNoteChecked(${i})">
      <span class="note-check-box">${checked.has(text) ? '✓' : ''}</span>
      <span class="note-check-text">${escapeHtml(text)}</span>
    </div>`).join('');
}
function toggleNoteChecked(i){
  const text = noteChecklistItems[i];
  if (text === undefined) return;
  const checked = loadNotesChecked();
  if (checked.has(text)) checked.delete(text); else checked.add(text);
  saveNotesChecked(checked);
  renderNotesChecklist();
}

// ── TURNIER ── Mehrtägige Gameshow: gleiche Teams, gewichtete Spiele, Gesamtwertung.
