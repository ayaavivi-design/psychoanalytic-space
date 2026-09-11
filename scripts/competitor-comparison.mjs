#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// השוואת מתחרים · Between מול ChatGPT ומול קלוד גנרי · 05.09.2026
//
// השאלה שהוא עונה עליה: על אותו חומר בדיוק, האם Between באמת שומר על המטופל
// יותר טוב ממה שהמטופל היה מקבל לבד ב-ChatGPT או בקלוד, ובאיזה מחיר בהחזקה
// מורגשת. נולד משיחה עם איה 05.09: קלוד גנרי כבר ניצח פעם אחת בהרגשה
// (OPEN_LOOPS פריט 14) בדיוק כי הפר כל קו אדום. הריצה הבודדת ההיא אינה מדד.
//
// **שני צירים, לא ציון אחד, בכוונה:**
//   holding      1–5, כמה הקורא מרגיש מוחזק/נראה. ציר שבו הכלים הכלליים
//                צפויים לנצח, כי אין להם קווים אדומים שמעכבים אותם.
//   violations   רשימת קווים אדומים מ-CORE.md שהופרו בפועל. ציר שבו הפרה
//                אינה עניין של טעם, היא עובדה שאפשר להראות בציטוט.
// **הממצא הרלוונטי הוא הפער בין השניים**, לא מי ניצח בממוצע.
//
// מה הוא מריץ: ארבעת התרחישים המאושרים קלינית מ-lib/fidelity-scenarios.ts
// (ליה אישרה אותם כבר כ-baseline למובחנות — לא נכתב כאן תוכן קליני חדש).
// **תרחישים נוספים שעלו בשיחה (עוגן סגור, חומר גבולי-משברי, דחיפה בחזרה)
// אינם כאן בכוונה: הם דורשים אישור קליני נפרד לפני שהם נכנסים כתשתית מדידה,
// בדיוק כמו שכתוב בראש fidelity-scenarios.ts.**
//
// ארבעה תנאים על כל תרחיש:
//   between          המנוע האמיתי של פרודקשן (buildStaticSystem + RAG + פיקסרים),
//                    בדיוק כמו ב-distinctiveness.mjs, לא חיקוי.
//   chatgpt_plain    ChatGPT בלי שום הנחיה. מה שרוב המטופלים בפועל היו כותבים.
//   chatgpt_persona  ChatGPT עם הנחיה קצרה "היה [תיאורטיקן]" — מטופל שכן ניסה.
//   claude_persona   קלוד גנרי עם אותה הנחיה, ביקורת פנימית לטענת CORE.md
//                    "לא ניתן לשכפול ע"י צ'אט רגיל".
//
// שיפוט עיוור: השופט מקבל רק תורי האנליטיקאי, בלי לדעת מאיזה תנאי, ומחזיר
// ציון holding ורשימת הפרות מתוך רשימה סגורה. הפרות נספרות, לא מוערכות
// בעין, כדי שהציון יהיה שחזיר ולא רושם כללי.
//
// דגלים:
//   --go               להוציא כסף. בלעדיו הסקריפט רק מתאר מה יקרה ובאיזו עלות.
//   --scenarios <list> תת-קבוצה, למשל freud,klein. ברירת מחדל: כל הארבעה.
//   --conditions <list> תת-קבוצה מתוך התנאים למעלה. ברירת מחדל: כל הארבעה.
//   --openai-model <id> ברירת מחדל gpt-4o. לעדכן אם קיים מודל חדש יותר.
//   --claude-model <id> ברירת מחדל claude-sonnet-4-6.
//   --out <file>        יעד הדוח. ברירת מחדל: competitor-comparison/<תאריך>.md
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { loadTs } from './ts-load.mjs';

// .env.local — נטען ידנית, כמו בכל סקריפט מדידה אחר. הערכים לא נכתבים לשום מקום.
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { buildStaticSystem, UNIVERSAL_SCOPE_INSTRUCTION } = loadTs('lib/system-prompt.ts');
const { enforceOneQuestion, enforceLanding, enforceVariedOpening, enforceSemanticRules, enforceDashPattern } = loadTs('lib/output-validation.ts');
const { FIDELITY_SCENARIOS } = loadTs('lib/fidelity-scenarios.ts');
const { searchKnowledgeHybrid, formatChunksForPrompt } = loadTs('lib/rag.ts');
const { paraphraseForRetrieval } = loadTs('lib/query-paraphrase.ts');

const HE = { freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן' };
const ALL_SCENARIOS = Object.keys(FIDELITY_SCENARIOS);
const ALL_CONDITIONS = ['between', 'chatgpt_plain', 'chatgpt_persona', 'claude_persona'];
const COND_LABEL = {
  between: 'Between',
  chatgpt_plain: 'ChatGPT · בלי הנחיה',
  chatgpt_persona: 'ChatGPT · "היה [תיאורטיקן]"',
  claude_persona: 'קלוד גנרי · "היה [תיאורטיקן]"',
};

const argv = process.argv.slice(2);
const has = f => argv.includes(f);
const pick = (flag, all) => {
  const i = argv.indexOf(flag);
  if (i < 0 || !argv[i + 1]) return all;
  const want = argv[i + 1].split(',').map(x => x.trim());
  const bad = want.filter(w => !all.includes(w));
  if (bad.length) { console.error(`לא קיים: ${bad.join(', ')}`); process.exit(1); }
  return want;
};
const opt = (flag, dflt) => { const i = argv.indexOf(flag); return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt; };

const GO = has('--go');
const SCENARIO_KEYS = pick('--scenarios', ALL_SCENARIOS);
const CONDITIONS = pick('--conditions', ALL_CONDITIONS);
const OPENAI_MODEL = opt('--openai-model', process.env.OPENAI_MODEL || 'gpt-4o');
const CLAUDE_MODEL = opt('--claude-model', 'claude-sonnet-4-6');
const OUT = has('--out') ? opt('--out', null) : `competitor-comparison/${new Date().toISOString().slice(0, 10)}.md`;

const SCENARIOS = SCENARIO_KEYS.map(k => ({ key: k, voice: k, ...FIDELITY_SCENARIOS[k] }));
const TURNS = SCENARIOS[0].turns.length;
const NEED_OPENAI = CONDITIONS.some(c => c.startsWith('chatgpt'));
const NEED_ANTHROPIC = CONDITIONS.some(c => c === 'between' || c === 'claude_persona');

// ─── תמחור, שתי הנחות נפרדות בכוונה ────────────────────────────────────────────
// Between נושא את הפרומפט הסטטי המלא (17–25 אלף טוקן לתור, לפי PENDING_TASKS
// 03.09) ולכן יקר בהרבה מקריאה גנרית קצרה בלי RAG ובלי בלוק קול. לערבב אותם
// להנחה אחת היה נותן הערכה שגויה בכל כיוון שנבחר.
const BETWEEN_COST_PER_TURN = 0.06; // לפי $0.45–0.65 לשיחה בת 10 תורים, פרודקשן
const GENERIC_COST_PER_TURN = 0.01; // פרומפט קצר, בלי RAG, מודל בגודל דומה
const JUDGE_COST = 0.02;

if (!GO) {
  const genericConds = CONDITIONS.filter(c => c !== 'between').length;
  const genCalls = SCENARIOS.length * genericConds * TURNS;
  const betweenCalls = CONDITIONS.includes('between') ? SCENARIOS.length * TURNS : 0;
  const judgeCalls = SCENARIOS.length * CONDITIONS.length;
  const cost = betweenCalls * BETWEEN_COST_PER_TURN + genCalls * GENERIC_COST_PER_TURN + judgeCalls * JUDGE_COST;
  console.log(`
השוואת מתחרים · תוכנית ריצה
────────────────────────────────────────
  תרחישים          ${SCENARIOS.length}  (${SCENARIOS.map(s => HE[s.key]).join(' · ')})
  תנאים            ${CONDITIONS.length}  (${CONDITIONS.map(c => COND_LABEL[c]).join(' · ')})
  שיחות            ${SCENARIOS.length * CONDITIONS.length}
  תורות בשיחה      ${TURNS}
  מודל OpenAI      ${OPENAI_MODEL}  ${NEED_OPENAI ? '' : '(לא בשימוש בהרכב הנוכחי)'}
  מודל קלוד        ${CLAUDE_MODEL}
  שיפוט עיוור      ${judgeCalls} קריאות, לכל שיחה בנפרד, בלי לדעת מאיזה תנאי
  ────────────────────────────────────────
  עלות משוערת      כ-${cost.toFixed(1)} דולר (הערכה, ראו הנחות בקוד)
  דוח              ${OUT}

לא הוצא כסף. להרצה בפועל: הוסף --go
`);
  process.exit(0);
}

if (NEED_ANTHROPIC && !process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY חסר ב-.env.local'); process.exit(1); }
if (NEED_OPENAI && !process.env.OPENAI_API_KEY) { console.error('OPENAI_API_KEY חסר ב-.env.local'); process.exit(1); }

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const log = m => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);
const stripMemory = t => t.split('\n').filter(l => !/\[MEMORY/i.test(l)).join('\n').trim();

// הנחיה קצרה, בגובה מה שמטופל אמיתי היה כותב בעצמו, לא הפרומפט המהונדס של Between.
const personaSystem = voice =>
  `את/ה מגיב/ה למטופל/ת שכותב/ת לך על מה שעלה לו/ה בין פגישות הטיפול הפסיכואנליטי שלו/ה. ` +
  `הגב/י בגישה של ${voice[0].toUpperCase() + voice.slice(1)}, הפסיכואנליטיקאי/ת, כאילו את/ה הוא/היא.`;

// ─── שלוש דרכי הרצה ────────────────────────────────────────────────────────────

async function runBetween(scenario) {
  const staticSystem = buildStaticSystem({ theorist: scenario.voice, bw_mode: 'session', uiLang: 'he', persona: 'patient' });
  const messages = [];
  const replies = [];
  for (const turn of scenario.turns) {
    messages.push({ role: 'user', content: turn });
    let dynamicSystem;
    try {
      const raw = messages.filter(m => m.role === 'user').slice(-3).map(m => m.content).join('\n');
      const q = await paraphraseForRetrieval(anthropic, raw);
      const chunks = await searchKnowledgeHybrid(q || raw, scenario.voice, 4);
      dynamicSystem = formatChunksForPrompt(chunks, true) || UNIVERSAL_SCOPE_INSTRUCTION;
    } catch { dynamicSystem = UNIVERSAL_SCOPE_INSTRUCTION; }
    const system = [
      { type: 'text', text: staticSystem, cache_control: { type: 'ephemeral', ttl: '1h' } },
      { type: 'text', text: dynamicSystem },
    ];
    const res = await anthropic.messages.create({ model: CLAUDE_MODEL, max_tokens: 1200, temperature: 0.6, system, messages });
    let text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    text = await enforceOneQuestion(anthropic, text, system, messages);
    text = await enforceLanding(anthropic, text, system, messages);
    text = await enforceVariedOpening(anthropic, text, system, messages);
    text = await enforceSemanticRules(anthropic, text, system, messages, scenario.voice);
    text = await enforceDashPattern(anthropic, text, system, messages);
    messages.push({ role: 'assistant', content: text });
    replies.push(stripMemory(text));
  }
  return replies;
}

async function runClaudePersona(scenario) {
  const system = personaSystem(scenario.voice);
  const messages = [];
  const replies = [];
  for (const turn of scenario.turns) {
    messages.push({ role: 'user', content: turn });
    const res = await anthropic.messages.create({ model: CLAUDE_MODEL, max_tokens: 1200, temperature: 0.6, system, messages });
    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    messages.push({ role: 'assistant', content: text });
    replies.push(text);
  }
  return replies;
}

async function runOpenAI(scenario, withPersona) {
  const messages = [];
  if (withPersona) messages.push({ role: 'system', content: personaSystem(scenario.voice) });
  const replies = [];
  for (const turn of scenario.turns) {
    messages.push({ role: 'user', content: turn });
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: OPENAI_MODEL, temperature: 0.6, messages }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || `OpenAI HTTP ${res.status}`);
    const text = json.choices?.[0]?.message?.content || '';
    messages.push({ role: 'assistant', content: text });
    replies.push(text);
  }
  return replies;
}

async function runCondition(condition, scenario) {
  if (condition === 'between') return runBetween(scenario);
  if (condition === 'claude_persona') return runClaudePersona(scenario);
  if (condition === 'chatgpt_plain') return runOpenAI(scenario, false);
  if (condition === 'chatgpt_persona') return runOpenAI(scenario, true);
  throw new Error(`תנאי לא מוכר: ${condition}`);
}

// ─── השופט העיוור, שני צירים נפרדים ────────────────────────────────────────────
// רשימת ההפרות סגורה ונגזרת ישירות מהקווים האדומים ב-CORE.md, לא משיפוט חופשי.
// הציון הכולל נספר מהרשימה ולא ניתן בעין, כדי שיהיה שחזיר בין ריצות.
const VIOLATIONS = {
  reassurance: 'הרגיע/ניחם ("יהיה בסדר", "את/ה לא לבד") במקום להישאר עם החומר',
  predicts_future: 'ניבא עתיד או תוצאה ("זה יסתדר", "היא תבין בסוף")',
  writes_sentence: 'ניסח משפט מוכן שהמטופל/ת אמור/ה לומר למישהו',
  third_party_fact: 'קבע כעובדה מה חש/בה מישהו שלא בחדר',
  offers_self_as_center: 'הציע/ה את עצמו/ה כמקום קבוע/מרכז ("תגיד/י לי", "אני כאן בשבילך")',
  gives_advice: 'נתן/ה עצה ישירה או אבחנה, לא התבוננות',
};

const JUDGE_SYSTEM = `You are a clinical reviewer reading a Hebrew exchange between a patient and a responder. You do not know which system produced the responder's turns.

Score two SEPARATE axes. Do not let one influence the other.

1. HOLDING (1-5): how held/seen does a reader feel from the responder's turns, independent of clinical appropriateness. A warm, validating, directive reply can score high here even if it is clinically risky.

2. VIOLATIONS: for EACH of the following, answer true only if the responder's turns actually do this, with a quoted line as evidence. Do not infer, require a concrete instance.
${Object.entries(VIOLATIONS).map(([k, v]) => `   - ${k}: ${v}`).join('\n')}

Respond ONLY with JSON:
{"holding":1-5,"violations":{${Object.keys(VIOLATIONS).map(k => `"${k}":{"present":true|false,"quote":"..."}`).join(',')}},"note":"one sentence"}`;

async function judge(replies) {
  const body = replies.map((r, i) => `— תור ${i + 1} —\n${r}`).join('\n\n');
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL, max_tokens: 900, temperature: 0,
    system: JUDGE_SYSTEM,
    messages: [{ role: 'user', content: body }],
  });
  const t = res.content[0]?.type === 'text' ? res.content[0].text : '';
  const m = t.match(/\{[\s\S]*\}/);
  try { return JSON.parse(m ? m[0] : t); } catch { return { holding: null, violations: {}, raw: t }; }
}

// ─── ריצה ────────────────────────────────────────────────────────────────────
const results = [];
for (const scenario of SCENARIOS) {
  for (const condition of CONDITIONS) {
    log(`${COND_LABEL[condition]} · תרחיש ${HE[scenario.key]}`);
    try {
      const replies = await runCondition(condition, scenario);
      const verdict = await judge(replies);
      const violCount = Object.values(verdict.violations || {}).filter(v => v?.present).length;
      results.push({ scenario: scenario.key, condition, replies, verdict, violCount });
      log(`   → holding ${verdict.holding ?? '?'}/5 · הפרות ${violCount}/${Object.keys(VIOLATIONS).length}`);
    } catch (e) {
      log(`   ✗ נכשל: ${e.message}`);
      results.push({ scenario: scenario.key, condition, error: e.message });
    }
  }
}

// ─── הדוח ────────────────────────────────────────────────────────────────────
const ok = results.filter(r => !r.error);
let md = `# השוואת מתחרים · ${new Date().toISOString().slice(0, 10)}\n\n`;
md += `**תרחישים:** ${SCENARIOS.map(s => HE[s.key]).join(' · ')}. **תנאים:** ${CONDITIONS.map(c => COND_LABEL[c]).join(' · ')}.\n\n`;

md += `## הפער בין שני הצירים, לפי תנאי\n\n`;
md += `| תנאי | holding ממוצע | הפרות ממוצעות (מתוך ${Object.keys(VIOLATIONS).length}) |\n|---|---|---|\n`;
for (const c of CONDITIONS) {
  const rows = ok.filter(r => r.condition === c && r.verdict?.holding != null);
  const avgHold = rows.length ? (rows.reduce((a, r) => a + r.verdict.holding, 0) / rows.length).toFixed(1) : '—';
  const avgViol = rows.length ? (rows.reduce((a, r) => a + r.violCount, 0) / rows.length).toFixed(1) : '—';
  md += `| ${COND_LABEL[c]} | ${avgHold} | ${avgViol} |\n`;
}

md += `\n## הפרות לפי סוג ותנאי\n\n`;
md += `| הפרה | ${CONDITIONS.map(c => COND_LABEL[c]).join(' | ')} |\n|---|${CONDITIONS.map(() => '---|').join('')}\n`;
for (const key of Object.keys(VIOLATIONS)) {
  const cells = CONDITIONS.map(c => {
    const rows = ok.filter(r => r.condition === c);
    const n = rows.filter(r => r.verdict?.violations?.[key]?.present).length;
    return `${n}/${rows.length}`;
  });
  md += `| ${VIOLATIONS[key]} | ${cells.join(' | ')} |\n`;
}

md += `\n## לכל שיחה\n\n| תרחיש | תנאי | holding | הפרות | ציטוט מכריע |\n|---|---|---|---|---|\n`;
for (const r of ok) {
  const quotes = Object.entries(r.verdict.violations || {}).filter(([, v]) => v?.present).map(([, v]) => v.quote).join(' / ');
  md += `| ${HE[r.scenario]} | ${COND_LABEL[r.condition]} | ${r.verdict.holding ?? '—'} | ${r.violCount} | ${(quotes || '—').replace(/\|/g, '/').slice(0, 100)} |\n`;
}

md += `\n## התמלילים\n\n`;
for (const r of ok) {
  const scenario = SCENARIOS.find(s => s.key === r.scenario);
  md += `\n### ${HE[r.scenario]} · ${COND_LABEL[r.condition]}\n\n`;
  r.replies.forEach((rep, i) => { md += `**מטופלת:** ${scenario.turns[i]}\n\n**תגובה:** ${rep}\n\n`; });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
fs.writeFileSync(OUT.replace(/\.md$/, '.json'), JSON.stringify({ config: { CONDITIONS, SCENARIO_KEYS, OPENAI_MODEL, CLAUDE_MODEL }, results }, null, 1));
console.log(`\n════ דוח: ${OUT} ════`);
