/* ═══ INTRO-LABOR: gemeinsames Gerüst der Intro-Prototypen ═══════════════════
   Jedes Intro unter tools/intros/<name>/ bringt nur seine Idee mit: Markup,
   Zeitleiste, Ton. Was alle brauchen, steht hier einmal:

     Lab.SHOW      die Texte - in allen Intros dieselben, damit man sie
                   vergleichen kann
     Lab.zeichen   Text in einzelne Buchstaben-Spans zerlegen
     Lab.Ton       WebAudio-Baukasten (Kick, Snare, Aufprall, Saite, ...)
     Lab.starte    Startbildschirm, Bedienleiste, Neustart, Spulen

   Kein Teil der Show und nicht von check.js geprüft (das prüft nur js/).
   Klassisches Script, kein Modul - wie im Rest des Projekts.
   ════════════════════════════════════════════════════════════════════════ */
(function(){
  const SHOW = {
    vorab: 'Heute Abend',
    titelKlein: 'Die Große',
    titel: 'Keller Gameshow',
    titelZeile: 'Zwei Teams · Zwei Abende · Ein Sieger',
    teams: ['Team Rot', 'Team Blau'],
    karten: [
      { ueber: 'Es treten an',       text: 'Zwei Teams' },
      { ueber: 'Gespielt wird an',   text: 'Zwei Abenden' },
      { ueber: 'Heute Abend',        text: 'Gameshow Nr. 1' },
      { ueber: 'Für das Siegerteam', text: '30 €', zahl: 30 },
    ],
  };

  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
  /* Leerzeichen als eigener Span mit &nbsp;: als inline-block hätte ein
     normales Leerzeichen keine Breite. */
  function zeichen(text, cls){
    cls = cls || 'ch';
    return Array.from(String(text)).map(c => c === ' '
      ? `<span class="${cls} leer">&nbsp;</span>`
      : `<span class="${cls}">${esc(c)}</span>`).join('');
  }

  /* ── Ton ───────────────────────────────────────────────────────────────
     Alles synthetisch, keine Dateien. Jede Funktion bekommt eine absolute
     Startzeit (AudioContext-Zeit), damit ein Intro seinen ganzen Ablauf beim
     Start einmal einplant und der Ton nicht vom Bildtakt abhängt. */
  const Ton = {
    ctx: null, out: null, nodes: [], an: true, buf: null, fb: [],
    init(){
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (!this.buf){
        const c = this.ctx;
        this.buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
        const d = this.buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
    },
    neu(){
      this.init();
      this.stop();
      const c = this.ctx;
      c.resume();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -12; comp.ratio.value = 4;
      comp.connect(c.destination);
      this.out = c.createGain();
      this.out.gain.value = this.an ? .8 : 0;
      this.out.connect(comp);
      return c.currentTime + .06;
    },
    stop(){
      this.nodes.forEach(n => { try { n.stop(); } catch {} });
      this.nodes = [];
      this.fb.forEach(g => { try { g.gain.value = 0; } catch {} });
      this.fb = [];
      if (this.out){ try { this.out.disconnect(); } catch {} this.out = null; }
    },
    laut(an){ this.an = an; if (this.out) this.out.gain.setTargetAtTime(an ? .8 : 0, this.ctx.currentTime, .05); },

    gain(v, ziel){ const g = this.ctx.createGain(); g.gain.value = v; g.connect(ziel || this.out); return g; },
    filter(typ, f, q, ziel){ const b = this.ctx.createBiquadFilter(); b.type = typ; b.frequency.value = f; if (q) b.Q.value = q; b.connect(ziel); return b; },
    osz(typ, f, t, dauer, ziel){
      const o = this.ctx.createOscillator(); o.type = typ; o.frequency.setValueAtTime(f, t);
      o.connect(ziel); o.start(t); o.stop(t + dauer); this.nodes.push(o); return o;
    },
    rauschen(t, dauer, ziel){
      const s = this.ctx.createBufferSource(); s.buffer = this.buf; s.loop = true;
      s.playbackRate.value = .9 + Math.random() * .2;
      s.connect(ziel); s.start(t, Math.random()); s.stop(t + dauer); this.nodes.push(s); return s;
    },
    /* Hüllkurve: Anstieg a, halten, exponentiell ausklingen r. */
    huelle(t, a, wert, halten, r, ziel){
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(wert, t + a);
      g.gain.setValueAtTime(wert, t + a + halten);
      g.gain.exponentialRampToValueAtTime(.0001, t + a + halten + r);
      g.connect(ziel || this.out);
      return g;
    },

    kick(t, v){
      v = v == null ? 1 : v;
      const g = this.huelle(t, .002, v, .02, .34);
      const o = this.osz('sine', 160, t, .45, g); o.frequency.exponentialRampToValueAtTime(42, t + .13);
      const k = this.huelle(t, .001, v * .25, 0, .02);
      this.rauschen(t, .03, this.filter('highpass', 3000, 0, k));
    },
    snare(t, v){
      v = v == null ? .55 : v;
      const g = this.huelle(t, .001, v, 0, .2);
      this.rauschen(t, .25, this.filter('highpass', 1400, 0, g));
      const g2 = this.huelle(t, .001, v * .6, 0, .1);
      this.osz('triangle', 190, t, .15, g2);
    },
    hat(t, v, offen){
      v = v == null ? .18 : v;
      const g = this.huelle(t, .001, v, 0, offen ? .28 : .045);
      this.rauschen(t, offen ? .35 : .08, this.filter('highpass', 7500, 0, g));
    },
    klatschen(t, v){
      v = v == null ? .4 : v;
      [0, .012, .024].forEach(d => {
        const g = this.huelle(t + d, .001, v, 0, .09);
        this.rauschen(t + d, .12, this.filter('bandpass', 1200, 1.2, g));
      });
    },
    becken(t, v){
      v = v == null ? .35 : v;
      const g = this.huelle(t, .002, v, 0, 1.8);
      this.rauschen(t, 2, this.filter('highpass', 5000, 0, g));
    },
    aufprall(t, v){
      v = v == null ? 1 : v;
      const g = this.huelle(t, .003, v, 0, 3);
      const o = this.osz('sine', 95, t, 3.2, g); o.frequency.exponentialRampToValueAtTime(28, t + 1.5);
      const g2 = this.huelle(t, .002, v * .65, 0, 1.6);
      const lp = this.filter('lowpass', 1600, 0, g2);
      lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(140, t + 1.4);
      this.rauschen(t, 1.8, lp);
    },
    anstieg(t, dauer, v){
      v = v == null ? .45 : v;
      const g = this.ctx.createGain(); g.connect(this.out);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dauer - .03); g.gain.setValueAtTime(0, t + dauer);
      const bp = this.filter('bandpass', 250, 5, g);
      bp.frequency.setValueAtTime(250, t); bp.frequency.exponentialRampToValueAtTime(5500, t + dauer);
      this.rauschen(t, dauer + .05, bp);
    },
    rauschen_wisch(t, dauer, v, von, bis){
      v = v == null ? .35 : v;
      const g = this.ctx.createGain(); g.connect(this.out);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dauer * .55); g.gain.exponentialRampToValueAtTime(.0001, t + dauer);
      const bp = this.filter('bandpass', von || 300, 2.5, g);
      bp.frequency.setValueAtTime(von || 300, t); bp.frequency.exponentialRampToValueAtTime(bis || 4000, t + dauer);
      this.rauschen(t, dauer + .05, bp);
    },
    /* Gezupfte Saite (Karplus-Strong): ein Rauschstoß läuft durch eine
       Verzögerung mit Rückkopplung und Tiefpass - klingt wie eine Gitarre
       oder Ukulele. */
    saite(t, f, v, dauer){
      v = v == null ? .3 : v; dauer = dauer || 1.6;
      const c = this.ctx;
      const d = c.createDelay(1); d.delayTime.value = 1 / f;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 8);
      const fb = c.createGain(); fb.gain.setValueAtTime(.985, t); fb.gain.setValueAtTime(0, t + dauer);
      d.connect(lp); lp.connect(fb); fb.connect(d);
      const aus = this.huelle(t, .002, v, dauer * .6, dauer * .4);
      lp.connect(aus);
      const stoss = c.createGain(); stoss.gain.value = 1; stoss.connect(d);
      this.rauschen(t, 1 / f * 1.2, stoss);
      this.fb.push(fb);
    },
    /* Fläche: verstimmte Sägezähne durch einen Tiefpass. */
    flaeche(t, freqs, dauer, v, cutoff, a){
      v = v == null ? .06 : v; a = a == null ? 2 : a;
      const g = this.huelle(t, a, v, Math.max(0, dauer - a - 1.5), 1.5);
      const lp = this.filter('lowpass', cutoff || 900, .7, g);
      freqs.forEach(f => [-.004, .004].forEach(dt => this.osz('sawtooth', f * (1 + dt), t, dauer + .2, lp)));
    },
    /* Bläser-Stoß: Sägezahn-Akkord, Filter öffnet und schließt schnell. */
    stoss(t, freqs, v, dauer){
      v = v == null ? .12 : v; dauer = dauer || .9;
      const g = this.huelle(t, .015, v, dauer * .3, dauer * .7);
      const lp = this.filter('lowpass', 400, 1.2, g);
      lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(3800, t + .06); lp.frequency.exponentialRampToValueAtTime(700, t + dauer);
      freqs.forEach(f => [-.006, 0, .006].forEach(dt => this.osz('sawtooth', f * (1 + dt), t, dauer + .1, lp)));
    },
    ping(t, f, v, dauer){
      v = v == null ? .12 : v; dauer = dauer || 1.4;
      const g = this.huelle(t, .002, v, 0, dauer);
      this.osz('sine', f, t, dauer + .1, g);
      const g2 = this.huelle(t, .002, v * .25, 0, dauer * .5);
      this.osz('sine', f * 2.76, t, dauer, g2);
    },
    klick(t, v, f){
      v = v == null ? .25 : v;
      const g = this.huelle(t, .0005, v, 0, .018);
      this.rauschen(t, .03, this.filter('bandpass', f || 3200, 1.5, g));
    },
    bass(t, f, dauer, v){
      v = v == null ? .3 : v;
      const g = this.huelle(t, .005, v, dauer * .5, dauer * .5);
      const lp = this.filter('lowpass', 500, 2, g);
      lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(260, t + dauer);
      this.osz('sawtooth', f, t, dauer + .05, lp);
      this.osz('square', f / 2, t, dauer + .05, this.gain(.4, lp));
    },
    /* Trommelwirbel: Snare-Schläge, immer dichter und lauter. */
    wirbel(t, dauer, v){
      v = v == null ? .35 : v;
      for (let s = 0; s < dauer; ){
        const p = s / dauer;
        this.snare(t + s, v * (.3 + .7 * p) * (.85 + Math.random() * .3));
        s += .07 - .035 * p;
      }
    },
    /* Publikum: breites Rauschen als Jubel, darin vereinzeltes Klatschen. */
    jubel(t, v, dauer){
      v = v == null ? .3 : v; dauer = dauer || 4;
      const g = this.huelle(t, .3, v, dauer * .4, dauer * .6);
      this.rauschen(t, dauer + .5, this.filter('bandpass', 1600, .5, g));
      for (let k = 0; k < dauer * 7; k++) this.klatschen(t + .2 + Math.random() * dauer * .8, v * .4);
    },
    /* Chiptune: Rechteckton mit hartem Ende, wie aus einer alten Konsole. */
    piep(t, f, dauer, v, typ){
      v = v == null ? .08 : v;
      const g = this.huelle(t, .002, v, dauer * .8, dauer * .2);
      this.osz(typ || 'square', f, t, dauer + .02, g);
    },
    /* Tusch: Orchesterschlag aus Aufprall, Bläser-Akkord und Becken. */
    tusch(t, freqs, v){
      v = v == null ? 1 : v;
      this.aufprall(t, v); this.becken(t, .4 * v);
      this.stoss(t, freqs || [261.63, 329.63, 392, 523.25], .14 * v, 1.6);
    },
    /* Motor: Sägezahn mit wackelnder Drehzahl durch einen Tiefpass. */
    motor(t, dauer, von, bis, v){
      v = v == null ? .12 : v;
      const g = this.huelle(t, .2, v, dauer - .5, .3);
      const lp = this.filter('lowpass', 900, 3, g);
      const o = this.osz('sawtooth', von, t, dauer, lp); o.frequency.exponentialRampToValueAtTime(bis, t + dauer);
      const o2 = this.osz('square', von / 2, t, dauer, this.gain(.5, lp)); o2.frequency.exponentialRampToValueAtTime(bis / 2, t + dauer);
    },
    /* Pfeifen einer aufsteigenden Rakete. */
    pfiff(t, dauer, v){
      v = v == null ? .05 : v;
      const g = this.huelle(t, .05, v, dauer - .1, .05);
      const o = this.osz('sine', 900, t, dauer, g); o.frequency.exponentialRampToValueAtTime(2600, t + dauer);
    },
  };

  /* ── Explosion: Teilchen fliegen von einem Punkt weg und fallen ────────
     Hängt alles an die übergebene Zeitleiste, damit sie spulbar bleibt.
     o: n, farben, x/y (Prozent des Behälters), weite (Anteil der kürzeren
     Bildschirmkante), groesse [min,max] px, dauer [min,max] s, fall (px),
     rund (Kreise statt Rechtecke), z (z-index), glanz (Leuchten). */
  function explosion(tl, behaelter, t, o){
    o = Object.assign({ n: 60, farben: ['#ffd24d', '#ffffff'], x: 50, y: 50, weite: .5, groesse: [6, 14], dauer: [1.3, 2.3], fall: .35, rund: false, z: 5, glanz: false }, o || {});
    const R = gsap.utils.random, kante = Math.min(innerWidth, innerHeight);
    for (let k = 0; k < o.n; k++){
      const el = document.createElement('i');
      const g = R(o.groesse[0], o.groesse[1]), f = o.farben[k % o.farben.length];
      el.style.cssText = `position:absolute;left:${o.x}%;top:${o.y}%;width:${g}px;height:${o.rund ? g : g * 1.5}px;margin:${-g / 2}px;background:${f};`
        + `border-radius:${o.rund ? '50%' : '2px'};opacity:0;pointer-events:none;z-index:${o.z};${o.glanz ? `box-shadow:0 0 ${g}px ${g / 3}px ${f};` : ''}`;
      behaelter.appendChild(el);
      const w = R(0, Math.PI * 2), weit = R(.25, 1) * o.weite * kante, d = R(o.dauer[0], o.dauer[1]);
      const dx = Math.cos(w) * weit, dy = Math.sin(w) * weit * .8;
      tl.set(el, { opacity: 1, x: 0, y: 0, rotation: 0, rotationX: 0 }, t)
        .to(el, { x: dx, duration: d, ease: 'power2.out' }, t)
        .to(el, { y: dy, duration: d * .4, ease: 'power2.out' }, t)
        .to(el, { y: dy + o.fall * kante, duration: d * .6, ease: 'power2.in' }, t + d * .4)
        .to(el, { rotation: R(-540, 540), rotationX: o.rund ? 0 : R(0, 900), duration: d, ease: 'none' }, t)
        .to(el, { opacity: 0, duration: .45 }, t + d - .45);
    }
  }

  /* ── Rahmen: Start, Bedienleiste, Zeitleiste ──────────────────────────
     cfg = {
       name, untertitel,
       aufbauen()       schreibt das Markup frisch (bei jedem Neustart)
       bauen(tl)        hängt alles an die Zeitleiste
       ton(t0, Ton)     plant den Ton ab t0 ein
     } */
  function starte(cfg){
    const start = document.createElement('div');
    start.id = 'lab-start';
    start.tabIndex = 0;
    start.setAttribute('role', 'button');
    start.innerHTML = `<b>${esc(cfg.name)}</b><span>${esc(cfg.untertitel || 'Klicken zum Starten · mit Ton')}</span>`;
    const leiste = document.createElement('div');
    leiste.id = 'lab-leiste';
    leiste.className = 'weg';
    leiste.innerHTML = `
      <a href="../" title="Alle Intros">◱ Übersicht</a>
      <button data-a="neu">↻ Von vorn</button>
      <button data-a="pause">⏸ Pause</button>
      <button data-a="ton">🔊 Ton an</button>
      <input type="range" min="0" max="1000" value="0" aria-label="Zeitleiste">
      <span class="zeit">0,0 s</span>`;
    document.body.append(start, leiste);
    const regler = leiste.querySelector('input'), zeitTxt = leiste.querySelector('.zeit');
    const bPause = leiste.querySelector('[data-a=pause]'), bTon = leiste.querySelector('[data-a=ton]');
    let tl = null;

    function vorbereiten(){
      if (tl) tl.kill();
      gsap.globalTimeline.getChildren(false, true, false).forEach(t => { if (!t.vars || !t.vars.dauerhaft) t.kill(); });
      cfg.aufbauen();
      tl = gsap.timeline({ paused: true, onUpdate: () => {
        regler.value = String(Math.round(tl.progress() * 1000));
        zeitTxt.textContent = tl.time().toFixed(1).replace('.', ',') + ' s';
      } });
      cfg.bauen(tl);
      return tl;
    }
    function abspielen(){
      vorbereiten();
      tl.play(0);
      const t0 = Ton.neu();
      if (cfg.ton) cfg.ton(t0, Ton);
      bPause.textContent = '⏸ Pause';
    }
    /* Alle Schriften der Seite vorab laden: der Browser holt eine Schrift
       sonst erst, wenn sie zum ersten Mal sichtbar wird - dann stünde der
       Titel im Höhepunkt kurz in der Ersatzschrift da. */
    const schriften = () => Promise.all([...document.fonts].map(f => f.load().catch(() => null)));
    const los = () => { start.remove(); schriften().then(abspielen); };
    start.addEventListener('click', los);
    start.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); los(); } });
    start.focus();
    leiste.querySelector('[data-a=neu]').onclick = abspielen;
    bPause.onclick = () => {
      if (!tl) return;
      const p = !tl.paused();
      tl.paused(p);
      if (Ton.ctx) (p ? Ton.ctx.suspend() : Ton.ctx.resume());
      bPause.textContent = p ? '▶ Weiter' : '⏸ Pause';
    };
    bTon.onclick = () => { Ton.laut(!Ton.an); bTon.textContent = Ton.an ? '🔊 Ton an' : '🔇 Ton aus'; };
    /* Spulen und eingeplanter Ton passen nicht zusammen: beim Spulen
       schweigt der Ton, bis "Von vorn" ihn wieder gleichzeitig startet. */
    regler.oninput = () => {
      if (!tl) return;
      tl.pause(); bPause.textContent = '▶ Weiter';
      Ton.laut(false); bTon.textContent = '🔇 Ton aus';
      tl.progress(Number(regler.value) / 1000, false);
    };
    let timer = 0;
    addEventListener('mousemove', () => {
      leiste.classList.remove('weg');
      clearTimeout(timer);
      timer = setTimeout(() => leiste.classList.add('weg'), 2200);
    });
    /* Für Prüfungen von außen: ohne Ton aufbauen und an eine Stelle springen. */
    window.lab = {
      get tl(){ return tl; },
      zeige(t){ start.remove(); vorbereiten(); tl.pause(); tl.seek(t, false); return tl.duration(); },
    };
  }

  window.Lab = { SHOW, esc, zeichen, Ton, starte, explosion };
})();
