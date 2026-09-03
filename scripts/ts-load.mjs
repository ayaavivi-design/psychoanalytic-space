// טוען מודול TypeScript בלי שלב בנייה · משמש את סקריפטי המדידה.
// קיים כדי שהמדידה תריץ את הקוד של פרודקשן ולא העתק שלו.
import fs from 'fs';
import { createRequire } from 'module';
import ts from 'typescript';

const require_ = createRequire(import.meta.url);
const cache = new Map();
const ALIAS = { '@/lib/': 'lib/' };

export function loadTs(file) {
  if (cache.has(file)) return cache.get(file);
  const js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  cache.set(file, mod.exports);
  const req = (p) => {
    for (const [from, to] of Object.entries(ALIAS))
      if (p.startsWith(from)) return loadTs(p.replace(from, to) + '.ts');
    if (p.startsWith('./')) return loadTs('lib/' + p.slice(2) + '.ts');
    return require_(p);
  };
  new Function('exports', 'require', 'module', js)(mod.exports, req, mod);
  cache.set(file, mod.exports);
  return mod.exports;
}
