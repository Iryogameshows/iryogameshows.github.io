// @ts-check
/* ══ Keller-Toene ═════════════════════════════════════════════════════════
   Die Tonebene zur Design-Richtung T ("The Binding of Isaac").

   Warum synthetisiert und nicht die Dateien aus dem Spiel: Davids
   Entscheidung vom 2026-10-18. Die Toene des Spiels liegen in sfx.a, und
   dieses Archiv ist verschluesselt - der mitgelieferte ResourceExtractor
   stammt aus Afterbirth+-Zeiten und kommt an die Repentance-Daten nicht
   heran. Statt das zu umgehen, werden die Klaenge hier mit WebAudio
   nachgebaut: keine Dateien, kein Nachladen, laeuft ohne Netz - und das
   muss es, weil die Show vor Publikum laeuft (siehe CLAUDE.md, vendor/).

   Angehaengt wird an das, was man SIEHT, nicht an die Spiellogik: ein
   MutationObserver merkt, wenn ein Herz verloren geht oder eine Punktzahl
   steigt. Dadurch braucht keine der zehn Spieldateien eine Zeile Aenderung,
   und eine neue Show bekommt den Ton geschenkt.

   Laeuft NUR in Richtung T. In jeder anderen Richtung passiert nichts.
   Der Mainscreen ist bewusst aussen vor: er fuehrt keinen App-Code aus
   (BAUPLAN 4.8), der Ton kommt aus dem Hostrechner. */

var KellerTon = (function () {
  'use strict';

  /** @type {AudioContext|null} */
  let ac = null;
  let an = true;
  /** Letzter Zeitpunkt je Klangart - gegen Salven bei innerHTML-Neuaufbau.
   *  @type {Object<string, number>} */
  const zuletzt = {};

  /** Der Browser erlaubt Ton erst nach einer Geste. Deshalb wird der
   *  Kontext beim ersten Klick/Tastendruck erzeugt, nicht beim Laden.
   *  @returns {AudioContext|null} */
  function kontext() {
    if (!an) return null;
    if (ac) { if (ac.state === 'suspended') ac.resume(); return ac; }
    try {
      const K = window.AudioContext || /** @type {*} */ (window).webkitAudioContext;
      if (!K) return null;
      ac = new K();
      return ac;
    } catch (e) { return null; }
  }

  /** @param {string} art @param {number} abstandMs @returns {boolean} */
  function zuFrueh(art, abstandMs) {
    const jetzt = Date.now();
    if (zuletzt[art] && jetzt - zuletzt[art] < abstandMs) return true;
    zuletzt[art] = jetzt;
    return false;
  }

  /** Ein Ton mit Huellkurve.
   *  @param {AudioContext} c
   *  @param {OscillatorType} form
   *  @param {number} vonHz @param {number} nachHz
   *  @param {number} start @param {number} dauer @param {number} laut */
  function ton(c, form, vonHz, nachHz, start, dauer, laut) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = form;
    o.frequency.setValueAtTime(vonHz, start);
    if (nachHz !== vonHz) o.frequency.exponentialRampToValueAtTime(Math.max(nachHz, 1), start + dauer);
    /* Kurzes Anschwellen gegen das Knacken, das ein harter Einsatz macht. */
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(laut, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
    o.connect(g); g.connect(c.destination);
    o.start(start); o.stop(start + dauer + 0.02);
  }

  /** Rauschen durch einen Tiefpass - die Grundlage von Schlag, Tuer
   *  und Explosion.
   *  @param {AudioContext} c
   *  @param {number} start @param {number} dauer
   *  @param {number} vonHz @param {number} nachHz @param {number} laut */
  function rauschen(c, start, dauer, vonHz, nachHz, laut) {
    const n = Math.floor(c.sampleRate * dauer);
    const puffer = c.createBuffer(1, Math.max(n, 1), c.sampleRate);
    const d = puffer.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const q = c.createBufferSource();
    q.buffer = puffer;
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(vonHz, start);
    f.frequency.exponentialRampToValueAtTime(Math.max(nachHz, 1), start + dauer);
    const g = c.createGain();
    g.gain.setValueAtTime(laut, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dauer);
    q.connect(f); f.connect(g); g.connect(c.destination);
    q.start(start); q.stop(start + dauer);
  }

  /** Muenze: kurzes, helles Kling in zwei Stufen - so klingt im Spiel
   *  jedes aufgesammelte Geldstueck. */
  function muenze() {
    const c = kontext(); if (!c || zuFrueh('muenze', 60)) return;
    const t = c.currentTime;
    ton(c, 'square', 1480, 1480, t, 0.05, 0.12);
    ton(c, 'square', 2220, 2220, t + 0.045, 0.1, 0.1);
  }

  /** Schaden: der Schlag, wenn ein Herz weg ist. Tiefer Abfall plus
   *  kurzer Rauschstoss - das ist das Muster fast aller Trefferklaenge. */
  function schaden() {
    const c = kontext(); if (!c || zuFrueh('schaden', 120)) return;
    const t = c.currentTime;
    ton(c, 'sawtooth', 260, 70, t, 0.26, 0.22);
    rauschen(c, t, 0.16, 2400, 300, 0.16);
  }

  /** Item/richtige Antwort: aufsteigender Dreiklang, wie wenn im Spiel
   *  etwas Gutes vom Podest genommen wird. */
  function item() {
    const c = kontext(); if (!c || zuFrueh('item', 200)) return;
    const t = c.currentTime;
    ton(c, 'triangle', 523, 523, t, 0.12, 0.16);        // c''
    ton(c, 'triangle', 659, 659, t + 0.09, 0.12, 0.16); // e''
    ton(c, 'triangle', 784, 784, t + 0.18, 0.22, 0.18); // g''
  }

  /** Tuer: das Rumpeln beim Wechsel in den naechsten Raum - hier der
   *  Wechsel von Runde oder Bildschirm. */
  function tuer() {
    const c = kontext(); if (!c || zuFrueh('tuer', 400)) return;
    const t = c.currentTime;
    rauschen(c, t, 0.38, 900, 120, 0.2);
    ton(c, 'sine', 90, 48, t, 0.3, 0.2);
  }

  /** Explosion: Bombe. Fuer das Ende einer Runde oder einen Fehlschlag. */
  function explosion() {
    const c = kontext(); if (!c || zuFrueh('explosion', 300)) return;
    const t = c.currentTime;
    rauschen(c, t, 0.6, 1800, 60, 0.3);
    ton(c, 'sine', 120, 35, t, 0.5, 0.22);
  }

  /** Laeuft die Show gerade im Keller? Jede Regel haengt daran - in jeder
   *  anderen Richtung bleibt es still.
   *  @returns {boolean} */
  function imKeller() {
    return document.documentElement.getAttribute('data-theme') === 'T';
  }

  /** @param {Node} n @param {string} klasse @returns {boolean} */
  function hat(n, klasse) {
    return n.nodeType === 1 && /** @type {Element} */ (n).classList.contains(klasse);
  }

  let laeuft = false;

  /** Haengt die Beobachter ein. Mehrfachaufruf schadet nicht. */
  function start() {
    if (laeuft) return;
    laeuft = true;

    /* Ton braucht eine Geste. Der erste Klick weckt den Kontext; danach
       darf jedes Ereignis klingen. */
    const wecken = function () { kontext(); };
    document.addEventListener('click', wecken, { passive: true });
    document.addEventListener('keydown', wecken, { passive: true });

    const beo = new MutationObserver(function (listen) {
      if (!imKeller() || !an) return;
      for (const m of listen) {
        /* Herz verloren: ein .strike-pip bekommt die Klasse "lit". */
        if (m.type === 'attributes' && m.target && hat(m.target, 'strike-pip')) {
          const alt = m.oldValue || '';
          if (/** @type {Element} */ (m.target).classList.contains('lit') && alt.indexOf('lit') < 0) schaden();
          continue;
        }
        /* Punktzahl geaendert: Muenze. Der Vergleich laeuft ueber den
           alten Textinhalt, damit ein blosser Neuaufbau desselben Wertes
           (buildScoreboard schreibt innerHTML komplett neu) still bleibt. */
        if (m.type === 'characterData' && m.target && m.target.parentElement) {
          const p = m.target.parentElement;
          if (p.classList.contains('t-score') || p.classList.contains('score-val') || p.classList.contains('jt-score')) {
            const alt = Number(m.oldValue || 0), neu = Number(m.target.textContent || 0);
            if (neu > alt) muenze();
            continue;
          }
        }
        /* Bildschirmwechsel: Tuer. */
        if (m.type === 'attributes' && m.target && hat(m.target, 'screen')) {
          if (/** @type {Element} */ (m.target).classList.contains('active')) tuer();
        }
      }
    });
    beo.observe(document.body, {
      subtree: true, attributes: true, attributeOldValue: true,
      attributeFilter: ['class'], characterData: true, characterDataOldValue: true
    });
  }

  /** Ton abschalten (und wieder an). @param {boolean} [wert] */
  function schalten(wert) {
    an = wert === undefined ? !an : !!wert;
    if (!an && ac && ac.state === 'running') ac.suspend();
    return an;
  }

  /* Beim Durchsehen mit ?stumm=1 soll nichts klingen: dort werden die
     Shows hunderte Male durchgeschaltet (siehe tools/durchgang/). */
  if (typeof location !== 'undefined' && new URLSearchParams(location.search).has('stumm')) an = false;

  return { start, schalten, muenze, schaden, item, tuer, explosion };
})();

document.addEventListener('DOMContentLoaded', function () { KellerTon.start(); });
