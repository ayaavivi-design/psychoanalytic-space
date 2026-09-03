#!/usr/bin/env node
// בדיקת זהות הפרומפט · 01.09.2026
//
// למה היא קיימת: הרכבת הפרומפט הסטטי חולצה מ-app/api/chat/route.ts אל
// lib/system-prompt.ts כדי שמדד המובחנות ימדוד את הפרומפט של פרודקשן ולא
// שכפול שלו. החילוץ נעשה בהעתקה, והבדיקה הזו מוכיחה שהוא לא שינה בית אחד.
//
// מה היא עושה: מרכיבה את הפרומפט ל-90 צירופים (10 קולות × 3 מצבים × 3 מצבי
// שפה), חותמת כל אחד ב-SHA-256, ומשווה ל-scripts/prompt-baseline.json.
//
// כשהיא נכשלת: או שההרכבה השתנתה בטעות, או ששינית אותה בכוונה. בשני המקרים
// הבדיקה עושה את עבודתה. לשינוי מכוון: `node scripts/check-prompt-parity.mjs --update`
// **ולציין בקומיט מה השתנה ולמה.** אין לעדכן baseline בלי לדעת מה זז.
import fs from 'fs';
import crypto from 'crypto';
import ts from 'typescript';

const load = (file, stubs = {}) => {
  const src = fs.readFileSync(file, 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'require', 'module', js)(mod.exports, (p) => stubs[p] ?? {}, mod);
  return mod.exports;
};

const voices = load('lib/theorist-voices.ts');
const { buildStaticSystem } = load('lib/system-prompt.ts', { '@/lib/theorist-voices': voices });

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann', 'vera', 'elliot'];
const MODES = ['session', 'consult', 'explore'];
const LANGS = ['he', 'en', ''];

const hashes = {};
for (const theorist of THEORISTS)
  for (const bw_mode of MODES)
    for (const uiLang of LANGS) {
      const persona = bw_mode === 'consult' ? 'therapist' : 'patient';
      const text = buildStaticSystem({ theorist, bw_mode, uiLang, persona });
      hashes[`${theorist}|${bw_mode}|${uiLang || 'none'}`] =
        crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
    }

const BASELINE = 'scripts/prompt-baseline.json';
if (process.argv.includes('--update')) {
  fs.writeFileSync(BASELINE, JSON.stringify(hashes, null, 1) + '\n');
  console.log(`נכתב baseline חדש · ${Object.keys(hashes).length} צירופים → ${BASELINE}`);
  process.exit(0);
}
if (!fs.existsSync(BASELINE)) {
  console.error(`אין ${BASELINE}. להריץ פעם אחת עם --update.`);
  process.exit(1);
}
const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
const drift = Object.keys({ ...base, ...hashes }).filter(k => base[k] !== hashes[k]);
if (drift.length === 0) {
  console.log(`עבר · ${Object.keys(hashes).length} צירופים זהים ל-baseline.`);
  process.exit(0);
}
console.error(`נכשל · ${drift.length} צירופים השתנו:\n`);
for (const k of drift) console.error(`  ${k}   baseline ${base[k] ?? '—'}  →  עכשיו ${hashes[k] ?? '—'}`);
console.error(`\nאם השינוי מכוון: node scripts/check-prompt-parity.mjs --update`);
process.exit(1);
