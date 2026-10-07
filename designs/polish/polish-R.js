// Politur Richtung R (Jazzplatte): Plattenhuellen aus Karton, Vinyl mit Glanz, Studio-Raum mit Korn.
const { noise, run, light, dark } = require('./lib.js');
const GRAIN = noise({ rgb: [255, 240, 220], alpha: .18, freq: .9, seed: 17 });
const BOARD = noise({ rgb: [60, 40, 20], alpha: .32, freq: .6, oct: 3, seed: 5, size: 180 });
const SHEEN = 'conic-gradient(from 20deg,rgba(255,255,255,0) 0deg,rgba(255,255,255,.13) 22deg,rgba(255,255,255,0) 58deg,rgba(255,255,255,0) 180deg,rgba(255,255,255,.10) 202deg,rgba(255,255,255,0) 238deg,rgba(255,255,255,0) 360deg)';

run('R', (s) => {
  const has = (x) => s.includes(x);
  // Raum
  if (/width:\s*(1280|390)px;\s*height:\s*(720|844)px/.test(s) && /background:\s*#111111/.test(s)) {
    s = s.replace(/background:\s*#111111/, 'background:url(' + GRAIN + '),radial-gradient(ellipse 90% 70% at 30% 0%,rgba(242,169,0,.10) 0%,rgba(242,169,0,0) 60%),radial-gradient(ellipse 120% 100% at 50% 40%,#171717 0%,#0C0C0C 100%);background-blend-mode:soft-light,normal,normal');
    return s + ';box-shadow:inset 0 0 160px rgba(0,0,0,.6)';
  }
  // Huellen und Farbbloecke aus Karton
  const m = /background:(#F2A900|#E4572E|#2F6DF6|#E8453C|#444|#F4F1EA);/.exec(s + ';');
  const isCover = m && (/^height:230px/.test(s) || /^position:absolute;left:0;top:0;width:720px;height:720px/.test(s) || /^height:86px;display:flex;align-items:center;justify-content:center;border-top/.test(s));
  if (isCover) {
    const c = m[1].length === 4 ? '#444444' : m[1];
    s = s.replace('background:' + m[1], 'background:url(' + BOARD + '),linear-gradient(165deg,' + light(c, .12) + ' 0%,' + c + ' 45%,' + dark(c, .14) + ' 100%);background-blend-mode:multiply,normal');
    s += ';box-shadow:inset 1px 1px 0 rgba(255,255,255,.22),inset -1px -1px 0 rgba(0,0,0,.25),inset 0 -40px 50px rgba(0,0,0,.14)';
    return s;
  }
  // Vinyl
  if (/border-radius:50%;background:repeating-radial-gradient\(circle,#(0A0A0A|161616) 0 2px,#(1D1D1D|0B0B0B|0C0C0C) 2px (3|4)px\)/.test(s)) {
    s = s.replace('background:repeating-radial-gradient', 'background:' + SHEEN + ',repeating-radial-gradient');
    return s;
  }
  if (/background:repeating-radial-gradient\(circle,#161616 0 2px,#0C0C0C 2px 4px\)/.test(s) && /border-radius:50%/.test(s)) {
    s = s.replace('background:repeating-radial-gradient', 'background:' + SHEEN + ',repeating-radial-gradient');
    return s;
  }
  // gelbes/orangenes Etikett auf der Platte
  if (/^position:absolute;left:[^;]*;top:[^;]*;width:(170|129)px;height:\1px;transform:translate\(-50%,-50%\);border-radius:50%;background:(#F2A900|#E4572E)/.test(s)) {
    const c = /background:(#F2A900|#E4572E)/.exec(s)[1];
    s = s.replace('background:' + c, 'background:radial-gradient(circle at 38% 30%,' + light(c, .25) + ' 0%,' + c + ' 55%,' + dark(c, .2) + ' 100%)');
    return s + ';box-shadow:inset 0 0 0 2px rgba(0,0,0,.18),0 0 0 3px rgba(0,0,0,.35)';
  }
  // Papierkarten
  if (has('background: #F4F1EA; color: #111111; box-shadow: 0 14px 28px rgba(0,0,0,.5)')) {
    s = s.replace('background: #F4F1EA', 'background: url(' + BOARD + '), linear-gradient(165deg,#FBF8F0,#F4F1EA 55%,#E6E1D4); background-blend-mode: multiply, normal');
    s = s.replace('box-shadow: 0 14px 28px rgba(0,0,0,.5)', 'box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 2px 2px rgba(0,0,0,.4), 0 18px 32px rgba(0,0,0,.5)');
    return s;
  }
  // Tasten
  if (/^width:120px;height:70px;border-radius:12px 12px 6px 6px;background:linear-gradient\(180deg,#F4F1EA,#C9C4B8\)/.test(s)) {
    s = s.replace('background:linear-gradient(180deg,#F4F1EA,#C9C4B8)', 'background:linear-gradient(180deg,#FFFFFF 0%,#F4F1EA 35%,#D6D1C4 100%)');
    s = s.replace('box-shadow:0 8px 0 #7A766C', 'box-shadow:inset 0 2px 0 rgba(255,255,255,.9),inset 0 -3px 5px rgba(0,0,0,.12),0 8px 0 #7A766C');
    return s;
  }
  return s;
});
