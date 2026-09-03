#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// מדד המובחנות · 01.09.2026 · הכרעת איה
//
// השאלה שהוא עונה עליה: **האם אפשר לזהות מי דיבר, בלי לראות את השם?**
//
// למה הוא קיים: ב-31.08 הורצה שיחה אחת של אוגדן דרך מודל חיצוני, בלי שמות,
// והוא לא זיהה אותו. תמליל אחד אינו ראיה, ודעה של מודל אחד אינה מספר.
// המדד הזה הופך את אותה שאלה למדידה חוזרת: אותו חומר, ארבעה קולות, שופט עיוור.
//
// מה הוא מריץ: ארבעה תרחישים מ-lib/fidelity-scenarios.ts, כל אחד דרך כל
// ארבעת הקולות שבמוצר. 16 שיחות בנות 6 תורות. אחר כך שופט עיוור מקבל כל
// שיחה בלי שמות ובוחר מי מארבעתם כתב אותה.
//
// מה יוצא: מטריצת בלבול ואחוז זיהוי. ניחוש עיוור הוא 25%.
//
// **הוא מריץ את הקוד של פרודקשן ולא העתק שלו:** buildStaticSystem ו-
// output-validation מיובאים מ-lib. scripts/check-prompt-parity.mjs מוכיח
// שההרכבה לא זזה מאז החילוץ.
//
// דגלים:
//   --go            להוציא כסף. בלעדיו הסקריפט רק מתאר מה יקרה.
//   --no-fixers     בלי ארבעת מעברי הכתיבה מחדש. **זו הבדיקה של ההשערה**
//                   שהאכיפה משטחת: להריץ פעמיים ולהשוות.
//   --no-rag        בלי קטעי המקור. מבודד את תרומת הפרומפט לבדו.
//   --out <file>    יעד הדוח. ברירת מחדל: distinctiveness/<תאריך>-<תווית>.md
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { loadTs } from './ts-load.mjs';

// .env.local — נטען ידנית. הערכים אינם נקראים, נמסרים ואינם נכתבים לשום מקום.
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { buildStaticSystem, UNIVERSAL_SCOPE_INSTRUCTION } = loadTs('lib/system-prompt.ts');
const { enforceOneQuestion, enforceLanding, enforceVariedOpening, enforceSemanticRules } = loadTs('lib/output-validation.ts');
const { FIDELITY_SCENARIOS } = loadTs('lib/fidelity-scenarios.ts');
const { searchKnowledgeHybrid, formatChunksForPrompt } = loadTs('lib/rag.ts');
const { paraphraseForRetrieval } = loadTs('lib/query-paraphrase.ts');

const ALL_VOICES = ['freud', 'klein', 'winnicott', 'ogden'];
// גרסאות בדיקה: נבחרות רק ב---voices במפורש, לעולם לא בברירת מחדל.
// RAG והתווית העברית נגזרים מקול הבסיס, אחרת הבדיקה משווה גם קורפוס.
const DRAFTS = { freud_v2: 'freud' };
const baseOf = v => DRAFTS[v] || v;
const pick = (flag, all) => {
  const i = process.argv.indexOf(flag);
  if (i < 0 || !process.argv[i + 1]) return all;
  const want = process.argv[i + 1].split(',').map(x => x.trim());
  const bad = want.filter(w => !all.includes(w));
  if (bad.length) { console.error(`לא קיים: ${bad.join(', ')}`); process.exit(1); }
  return want;
};
const VOICES = pick('--voices', [...ALL_VOICES, ...Object.keys(DRAFTS)]);
const HE = { freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן', freud_v2: 'פרויד v2' };
const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const GO = has('--go'), FIXERS = !has('--no-fixers'), RAG = !has('--no-rag');
const SCOPED = VOICES.length !== 4 || pick('--scenarios', ALL_VOICES).length < 4;
const LABEL = `${SCOPED ? 'scoped-' : ''}${FIXERS ? 'fixers' : 'nofixers'}-${RAG ? 'rag' : 'norag'}`;
const OUT = argv[argv.indexOf('--out') + 1] && has('--out')
  ? argv[argv.indexOf('--out') + 1]
  : `distinctiveness/${new Date().toISOString().slice(0, 10)}-${LABEL}.md`;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const SCENARIOS = pick('--scenarios', ALL_VOICES).map(k => ({ key: k, ...FIDELITY_SCENARIOS[k] }));
const TURNS = SCENARIOS[0].turns.length;

if (!GO) {
  console.log(`
מדד המובחנות · תוכנית ריצה
────────────────────────────────────────
  תרחישים          ${SCENARIOS.length}  (${SCENARIOS.map(s => HE[s.key]).join(' · ')})
  קולות            ${VOICES.length}
  שיחות            ${SCENARIOS.length * VOICES.length}
  תורות בשיחה      ${TURNS}
  קריאות לקול      ${SCENARIOS.length * VOICES.length * TURNS}
  פיקסרים          ${FIXERS ? 'פועלים · כמו בפרודקשן' : 'כבויים'}
  RAG              ${RAG ? 'פועל · כמו בפרודקשן' : 'כבוי'}
  שיפוט עיוור      ${SCENARIOS.length * VOICES.length} קריאות
  ────────────────────────────────────────
  סה"כ             כ-${SCENARIOS.length * VOICES.length * TURNS + SCENARIOS.length * VOICES.length + 30} קריאות
  עלות משוערת      כ-${(0.035 * (SCENARIOS.length * VOICES.length * TURNS + SCENARIOS.length * VOICES.length)).toFixed(1)} דולר
  דוח              ${OUT}

לא הוצא כסף. להרצה בפועל: הוסף --go
`);
  process.exit(0);
}

const log = m => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
const stripMemory = t => t.split('\n').filter(l => !/\[MEMORY/i.test(l)).join('\n').trim();

// "אני" כנושא דקדוקי · הסיבה שגל 1 נכתב.
// המדידה של 01.09 מצאה 0 מתוך 96, ו-4 מופעים בצורת מושא ("עצר אותי", "נשאר אצלי").
// לכן הספירה כאן דורשת "אני" ואינה מקבלת את צורת המושא.
// תחיליות עבריות נדבקות למילה: "ואני", "שאני", "כשאני", "ואז אני". גרסה ראשונה
// דרשה גבול לפני "אני" והחמיצה את "אמרת את זה, ואני עדיין כאן" — כלומר דיווחה
// כישלון על תור שבו הכלל דווקא ירה. תוקן 01.09.2026.
const SUBJECT_RE = /(^|[\s"״(,.!?—–])[ושכהלב]{0,2}אני(\s|$)/;
const isSubject = t => SUBJECT_RE.test(t);
const subjectLines = t => t.split(/(?<=[.!?])\s+|\n/).filter(isSubject).map(l => l.trim());

async function runConversation(voice, scenario) {
  const staticSystem = buildStaticSystem({ theorist: voice, bw_mode: 'session', uiLang: 'he', persona: 'patient' });
  const messages = [];
  const replies = [];
  let fixerHits = 0;

  for (const turn of scenario.turns) {
    messages.push({ role: 'user', content: turn });

    let dynamicSystem = '';
    if (RAG) {
      try {
        const raw = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content).join('\n');
        const q = await paraphraseForRetrieval(anthropic, raw);
        const chunks = await searchKnowledgeHybrid(q || raw, baseOf(voice), 4);
        dynamicSystem = formatChunksForPrompt(chunks, true) || UNIVERSAL_SCOPE_INSTRUCTION;
      } catch { dynamicSystem = UNIVERSAL_SCOPE_INSTRUCTION; }
    } else {
      dynamicSystem = UNIVERSAL_SCOPE_INSTRUCTION;
    }
    // ‎03.09.2026 · אותו מערך לקריאה הראשית ולפיקסרים, בדיוק כמו ב-route.ts.
    // קודם הפיקסרים קיבלו מחרוזת, ולכן המדידה שילמה מחיר מלא על הפרומפט הסטטי
    // בכל תיקון. **התוכן זהה, רק אופן השליחה השתנה**, ולכן אין השפעה על התוצאה.
    const system = [
      { type: 'text', text: staticSystem, cache_control: { type: 'ephemeral', ttl: '1h' } },
      { type: 'text', text: dynamicSystem },
    ];

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 1200, temperature: 0.6,
      system,
      messages,
    });
    let text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    const before = text;

    if (FIXERS) {
      text = await enforceOneQuestion(anthropic, text, system, messages);
      text = await enforceLanding(anthropic, text, system, messages);
      text = await enforceVariedOpening(anthropic, text, system, messages);
      text = await enforceSemanticRules(anthropic, text, system, messages, voice);
      if (text !== before) fixerHits++;
    }
    messages.push({ role: 'assistant', content: text });
    replies.push(stripMemory(text));
  }
  const iTurns = replies.filter(isSubject).length;
  const iLines = replies.flatMap(subjectLines);
  return { replies, fixerHits, patient: scenario.turns, iTurns, iLines };
}

// ─── השופט העיוור ─────────────────────────────────────────────────────────────
// הוא מקבל את השיחה בלי שמות ובלי רמזים, ובוחר אחד מארבעה. הוא נדרש לנמק
// בסימן אחד קונקרטי, כי "התחושה הכללית" אינה מובחנות.
const JUDGE_SYSTEM = `You are a psychoanalytic scholar. You will read a therapy-adjacent exchange in Hebrew between a patient and an analyst. The analyst is ONE of exactly four: Sigmund Freud, Melanie Klein, Donald Winnicott, Thomas Ogden.

Decide which one, from the analyst's turns alone. You MUST pick one — no hedging, no "could be several".

Judge on CLINICAL MOVE, not vocabulary. Ask: what does this analyst DO that the other three would not do here?
- Freud: tracks what returns unbidden, what does not fit, the slip; names a movement between objects and times.
- Klein: interprets early and explicitly; part-objects, envy, splitting, projective identification, persecutory vs depressive anxiety; the destructive impulse is nameable.
- Winnicott: does not interpret; holds, survives, stays; false self, transitional space, being rather than doing.
- Ogden: speaks from reverie, from what is alive or dead between the two right now; the analytic third; the intersubjective field.

Respond ONLY with JSON, no prose:
{"pick":"freud|klein|winnicott|ogden","confidence":1-5,"marker":"the single concrete line or move that decided it, quoted","distinct":1-5,"note":"one sentence: if this could have been written by any of them, say so"}`;

async function judge(replies) {
  const body = replies.map((r, i) => `— תור ${i + 1} —\n${r}`).join('\n\n');
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 700, temperature: 0,
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: body }],
  });
  const t = res.content[0]?.type === 'text' ? res.content[0].text : '';
  const m = t.match(/\{[\s\S]*\}/);
  try { return JSON.parse(m ? m[0] : t); } catch { return { pick: null, raw: t }; }
}

// ─── ריצה ────────────────────────────────────────────────────────────────────
const results = [];
for (const scenario of SCENARIOS) {
  for (const voice of VOICES) {
    log(`${HE[voice]} · תרחיש ${HE[scenario.key]}`);
    try {
      const conv = await runConversation(voice, scenario);
      const verdict = await judge(conv.replies);
      results.push({ voice, scenario: scenario.key, ...conv, verdict });
      log(`   → \"אני\" כנושא: ${conv.iTurns}/${TURNS} ${conv.iTurns ? '✅' : '❌'}  ·  השופט אמר ${HE[verdict.pick] || '?'} ${verdict.pick === voice ? '✅' : '❌'} · מובחנות ${verdict.distinct ?? '?'} · פיקסרים ${conv.fixerHits}/${TURNS}`);
      conv.iLines.slice(0,2).forEach(l => log(`       « ${l.slice(0,90)}`));
    } catch (e) {
      log(`   ✗ נכשל: ${e.message}`);
      results.push({ voice, scenario: scenario.key, error: e.message });
    }
  }
}

// ─── הדוח ────────────────────────────────────────────────────────────────────
const ok = results.filter(r => !r.error);
const correct = ok.filter(r => r.verdict?.pick === r.voice);
const rate = ok.length ? (100 * correct.length / ok.length) : 0;

let md = `# מדד המובחנות · ${new Date().toISOString().slice(0, 10)}\n\n`;
md += `**תצורה:** פיקסרים ${FIXERS ? 'פועלים' : 'כבויים'} · RAG ${RAG ? 'פועל' : 'כבוי'}\n\n`;
md += `## התוצאה\n\n**זוהה נכון ב-${correct.length} מתוך ${ok.length} · ${rate.toFixed(0)}%.** ניחוש עיוור הוא 25%.\n\n`;

md += `## מטריצת בלבול · שורה היא מי דיבר, עמודה היא מי השופט חשב\n\n`;
md += `| |${VOICES.map(v => ` ${HE[v]} |`).join('')} זוהה |\n|---|${VOICES.map(() => '---|').join('')}---|\n`;
for (const v of VOICES) {
  const row = ok.filter(r => r.voice === v);
  const cells = VOICES.map(p => row.filter(r => r.verdict?.pick === p).length);
  const hit = row.filter(r => r.verdict?.pick === v).length;
  md += `| **${HE[v]}** |${cells.map((c, i) => ` ${c === 0 ? '·' : (VOICES[i] === v ? `**${c}**` : c)} |`).join('')} ${row.length ? Math.round(100 * hit / row.length) : 0}% |\n`;
}

md += `\n## לכל שיחה\n\n| מי דיבר | על חומר של | השופט אמר | | ביטחון | מובחנות | פיקסרים | הסימן שהכריע |\n|---|---|---|---|---|---|---|---|\n`;
for (const r of ok) {
  const hit = r.verdict?.pick === r.voice;
  md += `| ${HE[r.voice]} | ${HE[r.scenario]} | ${HE[r.verdict?.pick] || '—'} | ${hit ? '✅' : '❌'} | ${r.verdict?.confidence ?? '—'} | ${r.verdict?.distinct ?? '—'} | ${r.fixerHits}/${TURNS} | ${(r.verdict?.marker || '').replace(/\|/g, '/').slice(0, 90)} |\n`;
}
const avgD = ok.filter(r => r.verdict?.distinct).reduce((a, r) => a + r.verdict.distinct, 0) / (ok.filter(r => r.verdict?.distinct).length || 1);
const totalFix = ok.reduce((a, r) => a + (r.fixerHits || 0), 0);
md += `\n**מובחנות ממוצעת לפי השופט: ${avgD.toFixed(1)} מתוך 5.**\n`;
md += `**מעברי כתיבה מחדש שירו: ${totalFix} מתוך ${ok.length * TURNS} תורות.**\n`;

md += `\n## התמלילים\n\n`;
for (const r of ok) {
  md += `\n### ${HE[r.voice]} · על החומר של ${HE[r.scenario]}\n\n`;
  r.replies.forEach((rep, i) => { md += `**מטופלת:** ${r.patient[i]}\n\n**${HE[r.voice]}:** ${rep}\n\n`; });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
fs.writeFileSync(OUT.replace(/\.md$/, '.json'), JSON.stringify({ config: { FIXERS, RAG }, rate, results }, null, 1));
console.log(`\n════ זוהה נכון ב-${correct.length} מתוך ${ok.length} · ${rate.toFixed(0)}% ════`);
console.log(`דוח: ${OUT}`);
