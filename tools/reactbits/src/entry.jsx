
import React from 'react';
import { createRoot } from 'react-dom/client';
import ShinyText from './components/ShinyText.jsx';

const components = { ShinyText };
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
