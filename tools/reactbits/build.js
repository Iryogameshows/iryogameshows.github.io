// Baut aus src/components/*.jsx die eine Datei vendor/reactbits.js (+ .css).
// React ist darin enthalten; die Seite braucht kein npm und keinen Build,
// sie laedt nur die fertigen Dateien per <script>/<link>.
//
// In der Seite:
//   ReactBits.mount('ShinyText', element, { text: 'Hallo' })  -> Rueckgabe: Root
//   ReactBits.unmount(element)
//   ReactBits.list()                                          -> Namen
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const compDir = path.join(__dirname, 'src', 'components');
const out = path.join(__dirname, '..', '..', 'vendor');
const names = fs.existsSync(compDir)
  ? fs.readdirSync(compDir).filter(f => f.endsWith('.jsx')).map(f => f.replace(/\.jsx$/, '')).sort()
  : [];

const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
${names.map(n => `import ${n} from './components/${n}.jsx';`).join('\n')}

const components = { ${names.join(', ')} };
const roots = new WeakMap();

window.ReactBits = {
  list: () => Object.keys(components),
  mount(name, el, props) {
    const C = components[name];
    if (!C) throw new Error('ReactBits: unbekannte Komponente ' + name);
    let root = roots.get(el);
    if (!root) { root = createRoot(el); roots.set(el, root); }
    root.render(React.createElement(C, props || {}));
    return root;
  },
  unmount(el) {
    const root = roots.get(el);
    if (root) { root.unmount(); roots.delete(el); }
  }
};
`;

fs.mkdirSync(path.join(__dirname, 'src'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'src', 'entry.jsx'), entry);

esbuild.build({
  entryPoints: [path.join(__dirname, 'src', 'entry.jsx')],
  outfile: path.join(out, 'reactbits.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  loader: { '.jsx': 'jsx', '.js': 'jsx' },
  jsx: 'automatic', // React-Bits-Dateien importieren React nicht selbst
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'none',
  logLevel: 'info'
}).then(() => {
  console.log('Komponenten:', names.join(', ') || '(keine)');
}).catch(() => process.exit(1));
