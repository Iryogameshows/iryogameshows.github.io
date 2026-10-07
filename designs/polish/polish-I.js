// Politur Richtung I (Salon): flache Flaechen -> Filz, Papier, Chips mit Tiefe.
const fs = require('fs');
const dir = 'designs/s/';
const NOISE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .34 0'/></filter><rect width='220' height='220' filter='url(#n)'/></svg>").replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
const PAPER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='3' seed='3'/><feColorMatrix values='0 0 0 0 .45  0 0 0 0 .38  0 0 0 0 .25  0 0 0 .35 0'/></filter><rect width='160' height='160' filter='url(#p)'/></svg>").replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const shade = (h, f) => toHex(hex(h).map((v) => (f < 1 ? v * f : v + (255 - v) * (f - 1))));
const light = (h, t) => toHex(hex(h).map((v) => v + (255 - v) * t));
const dark = (h, t) => toHex(hex(h).map((v) => v * (1 - t)));

function restyle(s) {
  const has = (x) => s.includes(x);
  // 1) Filz-Tisch (Spielflaeche)
  if (has('radial-gradient(ellipse 80% 70% at 50% 45%,#164433 0%,#0C2A20 60%,#06170F 100%)')) {
    s = s.replace('background:radial-gradient(ellipse 80% 70% at 50% 45%,#164433 0%,#0C2A20 60%,#06170F 100%)',
      'background:url(' + NOISE + '),radial-gradient(ellipse 90% 80% at 50% 42%,#18503A 0%,#0F3526 40%,#082015 72%,#030E08 100%);background-blend-mode:soft-light,normal;box-shadow:inset 0 0 160px rgba(0,0,0,.65),inset 0 0 0 1px rgba(201,165,76,.18)');
  }
  // 2) goldener Doppelrand um den Tisch
  if (has('border:2px solid rgba(201,165,76,.45);border-radius:300px/120px') || has('border:2px solid rgba(201,165,76,.5);border-radius:300px/120px')) {
    s = s.replace(/border:2px solid rgba\(201,165,76,\.(45|5)\)/, 'border:1.5px solid rgba(226,190,98,.75);box-shadow:0 0 0 7px rgba(201,165,76,.10),0 0 0 8px rgba(201,165,76,.38),inset 0 0 0 7px rgba(201,165,76,.08),inset 0 0 60px rgba(0,0,0,.4),0 0 24px rgba(201,165,76,.12)');
  }
  // 3) Karten (Papier mit Goldrahmen, Fuellung innen)
  if (/background:#F4EEDF/.test(s) && /border(-radius)?:[^;]*(12px|20px)/.test(s) && has('box-shadow:0 10px 24px rgba(0,0,0,.45)')) {
    s = s.replace('background:#F4EEDF', 'background:url(' + PAPER + '),linear-gradient(165deg,#FFFBEF 0%,#F4EEDF 45%,#E9DFC4 100%);background-blend-mode:multiply,normal');
    s = s.replace('box-shadow:0 10px 24px rgba(0,0,0,.45)', 'box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 -1px 0 rgba(120,95,40,.22),0 1px 1px rgba(0,0,0,.4),0 4px 6px rgba(0,0,0,.28),0 16px 30px rgba(0,0,0,.45);outline:1px solid rgba(201,165,76,.45);outline-offset:-7px');
    s = s.replace('border:1px solid #C9A54C', 'border:1px solid #B9964A');
  } else if (has('background:#F4EEDF') && has('box-shadow:0 20px 40px rgba(0,0,0,.55)')) {
    s = s.replace('background:#F4EEDF', 'background:url(' + PAPER + '),linear-gradient(165deg,#FFFBEF 0%,#F4EEDF 45%,#E9DFC4 100%);background-blend-mode:multiply,normal');
    s = s.replace('box-shadow:0 20px 40px rgba(0,0,0,.55)', 'box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 -2px 0 rgba(120,95,40,.25),0 2px 2px rgba(0,0,0,.4),0 8px 12px rgba(0,0,0,.3),0 28px 50px rgba(0,0,0,.55);outline:2px solid rgba(201,165,76,.5);outline-offset:-12px');
  }
  // 4) verdeckte Karten (Rueckseite)
  if (has('repeating-linear-gradient(45deg,#8E1B2C 0 8px,#6E1422 8px 16px)')) {
    s = s.replace('background:repeating-linear-gradient(45deg,#8E1B2C 0 8px,#6E1422 8px 16px)',
      'background:repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 1px,transparent 1px 8px),repeating-linear-gradient(-45deg,rgba(255,255,255,.07) 0 1px,transparent 1px 8px),radial-gradient(ellipse at 50% 40%,#A82339 0%,#8E1B2C 55%,#5F0F1D 100%)');
    s = s.replace(/box-shadow:0 10px 24px rgba\(0,0,0,\.45\)/, 'box-shadow:inset 0 0 0 1px rgba(0,0,0,.35),inset 0 0 22px rgba(0,0,0,.35),0 1px 1px rgba(0,0,0,.4),0 4px 6px rgba(0,0,0,.28),0 16px 30px rgba(0,0,0,.45)');
    s = s.replace('border:6px solid #F4EEDF', 'border:6px solid #F1E9D2');
  }
  // 4b) grosse Schrift in Creme auf dem Filz: leichter Schlagschatten
  if (/font-family:'Cormorant Garamond'/.test(s) && /color:#F4EEDF/.test(s) && /font-size:(d+)px/.test(s) && +/font-size:(d+)px/.exec(s)[1] >= 40 && !/text-shadow/.test(s)) s += ";text-shadow:0 2px 0 rgba(0,0,0,.35),0 10px 28px rgba(0,0,0,.45)";
  // 5) Chips: gestrichelter Rand bleibt (Kennzeichen), dazu Ring, Kante und Schatten
  const m = s.match(/background:(#[0-9A-Fa-f]{6});border:(\d+)px dashed (#F4EEDF|#fff)/);
  if (m && /border-radius:50%/.test(s)) {
    const c = m[1], bw = +m[2], edge = m[3];
    const big = /width:(\d+)px/.exec(s); const w = big ? +big[1] : 22;
    const flat = /height:2\dpx/.test(s) && /width:1[012]0px/.test(s); // flache Stapel-Chips (Ellipsen)
    const ring = Math.max(2, Math.round(w / 11));
    const dk = dark(c, .5), lt = light(c, .28);
    const sh = flat
      ? `0 2px 0 ${dk},0 3px 0 rgba(0,0,0,.35),0 5px 6px rgba(0,0,0,.4),inset 0 0 0 ${ring}px ${c},inset 0 0 0 ${ring + 1}px rgba(255,255,255,.5)`
      : `inset 0 0 0 ${ring}px ${c},inset 0 0 0 ${ring + 1}px rgba(255,255,255,.55),inset 0 -${ring + 1}px ${ring + 2}px rgba(0,0,0,.35),inset 0 ${ring}px ${ring}px rgba(255,255,255,.2),0 2px 0 ${dk},0 6px 10px rgba(0,0,0,.5)`;
    s = s.replace(`background:${c};border:${bw}px dashed ${edge}`, `background:radial-gradient(circle at 38% 30%,${lt} 0%,${c} 48%,${dark(c, .3)} 100%);border:${bw}px dashed ${edge}`);
    s = s.replace(/box-shadow:0 6px 12px rgba\(0,0,0,\.4\)/, 'box-shadow:' + sh);
    if (!/box-shadow/.test(s)) s += ';box-shadow:' + sh;
  }
  // 6) Spielautomat (Handy): Gehaeuse, Walzen, Hebel
  if (has('border-radius:120px 120px 20px 20px') && has('linear-gradient(180deg,#8E1B2C,#5A0F1A)')) {
    s = s.replace('background:linear-gradient(180deg,#8E1B2C,#5A0F1A);border:6px solid #C9A54C', 'background:linear-gradient(90deg,rgba(0,0,0,.38) 0%,rgba(255,255,255,0) 20%,rgba(255,255,255,.13) 36%,rgba(255,255,255,0) 52%,rgba(0,0,0,.42) 100%),linear-gradient(180deg,#A82339 0%,#8E1B2C 28%,#5A0F1A 100%);border:6px solid #C9A54C;border-color:#EBCB7A #BC9A4B #8F6F28 #BC9A4B;box-shadow:inset 0 0 0 2px rgba(255,236,170,.5),inset 0 0 0 5px rgba(60,8,16,.85),inset 0 18px 34px rgba(255,255,255,.1),0 2px 0 #6B521A,0 26px 44px rgba(0,0,0,.6)');
  }
  if (has('background:#1B1A17;padding:8px;border-radius:8px')) s += ';box-shadow:inset 0 4px 10px rgba(0,0,0,.85),0 0 0 2px #C9A54C,0 1px 0 2px rgba(255,255,255,.2)';
  if (has('linear-gradient(180deg,#bbb 0%,#fff 30%,#fff 70%,#bbb 100%)')) {
    s = s.replace('linear-gradient(180deg,#bbb 0%,#fff 30%,#fff 70%,#bbb 100%)', 'linear-gradient(180deg,#7d786a 0%,#cfc9b6 13%,#F6F0DF 34%,#FFFDF5 50%,#F6F0DF 66%,#cfc9b6 87%,#7d786a 100%)');
    s += ';box-shadow:inset 0 0 14px rgba(0,0,0,.35)';
  }
  if (has('width:150px;height:60px;border-radius:10px;background:#1B1A17;border:3px solid #C9A54C')) s += ';box-shadow:inset 0 4px 10px rgba(0,0,0,.9),0 1px 0 rgba(255,255,255,.18);background:linear-gradient(180deg,#0F0E0C,#242220)';
  if (has('radial-gradient(circle at 35% 35%,#ff6b6b,#8E1B2C)')) {
    s = s.replace('radial-gradient(circle at 35% 35%,#ff6b6b,#8E1B2C)', 'radial-gradient(circle at 32% 28%,#ffd9d9 0%,#ff6b6b 16%,#C4283F 48%,#6E1422 100%)');
    s += ';box-shadow:0 10px 16px rgba(0,0,0,.5),inset 0 -5px 9px rgba(0,0,0,.35)';
  }
  if (has('background:linear-gradient(90deg,#999,#eee,#999)')) {
    s = s.replace('linear-gradient(90deg,#999,#eee,#999)', 'linear-gradient(90deg,#5f5f5f 0%,#c9c9c9 28%,#ffffff 44%,#b9b9b9 62%,#5f5f5f 100%)');
    s += ';box-shadow:6px 0 10px rgba(0,0,0,.35)';
  }
  if (has('width:62px;height:70px;border-radius:12px;background:#C9A54C')) {
    s = s.replace('background:#C9A54C', 'background:linear-gradient(180deg,#F1D88C 0%,#D6B461 35%,#B8923F 70%,#8F6F28 100%)');
    s += ';box-shadow:inset 0 2px 0 rgba(255,255,255,.55),inset 0 -3px 5px rgba(0,0,0,.3),0 8px 14px rgba(0,0,0,.5)';
  }
  return s;
}

let n = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.startsWith('I-'))) {
  let h = fs.readFileSync(dir + f, 'utf8');
  const h2 = h.replace(/style="([^"]*)"/g, (all, st) => { const r = restyle(st); if (r !== st) n++; return 'style="' + r + '"'; });
  if (h2 !== h) fs.writeFileSync(dir + f, h2);
}
console.log('geaenderte Style-Attribute:', n);
