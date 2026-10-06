// E: Faecher im Jeopardy-Bild (SVG) - Glanzkante und Schlagschatten
const fs = require('fs'); const f = 'designs/s/E-Jeopardy.html'; let h = fs.readFileSync(f, 'utf8');
const a = '<svg width="1280" height="720" style="position:absolute;left:0;top:0">';
if (!h.includes(a)) { console.log('Marker fehlt'); process.exit(1); }
h = h.replace(a, '<svg width="1280" height="720" style="position:absolute;left:0;top:0;filter:drop-shadow(0 7px 0 rgba(0,0,0,.28)) drop-shadow(0 16px 18px rgba(0,0,0,.4))"><defs><linearGradient id="e-gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs><style>svg>path{stroke:rgba(255,235,200,.28);stroke-width:1.5px;stroke-linejoin:round;paint-order:stroke}</style>');
fs.writeFileSync(f, h); console.log('E-Jeopardy: Faecher poliert');
