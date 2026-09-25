// @ts-check
/* ═══ EIGENES INTRO ═════════════════════════════════════════════════════════
   Die beiden festen Intros ("Die Große Keller Gameshow" und der Geburtstag)
   stehen als Markup im Code: wer einen anderen Namen, ein anderes Datum oder
   einen anderen Preis einblenden wollte, musste die Datei anfassen. Dieses
   Intro hat dieselbe Bühne, aber jede Zeile kommt aus einem Eingabefeld.

   Die Bühne benutzt bewusst dieselbe id wie das Keller-Intro. An `#kg` hängen
   sämtliche Bühnenstile - Wand, Boden, Scheinwerfer, Lampe, Rahmen, Funken -
   und die noch einmal unter einem zweiten Namen zu führen hiesse, sie ab jetzt
   doppelt zu pflegen. Es läuft immer nur ein Intro gleichzeitig, die id ist
   also nie zweimal im Dokument.

   Die Taktung steht dagegen NICHT im Stylesheet: dort ist sie fest auf sieben
   Stufen verdrahtet (.s1 bis .s7 mit ausgerechneten Verzögerungen). Hier darf
   der Host Stufen hinzufügen und löschen, also rechnet JavaScript die
   Verzögerung je Stufe aus und schreibt sie ins style-Attribut.
   ════════════════════════════════════════════════════════════════════════ */

/** Eine Stufe des Intros. Alle vier Zeilen sind freiwillig - leere werden
 *  weggelassen, damit eine Stufe auch nur aus einem Wort bestehen kann.
 *  @typedef {{ lbl: string, big: string, pink: string, sub: string }} IntroSlide */

const INTRO_MAX_SLIDES = 12;
const INTRO_MIN_SECONDS = 2;
const INTRO_MAX_SECONDS = 12;

/* Zwei Buehnen fuer dasselbe Intro. Der Text, die Taktung und alles andere
   bleiben gleich - nur das Aussehen wechselt, damit zwei Abende hintereinander
   nicht identisch anfangen. 'buehne' ist die Kellerbuehne (#kg), 'neon' die
   Neon-Nacht (#kgn). Der Schluessel wird gespeichert, deshalb hier feste
   Namen und kein Index: eine spaetere dritte Buehne darf die Reihenfolge
   aendern, ohne alte Einstellungen umzudeuten. */
const INTRO_STAGES = [
  { key:'buehne', name:'Kellerbühne (Gold)', hint:'Holzwand, Scheinwerfer, Lämpchenrahmen' },
  { key:'neon',   name:'Neon-Nacht (Retro)', hint:'Sonnenuntergang, Gitterboden, Leuchtschrift' },
];
/** @returns {string} */
function introStage(){
  return INTRO_STAGES.some(st => st.key === introData.stage) ? introData.stage : 'buehne';
}

/* Die Voreinstellung ist bewusst die Keller-Show: so sieht der Host beim
   ersten Öffnen ein fertiges Beispiel statt leerer Felder und kann einzelne
   Zeilen austauschen, statt alles selbst zu erfinden. */
let introData = {
  header: 'Die Große Keller Gameshow',
  seconds: 4.6,
  stage: 'buehne',
  /** @type {IntroSlide[]} */
  slides: [
    { lbl:'',                        big:'HERZLICH',     pink:'WILLKOMMEN!',  sub:'' },
    { lbl:'Heute Abend',             big:'DIE GROSSE',   pink:'GAMESHOW',     sub:'' },
    { lbl:'Es spielen',              big:'ZWEI TEAMS',   pink:'',             sub:'Gleiche Teams, beide Tage' },
    { lbl:'Zu gewinnen gibt es',     big:'30 €',         pink:'',             sub:'aufs Gewinner-Team aufgeteilt' },
    { lbl:'',                        big:'LOS',          pink:'GEHT’S!',      sub:'' },
  ],
};

function introSave(){ storeSetJson('introData', introData); }
function introLoad(){ introData = storeGetJson('introData', introData); }

/** Sekunden je Stufe, in sinnvollen Grenzen.
 *  @returns {number} */
function introSeconds(){
  const n = Number(introData.seconds);
  if (!isFinite(n)) return 4.6;
  return Math.min(INTRO_MAX_SECONDS, Math.max(INTRO_MIN_SECONDS, n));
}

/* ── Abspielen ──────────────────────────────────────────────────────────── */

/** Baut die Bühne und spielt sie ab.
 *  @param {() => void} [onDone] */
function showCustomIntro(onDone){
  const dur = introSeconds();
  const slides = (introData.slides || []).filter(s => s && (s.lbl || s.big || s.pink || s.sub));
  if (!slides.length){
    // Nichts eingetragen: still überspringen statt eine leere Bühne zeigen.
    if (onDone) onDone();
    return;
  }
  const html = slides.map((s, i) => {
    const letzte = i === slides.length - 1;
    // Die letzte Stufe blendet nicht wieder aus - sie bleibt stehen, bis der
    // Host klickt. Sonst steht die Bühne am Ende leer da.
    const delay = 0.3 + i * dur;
    const style = `animation-delay:${delay.toFixed(2)}s;animation-duration:${letzte ? 2 : dur}s;`;
    return `<div class="screen cs${letzte ? ' hold' : ''}" style="${style}">
      ${s.lbl  ? `<p class="lbl">${escapeHtml(s.lbl)}</p>` : ''}
      ${s.big  ? `<p class="big">${escapeHtml(s.big)}</p>` : ''}
      ${s.pink ? `<p class="big pink">${escapeHtml(s.pink)}</p>` : ''}
      ${s.sub  ? `<p class="sub">${escapeHtml(s.sub)}</p>` : ''}
    </div>`;
  }).join('');

  const kopf = escapeHtml(introData.header || '');
  // Die Neon-Buehne hat bewusst KEIN .frame: der Lämpchenrahmen wird in
  // runKgIntro pixelweise aus der Buehnengroesse gebaut und gehoert zur
  // Kellerbuehne. Fehlt das Element, ueberspringt runKgIntro den Bau.
  const buehne = introStage() === 'neon'
    ? `<div id="kgn">
        <div class="sky"></div>
        <div class="stars"></div>
        <div class="sun"></div>
        <div class="horizon"></div>
        <div class="grid"></div>
        <div class="scan"></div>
        <div class="header">${kopf}</div>
        ${html}
        <div class="kg-hint">Klicken um fortzufahren</div>
      </div>`
    : `<div id="kg">
        <div class="wall"></div>
        <div class="floor"></div>
        <div class="cone coneL"></div>
        <div class="cone coneR"></div>
        <div class="cord"><div class="bulb"></div></div>
        <div class="frame" id="kgframe"></div>
        <div class="header"><span class="star">★</span>${kopf}<span class="star">★</span></div>
        ${html}
        <div class="kg-hint">Klicken um fortzufahren</div>
      </div>`;
  const overlay = document.createElement('div');
  overlay.id = 'kg-overlay';
  overlay.innerHTML = buehne;
  runKgIntro(overlay, onDone);
}

/* Vorschau aus dem Editor heraus - ohne Spielstart, ohne Firebase. */
function previewCustomIntro(){
  showCustomIntro();
}

/* ── Editor ─────────────────────────────────────────────────────────────── */

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
        <label>Große Zeile (gold)
          <input type="text" value="${escAttr(s.big)}" placeholder="z.B. GAMESHOW"
                 oninput="introSetField(${i},'big',this)"></label>
        <label>Große Zeile (pink)
          <input type="text" value="${escAttr(s.pink)}" placeholder="z.B. NUMMER 1"
                 oninput="introSetField(${i},'pink',this)"></label>
        <label>Kleine Zeile darunter
          <input type="text" value="${escAttr(s.sub)}" placeholder="z.B. 25. September"
                 oninput="introSetField(${i},'sub',this)"></label>
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
      </div>
      <div class="hint-line">${escapeHtml(introStageHint())} · Gesamtlänge: rund ${introTotalSeconds()} Sekunden.</div>
    </div>
    ${rows}`);
}

/** Ungefähre Gesamtlänge, damit der Host nicht rechnen muss.
 *  @returns {number} */
function introTotalSeconds(){
  const n = (introData.slides || []).filter(s => s && (s.lbl || s.big || s.pink || s.sub)).length;
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
function introAddSlide(){
  if ((introData.slides || []).length >= INTRO_MAX_SLIDES){
    alert('Mehr als ' + INTRO_MAX_SLIDES + ' Stufen werden zu lang — das Publikum wartet.');
    return;
  }
  introData.slides.push({ lbl:'', big:'', pink:'', sub:'' });
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
function importIntro(e){
  const f = e.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(String(r.result));
      if (!d || !Array.isArray(d.slides)) { alert('Die Datei enthält keine Stufen.'); return; }
      introData = {
        header: String(d.header || ''),
        seconds: Number(d.seconds) || 4.6,
        stage: INTRO_STAGES.some(st => st.key === d.stage) ? String(d.stage) : 'buehne',
        slides: d.slides.slice(0, INTRO_MAX_SLIDES).map(s => ({
          lbl: String((s && s.lbl) || ''), big: String((s && s.big) || ''),
          pink: String((s && s.pink) || ''), sub: String((s && s.sub) || ''),
        })),
      };
      introSave();
      renderIntroEditor();
    } catch { alert('Datei konnte nicht gelesen werden.'); }
  };
  r.readAsText(f);
  e.target.value = '';
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
