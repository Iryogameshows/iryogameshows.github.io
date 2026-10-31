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
  'pumpkin vegetable',            // 1  Speisekuerbis
  'hokkaido pumpkin',             // 2
  'giant pumpkin competition',    // 3
  'pumpkin carving knife',        // 4
  'latte paper cup coffee',       // 5
  'syrup bottle',                 // 6
  'pumpkin seeds',                // 7
  'led candle',                   // 8
  'halloween candy',              // 9
  'gummy bears',                  // 10
  'candy cane',                   // 11
  'trick or treat bucket',        // 12
  'dental hygienist cleaning',    // 13
  'vampire teeth costume',        // 14
  'dental technician prosthesis', // 15
  'contact lens',                 // 16
  'fake blood',                   // 17
  'jerrycan canister',            // 18
  'zombie mask',                  // 19
  'silicone prosthetic mask',     // 20
  'ice hockey goalie mask',       // 21
  'claw glove costume',           // 22
  'plague doctor mask',           // 23
  'scythe tool',                  // 24
  'spray can aerosol',            // 25
  'halloween cobweb decoration',  // 26
  'toy spider plastic',           // 27
  'tarantula spider',             // 28
  'terrarium glass tank',         // 29
  'taxidermy raven crow',         // 30
  'bat box roost',                // 31
  'halloween skeleton decoration',// 32
  'giant skeleton halloween yard',// 33
  'anatomical skeleton model',    // 34
  'human skull',                  // 35
  'halloween tombstone prop',     // 36
  'granite gravestone',           // 37
  'cemetery grave row',           // 38
  'coffin funeral',               // 39
  'fog machine stage',            // 40
  'fluid canister plastic',       // 41
  'strobe light',                 // 42
  'halloween string lights',      // 43
  'inflatable halloween decoration', // 44
  'motion sensor detector',       // 45
  'loudspeaker module electronics',  // 46
  'witch broom halloween',        // 47
  'besom broom twig',             // 48
  'witch costume hat',            // 49
  'inflatable dinosaur costume',  // 50
  'white bed sheet',              // 51
  'vampire cape costume',         // 52
  'dog halloween costume',        // 53
  'cat costume pet',              // 54
  'devil horns costume',          // 55
  'bunny ears costume',           // 56
  'nurse costume',                // 57
  'corset',                       // 58
  'handcuffs fur',                // 59
  'condom package',               // 60
  'advent calendar',              // 61
  'pornhub logo',                 // 62
  'inflatable doll',              // 63
  'pole dancing',                 // 64
  'wall calendar firefighters',   // 65
  'pasta noodles dry',            // 66
  'ouija board',                  // 67
  'tarot cards',                  // 68
  'fortune teller crystal ball',  // 69
  'holy water bottle',            // 70
  'garlic bulbs',                 // 71
  'silver necklace chain',        // 72
  'emf meter',                    // 73
  'night vision device',          // 74
  'thermal imaging camera',       // 75
  'ghost train funfair ride',     // 76
  'amusement park entrance',      // 77
  'escape room',                  // 78
  'wax museum chamber of horrors',// 79
  'bran castle',                  // 80
  'haunted manor house england',  // 81
  'zombie walk',                  // 82
  'special effects makeup artist',// 83
  'makeup palette',               // 84
  'wound special effects makeup', // 85
  'blu-ray disc',                 // 86
  'jägermeister bottle',          // 87
  'doner kebab',                  // 88
  'aspirin tablets blister',      // 89
  'breakfast cafe table',         // 90
  'hearse car',                   // 91
];

// Zweiter Versuch fuer Artikel, deren erster Treffer sichtbar nicht passte
// (Nr. aus quellen.json). Die Titel der ersten Runde standen in der Konsole;
// daneben lagen u. a. ein Brief von 1850 als "Krallenhandschuh", ein
// Wehrmachtskanister als Kunstblut-Kanister und zwei Aufnahmen, die in einem
// Partyspiel nichts zu suchen haben (Gedenkstaette, Sklavenfesseln).
const NACHSUCHE = {
  4:  'pumpkin carving kit',
  8:  'electric tea light candle',
  9:  'halloween candy bowl',
  12: 'halloween pumpkin candy bucket',
  18: 'plastic jerrycan container',
  22: 'costume claw gloves',
  24: 'scythe mowing grass',
  29: 'glass terrarium enclosure',
  30: 'stuffed crow taxidermy',
  35: 'human skull specimen museum',
  38: 'cemetery headstones churchyard',
  39: 'wooden coffin',
  44: 'inflatable ghost halloween',
  46: 'audio amplifier module board',
  50: 'inflatable t-rex costume',
  52: 'dracula costume cape',
  55: 'devil horns headband',
  59: 'novelty handcuffs pink',
  73: 'gaussmeter electromagnetic field meter',
  79: 'wax museum figures',
  85: 'prosthetic makeup wound',
  // Erste Runde ohne Treffer:
  20: 'silicone mask head',
  33: 'halloween skeleton garden tall',
  36: 'halloween graveyard decoration tombstone',
  41: 'plastic bottle five litre',
  65: 'firefighter charity calendar',
};

// Nach Sicht aussortiert (`--aufraeumen`). Commons findet zu Konsumartikeln
// oft irgendetwas, das das Suchwort im Text hat: ein Brief von 1841, ein
// Buchscan von 1910, Bela Lugosis Grabstein als "Vampirumhang". Ein falsches
// Bild auf der Leinwand ist schlechter als keins - die Nummern hier fliegen
// samt Datei raus, der Artikel bleibt ohne Bild.
const WEG = {
  // Runde 1+2 (Volltextsuche), Runde 3 (Kategorie) brachte nichts Besseres.
  // Jede Nummer einzeln angesehen; ein falsches Bild auf der Leinwand ist
  // schlechter als keins, der Artikel bleibt dann ohne.
  4:  'Kuerbisse auf Regalen, kein Schnitzset',
  8:  'schwedischer Lichterbogen, keine LED-Kerze fuer den Kuerbis',
  14: 'Strassenszene mit Dracula-Kostuem, kein Gebiss',
  19: 'geschminktes Zombie-Paar, keine Maske',
  22: 'Brief von 1841 - die Volltextsuche traf den Text, nicht das Bild',
  30: 'Schulklasse 1947, der ausgestopfte Vogel ist Beiwerk',
  32: 'Schaufenster mit Halloween-Figuren, kein 1,70-m-Skelett',
  33: 'dunkle Gruselkabinett-Aufnahme, kein Gartenskelett',
  34: 'anatomische Wachsfigur, kein Lehrskelett',
  41: 'Abwurfbox aus der Praxis, kein Nebelfluid',
  43: 'Landschaft mit Vogelscheuche, keine Lichterkette',
  52: 'Grabstein von Bela Lugosi, kein Umhang',
  54: 'Hunde mit Kuerbissen, keine Katze',
  59: 'Polizei-Handschellen auf einer Schutzweste, kein Scherzartikel',
  65: 'technische Zeichnung, kein Kalender',
  69: 'Zeitungsanzeige mit echter Telefonnummer',
  73: 'Stich eines Acetometers, kein EMF-Messgeraet',
  78: 'Schaubild zu Escape-Room-Anbietern, kein Raum',
  81: 'altes Schwarzweissfoto eines Hauses, kein Hotelbezug',
  85: 'Studio-Aufnahme ohne erkennbare Wunde',
};

// Dritte Runde (`--kategorien`): statt Volltextsuche eine Commons-Kategorie.
// Grund: die Volltextsuche rankt nach Text, nicht nach Motiv - deshalb kamen
// Briefe und Buchscans. In einer Kategorie liegt per Definition das Motiv.
// Openverse (Flickr-CC) waere die bessere Quelle fuer Konsumartikel, die API
// antwortete am 2026-10-31 aber mit 504 bzw. gar nicht.
const KATEGORIE = {
  1:  'Pumpkins',
  4:  'Pumpkin carving',
  8:  'Electric candles',
  9:  'Halloween candy',
  14: 'Vampire costumes',
  19: 'Zombie costumes',
  20: 'Latex masks',
  27: 'Toy spiders',
  29: 'Terrariums',
  30: 'Taxidermied birds',
  32: 'Halloween decorations',
  33: 'Skeleton decorations',
  34: 'Anatomical models of skeletons',
  36: 'Tombstone props',
  38: 'Graves in Germany',
  39: 'Coffins',
  41: 'Plastic containers',
  43: 'Fairy lights',
  47: 'Brooms',
  50: 'Inflatable costumes',
  52: 'Dracula costumes',
  54: 'Cats in costumes',
  55: 'Devil costumes',
  59: 'Handcuffs',
  62: 'Pornhub',
  65: 'Calendars',
  69: 'Fortune-telling',
  72: 'Silver necklaces',
  73: 'Measuring instruments',
  78: 'Escape rooms',
  79: 'Wax museums',
  80: 'Bran Castle',
  81: 'Haunted houses',
  85: 'Special effects makeup',
};

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
