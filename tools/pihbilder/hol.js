// Bilder fuer ein "Preis ist heiss"-Set von Wikimedia Commons holen.
//
//   node tools/pihbilder/hol.js sets/dpih-halloween.json
//
// Warum Commons und nicht die Bildersuche: hier ist die Lizenz je Datei
// maschinenlesbar (extmetadata), der Urheber steht dabei und darf in eine
// Quellenliste. Produktfotos aus einem Shop waeren fremdes Material ohne
// Freigabe - die liegen in einer Show vor Publikum nicht auf der Leinwand.
//
// Die Bilder landen als Dateien in <set>-bilder/, NICHT in der JSON: ein Bild
// steckt im Spiel als Daten-URL (setMediaSlot in js/core.js), 91 davon sprengen
// den localStorage. Die Dateinamen sind so gebaut, dass pihImportFolder()
// Artikel und Preis daraus liest ("01_Name_4,50.jpg").
//
// Verworfen: Pexels/Unsplash (API-Schluessel noetig, Urheber nicht in der
// Antwort) und eigene SVG-Zeichnungen (91 Stueck von Hand, und ein Kuerbis als
// Piktogramm hilft beim Preisschaetzen nicht).

const fs = require('fs');
const path = require('path');
const https = require('https');

const UA = 'IryoGameshowsBilderhol/1.0 (https://iryo.party)';
const BREITE = 640;        // reicht auf 1280x720, haelt die Dateien klein

// Je Artikel ein Suchbegriff, in der Reihenfolge der Artikel in der JSON.
// Englisch, weil Commons-Dateinamen und -Beschreibungen ueberwiegend englisch
// sind; deutsche Begriffe fanden in Stichproben deutlich seltener etwas.
const SUCHE = [
  "Category:Pumpkins",                  // 1 Ein Speisekürbis, 3 kg, vom Hofladen
  "hokkaido pumpkin",                   // 2 Ein Hokkaido-Kürbis aus dem Supermarkt
  "giant pumpkin competition",          // 3 Ein Zuchtkürbis für den Wettbewerb, 50
  "latte paper cup coffee",             // 4 Ein Pumpkin Spice Latte to go, groß
  "syrup bottle",                       // 5 Ein Liter Kürbisgewürz-Sirup
  "pumpkin seeds",                      // 6 Ein Kilo Kürbiskerne, geschält
  "Category:Halloween candy",           // 7 Ein Großpack Halloween-Süßigkeiten, 1 
  "gummy bears",                        // 8 Ein Eimer Gummibärchen, 1,8 kg
  "candy cane",                         // 9 Eine einzelne Zuckerstange
  "halloween pumpkin candy bucket",     // 10 Ein Kürbis-Eimer zum Süßigkeiten-Samme
  "dental hygienist cleaning",          // 11 Eine professionelle Zahnreinigung
  "dental technician prosthesis",       // 12 Ein Satz maßgefertigte Vampirzähne vom
  "contact lens",                       // 13 Ein Paar Zombie-Kontaktlinsen ohne Stä
  "fake blood",                         // 14 Ein Fläschchen Kunstblut, 100 ml
  "plastic jerrycan container",         // 15 Ein Kanister Kunstblut, 5 Liter
  "Category:Latex masks",               // 16 Eine Silikonmaske in Hollywood-Qualitä
  "ice hockey goalie mask",             // 17 Eine weiße Hockeymaske
  "plague doctor mask",                 // 18 Eine Pest-Doktor-Maske aus Leder
  "scythe mowing grass",                // 19 Eine echte Sense vom Baumarkt
  "spray can aerosol",                  // 20 Ein Spinnennetz-Spray, 150 ml
  "halloween cobweb decoration",        // 21 Zehn Meter Deko-Spinnennetz
  "Category:Toy spiders",               // 22 Eine Plastikspinne, handtellergroß
  "tarantula spider",                   // 23 Eine echte Vogelspinne aus der Zoohand
  "Category:Terrariums",                // 24 Ein Terrarium für die Vogelspinne
  "bat box roost",                      // 25 Ein Fledermauskasten für den Garten
  "human skull specimen museum",        // 26 Ein echter menschlicher Schädel als Sa
  "granite gravestone",                 // 27 Ein Grabstein aus Granit, mit Gravur
  "Category:Graves in Germany",         // 28 Eine Grabstelle, 25 Jahre Pacht in ein
  "Category:Coffins",                   // 29 Eine einfache Bestattung mit Sarg
  "fog machine stage",                  // 30 Eine Nebelmaschine, 700 Watt
  "strobe light",                       // 31 Ein Stroboskop-Licht
  "inflatable ghost halloween",         // 32 Ein aufblasbarer Geist für den Vorgart
  "motion sensor detector",             // 33 Ein Bewegungsmelder mit Schrei-Sound
  "audio amplifier module board",       // 34 Ein Soundmodul mit Kettenrasseln
  "Category:Brooms",                    // 35 Eine Hexenbesen-Deko
  "besom broom twig",                   // 36 Ein echter Reisigbesen vom Baumarkt
  "witch costume hat",                  // 37 Ein Hexenkostüm, dreiteilig
  "Category:Inflatable costumes",       // 38 Ein aufblasbares Dinosaurier-Ganzkörpe
  "white bed sheet",                    // 39 Ein weißes Bettlaken, 180 × 290 cm
  "dog halloween costume",              // 40 Ein Hundekostüm als Kürbis, Größe M
  "Category:Devil costumes",            // 41 Ein Paar Teufelshörner mit Glitzer
  "bunny ears costume",                 // 42 Ein Paar Hasenohren in Playboy-Optik
  "nurse costume",                      // 43 Ein Kostüm „sexy Krankenschwester“, dr
  "corset",                             // 44 Ein Vampir-Korsett mit Schnürung
  "condom package",                     // 45 Eine Großpackung Kondome, 144 Stück
  "advent calendar",                    // 46 Ein Erotik-Adventskalender
  "Category:Pornhub",                   // 47 Ein Jahr Pornhub Premium
  "inflatable doll",                    // 48 Eine aufblasbare Partnerpuppe, Scherza
  "pole dancing",                       // 49 Ein Striptease-Kurs für Paare, ein Abe
  "pasta noodles dry",                  // 50 Ein Nudel-Scherzartikel in anstößiger 
  "ouija board",                        // 51 Ein Ouija-Brett aus Holz
  "tarot cards",                        // 52 Ein Tarotkartendeck
  "holy water bottle",                  // 53 Eine Flasche Weihwasser aus Lourdes
  "garlic bulbs",                       // 54 Ein Kilo Knoblauch
  "Category:Silver necklaces",          // 55 Ein Silberkettchen, 925er, 45 cm
  "night vision device",                // 56 Ein Nachtsichtgerät, Einsteigerklasse
  "thermal imaging camera",             // 57 Eine Wärmebildkamera fürs Handy
  "ghost train funfair ride",           // 58 Eine Fahrt in der Geisterbahn auf dem 
  "amusement park entrance",            // 59 Ein Tagesticket im Movie Park am Hallo
  "Category:Wax museums",               // 60 Ein Ticket fürs Gruselkabinett
  "Category:Bran Castle",               // 61 Eine Führung durch Schloss Bran in Rum
  "zombie walk",                        // 62 Eine Startgebühr für einen Zombie-Lauf
  "special effects makeup artist",      // 63 Ein Horror-Schminkkurs, ein Tag
  "makeup palette",                     // 64 Eine Horror-Make-up-Palette, 12 Farben
  "blu-ray disc",                       // 65 Eine Blu-ray-Box mit zehn Horror-Klass
  "jägermeister bottle",                // 66 Ein Liter Jägermeister
  "doner kebab",                        // 67 Ein Döner um drei Uhr nachts
  "aspirin tablets blister",            // 68 Eine Packung Kopfschmerztabletten, 20 
  "breakfast cafe table",               // 69 Ein Kater-Frühstück im Café, zwei Pers
  "hearse car",                         // 70 Ein gebrauchter Leichenwagen mit 180 0
];

// Leer seit `%s`: das Set enthaelt nur noch die 70 Artikel, zu denen es ein
// Bild gibt - die 21 ohne sind auf Davids Ansage raus. Wer neue Artikel
// aufnimmt, traegt hier wieder ein; was frueher drinstand (Nachsuche,
// Kategorien, aussortierte Treffer samt Grund) steht in der HANDOFF.
const NACHSUCHE = {};

const WEG = {};

const KATEGORIE = {};

/** @param {string} url @param {boolean} binaer */
function hol(url, binaer){
  return new Promise((ok, fehl) => {
    https.get(url, { headers: { 'User-Agent': UA } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        return hol(res.headers.location, binaer).then(ok, fehl);
      }
      if (res.statusCode !== 200) { res.resume(); return fehl(new Error('HTTP ' + res.statusCode)); }
      const teile = [];
      res.on('data', c => teile.push(c));
      res.on('end', () => {
        const b = Buffer.concat(teile);
        ok(binaer ? b : b.toString('utf8'));
      });
    }).on('error', fehl);
  });
}

/** Erster brauchbarer Commons-Treffer zu einem Suchbegriff. */
async function suche(begriff){
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2',
    generator: 'search', gsrsearch: 'filetype:bitmap ' + begriff,
    gsrnamespace: '6', gsrlimit: '8',
    prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: String(BREITE),
  });
  const txt = await hol('https://commons.wikimedia.org/w/api.php?' + q, false);
  const d = JSON.parse(txt);
  const seiten = (d.query && d.query.pages) || [];
  for (const s of seiten){
    const ii = s.imageinfo && s.imageinfo[0];
    if (!ii || !ii.thumburl) continue;
    if (!/^image\/(jpeg|png)$/.test(ii.mime)) continue;
    const em = ii.extmetadata || {};
    const feld = k => (em[k] && em[k].value ? String(em[k].value) : '');
    return {
      titel: s.title,
      thumb: ii.thumburl,
      seite: ii.descriptionurl,
      autor: feld('Artist').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || 'unbekannt',
      lizenz: feld('LicenseShortName') || 'siehe Dateiseite',
    };
  }
  return null;
}

/** Erste brauchbare Datei aus einer Commons-Kategorie.
 *  @param {string} kat */
async function ausKategorie(kat){
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2',
    generator: 'categorymembers', gcmtitle: 'Category:' + kat,
    gcmtype: 'file', gcmlimit: '30',
    prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: String(BREITE),
  });
  const d = JSON.parse(await hol('https://commons.wikimedia.org/w/api.php?' + q, false));
  const seiten = (d.query && d.query.pages) || [];
  for (const s of seiten){
    const ii = s.imageinfo && s.imageinfo[0];
    if (!ii || !ii.thumburl) continue;
    if (!/^image\/(jpeg|png)$/.test(ii.mime)) continue;
    const em = ii.extmetadata || {};
    const feld = k => (em[k] && em[k].value ? String(em[k].value) : '');
    return {
      titel: s.title, thumb: ii.thumburl, seite: ii.descriptionurl,
      autor: feld('Artist').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || 'unbekannt',
      lizenz: feld('LicenseShortName') || 'siehe Dateiseite',
    };
  }
  return null;
}

/** Dateiname, aus dem pihImportFolder() Name und Preis liest. */
function dateiname(i, artikel){
  const nr = String(i + 1).padStart(2, '0');
  const name = artikel.name
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/[„“”]/g, '')
    .replace(/_/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const preis = Number(artikel.price).toFixed(2).replace('.', ',');
  return `${nr}_${name}_${preis}.jpg`;
}

async function main(){
  const setPfad = process.argv[2];
  if (!setPfad){ console.error('Aufruf: node tools/pihbilder/hol.js <set.json>'); process.exit(2); }
  const set = JSON.parse(fs.readFileSync(setPfad, 'utf8'));
  if (set.items.length !== SUCHE.length){
    console.error(`Set hat ${set.items.length} Artikel, SUCHE hat ${SUCHE.length} Begriffe - das muss zusammenpassen.`);
    process.exit(2);
  }
  const ziel = setPfad.replace(/\.json$/, '') + '-bilder';
  fs.mkdirSync(ziel, { recursive: true });

  // --nachsuche: nur die Nummern aus NACHSUCHE neu holen, alles andere so
  // lassen, wie es in quellen.json steht. Spart 65 unnoetige Abfragen und
  // haelt die Treffer, die beim ersten Lauf gepasst haben.
  const nurNach = process.argv.includes('--nachsuche');
  const nurKat = process.argv.includes('--kategorien');
  const aufraeumen = process.argv.includes('--aufraeumen');
  const altPfad = path.join(ziel, 'quellen.json');
  const alt = ((nurNach || nurKat || aufraeumen) && fs.existsSync(altPfad))
    ? JSON.parse(fs.readFileSync(altPfad, 'utf8')) : { bilder: [] };
  const altNach = new Map(alt.bilder.map(b => [b.nr, b]));

  const quellen = [];
  const fehlend = [];

  // --aufraeumen holt nichts, es wirft die Nummern aus WEG hinaus und loescht
  // jede Datei, die danach in quellen.json nicht mehr vorkommt. Dazu gehoeren
  // auch die Bilder, deren Nachsuche nichts fand: dort lag noch der schlechte
  // Treffer der ersten Runde auf der Platte.
  if (aufraeumen){
    for (const b of alt.bilder){
      if (WEG[b.nr]){ fehlend.push({ nr: b.nr, name: b.artikel, begriff: b.begriff, grund: WEG[b.nr] }); continue; }
      quellen.push(b);
    }
    for (const f of (alt.fehlend || [])) fehlend.push(f);
    const behalten = new Set(quellen.map(q => q.datei));
    for (const f of fs.readdirSync(ziel)){
      if (/\.(json|md)$/i.test(f)) continue;
      if (behalten.has(f)) continue;
      fs.unlinkSync(path.join(ziel, f));
      console.log('geloescht\t' + f);
    }
  }

  if (!aufraeumen) for (let i = 0; i < set.items.length; i++){
    const it = set.items[i];
    const kat = KATEGORIE[i + 1];
    const begriff = nurKat && kat ? 'Category:' + kat : (NACHSUCHE[i + 1] || SUCHE[i]);
    if ((nurNach && !NACHSUCHE[i + 1]) || (nurKat && !kat)) {
      const b = altNach.get(i + 1);
      if (b) quellen.push(b);
      else fehlend.push({ nr: i + 1, name: it.name, begriff });
      continue;
    }
    let t = null;
    try { t = nurKat && kat ? await ausKategorie(kat) : await suche(begriff); }
    catch (e) { console.log(`${i + 1}\tSUCHE FEHL\t${begriff}\t${e.message}`); }
    if (!t){ fehlend.push({ nr: i + 1, name: it.name, begriff }); if (!quellen.length) {} console.log(`${i + 1}\tkein Treffer\t${begriff}`); continue; }
    const datei = dateiname(i, it);
    try {
      const bild = await hol(t.thumb, true);
      fs.writeFileSync(path.join(ziel, datei), bild);
      quellen.push({
        nr: i + 1, artikel: it.name, datei, bytes: bild.length,
        begriff, commons: t.titel, seite: t.seite, autor: t.autor, lizenz: t.lizenz,
      });
      console.log(`${i + 1}\tok\t${Math.round(bild.length / 1024)} KB\t${t.titel}`);
    } catch (e) {
      fehlend.push({ nr: i + 1, name: it.name, begriff, fehler: e.message });
      console.log(`${i + 1}\tDOWNLOAD FEHL\t${t.thumb}\t${e.message}`);
    }
  }

  fs.writeFileSync(path.join(ziel, 'quellen.json'),
    JSON.stringify({ geholt: new Date().toISOString().slice(0, 10), breite: BREITE, bilder: quellen, fehlend }, null, 2) + '\n');

  const zeilen = quellen.map(q =>
    `| ${q.nr} | ${q.datei} | [${q.commons}](${q.seite}) | ${q.autor} | ${q.lizenz} |`).join('\n');
  fs.writeFileSync(path.join(ziel, 'LIESMICH.md'),
`# Bilder zum Set \`${path.basename(setPfad)}\`

Geholt mit \`node tools/pihbilder/hol.js ${setPfad}\` von Wikimedia Commons,
Breite ${BREITE} px. **Dieser Ordner ist in \`.gitignore\`** — die Bilder sind
fremdes Material unter freier Lizenz, das Repo bleibt frei davon. Die Liste
unten ist der Nachweis; bei Weitergabe gehoert sie dazu.

Laden im Host: **Der Preis ist heiss → Ordner einlesen**. Aus dem Dateinamen
kommen Artikel und Preis (\`01_Name_4,50.jpg\`). Das legt neue Artikel an und
haengt die Bilder NICHT an ein schon importiertes Set.

${quellen.length} von ${quellen.length + fehlend.length} Artikeln haben ein Bild.

| Nr | Datei | Commons | Urheber | Lizenz |
|---|---|---|---|---|
${zeilen}
${fehlend.length ? `\n## Ohne Bild\n\n${fehlend.map(f => `- ${f.nr} ${f.name} (gesucht: \`${f.begriff}\`)`).join('\n')}\n` : ''}`);

  const summe = quellen.reduce((a, q) => a + q.bytes, 0);
  console.log(`\n${quellen.length} Bilder, ${fehlend.length} ohne Treffer, ${(summe / 1024 / 1024).toFixed(2)} MB nach ${ziel}`);
}

main().catch(e => { console.error(e); process.exit(1); });
