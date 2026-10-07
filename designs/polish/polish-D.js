// Politur Richtung D (Late Night): flaches Schwarz -> Filmkorn, Lichtkegel, Tiefe; Orange bekommt Glut.
const { noise, run, px } = require('./lib.js');
const GRAIN = noise({ alpha: .22, freq: .85, seed: 11 });
const PAPER = noise({ rgb: [110, 95, 60], alpha: .30, freq: .7, oct: 3, seed: 3, size: 160 });
const ORANGE = '#FF5B1F';
const team = { '#E8453C': '232,69,60', '#3B82F6': '59,130,246', '#22C55E': '34,197,94' };

run('D', (s) => {
  const has = (x) => s.includes(x);
  const root = /width:\s*(1280|390)px/.test(s) && /height:\s*(720|800|844)px/.test(s) && /background:\s*#0E0E0E/.test(s);
  if (root) {
    s = s.replace(/background:\s*#0E0E0E/, 'background:url(' + GRAIN + '),radial-gradient(ellipse 75% 60% at 15% -5%,rgba(255,91,31,.13) 0%,rgba(255,91,31,0) 62%),radial-gradient(ellipse 120% 100% at 50% 40%,#151515 0%,#0A0A0A 100%);background-blend-mode:soft-light,normal,normal');
    s += ';box-shadow:inset 0 0 150px rgba(0,0,0,.65)';
  }
  // Papierkarten
  if (has('background:#F2EFE6') && has('box-shadow:0 18px 30px rgba(0,0,0,.6)')) {
    s = s.replace('background:#F2EFE6', 'background:url(' + PAPER + '),linear-gradient(170deg,#FBF9F2 0%,#F2EFE6 55%,#E6E1D2 100%);background-blend-mode:multiply,normal');
    s = s.replace('box-shadow:0 18px 30px rgba(0,0,0,.6)', 'box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 -2px 0 rgba(0,0,0,.08),0 2px 2px rgba(0,0,0,.4),0 10px 14px rgba(0,0,0,.35),0 30px 50px rgba(0,0,0,.6)');
  }
  // grosser Orange-Block
  if (has('background:#FF5B1F;color:#0E0E0E') && has('font-size:118px')) {
    s = s.replace('background:#FF5B1F', 'background:linear-gradient(180deg,#FF7D42 0%,#FF5B1F 42%,#DE470F 100%)');
    s += ';box-shadow:inset 0 2px 0 rgba(255,255,255,.4),inset 0 -14px 30px rgba(120,28,0,.4),0 0 70px rgba(255,91,31,.28),0 24px 44px rgba(0,0,0,.55)';
  }
  // Skyline: Gebaeude mit Kantenlicht, Fenster mit Glut
  if (has('background:#161616') && has('grid-auto-rows:10px')) {
    s = s.replace('background:#161616', 'background:linear-gradient(180deg,#232323 0%,#161616 35%,#0F0F0F 100%)');
    s += ';box-shadow:inset 1px 0 0 rgba(255,255,255,.06),inset 0 1px 0 rgba(255,255,255,.1),0 -2px 18px rgba(255,91,31,.05)';
  }
  if (s === 'background:#FF5B1F;opacity:0.8') s += ';box-shadow:0 0 9px rgba(255,91,31,.85),0 0 2px #FFC1A3';
  if (s === 'background:#3A2A1A;opacity:0.6') s += ';box-shadow:inset 0 0 3px rgba(0,0,0,.5)';
  // Balken
  if (s === 'width:100%;height:6px;background:#5A5A5A') s = 'width:100%;height:6px;background:linear-gradient(90deg,#5A5A5A,#8C8C8C);border-radius:3px;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 0 8px rgba(255,255,255,.05)';
  if (s === 'width:100%;height:6px;background:#2A2A2A') s += ';border-radius:3px;box-shadow:inset 0 1px 3px rgba(0,0,0,.7)';
  if (/^height:3px;background:#2A2A2A/.test(s)) s += ';border-radius:2px;box-shadow:inset 0 1px 2px rgba(0,0,0,.7)';
  // Leiste
  if (has('height:44px;display:flex;align-items:center;gap:14px;padding:0 18px;background:#2A2A2A')) {
    s = s.replace('background:#2A2A2A', 'background:linear-gradient(180deg,#343434,#262626)');
    s += ';box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 6px 14px rgba(0,0,0,.4)';
  }
  // Teamfarben-Punkte
  const dot = /^width:(12|16)px;height:\1px;border-radius:50%;background:(#E8453C|#3B82F6|#22C55E)$/.exec(s);
  if (dot) {
    const c = dot[2];
    s = s.replace('background:' + c, 'background:radial-gradient(circle at 35% 30%,#fff 0%,' + c + ' 40%,' + c + ' 100%)');
    s += ';box-shadow:0 0 0 3px rgba(' + team[c] + ',.18),0 0 12px rgba(' + team[c] + ',.7)';
  }
  // Fehler-Kaesten (X)
  if (/border:2px solid #E8453C;background:rgba\(232,69,60,\.18\)/.test(s)) s += ';box-shadow:inset 0 0 16px rgba(232,69,60,.4),0 0 20px rgba(232,69,60,.22);text-shadow:0 0 14px rgba(232,69,60,.8)';
  // Orange Schrift: Glut
  const fs = px(s, 'font-size');
  if (fs && fs >= 34 && /color:#FF5B1F|-webkit-text-stroke:2px #FF5B1F/.test(s) && !/text-shadow/.test(s)) s += ';text-shadow:0 0 26px rgba(255,91,31,.45)';
  // grosse weisse Schrift: ruhiger Schatten fuer Plastizitaet
  if (fs && fs >= 90 && /Big Shoulders/.test(s) && !/text-shadow/.test(s)) s += ';text-shadow:0 3px 0 rgba(0,0,0,.45),0 14px 40px rgba(0,0,0,.5)';
  // Zeilen (Listen, Tafeln): weicher Lichtverlauf von links, Grundlinie mit Glanzkante
  if (/^display:grid;grid-template-columns:[^;]*;align-items:center;(min-)?height:\d+px;border-(top|bottom):[^;]*solid #2A2A2A/.test(s) && !/background/.test(s))
    s += ';background:linear-gradient(90deg,rgba(255,255,255,.045) 0%,rgba(255,255,255,.012) 55%,rgba(255,255,255,0) 100%);box-shadow:0 1px 0 rgba(255,255,255,.03)';
  if (/background:\s*transparent;\s*border:\s*none;\s*border-bottom:\s*1px solid #2A2A2A/.test(s)) s = s.replace(/background:\s*transparent/, 'background: linear-gradient(90deg,rgba(255,255,255,.05),rgba(255,255,255,0) 65%)');
  return s;
});
