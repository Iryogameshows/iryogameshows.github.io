// Politur Richtung A (Studio): Fernsehstudio - Glanz auf den Tafeln, Glühbirnen mit Kern, Korn und Vignette.
const { noise, run } = require('./lib.js');
const GRAIN = noise({ alpha: .16, freq: .85, seed: 5 });

run('A', (s) => {
  const has = (x) => s.includes(x);
  // Studio-Raum: Korn und Vignette
  if (/background: #070818/.test(s) && /overflow: hidden/.test(s)) {
    s = s.replace('background: #070818', 'background: url(' + GRAIN + '), radial-gradient(ellipse 100% 90% at 50% 40%, #0C0E2C 0%, #070818 60%, #03040E 100%); background-blend-mode: soft-light, normal');
    s += '; box-shadow: inset 0 0 180px rgba(0,0,0,.7)';
  }
  // Scheinwerferkegel: weicher
  if (has('clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%)')) s += '; filter: blur(2.5px); mix-blend-mode: screen';
  // Gluehbirnen
  if (has('width: 6px; height: 6px; border-radius: 50%; background: #FFE08A; box-shadow: 0 0 8px rgba(255,201,60,.7)')) {
    s = s.replace('background: #FFE08A; box-shadow: 0 0 8px rgba(255,201,60,.7)', 'background: radial-gradient(circle at 36% 30%, #FFFFFF 0%, #FFF1BF 34%, #FFD45A 100%); box-shadow: 0 0 5px 1px rgba(255,220,110,.95), 0 0 15px 3px rgba(255,201,60,.45)');
  }
  // Tafeln: Glanzkante oben, Schlagschatten
  const grad = /background: linear-gradient\(180deg, (#1D2160|#1A1E52|#171A45|#121540)(?: 0%)?, ?(#10133A|#0E1030|#0A0C26)(?: 100%)?\)/.exec(s);
  if (grad && !has('FFE48A')) {
    s = s.replace(grad[0], 'background: linear-gradient(180deg, rgba(255,255,255,.075) 0%, rgba(255,255,255,0) 44%), ' + grad[0].replace('background: ', ''));
    if (/box-shadow: inset 0 1px 0 rgba\(255,255,255,\.0[78]\)(, inset 0 0 0 1px rgba\(255,201,60,\.\d+\))?;?/.test(s) && !/0 (6|10|12)px (14|24)px rgba\(0,0,0/.test(s)) {
      s = s.replace(/(box-shadow: inset 0 1px 0 rgba\(255,255,255,\.0[78]\)(?:, inset 0 0 0 1px rgba\(255,201,60,\.\d+\))?)/, '$1, 0 1px 0 rgba(0,0,0,.7), 0 8px 16px rgba(0,0,0,.38)');
    }
  }
  // verdeckte Antwortfelder: eingelassen
  if (has('background: #0F1130; border: 1px solid rgba(255,255,255,.04)')) s = s.replace('background: #0F1130; border: 1px solid rgba(255,255,255,.04)', 'background: linear-gradient(180deg, #0B0D26, #12153A); border: 1px solid rgba(255,255,255,.05); box-shadow: inset 0 3px 8px rgba(0,0,0,.6), inset 0 -1px 0 rgba(255,255,255,.05)');
  if (has('background: #11132F; border: 1px solid rgba(255,255,255,.05)')) s = s.replace('background: #11132F; border: 1px solid rgba(255,255,255,.05)', 'background: linear-gradient(180deg, #0D0F2B, #13163C); border: 1px solid rgba(255,255,255,.06); box-shadow: inset 0 3px 8px rgba(0,0,0,.55), inset 0 -1px 0 rgba(255,255,255,.05)');
  if (has('background: #15173B; border: 1px solid rgba(255,201,60,.2); border-radius: 14px')) s += '; box-shadow: inset 0 2px 10px rgba(0,0,0,.5), inset 0 -1px 0 rgba(255,201,60,.12)';
  // goldene Flaechen
  if (has('linear-gradient(180deg, #FFE48A 0%, #FFC93C 48%, #E9A90A 100%)') && has('inset 0 2px 0 rgba(255,255,255,.55)') && !has('inset 0 -2px 0')) {
    s = s.replace('inset 0 2px 0 rgba(255,255,255,.55)', 'inset 0 2px 0 rgba(255,255,255,.7), inset 0 -3px 0 rgba(120,80,0,.38), 0 8px 18px rgba(0,0,0,.4)');
  }
  // Rundeln mit Goldrand
  if (has('width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid rgba(255,201,60,.7)')) s += '; box-shadow: 0 0 10px rgba(255,201,60,.28), inset 0 0 8px rgba(255,201,60,.18)';
  return s;
});
