// Politur Richtung S (Art déco): schwarzer Lack mit Korn, Goldflaechen mit Tiefe, langsam drehende Strahlen.
const { noise, run, injectHead } = require('./lib.js');
const GRAIN = noise({ rgb: [255, 235, 190], alpha: .18, freq: .9, seed: 23 });
const PAPER = noise({ rgb: [120, 95, 55], alpha: .24, freq: .7, oct: 3, seed: 6, size: 160 });

run('S', (s) => {
  const has = (x) => s.includes(x);
  // Raum
  if (/width:\s*(1280|390)px;\s*height:\s*(720|844)px/.test(s) && /background:\s*#0B0A08/.test(s) && has('overflow:hidden')) {
    if (has('background-image:radial-gradient')) {
      s = s.replace('background-image:radial-gradient', 'background-image:url(' + GRAIN + '),radial-gradient');
      s = s.replace('background:#0B0A08', 'background:#0B0A08;background-blend-mode:soft-light,normal');
    } else {
      s = s.replace('background:#0B0A08', 'background:url(' + GRAIN + '),radial-gradient(ellipse 80% 60% at 50% 0%,rgba(217,182,107,.09) 0%,rgba(217,182,107,0) 70%),#0B0A08;background-blend-mode:soft-light,normal,normal');
    }
    return s + ';box-shadow:inset 0 0 150px rgba(0,0,0,.65)';
  }
  // Goldleisten (74px, Menue/Listen)
  if (/^height:74px;margin:0 14px 8px;display:flex;align-items:center;justify-content:center;background:linear-gradient/.test(s))
    return s + ';box-shadow:inset 0 1px 0 rgba(255,255,255,.65),inset 0 -2px 0 rgba(90,60,10,.45),0 3px 10px rgba(0,0,0,.6)';
  if (/^position:relative;height:104px;background:linear-gradient\(180deg,#E9CF8F 0%,#B8954F 50%,#8C6E33 100%\)/.test(s))
    return s.replace('box-shadow:inset 0 0 0 2px #6E5326,inset 0 2px 0 rgba(255,255,255,.4)', 'box-shadow:inset 0 0 0 2px #6E5326,inset 0 3px 0 rgba(255,255,255,.55),inset 0 -4px 6px rgba(70,45,5,.4),0 8px 16px rgba(0,0,0,.55)');
  // Bogen-Plaketten
  if (/^width:150px;height:84px;border-radius:84px 84px 0 0;background:linear-gradient/.test(s))
    return s.replace('box-shadow:0 8px 16px rgba(0,0,0,.6)', 'box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -3px 5px rgba(70,45,5,.4),0 10px 20px rgba(0,0,0,.6)');
  // schwarzer Lack: Glanzkante und Tiefe
  if (/^width:100%;height:100%;background:#100E0A;clip-path/.test(s) === false && /^background:#100E0A;outline:1px solid rgba\(217,182,107,\.25\)/.test(s))
    return s + ';box-shadow:inset 0 1px 0 rgba(255,255,255,.06),inset 0 0 40px rgba(0,0,0,.65)';
  if (/^position:relative;height:104px;background:#1A160E;box-shadow:inset 0 0 0 2px #8C6E33,inset 0 10px 24px rgba\(0,0,0,\.7\)/.test(s))
    return s.replace('inset 0 10px 24px rgba(0,0,0,.7)', 'inset 0 10px 24px rgba(0,0,0,.7),inset 0 -1px 0 rgba(217,182,107,.25)');
  // Eintrittskarten
  if (/background:#EFE6D2;color:#0B0A08;padding:10px 16px;box-shadow:0 6px 12px rgba\(0,0,0,\.5\)/.test(s)) {
    s = s.replace('background:#EFE6D2', 'background:url(' + PAPER + '),linear-gradient(170deg,#FAF3E2 0%,#EFE6D2 55%,#DDD0B2 100%);background-blend-mode:multiply,normal');
    return s.replace('box-shadow:0 6px 12px rgba(0,0,0,.5)', 'box-shadow:inset 0 1px 0 rgba(255,255,255,.8),0 2px 2px rgba(0,0,0,.4),0 10px 18px rgba(0,0,0,.5)');
  }
  // Goldknoepfe
  if (/border-radius:6px;background:linear-gradient\(180deg,#FBEBC0,#C9A762\)/.test(s)) return s.replace('box-shadow:inset 0 0 0 1px #6E5326', 'box-shadow:inset 0 0 0 1px #6E5326,inset 0 2px 0 rgba(255,255,255,.6),0 3px 6px rgba(0,0,0,.5)');
  return s;
});

injectHead('S', `
@keyframes s-spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
[style*="repeating-conic-gradient(from 90deg,rgba(217,182,107,0.12)"]{animation:s-spin 240s linear infinite}
@media (prefers-reduced-motion:reduce){[style]{animation:none!important}}
`);
