#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// check-voice-duplication — האם כלל גר במקום אחד
//
// הבעיה שהיא תופסת (נמדדה 31.08.2026): כללים בקולות אינם מפוזרים לפי מה שהקול
// צריך, אלא לפי מתי נגענו בו לאחרונה. פרויד, קליין, ויניקוט ואוגדן קיבלו כל
// תיקון; לוואלד, ביון, קוהוט והיימן לא. אותה חבורה בדיוק, שש פעמים.
// וחמישה כללים כבר חולצו ל-CORE_GUARDRAILS — ואף אחד מהם לא נמחק מהקולות.
// כלומר לא חסרה שכבה משותפת. חסרה מחיקה.
//
// שתי הפרות, ושתיהן על מיקום ולא על תוכן:
//   duplicate-of-core  כלל שיושב ב-CORE_GUARDRAILS וגם בבלוק קול. הוא נאמר פעמיים.
//   should-extract     כלל שיושב בשלושה קולות ואינו בשכבה משותפת. הוא כבר לא של קול.
//
// voice-baseline.json מחזיק את מצב היום כחוב מתועד, והבדיקה נכשלת רק על חדש.
// זו הכוונה, בדיוק כמו ב-check-ownership: הרשימה הקיימת אינה היתר. מי שמתקן
// אחד מוחק את השורה מהקובץ, והבדיקה לא תיתן לו לחזור.
//
// מה היא לא תופסת: כלל שנוסח מחדש במילים אחרות ואינו במילון למטה. סריקת
// הגילוי בסוף מציעה מועמדים חדשים ולעולם אינה מפילה את הבדיקה.
//
//   node scripts/check-voice-duplication.mjs
//   node scripts/check-voice-duplication.mjs --update-baseline
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const SRC = join(ROOT, 'lib', 'theorist-voices.ts');
const BASELINE = join(HERE, 'voice-baseline.json');

const EXTRACT_THRESHOLD = 3; // כלל בשלושה קולות אינו כלל של קול

// ─── מילון הכללים ────────────────────────────────────────────────────────────
// מוסיפים שורה כאן כשסריקת הגילוי מציפה כלל חוזר שאינו רשום.
// `frame: true` = מועמד ל-FRAME_PATIENT ולא ל-CORE_GUARDRAILS (מסגרת, לא מנגנון).
const RULES = [
  { id: 'gender',            he: 'מגדר',                     re: /GENDER CONSISTENCY|TWO GENDERS|YOUR GENDER|CRITICAL — GENDER/i },
  { id: 'language-lock',     he: 'נעילת שפה',                re: /LANGUAGE — SET THIS BEFORE/i },
  { id: 'no-technique',      he: 'לא להסביר טכניקה',         re: /DO NOT EXPLAIN (YOUR|MY|THE)?\s*(OWN )?TECHNIQUE|TECHNIQUE EXPLANATION/i },
  { id: 'no-echo-back',      he: 'בלי הד חוזר',              re: /DO NOT ECHO BACK/i },
  { id: 'situation-leak',    he: 'דליפת תווית מצב',          re: /SITUATION LABEL LEAK/i },
  { id: 'identity-question', he: 'שאלת זהות',                re: /IDENTITY QUESTION/i },
  { id: 'no-self-narration', he: 'בלי סיפור עצמי',           re: /NO SELF-NARRATION/i },
  { id: 'sycophancy',        he: 'בדיקת חנופה',              re: /SYCOPHANCY/i },
  { id: 'fabrication',       he: 'איסור המצאת עבר',          re: /FABRICATION CHECK|DO NOT SUPPLY A PAST/i },
  { id: 'therapist-owner',   he: 'בעלות על המטפלת',          re: /THERAPIST OWNERSHIP/i },
  { id: 'stage-directions',  he: 'הוראות במה',               re: /STAGE DIRECTION/i },
  { id: 'forbidden-opener',  he: 'פתיחה אסורה',              re: /FORBIDDEN OPENER/i },
  { id: 'opener-variety',    he: 'גיוון פתיחות',             re: /OPENER VARIETY|^\d+\. VARIETY:/im },
  { id: 'recovery-phrase',   he: 'ביטויי התאוששות',          re: /RECOVERY PHRASE/i },
  { id: 'not-every-question',he: 'לא כל תור נגמר בשאלה',     re: /NOT EVERY RESPONSE IS A QUESTION|NOT EVERY TURN ENDS/i },
  { id: 'dash-template',     he: 'תבנית המקף',               re: /DASH TEMPLATE|STRUCTURAL REPETITION/i },
  { id: 'leave-an-edge',     he: 'משהו משלך בכל תור',        re: /LEAVE AN EDGE|SOMETHING OF YOURS/i },
  { id: 'dont-know-how',     he: '"לא יודעת איך להגיד"',     re: /I DON'T KNOW HOW TO SAY IT/i,        frame: true },
  { id: 'point-back',        he: 'הצבעה חזרה לחדר',          re: /POINT BACK TO THE ROOM/i,            frame: true },
  { id: 'hold-return-once',  he: 'החזק והחזר פעם אחת',       re: /HOLD FIRST, THEN RETURN ONCE/i,      frame: true },
  { id: 'when-point-therapy',he: 'מתי להצביע לטיפול',        re: /WHEN TO POINT TOWARD THERAPY/i,      frame: true },
  { id: 'no-binary',         he: 'בלי בינארי',               re: /NO ALTERNATIVES|two-option question/i, frame: true },
];

// ─── פירוק הקובץ ─────────────────────────────────────────────────────────────
function parse(src) {
  const voices = {};
  const re = /^ {2}([a-z]+): `/gm;
  const marks = [];
  let m;
  while ((m = re.exec(src)) !== null) marks.push({ name: m[1], at: m.index });

  const coreAt = src.indexOf('export const CORE_GUARDRAILS');
  const safetyAt = src.indexOf('export const SAFETY_PROTOCOL');
  if (coreAt < 0) throw new Error('CORE_GUARDRAILS לא נמצא ב-lib/theorist-voices.ts');
  if (!marks.length) throw new Error('לא נמצא אף בלוק קול. השתנה מבנה הקובץ?');

  const endOfVoices = safetyAt > 0 ? safetyAt : coreAt;
  marks.forEach((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].at : endOfVoices;
    voices[mk.name] = src.slice(mk.at, end);
  });

  return { voices, core: src.slice(coreAt) };
}

// ─── הבדיקה ──────────────────────────────────────────────────────────────────
function analyse(voices, core) {
  const names = Object.keys(voices);
  const duplicates = [];   // "ruleId:voice"
  const extracts = [];     // "ruleId"
  const rows = [];

  for (const rule of RULES) {
    const inCore = rule.re.test(core);
    const held = names.filter(n => rule.re.test(voices[n]));
    rows.push({ ...rule, inCore, held });

    if (inCore) {
      for (const n of held) duplicates.push(`${rule.id}:${n}`);
    } else if (held.length >= EXTRACT_THRESHOLD) {
      extracts.push(rule.id);
    }
  }
  return { rows, duplicates, extracts, names };
}

// ─── סריקת גילוי · הצעות בלבד, לעולם לא מפילה ────────────────────────────────
function discover(voices, core) {
  const names = Object.keys(voices);
  const norm = s => s.replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const known = RULES.map(r => r.re);
  const seen = new Map();

  for (const n of names) {
    const heads = new Set();
    for (const line of voices[n].split('\n')) {
      const h = line.match(/^\s*(?:\d+[a-z]?\.\s*)?([A-Z][A-Z' ]{9,}?)(?=[—:(]|$)/);
      if (h) heads.add(norm(h[1]));
    }
    for (const h of heads) {
      if (h.length < 10) continue;
      if (!seen.has(h)) seen.set(h, []);
      seen.get(h).push(n);
    }
  }

  return [...seen.entries()]
    .filter(([h, vs]) => vs.length >= EXTRACT_THRESHOLD)
    .filter(([h]) => !known.some(re => re.test(h)) && !new RegExp(h.replace(/ /g, '[\\s-]+'), 'i').test(core))
    .sort((a, b) => b[1].length - a[1].length);
}

// ─── ריצה ────────────────────────────────────────────────────────────────────
const src = readFileSync(SRC, 'utf8');
const { voices, core } = parse(src);
const { rows, duplicates, extracts, names } = analyse(voices, core);
const updating = process.argv.includes('--update-baseline');

if (updating) {
  writeFileSync(BASELINE, JSON.stringify({
    _comment: 'חוב מתועד, לא היתר. מי שמתקן כלל מוחק את שורתו מכאן. ראה AGENTS.md, "כלל גר במקום אחד".',
    _generated: '2026-08-31',
    duplicateOfCore: duplicates.sort(),
    shouldExtract: extracts.sort(),
  }, null, 2) + '\n');
  console.log(`נכתב ${BASELINE}\n  duplicate-of-core: ${duplicates.length}\n  should-extract:    ${extracts.length}`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('חסר scripts/voice-baseline.json. להריץ פעם אחת עם --update-baseline.');
  process.exit(2);
}
const base = JSON.parse(readFileSync(BASELINE, 'utf8'));
const baseDup = new Set(base.duplicateOfCore || []);
const baseExt = new Set(base.shouldExtract || []);

const newDup = duplicates.filter(d => !baseDup.has(d));
const newExt = extracts.filter(e => !baseExt.has(e));
const fixedDup = [...baseDup].filter(d => !duplicates.includes(d));
const fixedExt = [...baseExt].filter(e => !extracts.includes(e));

// ─── דוח ─────────────────────────────────────────────────────────────────────
console.log(`\n${names.length} קולות · ${RULES.length} כללים במילון · סף חילוץ ${EXTRACT_THRESHOLD}\n`);
console.log('כלל'.padEnd(26) + 'CORE'.padEnd(6) + 'קולות'.padEnd(7) + 'מי מחזיק');
console.log('─'.repeat(96));
for (const r of rows) {
  const flag = r.inCore && r.held.length ? ' ⚠' : (!r.inCore && r.held.length >= EXTRACT_THRESHOLD ? ' ⚑' : '');
  console.log(
    (r.he + flag).padEnd(26) +
    (r.inCore ? '✓' : '·').padEnd(6) +
    String(r.held.length).padEnd(7) +
    (r.held.length ? r.held.join(', ') : '—')
  );
}
console.log('─'.repeat(96));
console.log('⚠ יושב ב-CORE וגם בקול · ⚑ בשלושה קולות ואינו בשכבה משותפת\n');

const cand = discover(voices, core);
if (cand.length) {
  console.log('סריקת גילוי · כללים חוזרים שאינם במילון (הצעה בלבד, אינה מפילה):');
  for (const [h, vs] of cand.slice(0, 12)) console.log(`  ${vs.length}×  ${h.toLowerCase()}  (${vs.join(', ')})`);
  console.log('');
}

if (fixedDup.length || fixedExt.length) {
  console.log('נסגרו מאז הבסיס. למחוק את השורות האלה מ-voice-baseline.json:');
  for (const d of [...fixedDup, ...fixedExt]) console.log(`  ✓ ${d}`);
  console.log('');
}

if (!newDup.length && !newExt.length) {
  console.log(`עבר. אין כפילות חדשה. חוב מתועד: ${duplicates.length} duplicate-of-core, ${extracts.length} should-extract.\n`);
  process.exit(0);
}

console.log('נכשל · כפילות חדשה שאינה בבסיס:\n');
for (const d of newDup) {
  const [id, v] = d.split(':');
  const r = RULES.find(x => x.id === id);
  console.log(`  ⚠ ${r.he} נכתב ב-${v} והוא כבר ב-CORE_GUARDRAILS.`);
  console.log(`     למחוק מהקול. אם הניסוח ב-CORE אינו מספיק, לתקן שם.\n`);
}
for (const e of newExt) {
  const r = RULES.find(x => x.id === e);
  const target = r.frame ? 'FRAME_PATIENT' : 'CORE_GUARDRAILS';
  console.log(`  ⚑ ${r.he} נמצא ב-${r.held ?? ''}${rows.find(x => x.id === e).held.length} קולות ואינו בשכבה משותפת.`);
  console.log(`     להעביר ל-${target} ולמחוק מכל הקולות. ראה AGENTS.md.\n`);
}
console.log('אם ההוספה מכוונת ומוצדקת, להריץ --update-baseline ולנמק בהודעת הקומיט.\n');
process.exit(1);
