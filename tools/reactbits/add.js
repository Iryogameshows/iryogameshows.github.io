// Holt eine React-Bits-Komponente aus dem oeffentlichen Registry
// (https://reactbits.dev/r/<Name>-JS-CSS.json), legt sie unter src/components/
// ab, installiert ihre npm-Abhaengigkeiten und baut danach neu.
//
//   node add.js ShinyText BlurText
//
// Es wird immer die Variante JS-CSS geholt (kein Tailwind in diesem Projekt).
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.join(__dirname, 'src', 'components');
const names = process.argv.slice(2);
if (!names.length) {
  console.error('Aufruf: node add.js <Komponente> [...]   z. B. ShinyText');
  process.exit(1);
}

(async () => {
  fs.mkdirSync(dir, { recursive: true });
  const deps = new Set();
  for (const raw of names) {
    const name = raw.replace(/-JS-CSS$/, '');
    const res = await fetch(`https://reactbits.dev/r/${name}-JS-CSS.json`);
    if (!res.ok) {
      console.error(`${name}: HTTP ${res.status} - gibt es die Komponente?`);
      process.exit(1);
    }
    const item = await res.json();
    for (const f of item.files) {
      const target = path.join(dir, path.basename(f.path));
      fs.writeFileSync(target, f.content);
      console.log('geschrieben:', path.relative(__dirname, target));
    }
    (item.dependencies || []).forEach(d => deps.add(d));
    if ((item.registryDependencies || []).length) {
      console.log(`${name}: braucht zusaetzlich`, item.registryDependencies.join(', '),
        '- bitte ebenfalls mit add.js holen');
    }
  }
  if (deps.size) {
    console.log('npm install', [...deps].join(' '));
    execSync('npm install ' + [...deps].join(' '), { cwd: __dirname, stdio: 'inherit' });
  }
  execSync('node build.js', { cwd: __dirname, stdio: 'inherit' });
})();
