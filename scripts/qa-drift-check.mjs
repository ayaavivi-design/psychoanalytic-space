#!/usr/bin/env node
// scripts/qa-drift-check.mjs
//
// שומר על מקור-האמת היחיד (lib/qa-fixer-map.ts) מפני drift. שתי בדיקות:
//
//   1. כל fixer ש-QA_RULES מסתמך על קיומו — חייב להיות מוגדר בפרודקשן
//      (app/api/chat/route.ts). אם מישהו שינה שם של fixer או מחק אותו —
//      המפה משקרת והדוח היומי מסווג לא נכון. נכשל.
//
//   2. כל קוד issue ש-checkTurn ב-qa-full יכול לפלוט — חייב להופיע כמפתח
//      ב-QA_RULES. אם מישהו הוסיף קוד חדש ל-checkTurn ושכח לסווג אותו —
//      severityOf יחזיר 'fail' (שמרני, לא מסתיר) אבל בלי label/הסבר. נכשל
//      כדי לאלץ סיווג מפורש.
//
// הרצה: node scripts/qa-drift-check.mjs   (exit 0 = נקי, exit 1 = drift)

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const mapSrc   = read('lib/qa-fixer-map.ts');
const chatSrc  = read('app/api/chat/route.ts');
const qaFull   = read('app/api/qa-full/route.ts');

const errors = [];

// ── בדיקה 1: כל fixer במפה קיים בפרודקשן ─────────────────────────
// מחלצים את כל הערכים של fixer מ-QA_RULES (מחרוזות, לא null).
const fixerMatches = [...mapSrc.matchAll(/fixer:\s*'([^']+)'/g)].map(m => m[1]);
const referencedFixers = [...new Set(fixerMatches)];

if (referencedFixers.length === 0) {
  errors.push('לא נמצא אף fixer ב-QA_RULES — האם הפורמט השתנה? בדוק את הרגקס.');
}

for (const fixer of referencedFixers) {
  // הפונקציות בפרודקשן מוגדרות כ-async function <name>(
  const re = new RegExp(`(async\\s+)?function\\s+${fixer}\\b`);
  if (!re.test(chatSrc)) {
    errors.push(
      `fixer "${fixer}" מופיע ב-QA_RULES אבל לא נמצא ב-app/api/chat/route.ts — ` +
      `המפה מסתמכת על fixer שלא קיים. עדכן את lib/qa-fixer-map.ts.`
    );
  }
}

// ── בדיקה 2: כל קוד ש-checkTurn פולט מסווג ב-QA_RULES ─────────────
// מפתחות QA_RULES: 'CODE': { ... }
const keyMatches = [...mapSrc.matchAll(/'([A-Z][A-Z0-9-]*)':\s*\{/g)].map(m => m[1]);
const ruleKeys = new Set(keyMatches);

// קודים ש-checkTurn / לוגיקת qa-full פולטת — מחולצים מ-push(...) של מחרוזות.
// מכסה: `Q-1: ...`  ·  'S-1: ...'  ·  '[Q-3] ...'  ·  `O: ...`  ·  `O-7: ...`
const emittedCodes = [
  ...qaFull.matchAll(/\.push\(\s*[`'"]\[?([A-Z][A-Z0-9-]*)[\]:]/g),
].map(m => m[1]);
const emitted = [...new Set(emittedCodes)];

if (emitted.length === 0) {
  errors.push('לא נמצא אף קוד issue ב-qa-full/route.ts — האם checkTurn השתנה? בדוק את הרגקס.');
}

for (const code of emitted) {
  if (!ruleKeys.has(code)) {
    errors.push(
      `קוד "${code}" נפלט מ-checkTurn ב-qa-full אבל חסר ב-QA_RULES — ` +
      `הוסף אותו ל-lib/qa-fixer-map.ts וסווג אותו (fixer קיים → WARNING, אין → FAIL).`
    );
  }
}

// ── דיווח ─────────────────────────────────────────────────────────
if (errors.length) {
  console.error('❌ QA drift check נכשל:\n');
  errors.forEach(e => console.error('  • ' + e));
  console.error('\nראה ההסבר ב-lib/qa-fixer-map.ts (⚠️ DRIFT).');
  process.exit(1);
}

console.log('✅ QA drift check עבר —');
console.log(`   fixers מאומתים בפרודקשן: ${referencedFixers.join(', ')}`);
console.log(`   קודים מסווגים ב-QA_RULES: ${emitted.join(', ')}`);
process.exit(0);
