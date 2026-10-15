/* Buehne: grosse Momente, die das Beamerfenster SELBST spielt.

   David 2026-10-15: "bei den Intros hab ich gesagt du sollst geisteskrank
   uebertreiben, das sollst du auch bei den designs jetzt machen". Ueber den
   Spiegel geht das nicht (BAUPLAN 4.8: GSAP/Canvas im Hauptfenster kaemen
   auf der Leinwand nie an). Wie mainscreen/aufdecken.js beobachtet diese
   Datei nur, WAS sich im gespiegelten DOM aendert (ein Feld bekommt "open",
   ein X wird "lit", die Runde wechselt, Punkte kommen dazu), und spielt den
   Moment mit eigenen Elementen (data-nur-beamer, der Spiegel laesst sie
   stehen).

   Je Design-Richtung eine Regie (REGIE[key]). Bisher: D (Late Night).
   - Lebende Stadt als Hintergrund (Canvas): zwei Haeuserreihen mit
     flackernden Fenstern, Antennenlichter, zwei Suchscheinwerfer, ab und zu
     ein Flugzeug. Ersetzt am Beamer die feste Skyline aus styles.css.
   - Antwort aufgedeckt: ein oranger Balken schlaegt quer durchs Bild, die
     Antwort faehrt riesig hinein, Blitz, Funken, Wackler, die Punkte zaehlen
     hoch - dann schrumpft der Balken genau auf seine Zeile.
   - X: ein riesiges rotes Kreuz schlaegt ein.
   - Neue Runde: Titelkarte "Runde n".
   - Punkte gutgeschrieben: die Zahl des Teams springt.

   Mit "Bewegung reduzieren" passiert nichts davon. Fuer Tests liegt die
   letzte Zeitleiste in window.__buehneTl. */
(function () {
  'use strict';
  if (!window.gsap) return;
  var html = document.documentElement;
  var ORANGE = '#FF5B1F', TINTE = '#0E0E0E', ROT = '#E8453C';

  function ruhig() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function thema() { return html.getAttribute('data-theme') || ''; }
  function el(tag, stil, text) {
    var n = document.createElement(tag);
    n.setAttribute('data-nur-beamer', '');
    if (stil) Object.assign(n.style, stil);
    if (text != null) n.textContent = text;
    return n;
  }
  function ebene() {
    return el('div', { position: 'fixed', inset: '0', zIndex: '2500', pointerEvents: 'none', overflow: 'hidden' });
  }
  function merke(tl) { window.__buehneTl = tl; return tl; }

  /* Funken: kleine Splitter, die aus einer Linie herausspritzen und fallen. */
  function funken(tl, wo, x0, x1, y, anzahl, farben, zeit) {
    for (var i = 0; i < anzahl; i++) {
      var w = 3 + Math.random() * 6, h = 2 + Math.random() * 3;
      var f = el('div', { position: 'absolute', left: (x0 + Math.random() * (x1 - x0)) + 'px', top: y + 'px',
        width: w + 'px', height: h + 'px', background: farben[i % farben.length], opacity: '0' });
      wo.appendChild(f);
      var hoch = Math.random() < .5 ? -1 : 1;
      tl.fromTo(f, { opacity: 1, x: 0, y: 0, rotation: Math.random() * 180 },
        { x: (Math.random() - .5) * 260, y: hoch * (40 + Math.random() * 160) + 120, rotation: '+=' + (200 + Math.random() * 400),
          opacity: 0, duration: .7 + Math.random() * .5, ease: 'power2.out', immediateRender: false }, zeit + Math.random() * .06);
    }
  }
  /* Wackler: die eigene Ebene, nicht der gespiegelte body (dessen style
     wuerde der Spiegel beim naechsten Durchlauf zuruecksetzen). */
  function wackeln(tl, ziel, zeit, staerke) {
    var s = staerke || 14;
    tl.to(ziel, { keyframes: [
      { x: -s, y: s * .4, duration: .04 }, { x: s * .8, y: -s * .5, duration: .04 },
      { x: -s * .5, y: s * .3, duration: .05 }, { x: s * .3, y: -s * .2, duration: .05 },
      { x: 0, y: 0, duration: .08 }] }, zeit);
  }

  /* ── D · Late Night ─────────────────────────────────────────────────── */
  var D = {
    /* Die lebende Stadt. Statische Teile werden einmal in Offscreen-Canvas
       gezeichnet, je Bild kommen nur Fenster, Lichter und Kegel dazu. */
    stadt: function () {
      if (document.getElementById('bn-stadt')) return;
      var c = el('canvas', { position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', zIndex: '-1',
        /* Links, wo die Liste steht, tritt die Stadt zurueck; rechts unter den Teams ist sie ganz da. */
        webkitMaskImage: 'linear-gradient(90deg, rgba(0,0,0,.35), #000 70%)', maskImage: 'linear-gradient(90deg, rgba(0,0,0,.35), #000 70%)' });
      c.id = 'bn-stadt';
      document.body.insertBefore(c, document.body.firstChild);
      html.classList.add('bn-stadt-an');
      var ctx = c.getContext('2d');
      var W = 0, H = 0, reihen = [], fenster = [], antennen = [], flieger = null, t0 = performance.now();
      function zufall(a) { var x = Math.sin(a * 9301 + 49297) * 233280; return x - Math.floor(x); }
      function bauen() {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = c.clientWidth; var VH = c.clientHeight; H = Math.round(VH * .42); c.oben = VH - H;
        c.width = W * dpr; c.height = VH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, c.oben * dpr);
        reihen = []; fenster = []; antennen = [];
        var tiefe = [
          { farbe: '#141414', hmin: .45, hmax: .92, wmin: 30, wmax: 70, fx: .25 },
          { farbe: '#101010', hmin: .25, hmax: .72, wmin: 44, wmax: 120, fx: .6 }];
        tiefe.forEach(function (t, ti) {
          var off = document.createElement('canvas'); off.width = (W + 120) * dpr; off.height = H * dpr;
          var o = off.getContext('2d'); o.setTransform(dpr, 0, 0, dpr, 0, 0); o.fillStyle = t.farbe;
          var x = 0, k = ti * 1000;
          while (x < W + 120) {
            var w = t.wmin + zufall(k++) * (t.wmax - t.wmin), h = H * (t.hmin + zufall(k++) * (t.hmax - t.hmin));
            o.fillRect(x, H - h, w, h);
            if (zufall(k++) < .4) { var sw = w * .55, sh = 10 + zufall(k++) * 26; o.fillRect(x + (w - sw) / 2, H - h - sh, sw, sh); }
            if (ti === 1) {
              if (zufall(k++) < .3) { o.fillRect(x + 8, H - h - 20, 16, 13); o.fillRect(x + 10, H - h - 7, 2, 7); o.fillRect(x + 20, H - h - 7, 2, 7); }
              else if (zufall(k++) < .35) { var ah = 18 + zufall(k++) * 44; o.fillRect(x + w / 2, H - h - ah, 2, ah); antennen.push({ x: x + w / 2 + 1, y: H - h - ah - 2, p: zufall(k++) * 6 }); }
              for (var fy = H - h + 10; fy < H - 6; fy += 14)
                for (var fx = x + 6; fx < x + w - 8; fx += 11)
                  if (zufall(k++) < .5) fenster.push({ x: fx, y: fy, an: zufall(k++) < .07, w: zufall(k++) < .7, wechsel: 2 + zufall(k++) * 14, z: zufall(k++) * 20 });
            }
            x += w + (zufall(k++) < .3 ? 3 : 0);
          }
          reihen.push({ bild: off, fx: t.fx });
        });
      }
      bauen();
      window.addEventListener('resize', bauen);
      var letzte = 0;
      function bild(now) {
        if (!document.getElementById('bn-stadt')) return;
        requestAnimationFrame(bild);
        if (now - letzte < 33) return;   // 30 Bilder je Sekunde reichen
        letzte = now;
        var t = (now - t0) / 1000;
        ctx.clearRect(0, -c.oben, W, H + c.oben);
        /* Suchscheinwerfer hinter der Stadt: zwei schmale Kegel, langsam. */
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        [[.28, .9, 0], [.74, 1.1, 2.4]].forEach(function (s) {
          var bx = W * s[0], wink = Math.sin(t * .18 * s[1] + s[2]) * .5 - Math.PI / 2;
          var len = H * 2.2, br = .07;
          var g = ctx.createLinearGradient(bx, H, bx + Math.cos(wink) * len, H + Math.sin(wink) * len);
          g.addColorStop(0, 'rgba(255,214,180,.10)'); g.addColorStop(1, 'rgba(255,214,180,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx, H);
          ctx.lineTo(bx + Math.cos(wink - br) * len, H + Math.sin(wink - br) * len);
          ctx.lineTo(bx + Math.cos(wink + br) * len, H + Math.sin(wink + br) * len); ctx.closePath(); ctx.fill();
        });
        ctx.restore();
        /* Flugzeug: alle ~35 s einmal quer, blinkend. */
        if (!flieger && zufall(Math.floor(t / 35) + .5) < .9 && (t % 35) < .05) flieger = { s: t };
        if (flieger) {
          var fp = (t - flieger.s) / 22;
          if (fp > 1) flieger = null;
          else if (Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = 'rgba(255,90,60,.9)'; ctx.fillRect(W * (1 - fp), H * .12 + fp * 14, 3, 3); }
        }
        /* Hintere Reihe treibt kaum merklich - die Stadt atmet. */
        var drift = Math.sin(t * .05) * 18;
        reihen.forEach(function (r, i) { ctx.globalAlpha = i === 0 ? .6 : 1; ctx.drawImage(r.bild, -60 + drift * r.fx, 0, (W + 120), H); }); ctx.globalAlpha = 1;
        var dx = -60 + drift * reihen[1].fx;
        fenster.forEach(function (f) {
          var an = f.an !== (Math.floor((t + f.z) / f.wechsel) % 7 === 0);
          ctx.fillStyle = an ? (f.w ? 'rgba(255,122,61,.85)' : 'rgba(255,199,158,.45)') : '#1A1A1A';
          ctx.fillRect(f.x + dx, f.y, 5, 7);
        });
        antennen.forEach(function (a) {
          var p = (Math.sin(t * 2.4 + a.p) + 1) / 2;
          ctx.fillStyle = 'rgba(255,91,31,' + (.25 + p * .75) + ')'; ctx.fillRect(a.x + dx - 2, a.y, 4, 4);
        });
      }
      requestAnimationFrame(bild);
    },

    /* Antwort aufgedeckt: der grosse Schlag. */
    antwort: function (tile) {
      var text = (tile.querySelector('.tile-answer') || {}).textContent || '';
      var pts = Number((tile.querySelector('.tile-pts') || {}).textContent) || 0;
      var nr = (tile.querySelector('.tile-num') || {}).textContent || '';
      var r = tile.getBoundingClientRect();
      var W = window.innerWidth, H = window.innerHeight, bh = Math.round(H * .3);
      var e = ebene(), schleier = el('div', { position: 'absolute', inset: '0', background: '#000', opacity: '0' });
      var buehne = el('div', { position: 'absolute', inset: '0' });
      var band = el('div', { position: 'absolute', left: '0', top: ((H - bh) / 2) + 'px', width: W + 'px', height: bh + 'px',
        background: ORANGE, transformOrigin: '0 50%', display: 'flex', alignItems: 'center', gap: '4vw', padding: '0 6vw',
        boxSizing: 'border-box', overflow: 'hidden', fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: '900', color: TINTE });
      var zNr = el('div', { fontSize: (bh * .9) + 'px', lineHeight: '.8', color: 'transparent', webkitTextStroke: '3px ' + TINTE, flex: 'none' }, nr);
      var zText = el('div', { flex: '1', fontSize: Math.min(bh * .52, W / Math.max(6, text.length) * 1.55) + 'px', lineHeight: '.9', textTransform: 'uppercase', whiteSpace: 'nowrap', letterSpacing: '-1px' }, text);
      var zPts = el('div', { fontSize: (bh * .62) + 'px', lineHeight: '.8', flex: 'none', fontVariantNumeric: 'tabular-nums' }, '0');
      band.append(zNr, zText, zPts);
      var blitz = el('div', { position: 'absolute', inset: '0', background: '#FFF6EE', opacity: '0', mixBlendMode: 'screen' });
      buehne.append(band);
      e.append(schleier, buehne, blitz);
      document.body.appendChild(e);

      var zahl = { v: 0 };
      var tl = merke(gsap.timeline({ onComplete: function () { e.remove(); } }));
      tl.to(schleier, { opacity: .62, duration: .22, ease: 'power1.out' }, 0)
        .fromTo(band, { scaleX: 0, skewX: -18 }, { scaleX: 1, skewX: 0, duration: .34, ease: 'power4.in' }, 0)
        .to(blitz, { keyframes: [{ opacity: .5, duration: .03 }, { opacity: 0, duration: .26, ease: 'power2.out' }] }, .32)
        .fromTo(zNr, { xPercent: -140, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .5, ease: 'expo.out' }, .3)
        .fromTo(zText, { x: W * .7, skewX: -16, opacity: 0 }, { x: 0, skewX: 0, opacity: 1, duration: .62, ease: 'expo.out' }, .34)
        .fromTo(zPts, { yPercent: 120 }, { yPercent: 0, duration: .45, ease: 'back.out(2)' }, .42)
        .to(zahl, { v: pts, duration: .7, ease: 'power2.out', onUpdate: function () { zPts.textContent = String(Math.round(zahl.v)); } }, .45);
      wackeln(tl, buehne, .34, 16);
      funken(tl, e, 0, W, (H - bh) / 2, 26, [ORANGE, '#FFC79E', '#FFFFFF'], .34);
      funken(tl, e, 0, W, (H + bh) / 2, 22, [ORANGE, '#FFC79E'], .36);
      /* Abgang: Schrift weg, Balken schrumpft genau auf seine Zeile. */
      tl.to([zNr, zText, zPts], { opacity: 0, y: -10, duration: .16, ease: 'power1.in' }, 1.75)
        .to(band, { x: r.left, y: r.top - (H - bh) / 2, scaleX: r.width / W, scaleY: r.height / bh, transformOrigin: '0 0',
                    duration: .5, ease: 'power3.inOut' }, 1.86)
        .to(schleier, { opacity: 0, duration: .4 }, 1.9)
        .to(band, { opacity: 0, duration: .24, ease: 'power1.in' }, 2.3);
      return tl;
    },

    /* X: ein riesiges rotes Kreuz schlaegt ein, der Rand gluet kurz rot. */
    strike: function () {
      var W = window.innerWidth, H = window.innerHeight, L = Math.min(W, H) * .78, d = Math.min(W, H) * .085;
      var e = ebene(), rand = el('div', { position: 'absolute', inset: '0', boxShadow: 'inset 0 0 0 0 ' + ROT, opacity: '0' });
      var kreuz = el('div', { position: 'absolute', left: (W / 2) + 'px', top: (H / 2) + 'px', width: '0', height: '0' });
      [45, -45].forEach(function (w) {
        kreuz.appendChild(el('div', { position: 'absolute', left: (-L / 2) + 'px', top: (-d / 2) + 'px', width: L + 'px', height: d + 'px',
          background: ROT, transform: 'rotate(' + w + 'deg)', boxShadow: '0 0 0 6px #0E0E0E' }));
      });
      e.append(rand, kreuz);
      document.body.appendChild(e);
      var tl = merke(gsap.timeline({ onComplete: function () { e.remove(); } }));
      tl.fromTo(kreuz, { scale: 2.6, rotation: -24, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: .24, ease: 'power4.in' }, 0)
        .to(rand, { opacity: 1, boxShadow: 'inset 0 0 0 26px ' + ROT, duration: .05 }, .24)
        .to(rand, { opacity: 0, boxShadow: 'inset 0 0 0 0 ' + ROT, duration: .6, ease: 'power2.out' }, .3)
        .to(kreuz, { scale: .9, opacity: 0, duration: .32, ease: 'power2.in' }, 1.15);
      wackeln(tl, kreuz, .24, 22);
      funken(tl, e, W / 2 - L / 3, W / 2 + L / 3, H / 2, 30, [ROT, '#FFB3AD', '#FFFFFF'], .24);
      return tl;
    },

    /* Neue Runde: Titelkarte quer durchs Bild. */
    runde: function (text) {
      var W = window.innerWidth, H = window.innerHeight;
      var e = ebene(), schleier = el('div', { position: 'absolute', inset: '0', background: TINTE, opacity: '0' });
      var zeile = el('div', { position: 'absolute', left: '6vw', top: '50%', transform: 'translateY(-50%)', fontFamily: "'Big Shoulders Display', sans-serif",
        fontWeight: '900', fontSize: '24vh', lineHeight: '.82', color: '#F2F2F2', textTransform: 'uppercase', whiteSpace: 'nowrap' }, text);
      var strich = el('div', { position: 'absolute', left: '6vw', top: 'calc(50% + 14vh)', height: '1.4vh', width: '40vw', background: ORANGE, transformOrigin: '0 50%' });
      e.append(schleier, zeile, strich);
      document.body.appendChild(e);
      var tl = merke(gsap.timeline({ onComplete: function () { e.remove(); } }));
      tl.to(schleier, { opacity: .94, duration: .25 }, 0)
        .fromTo(zeile, { x: W, skewX: -20 }, { x: 0, skewX: 0, duration: .6, ease: 'expo.out' }, .1)
        .fromTo(strich, { scaleX: 0 }, { scaleX: 1, duration: .5, ease: 'power4.out' }, .35)
        .to(zeile, { x: -W * .3, opacity: 0, duration: .4, ease: 'power3.in' }, 1.6)
        .to(strich, { scaleX: 0, transformOrigin: '100% 50%', duration: .3, ease: 'power3.in' }, 1.6)
        .to(schleier, { opacity: 0, duration: .35 }, 1.85);
      return tl;
    },

    /* Punkte gutgeschrieben: die Zahl springt orange aus ihrem Platz. */
    punkte: function (zahlEl) {
      var r = zahlEl.getBoundingClientRect(), cs = getComputedStyle(zahlEl);
      if (!r.width) return null;
      var e = ebene();
      var z = el('div', { position: 'absolute', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
        font: cs.font, lineHeight: cs.lineHeight, textAlign: cs.textAlign, color: ORANGE, whiteSpace: 'nowrap', transformOrigin: '100% 50%' }, zahlEl.textContent);
      e.appendChild(z);
      document.body.appendChild(e);
      var tl = merke(gsap.timeline({ onComplete: function () { e.remove(); } }));
      tl.fromTo(z, { scale: 1 }, { scale: 1.7, duration: .18, ease: 'power3.out' }, 0)
        .to(z, { scale: 1, duration: .5, ease: 'elastic.out(1, .45)' }, .18)
        .to(z, { opacity: 0, duration: .3 }, .9);
      funken(tl, e, r.left, r.right, r.top + r.height / 2, 16, [ORANGE, '#FFC79E'], .1);
      return tl;
    }
  };

  var REGIE = { D: D };

  function regie() { return ruhig() ? null : REGIE[thema()] || null; }

  /* Stadt an/aus je nach Richtung (die Richtung kann waehrend der Show
     wechseln: applyThemeToDoc setzt data-theme am <html> neu). */
  function stadtPruefen() {
    var r = regie(), c = document.getElementById('bn-stadt');
    if (r && r.stadt) r.stadt();
    else if (c) { c.remove(); html.classList.remove('bn-stadt-an'); }
  }
  new MutationObserver(stadtPruefen).observe(html, { attributes: true, attributeFilter: ['data-theme'] });

  function hatKlasse(wert, k) { return (' ' + (wert || '') + ' ').indexOf(' ' + k + ' ') >= 0; }
  var letzteRunde = null;

  new MutationObserver(function (liste) {
    var r = regie();
    if (!r) return;
    var antwort = null, strike = false, punkte = null, runde = null;
    liste.forEach(function (m) {
      var t = /** @type {Element} */ (m.target);
      if (m.type === 'attributes' && t.nodeType === 1) {
        var neu = t.getAttribute('class');
        if (t.classList.contains('tile') && hatKlasse(neu, 'open') && !hatKlasse(m.oldValue, 'open') && !hatKlasse(neu, 'missed')
            && t.closest('#game-screen')) antwort = t;
        if (t.classList.contains('strike-pip') && hatKlasse(neu, 'lit') && !hatKlasse(m.oldValue, 'lit')) strike = true;
      } else if (m.type === 'characterData') {
        var p = t.parentElement;
        if (!p) return;
        if (p.classList.contains('t-score') && Number(t.nodeValue) > Number(m.oldValue)) punkte = p;
        if (p.id === 'round-info') runde = t.nodeValue;
      }
    });
    if (runde && runde !== letzteRunde && letzteRunde !== null && r.runde) r.runde(runde.split('/')[0].trim());
    if (runde) letzteRunde = runde;
    if (antwort && r.antwort) r.antwort(antwort);
    else if (strike && r.strike) r.strike();
    if (punkte && r.punkte) r.punkte(punkte);
  }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true, characterData: true, characterDataOldValue: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stadtPruefen);
  else stadtPruefen();
})();
