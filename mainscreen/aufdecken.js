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
  /* Haupt- und Beamerfenster teilen sich einen Thread. Kommt doch ein
     Haenger, macht GSAP danach dort weiter, wo es war, statt zu springen
     (Standard waere: erst ab 500 ms). */
  gsap.ticker.lagSmoothing(80, 16);

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

    /* Nur transform und opacity werden animiert (FLIP). Groesse, Lage und
       Schrift stehen von Anfang an auf dem ENDZUSTAND, die Bewegung ist reine
       Verschiebung/Skalierung - das rechnet die Grafikkarte, ohne je Frame
       neu zu layouten oder zu zeichnen. Die erste Fassung animierte left,
       top, width, height, font-size und box-shadow; mit 4- bis 6-fach
       gebremster CPU gab es Haenger bis 150 ms (gemessen 2026-10-14).
       Flaeche und Zahl sind getrennte Ebenen: die Flaeche wird ungleich in
       Breite und Hoehe skaliert, die Zahl gleichmaessig - sonst waere sie
       unterwegs gestaucht. */
    var W = window.innerWidth, H = window.innerHeight;
    var ueber = 0.04;   // Flaeche etwas groesser als das Fenster, keine Kanten sichtbar
    var PL = -W * ueber / 2, PT = -H * ueber / 2, PW = W * (1 + ueber), PH = H * (1 + ueber);
    var gross = Math.min(W * 0.16, 230);
    var zellStil = getComputedStyle(cell);
    var zellFs = parseFloat(zellStil.fontSize) || 32;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;

    var platte = cell.cloneNode(false);
    platte.setAttribute('data-nur-beamer', '');
    platte.removeAttribute('onclick');
    platte.className = cell.className.replace(/\bused\b/, '');
    Object.assign(platte.style, {
      position: 'fixed', left: PL + 'px', top: PT + 'px', width: PW + 'px', height: PH + 'px',
      margin: '0', zIndex: '2000', borderRadius: '0', boxShadow: 'none',
      transformOrigin: '0 0', willChange: 'transform, opacity', pointerEvents: 'none'
    });
    var zahl = document.createElement('div');
    zahl.setAttribute('data-nur-beamer', '');
    zahl.textContent = cell.textContent;
    Object.assign(zahl.style, {
      position: 'fixed', left: '0', top: '0', width: W + 'px', height: H + 'px', zIndex: '2001',
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0',
      fontFamily: zellStil.fontFamily, fontWeight: zellStil.fontWeight, fontSize: gross + 'px',
      lineHeight: '1', color: zellStil.color, letterSpacing: zellStil.letterSpacing,
      transformOrigin: '50% 50%', willChange: 'transform, opacity', pointerEvents: 'none'
    });
    var schleier = document.createElement('div');
    schleier.setAttribute('data-nur-beamer', '');
    Object.assign(schleier.style, {
      position: 'fixed', inset: '0', zIndex: '1999', background: '#000',
      opacity: '0', willChange: 'opacity', pointerEvents: 'none'
    });

    /* Ziel des Betrags: die Punktzahl in der (noch verdeckten) Frage. Die Zahl
       gleitet genau dorthin und auf deren Groesse - wenn die Ebenen dann
       ausblenden, steht darunter dieselbe Zahl am selben Fleck. */
    /* Die Frage spielt beim Ankommen ihre eigene Einblendung (screenIn,
       mit Verschiebung). Sie ist hier noch verdeckt - ans Ende spulen, sonst
       misst man die Punktzahl an der falschen Stelle (lag 9 px zu tief). */
    if (ov.getAnimations) ov.getAnimations({ subtree: true }).forEach(function (an) { try { an.finish(); } catch (e) {} });
    var pts = ov.querySelector('.jeopardy-clue-pts');
    var ziel = pts ? pts.getBoundingClientRect() : null;
    var zielStil = pts ? getComputedStyle(pts) : null;
    if (zielStil) {
      zahl.style.fontFamily = zielStil.fontFamily; zahl.style.fontWeight = zielStil.fontWeight;
      zahl.style.letterSpacing = zielStil.letterSpacing;
      // Gleiche Zeilenhoehe wie die Punktzahl: sonst sitzt die Zahl nach der
      // Landung um die halbe Differenz versetzt und springt beim Ausblenden.
      // Als Verhaeltnis, nicht in px: die fliegende Zahl hat eine andere Schriftgroesse.
      var zlh = parseFloat(zielStil.lineHeight), zfs = parseFloat(zielStil.fontSize);
      zahl.style.lineHeight = (zlh && zfs) ? String(zlh / zfs) : "normal";
    }
    var zielS = zielStil ? (parseFloat(zielStil.fontSize) || gross) / gross : 0.3;
    var zielX = ziel ? ziel.left + ziel.width / 2 - W / 2 : 0;
    var zielY = ziel ? ziel.top + ziel.height / 2 - H / 2 : -H * 0.08;

    gsap.set(platte, { x: r.left - PL, y: r.top - PT, scaleX: r.width / PW, scaleY: r.height / PH, force3D: true });
    document.body.append(schleier, platte, zahl);
    /* Landepunkt an den echten Buchstaben einmessen statt errechnen: Zahl
       probeweise aufs Ziel setzen, Textbox mit der der Punktzahl vergleichen,
       Groesse und Lage korrigieren. Errechnet lag sie 11 px zu tief und
       5 px versetzt - am Ende stand kurz eine doppelte Zahl. Alles im selben
       Frame, vor dem ersten Zeichnen. */
    if (pts) {
      var textBox = function (el) { var rg = document.createRange(); rg.selectNodeContents(el); return rg.getBoundingClientRect(); };
      gsap.set(zahl, { x: zielX, y: zielY, scale: zielS });
      var a = textBox(zahl), c = textBox(pts);
      if (a.width > 0 && c.width > 0) {
        zielS *= c.width / a.width;
        gsap.set(zahl, { scale: zielS });
        a = textBox(zahl);
        zielX += (c.left + c.width / 2) - (a.left + a.width / 2);
        zielY += (c.top + c.height / 2) - (a.top + a.height / 2);
      }
    }
    gsap.set(zahl, { x: cx - W / 2, y: cy - H / 2, scale: zellFs / gross, force3D: true });
    html.classList.add('jp-flug');

    var w2 = r.width * 1.12, h2 = r.height * 1.12;
    /* Erst zwei Frames abwarten: beim Oeffnen der Frage arbeitet das
       Hauptfenster im selben Thread (Overlay, Spiegel, GM-Panel, Sichern) -
       gemessen lagen die Haenger in den ersten ~200 ms. Bis dahin steht die
       Karte still auf dem Feld, die Frage ist schon verdeckt. */
    laufend = gsap.timeline({ onComplete: aufraeumen, paused: true })
      .to(schleier, { opacity: 0.6, duration: 0.35, ease: 'power1.out' }, 0)
      // Anheben: etwas groesser und ein Stueck nach oben, mit Federn
      .to(platte, { x: cx - w2 / 2 - PL, y: cy - h2 / 2 - 8 - PT, scaleX: w2 / PW, scaleY: h2 / PH,
                    duration: 0.24, ease: 'back.out(2.4)' }, 0)
      .to(zahl, { y: cy - H / 2 - 8, scale: zellFs / gross * 1.12, duration: 0.24, ease: 'back.out(2.4)' }, 0)
      // Flug ins Vollbild
      .to(platte, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.58, ease: 'power3.inOut' }, 0.22)
      .to(zahl, { x: 0, y: 0, scale: 1, duration: 0.58, ease: 'power3.inOut' }, 0.22)
      /* Ausklang ohne harten Schnitt: die Frage liegt schon unter der Flaeche,
         waehrend die Zahl landet, und die Flaeche loest sich ueber 0,6 s in die
         Buehne auf. Vorher blendeten Flaeche, Zahl und Abdunklung zugleich in
         0,3 s mit Beschleunigung aus - der meiste Wechsel lag in den letzten
         ~100 ms und wirkte wie ein Schnitt (David, 2026-10-14). */
      .add(function () { html.classList.remove('jp-flug'); }, 0.84)
      .to(schleier, { opacity: 0, duration: 0.2 }, 0.8)
      .to(platte, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0.84)
      .to(zahl, { x: zielX, y: zielY, scale: zielS, duration: 0.5, ease: 'power3.inOut' }, 0.84)
      .to(zahl, zielStil ? { color: zielStil.color, duration: 0.5 } : { duration: 0 }, 0.84)
      .to(zahl, { opacity: 0, duration: 0.16, ease: 'none' }, 1.36);
    var tl = laufend;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (laufend !== tl) return;
      window.__flugStart = performance.now();
      window.__flugTl = tl;   // nur fuer Tests: Zeitleiste anfahrbar (tools/shots)
      tl.play();
    }); });
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
