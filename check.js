#!/usr/bin/env node
/* Pruefer fuer die Gameshow-Seite.  Aufruf:  node check.js
 *
 * Prueft drei Dinge, die hier erfahrungsgemaess schiefgehen koennen:
 *
 *  1. Syntax aller js/-Dateien.
 *  2. Ob jeder Funktionsname, der aus einem Inline-Handler heraus aufgerufen
 *     wird, im JavaScript auch wirklich existiert.
 *  3. Ob in styles.css die geschweiften Klammern aufgehen.
 *
 * Punkt 2 ist der eigentliche Grund fuer dieses Skript. Die App haengt an rund
 * 320 Inline-Handlern; etwa 230 davon stehen nicht im Markup, sondern werden
 * zur Laufzeit als Zeichenkette zusammengebaut:
 *
 *     onclick="resetPlayerPassword('${p.key}', ${escJsArg(p.name)})"
 *
 * Fuer jedes Werkzeug ist das Text. Kein Editor, kein Linter und auch
 * TypeScript sieht dort einen Funktionsnamen. Benennt jemand eine Funktion um
 * und uebersieht eine dieser Zeichenketten, faellt das erst auf, wenn waehrend
 * der Show jemand auf den Knopf drueckt. Genau diese Luecke schliesst der
 * Pruefer.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
const problems = [];
const notes = [];

/* ── Hilfsmittel ──────────────────────────────────────────────────────── */

// Zeilen, die reiner Kommentar sind, fliegen vor der Handler-Suche raus.
// Sonst zaehlt ein erklaerendes onclick="opener.xxx()" in einem Kommentar als
// echter Aufruf. Ersetzt wird durch eine leere Zeile, damit die Zeilennummern
// in den Meldungen stimmen bleiben.
function stripCommentLines(text) {
  return text.split(/\r?\n/).map(line => {
    const t = line.trim();
    return (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) ? '' : line;
  });
}

/* ── 1. Syntax ────────────────────────────────────────────────────────── */

const jsDir = path.join(root, 'js');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js')).sort();
const sources = [];

for (const file of jsFiles) {
  const rel = 'js/' + file;
  const text = fs.readFileSync(path.join(jsDir, file), 'utf8');
  sources.push({ name: rel, text });
  try {
    new vm.Script(text, { filename: rel });
  } catch (e) {
    problems.push(rel + ': Syntaxfehler - ' + e.message);
  }
}

/* ── 2. Inline-Handler ────────────────────────────────────────────────── */

// Alles, was global ansprechbar ist. Die Handler laufen im globalen Scope,
// also zaehlt nur, was auf oberster Ebene deklariert wird.
const defined = new Set();
for (const { text } of sources) {
  for (const m of text.matchAll(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/gm)) defined.add(m[1]);
  for (const m of text.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) defined.add(m[1]);
  // window.foo = ... als ausdrueckliche Veroeffentlichung
  for (const m of text.matchAll(/^window\.([A-Za-z_$][\w$]*)\s*=/gm)) defined.add(m[1]);
}

// Namen, die der Browser selbst mitbringt oder die Sprache belegt.
const builtin = new Set([
  'alert', 'confirm', 'prompt', 'console', 'setTimeout', 'clearTimeout',
  'setInterval', 'clearInterval', 'requestAnimationFrame', 'fetch',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'encodeURIComponent',
  'decodeURIComponent', 'Number', 'String', 'Boolean', 'Array', 'Object',
  'Date', 'Math', 'JSON', 'Set', 'Map', 'Promise', 'Error', 'RegExp',
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'function',
]);

const sourcesToScan = [
  { name: 'index.html', text: fs.readFileSync(path.join(root, 'index.html'), 'utf8') },
  ...sources,
];

let callsChecked = 0;
let callsDynamic = 0;
for (const { name, text } of sourcesToScan) {
  stripCommentLines(text).forEach((line, i) => {
    for (const attr of line.matchAll(/\son[a-z]+\s*=\s*"([^"]*)"/g)) {
      // Template-Einsetzungen entfernen: der Inhalt von ${...} ist normales
      // JavaScript und wird schon beim Erzeugen ausgewertet - dort steht kein
      // Handler-Name. Ohne das zaehlt onclick="${buildOnClick(i,'null')}" als
      // Aufruf einer Funktion buildOnClick, die aber nur ein Parameter ist.
      const body = attr[1].replace(/\$\{[^}]*\}/g, '');
      for (const call of body.matchAll(/([A-Za-z_$][\w$.]*)\s*\(/g)) {
        const raw = call[1];
        // GM-Fenster rufen ins Hauptfenster zurueck: opener.foo() -> foo
        const fn = raw.startsWith('opener.') ? raw.slice(7) : raw;
        // Nach dem Entfernen der ${...} leer: der Funktionsname selbst war eine
        // Template-Einsetzung, z.B. onclick="opener.${togglerName}(${i})".
        // Welche Funktion das zur Laufzeit ist, kann ein statischer Pruefer
        // nicht wissen - solche Stellen werden gezaehlt, nicht bemaengelt.
        if (!fn) { callsDynamic++; continue; }
        // Methodenaufrufe auf einem Objekt (SFX.toggle, this.focus) pruefen wir
        // nicht - dafuer muesste man den Typ kennen.
        if (fn.includes('.')) continue;
        if (builtin.has(fn)) continue;
        callsChecked++;
        if (!defined.has(fn)) {
          problems.push(name + ':' + (i + 1) + ': Handler ruft ' + fn + '() auf - nicht definiert');
        }
      }
    }
  });
}

/* ── 3. styles.css ────────────────────────────────────────────────────── */

const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const open = (css.match(/\{/g) || []).length;
const close = (css.match(/\}/g) || []).length;
if (open !== close) {
  problems.push('styles.css: ' + open + ' oeffnende, ' + close + ' schliessende Klammern - unausgeglichen');
}

/* ── 4. Typpruefung (nur mit --types) ─────────────────────────────────── */

// TypeScript prueft alles unter js/ - checkJs steht in jsconfig.json auf
// true, seit alle Dateien sauber sind. Ein Build-Step wird daraus nicht:
// tsc liest nur und erzeugt nichts (noEmit). Die ausgelieferten Dateien
// bleiben unveraendert.
//
// Der Marker "// @ts-check" oben in jeder Datei ist damit nicht mehr noetig,
// bleibt aber stehen: er sagt beim Oeffnen einer Datei sofort, woran man ist,
// und faengt den Fall ab, dass jemand ohne jsconfig.json in die Datei schaut.
// Traegt eine Datei ihn nicht, wird das unten gemeldet - nicht als Fehler,
// sondern als Hinweis.
//
// Ein Durchlauf dauert rund eine halbe Minute und braucht beim ersten Mal das
// Netz, um TypeScript zu holen. Deshalb laeuft er nicht bei jedem Commit mit,
// sondern auf Zuruf:
//
//     node check.js --types
//
// Fehlt TypeScript und ist kein Netz da, wird uebersprungen statt zu scheitern.
const tsChecked = jsFiles.filter(f =>
  fs.readFileSync(path.join(jsDir, f), 'utf8').startsWith('// @ts-check'));

if (process.argv.includes('--types')) {
  const { spawnSync } = require('child_process');
  // Unter Windows ist npx eine .cmd-Datei, und die laesst Node seit einer
  // Sicherheitskorrektur nur ueber die Shell starten. Der Befehl steht
  // deshalb als eine Zeichenkette da statt als Argumentliste: so entfaellt
  // die Warnung DEP0190, die vor unmaskierten Argumenten warnt. Hier sind
  // ohnehin alle Bestandteile feste Literale, nichts davon kommt von aussen.
  const run = spawnSync('npx --yes -p typescript@5 tsc -p jsconfig.json',
    { cwd: root, encoding: 'utf8', shell: true });
  if (run.error || run.status === null) {
    notes.push('Typpruefung uebersprungen - TypeScript nicht verfuegbar');
  } else if (run.status !== 0) {
    const out = String(run.stdout || '') + String(run.stderr || '');
    const found = out.split(/\r?\n/).filter(l => l.includes('error TS'));
    if (found.length) found.forEach(l => problems.push('Typ: ' + l.trim()));
    else problems.push('Typpruefung fehlgeschlagen: ' + out.trim().slice(0, 300));
  } else {
    notes.push(jsFiles.length + ' js-Dateien typgeprueft - keine Meldung');
  }
} else {
  notes.push(tsChecked.length === jsFiles.length
    ? 'alle ' + jsFiles.length + ' js-Dateien tragen // @ts-check (pruefen mit --types)'
    : tsChecked.length + ' von ' + jsFiles.length + ' Dateien tragen // @ts-check'
      + ' - ohne Marker wird trotzdem geprueft (pruefen mit --types)');
}

/* ── Ergebnis ─────────────────────────────────────────────────────────── */

notes.push(jsFiles.length + ' js-Dateien syntaktisch geprueft');
notes.push(callsChecked + ' Handler-Aufrufe gegen ' + defined.size + ' globale Namen geprueft');
if (callsDynamic) {
  notes.push(callsDynamic + ' Handler mit zur Laufzeit eingesetztem Funktionsnamen - nicht pruefbar');
}
notes.push('styles.css: ' + open + ' Klammernpaare');

console.log(notes.map(n => '  ' + n).join('\n'));

if (problems.length) {
  console.error('\nFEHLER (' + problems.length + '):');
  problems.forEach(p => console.error('  ' + p));
  process.exit(1);
}
console.log('\nalles in Ordnung');
