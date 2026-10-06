// Politur Richtung O (Terminal): Kunststoffgehaeuse mit Struktur, Phosphor-Glut, rollende Scanlines.
const { noise, run, injectHead } = require('./lib.js');
const GRAIN = noise({ rgb: [200, 200, 190], alpha: .2, freq: .9, seed: 13 });

run('O', (s) => {
  const has = (x) => s.includes(x);
  // Gehaeuse-Rahmen (Monitor-Aussenseite)
  if (/^width:\s*(1280|390)px;\s*height:\s*(720|800|844)px;[^"]*background:\s*#121311/.test(s)) {
    s = s.replace(/background:\s*#121311/, 'background:url(' + GRAIN + '),radial-gradient(ellipse 100% 90% at 50% 30%,#1C1D19 0%,#121311 70%,#0B0C0A 100%);background-blend-mode:soft-light,normal');
    return s;
  }
  // Bildschirmrahmen: gebuerstetes Plastik, Kantenlicht
  if (/border-radius:\s*30px;\s*background:\s*linear-gradient\(180deg,\s*#24251F 0%,\s*#1A1B17 100%\)/.test(s)) {
    s = s.replace(/background:\s*linear-gradient\(180deg,\s*#24251F 0%,\s*#1A1B17 100%\)/, 'background:url(' + GRAIN + '),linear-gradient(180deg,#2A2B25 0%,#1D1E19 55%,#171813 100%);background-blend-mode:soft-light,normal');
    s = s.replace(/box-shadow:\s*inset 0 2px 0 #34352F,/, 'box-shadow:inset 0 1px 0 rgba(255,255,255,.12),inset 0 2px 0 #3A3B35,inset 0 0 0 1px rgba(0,0,0,.4),');
    return s;
  }
  // Leuchtanzeige: Bildschirm bekommt Abstrahlung nach aussen
  if (/border-radius:\s*26px \/ 32px;\s*background:\s*radial-gradient/.test(s)) {
    s = s.replace(/box-shadow:\s*([^;]*)/, 'box-shadow:$1,0 0 60px rgba(124,255,160,.10),0 0 8px rgba(124,255,160,.18)');
    return s;
  }
  // Cursor / Leuchtpunkte: staerkere Glut
  if (/^display:inline-block;align-self:flex-start;width:16px;height:30px;vertical-align:middle;background:#7CFFA0;box-shadow:0 0 10px #7CFFA0/.test(s)) s = s.replace('box-shadow:0 0 10px #7CFFA0', 'box-shadow:0 0 6px #7CFFA0,0 0 18px rgba(124,255,160,.7),0 0 40px rgba(124,255,160,.35)');
  if (/width:\s*7px;\s*height:\s*7px;\s*border-radius:\s*50%;\s*background:\s*#7CFFA0/.test(s)) s = s.replace(/box-shadow:\s*0 0 8px #7CFFA0/, 'box-shadow:0 0 4px #CFFFE0,0 0 12px #7CFFA0,0 0 24px rgba(124,255,160,.5)');
  // Auswahl-Balken (hell)
  if (/^height:32px;flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;padding:0 22px;background:#7CFFA0/.test(s)) s = s.replace('background:#7CFFA0', 'background:linear-gradient(180deg,#9BFFB8,#7CFFA0 50%,#63E88A)') + ';box-shadow:0 0 18px rgba(124,255,160,.35)';
  return s;
});

injectHead('O', `
@keyframes o-roll{from{background-position:0 0}to{background-position:0 90px}}
@keyframes o-flicker{0%,100%{opacity:1}47%{opacity:1}48%{opacity:.93}50%{opacity:1}83%{opacity:.96}}
@keyframes o-blink{0%,49%{opacity:1}50%,100%{opacity:.15}}
[style*="repeating-linear-gradient(0deg,rgba(0,0,0,.24)"],[style*="repeating-linear-gradient(0deg, rgba(0,0,0,.24)"]{animation:o-roll 9s linear infinite}
[style*="border-radius:26px / 32px"],[style*="border-radius: 26px / 32px"]{animation:o-flicker 6s steps(1) infinite}
[style*="width:16px;height:30px;vertical-align:middle"]{animation:o-blink 1.1s steps(1) infinite}
@media (prefers-reduced-motion:reduce){[style]{animation:none!important}}
`);
