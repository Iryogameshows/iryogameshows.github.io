// @ts-check
/* ── Design-Richtung fuer die ganze Seite ─────────────────────────────────

   Die 18 Richtungen aus designs/ als Satz von CSS-Variablen. styles.css
   liest Schriften, Hintergrund, Flaechen, Linien, Text und die Akzentfarbe
   (--gold-*) aus diesen Variablen; hier wird nur umgestellt, welche Werte
   gelten. Ohne Auswahl bleibt alles beim Studio-Blau aus styles.css.

   Was eine Richtung NICHT mitbringt: ihr eigenes Mobiliar - die Sprechblasen
   aus F, die Rasterkreise aus Q, die ASCII-Rahmen aus O. Die stehen in den
   Entwuerfen als gezeichnete Einzelstuecke und haben in der Show keine
   Entsprechung. Umgestellt wird, was alle Screens gemeinsam haben.

   Team-Rot und Team-Blau bleiben in jeder Richtung gleich (BAUPLAN 4.4).

   Diese Datei laedt im <head>, nicht mit den anderen am Ende des <body>:
   so stehen die Variablen, bevor die Seite zum ersten Mal gezeichnet wird,
   und es blitzt nicht erst das Studio-Blau auf. Beim Laden greift sie
   deshalb auf nichts aus core.js zu - nur auf document und localStorage.
   Was core.js braucht (setHtml, escapeHtml, showScreen), laeuft erst auf
   Klick. */

/** @typedef {{key:string, name:string, hell:boolean, fonts:string, vars:Object<string,string>}} DesignTheme */

/** @type {DesignTheme[]} */
const DESIGN_THEMES = [
  { key: "A", name: "Studio", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@500;600;700;800&display=swap",
    vars: {
      "--font-display": "'Bebas Neue', sans-serif",
      "--font-body": "'Manrope', sans-serif",
      "--font-logo": "'Bebas Neue', sans-serif",
      "--bg": "#070818",
      "--bg-img": "radial-gradient(ellipse 70% 55% at 50% -5%, rgba(120,140,255,.28) 0%, transparent 70%), radial-gradient(ellipse 90% 40% at 50% 105%, rgba(255,201,60,.14) 0%, transparent 70%)",
      "--bg-size": "auto",
      "--panel": "#171A45",
      "--panel-hi": "#1D2160",
      "--line": "#2A2E66",
      "--fg": "#F4F1E8",
      "--fg-rgb": "244,241,232",
      "--fg-strong": "#F4F1E8",
      "--muted": "#ABA9C8",
      "--pill-fg": "#D9D7EA",
      "--accent-line": "#FFC93C",
      "--gold-rgb": "255,201,60",
      "--gold-deep": "#E9A90A",
      "--gold-dark": "#8A5E00",
      "--gold-pale": "#FFE48A",
      "--ink": "#1A1200"
    } },
  { key: "B", name: "Arcade", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@500;700&display=swap",
    vars: {
      "--font-display": "'Press Start 2P', monospace",
      "--font-body": "'Space Grotesk', sans-serif",
      "--font-logo": "'Press Start 2P', monospace",
      "--bg": "#0B0A12",
      "--bg-img": "repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 4px)",
      "--bg-size": "auto",
      "--panel": "#14121F",
      "--panel-hi": "#1E1A2E",
      "--line": "#2B2740",
      "--fg": "#EEEAFE",
      "--fg-rgb": "238,234,254",
      "--fg-strong": "#EEEAFE",
      "--muted": "#9C96B8",
      "--pill-fg": "#C9C3E6",
      "--accent-line": "#FFE14D",
      "--gold-rgb": "255,225,77",
      "--gold-deep": "#D9BC1F",
      "--gold-dark": "#8A7400",
      "--gold-pale": "#FFF0A0",
      "--ink": "#0B0A12"
    } },
  { key: "C", name: "Pop", hell: true,
    fonts: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@500;600;700&display=swap",
    vars: {
      "--font-display": "'Archivo Black', sans-serif",
      "--font-body": "'Archivo', sans-serif",
      "--font-logo": "'Archivo Black', sans-serif",
      "--bg": "#FBF8F2",
      "--bg-img": "none",
      "--bg-size": "auto",
      "--panel": "#FFFFFF",
      "--panel-hi": "#FFF6D6",
      "--line": "#121212",
      "--fg": "#121212",
      "--fg-rgb": "18,18,18",
      "--fg-strong": "#121212",
      "--muted": "#5A5A5A",
      "--pill-fg": "#121212",
      "--accent-line": "#121212",
      "--gold-rgb": "255,210,63",
      "--gold-deep": "#E0A100",
      "--gold-dark": "#8A6400",
      "--gold-pale": "#FFE9A0",
      "--ink": "#121212",
      "--accent-text": "#8A6400",
      "--accent-text-rgb": "138,100,0"
    } },
  { key: "D", name: "Late Night", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Instrument+Sans:wght@400;500;600&display=swap",
    vars: {
      "--font-display": "'Big Shoulders Display', sans-serif",
      "--font-body": "'Instrument Sans', sans-serif",
      "--font-logo": "'Big Shoulders Display', sans-serif",
      "--bg": "#0E0E0E",
      "--bg-img": "none",
      "--bg-size": "auto",
      "--panel": "#161616",
      "--panel-hi": "#1E1E1E",
      "--line": "#2A2A2A",
      "--fg": "#F2F2F2",
      "--fg-rgb": "242,242,242",
      "--fg-strong": "#F2F2F2",
      "--muted": "#9A9A9A",
      "--pill-fg": "#C8C8C8",
      "--accent-line": "#FF5B1F",
      "--gold-rgb": "255,91,31",
      "--gold-deep": "#D13F0C",
      "--gold-dark": "#8A2A08",
      "--gold-pale": "#FF9A70",
      "--ink": "#0E0E0E"
    } },
  { key: "E", name: "70er", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Shrikhand&family=DM+Sans:wght@500;700&display=swap",
    vars: {
      "--font-display": "'Shrikhand', serif",
      "--font-body": "'DM Sans', sans-serif",
      "--font-logo": "'Shrikhand', serif",
      "--bg": "#2B1810",
      "--bg-img": "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(242,179,61,.18) 0%, transparent 70%)",
      "--bg-size": "auto",
      "--panel": "#3D2417",
      "--panel-hi": "#4A2C1B",
      "--line": "#5A3622",
      "--fg": "#F6E7CB",
      "--fg-rgb": "246,231,203",
      "--fg-strong": "#F6E7CB",
      "--muted": "#CDB898",
      "--pill-fg": "#CDB898",
      "--accent-line": "#F2B33D",
      "--gold-rgb": "242,179,61",
      "--gold-deep": "#E8622C",
      "--gold-dark": "#8C3A1A",
      "--gold-pale": "#F8D58A",
      "--ink": "#2B1810"
    } },
  { key: "F", name: "Comic", hell: true,
    fonts: "https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@600;800&display=swap",
    vars: {
      "--font-display": "'Bangers', cursive",
      "--font-body": "'Nunito', sans-serif",
      "--font-logo": "'Bangers', cursive",
      "--bg": "#FFFFFF",
      "--bg-img": "radial-gradient(#D6E4FF 2.2px, transparent 2.4px)",
      "--bg-size": "14px 14px",
      "--panel": "#FFFFFF",
      "--panel-hi": "#FFF8CC",
      "--line": "#111111",
      "--fg": "#111111",
      "--fg-rgb": "17,17,17",
      "--fg-strong": "#111111",
      "--muted": "#4A4A4A",
      "--pill-fg": "#111111",
      "--accent-line": "#111111",
      "--gold-rgb": "255,230,0",
      "--gold-deep": "#E8C400",
      "--gold-dark": "#8A7500",
      "--gold-pale": "#FFF27A",
      "--ink": "#111111",
      "--accent-text": "#B42318",
      "--accent-text-rgb": "180,35,24"
    } },
  { key: "H", name: "Bauhaus", hell: true,
    fonts: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&display=swap",
    vars: {
      "--font-display": "'Bricolage Grotesque', sans-serif",
      "--font-body": "'Bricolage Grotesque', sans-serif",
      "--font-logo": "'Bricolage Grotesque', sans-serif",
      "--bg": "#ECEAE4",
      "--bg-img": "none",
      "--bg-size": "auto",
      "--panel": "#FFFFFF",
      "--panel-hi": "#FFFFFF",
      "--line": "#141414",
      "--fg": "#141414",
      "--fg-rgb": "20,20,20",
      "--fg-strong": "#141414",
      "--muted": "#4A4A4A",
      "--pill-fg": "#141414",
      "--accent-line": "#141414",
      "--gold-rgb": "242,194,48",
      "--gold-deep": "#D7372B",
      "--gold-dark": "#8A6A10",
      "--gold-pale": "#F8DC85",
      "--ink": "#141414",
      "--accent-text": "#D7372B",
      "--accent-text-rgb": "215,55,43"
    } },
  { key: "I", name: "Salon", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Jost:wght@400;500&display=swap",
    vars: {
      "--font-display": "'Cormorant Garamond', serif",
      "--font-body": "'Jost', sans-serif",
      "--font-logo": "'Cormorant Garamond', serif",
      "--bg": "#0C2A20",
      "--bg-img": "radial-gradient(ellipse 80% 70% at 50% 35%, #13392C 0%, #0C2A20 55%, #06170F 100%)",
      "--bg-size": "auto",
      "--panel": "#13392C",
      "--panel-hi": "#174535",
      "--line": "#2F5547",
      "--fg": "#F4EEDF",
      "--fg-rgb": "244,238,223",
      "--fg-strong": "#F4EEDF",
      "--muted": "#B8AE95",
      "--pill-fg": "#E6CF8B",
      "--accent-line": "#C9A54C",
      "--gold-rgb": "201,165,76",
      "--gold-deep": "#A8853F",
      "--gold-dark": "#6E5520",
      "--gold-pale": "#E6CF8B",
      "--ink": "#1B1A17"
    } },
  { key: "J", name: "Kreide", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Patrick+Hand&display=swap",
    vars: {
      "--font-display": "'Permanent Marker', cursive",
      "--font-body": "'Patrick Hand', cursive",
      "--font-logo": "'Permanent Marker', cursive",
      "--bg": "#26332E",
      "--bg-img": "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(255,255,255,.05) 0%, transparent 70%)",
      "--bg-size": "auto",
      "--panel": "#2E3C37",
      "--panel-hi": "#37463F",
      "--line": "#5A6A62",
      "--fg": "#EDEDE6",
      "--fg-rgb": "237,237,230",
      "--fg-strong": "#EDEDE6",
      "--muted": "#C9D3CC",
      "--pill-fg": "#C9D3CC",
      "--accent-line": "#F4E58A",
      "--gold-rgb": "244,229,138",
      "--gold-deep": "#D9C55C",
      "--gold-dark": "#8A7A2A",
      "--gold-pale": "#FAF2C2",
      "--ink": "#26332E"
    } },
  { key: "K", name: "Neon-Bar", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Yellowtail&family=Sora:wght@400;600;700&display=swap",
    vars: {
      "--font-display": "'Sora', sans-serif",
      "--font-body": "'Sora', sans-serif",
      "--font-logo": "'Yellowtail', cursive",
      "--bg": "#2A191D",
      "--bg-img": "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(42,25,29,0) 0%, rgba(10,6,8,.85) 100%), linear-gradient(#170D10 3px, transparent 3px), linear-gradient(90deg, #170D10 3px, transparent 3px)",
      "--bg-size": "100% 100%, 100% 44px, 96px 44px",
      "--panel": "#170D10",
      "--panel-hi": "#22121A",
      "--line": "#4A2A33",
      "--fg": "#FFF3E0",
      "--fg-rgb": "255,243,224",
      "--fg-strong": "#FFF3E0",
      "--muted": "#CDBBC1",
      "--pill-fg": "#CDBBC1",
      "--accent-line": "#45F0FF",
      "--gold-rgb": "255,79,163",
      "--gold-deep": "#D62E80",
      "--gold-dark": "#8A1A50",
      "--gold-pale": "#FF9FCB",
      "--ink": "#170D10"
    } },
  { key: "L", name: "New York", hell: true,
    fonts: "https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Old+Standard+TT:ital,wght@0,400;0,700;1,400&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap",
    vars: {
      "--font-display": "'Playfair Display', serif",
      "--font-body": "'Old Standard TT', serif",
      "--font-logo": "'UnifrakturMaguntia', serif",
      "--bg": "#978C73",
      "--bg-img": "radial-gradient(ellipse 90% 80% at 50% 45%, rgba(255,250,235,.08) 0%, rgba(30,22,10,0) 55%, rgba(20,14,6,.55) 100%)",
      "--bg-size": "auto",
      "--panel": "#D2C8B0",
      "--panel-hi": "#DDD4BE",
      "--line": "#1A1712",
      "--fg": "#1A1712",
      "--fg-rgb": "0,0,0",
      "--fg-strong": "#1A1712",
      "--muted": "#4A443A",
      "--pill-fg": "#1A1712",
      "--accent-line": "#1A1712",
      "--gold-rgb": "26,23,18",
      "--gold-deep": "#000000",
      "--gold-dark": "#000000",
      "--gold-pale": "#4A443A",
      "--ink": "#E8E0CC",
      "--accent-text": "#1A1712",
      "--accent-text-rgb": "26,23,18",
      "--on-accent": "#E8E0CC"
    } },
  { key: "M", name: "Aurora", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap",
    vars: {
      "--font-display": "'Plus Jakarta Sans', sans-serif",
      "--font-body": "'Plus Jakarta Sans', sans-serif",
      "--font-logo": "'Plus Jakarta Sans', sans-serif",
      "--bg": "#070A1A",
      "--bg-img": "radial-gradient(ellipse 60% 50% at 20% 10%, rgba(183,166,255,.25) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 85% 30%, rgba(255,159,203,.18) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(143,182,255,.18) 0%, transparent 70%)",
      "--bg-size": "auto",
      "--panel": "#11152E",
      "--panel-hi": "#181D3C",
      "--line": "#2A3160",
      "--fg": "#F5F7FF",
      "--fg-rgb": "245,247,255",
      "--fg-strong": "#F5F7FF",
      "--muted": "#BFC5E6",
      "--pill-fg": "#E3E7FF",
      "--accent-line": "#B7A6FF",
      "--gold-rgb": "183,166,255",
      "--gold-deep": "#8F7BFF",
      "--gold-dark": "#4E3FB0",
      "--gold-pale": "#DCD3FF",
      "--ink": "#070A1A"
    } },
  { key: "N", name: "Papier", hell: true,
    fonts: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,900&family=Karla:wght@500;700&display=swap",
    vars: {
      "--font-display": "'Fraunces', serif",
      "--font-body": "'Karla', sans-serif",
      "--font-logo": "'Fraunces', serif",
      "--bg": "#BFE0D8",
      "--bg-img": "none",
      "--bg-size": "auto",
      "--panel": "#FBF5E8",
      "--panel-hi": "#FFFFFF",
      "--line": "#4D6764",
      "--fg": "#163936",
      "--fg-rgb": "22,57,54",
      "--fg-strong": "#163936",
      "--muted": "#4D6764",
      "--pill-fg": "#163936",
      "--accent-line": "#F06A4E",
      "--gold-rgb": "242,193,78",
      "--gold-deep": "#F06A4E",
      "--gold-dark": "#8A6418",
      "--gold-pale": "#F8DD9C",
      "--ink": "#163936",
      "--accent-text": "#A8432C",
      "--accent-text-rgb": "168,67,44"
    } },
  { key: "O", name: "Terminal", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=VT323&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
    vars: {
      "--font-display": "'VT323', monospace",
      "--font-body": "'IBM Plex Mono', monospace",
      "--font-logo": "'VT323', monospace",
      "--bg": "#05140B",
      "--bg-img": "repeating-linear-gradient(0deg, rgba(124,255,160,.03) 0px, rgba(124,255,160,.03) 1px, transparent 1px, transparent 3px)",
      "--bg-size": "auto",
      "--panel": "#031008",
      "--panel-hi": "#09200F",
      "--line": "#2E7D4A",
      "--fg": "#D6FFE2",
      "--fg-rgb": "214,255,226",
      "--fg-strong": "#D6FFE2",
      "--muted": "#4FB874",
      "--pill-fg": "#9EE8B4",
      "--accent-line": "#7CFFA0",
      "--gold-rgb": "124,255,160",
      "--gold-deep": "#4FB874",
      "--gold-dark": "#2E7D4A",
      "--gold-pale": "#D6FFE2",
      "--ink": "#05140B"
    } },
  { key: "P", name: "Memphis", hell: true,
    fonts: "https://fonts.googleapis.com/css2?family=Lilita+One&family=Rubik:wght@500;700&display=swap",
    vars: {
      "--font-display": "'Lilita One', sans-serif",
      "--font-body": "'Rubik', sans-serif",
      "--font-logo": "'Lilita One', sans-serif",
      "--bg": "#F4F1FF",
      "--bg-img": "radial-gradient(#141414 1.4px, transparent 1.6px)",
      "--bg-size": "26px 26px",
      "--panel": "#FFFFFF",
      "--panel-hi": "#FFFFFF",
      "--line": "#141414",
      "--fg": "#141414",
      "--fg-rgb": "20,20,20",
      "--fg-strong": "#141414",
      "--muted": "#3A3A3A",
      "--pill-fg": "#141414",
      "--accent-line": "#7B5CFF",
      "--gold-rgb": "255,210,63",
      "--gold-deep": "#FF6FA8",
      "--gold-dark": "#8A6400",
      "--gold-pale": "#FFE9A0",
      "--ink": "#141414",
      "--accent-text": "#6A4CF0",
      "--accent-text-rgb": "106,76,240"
    } },
  { key: "Q", name: "Riso", hell: true,
    fonts: "https://fonts.googleapis.com/css2?family=Bowlby+One&family=Familjen+Grotesk:wght@500;700&display=swap",
    vars: {
      "--font-display": "'Bowlby One', sans-serif",
      "--font-body": "'Familjen Grotesk', sans-serif",
      "--font-logo": "'Bowlby One', sans-serif",
      "--bg": "#F2EEE4",
      "--bg-img": "none",
      "--bg-size": "auto",
      "--panel": "#FFFFFF",
      "--panel-hi": "#FFF5FA",
      "--line": "#3255A4",
      "--fg": "#3255A4",
      "--fg-rgb": "16,30,76",
      "--fg-strong": "#3255A4",
      "--muted": "#6B7FA8",
      "--pill-fg": "#3255A4",
      "--accent-line": "#FF48B0",
      "--gold-rgb": "255,72,176",
      "--gold-deep": "#D62E8E",
      "--gold-dark": "#8A1A5C",
      "--gold-pale": "#FFB0DC",
      "--ink": "#1E2F66",
      "--accent-text": "#B01F75",
      "--accent-text-rgb": "176,31,117"
    } },
  { key: "R", name: "Jazzplatte", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&family=Libre+Franklin:wght@400;600;800&display=swap",
    vars: {
      "--font-display": "'Antonio', sans-serif",
      "--font-body": "'Libre Franklin', sans-serif",
      "--font-logo": "'Antonio', sans-serif",
      "--bg": "#111111",
      "--bg-img": "none",
      "--bg-size": "auto",
      "--panel": "#1A1A1A",
      "--panel-hi": "#222222",
      "--line": "#333333",
      "--fg": "#F4F1EA",
      "--fg-rgb": "244,241,234",
      "--fg-strong": "#F4F1EA",
      "--muted": "#8A8780",
      "--pill-fg": "#C8C5BD",
      "--accent-line": "#F2A900",
      "--gold-rgb": "242,169,0",
      "--gold-deep": "#E4572E",
      "--gold-dark": "#8A6000",
      "--gold-pale": "#F8D27A",
      "--ink": "#111111"
    } },
  { key: "S", name: "Art déco", hell: false,
    fonts: "https://fonts.googleapis.com/css2?family=Poiret+One&family=Bodoni+Moda:ital,opsz,wght@0,6..96,600;0,6..96,800;1,6..96,600&family=Josefin+Sans:wght@400;600&display=swap",
    vars: {
      "--font-display": "'Bodoni Moda', serif",
      "--font-body": "'Josefin Sans', sans-serif",
      "--font-logo": "'Poiret One', sans-serif",
      "--bg": "#0B0A08",
      "--bg-img": "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(217,182,107,.14) 0%, transparent 70%)",
      "--bg-size": "auto",
      "--panel": "#100E0A",
      "--panel-hi": "#171309",
      "--line": "#A8853F",
      "--fg": "#EFE6D2",
      "--fg-rgb": "239,230,210",
      "--fg-strong": "#EFE6D2",
      "--muted": "#BFA676",
      "--pill-fg": "#E3C47F",
      "--accent-line": "#D9B66B",
      "--gold-rgb": "217,182,107",
      "--gold-deep": "#A8853F",
      "--gold-dark": "#6E5520",
      "--gold-pale": "#F6E2AE",
      "--ink": "#0B0A08"
    } }
];

/* ── Logo je Richtung ─────────────────────────────────────────────────────

   Die Wortmarke aus dem Menue-Entwurf (designs/s/<K>-Menu.html), verkleinert
   auf das, was ein Logo braucht. Angelegt auf 640 px Breite; themeLogoHtml
   rechnet jede px-Angabe in cqw um, so passt dasselbe Markup oben ins Menue
   (400 px) wie auf den Wartebildschirm am Beamer (60vw).

   Bewusst HTML statt Canvas: der Mainscreen spiegelt per cloneNode, und ein
   geklontes <canvas> kommt leer an (siehe renderIryoHubLogo in core.js).
   Ohne Richtung bleibt das gezeichnete Blau-Gold-Schild. */

/** @type {Object<string,string>} */
const DESIGN_LOGOS = {
  A: `<div style="display:flex;justify-content:center"><div style="border-radius:26px;padding:14px;background:radial-gradient(circle,#FFF3C4 0px,#FFD45A 2.6px,rgba(255,201,60,.35) 4px,rgba(255,201,60,0) 6.5px) 0 0/20px 20px,#2A2108;box-shadow:0 0 40px rgba(255,201,60,.25)"><div style="border-radius:18px;background:linear-gradient(180deg,#121540 0%,#0A0C26 100%);box-shadow:inset 0 0 0 1px rgba(255,201,60,.35);display:flex;flex-direction:column;align-items:center;padding:16px 64px 14px"><span style="font-family:'Bebas Neue',sans-serif;font-size:132px;line-height:.86;letter-spacing:10px;padding-left:10px;background:linear-gradient(180deg,#FFF6D0 0%,#FFD45A 38%,#E0A100 62%,#FFE48A 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 0 #6E4A00)">IRYO</span><span style="font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:18px;padding-left:18px;color:#F4F1E8">GAMESHOW</span></div></div></div>`,
  B: `<div style="display:flex;flex-direction:column;align-items:center;gap:22px;padding:18px 0"><span style="font-family:'Press Start 2P',monospace;font-size:104px;line-height:1;color:#FFE14D;text-shadow:8px 8px 0 #8A7400">IRYO</span><span style="font-family:'Press Start 2P',monospace;font-size:24px;letter-spacing:4px;color:#45F0FF">GAMESHOW · 1P READY</span></div>`,
  C: `<div style="display:flex;justify-content:center;align-items:center;padding:10px 0"><span style="font-family:'Archivo Black',sans-serif;font-size:150px;line-height:.8;letter-spacing:-5px;color:#121212">IRYO</span><span style="width:160px;height:160px;margin-left:-26px;margin-top:-70px;background:#FFA3D1;clip-path:polygon(50% 0,61% 32%,98% 20%,72% 50%,98% 80%,61% 68%,50% 100%,39% 68%,2% 80%,28% 50%,2% 20%,39% 32%);display:flex;align-items:center;justify-content:center"><span style="font-family:'Archivo Black',sans-serif;font-size:28px;line-height:1;text-align:center;color:#121212;transform:rotate(-12deg)">GAME<br>SHOW!</span></span></div>`,
  D: `<div style="display:flex;flex-direction:column;align-items:center;font-family:'Big Shoulders Display',sans-serif;font-weight:900;font-size:136px;line-height:.82;text-transform:uppercase;color:#F2F2F2"><span>Iryo</span><span>Game<span style="color:#FF5B1F">Show</span></span><span style="margin-top:14px;font-family:'Instrument Sans',sans-serif;font-weight:500;font-size:18px;line-height:1;letter-spacing:6px;text-transform:uppercase;color:#9A9A9A">Live aus dem Keller</span></div>`,
  E: `<div style="position:relative;height:300px"><div style="position:absolute;left:110px;top:0;width:420px;height:210px;box-sizing:border-box;border:26px solid #F2B33D;border-bottom:0;border-radius:210px 210px 0 0"></div><div style="position:absolute;left:136px;top:26px;width:368px;height:184px;box-sizing:border-box;border:26px solid #E8622C;border-bottom:0;border-radius:184px 184px 0 0"></div><div style="position:absolute;left:162px;top:52px;width:316px;height:158px;box-sizing:border-box;border:26px solid #8C3A1A;border-bottom:0;border-radius:158px 158px 0 0"></div><div style="position:absolute;left:0;right:0;top:96px;text-align:center;font-family:'Shrikhand',serif;font-size:136px;line-height:1;color:#F6E7CB;text-shadow:6px 6px 0 #E8622C,12px 12px 0 #8C3A1A">Iryo</div><div style="position:absolute;left:0;right:0;top:256px;text-align:center;font-family:'DM Sans',sans-serif;font-weight:700;font-size:22px;letter-spacing:12px;color:#F2B33D">GAMESHOW</div></div>`,
  F: `<div style="display:flex;justify-content:center;padding:14px 0 20px"><div style="background:#FFE600;border:5px solid #111111;box-shadow:10px 10px 0 #111111;padding:6px 30px 10px;transform:rotate(-2deg)"><span style="font-family:'Bangers',cursive;text-transform:uppercase;letter-spacing:2px;font-size:74px;line-height:1;white-space:nowrap;color:#E8453C;-webkit-text-stroke:3px #111111;text-shadow:6px 6px 0 #111111">Iryo! Gameshow</span></div></div>`,
  H: `<div style="display:flex;flex-direction:column;align-items:center;gap:18px;font-family:'Bricolage Grotesque',sans-serif;color:#141414"><div style="position:relative;width:340px;height:300px"><span style="position:absolute;left:0;top:0;width:200px;height:200px;border-radius:50%;background:#F2C230"></span><span style="position:absolute;right:0;top:60px;width:160px;height:160px;background:#1F4FA3"></span><span style="position:absolute;left:80px;bottom:0;width:184px;height:92px;border-radius:92px 92px 0 0;background:#D7372B"></span><span style="position:absolute;left:0;bottom:96px;font-weight:800;font-size:112px;line-height:.85;letter-spacing:-4px;mix-blend-mode:multiply">iryo</span></div><span style="font-weight:800;font-size:30px;letter-spacing:10px;padding-left:10px">GAMESHOW</span></div>`,
  I: `<div style="display:flex;justify-content:center"><div style="width:560px;height:230px;box-sizing:border-box;border:2px solid rgba(201,165,76,.55);border-radius:280px/115px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px"><span style="font-family:'Cormorant Garamond',serif;font-style:italic;font-weight:600;font-size:124px;line-height:1;color:#F4EEDF">Iryo</span><span style="font-family:'Jost',sans-serif;font-size:18px;letter-spacing:6px;padding-left:6px;color:#C9A54C;text-transform:uppercase">Gameshow · Salon de jeu</span></div></div>`,
  J: `<div style="display:flex;flex-direction:column;align-items:center;padding:16px 0"><span style="font-family:'Permanent Marker',cursive;font-size:132px;line-height:1.05;color:#EDEDE6;transform:rotate(-6deg)">IRYO</span><svg viewBox="0 0 300 20" preserveAspectRatio="none" style="width:300px;height:20px;margin-top:-6px"><path d="M4 12 Q40 2 80 11 T160 10 T240 12 T296 8" fill="none" stroke="#F4E58A" stroke-width="5" stroke-linecap="round"/></svg><span style="font-family:'Patrick Hand',cursive;font-size:38px;line-height:1.2;color:#F2A7B5">~ Gameshow ~</span></div>`,
  K: `<div style="display:flex;justify-content:center;padding:20px 0"><div style="padding:0 40px 22px;border:4px solid #FF4FA3;border-radius:40px;box-shadow:0 0 14px #FF4FA3,inset 0 0 14px rgba(255,79,163,.4);text-align:center"><div style="font-family:'Yellowtail',cursive;font-size:150px;line-height:1.1;color:#FFF8F0;text-shadow:0 0 6px #FF4FA3,0 0 16px #FF4FA3,0 0 34px #FF4FA3">Iryo</div><div style="font-family:'Sora',sans-serif;font-weight:700;font-size:20px;letter-spacing:12px;padding-left:12px;color:#FFF8F0;text-shadow:0 0 6px #45F0FF,0 0 16px #45F0FF,0 0 34px #45F0FF">GAMESHOW · OPEN</div></div></div>`,
  L: `<div style="display:flex;flex-direction:column;align-items:stretch;color:#1A1712;padding:0 4px"><span style="font-family:'UnifrakturMaguntia',serif;font-size:74px;line-height:1.05;text-align:center;white-space:nowrap">The Iryo Gameshow</span><span style="margin-top:6px;border-top:1px solid #1A1712;border-bottom:4px double #1A1712;display:flex;justify-content:space-between;padding:4px 2px;font-family:'Old Standard TT',serif;font-size:14px;letter-spacing:1.5px"><span>VOL. VIII · NO. 8</span><span>LATE EDITION</span><span>EINTRITT FREI</span></span></div>`,
  M: `<div style="position:relative;height:280px"><div style="position:absolute;left:40px;top:70px;width:560px;height:140px;border-radius:50%;border:1px dashed rgba(255,255,255,.3)"></div><div style="position:absolute;left:198px;top:18px;width:244px;height:244px;box-sizing:border-box;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.35),rgba(183,166,255,.25) 40%,rgba(143,182,255,.08) 70%);border:1px solid rgba(255,255,255,.3);box-shadow:0 0 80px rgba(183,166,255,.45);display:flex;flex-direction:column;align-items:center;justify-content:center"><span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:74px;line-height:1.05;background:linear-gradient(90deg,#FF9FCB,#B7A6FF,#8FB6FF);-webkit-background-clip:text;background-clip:text;color:transparent">iryo</span><span style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;letter-spacing:6px;padding-left:6px;color:#BFC5E6">GAMESHOW</span></div><span style="position:absolute;left:66px;top:150px;width:22px;height:22px;border-radius:50%;background:#FF9FCB;box-shadow:0 0 18px #FF9FCB"></span><span style="position:absolute;left:560px;top:96px;width:14px;height:14px;border-radius:50%;background:#8FB6FF;box-shadow:0 0 14px #8FB6FF"></span></div>`,
  N: `<div style="display:flex;flex-direction:column;align-items:center;color:#163936"><span style="display:flex;align-items:baseline;gap:14px"><span style="font-family:'Fraunces',serif;font-weight:900;font-size:124px;line-height:1">Iryo</span><span style="font-family:'Karla',sans-serif;font-weight:700;font-size:38px;color:#F06A4E">Gameshow</span></span><svg viewBox="0 0 1280 80" preserveAspectRatio="none" style="width:600px;height:40px"><path d="M0 10 Q640 70 1280 10" stroke="#163936" stroke-width="6" fill="none"/></svg></div>`,
  O: `<div style="position:relative;margin:14px 0 0;border:2px solid #2E7D4A;padding:34px 28px 18px;color:#B8FFCD;text-shadow:0 0 8px rgba(124,255,160,.45)"><span style="position:absolute;left:18px;top:-13px;background:#05140B;padding:0 8px;font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;line-height:1.4;color:#7CFFA0">┤ IRYO GAMESHOW ├</span><div style="font-family:'VT323',monospace;font-size:190px;line-height:.8;letter-spacing:14px;text-align:center;color:#B8FFCD;text-shadow:0 0 10px rgba(124,255,160,.6),0 0 30px rgba(124,255,160,.3)">IRYO</div><div style="margin-top:12px;font-family:'VT323',monospace;font-size:30px;line-height:1;color:#7CFFA0">&gt; gameshow starten_</div></div>`,
  P: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;padding:10px 0"><span style="position:absolute;left:56px;top:-4px;width:100px;height:100px;border-radius:50%;background:#FFD23F;border:5px solid #141414"></span><span style="position:absolute;right:96px;top:30px;width:0;height:0;border-left:44px solid transparent;border-right:44px solid transparent;border-bottom:76px solid #3FD0C9"></span><span style="position:relative;font-family:'Lilita One',sans-serif;font-size:150px;line-height:1;color:#141414;text-shadow:8px 8px 0 #FF6FA8">IRYO</span><span style="position:relative;display:flex;align-items:center;justify-content:center;gap:18px;width:440px"><svg viewBox="0 0 200 34" style="width:150px;height:26px"><path d="M0 26 L10 8 L20 26 L30 8 L40 26 L50 8 L60 26 L70 8 L80 26 L90 8 L100 26 L110 8 L120 26 L130 8 L140 26 L150 8 L160 26 L170 8 L180 26 L190 8 L200 26" fill="none" stroke="#FF6FA8" stroke-width="7" stroke-linejoin="round"/></svg><span style="font-family:'Lilita One',sans-serif;font-size:50px;line-height:1;color:#7B5CFF">Gameshow</span></span></div>`,
  Q: `<div style="display:flex;flex-direction:column;align-items:center;gap:8px"><span style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:17px;letter-spacing:6px;padding-left:6px;color:#3255A4">IRYO GAMESHOW PRÄSENTIERT</span><span style="display:inline-grid"><span style="grid-area:1/1;transform:translate(7px,5px);font-family:'Bowlby One',sans-serif;font-size:150px;line-height:.92;color:#FF48B0;mix-blend-mode:multiply;white-space:nowrap">IRYO</span><span style="grid-area:1/1;font-family:'Bowlby One',sans-serif;font-size:150px;line-height:.92;color:#3255A4;mix-blend-mode:multiply;white-space:nowrap">IRYO</span></span><span style="font-family:'Familjen Grotesk',sans-serif;font-weight:700;font-size:17px;letter-spacing:6px;padding-left:6px;color:#FF48B0">AUSGABE 8 · IM KELLER</span></div>`,
  R: `<div style="display:flex;justify-content:center;align-items:center;gap:30px"><span style="position:relative;flex:none;width:200px;height:200px;border-radius:50%;background:repeating-radial-gradient(circle,#0A0A0A 0px,#0A0A0A 2px,#1B1B1B 2px,#1B1B1B 3px);box-shadow:0 14px 34px rgba(0,0,0,.6)"><span style="position:absolute;left:65px;top:65px;width:70px;height:70px;border-radius:50%;background:#F2A900;display:flex;align-items:center;justify-content:center"><span style="width:10px;height:10px;border-radius:50%;background:#111111"></span></span></span><span style="display:flex;flex-direction:column"><span style="font-family:'Antonio',sans-serif;font-weight:700;font-size:170px;line-height:.82;letter-spacing:-2px;text-transform:uppercase;color:#F4F1EA">Iryo</span><span style="margin-top:10px;font-family:'Antonio',sans-serif;font-weight:600;font-size:24px;letter-spacing:7px;color:#F2A900">GAMESHOW RECORDS</span></span></div>`,
  S: `<div style="position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;padding:10px 0"><span style="position:absolute;left:200px;top:-10px;width:240px;height:240px;border-radius:50%;background:repeating-conic-gradient(from 0deg,#D9B66B 0deg 2deg,transparent 2deg 15deg);-webkit-mask:radial-gradient(circle,transparent 70px,#000 71px,#000 118px,transparent 119px);mask:radial-gradient(circle,transparent 70px,#000 71px,#000 118px,transparent 119px);opacity:.16"></span><span style="position:relative;display:inline-flex;align-items:center;gap:10px"><span style="width:9px;height:9px;background:#D9B66B;transform:rotate(45deg)"></span><span style="width:60px;height:5px;border-top:1px solid #D9B66B;border-bottom:1px solid #D9B66B"></span><span style="width:9px;height:9px;background:#D9B66B;transform:rotate(45deg)"></span></span><span style="position:relative;font-family:'Poiret One',sans-serif;font-size:120px;line-height:1;background:linear-gradient(180deg,#FBEBC0 0%,#E3C47F 40%,#9C7A3A 52%,#E9CF8F 70%,#FBEBC0 100%);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:20px;padding-left:20px">IRYO</span><span style="position:relative;font-family:'Josefin Sans',sans-serif;font-weight:600;font-size:18px;letter-spacing:6px;padding-left:6px;text-transform:uppercase;color:#EFE6D2">Gameshow</span></div>`
};

/** Logo der Richtung als HTML in der gewuenschten Breite, '' ohne Richtung.
 *  @param {string} key
 *  @param {string} breite  CSS-Breite, z. B. 'min(400px,88vw)' */
function themeLogoHtml(key, breite) {
  const src = DESIGN_LOGOS[key];
  if (!src) return '';
  /* 640 px Entwurfsbreite = 100cqw der Logo-Box. */
  const skaliert = src.replace(/(-?\d*\.?\d+)px/g, (_, n) => (parseFloat(n) / 6.4).toFixed(3) + 'cqw');
  return `<div class="theme-logo" style="width:${breite};container-type:inline-size;margin:0 auto;text-align:left">${skaliert}</div>`;
}

const THEME_STORE_KEY = 'designTheme';
const THEME_DEFAULT_FONTS = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@500;700;900&family=Luckiest+Guy&display=swap';

/** Gewaehlte Richtung, '' fuer das Studio-Blau. */
function themeKey() {
  try { return localStorage.getItem(THEME_STORE_KEY) || ''; } catch { return ''; }
}

/** @param {string} key
 *  @returns {DesignTheme|null} */
function themeByKey(key) {
  return DESIGN_THEMES.find(t => t.key === key) || null;
}

/** Schriften-Adresse der Richtung - fuer das eigene Fenster und den Mainscreen.
 *  @param {string} key */
function themeFontsHref(key) {
  const t = themeByKey(key);
  return t ? t.fonts : THEME_DEFAULT_FONTS;
}

/* Alle Variablen, die irgendeine Richtung setzt. Beim Wechsel wird erst
   alles davon entfernt - sonst bliebe aus der vorigen Richtung stehen, was
   die neue nicht ueberschreibt. */
const THEME_VAR_NAMES = [...new Set(DESIGN_THEMES.flatMap(t => Object.keys(t.vars)))];

/** Richtung auf ein Dokument anwenden: dieses Fenster oder den Mainscreen.
 *  @param {Document} doc
 *  @param {string} key */
function applyThemeToDoc(doc, key) {
  const root = doc.documentElement;
  THEME_VAR_NAMES.forEach(n => root.style.removeProperty(n));
  const t = themeByKey(key);
  if (t) {
    Object.entries(t.vars).forEach(([n, v]) => root.style.setProperty(n, v));
    root.setAttribute('data-theme', t.key);
    root.style.colorScheme = t.hell ? 'light' : 'dark';
    if (t.hell) root.setAttribute('data-theme-hell', ''); else root.removeAttribute('data-theme-hell');
  } else {
    root.removeAttribute('data-theme');
    root.removeAttribute('data-theme-hell');
    root.style.removeProperty('color-scheme');
  }
  /* Eigener <link> neben dem festen aus index.html: der feste bleibt fuer
     das Studio-Blau und die Logos stehen, dieser kommt fuer die Richtung
     dazu. Ohne Richtung wird er entfernt. */
  const alt = doc.getElementById('theme-fonts');
  if (alt) alt.remove();
  if (t) {
    const l = doc.createElement('link');
    l.id = 'theme-fonts';
    l.rel = 'stylesheet';
    l.href = t.fonts;
    doc.head.appendChild(l);
  }
}

/** Richtung waehlen, merken und ueberall anwenden.
 *  @param {string} key */
function applyTheme(key) {
  try {
    if (key) localStorage.setItem(THEME_STORE_KEY, key);
    else localStorage.removeItem(THEME_STORE_KEY);
  } catch {}
  applyThemeToDoc(document, key);
  /* Der Mainscreen ist ein eigenes Dokument: der Spiegel traegt nur den
     <body> herueber, nicht die Variablen am <html>. */
  if (typeof boardWin !== 'undefined' && boardWin && !boardWin.closed) {
    try { applyThemeToDoc(boardWin.document, key); } catch {}
  }
  if (typeof renderDesignScreen === 'function' && document.getElementById('design-list')) renderDesignScreen();
  /* Logo oben und auf dem Wartebildschirm des Mainscreens neu setzen - beide
     haengen an der Richtung (DESIGN_LOGOS). Der Spiegel traegt #board-idle
     von selbst hinueber. */
  if (typeof renderIryoHubLogo === 'function') {
    if (screenActive('menu-screen') || screenActive('design-screen')) renderIryoHubLogo();
    if (typeof BOARD_IDLE_WIDTH !== 'undefined') renderIryoHubLogo('board-idle', BOARD_IDLE_WIDTH, 4);
  }
}

/* Sofort beim Laden - der Grund, warum diese Datei im <head> steht. */
applyThemeToDoc(document, themeKey());

/* ── Auswahl-Screen ─────────────────────────────────────────────────────── */

/** Die Entwurfs-Galerie (designs/) in einem eigenen Tab, auf Wunsch gleich
 *  bei einer bestimmten Richtung. Sie bleibt ein eigenes Dokument ohne
 *  Zugriff auf js/ oder Firebase - deshalb kein Screen, sondern ein Tab.
 *  @param {string} [key] */
function openDesignGallery(key) {
  const i = key ? DESIGN_THEMES.findIndex(t => t.key === key) : -1;
  const ziel = new URL('designs/' + (i >= 0 ? '#' + (i + 1) + '/Menu' : ''), location.href).href;
  const w = window.open(ziel, 'iryo-designs');
  if (!w) alert('Der Browser hat den Tab blockiert.\n\nPop-ups für diese Seite erlauben und noch einmal klicken.');
}

/** Der Knopf im Hauptmenue: fuehrt in die Design-Auswahl. */
function openDesigns() {
  showScreen('design-screen');
  renderDesignScreen();
}

/** Fuenf Farbfelder, die eine Richtung auf einen Blick zeigen.
 *  @param {Object<string,string>} v */
function themeSwatchesHtml(v) {
  return [v['--bg'], v['--panel'], 'rgb(' + v['--gold-rgb'] + ')', v['--fg'], v['--accent-line']]
    .map(c => `<span class="design-swatch" style="background:${escAttr(c)}"></span>`).join('');
}

function renderDesignScreen() {
  const aktiv = themeKey();
  const karte = (/** @type {DesignTheme|null} */ t) => {
    const key = t ? t.key : '';
    const an = key === aktiv;
    const vorschau = t
      ? `<iframe src="designs/s/${escAttr(t.key)}-Menu.html" loading="lazy" tabindex="-1" title="Vorschau ${escAttr(t.name)}"></iframe>`
      : `<div class="design-pv-classic"><span>IRYO</span><small>Studio-Blau</small></div>`;
    const swatches = t ? themeSwatchesHtml(t.vars)
      : themeSwatchesHtml({ '--bg': '#0b0e2c', '--panel': '#101538', '--gold-rgb': '255,210,63', '--fg': '#fff', '--accent-line': '#D9A62E' });
    const name = t ? `<b>${escapeHtml(t.key)}</b> ${escapeHtml(t.name)}` : '<b>&#9733;</b> Klassik';
    const ansehen = t ? `<button class="btn btn-secondary" onclick="openDesignGallery('${escAttr(t.key)}')">Alle Screens</button>` : '';
    return `<div class="design-card${an ? ' active' : ''}">
      <div class="design-pv">${vorschau}</div>
      <div class="design-meta"><span class="design-name">${name}</span><span class="design-swatches">${swatches}</span></div>
      <div class="design-actions">
        ${an ? '<span class="design-on">✓ Aktiv</span>'
             : `<button class="btn btn-primary" onclick="applyTheme('${escAttr(key)}')">Verwenden</button>`}
        ${ansehen}
      </div>
    </div>`;
  };
  setHtml('design-list', [karte(null), ...DESIGN_THEMES.map(karte)].join(''));
  designPreviewScale();
  const t = themeByKey(aktiv);
  setText('design-current', t ? t.key + ' · ' + t.name : 'Klassik (Studio-Blau)');
}

/* Die Vorschau zeigt den 1280 px breiten Entwurf auf Kartenbreite. Die
   Kartenbreite steht erst nach dem Layout fest und aendert sich mit dem
   Fenster - daher gemessen statt fest eingetragen. */
function designPreviewScale() {
  const list = document.getElementById('design-list');
  const pv = list && /** @type {HTMLElement|null} */ (list.querySelector('.design-pv'));
  if (!pv || !pv.offsetWidth) return;
  list.style.setProperty('--pv-scale', String(pv.offsetWidth / 1280));
}
window.addEventListener('resize', () => { if (screenActive('design-screen')) designPreviewScale(); });
