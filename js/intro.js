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
 *  @returns {string} */
function introSlideHtml(s, start, laenge, letzte){
  const zaehler = { n: 0 };
  const zeichen = Array.from((s.big + s.pink).replace(/\s+/g, '')).length;
  // Lange Zeilen leuchten schneller durch, damit die letzte Birne nicht erst
  // angeht, wenn die Stufe schon wieder ausblendet: höchstens 1,1 s für alle.
  const abstand = Math.min(0.055, 1.1 / Math.max(1, zeichen));
  const klein = (/** @type {string} */ t) => Array.from(t).length > 11 ? ' sm' : '';
  const style = `--d:${start.toFixed(2)}s;--dur:${laenge.toFixed(2)}s;--st:${abstand.toFixed(3)}s;`;
  return `<div class="screen cs${letzte ? ' hold' : ''}" style="${style}">
      ${introDecoHtml(s.deco)}
      ${s.lbl  ? `<p class="lbl">${escapeHtml(s.lbl)}</p>` : ''}
      ${s.big  ? `<p class="big${s.deco === 'geld' ? ' euro' : klein(s.big)}">${introLetters(s.big, zaehler)}</p>` : ''}
      ${s.pink ? `<p class="big pink${klein(s.pink)}">${introLetters(s.pink, zaehler)}</p>` : ''}
      ${s.sub  ? `<p class="sub">${escapeHtml(s.sub)}</p>` : ''}
    </div>`;
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
  // Die letzte Stufe blendet nicht wieder aus - sie bleibt stehen, bis der
  // Host klickt. Sonst steht die Bühne am Ende leer da.
  const html = slides.map((s, i) => {
    const letzte = i === slides.length - 1;
    return introSlideHtml(s, 0.3 + i * dur, letzte ? 2 : dur, letzte);
  }).join('');

  const stage = INTRO_STAGES.find(st => st.key === introStageKey(daten.stage)) || INTRO_STAGES[0];
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
        ${kopf ? `<div class="header">${kopf}</div>` : ''}
        ${html}
        <div class="kg-hint">Klicken um fortzufahren</div>
      </div>`
    : `<div id="${stage.id}">
        <div class="wall"></div>
        <div class="floor"></div>
        <div class="cone coneL"></div>
        <div class="cone coneR"></div>
        <div class="cord"><div class="bulb"></div></div>
        <div class="frame"></div>
        ${kopf ? `<div class="header"><span class="star">★</span>${kopf}<span class="star">★</span></div>` : ''}
        ${html}
        <div class="kg-hint">Klicken um fortzufahren</div>
      </div>`;
  const overlay = document.createElement('div');
  overlay.id = 'kg-overlay';
  overlay.innerHTML = buehne;
  if (stage.key === 'geburtstag') introBalloons(/** @type {HTMLElement} */ (overlay.firstElementChild));
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

/* Vorschau aus dem Editor heraus - ohne Spielstart, ohne Firebase. */
function previewCustomIntro(){
  showCustomIntro();
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

function exportIntro(){ downloadJSON(introData, 'intro.json'); }
/* Wie importTp: ueber readJsonFile, damit BOM, Fehlermeldung und die
   Erfolgsmeldung (fuer das Spieldaten-Depot im Turnier) dieselben sind. */
function importIntro(e){
  readJsonFile(e, d => {
    if (!d || !Array.isArray(d.slides)) throw new Error('Die Datei enthält keine Stufen');
    introData = introClean(d);
    introSave();
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
  showEl('intro-edit-btn', on && variant === 'custom');
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
  else                           showGameshowIntro(onDone);
}

introLoad();
introLoadChoice();
