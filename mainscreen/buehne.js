/* Buehne: grosse Momente, die das Beamerfenster SELBST spielt.

   David 2026-10-15: "bei den Intros hab ich gesagt du sollst geisteskrank
   uebertreiben, das sollst du auch bei den designs jetzt machen". Ueber den
   Spiegel geht das nicht (BAUPLAN 4.8: GSAP/Canvas im Hauptfenster kaemen
   auf der Leinwand nie an). Wie mainscreen/aufdecken.js beobachtet diese
   Datei nur, WAS sich im gespiegelten DOM aendert (ein Feld bekommt "open",
   ein X wird "lit", die Runde wechselt, Punkte kommen dazu), und spielt den
   Moment mit eigenen Elementen (data-nur-beamer, der Spiegel laesst sie
   stehen).

   Fuer ALLE Richtungen (auch Studio-Blau): der Siegermoment (SIEG), Farben
   aus den CSS-Variablen der Richtung.

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

  /* ── Fuer alle Richtungen: der Siegermoment ───────────────────────────
     David 2026-10-25: "dann mach alles" - Reihenfolge Siegermoment zuerst,
     weil ihn jede Show hat und er die Vorlage fuer die uebrigen Momente ist.
     Farben und Schrift kommen aus der Richtung (CSS-Variablen am <html>),
     deshalb keine Regie je Richtung noetig.
     Ablauf: abdunkeln, Lichtkegel, der Name schlaegt riesig in der Mitte
     ein, Konfetti aus beiden unteren Ecken (Canvas), dann fliegt der Name
     genau auf #winner-text (FLIP wie in aufdecken.js: das Element steht
     von Anfang an auf dem Endplatz, animiert wird nur transform).
     Das Konfetti des Hauptfensters (.confetti-p, js/feud.js confetti())
     kommt ueber den Spiegel mit; solange hier das eigene fliegt, ist es
     am Beamer ausgeblendet (mainscreen/index.html, html.bn-konfetti). */
  function farbe(name, rueck) {
    var v = getComputedStyle(html).getPropertyValue(name).trim();
    return v || rueck;
  }
  function konfetti(stuecke) {
    var c = el('canvas', { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '2600', pointerEvents: 'none' });
    var dpr = Math.min(window.devicePixelRatio || 1, 2), W = window.innerWidth, H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    var ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    document.body.appendChild(c);
    html.classList.add('bn-konfetti');
    var alle = [], vorher = performance.now(), offen = stuecke.filter(function (s) { return s.ab; }).length;
    function dazu(n) {
      for (var i = 0; i < n.anzahl; i++) {
        var w = n.winkel + (Math.random() - .5) * n.streuung, v = n.tempo * (.55 + Math.random() * .6);
        alle.push({ x: n.x + (Math.random() - .5) * (n.breite || 0), y: n.y, vx: Math.cos(w) * v, vy: Math.sin(w) * v,
          w: 7 + Math.random() * 9, h: 4 + Math.random() * 6, rot: Math.random() * 6.3, vr: (Math.random() - .5) * 12,
          kipp: Math.random() * 6.3, vk: 4 + Math.random() * 8, f: n.farben[i % n.farben.length] });
      }
    }
    stuecke.forEach(function (s) { if (s.ab) setTimeout(function () { offen--; dazu(s); }, s.ab * 1000); else dazu(s); });
    var ende = performance.now() + 7000;
    (function bild(jetzt) {
      var dt = Math.min(.05, (jetzt - vorher) / 1000); vorher = jetzt;
      ctx.clearRect(0, 0, W, H);
      alle = alle.filter(function (p) {
        p.vy += 1100 * dt; p.vx *= Math.pow(.35, dt); p.vy *= Math.pow(.55, dt);
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.kipp += p.vk * dt;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.kipp));
        ctx.fillStyle = p.f; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
        return p.y < H + 40;
      });
      if ((alle.length || offen > 0) && jetzt < ende) requestAnimationFrame(bild);
      else { c.remove(); html.classList.remove('bn-konfetti'); }
    })(vorher);
  }
  /* Kopie eines Textes, die genau auf ihrem Vorbild steht (gleiche Box,
     gleiche Schrift). Animiert wird nur transform: mx/my/k bringen sie in
     die Bildmitte und auf Groesse, x:0 y:0 scale:1 laesst sie exakt auf dem
     Vorbild landen. Der Wackler braucht das innere Element (kern):
     wackeln() setzt x/y absolut und wuerde die Verschiebung auf null ziehen. */
  function kopie(ziel, text, hoehe) {
    var r = ziel.getBoundingClientRect(), cs = getComputedStyle(ziel);
    if (!r.width || !r.height) return null;
    var W = window.innerWidth, H = window.innerHeight;
    /* Mass ist der TEXT, nicht die Box: #winner-text ist so breit wie der
       Screen, #pih-price so gross wie die ganze Buehne. Mit der Box stand
       die Kopie dort klein und neben der Mitte. */
    try { var rg = document.createRange(); rg.selectNodeContents(ziel); var tr = rg.getBoundingClientRect(); if (tr.width && tr.height) r = tr; } catch (e) {}
    var zeile = el('div', { position: 'absolute', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap',
      /* Einzeln statt cs.font: das Kurzwort ist leer, sobald etwas wie
         font-variant-numeric gesetzt ist - dann stand der Preis in 16 px da. */
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontStyle: cs.fontStyle,
      fontStretch: cs.fontStretch, fontVariantNumeric: cs.fontVariantNumeric, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform, color: cs.color,
      textShadow: cs.textShadow, webkitTextStrokeWidth: cs.webkitTextStrokeWidth, webkitTextStrokeColor: cs.webkitTextStrokeColor });
    var kern = el('div', null, text);
    zeile.appendChild(kern);
    return { zeile: zeile, kern: kern, r: r,
      mx: W / 2 - (r.left + r.width / 2), my: H * .46 - (r.top + r.height / 2),
      k: Math.max(1.4, Math.min(W * .84 / r.width, H * (hoehe || .3) / r.height)) };
  }
  function blitzen(tl, blitz, zeit, staerke) {
    tl.to(blitz, { keyframes: [{ opacity: staerke || .55, duration: .03 }, { opacity: 0, duration: .4, ease: 'power2.out' }] }, zeit);
  }

  var SIEG = function (ziel) {
    var name = ziel.textContent.trim();
    var kp = name && kopie(ziel, name);
    if (!kp) return null;
    var gleich = /^unentschieden/i.test(name), heller = html.hasAttribute('data-theme-hell');
    var W = window.innerWidth, H = window.innerHeight;
    var akzent = farbe('--accent-text', '#FFD23F'), hell = farbe('--gold-pale', '#FFE8A0'),
        stark = farbe('--fg-strong', '#FFFFFF'), grund = farbe('--bg', '#0b0e2c'), linie = farbe('--accent-line', akzent);

    var e = ebene();
    var schleier = el('div', { position: 'absolute', inset: '0', background: grund, opacity: '0' });
    var kegel = el('div', { position: 'absolute', left: '50%', top: '-20vh', width: '90vw', height: '120vh', marginLeft: '-45vw',
      background: 'radial-gradient(ellipse 38% 70% at 50% 0%, ' + (heller ? akzent : hell) + ', transparent 70%)', opacity: '0',
      /* Auf hellem Grund verschwindet ein aufhellender Kegel - dort faerbt er. */
      mixBlendMode: heller ? 'multiply' : 'screen' });
    var blitz = el('div', { position: 'absolute', inset: '0', background: stark, opacity: '0' });
    var zeile = kp.zeile, kern = kp.kern, k = kp.k, mx = kp.mx, my = kp.my;
    e.append(schleier, kegel, zeile, blitz);
    document.body.appendChild(e);
    html.classList.add('bn-sieg');

    /* force3D:false: die Schrift wird beim Wachsen neu gesetzt statt als
       Bild hochgezogen - sonst steht der Name bei k=6 matschig im Bild. */
    var tl = merke(gsap.timeline({ onComplete: function () { e.remove(); html.classList.remove('bn-sieg'); } }));
    tl.to(schleier, { opacity: .88, duration: .3, ease: 'power1.out' }, 0)
      .to(kegel, { opacity: gleich ? .35 : .7, duration: .5, ease: 'power2.out' }, .1)
      .fromTo(zeile, { x: mx, y: my, scale: k * 2.6, opacity: 0, filter: 'blur(14px)', force3D: false },
        { scale: k, opacity: 1, filter: 'blur(0px)', duration: .32, ease: 'power4.in', force3D: false }, .22)
      .to(zeile, { scale: k * 1.05, duration: 1.6, ease: 'sine.inOut', force3D: false }, .6)
      // Landung: transform zurueck auf null = genau #winner-text
      .to(zeile, { x: 0, y: 0, scale: 1, duration: .62, ease: 'power3.inOut', force3D: false }, 2.25)
      .to([schleier, kegel], { opacity: 0, duration: .55, ease: 'power1.inOut' }, 2.35);
    blitzen(tl, blitz, .54);
    wackeln(tl, kern, .54, 18 / k);
    if (!gleich) setTimeout(function () {
      var farben = [akzent, hell, stark, linie];
      konfetti([
        { x: 0, y: H, winkel: -1.05, streuung: .5, tempo: 1500, anzahl: 110, farben: farben },
        { x: W, y: H, winkel: -2.09, streuung: .5, tempo: 1500, anzahl: 110, farben: farben },
        { x: W / 2, y: -20, breite: W, winkel: 1.57, streuung: .3, tempo: 120, anzahl: 90, farben: farben, ab: .5 }
      ]);
    }, 540);
    return tl;
  };

  /* ── Fuer alle Richtungen: grosse Momente der einzelnen Shows ──────────
     Gleiches Geruest wie SIEG: Kopie des echten Textes schlaegt in der
     Mitte ein und landet auf ihrem Vorbild. Das Vorbild bleibt waehrenddessen
     unsichtbar: Klasse bn-ziel-<name> am <html>, die Regeln dazu stehen in
     mainscreen/index.html. Ein Attribut am Vorbild selbst ginge nicht - der
     Spiegel nimmt beim naechsten Durchlauf jedes Attribut weg, das im
     Hauptfenster nicht steht. */
  /* Einschlag + Halten + Landung, fuer WWM-Betrag, PIH-Preis, Daily Double.
     wahl: { name, text, farbe, halten, konfetti, hoehe, vorher(tl, kp) } */
  function einschlag(ziel, wahl) {
    var kp = kopie(ziel, wahl.text != null ? wahl.text : ziel.textContent.trim(), wahl.hoehe);
    if (!kp) return null;
    var W = window.innerWidth, H = window.innerHeight;
    var e = ebene(), schleier = el('div', { position: 'absolute', inset: '0', background: farbe('--bg', '#0b0e2c'), opacity: '0' });
    var blitz = el('div', { position: 'absolute', inset: '0', background: wahl.farbe || farbe('--fg-strong', '#fff'), opacity: '0' });
    if (wahl.farbe) kp.zeile.style.color = wahl.farbe;
    e.append(schleier, kp.zeile, blitz);
    document.body.appendChild(e);
    html.classList.add('bn-ziel-' + wahl.name);
    var halten = wahl.halten || 1.1, land = .5 + halten;
    var tl = merke(gsap.timeline({ onComplete: function () { e.remove(); html.classList.remove('bn-ziel-' + wahl.name); } }));
    tl.to(schleier, { opacity: .8, duration: .25 }, 0)
      .fromTo(kp.zeile, { x: kp.mx, y: kp.my, scale: kp.k * 2.4, opacity: 0, filter: 'blur(12px)', force3D: false },
        { scale: kp.k, opacity: 1, filter: 'blur(0px)', duration: .3, ease: 'power4.in', force3D: false }, .12)
      .to(kp.zeile, { x: 0, y: 0, scale: 1, duration: .55, ease: 'power3.inOut', force3D: false }, land)
      .to(schleier, { opacity: 0, duration: .45 }, land + .05);
    if (wahl.vorher) wahl.vorher(tl, kp);
    blitzen(tl, blitz, .42, .45);
    wackeln(tl, kp.kern, .42, 16 / kp.k);
    if (wahl.konfetti) setTimeout(function () {
      var f = [farbe('--accent-text', '#FFD23F'), farbe('--gold-pale', '#FFE8A0'), farbe('--fg-strong', '#fff')];
      konfetti([{ x: 0, y: H, winkel: -1.05, streuung: .5, tempo: 1500, anzahl: 120, farben: f },
                { x: W, y: H, winkel: -2.09, streuung: .5, tempo: 1500, anzahl: 120, farben: f }]);
    }, 420);
    return tl;
  }

  var MOMENTE = {
    /* WWM, richtige Antwort: der erspielte Betrag schlaegt ein und faellt
       in seine Stufe der Leiter. Bei der letzten Stufe mit Konfetti. */
    wwmRichtig: function () {
      var stufe = document.querySelector('#wwm-ladder .wwm-rung.current .wwm-amt');
      if (!stufe) return null;
      // Letzte Stufe im DOM = oberste Gewinnstufe (WWM_LADDER, js/wwm.js)
      var oben = stufe.parentElement === stufe.parentElement.parentElement.lastElementChild;
      return einschlag(stufe, { name: 'wwm', farbe: farbe('--green', '#22C55E'), halten: oben ? 1.8 : 1, konfetti: oben, hoehe: .26 });
    },
    /* WWM, falsch: kein Einschlag - der Rand gluet rot, die Buehne zuckt. */
    wwmFalsch: function () {
      var e = ebene(), rot = farbe('--red', '#E8453C');
      var rand = el('div', { position: 'absolute', inset: '0', boxShadow: 'inset 0 0 0 0 ' + rot, opacity: '0' });
      e.appendChild(rand);
      document.body.appendChild(e);
      var tl = merke(gsap.timeline({ onComplete: function () { e.remove(); } }));
      tl.to(rand, { opacity: 1, boxShadow: 'inset 0 0 120px 30px ' + rot, duration: .08 }, 0)
        .to(rand, { opacity: 0, boxShadow: 'inset 0 0 0 0 ' + rot, duration: .9, ease: 'power2.out' }, .12);
      return tl;
    },
    /* Preis ist heiss: der echte Preis rattert wie ein Zaehlwerk - alle
       Ziffern laufen, von links nach rechts rastet eine nach der anderen
       ein - dann faellt er auf seinen Platz. Verworfen: je Ziffer eine
       Walze aus gestapelten Spans; die Ziffern standen verstreut im Bild,
       weil die Box des Preises nicht die Zeilenhoehe der Schrift hat.
       Hier bleibt es EIN Text in der Schrift des Vorbilds. */
    pihPreis: function (ziel) {
      var text = ziel.textContent.trim();
      if (!/\d/.test(text)) return null;
      return einschlag(ziel, { name: 'pih', halten: 1.5, hoehe: .24, vorher: function (tl, kp) {
        var stellen = text.replace(/\D/g, '').length, lauf = { v: 0 };
        kp.kern.style.fontVariantNumeric = 'tabular-nums';
        tl.to(lauf, { v: stellen, duration: 1.3, ease: 'power1.in', onUpdate: function () {
          var fest = Math.floor(lauf.v), n = 0;
          kp.kern.textContent = text.replace(/\d/g, function (z) { return n++ < fest ? z : String(Math.floor(Math.random() * 10)); });
        }, onComplete: function () { kp.kern.textContent = text; } }, .15);
      } });
    },
    /* Jeopardy, Daily Double: die Karte dreht sich ins Bild und faellt auf
       ihr Banner. Wartet den Flug des Felds ab (aufdecken.js, ~1,35 s). */
    dailyDouble: function (banner) {
      return einschlag(banner, { name: 'dd', farbe: farbe('--accent-text', '#FFD23F'), halten: 1.2, hoehe: .22, vorher: function (tl, kp) {
        tl.fromTo(kp.kern, { rotationY: 540, transformPerspective: 900 }, { rotationY: 0, duration: .5, ease: 'power3.out' }, .12);
      } });
    },
    /* Der Duemmste fliegt: der Name schlaegt ein, ein roter Stempel kommt
       drueber, dann fliegt der Name aus dem Bild. */
    ddfRaus: function (spieler) {
      var nameEl = spieler.querySelector('.ddf-player-name');
      var name = nameEl && nameEl.textContent.trim();
      var kp = name && kopie(nameEl, name, .22);
      if (!kp) return null;
      var W = window.innerWidth, rot = farbe('--red', '#E8453C');
      var e = ebene(), schleier = el('div', { position: 'absolute', inset: '0', background: farbe('--bg', '#0b0e2c'), opacity: '0' });
      var stempel = el('div', { position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)',
        fontFamily: farbe('--font-display', 'sans-serif'), fontSize: '22vh', lineHeight: '1', color: rot, border: '1.4vh solid ' + rot,
        padding: '0 4vh', borderRadius: '2vh', textTransform: 'uppercase', opacity: '0', mixBlendMode: 'normal' }, 'Raus');
      e.append(schleier, kp.zeile, stempel);
      document.body.appendChild(e);
      var tl = merke(gsap.timeline({ onComplete: function () { e.remove(); } }));
      tl.to(schleier, { opacity: .85, duration: .25 }, 0)
        .fromTo(kp.zeile, { x: kp.mx, y: kp.my, scale: kp.k * 2.2, opacity: 0, force3D: false },
          { scale: kp.k, opacity: 1, duration: .3, ease: 'power4.in', force3D: false }, .1)
        .fromTo(stempel, { scale: 3, rotation: -28, opacity: 0 }, { scale: 1, rotation: -12, opacity: .92, duration: .22, ease: 'power4.in' }, .75)
        .to(kp.zeile, { x: kp.mx + W, rotation: 24, duration: .6, ease: 'power3.in', force3D: false }, 1.75)
        .to(stempel, { opacity: 0, scale: .9, duration: .35 }, 1.95)
        .to(schleier, { opacity: 0, duration: .4 }, 2.15);
      wackeln(tl, kp.kern, .4, 12 / kp.k);
      wackeln(tl, kp.kern, .97, 22 / kp.k);
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
    if (ruhig()) return;
    /* Siegermoment: in jeder Richtung, auch Studio-Blau. Ausloeser ist der
       Ergebnis-Screen, der "active" bekommt - der Name steht dann schon. */
    var allg = null;
    for (var i = 0; i < liste.length && !allg; i++) {
      var m0 = liste[i], t0 = /** @type {Element} */ (m0.target);
      if (m0.type === 'attributes' && t0.nodeType === 1) {
        var neu0 = t0.getAttribute('class'), alt0 = m0.oldValue;
        if (t0.id === 'result-screen' && hatKlasse(neu0, 'active') && !hatKlasse(alt0, 'active'))
          allg = function () { var z = document.getElementById('winner-text'); if (z) SIEG(z); };
        /* WWM: die gewaehlte Antwort wird "correct" (richtig) oder "wrong". */
        else if (t0.classList.contains('wwm-opt') && hatKlasse(alt0, 'selected')) {
          if (hatKlasse(neu0, 'correct')) allg = MOMENTE.wwmRichtig;
          else if (hatKlasse(neu0, 'wrong')) allg = MOMENTE.wwmFalsch;
        }
        /* DDF: ein Spieler wird "out" - der Verlierer der Runde traegt "picked". */
        else if (t0.classList.contains('ddf-player') && hatKlasse(neu0, 'out') && hatKlasse(neu0, 'picked') && !hatKlasse(alt0, 'out'))
          allg = (function (t) { return function () { MOMENTE.ddfRaus(t); }; })(t0);
      } else if (m0.type === 'childList') {
        /* PIH: der Preis wird erst bei der Aufloesung eingesetzt. */
        if (t0.id === 'pih-price' && t0.textContent.trim())
          allg = (function (t) { return function () { MOMENTE.pihPreis(t); }; })(t0);
        for (var j = 0; j < m0.addedNodes.length && !allg; j++) {
          var n0 = /** @type {Element} */ (m0.addedNodes[j]);
          var dd = n0.nodeType === 1 && n0.id === 'jeopardy-clue-ov' && n0.querySelector('.jeopardy-dd-banner');
          /* Erst wenn der Flug des Felds (aufdecken.js) gelandet ist - der
             verdeckt die Frage mit html.jp-flug/jp-landung. Fest 1,4 s zu
             warten reichte nicht, sobald der Beamer ins Stocken kommt. */
          if (dd) allg = (function (b) { return function () {
            var bis = Date.now() + 4000;
            (function warte() {
              if (!b.isConnected) return;
              if (/\bjp-(flug|landung)\b/.test(html.className) && Date.now() < bis) { setTimeout(warte, 100); return; }
              setTimeout(function () { if (b.isConnected) MOMENTE.dailyDouble(b); }, 250);
            })();
          }; })(dd);
        }
      }
    }
    if (allg) { allg(); return; }
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
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true, characterData: true, characterDataOldValue: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', stadtPruefen);
  else stadtPruefen();
})();
