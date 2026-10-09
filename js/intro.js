// @ts-check
/* ═══ INTROS ════════════════════════════════════════════════════════════════
   Alle Intros laufen über eine Funktion: playIntro(daten, weiter). Die drei
   festen (Keller, Keller Tag 2, Geburtstag) sind Vorlagen im selben Format
   wie das eigene Intro - eine Kopfzeile, ein Takt, eine Bühne und eine Liste
   von Stufen.

   Bis Oktober 2026 standen die drei festen Intros als fertiges Markup in
   feud.js und jeopardy.js, mit fest verdrahteter Taktung (.s1 bis .s7) im
   Stylesheet, und das eigene Intro baute dieselbe Bühne ein viertes Mal
   nach. Wer an der Bühne etwas änderte, musste es an drei, vier Stellen
   nachziehen; wer am Keller-Intro einen Satz ändern wollte, musste in den
   Code. Jetzt lädt der Editor jede Vorlage als Ausgangspunkt.

   Die Bühnen benutzen feste ids (#kg, #kgb, #kgn), an denen die Stile hängen.
   Es läuft immer nur ein Intro gleichzeitig, die id ist also nie zweimal im
   Dokument.

   Die Taktung rechnet JavaScript aus und schreibt sie als CSS-Variablen ins
   style-Attribut (--d, --dur, --st je Stufe, --i je Buchstabe). Animiert
   wird ausschließlich mit CSS - warum nicht mit GSAP, steht in styles.css
   über dem Block INTRO-BÜHNEN: kurz, das Zuschauerfenster spiegelt nur den
   DOM und führt selbst keinen Code aus.
   ════════════════════════════════════════════════════════════════════════ */

/** Eine Stufe des Intros. Alle vier Zeilen sind freiwillig - leere werden
 *  weggelassen, damit eine Stufe auch nur aus einem Wort bestehen kann.
 *  deco ist ein Extra über dem Text (Teams, Torte, Tag 1 + Tag 2) oder
 *  'geld': dann wird die große Zeile als Geldbetrag gesetzt.
 *  @typedef {{ lbl: string, big: string, pink: string, sub: string, deco: string }} IntroSlide */
/** @typedef {{ header: string, seconds: number, stage: string, slides: IntroSlide[] }} IntroDaten */

const INTRO_MAX_SLIDES = 12;
const INTRO_MIN_SECONDS = 2;
const INTRO_MAX_SECONDS = 12;

/* Drei Bühnen. Der Text, die Taktung und alles andere bleiben gleich - nur
   das Aussehen wechselt, damit zwei Abende hintereinander nicht identisch
   anfangen. Der Schlüssel wird gespeichert, deshalb hier feste Namen und kein
   Index: eine spätere vierte Bühne darf die Reihenfolge ändern, ohne alte
   Einstellungen umzudeuten. */
const INTRO_STAGES = [
  { key:'buehne',     id:'kg',  name:'Kellerbühne (Gold)', hint:'Holzwand, Scheinwerfer, Lämpchenrahmen' },
  { key:'geburtstag', id:'kgb', name:'Geburtstag (warm)',  hint:'Wärmeres Licht, Luftballons an den Rändern' },
  { key:'neon',       id:'kgn', name:'Neon-Nacht (Retro)', hint:'Sonnenuntergang, Gitterboden, Leuchtschrift' },
];

/* Extras einer Stufe. '' heißt: nur Text. */
const INTRO_DECOS = [
  { key:'',      name:'Kein Extra' },
  { key:'teams', name:'Zwei Teams' },
  { key:'torte', name:'Geburtstagstorte' },
  { key:'tage',  name:'Tag 1 + Tag 2' },
  { key:'geld',  name:'Geldbetrag (große Zeile grün)' },
];

/** @param {any} key
 *  @returns {string} */
function introStageKey(key){
  return INTRO_STAGES.some(st => st.key === key) ? String(key) : 'buehne';
}
/** @returns {string} */
function introStage(){ return introStageKey(introData.stage); }

/** Kurzschreibweise für die Vorlagen unten.
 *  @param {string} lbl @param {string} big @param {string} pink @param {string} sub @param {string} [deco]
 *  @returns {IntroSlide} */
function introStufe(lbl, big, pink, sub, deco){
  return { lbl, big, pink, sub, deco: deco || '' };
}

/* Die drei festen Intros als Vorlagen. Als Funktion, weil das
   Geburtstags-Intro den Namen erst beim Abspielen einsetzt (Feld neben der
   Intro-Auswahl, getBdayName in feud.js). */
const INTRO_PRESETS = {
  keller: { name:'Keller Gameshow', daten: () => ({
    header: 'Die Große Keller Gameshow', seconds: 4.6, stage: 'buehne',
    slides: [
      introStufe('', 'HERZLICH', 'WILLKOMMEN!', ''),
      introStufe('Die Große', 'KELLER', 'GAMESHOW', ''),
      introStufe('Das erwartet euch', 'EINE 2-TEILIGE', 'GAMESHOW', ''),
      introStufe('Heute Abend spielen wir', 'GAMESHOW', 'NUMMER 1', ''),
      introStufe('Und morgen…', '', '? ? ?', 'eine noch unbekannte Show'),
      introStufe('An beiden Tagen gilt', 'DIESELBEN TEAMS', '', '', 'teams'),
      introStufe('Wer nach 2 Tagen vorn liegt, gewinnt', '30 €', '', '…aufs Gewinner-Team aufgeteilt!', 'geld'),
    ],
  }) },
  tag2: { name:'Keller Gameshow — Tag 2', daten: () => ({
    header: 'Die Große Keller Gameshow · Tag 2', seconds: 3.3, stage: 'buehne',
    slides: [
      introStufe('', 'WILLKOMMEN', 'ZURÜCK!', ''),
      introStufe('Runde 2 von 2', 'DAS GROSSE', 'FINALE', ''),
      introStufe('Gestern noch geheim…', '', '? ? ?', 'heute wird sie gespielt!'),
      introStufe('Nichts ändert sich', 'DIESELBEN TEAMS', '', '', 'teams'),
      introStufe('Jetzt zählt', 'DER GESAMTSTAND', '', '', 'tage'),
      introStufe('Wer am Ende vorn liegt, gewinnt', '30 €', '', '…aufs Gewinner-Team aufgeteilt!', 'geld'),
    ],
  }) },
  bday: { name:'Geburtstag', daten: () => {
    const name = getBdayName();
    const gross = name.toUpperCase();
    return {
      header: `Die Große ${name}-Geburtstagsshow`, seconds: 4.6, stage: 'geburtstag',
      slides: [
        introStufe('', 'HERZLICH', 'WILLKOMMEN!', ''),
        introStufe('Heute steigt', `${gross}S`, 'GEBURTSTAGSSHOW', ''),
        introStufe('Der Grund für das ganze Theater', '', gross, '', 'torte'),
        introStufe('Das erwartet euch', 'SPIEL, SPASS', 'UND CHAOS', ''),
        introStufe('Und es gilt', 'TEAM GEGEN TEAM', '', '', 'teams'),
        introStufe('Für das Siegerteam gibt es', 'EWIGE EHRE', '', '…und Angeberrechte bis nächstes Jahr'),
        introStufe('', 'HAPPY BIRTHDAY', `${gross}!`, '', 'torte'),
      ],
    };
  } },
};

/* Die Voreinstellung des eigenen Intros ist bewusst ein fertiges Beispiel:
   so sieht der Host beim ersten Öffnen etwas statt leerer Felder und kann
   einzelne Zeilen austauschen, statt alles selbst zu erfinden. */
/** @type {IntroDaten} */
let introData = {
  header: 'Die Große Keller Gameshow',
  seconds: 4.6,
  stage: 'buehne',
  slides: [
    introStufe('', 'HERZLICH', 'WILLKOMMEN!', ''),
    introStufe('Heute Abend', 'DIE GROSSE', 'GAMESHOW', ''),
    introStufe('Es spielen', 'ZWEI TEAMS', '', 'Gleiche Teams, beide Tage', 'teams'),
    introStufe('Zu gewinnen gibt es', '30 €', '', 'aufs Gewinner-Team aufgeteilt', 'geld'),
    introStufe('', 'LOS', 'GEHT’S!', ''),
  ],
};

function introSave(){ storeSetJson('introData', introData); }
/* Importdatei und localStorage sind beide fremde Eingabe: auf die erwartete
   Form bringen (Texte als String, Bühne und Extra aus der Liste, Anzahl
   begrenzt). Erwartet ein Objekt mit einer Liste slides.
   @param {any} d
   @returns {IntroDaten} */
function introClean(d){
  return {
    header: String(d.header || ''),
    seconds: Number(d.seconds) || 4.6,
    stage: introStageKey(d.stage),
    slides: d.slides.slice(0, INTRO_MAX_SLIDES).map((/** @type {any} */ s) => ({
      lbl: String((s && s.lbl) || ''), big: String((s && s.big) || ''),
      pink: String((s && s.pink) || ''), sub: String((s && s.sub) || ''),
      deco: INTRO_DECOS.some(x => x.key === (s && s.deco)) ? String(s.deco) : '',
    })),
  };
}
function introLoad(){
  const d = storeGetJson('introData', null);
  if (d && typeof d === 'object' && Array.isArray(d.slides)) introData = introClean(d);
}

/** Sekunden je Stufe, in sinnvollen Grenzen.
 *  @param {any} wert
 *  @returns {number} */
function introClampSeconds(wert){
  const n = Number(wert);
  if (!isFinite(n)) return 4.6;
  return Math.min(INTRO_MAX_SECONDS, Math.max(INTRO_MIN_SECONDS, n));
}
/** @returns {number} */
function introSeconds(){ return introClampSeconds(introData.seconds); }

/** Hat die Stufe etwas zu zeigen? Leere Stufen werden übersprungen.
 *  @param {IntroSlide} s
 *  @returns {boolean} */
function introSlideHasContent(s){
  return !!(s && (s.lbl || s.big || s.pink || s.sub || s.deco));
}

/* ── Abspielen ──────────────────────────────────────────────────────────── */

/* Die beiden Team-Figuren. Bewusst in Mint und Rosa statt in den festen
   Team-Farben (rot, blau): sie stehen für "zwei Teams" allgemein, nicht für
   Team 1 und Team 2 - so standen sie schon in den alten Intros. */
/** @param {string} fill
 *  @param {number} blick  Pupillen leicht nach links (-1) oder rechts (1)
 *  @returns {string} */
function introBlobSvg(fill, blick){
  const x = 26 + blick, x2 = 45 + blick;
  return `<svg width="70" height="70" viewBox="0 0 70 70" aria-hidden="true"><ellipse cx="35" cy="38" rx="27" ry="29" fill="${fill}" stroke="#111" stroke-width="4"/><circle cx="26" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="45" cy="34" r="8" fill="#fff" stroke="#111" stroke-width="3"/><circle cx="${x}" cy="35" r="3.5" fill="#111"/><circle cx="${x2}" cy="35" r="3.5" fill="#111"/><path d="M27 49 q8 8 17 0" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/></svg>`;
}

/** @param {string} deco
 *  @returns {string} */
function introDecoHtml(deco){
  if (deco === 'teams') return `<div class="teamrow">${introBlobSvg('#6DD3B0', 1)}${introBlobSvg('#F58BB8', -1)}</div>`;
  if (deco === 'tage')  return `<div class="plus"><span class="pill">TAG 1</span><b>+</b><span class="pill">TAG 2</span></div>`;
  if (deco === 'torte') return `
    <div class="cake">
      <div class="flame f1"></div><div class="flame f2"></div><div class="flame f3"></div>
      <div class="candle c1"></div><div class="candle c2"></div><div class="candle c3"></div>
      <div class="icing"></div>
      <div class="tier t2"></div>
      <div class="tier t1"></div>
      <div class="plate"></div>
    </div>`;
  return '';
}

/** Zerlegt eine große Zeile in Buchstaben, jeder mit seiner Nummer --i.
 *  Wörter bleiben als .w zusammen, sonst bräche der Browser mitten im Wort
 *  um. Array.from statt split(''), damit ein Emoji ein Zeichen bleibt.
 *  @param {string} text
 *  @param {{ n: number }} zaehler  läuft über beide großen Zeilen weiter
 *  @returns {string} */
function introLetters(text, zaehler){
  return text.split(' ').map(wort => !wort ? '' :
    `<span class="w">${Array.from(wort).map(ch =>
      `<span class="ch${ch === '?' ? ' qm' : ''}" style="--i:${zaehler.n++}">${escapeHtml(ch)}</span>`
    ).join('')}</span>`
  ).join(' ');
}

/** Eine Stufe als Markup.
 *  @param {IntroSlide} s
 *  @param {number} start   Sekunden ab Beginn
 *  @param {number} laenge  Sekunden
 *  @param {boolean} letzte bleibt stehen, bis der Host klickt
 *  @param {string[]} konfetti  Farben der Konfetti-Explosion, leer = keine
 *  @returns {string} */
function introSlideHtml(s, start, laenge, letzte, konfetti){
  const zaehler = { n: 0 };
  const zeichen = Array.from((s.big + s.pink).replace(/\s+/g, '')).length;
  // Lange Zeilen leuchten schneller durch, damit die letzte Birne nicht erst
  // angeht, wenn die Stufe schon wieder ausblendet: höchstens 1,1 s für alle.
  const abstand = Math.min(0.055, 1.1 / Math.max(1, zeichen));
  const klein = (/** @type {string} */ t) => Array.from(t).length > 11 ? ' sm' : '';
  const style = `--d:${start.toFixed(2)}s;--dur:${laenge.toFixed(2)}s;--st:${abstand.toFixed(3)}s;`;
  return `<div class="screen cs${letzte ? ' hold' : ''}" style="${style}">
      <i class="flare"></i>${introConfettiHtml(konfetti)}
      ${introDecoHtml(s.deco)}
      ${s.lbl  ? `<p class="lbl">${escapeHtml(s.lbl)}</p>` : ''}
      ${s.big  ? `<p class="big${s.deco === 'geld' ? ' euro' : klein(s.big)}">${introLetters(s.big, zaehler)}</p>` : ''}
      ${s.pink ? `<p class="big pink${klein(s.pink)}">${introLetters(s.pink, zaehler)}</p>` : ''}
      ${s.sub  ? `<p class="sub">${escapeHtml(s.sub)}</p>` : ''}
    </div>`;
}

/** 22 Konfettistücke, die von der Mitte aus nach außen fliegen. Richtung
 *  und Weite werden hier gewürfelt und als --x/--y/--r mitgegeben, die
 *  Bewegung selbst macht CSS (kgBurst).
 *  @param {string[]} farben
 *  @returns {string} */
function introConfettiHtml(farben){
  if (!farben.length) return '';
  let out = '';
  for (let k = 0; k < 22; k++){
    const winkel = (k / 22) * Math.PI * 2 + Math.random() * 0.4;
    const weite = 22 + Math.random() * 26;           // in vmin
    const x = Math.cos(winkel) * weite * 1.5;        // breiter als hoch
    const y = Math.sin(winkel) * weite - 10;         // leicht nach oben
    const r = Math.round(Math.random() * 540 - 270);
    out += `<i class="cf" style="--x:${x.toFixed(1)}vmin;--y:${y.toFixed(1)}vmin;--r:${r}deg;--c:${farben[k % farben.length]}"></i>`;
  }
  return out;
}

/* Goldstaub: 26 kleine Körner hinter der Schrift, 5 große, weiche davor.
   Negative Verzögerung, damit beim Start schon Staub im Bild ist, statt
   dass alles gemeinsam von unten hochsteigt.
   @param {HTMLElement} stage */
function introDust(stage){
  for (let k = 0; k < 31; k++){
    const vorn = k >= 26;
    const d = document.createElement('i');
    d.className = vorn ? 'dust vorn' : 'dust';
    const groesse = vorn ? 18 + Math.random() * 22 : 2 + Math.random() * 4;
    const dauer = vorn ? 10 + Math.random() * 8 : 16 + Math.random() * 18;
    d.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${groesse.toFixed(1)}px;height:${groesse.toFixed(1)}px;`
      + `opacity:${(vorn ? 1 : 0.4 + Math.random() * 0.5).toFixed(2)};z-index:${vorn ? 8 : 3};`
      + `--dx:${Math.round(Math.random() * 120 - 60)}px;animation-duration:${dauer.toFixed(1)}s;animation-delay:-${(Math.random() * dauer).toFixed(1)}s;`;
    stage.appendChild(d);
  }
}

/** Baut die Bühne und spielt sie ab.
 *  @param {IntroDaten} daten
 *  @param {() => void} [onDone] */
function playIntro(daten, onDone){
  const dur = introClampSeconds(daten.seconds);
  const slides = (daten.slides || []).filter(introSlideHasContent);
  if (!slides.length){
    // Nichts eingetragen: still überspringen statt eine leere Bühne zeigen.
    if (onDone) onDone();
    return;
  }
  const stage = INTRO_STAGES.find(st => st.key === introStageKey(daten.stage)) || INTRO_STAGES[0];
  // Konfetti je Bühne in ihren eigenen Farben. Auf der Geburtstagsbühne bei
  // jeder Stufe, sonst nur beim Geldbetrag und auf der letzten Stufe - zu
  // oft, und es ist kein Ereignis mehr.
  const farben = stage.key === 'geburtstag' ? ['#FF5DA2','#FFC93C','#7FE5B0','#8FB8FF','#FF8A5C','#C9A0FF']
               : stage.key === 'neon'       ? ['#FF2E88','#7DF9FF','#FFFFFF','#C9A0FF']
               :                              ['#FFD24D','#FFF0B0','#FF5DA2','#F7C42F'];
  // Die letzte Stufe blendet nicht wieder aus - sie bleibt stehen, bis der
  // Host klickt. Sonst steht die Bühne am Ende leer da.
  const html = slides.map((s, i) => {
    const letzte = i === slides.length - 1;
    const knall = stage.key === 'geburtstag' || letzte || s.deco === 'geld';
    return introSlideHtml(s, 0.3 + i * dur, letzte ? 2 : dur, letzte, knall ? farben : []);
  }).join('');

  const kopf = escapeHtml(daten.header || '');
  // Die Neon-Bühne hat bewusst KEIN .frame: der Lämpchenrahmen gehört zur
  // Keller- und Geburtstagsbühne. Fehlt das Element, überspringt runKgIntro
  // den Bau.
  const buehne = stage.key === 'neon'
    ? `<div id="kgn">
        <div class="sky"></div>
        <div class="stars"></div>
        <div class="sun"></div>
        <div class="horizon"></div>
        <div class="grid"></div>
        <div class="scan"></div>
        <div class="vig"></div>
        <div class="grain"></div>
        ${kopf ? `<div class="header">${kopf}</div>` : ''}
        ${html}
        <div class="kg-hint">Klicken um fortzufahren</div>
      </div>`
    : `<div id="${stage.id}">
        <div class="wall"></div>
        <div class="rays"></div>
        <div class="haze"></div>
        <div class="floor"></div>
        <div class="cone coneL"></div>
        <div class="cone coneR"></div>
        <div class="cord"><div class="bulb"></div></div>
        <div class="vig"></div>
        <div class="frame"></div>
        <div class="grain"></div>
        ${kopf ? `<div class="header"><span class="star">★</span>${kopf}<span class="star">★</span></div>` : ''}
        ${html}
        <div class="kg-hint">Klicken um fortzufahren</div>
      </div>`;
  const overlay = document.createElement('div');
  overlay.id = 'kg-overlay';
  overlay.innerHTML = buehne;
  const buehnenEl = /** @type {HTMLElement} */ (overlay.firstElementChild);
  if (stage.key === 'geburtstag') introBalloons(buehnenEl);
  if (stage.key !== 'neon') introDust(buehnenEl);
  runKgIntro(overlay, onDone);
}

/* Luftballons steigen nur an den Rändern auf. Quer durch die Mitte gelegt
   wandern sie sonst hinter Torte und Schrift durch und werden als Teil des
   Bildes gelesen statt als Deko.
   @param {HTMLElement} stage */
function introBalloons(stage){
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
}

// Gemeinsamer Ablauf aller Intros: Lämpchenrahmen und Funken aufbauen,
// Sequenz abspielen, per Klick beenden (frühestens nach 1,5s), bei Resize neu
// aufbauen. Der Bildinhalt kommt von playIntro.
/** @param {HTMLElement} overlay
 *  @param {() => void} [onDone] */
function runKgIntro(overlay, onDone) {
  document.body.appendChild(overlay);
  const kg = /** @type {HTMLElement} */ (overlay.firstElementChild);
  const frame = kg.querySelector('.frame');
  const cols = ['#FFD24D', '#FF5DA2'];
  function build() {
    // Bühnen ohne Lämpchenrahmen (Neon-Nacht) haben kein .frame - dort gibt
    // es nichts zu bauen, und ohne diese Zeile würde der Zugriff werfen.
    if (!frame) return;
    frame.innerHTML = '';
    kg.querySelectorAll('.spark').forEach(e => e.remove());
    const W = kg.clientWidth || 680, H = kg.clientHeight || 470, step = 40;
    let i = 0;
    /** @param {number} x @param {number} y */
    function mb(x, y) {
      const b = document.createElement('div');
      b.className = 'mb';
      b.style.left = x + 'px';
      b.style.top = y + 'px';
      const c = cols[i % 2];
      b.style.background = c;
      b.style.boxShadow = '0 0 10px 2px ' + c;
      // Lauflicht: jede dritte Birne leuchtet gleichzeitig. Negative
      // Verzögerung, damit der Rahmen sofort läuft statt erst anzulaufen.
      b.style.animationDelay = (-(i % 3) * 0.4) + 's';
      frame.appendChild(b);
      i++;
    }
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
    // Die Stufen und Buchstaben haben eigene, endliche Animationen, deren
    // animationend hier ebenfalls ankommt - nur das Ausblenden des Overlays
    // selbst zählt.
    overlay.addEventListener('animationend', (e) => {
      if (e.target !== overlay) return;
      cleanup();
    });
    setTimeout(cleanup, 900); // kgFadeOut dauert .8s; Netz, falls animationend ausbleibt
  }
  // Kein automatisches Weiter - nach der letzten Stufe klickt der Host.
  let canSkip = false;
  setTimeout(() => { canSkip = true; }, 1500);
  overlay.addEventListener('click', () => { if (canSkip) finish(); });
  const onResize = () => { if (!done) build(); else window.removeEventListener('resize', onResize); };
  window.addEventListener('resize', onResize);
}

/* Die festen Intros - Namen bleiben, weil runIntroThen sie so aufruft. */
/** @param {() => void} [onDone] */
function showGameshowIntro(onDone){ playIntro(INTRO_PRESETS.keller.daten(), onDone); }
/** @param {() => void} [onDone] */
function showGameshowIntroTag2(onDone){ playIntro(INTRO_PRESETS.tag2.daten(), onDone); }
/** @param {() => void} [onDone] */
function showBirthdayIntro(onDone){ playIntro(INTRO_PRESETS.bday.daten(), onDone); }
/** @param {() => void} [onDone] */
function showCustomIntro(onDone){ playIntro(introData, onDone); }

/* Vorschau aus dem Editor heraus - ohne Spielstart, ohne Firebase. Bei
   Arcade und Primetime das gewählte Film-Intro, sonst das eigene. */
function previewCustomIntro(){
  const film = introFilmKey();
  if (film) playFilmIntro(film);
  else showCustomIntro();
}

/** Ist in der Auswahl ein Film-Intro gewählt? Dann dessen Schlüssel.
 *  @returns {string} */
function introFilmKey(){
  const v = fieldVal('intro-variant');
  return INTRO_FILME[v] ? v : '';
}

/* ── Film-Intros: Arcade und Primetime ─────────────────────────────────────
   Zwei Intros, die keine Stufen abspielen, sondern einen festen Ablauf wie
   ein Vorspann: Arcade (die Show als Automatenspiel) und Primetime (der
   Opener einer Samstagabendshow). Entstanden im Intro-Labor (tools/intros/),
   dort mit GSAP, Canvas und WebAudio gebaut. Hier ist das Bild reines CSS,
   aus demselben Grund wie bei den Bühnen oben (BAUPLAN 4.8): das
   Zuschauerfenster spiegelt nur den DOM.

   Wie ein fester Ablauf ohne JavaScript-Zeitleiste geht: alles steht von
   Anfang an im Dokument, jede Einstellung ("Shot") in einem eigenen
   Behälter .ifw mit --a (wann sie erscheint) und --b (wann sie verschwindet).
   Was darin passiert, hat absolute Verzögerungen ab dem Einfügen des
   Overlays. Weil Hauptfenster und Zuschauerfenster das Overlay im selben
   Bild einfügen, laufen beide im Gleichtakt.

   Die Texte (Titel, Teams, Preis) sind für beide dieselben und stehen
   getrennt von den Stufen des eigenen Intros - der Editor zeigt je nach
   gewähltem Intro das eine oder das andere.

   Der Ton läuft nur im Hauptfenster (am Rechner hängen die Lautsprecher),
   wird beim Start einmal komplett eingeplant und folgt dem Ton-Schalter
   (SFX.enabled). Alles synthetisch, keine Dateien. */

/** @typedef {{ vorab: string, titelKlein: string, titel1: string, titel2: string,
 *              titelZeile: string, team1: string, team2: string, preis: string }} IntroTexte */

/** @type {IntroTexte} */
const INTRO_TEXTE_STANDARD = {
  vorab: 'Heute Abend', titelKlein: 'Die Große', titel1: 'Keller', titel2: 'Gameshow',
  titelZeile: 'Zwei Teams · Ein Abend · Ein Sieger', team1: 'Team Rot', team2: 'Team Blau', preis: '30 €',
};
/* Reihenfolge und Beschriftung der Felder im Editor. */
const INTRO_TEXT_FELDER = [
  { key:'vorab',      name:'Erste Zeile im Dunkeln (nur Primetime)', ph:'z.B. Heute Abend' },
  { key:'titelKlein', name:'Kleine Zeile über dem Titel',            ph:'z.B. Die Große' },
  { key:'titel1',     name:'Titel, erste Zeile',                     ph:'z.B. Keller' },
  { key:'titel2',     name:'Titel, zweite Zeile',                    ph:'z.B. Gameshow' },
  { key:'titelZeile', name:'Schlagzeile (mit · trennen)',            ph:'z.B. Zwei Teams · Ein Abend · Ein Sieger' },
  { key:'team1',      name:'Team oder Spieler 1',                    ph:'z.B. Team Rot' },
  { key:'team2',      name:'Team oder Spieler 2',                    ph:'z.B. Team Blau' },
  { key:'preis',      name:'Preis (leer = ohne)',                    ph:'z.B. 30 €' },
];
/** @type {IntroTexte} */
let introTexte = { ...INTRO_TEXTE_STANDARD };

/** Wie introClean: Speicher und Importdatei sind fremde Eingabe. Ein Feld,
 *  das fehlt, bekommt den Standard; ein absichtlich geleertes bleibt leer.
 *  @param {any} d
 *  @returns {IntroTexte} */
function introTexteClean(d){
  const out = /** @type {IntroTexte} */ ({ ...INTRO_TEXTE_STANDARD });
  INTRO_TEXT_FELDER.forEach(f => {
    const v = d && d[f.key];
    if (v != null) out[f.key] = String(v).slice(0, 80);
  });
  return out;
}
function introTexteSave(){ storeSetJson('introTexte', introTexte); }
function introTexteLoad(){
  const d = storeGetJson('introTexte', null);
  if (d && typeof d === 'object') introTexte = introTexteClean(d);
}

/** Zufallszahl zwischen a und b, für Sterne, Funken, Konfetti.
 *  @param {number} a @param {number} b
 *  @returns {number} */
function introZufall(a, b){ return a + Math.random() * (b - a); }
/** Zahl mit zwei Stellen für ein style-Attribut.
 *  @param {number} n
 *  @returns {string} */
function introF(n){ return n.toFixed(2); }

/* ── Ton ──────────────────────────────────────────────────────────────────
   Aus dem Labor übernommen (tools/intros/lab.js, Lab.Ton), auf das gekürzt,
   was die beiden Intros brauchen. Jede Funktion bekommt eine absolute
   AudioContext-Zeit, damit der ganze Ablauf beim Start eingeplant wird und
   nicht vom Bildtakt abhängt. Eigener AudioContext statt dem von SFX:
   abbrechen (Klick mitten im Intro) muss alles auf einmal stummschalten
   können, ohne die Spielgeräusche zu treffen. */
const INTRO_TON = {
  ctx: null, out: null, buf: null,
  /** @type {AudioScheduledSourceNode[]} */
  nodes: [],
  /** Neuer Durchlauf; gibt die Startzeit zurück, oder -1 ohne WebAudio.
   *  @returns {number} */
  neu(){
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return -1; }
    const c = this.ctx;
    if (!this.buf){
      this.buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = this.buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    this.stop();
    if (c.state === 'suspended' && c.resume) c.resume();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4;
    comp.connect(c.destination);
    this.out = c.createGain();
    this.out.gain.value = .8;
    this.out.connect(comp);
    return c.currentTime + .06;
  },
  stop(){
    this.nodes.forEach(n => { try { n.stop(); } catch {} });
    this.nodes = [];
    if (this.out){ try { this.out.disconnect(); } catch {} this.out = null; }
  },
  /* Beim Wegklicken weich aus statt hart abgeschnitten. */
  ausblenden(){
    if (!this.out || !this.ctx) return;
    this.out.gain.setTargetAtTime(0, this.ctx.currentTime, .12);
    const out = this.out;
    setTimeout(() => { if (this.out === out) this.stop(); }, 900);
  },
  /** @param {number} v @param {AudioNode} [ziel] */
  gain(v, ziel){ const g = this.ctx.createGain(); g.gain.value = v; g.connect(ziel || this.out); return g; },
  /** @param {BiquadFilterType} typ @param {number} f @param {number} q @param {AudioNode} ziel */
  filter(typ, f, q, ziel){ const b = this.ctx.createBiquadFilter(); b.type = typ; b.frequency.value = f; if (q) b.Q.value = q; b.connect(ziel); return b; },
  /** @param {OscillatorType} typ @param {number} f @param {number} t @param {number} dauer @param {AudioNode} ziel */
  osz(typ, f, t, dauer, ziel){
    const o = this.ctx.createOscillator(); o.type = typ; o.frequency.setValueAtTime(f, t);
    o.connect(ziel); o.start(t); o.stop(t + dauer); this.nodes.push(o); return o;
  },
  /** @param {number} t @param {number} dauer @param {AudioNode} ziel */
  rauschen(t, dauer, ziel){
    const s = this.ctx.createBufferSource(); s.buffer = this.buf; s.loop = true;
    s.playbackRate.value = .9 + Math.random() * .2;
    s.connect(ziel); s.start(t, Math.random()); s.stop(t + dauer); this.nodes.push(s); return s;
  },
  /** Hüllkurve: Anstieg a, halten, exponentiell ausklingen r.
   *  @param {number} t @param {number} a @param {number} wert @param {number} halten @param {number} r @param {AudioNode} [ziel] */
  huelle(t, a, wert, halten, r, ziel){
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(wert, t + a);
    g.gain.setValueAtTime(wert, t + a + halten);
    g.gain.exponentialRampToValueAtTime(.0001, t + a + halten + r);
    g.connect(ziel || this.out);
    return g;
  },
  /** @param {number} t @param {number} [v] */
  kick(t, v){
    v = v == null ? 1 : v;
    const g = this.huelle(t, .002, v, .02, .34);
    const o = this.osz('sine', 160, t, .45, g); o.frequency.exponentialRampToValueAtTime(42, t + .13);
    const k = this.huelle(t, .001, v * .25, 0, .02);
    this.rauschen(t, .03, this.filter('highpass', 3000, 0, k));
  },
  /** @param {number} t @param {number} [v] */
  snare(t, v){
    v = v == null ? .55 : v;
    const g = this.huelle(t, .001, v, 0, .2);
    this.rauschen(t, .25, this.filter('highpass', 1400, 0, g));
    this.osz('triangle', 190, t, .15, this.huelle(t, .001, v * .6, 0, .1));
  },
  /** @param {number} t @param {number} [v] */
  hat(t, v){
    v = v == null ? .18 : v;
    this.rauschen(t, .08, this.filter('highpass', 7500, 0, this.huelle(t, .001, v, 0, .045)));
  },
  /** @param {number} t @param {number} [v] */
  becken(t, v){
    v = v == null ? .35 : v;
    this.rauschen(t, 2, this.filter('highpass', 5000, 0, this.huelle(t, .002, v, 0, 1.8)));
  },
  /** Tiefer Einschlag mit Grollen.
   *  @param {number} t @param {number} [v] */
  aufprall(t, v){
    v = v == null ? 1 : v;
    const g = this.huelle(t, .003, v, 0, 3);
    const o = this.osz('sine', 95, t, 3.2, g); o.frequency.exponentialRampToValueAtTime(28, t + 1.5);
    const lp = this.filter('lowpass', 1600, 0, this.huelle(t, .002, v * .65, 0, 1.6));
    lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(140, t + 1.4);
    this.rauschen(t, 1.8, lp);
  },
  /** Rauschen, das in der Tonhöhe hochläuft - der Anlauf vor einem Schlag.
   *  @param {number} t @param {number} dauer @param {number} [v] */
  anstieg(t, dauer, v){
    v = v == null ? .45 : v;
    const g = this.ctx.createGain(); g.connect(this.out);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dauer - .03); g.gain.setValueAtTime(0, t + dauer);
    const bp = this.filter('bandpass', 250, 5, g);
    bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(5500, t + dauer);
    this.rauschen(t, dauer + .05, bp);
  },
  /** Luftzug für einen Schnitt.
   *  @param {number} t @param {number} dauer @param {number} v @param {number} von @param {number} bis */
  wisch(t, dauer, v, von, bis){
    const g = this.ctx.createGain(); g.connect(this.out);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dauer * .55); g.gain.exponentialRampToValueAtTime(.0001, t + dauer);
    const bp = this.filter('bandpass', von, 2.5, g);
    bp.frequency.setValueAtTime(von, t); bp.frequency.exponentialRampToValueAtTime(bis, t + dauer);
    this.rauschen(t, dauer + .05, bp);
  },
  /** Fläche: verstimmte Sägezähne durch einen Tiefpass.
   *  @param {number} t @param {number[]} freqs @param {number} dauer @param {number} v @param {number} cutoff @param {number} a */
  flaeche(t, freqs, dauer, v, cutoff, a){
    const g = this.huelle(t, a, v, Math.max(0, dauer - a - 1.5), 1.5);
    const lp = this.filter('lowpass', cutoff, .7, g);
    freqs.forEach(f => [-.004, .004].forEach(dt => this.osz('sawtooth', f * (1 + dt), t, dauer + .2, lp)));
  },
  /** Bläser-Stoß: Sägezahn-Akkord, Filter öffnet und schließt schnell.
   *  @param {number} t @param {number[]} freqs @param {number} v @param {number} dauer */
  stoss(t, freqs, v, dauer){
    const g = this.huelle(t, .015, v, dauer * .3, dauer * .7);
    const lp = this.filter('lowpass', 400, 1.2, g);
    lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(3800, t + .06); lp.frequency.exponentialRampToValueAtTime(700, t + dauer);
    freqs.forEach(f => [-.006, 0, .006].forEach(dt => this.osz('sawtooth', f * (1 + dt), t, dauer + .1, lp)));
  },
  /** Glocke.
   *  @param {number} t @param {number} f @param {number} v @param {number} dauer */
  ping(t, f, v, dauer){
    this.osz('sine', f, t, dauer + .1, this.huelle(t, .002, v, 0, dauer));
    this.osz('sine', f * 2.76, t, dauer, this.huelle(t, .002, v * .25, 0, dauer * .5));
  },
  /** Chiptune: Rechteckton mit hartem Ende.
   *  @param {number} t @param {number} f @param {number} dauer @param {number} [v] @param {OscillatorType} [typ] */
  piep(t, f, dauer, v, typ){
    v = v == null ? .08 : v;
    this.osz(typ || 'square', f, t, dauer + .02, this.huelle(t, .002, v, dauer * .8, dauer * .2));
  },
  /** @param {number} t @param {number} f @param {number} dauer @param {number} v */
  bass(t, f, dauer, v){
    const lp = this.filter('lowpass', 500, 2, this.huelle(t, .005, v, dauer * .5, dauer * .5));
    lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(260, t + dauer);
    this.osz('sawtooth', f, t, dauer + .05, lp);
    this.osz('square', f / 2, t, dauer + .05, this.gain(.4, lp));
  },
  /** Trommelwirbel, immer dichter und lauter.
   *  @param {number} t @param {number} dauer @param {number} v */
  wirbel(t, dauer, v){
    for (let s = 0; s < dauer; ){
      const p = s / dauer;
      this.snare(t + s, v * (.3 + .7 * p) * (.85 + Math.random() * .3));
      s += .07 - .035 * p;
    }
  },
};
/** @typedef {typeof INTRO_TON} IntroTon */

/** MIDI-Notennummer in Hz.
 *  @param {number} m
 *  @returns {number} */
function introNote(m){ return 440 * Math.pow(2, (m - 69) / 12); }

/* ── Arcade ───────────────────────────────────────────────────────────────
   Die Show als Automatenspiel: Röhre geht an, INSERT COIN, Münze, der Titel
   zoomt in Regenbogen-Pixeln herein, Spielerwahl, VS-Blitz, READY? GO!! und
   der Titelbildschirm mit PRESS START - der bleibt stehen, bis der Host
   klickt. Taktung wie im Labor (tools/intros/arcade/); die Zeiten stehen in
   styles.css am Block #kga und in introArcadeTon. */

/* Die Spielfigur, 10x10 Pixel: X = Teamfarbe, W = weiß, B = schwarz. */
const INTRO_ARCADE_FIGUR = ['..XXXXXX..', '.XXXXXXXX.', 'XXWWXXWWXX', 'XXWBXXWBXX', 'XXXXXXXXXX',
                            'XXXXXXXXXX', 'XXBXXXXBXX', 'XXXBBBBXXX', '.XXXXXXXX.', '..XXXXXX..'];

/** Pixelgrafik: ein 1x1-Element, jeder Pixel ein box-shadow.
 *  @param {string} farbe
 *  @returns {string} */
function introArcadeFigur(farbe){
  const px = .9, s = [];
  INTRO_ARCADE_FIGUR.forEach((zeile, y) => Array.from(zeile).forEach((c, x) => {
    if (c === '.') return;
    s.push(`${introF(x * px)}vh ${introF(y * px)}vh 0 0 ${c === 'X' ? farbe : c === 'W' ? '#fff' : '#000'}`);
  }));
  return `<div class="ka-figur" style="box-shadow:${s.join(',')}"></div>`;
}

/** Der Titel in Pixelschrift, jeder Buchstabe mit Nummer --i für den
 *  Regenbogen. --n ist die Länge: lange Titel werden kleiner gesetzt.
 *  @param {IntroTexte} tx
 *  @param {string} cls  ka-t1 (Zoom nach INSERT COIN) oder ka-t2 (Titelbild)
 *  @returns {string} */
function introArcadeTitel(tx, cls){
  let n = 0;
  /** @param {string} t */
  const zeile = (t, extra) => {
    const z = Array.from(t.toUpperCase());
    if (!z.length) return '';
    return `<div class="g${extra}" style="--n:${z.length}">${z.map(c => c === ' ' ? ' '
      : `<span class="ch" style="--i:${n++}">${escapeHtml(c)}</span>`).join('')}</div>`;
  };
  return `<div class="ka-titel ${cls}">
      ${tx.titelKlein ? `<div class="k">${escapeHtml(tx.titelKlein.toUpperCase())}</div>` : ''}
      ${zeile(tx.titel1, '')}${zeile(tx.titel2, ' g2')}
    </div>`;
}

/** @param {IntroTexte} tx
 *  @returns {string} */
function introArcadeHtml(tx){
  const sterne = Array.from({ length: 60 }, () => {
    const x = introF(introZufall(0, 100)), y = introZufall(0, 50), o = introF(introZufall(.3, 1));
    // Jeder Stern zweimal, eine Bildhöhe auseinander: so läuft das Feld
    // endlos durch, ohne zu springen.
    return `<i style="left:${x}%;top:${introF(y)}%;opacity:${o}"></i><i style="left:${x}%;top:${introF(y + 50)}%;opacity:${o}"></i>`;
  }).join('');
  const team = (/** @type {number} */ i) => {
    const name = ((i ? tx.team2 : tx.team1) || (i ? 'Player 2' : 'Player 1')).toUpperCase();
    return `<div class="ka-sp ka-sp${i}">
        <div class="ka-rahmen">${introArcadeFigur(i ? '#3B82F6' : '#E8453C')}</div>
        <div class="ka-p">P${i + 1}</div>
        <div class="ka-name" style="--n:${Math.max(8, Array.from(name).length)}">${escapeHtml(name)}</div>
      </div>`;
  };
  // HI-SCORE aus dem Preis: "30 €" wird zu 000030 €. Ohne Ziffern steht der
  // Text da, ohne Preis entfällt die Zeile.
  const ziffern = (tx.preis.match(/\d+/) || [''])[0];
  const hiscore = ziffern ? ziffern.padStart(6, '0') + (/€/.test(tx.preis) ? ' €' : '') : tx.preis.toUpperCase();
  const fuss = [`© ${new Date().getFullYear()} ${tx.titel1.toUpperCase()} GAMES`, tx.titelZeile.toUpperCase()].filter(Boolean).join(' · ');
  return `<div id="kga">
    <div class="ka-kasten">
      <div class="ka-wackel"><div class="ka-bild">
        <div class="ka-sterne">${sterne}</div>
        <div class="ifw" style="--a:.9s;--b:3s"><div class="ka-zeile ka-coin">INSERT COIN</div></div>
        <div class="ifw" style="--a:2.2s;--b:6s"><div class="ka-zeile ka-credit">CREDIT 01</div></div>
        <div class="ifw" style="--a:3s;--b:6s">${introArcadeTitel(tx, 'ka-t1')}</div>
        <div class="ifw" style="--a:6s;--b:8.8s"><div class="ka-zeile ka-wahl">SELECT PLAYER</div>${team(0)}${team(1)}</div>
        <div class="ifw" style="--a:7.2s;--b:8.8s"><div class="ka-vs">VS</div></div>
        <div class="ifw" style="--a:8.8s;--b:9.8s"><div class="ka-gross ka-ready">READY?</div></div>
        <div class="ifw" style="--a:9.8s;--b:10.6s"><div class="ka-gross ka-go">GO!!</div></div>
        <div class="ifw fin" style="--a:10.6s">${introArcadeTitel(tx, 'ka-t2')}</div>
        <div class="ifw fin" style="--a:11.2s">
          ${hiscore ? `<div class="ka-zeile ka-hi">HI-SCORE&nbsp;&nbsp;<b>${escapeHtml(hiscore)}</b></div>` : ''}
          <div class="ka-zeile ka-copy">${escapeHtml(fuss)}</div>
        </div>
        <div class="ifw fin" style="--a:11.6s"><div class="ka-zeile ka-start">PRESS START</div></div>
        <div class="ka-weiss"></div>
      </div></div>
      <div class="ka-raster"></div><div class="ka-woelbung"></div><div class="ka-an"></div>
    </div>
  </div>`;
}

/** @param {number} t0 @param {IntroTon} A */
function introArcadeTon(t0, A){
  const n = introNote;
  A.wisch(t0 + .1, .4, .2, 4000, 300);
  for (let k = 0; k < 3; k++) A.piep(t0 + .9 + k * .46, 1046.5, .1, .04);
  // Münze: zwei schnelle hohe Töne
  A.piep(t0 + 2.2, n(83), .07, .07); A.piep(t0 + 2.27, n(88), .35, .07);
  // Titelmelodie: kurze Fanfare in C
  const mel = [[72, .13], [76, .13], [79, .13], [84, .26], [79, .13], [84, .52], [86, .13], [88, .13], [91, .26], [88, .13], [91, .52]];
  let t = 3.2;
  mel.forEach(([m, d]) => { A.piep(t0 + t, n(m), d * .9, .06); A.piep(t0 + t, n(m - 24), d * .9, .05, 'triangle'); t += d; });
  for (let k = 0; k < 8; k++) A.kick(t0 + 3.2 + k * .26, .35);
  // Auswahl-Piepser
  [0, .3, .8, 1, 1.2, 1.4].forEach((d, i) => A.piep(t0 + 6 + d, n(76 + i * 2), .06, .05));
  A.aufprall(t0 + 7.2, .6); A.wisch(t0 + 7.2, .5, .3, 5000, 400);
  A.piep(t0 + 8.8, n(69), .5, .07); A.piep(t0 + 9.3, n(69), .3, .05);
  [72, 76, 79, 84].forEach((m, i) => A.piep(t0 + 9.8 + i * .06, n(m), .5, .06));
  A.kick(t0 + 9.8, 1); A.wisch(t0 + 9.8, .3, .25, 6000, 600);
  // Titelbildschirm: kleine Schleife, dann Ruhe
  const loop = [72, 79, 76, 79, 74, 79, 77, 79];
  for (let k = 0; k < 32; k++){
    const tt = t0 + 11.2 + k * .18;
    A.piep(tt, n(loop[k % 8]), .14, .045);
    if (k % 2 === 0) A.piep(tt, n(48 + [0, 0, 5, 7][Math.floor(k / 8) % 4]), .16, .05, 'triangle');
    if (k % 4 === 0) A.kick(tt, .3);
  }
}

/* ── Primetime ────────────────────────────────────────────────────────────
   Der Opener einer großen Samstagabendshow, in sechs Einstellungen auf
   einem Takt von 0,55 s (109 bpm):

     0,00  Kaltstart   schwarz, ein Spot schlägt an, "Heute Abend"
     1,70  LED-Wand    Wellen über die Wand, Moving Heads, die Schlagzeile
                       in bis zu drei Schlägen (Teile mit · getrennt)
     3,45  Makro       drei Beauty-Shots ganz nah am Chrom-Logo
     5,10  Teams       diagonal geteilt, rot gegen blau, VS mit Blitz
     6,75  Tunnel      Flug durch Lichtringe, wird weiß
     7,85  Logo        die Buchstaben fliegen einzeln aus dem Raum zusammen,
                       Druckwelle, Funken, Pyro, Konfetti, Spiegelboden;
                       danach dreht das Logo langsam im Licht und bleibt
                       stehen, bis der Host klickt.

   Die Zeiten stehen hier (INTRO_PT) und werden als --t/--a/--b ins Markup
   geschrieben; styles.css rechnet nur damit. Ton und Bild lesen dieselbe
   Tabelle. */
const INTRO_PT = {
  takt: .55, eins: 1.8,
  spot: .15, vorab: .5, led: 1.7, wisch1: 1.55,
  schlag: [1.8, 2.35, 2.9],
  makro: [3.45, 4.0, 4.55], wisch2: 4.95,
  teams: 5.1, vs: 5.65, tunnel: 6.75,
  hit: 7.85, landung: 8.75, zeile: 8.9, preis: 9.6, hinweis: 11,
};

/** Chrom-Schrift: jeder Buchstabe zweimal übereinander - hinten die
 *  Tiefe (text-shadow-Stapel), vorne die Chromfläche (Verlauf als
 *  Textfüllung). Beides in einem Element ginge nicht: bei durchsichtiger
 *  Textfarbe läge der Schatten über der Füllung. --x/--y/--z/--rx/--ry sind
 *  der Startpunkt im Raum, aus dem der Buchstabe beim Logo-Moment anfliegt.
 *  @param {string} text
 *  @param {string} cls
 *  @param {number[]} [flug]  gemeinsame Zufallswerte, damit das Spiegelbild
 *                            denselben Flug macht wie das Original
 *  @returns {string} */
function introPtChrom(text, cls, flug){
  const zeichen = Array.from(text.toUpperCase());
  let i = 0;
  const html = zeichen.map(c => {
    if (c === ' ') return '<span class="pt-luft"> </span>';
    const k = i++;
    const w = flug ? flug.slice(k * 5, k * 5 + 5) : [0, 0, 0, 0, 0];
    return `<span class="pl" style="--i:${k};--x:${introF(w[0])}vw;--y:${introF(w[1])}vh;--z:${Math.round(w[2])}px;--rx:${Math.round(w[3])}deg;--ry:${Math.round(w[4])}deg">`
      + `<b class="ex">${escapeHtml(c)}</b><b class="fc">${escapeHtml(c)}</b></span>`;
  }).join('');
  return `<div class="pt-chrom ${cls}" style="--n:${Math.max(4, zeichen.length)}">${html}</div>`;
}

/** Zufällige Anflugwerte für bis zu n Buchstaben.
 *  @param {number} n
 *  @returns {number[]} */
function introPtFlug(n){
  const w = [];
  for (let k = 0; k < n; k++){
    w.push(introZufall(-70, 70), introZufall(-60, 60), introZufall(300, 1100), introZufall(-200, 200), introZufall(-260, 260));
  }
  return w;
}

/** Die Schlagzeile in bis zu drei Teile für die drei Schläge.
 *  @param {string} zeile
 *  @returns {string[]} */
function introPtSchlaege(zeile){
  return zeile.split(/[·•|\/]/).map(s => s.trim()).filter(Boolean).slice(0, 3);
}

/** @param {IntroTexte} tx
 *  @returns {string} */
function introPrimetimeHtml(tx){
  const P = INTRO_PT, R = introZufall, F = introF;
  const s = (/** @type {number} */ t) => `${t}s`;
  const t1 = tx.titel1 || tx.titel2 || 'Show';
  const t2 = tx.titel1 ? tx.titel2 : '';
  const flug1 = introPtFlug(Array.from(t1).length), flug2 = introPtFlug(Array.from(t2).length);

  // Kaltstart: Staub im Spot
  const staub = Array.from({ length: 26 }, () =>
    `<i style="left:${F(R(36, 64))}%;top:${F(R(10, 90))}%;--dx:${F(R(-4, 4))}vw;--dy:${F(R(-12, -3))}vh;animation-duration:${F(R(3, 6))}s;animation-delay:-${F(R(0, 6))}s;opacity:${F(R(.3, .9))}"></i>`).join('');

  // LED-Wand: 20 x 11 Felder, die Welle läuft vom Mittelpunkt nach außen
  let led = '';
  for (let y = 0; y < 11; y++) for (let x = 0; x < 20; x++){
    const d = Math.hypot(x - 9.5, (y - 5) * 1.5);
    led += `<i style="--k:${F(d)};--c:${Math.round(d / 2) % 2 ? '#ff2bd6' : '#29e7ff'}"></i>`;
  }
  const strahler = (/** @type {boolean} */ oben, /** @type {number} */ anzahl) => Array.from({ length: anzahl }, (_, k) => {
    const farben = oben ? ['#ffd76a', '#ff2bd6', '#29e7ff', '#fff3c4'] : ['#ff2bd6', '#29e7ff'];
    const w = R(14, 30);
    return `<i style="left:${F(6 + k * (88 / (anzahl - 1)))}%;--c:${farben[k % farben.length]};--r1:${F(-w)}deg;--r2:${F(w)}deg;animation-duration:${F(R(1.8, 3.2))}s;animation-delay:-${F(R(0, 3))}s"></i>`;
  }).join('');

  // Die Schlagzeile in drei Schlägen; der letzte Teil steht bis zum Makro.
  const teile = introPtSchlaege(tx.titelZeile);
  const schlaege = teile.map((wort, k) => {
    const bis = k === teile.length - 1 ? P.makro[0] : P.schlag[k + 1];
    return `<div class="ifw" style="--a:${s(P.schlag[k])};--b:${s(bis)}">
        <div class="pt-schlag" style="--t:${s(P.schlag[k])};--n:${Math.max(6, Array.from(wort).length)}"><span>${escapeHtml(wort.toUpperCase())}</span></div>
      </div>`;
  }).join('');

  // Makro: Bokeh dahinter, drei Ausschnitte vom Chrom-Logo
  const bokeh = Array.from({ length: 16 }, () => {
    const c = ['255,215,106', '255,43,214', '41,231,255', '255,243,196'][Math.floor(R(0, 4))];
    const g = R(6, 26);
    return `<i style="left:${F(R(0, 100))}%;top:${F(R(0, 100))}%;width:${F(g)}vh;height:${F(g)}vh;background:radial-gradient(circle,rgba(${c},.55),rgba(${c},0) 68%);--dx:${F(R(-8, 8))}vw;animation-duration:${F(R(1.4, 2.4))}s"></i>`;
  }).join('');
  const makro = P.makro.map((t, k) => `<div class="ifw" style="--a:${s(t)};--b:${s(k < 2 ? P.makro[k + 1] : P.teams)}">
      <div class="pt-makro m${k + 1}" style="--t:${s(t)}">${introPtChrom(k === 2 && t2 ? t2 : t1, '')}</div>
      <i class="pt-streifen" style="--t:${s(t)};top:${F(R(30, 70))}%"></i>
    </div>`).join('');

  // Teams
  const teamName = (/** @type {string} */ name) => `<b style="--n:${Math.max(7, Array.from(name).length)}">${escapeHtml(name.toUpperCase())}</b>`;

  // Tunnel: 16 Ringe hintereinander im Raum, 48 Warp-Streifen
  const ringe = Array.from({ length: 16 }, (_, k) =>
    `<i style="--k:${k};--c:${['#ff2bd6', '#29e7ff', '#ffd76a'][k % 3]};--rot:${k * 17}deg;border-radius:${k % 2 ? '50%' : '22%'}"></i>`).join('');
  const warp = Array.from({ length: 48 }, () =>
    `<i style="--r:${F(R(0, 360))}deg;animation-delay:${F(P.tunnel + R(0, .45))}s"></i>`).join('');

  // Logo-Moment: Funken, Pyro, Konfetti, Glitzer
  const funken = Array.from({ length: 90 }, () => {
    const w = R(0, Math.PI * 2), weit = R(.35, 1);
    const c = ['#fff3c4', '#ffd76a', '#ff2bd6', '#29e7ff', '#ffffff'][Math.floor(R(0, 5))];
    return `<i class="pt-fk" style="--x:${F(Math.cos(w) * weit * 62)}vw;--y:${F(Math.sin(w) * weit * 46 - 12)}vh;--g:${F(R(18, 40))}vh;--d:${F(P.hit + R(0, .1))}s;--u:${F(R(1.1, 2.1))}s;--c:${c}"><b></b></i>`;
  }).join('');
  const pyro = [9, 91].map(links => Array.from({ length: 26 }, () => {
    const u = R(.9, 1.4);
    return `<i style="left:${links}%;--x:${F(R(-7, 7))}vw;--y:${F(R(-78, -45))}vh;--u:${F(u)}s;--d:${F(P.hit + .15 + R(0, u))}s"></i>`;
  }).join('')).join('');
  const konfetti = Array.from({ length: 70 }, () => {
    const u = R(3.2, 6);
    const c = ['#ffd76a', '#fff3c4', '#ff2bd6', '#29e7ff', '#ffffff', '#ff8a3d'][Math.floor(R(0, 6))];
    return `<i style="left:${F(R(0, 100))}%;--x:${F(R(-10, 10))}vw;--c:${c};--u:${F(u)}s;--d:${F(P.hit + .3 + R(0, u))}s;--s:${F(R(.7, 1.3))}"></i>`;
  }).join('');
  const glitzer = Array.from({ length: 8 }, (_, k) =>
    `<i style="left:${F(R(18, 82))}%;top:${F(R(28, 62))}%;--d:${F(P.preis + k * .55 + R(0, .4))}s;--s:${F(R(.6, 1.3))}"></i>`).join('');

  const kopf = tx.titelKlein ? `<div class="pt-klein">${escapeHtml(tx.titelKlein)}</div>` : '';
  const logo = `${introPtChrom(t1, 'l1', flug1)}${t2 ? introPtChrom(t2, 'l2', flug2) : ''}`;

  return `<div id="kgp" style="--hit:${s(P.hit)}">
    <div class="pt-cam" style="--h:${s(P.hit)};--l:${s(P.landung)};--vs:${s(P.vs)};--te:${s(P.teams)};--s0:${s(P.schlag[0])};--s1:${s(P.schlag[1])};--s2:${s(P.schlag[2])}">

      <div class="ifw pt-s0" style="--a:0s;--b:${s(P.led)}">
        <div class="pt-schub">
          <div class="pt-spot" style="--t:${s(P.spot)}"></div>
          <div class="pt-pfuetze" style="--t:${s(P.spot)}"></div>
          <div class="pt-staub">${staub}</div>
          ${tx.vorab ? `<div class="pt-vorab" style="--t:${s(P.vorab)}">${escapeHtml(tx.vorab)}</div>` : ''}
        </div>
      </div>

      <div class="ifw pt-s1" style="--a:${s(P.led)};--b:${s(P.makro[0])}">
        <div class="pt-ledrig" style="--t:${s(P.led)}"><div class="pt-led" style="--t:${s(P.led)}">${led}</div></div>
        <div class="pt-heads unten">${strahler(false, 6)}</div>
        ${schlaege}
      </div>

      <div class="ifw pt-s2" style="--a:${s(P.makro[0])};--b:${s(P.teams)}">
        <div class="pt-bokeh">${bokeh}</div>
        ${makro}
      </div>

      <div class="ifw pt-s3" style="--a:${s(P.teams)};--b:${s(P.tunnel + .4)}">
        <div class="pt-team rot" style="--t:${s(P.teams)}"><div class="pt-tinnen">${teamName(tx.team1 || 'Team 1')}</div></div>
        <div class="pt-team blau" style="--t:${s(P.teams + .08)}"><div class="pt-tinnen">${teamName(tx.team2 || 'Team 2')}</div></div>
        <svg class="pt-blitz" style="--t:${s(P.vs)}" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="57,0 54,14 58,22 51,37 55,46 48,61 52,70 45,86 47,93 43,100" fill="none" stroke="#fff" stroke-width="1.2" vector-effect="non-scaling-stroke"/>
        </svg>
        <div class="pt-vs" style="--t:${s(P.vs)}">${introPtChrom('VS', '')}</div>
        <i class="pt-ring" style="--t:${s(P.vs)}"></i>
      </div>

      <div class="ifw pt-s4" style="--a:${s(P.tunnel)};--b:${s(P.hit)}">
        <div class="pt-iris" style="--t:${s(P.tunnel)}">
          <div class="pt-tunnel"><div class="pt-rohr" style="--t:${s(P.tunnel)}">${ringe}</div></div>
          <div class="pt-warp">${warp}</div>
          <div class="pt-kern" style="--t:${s(P.tunnel)}"></div>
        </div>
      </div>

      <div class="ifw fin pt-s5" style="--a:${s(P.hit)}">
        <div class="pt-strahlen"></div>
        <div class="pt-heads oben">${strahler(true, 8)}</div>
        <div class="pt-boden"></div>
        <i class="pt-ring" style="--t:${s(P.hit)}"></i><i class="pt-ring" style="--t:${s(P.hit + .12)}"></i><i class="pt-ring" style="--t:${s(P.landung)}"></i>
        <div class="pt-logo">
          <div class="pt-orbit" style="--t:${s(P.preis)}">
            <div class="pt-landung" style="--t:${s(P.landung)}">
              ${kopf}
              ${logo}
              ${tx.titelZeile ? `<div class="pt-zeile" style="--t:${s(P.zeile)}">${escapeHtml(tx.titelZeile)}</div>` : ''}
              ${tx.preis ? `<div class="pt-preis" style="--t:${s(P.preis)}"><small>Es geht um</small><span>${escapeHtml(tx.preis)}</span></div>` : ''}
              <div class="pt-spiegel" aria-hidden="true">${logo}</div>
            </div>
          </div>
        </div>
        <div class="pt-funken">${funken}</div>
        <div class="pt-pyro">${pyro}</div>
        <div class="pt-konfetti">${konfetti}</div>
        <div class="pt-glitzer">${glitzer}</div>
        <i class="pt-flare" style="--t:${s(P.hit)}"></i>
      </div>
    </div>

    <i class="pt-wisch" style="--t:${s(P.wisch1)}"></i>
    <i class="pt-wisch" style="--t:${s(P.wisch2)}"></i>
    <div class="pt-balken" style="--t:${s(P.hit)}"><i></i><i></i></div>
    <div class="pt-licht" style="--m0:${s(P.makro[0])};--m1:${s(P.makro[1])};--m2:${s(P.makro[2])};--te:${s(P.teams)}"></div>
    <div class="vig"></div>
    <div class="grain"></div>
    <div class="ifw fin" style="--a:${s(P.hinweis)}"><div class="kg-hint">Klicken um fortzufahren</div></div>
  </div>`;
}

/** @param {number} t0 @param {IntroTon} A */
function introPrimetimeTon(t0, A){
  const P = INTRO_PT, n = introNote;
  // Kaltstart: Einschlag, tiefe Fläche, Anlauf zum ersten Schnitt
  A.aufprall(t0 + P.spot, .7);
  A.flaeche(t0 + P.spot, [n(33), n(40), n(45)], P.hit - P.spot, .045, 380, 1.2);
  A.anstieg(t0 + P.vorab, P.wisch1 + .2 - P.vorab, .32);
  A.wisch(t0 + P.wisch1, .32, .4, 600, 7000);
  // Groove ab dem ersten Schlag bis zum Tunnel: Kick auf jedem Takt,
  // Hi-Hat dazwischen, Snare auf 2 und 4, Bass a-a-f-g
  const bass = [45, 45, 41, 43];
  for (let k = 0; k < 9; k++){
    const t = t0 + P.eins + k * P.takt;
    A.kick(t, .9);
    A.hat(t + P.takt / 2, .12);
    if (k % 2) A.snare(t, .4);
    A.bass(t, n(bass[Math.floor(k / 2) % 4] - 12), P.takt * .9, .22);
  }
  // Die drei Schläge der Schlagzeile: Bläser a-moll, F-Dur, G-Dur
  [[57, 60, 64], [53, 57, 60], [55, 59, 62]].forEach((ak, i) =>
    A.stoss(t0 + P.schlag[i], ak.map(n), .1, .5));
  // Makro: Luftzug vor jedem Schnitt, eine Glocke drauf
  P.makro.forEach((t, i) => { A.wisch(t0 + t - .1, .22, .28, 2000, 9000); A.ping(t0 + t, n(84 + i * 3), .06, 1); });
  A.wisch(t0 + P.wisch2, .3, .35, 500, 6000);
  // Teams: Einschlag, VS mit Becken
  A.aufprall(t0 + P.teams, .55); A.stoss(t0 + P.teams, [n(45), n(52), n(57)], .11, .7);
  A.aufprall(t0 + P.vs, 1); A.becken(t0 + P.vs, .3); A.stoss(t0 + P.vs, [n(46), n(53), n(58)], .13, .9);
  // Tunnel: Wirbel und Anlauf bis zum Treffer
  A.wirbel(t0 + P.tunnel, P.hit - P.tunnel, .38);
  A.anstieg(t0 + P.tunnel, P.hit - P.tunnel, .5);
  // Treffer: Einschlag, Becken, großer C-Dur-Akkord, danach die Fläche
  A.aufprall(t0 + P.hit, 1.2); A.becken(t0 + P.hit, .45);
  A.stoss(t0 + P.hit, [n(48), n(55), n(60), n(64), n(67)], .15, 2.2);
  A.flaeche(t0 + P.hit + .05, [n(48), n(55), n(60), n(64)], 9, .05, 1400, .6);
  [72, 76, 79, 84, 88, 91, 96].forEach((m, i) => A.ping(t0 + P.hit + .15 + i * .09, n(m), .05, 1.2));
  // Die Buchstaben landen
  A.kick(t0 + P.landung, 1); A.aufprall(t0 + P.landung, .45);
  // Der Preis dreht sich herein
  if (introTexte.preis){ A.ping(t0 + P.preis, n(88), .08, 1.5); A.ping(t0 + P.preis + .1, n(95), .06, 1.5); }
}

/* Die beiden Film-Intros. html baut das Bild aus den Texten, ton plant den
   Ton ein. Der Schlüssel ist der Wert in der Intro-Auswahl (#intro-variant). */
const INTRO_FILME = {
  arcade:    { name:'Arcade',    html: introArcadeHtml,    ton: introArcadeTon },
  primetime: { name:'Primetime', html: introPrimetimeHtml, ton: introPrimetimeTon },
};

/** Spielt ein Film-Intro. Der Rahmen (Klick zum Beenden, Ausblenden,
 *  GM-Fernsteuerung über #kg-overlay) ist derselbe wie bei den Bühnen.
 *  @param {string} key
 *  @param {() => void} [onDone] */
function playFilmIntro(key, onDone){
  const film = INTRO_FILME[key];
  if (!film){ if (onDone) onDone(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'kg-overlay';
  overlay.className = 'film';
  overlay.innerHTML = film.html(introTexte);
  runKgIntro(overlay, onDone);
  if (SFX.enabled){
    const t0 = INTRO_TON.neu();
    if (t0 >= 0) film.ton(t0, INTRO_TON);
  }
  // runKgIntro hat seinen Klick-Haken zuerst angemeldet: steht hier schon
  // .leaving, wird das Intro gerade beendet - dann den Ton mitnehmen.
  overlay.addEventListener('click', () => { if (overlay.classList.contains('leaving')) INTRO_TON.ausblenden(); });
}

/* ── Editor ─────────────────────────────────────────────────────────────── */

/* Der Intro-Editor ist von jedem Setup-Screen aus erreichbar - der
   Bedienblock #intro-pick wandert ja mit. "Zurueck" zeigte trotzdem fest auf
   den Family-Feud-Screen: wer das Intro aus Jeopardy heraus bearbeitete, kam
   danach bei Family Feud heraus und haette im schlimmsten Fall die falsche
   Show gestartet. Deshalb wird gemerkt, woher der Aufruf kam. */
let introEditFrom = 'menu-screen';
function openIntroEditor(){
  const aktiv = document.querySelector('.screen.active');
  if (aktiv && aktiv.id && aktiv.id !== 'intro-edit-screen') introEditFrom = aktiv.id;
  showScreen('intro-edit-screen');
}
function closeIntroEditor(){
  showScreen(document.getElementById(introEditFrom) ? introEditFrom : 'menu-screen');
}

function renderIntroEditor(){
  // Ein Editor-Screen für beide Fälle: Stufen beim eigenen Intro, Texte bei
  // Arcade und Primetime. "+ Stufe" ergibt bei den Film-Intros keinen Sinn.
  const film = introFilmKey();
  setHtml('intro-edit-title', film ? '<em>Texte</em> für Arcade und Primetime' : '<em>Eigenes Intro</em> bearbeiten');
  showEl('intro-add-btn', !film);
  if (film) return renderIntroTexteEditor();
  const slides = introData.slides || (introData.slides = []);
  const rows = slides.map((s, i) => `
    <div class="editor-card intro-card">
      <div class="panel-head">
        <span>Stufe ${i + 1}</span>
        <span class="panel-row" style="gap:5px;">
          <button class="btn btn-secondary btn-sm" title="nach oben" ${i === 0 ? 'disabled' : ''}
                  onclick="introMoveSlide(${i},-1)">↑</button>
          <button class="btn btn-secondary btn-sm" title="nach unten" ${i === slides.length - 1 ? 'disabled' : ''}
                  onclick="introMoveSlide(${i},1)">↓</button>
          <button class="btn btn-danger btn-sm" title="Stufe löschen"
                  onclick="introDelSlide(${i})">✕</button>
        </span>
      </div>
      <div class="intro-fields">
        <label>Kleine Zeile darüber
          <input type="text" value="${escAttr(s.lbl)}" placeholder="z.B. Heute Abend"
                 oninput="introSetField(${i},'lbl',this)"></label>
        <label>Große Zeile
          <input type="text" value="${escAttr(s.big)}" placeholder="z.B. GAMESHOW"
                 oninput="introSetField(${i},'big',this)"></label>
        <label>Große Zeile in Akzentfarbe
          <input type="text" value="${escAttr(s.pink)}" placeholder="z.B. NUMMER 1"
                 oninput="introSetField(${i},'pink',this)"></label>
        <label>Kleine Zeile darunter
          <input type="text" value="${escAttr(s.sub)}" placeholder="z.B. 25. September"
                 oninput="introSetField(${i},'sub',this)"></label>
        <label>Extra über dem Text
          <select onchange="introSetDeco(${i},this)">
            ${INTRO_DECOS.map(x => `<option value="${x.key}" ${s.deco === x.key ? 'selected' : ''}>${escapeHtml(x.name)}</option>`).join('')}
          </select></label>
      </div>
    </div>`).join('') || `<div class="pr-empty">Noch keine Stufe — „+ Stufe" legt die erste an.</div>`;

  setHtml('intro-editor-grid', `
    <div class="editor-card intro-card">
      <div class="panel-head"><span>Kopfzeile &amp; Takt</span></div>
      <div class="intro-fields">
        <label>Kopfzeile über der Bühne
          <input type="text" value="${escAttr(introData.header)}" placeholder="z.B. Die Große Keller Gameshow"
                 oninput="introSetHeader(this)"></label>
        <label>Sekunden je Stufe (${INTRO_MIN_SECONDS}–${INTRO_MAX_SECONDS})
          <input type="number" min="${INTRO_MIN_SECONDS}" max="${INTRO_MAX_SECONDS}" step="0.2"
                 value="${introSeconds()}" onchange="introSetSeconds(this)"></label>
        <label>Bühne
          <select onchange="introSetStage(this)">
            ${INTRO_STAGES.map(st => `<option value="${st.key}" ${introStage() === st.key ? 'selected' : ''}>${escapeHtml(st.name)}</option>`).join('')}
          </select></label>
        <label>Vorlage laden (ersetzt alle Stufen)
          <select onchange="introApplyPreset(this)">
            <option value="">Vorlage wählen …</option>
            ${Object.keys(INTRO_PRESETS).map(k => `<option value="${k}">${escapeHtml(INTRO_PRESETS[k].name)}</option>`).join('')}
          </select></label>
      </div>
      <div class="hint-line">${escapeHtml(introStageHint())} · Gesamtlänge: rund ${introTotalSeconds()} Sekunden.</div>
    </div>
    ${rows}`);
}

/* Die Texte der Film-Intros: ein Feld je Eintrag, dazu der Weg zurück zum
   Standard. Gilt für beide - wer Arcade und Primetime an zwei Abenden
   zeigt, tippt den Titel nur einmal. */
function renderIntroTexteEditor(){
  setHtml('intro-editor-grid', `
    <div class="editor-card intro-card">
      <div class="panel-head"><span>Texte</span>
        <button class="btn btn-secondary btn-sm" onclick="introTexteReset()">Standardtexte</button></div>
      <div class="intro-fields">
        ${INTRO_TEXT_FELDER.map(f => `<label>${escapeHtml(f.name)}
          <input type="text" maxlength="80" value="${escAttr(introTexte[f.key])}" placeholder="${escAttr(f.ph)}"
                 oninput="introSetText('${f.key}',this)"></label>`).join('')}
      </div>
      <div class="hint-line">Gilt für Arcade und Primetime. Primetime zeigt die Schlagzeile in bis zu drei Schlägen – Teile mit · trennen. Kurze Titel wirken am stärksten; lange werden kleiner gesetzt.</div>
    </div>`);
}
/* Beim Tippen nicht neu zeichnen, sonst springt der Cursor (wie introSetField). */
function introSetText(key, input){
  if (!INTRO_TEXT_FELDER.some(f => f.key === key)) return;
  introTexte[key] = String(input.value).slice(0, 80);
  introTexteSave();
}
function introTexteReset(){
  if (!confirm('Alle Texte auf den Standard zurücksetzen?')) return;
  introTexte = { ...INTRO_TEXTE_STANDARD };
  introTexteSave();
  renderIntroEditor();
}

/** Ungefähre Gesamtlänge, damit der Host nicht rechnen muss.
 *  @returns {number} */
function introTotalSeconds(){
  const n = (introData.slides || []).filter(introSlideHasContent).length;
  return n ? Math.round(0.3 + (n - 1) * introSeconds() + 2) : 0;
}

/** Der Satz unter der Auswahl - sagt, wie die gewaehlte Buehne aussieht.
 *  @returns {string} */
function introStageHint(){
  const st = INTRO_STAGES.find(x => x.key === introStage());
  return st ? st.hint : '';
}
function introSetHeader(input){ introData.header = input.value; introSave(); }
function introSetStage(sel){
  introData.stage = sel.value;
  introSave();
  renderIntroEditor();
}
function introSetSeconds(input){
  introData.seconds = Number(input.value);
  introSave();
  renderIntroEditor();
}
/* Beim Tippen NICHT neu zeichnen - sonst springt der Cursor ans Ende. Nur die
   Gesamtlänge braucht ein Update, und die steht in einer eigenen Zeile. */
function introSetField(i, key, input){
  if (!introData.slides[i]) return;
  introData.slides[i][key] = input.value;
  introSave();
}
/* Ein Extra ändert die Gesamtlänge nicht und hat kein Textfeld, in dem der
   Cursor springen könnte - trotzdem nicht neu zeichnen, es gibt nichts dazu. */
function introSetDeco(i, sel){
  if (!introData.slides[i]) return;
  introData.slides[i].deco = INTRO_DECOS.some(x => x.key === sel.value) ? sel.value : '';
  introSave();
}
/* Eine Vorlage ersetzt den ganzen Stand. Nachfragen nur, wenn es etwas zu
   verlieren gibt. introClean bringt die Vorlage in dieselbe Form wie eine
   Importdatei - eine Quelle für die Form, nicht zwei. */
function introApplyPreset(sel){
  const p = INTRO_PRESETS[sel.value];
  if (!p) return;
  const hatText = (introData.slides || []).some(introSlideHasContent);
  if (hatText && !confirm('Alle Stufen durch die Vorlage „' + p.name + '“ ersetzen?')){
    sel.value = '';
    return;
  }
  introData = introClean(p.daten());
  introSave();
  renderIntroEditor();
}
function introAddSlide(){
  if ((introData.slides || []).length >= INTRO_MAX_SLIDES){
    alert('Mehr als ' + INTRO_MAX_SLIDES + ' Stufen werden zu lang — das Publikum wartet.');
    return;
  }
  introData.slides.push(introStufe('', '', '', ''));
  introSave();
  renderIntroEditor();
}
function introDelSlide(i){
  const s = introData.slides[i];
  if (!s) return;
  const hatText = !!(s.lbl || s.big || s.pink || s.sub);
  if (hatText && !confirm('Stufe ' + (i + 1) + ' löschen?')) return;
  introData.slides.splice(i, 1);
  introSave();
  renderIntroEditor();
}
function introMoveSlide(i, dir){
  const j = i + dir;
  const s = introData.slides;
  if (!s[i] || !s[j]) return;
  [s[i], s[j]] = [s[j], s[i]];
  introSave();
  renderIntroEditor();
}

/* Exportiert, was der Editor gerade zeigt: Stufen oder Texte. */
function exportIntro(){
  if (introFilmKey()) downloadJSON(introTexte, 'intro-texte.json');
  else downloadJSON(introData, 'intro.json');
}
/* Wie importTp: ueber readJsonFile, damit BOM, Fehlermeldung und die
   Erfolgsmeldung (fuer das Spieldaten-Depot im Turnier) dieselben sind.
   Nimmt beide Sorten Datei an - erkannt an der Form, nicht am Namen. */
function importIntro(e){
  readJsonFile(e, d => {
    if (d && Array.isArray(d.slides)){
      introData = introClean(d);
      introSave();
    } else if (d && typeof d === 'object' && INTRO_TEXT_FELDER.some(f => typeof d[f.key] === 'string')){
      introTexte = introTexteClean(d);
      introTexteSave();
    } else {
      throw new Error('Die Datei enthält weder Stufen noch Intro-Texte');
    }
    renderIntroEditor();
  });
}


/* ── Auswahl auf allen Setup-Screens ────────────────────────────────────────
   Der Bedienblock steht genau einmal im Dokument (#intro-pick) und wird beim
   Screenwechsel in den Platzhalter des offenen Setup-Screens verschoben.

   Warum nicht acht Kopien: dann gaebe es acht Mal dieselben IDs. Ein
   getElementById traefe immer nur die erste, und was der Host auf dem einen
   Screen einstellt, stuende auf dem naechsten nicht drin. Ein verschobener
   Block hat dagegen von sich aus ueberall denselben Stand. */
const INTRO_SLOTS = {
  'setup-screen':          'feud-intro-slot',
  'jeopardy-setup-screen': 'jeopardy-intro-slot',
  'wwm-setup-screen':      'wwm-intro-slot',
  'wwds-setup-screen':     'wwds-intro-slot',
  'ddf-setup-screen':      'ddf-intro-slot',
  'pih-setup-screen':      'pih-intro-slot',
  'tp-setup-screen':       'tp-intro-slot',
  'tournament-screen':     'tournament-intro-slot',
};

/** Schiebt den Bedienblock in den Screen, der gerade geoeffnet wird.
 *  @param {string} screenId */
function moveIntroPickerTo(screenId){
  const slotId = INTRO_SLOTS[screenId];
  if (!slotId) return;
  const slot = document.getElementById(slotId);
  const pick = document.getElementById('intro-pick');
  if (!slot || !pick) return;
  if (pick.parentElement !== slot) slot.appendChild(pick);  // appendChild verschiebt
  toggleIntroPicker();
}

/* Auswahl nur zeigen, wenn ein Intro laeuft; Namensfeld nur beim Geburtstag,
   Bearbeiten-Knopf nur beim eigenen Intro - bei den festen gibt es nichts zu
   bearbeiten. Stand frueher in feud.js, gilt jetzt fuer alle acht Shows. */
function toggleIntroPicker(){
  const on = fieldChecked('enable-gameshow-intro');
  showEl('intro-picker', on);
  const variant = fieldVal('intro-variant');
  showEl('bday-name', on && variant === 'bday');
  showEl('bday-name-label', on && variant === 'bday');
  showEl('intro-edit-btn', on && (variant === 'custom' || !!INTRO_FILME[variant]));
  introSaveChoice();
}

/* Die Auswahl ueberlebt das Neuladen. Ohne das muesste der Host sie vor jeder
   Show neu setzen - und bei einem Neuladen mitten im Abend waere sie weg. */
function introSaveChoice(){
  storeSetJson('introChoice', {
    on: fieldChecked('enable-gameshow-intro'),
    variant: fieldVal('intro-variant') || 'keller',
  });
}
function introLoadChoice(){
  const c = storeGetJson('introChoice', null);
  if (!c) return;
  const box = fieldEl('enable-gameshow-intro');
  if (box) box.checked = !!c.on;
  fieldSet('intro-variant', c.variant || 'keller');
}

/** Spielt das eingestellte Intro und ruft danach onDone. Ist keins gewaehlt,
 *  geht es ohne Umweg weiter - jede Show ruft das an der Stelle auf, an der
 *  sie sonst direkt ihren Bildschirm gezeigt haette.
 *  @param {() => void} onDone */
function runIntroThen(onDone){
  if (!fieldChecked('enable-gameshow-intro')) return onDone();
  const variant = fieldVal('intro-variant');
  if (variant === 'bday')        showBirthdayIntro(onDone);
  else if (variant === 'custom') showCustomIntro(onDone);
  else if (variant === 'tag2')   showGameshowIntroTag2(onDone);
  else if (INTRO_FILME[variant]) playFilmIntro(variant, onDone);
  else                           showGameshowIntro(onDone);
}

introLoad();
introTexteLoad();
introLoadChoice();
