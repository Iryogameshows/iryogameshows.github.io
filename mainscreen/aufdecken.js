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
    html.classList.remove('jp-flug', 'jp-landung');
    document.querySelectorAll('[data-fliegt]').forEach(function (n) { n.removeAttribute('data-fliegt'); });
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
    /* Startpunkt der Zahl ist die Zahl selbst, nicht die Mitte des Felds:
       in Richtungen mit linksbuendigen Feldern (Late Night) startete sie
       sonst ein Stueck neben ihrer Ziffer. */
    var tr = r;
    try { var rg = document.createRange(); rg.selectNodeContents(cell); var rr = rg.getBoundingClientRect(); if (rr.width && rr.height) tr = rr; } catch (e) {}
    var cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;

    var platte = cell.cloneNode(false);
    platte.setAttribute('data-nur-beamer', '');
    platte.removeAttribute('onclick');
    platte.className = cell.className.replace(/\bused\b/, '');
    Object.assign(platte.style, {
      position: 'fixed', left: PL + 'px', top: PT + 'px', width: PW + 'px', height: PH + 'px',
      margin: '0', zIndex: '2000', borderRadius: '0', boxShadow: 'none',
      transformOrigin: '0 0', willChange: 'transform, opacity', pointerEvents: 'none'
    });
    var schleier = document.createElement('div');
    schleier.setAttribute('data-nur-beamer', '');
    Object.assign(schleier.style, {
      position: 'fixed', inset: '0', zIndex: '1999', background: '#000',
      opacity: '0', willChange: 'opacity', pointerEvents: 'none'
    });

    /* Die fliegende Zahl ist eine exakte Kopie der Punktzahl in der Frage:
       gleiche Box, gleiche Schrift, gleiche Groesse, gleiche Lage. Unterwegs
       wird sie nur per transform verkleinert und verschoben; am Ende ist der
       transform null und sie liegt deckungsgleich auf dem Original - es kann
       keine Verschiebung mehr geben. Die Fassungen davor setzten eine eigene,
       grosse Zahl und rechneten sie an die Punktzahl heran; zwei verschieden
       gesetzte Texte blieben 2-11 px auseinander (David: "immer noch eine
       leichte Verschiebung").
       Die Frage spielt beim Ankommen ihre eigene Einblendung (screenIn, mit
       Verschiebung); sie ist hier noch verdeckt - vor dem Messen ans Ende. */
    if (ov.getAnimations) ov.getAnimations({ subtree: true }).forEach(function (an) { try { an.finish(); } catch (e) {} });
    var pts = ov.querySelector('.jeopardy-clue-pts');
    var zahl = null, zx = 0, zy = 0, zfs = 1, zielFarbe = null;
    if (pts) {
      var pr = pts.getBoundingClientRect(), ps = getComputedStyle(pts);
      zfs = parseFloat(ps.fontSize) || 48;
      zx = pr.left + pr.width / 2; zy = pr.top + pr.height / 2;
      zielFarbe = ps.color;
      zahl = document.createElement('div');
      zahl.setAttribute('data-nur-beamer', '');
      zahl.textContent = pts.textContent;
      Object.assign(zahl.style, {
        position: 'fixed', left: pr.left + 'px', top: pr.top + 'px',
        width: pr.width + 'px', height: pr.height + 'px', margin: '0', zIndex: '2001',
        boxSizing: 'border-box', padding: ps.padding, display: 'block', whiteSpace: 'nowrap',
        fontFamily: ps.fontFamily, fontSize: ps.fontSize, fontWeight: ps.fontWeight, fontStyle: ps.fontStyle,
        fontStretch: ps.fontStretch, fontVariantNumeric: ps.fontVariantNumeric, letterSpacing: ps.letterSpacing,
        lineHeight: ps.lineHeight, textAlign: ps.textAlign, textTransform: ps.textTransform,
        textShadow: ps.textShadow, color: zellStil.color, transformOrigin: '50% 50%', pointerEvents: 'none',
        /* Konturschrift (Late Night zeigt den Betrag nur als Umriss): ohne
           die Kontur wuerde die Zahl beim Landen auf "transparent" einfach
           verschwinden. */
        webkitTextStrokeWidth: ps.webkitTextStrokeWidth, webkitTextStrokeColor: ps.webkitTextStrokeColor
      });
    }

    gsap.set(platte, { x: r.left - PL, y: r.top - PT, scaleX: r.width / PW, scaleY: r.height / PH, force3D: true });
    document.body.append(schleier, platte);
    if (zahl) {
      document.body.append(zahl);
      gsap.set(zahl, { x: cx - zx, y: cy - zy, scale: zellFs / zfs });
    }
    html.classList.add('jp-flug');
    /* Die Ziffer im Feld selbst ausblenden, solange ihre Kopie fliegt -
       sonst stehen beim Abheben zwei leicht versetzte Zahlen uebereinander. */
    cell.setAttribute('data-fliegt', '');

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
      // Flug ins Vollbild
      .to(platte, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.58, ease: 'power3.inOut' }, 0.22)
      /* Ausklang ohne harten Schnitt: die Frage liegt schon unter der Flaeche,
         waehrend die Zahl landet, und die Flaeche loest sich ueber 0,6 s in die
         Buehne auf. Vorher blendeten Flaeche, Zahl und Abdunklung zugleich in
         0,3 s mit Beschleunigung aus - der meiste Wechsel lag in den letzten
         ~100 ms und wirkte wie ein Schnitt (David, 2026-10-14). */
      /* Ab hier liegt die Frage schon unter der Flaeche. Ihre eigene
         Punktzahl bleibt aber verdeckt, bis die fliegende Zahl gelandet ist -
         sonst standen beide zugleich und versetzt im Bild ("30300"). */
      .add(function () { html.classList.add('jp-landung'); html.classList.remove('jp-flug'); }, 0.84)
      .add(function () { html.classList.remove('jp-landung'); }, 1.34)
      .to(schleier, { opacity: 0, duration: 0.2 }, 0.8)
      .to(platte, { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 0.84)
      ;
    if (zahl) laufend
      .to(zahl, { y: cy - zy - 8, scale: zellFs / zfs * 1.12, duration: 0.24, ease: 'back.out(2.4)' }, 0)
      .to(zahl, { x: W / 2 - zx, y: H / 2 - zy, scale: gross / zfs, duration: 0.58, ease: 'power3.inOut' }, 0.22)
      // Landung: transform zurueck auf null = exakt die Punktzahl der Frage
      .to(zahl, { x: 0, y: 0, scale: 1, color: zielFarbe, duration: 0.5, ease: 'power3.inOut' }, 0.84)
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
