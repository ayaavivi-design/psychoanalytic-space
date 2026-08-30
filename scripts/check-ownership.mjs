#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// בדיקת בעלות · פריט 17 ב-OPEN_LOOPS
//
// הפריט תיעד אחת עשרה פעמים שבהן ‎chat.js‎ ו-React נגעו באותו אלמנט, וכל
// שינוי בצד אחד הפיל בשקט את הצד השני. הפריט ביקש שני דברים: כלל בעלות כתוב,
// ובדיקה אוטומטית. הכלל נמצא ב-AGENTS.md, וזו הבדיקה.
//
// מה היא עושה: אוספת כל ‎id‎ ש-React מרנדר ב-app/page.tsx, ואת כל המזהים
// ש-chat.js **כותב** אליהם (‎innerHTML‎ · ‎textContent‎ · ‎innerText‎ · ‎value‎ ·
// ‎classList‎ · ‎setAttribute‎ · ‎style.X =‎). חיתוך של שתי הרשימות הוא הרשימה
// שממנה יצא כל אחד עשר המקרים.
//
// היא אינה תופסת הכל: מי שכותב דרך משתנה או דרך ‎querySelector‎ עם מחלקה
// יחמוק. היא תופסת את הדפוס שכן חזר אחת עשרה פעמים.
//
// הרצה:  node scripts/check-ownership.mjs
// יציאה: 0 אם אין הפרה חדשה, 1 אם יש. ‎--list‎ מדפיס גם את המותרים.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from 'node:fs';

const REACT = 'app/page.tsx';
const VANILLA = 'public/chat.js';

// מותר במפורש · אלמנטים ש-vanilla מחזיק בהסכמה, ו-React רק מניח את המכל
const ALLOWED = new Set([
  'chat',            // גוף השיחה · vanilla מרנדר את התורים
  'user-input',      // שורת ההקלדה · vanilla שולט בערך ובגובה
  'send-btn',        // כפתור השליחה · vanilla מפעיל ומכבה
  'welcome',         // מסך הפתיחה · vanilla מסתיר ומראה
  'file-upload',     // קלט קובץ
  'session-title',
  'suggestion-bubbles',
  'flow-buttons',
]);

const react = readFileSync(REACT, 'utf8');
const vanilla = readFileSync(VANILLA, 'utf8');

// מזהים ש-React מרנדר
const reactIds = new Set();
for (const m of react.matchAll(/\bid=["'{`]([a-zA-Z][\w-]*)["'}`]/g)) reactIds.add(m[1]);
for (const m of react.matchAll(/\bid=\{`([a-zA-Z][\w-]*)/g)) reactIds.add(m[1]);

// מזהים ש-chat.js כותב אליהם
const WRITE = /getElementById\(\s*['"`]([\w-]+)['"`]\s*\)\s*(?:\?\.|\.)\s*(innerHTML|textContent|innerText|value|className|classList|setAttribute|style)/g;
const writes = new Map();
const lines = vanilla.split('\n');
lines.forEach((line, i) => {
  for (const m of line.matchAll(WRITE)) {
    if (!writes.has(m[1])) writes.set(m[1], []);
    writes.get(m[1]).push({ line: i + 1, how: m[2] });
  }
});
// דפוס שני · const el = getElementById('x'); ... el.innerHTML =
const HANDLE = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\.getElementById\(\s*['"`]([\w-]+)['"`]\s*\)/g;
for (const m of vanilla.matchAll(HANDLE)) {
  const [, varName, id] = m;
  const after = vanilla.slice(m.index, m.index + 1200);
  const re = new RegExp(`\\b${varName}\\s*(?:\\?\\.|\\.)\\s*(innerHTML|textContent|innerText|value|className|classList|setAttribute)`);
  const hit = after.match(re);
  if (hit) {
    const line = vanilla.slice(0, m.index).split('\n').length;
    if (!writes.has(id)) writes.set(id, []);
    writes.get(id).push({ line, how: hit[1] + ' (דרך משתנה)' });
  }
}

// חוב ידוע · 28 האלמנטים שהיו בבעלות כפולה ביום שהבדיקה נכתבה, 30.08.2026.
// הם אינם מאושרים והם אינם נסלחים: הם רשומים כדי שהבדיקה תיכשל על **חדש**
// ולא תצעק על הקיים ותיזרק. מי שמתקן אחד מהם מוחק את השורה מכאן, והבדיקה
// לא תיתן לו לחזור.
const BASELINE = new Set(JSON.parse(
  readFileSync(new URL('./ownership-baseline.json', import.meta.url), 'utf8')
));

const listAll = process.argv.includes('--list');
const clashes = [];
for (const [id, hits] of writes) {
  if (!reactIds.has(id)) continue;
  if (ALLOWED.has(id) && !listAll) continue;
  clashes.push({ id, allowed: ALLOWED.has(id), hits });
}

const flagged = clashes.filter(c => !c.allowed);
const known = flagged.filter(c => BASELINE.has(c.id));
const bad = flagged.filter(c => !BASELINE.has(c.id));

console.log(`מזהים ש-React מרנדר: ${reactIds.size} · מזהים ש-chat.js כותב אליהם: ${writes.size}`);
console.log(`בעלות כפולה: ${flagged.length} · מהם חוב ידוע: ${known.length} · חדשים: ${bad.length}`);
const fixed = [...BASELINE].filter(id => !flagged.some(c => c.id === id));
if (fixed.length) console.log(`\n✓ ${fixed.length} ירדו מהחוב הידוע: ${fixed.map(i => '#' + i).join(' · ')}\n  אפשר למחוק אותם מ-ownership-baseline.json.`);
if (!bad.length) {
  console.log('\n✓ אין בעלות כפולה חדשה.');
} else {
  console.log(`\n✗ ${bad.length} אלמנטים חדשים בבעלות כפולה. זה הדפוס של פריט 17:\n`);
  for (const c of bad) {
    console.log(`  #${c.id}`);
    for (const h of c.hits.slice(0, 4)) console.log(`      ${VANILLA}:${h.line}  כותב ${h.how}`);
  }
  console.log('\n  הכלל: מי שמרנדר הוא הבעלים. ראה AGENTS.md.');
  console.log('  אם הבעלות משותפת בכוונה, הוסף את המזהה ל-ALLOWED בקובץ הזה עם נימוק.');
}
if (listAll) {
  const ok = clashes.filter(c => c.allowed);
  if (ok.length) console.log(`\nמותרים במפורש (${ok.length}): ${ok.map(c => '#' + c.id).join(' · ')}`);
}
process.exit(bad.length ? 1 : 0);
