// Politur Richtung E (70er): flache Farbflaechen -> glaenzendes Email, Korn, Wärme, weiche Strahlen.
const { noise, run, px, light, dark } = require('./lib.js');
const GRAIN = noise({ rgb: [255, 220, 170], alpha: .22, freq: .8, seed: 9 });
const PAPER = noise({ rgb: [120, 80, 40], alpha: .28, freq: .7, oct: 3, seed: 4, size: 160 });

/** haengt einen Schatten an einen vorhandenen an (oder legt ihn an) */
function addShadow(s, extra) {
  const m = /box-shadow:([^;]*)/.exec(s);
  if (m) return s.replace(m[0], 'box-shadow:' + m[1] + ',' + extra);
  return s + ';box-shadow:' + extra;
}
const ENAMEL = {
  '#F2B33D': ['#FFCB5E', '#F2B33D', '#D99A1F'],
  '#E8622C': ['#FF8148', '#E8622C', '#C24A1B'],
  '#8C3A1A': ['#A8502B', '#8C3A1A', '#6E2C12'],
};

run('E', (s) => {
  const has = (x) => s.includes(x);
  // Raum
  if (/width:(1280|390)px;height:(720|844)px/.test(s) && /background:#2B1810/.test(s) && has('overflow:hidden')) {
    s = s.replace('background:#2B1810', 'background:url(' + GRAIN + '),radial-gradient(ellipse 100% 90% at 50% 28%,#3D2415 0%,#2B1810 52%,#1A0E08 100%);background-blend-mode:soft-light,normal');
    s += ';box-shadow:inset 0 0 170px rgba(0,0,0,.6)';
    return s;
  }
  // Strahlenkranz: zum Rand hin ausblenden
  if (has('repeating-conic-gradient') && has('position:absolute;inset:0')) s += ';-webkit-mask-image:radial-gradient(ellipse 90% 90% at 50% 100%,#000 10%,transparent 78%);mask-image:radial-gradient(ellipse 90% 90% at 50% 100%,#000 10%,transparent 78%)';
  // Papier
  if (has('background:#F6E7CB;padding:16px;border-radius:24px')) {
    s = s.replace('background:#F6E7CB', 'background:url(' + PAPER + '),linear-gradient(170deg,#FFF3DC 0%,#F6E7CB 55%,#E8D5B0 100%);background-blend-mode:multiply,normal');
    s = addShadow(s, 'inset 0 2px 0 rgba(255,255,255,.7),0 6px 0 rgba(0,0,0,.22),0 18px 30px rgba(0,0,0,.45)');
  }
  // Antwortbaender (volle Breite, ohne Rundung)
  const band = /^height:58px;background:(#F2B33D|#E8622C);/.exec(s);
  if (band) {
    const [hi, base, lo] = ENAMEL[band[1]];
    s = s.replace('background:' + band[1], `background:linear-gradient(180deg,${hi} 0%,${base} 55%,${lo} 100%)`);
    return addShadow(s, 'inset 0 3px 0 rgba(255,255,255,.4),inset 0 -4px 0 rgba(0,0,0,.18),0 5px 0 rgba(0,0,0,.3),0 12px 18px rgba(0,0,0,.35)');
  }
  if (/^height:58px;background:#3D2417/.test(s)) {
    s = s.replace('background:#3D2417', 'background:linear-gradient(180deg,#43281A,#341F13)');
    return addShadow(s, 'inset 0 2px 0 rgba(255,255,255,.05),inset 0 -3px 6px rgba(0,0,0,.3)');
  }
  // Email-Flaechen: Farbe + Rundung + volle Form
  const m = /background:(#F2B33D|#E8622C|#8C3A1A);?/.exec(s);
  if (m && /border-radius/.test(s) && !/gradient|opacity/.test(s) && /(width|height):\d+/.test(s)) {
    const c = m[1], [hi, base, lo] = ENAMEL[c];
    const round = /border-radius:50%/.test(s);
    s = s.replace(m[0], round ? `background:radial-gradient(circle at 36% 28%,${hi} 0%,${base} 52%,${lo} 100%);` : `background:linear-gradient(180deg,${hi} 0%,${base} 52%,${lo} 100%);`);
    s = addShadow(s, `inset 0 3px 0 rgba(255,255,255,.35),inset 0 -5px 0 rgba(0,0,0,.16),0 6px 0 ${dark(base, .55)},0 12px 20px rgba(0,0,0,.4)`);
    return s;
  }
  // Mattbraune Kacheln, Pillen, Rahmen (grosse Rundungen)
  const rad = /border-radius:(\d+)px|border-radius:999px/.exec(s);
  if (/background:#3D2417/.test(s) && rad && !/gradient/.test(s) && (rad[0].includes('999') || +rad[1] >= 24)) {
    s = s.replace('background:#3D2417', 'background:linear-gradient(180deg,#4B2D1C 0%,#3D2417 50%,#321D12 100%)');
    s = addShadow(s, 'inset 0 3px 0 rgba(255,255,255,.07),inset 0 -10px 18px rgba(0,0,0,.22),0 7px 0 rgba(0,0,0,.28),0 16px 24px rgba(0,0,0,.4)');
    return s;
  }
  // runde Knoepfe/Nieten in Braun (30px, 56px)
  if (/background:#3D2417/.test(s) && /border-radius:50%/.test(s) && !/gradient/.test(s)) {
    s = s.replace('background:#3D2417', 'background:radial-gradient(circle at 36% 28%,#5A3622 0%,#3D2417 55%,#2A170D 100%)');
    s = addShadow(s, 'inset 0 2px 0 rgba(255,255,255,.12),0 4px 0 rgba(0,0,0,.3),0 8px 12px rgba(0,0,0,.35)');
    return s;
  }
  // grosse Schrift in Shrikhand: harter Retro-Schatten
  const f = px(s, 'font-size');
  if (f && f >= 40 && /Shrikhand/.test(s) && !/text-shadow/.test(s)) s += ';text-shadow:0 3px 0 rgba(0,0,0,.28)';
  return s;
});
