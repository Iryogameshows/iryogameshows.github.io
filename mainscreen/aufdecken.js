/* Jeopardy: das gewaehlte Feld fliegt aus dem Raster zur Frage.

   Gespielt vom Beamerfenster SELBST mit GSAP (vendor/gsap.min.js). Der
   Spiegel aus dem Hauptfenster (morphMirror in js/feud.js) taugt dafuer nicht:
   GSAP schreibt je Frame ein style-Attribut, jede Aenderung loeste einen
   Spiegel-Durchlauf ueber den ganzen body aus, und liegt das Hauptfenster im
   Hintergrund, bliebe die Animation stehen (BAUPLAN 4.8). Hier dagegen sieht
   das Beamerfenster nur, DASS das Frage-Overlay angekommen ist, und spielt
   den Flug mit eigenen Elementen ab. Die tragen data-nur-beamer; der Spiegel
   laesst sie in Ruhe.

   Ablauf (rund 1,1 s): Raster dunkelt ab, das Feld hebt sich an, fliegt mit
   leichter Kippung ins Vollbild, der Betrag waechst mit; dann blendet die
   Karte in die eigentliche Frage ueber, die so lange verdeckt war
   (html.jp-flug, CSS in mainscreen/index.html).

   Was das Overlay mitbringt: data-col / data-row (js/jeopardy.js,
   renderJeopardyClueOverlay). Mit "Bewegung reduzieren" kein Flug. */
(function () {
  'use strict';
  if (!window.gsap) return;
  var html = document.documentElement;
  var laufend = null;

  function ruhig() {
    return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function aufraeumen() {
    document.querySelectorAll('[data-nur-beamer]').forEach(function (n) { n.remove(); });
    html.classList.remove('jp-flug');
    laufend = null;
  }

  function flug(ov) {
    if (ruhig()) return;
    var col = Number(ov.dataset.col), row = Number(ov.dataset.row);
    var board = document.getElementById('jeopardy-board');
    if (!board || isNaN(col) || isNaN(row)) return;
    var cols = board.querySelectorAll('.jeopardy-cat').length;
    var cell = board.querySelectorAll('.jeopardy-cell')[row * cols + col];
    if (!cell) return;
    var r = cell.getBoundingClientRect();
    if (!r.width || !r.height) return;
    if (laufend) { laufend.kill(); aufraeumen(); }

    var karte = cell.cloneNode(true);
    karte.setAttribute('data-nur-beamer', '');
    karte.removeAttribute('onclick');
    karte.className = cell.className.replace(/\bused\b/, '');
    Object.assign(karte.style, {
      position: 'fixed', left: r.left + 'px', top: r.top + 'px',
      width: r.width + 'px', height: r.height + 'px', margin: '0',
      zIndex: '2000', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxSizing: 'border-box', transformOrigin: '50% 50%', pointerEvents: 'none'
    });
    var schleier = document.createElement('div');
    schleier.setAttribute('data-nur-beamer', '');
    Object.assign(schleier.style, {
      position: 'fixed', inset: '0', zIndex: '1999', background: '#000',
      opacity: '0', pointerEvents: 'none'
    });
    document.body.append(schleier, karte);
    html.classList.add('jp-flug');

    var W = window.innerWidth, H = window.innerHeight;
    var gross = Math.min(W * 0.16, 230);
    /* Ziel des Betrags: die Punktzahl in der (noch verdeckten) Frage. Die
       Karte schiebt ihren Text genau dorthin und auf deren Groesse - wenn sie
       dann ausblendet, steht darunter dieselbe Zahl am selben Fleck. */
    var pts = ov.querySelector('.jeopardy-clue-pts');
    var ziel = pts ? pts.getBoundingClientRect() : null;
    var zielFs = pts ? parseFloat(getComputedStyle(pts).fontSize) : gross;
    var zielFarbe = pts ? getComputedStyle(pts).color : null;
    if (pts) {
      var zs = getComputedStyle(pts);
      karte.style.fontFamily = zs.fontFamily; karte.style.fontWeight = zs.fontWeight; karte.style.letterSpacing = zs.letterSpacing;
    }
    var hoch = ziel ? Math.max(0, (H / 2 - (ziel.top + ziel.height / 2)) * 2) : 0;
    /* Etwas groesser als das Fenster: die Kippung zeigte sonst schwarze Ecken. */
    var ueber = 0.04;
    laufend = gsap.timeline({ onComplete: aufraeumen })
      .to(schleier, { opacity: 0.6, duration: 0.35, ease: 'power1.out' }, 0)
      .to(karte, { scale: 1.14, y: -8, boxShadow: '0 26px 60px rgba(0,0,0,.65)',
                   duration: 0.24, ease: 'back.out(2.4)' }, 0)
      .fromTo(karte, { rotationX: 0, transformPerspective: 1100 },
              { left: -W * ueber / 2, top: -H * ueber / 2, width: W * (1 + ueber), height: H * (1 + ueber),
                scale: 1, y: 0, rotationX: -6, borderRadius: 0, fontSize: gross,
                duration: 0.58, ease: 'power3.inOut' }, 0.22)
      .to(karte, { rotationX: 0, duration: 0.22, ease: 'power2.out' }, 0.8)
      .to(karte, { fontSize: zielFs, paddingBottom: hoch, duration: 0.34, ease: 'power2.inOut' }, 0.84)
      .to(karte, zielFarbe ? { color: zielFarbe, duration: 0.34 } : { duration: 0 }, 0.84)
      .add(function () { html.classList.remove('jp-flug'); }, 1.18)
      .to(karte, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 1.18)
      .to(schleier, { opacity: 0, duration: 0.3 }, 1.18);
  }

  new MutationObserver(function (liste) {
    liste.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.nodeType === 1 && n.id === 'jeopardy-clue-ov') flug(n);
      });
      m.removedNodes.forEach(function (n) {
        // Host schliesst die Frage mitten im Flug: sofort aufraeumen.
        if (n.nodeType === 1 && n.id === 'jeopardy-clue-ov' && laufend) { laufend.kill(); aufraeumen(); }
      });
    });
  }).observe(document.body, { childList: true });
})();
