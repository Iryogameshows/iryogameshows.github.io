// Politur Richtung L (New York): Zeitungspapier mit Faser, Falz, Druckerschwaerze mit Struktur.
const { noise, run, px } = require('./lib.js');
const FIBER = noise({ rgb: [130, 105, 60], alpha: .2, freq: .6, oct: 4, seed: 21, size: 240 });
const INK = noise({ rgb: [255, 245, 220], alpha: .16, freq: 1.1, oct: 2, seed: 8, size: 140 });
const FOLD = 'linear-gradient(90deg,transparent 49.3%,rgba(20,14,6,.10) 49.85%,rgba(255,250,235,.28) 50.15%,transparent 50.7%)';

run('L', (s) => {
  const has = (x) => s.includes(x);
  // Blatt: Faser, Falz, Alterung
  if (/background-color:\s*#(E2D8C0|928770)/.test(s) && /overflow:\s*hidden/.test(s)) {
    const desktop = /width:\s*1280px/.test(s);
    s = s.replace(/background-image:\s*/, 'background-image:url(' + FIBER + '),' + (desktop ? FOLD + ',' : ''));
    s += ';background-blend-mode:multiply,' + (desktop ? 'normal,' : '') + 'normal' + (desktop ? ',normal' : '') + ';box-shadow:inset 0 0 120px rgba(110,80,30,.16)';
    return s;
  }
  // Papierkarten
  if (/^background:#FBF6E8;border:2px solid #1A1712/.test(s)) {
    s = s.replace('background:#FBF6E8', 'background:url(' + FIBER + '),#FBF6E8;background-blend-mode:multiply');
    s += ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.55),inset 0 0 14px rgba(120,90,40,.12),1px 2px 0 rgba(26,23,18,.18)';
    return s;
  }
  // Druckerschwaerze (gefuellte Flaechen): ungleichmaessig deckend
  if (/^background:#1A1712;border:2px solid #1A1712/.test(s)) {
    s = s.replace('background:#1A1712', 'background:url(' + INK + '),#1A1712;background-blend-mode:screen');
    return s;
  }
  if (/^width:52px;height:52px;border:2px solid #1A1712;.*background:#1A1712;color:#E2D8C0$/.test(s)) {
    s = s.replace('background:#1A1712', 'background:url(' + INK + '),#1A1712;background-blend-mode:screen');
    return s;
  }
  // Rotstempel
  if (has('border:4px solid #E8453C;color:#E8453C')) {
    s += ';mix-blend-mode:multiply;box-shadow:inset 0 0 0 1px rgba(232,69,60,.5),0 0 1px rgba(232,69,60,.6);text-shadow:0 0 1px rgba(232,69,60,.7);opacity:.92';
    return s;
  }
  // Schlagzeilen: Farbe laeuft minimal in die Faser
  const f = px(s, 'font-size');
  if (f && f >= 26 && /Playfair|Old Standard|UnifrakturCook|Fraktur/.test(s) && !/text-shadow/.test(s)) s += ';text-shadow:0 0 1.2px rgba(26,23,18,.5),.5px .5px 0 rgba(26,23,18,.25)';
  return s;
});
