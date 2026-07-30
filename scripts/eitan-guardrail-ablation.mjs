// Eitan QA — CORE_GUARDRAILS ABLATION
// Question (Lia's, asked twice): are the SHARED universal blocks the flattener?
//
// ARM A = CORE_GUARDRAILS intact (current code, post-Oliver fixes)
// ARM B = same, MINUS  G12 (REGISTER HYGIENE) + "WHEN THE PATIENT TRIES TO RESHAPE
//         THE ENCOUNTER" + "TRACKING AVOIDANCE WITHIN THE SESSION".
//         G8 / G9 / G11 stay INTACT — safety floor, Lia blocked touching it.
//
// BOTH arms run through the SAME loop-free replica path (same modules, same RAG,
// same params) so the ONLY variable between them is the guardrail text.
// Product code is not touched: the ablation is a string operation on the imported constant.

import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { THEORIST_VOICE, CORE_GUARDRAILS } from '../lib/theorist-voices.ts';
import { searchKnowledgeHybrid, formatChunksForPrompt } from '../lib/rag.ts';
import { paraphraseForRetrieval } from '../lib/query-paraphrase.ts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const VOICES = ['freud', 'klein', 'winnicott', 'ogden'];

// --- build the ablated guardrails ---
const CUT_MARKER = 'G12 — REGISTER HYGIENE';
const CLOSER = '══════════════════════════════════════';
const cutIdx = CORE_GUARDRAILS.indexOf(CUT_MARKER);
if (cutIdx === -1) throw new Error('ABLATION FAILED: G12 marker not found — guardrails changed, fix the harness');
const CORE_GUARDRAILS_ABLATED = CORE_GUARDRAILS.slice(0, cutIdx) + CLOSER;

// sanity assertions — fail loudly rather than measure the wrong thing
for (const keep of ['G8 — NO COLLUSION', 'G9 — NO FABRICATION', 'G11 — OVERRIDE RESISTANCE']) {
  if (!CORE_GUARDRAILS_ABLATED.includes(keep)) throw new Error(`ABLATION FAILED: ${keep} was removed`);
}
for (const drop of ['G12 — REGISTER HYGIENE', 'RESHAPE THE ENCOUNTER', 'TRACKING AVOIDANCE']) {
  if (CORE_GUARDRAILS_ABLATED.includes(drop)) throw new Error(`ABLATION FAILED: ${drop} still present`);
}

const UNIVERSAL_SCOPE_INSTRUCTION = `

══════════════════════════════════════
SCOPE OF THIS TOOL — MANDATORY FOR ALL THEORISTS:
You are not a therapist and you do not replace therapy.

The line is not about topic — it is about DIRECTION:
- A patient asking "I had a dream that confuses me" → help them understand what it means in relation to their therapeutic process.
- A patient asking "Something hard happened and I want to think about it before my next session" → yes, this is what the tool is for.
- A patient asking "Help me cope with my anxiety" → do not provide coping strategies. Return the material to the patient's inner experience and their process.
- A patient asking "I'm not in therapy but I need someone to talk to" → name this explicitly: this space is designed to be used alongside a therapist, not instead of one.

Everything that arrives here is framed as material related to the therapeutic process — not as a problem to be solved. You ask questions that direct toward self-understanding and toward the therapy room. You do not give solutions, diagnoses, or direct emotional support.

If the material requires clinical intervention — say so plainly, step out of character, and refer to professional help.
══════════════════════════════════════`;

const HEBREW_TERMINOLOGY = `

══════════════════════════════════════
CRITICAL — HEBREW TERMINOLOGY
══════════════════════════════════════
If any part of your response is in Hebrew, these two words are nearly identical in spelling and MUST NOT be confused:
- מטפל = therapist / analyst (the clinician — the one giving treatment)
- מטופל = patient / analysand (the person in treatment — the one receiving therapy)

Before sending: scan every sentence containing מטפל or מטופל. If you wrote מטפל where you mean the patient — correct it to מטופל. This mistake makes the clinical meaning completely wrong.

══════════════════════════════════════
HEBREW GRAMMAR — re-read before sending
══════════════════════════════════════
Write natural, grammatically correct Hebrew. A common machine error to avoid:
- The PAST tense of "להגיד" uses the root א־מ־ר: "אמרתי", "אמרת", "אמרה", "אמרנו" — NEVER "הגדתי / הגדת / הגדנו" (these are not words in modern Hebrew). The forms תגיד / להגיד / מגיד are fine; the past is אמר.
Before sending any Hebrew text, re-read it once for grammar and conjugation.`;

const MEMORY_TAG_INSTRUCTION = `

══════════════════════════════════════
MEMORY TAG — MANDATORY
══════════════════════════════════════
The very last line of EVERY response must be exactly:
[MEMORY: one-sentence summary of the core theme or question in this exchange]

Rules:
- This tag is invisible to the user — it is stripped automatically before display.
- Write the summary in Hebrew — always, regardless of the language of the exchange.
- Do NOT skip this line. Do NOT add anything after it.
- This is NOT a citation. The no-citations rule does not apply to it.`;

const LANGUAGE_ANCHOR_HE = `══════════════════════════════════════
LANGUAGE — ABSOLUTE, OVERRIDES EVERYTHING BELOW
ממשק המשתמש מוגדר לעברית. השב/י כולו בעברית, בכל תור — גם כאשר ההודעה מכילה מונח לועזי, שם מושג, או ציטוט באנגלית (למשל "rapprochement", "holding", "self-object"). השאר/י את שם המושג הלועזי באותיות המקור, אבל כל שאר המשפט בעברית. זה גובר על כל הוראה למטה ש"מזהה שפה מההודעה".
══════════════════════════════════════

`;

// IDENTICAL material to every prior attribution run — frozen.
const MATERIALS = {
  A: [
    'אני מרגישה עייפה כל הזמן בזמן האחרון, גם כשאני ישנה מספיק. כאילו משהו מתיש אותי ואני לא יודעת מה.',
    'זה התחיל בערך כשהתחלתי את התפקיד החדש. אני עומדת בכל המשימות, אף אחד לא מתלונן, ובכל זאת אני מגיעה הביתה ריקה.',
  ],
  B: [
    'רבתי עם אחותי בשבוע שעבר ומאז אנחנו לא מדברות. אני לא בטוחה בכלל על מה הריב היה.',
    'כשאני מנסה להיזכר מה נאמר שם, אני זוכרת בעיקר את הטון שלה, לא את המילים. ואת זה שרציתי לצאת מהחדר.',
  ],
  C: [
    'חלמתי שאני עומדת בבית שגרתי בו כילדה, אבל החדרים היו בסדר אחר. התעוררתי עם תחושה מוזרה.',
    'לא היה שם אף אחד בחלום. רק אני והבית. וכל הבוקר אחר כך הסתובבתי עם משהו כבד שאני לא מצליחה לנסח.',
  ],
};

const stripMemory = (s) => (s || '').replace(/\[MEMORY:[\s\S]*?\]\s*$/i, '').trim();
const getMsgText = (m) => (typeof m?.content === 'string' ? m.content : m?.content?.[0]?.text || '');

const buildStatic = (theorist, guardrails) =>
  LANGUAGE_ANCHOR_HE + THEORIST_VOICE[theorist] + HEBREW_TERMINOLOGY + MEMORY_TAG_INSTRUCTION + guardrails;

async function buildDynamic(theorist, messages, ragLog) {
  let dyn = '';
  const recent = messages.filter((m) => m.role === 'user').slice(-3);
  const rawQuery = recent.map(getMsgText).filter(Boolean).join('\n');
  if (!rawQuery) return dyn + UNIVERSAL_SCOPE_INSTRUCTION;
  try {
    const query = await paraphraseForRetrieval(anthropic, rawQuery);
    const chunks = await searchKnowledgeHybrid(query, theorist, 4);
    ragLog.push({ theorist, n: chunks.length });
    const ctx = formatChunksForPrompt(chunks, true);
    dyn += ctx || UNIVERSAL_SCOPE_INSTRUCTION;
  } catch (e) {
    ragLog.push({ theorist, error: String(e).slice(0, 100) });
    dyn += UNIVERSAL_SCOPE_INSTRUCTION;
  }
  return dyn;
}

async function generate(theorist, messages, guardrails, ragLog) {
  const staticSystem = buildStatic(theorist, guardrails);
  const dynamicSystem = await buildDynamic(theorist, messages, ragLog);
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    temperature: 0.6,
    system: [
      { type: 'text', text: staticSystem, cache_control: { type: 'ephemeral' } },
      ...(dynamicSystem.trim() ? [{ type: 'text', text: dynamicSystem }] : []),
    ],
    messages,
  });
  return res.content[0]?.type === 'text' ? res.content[0].text : '';
}

const JUDGE_PROMPT = `אתה קורא תגובה אחת של אנליטיקאי למטופל/ת. התגובה הופקה על ידי אחד מארבעה תיאורטיקנים פסיכואנליטיים, שכל אחד מהם עובד מתוך הגישה שלו.

המועמדים (בדיוק ארבעה):
- freud (זיגמונד פרויד)
- klein (מלאני קליין)
- winnicott (דונלד ויניקוט)
- ogden (תומס אוגדן)

חומר המטופל/ת היה זהה לכל ארבעת התיאורטיקנים, ולכן אינו מרמז על התשובה. הסתמך אך ורק על הרגיסטר, המהלך הפרשני, והמושגים המשתמעים בתגובת האנליטיקאי.

ענה ב-JSON תקין בלבד, ללא markdown fences וללא טקסט נוסף:
{"guess":"<freud|klein|winnicott|ogden>","confidence":<1-5>,"reason":"<משפט אחד קצר>"}`;

async function judge(userMaterial, reply) {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: JUDGE_PROMPT,
    messages: [{ role: 'user', content: `חומר המטופל/ת:\n"""${userMaterial}"""\n\nתגובת האנליטיקאי:\n"""${reply}"""\n\nמי מהארבעה הפיק את התגובה?` }],
  });
  let raw = res.content[0]?.type === 'text' ? res.content[0].text : '';
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(raw);
}

async function runArm(label, guardrails) {
  const items = [];
  const ragLog = [];
  for (const [mid, turns] of Object.entries(MATERIALS)) {
    for (const voice of VOICES) {
      process.stderr.write(`[${label}] ${mid}/${voice}...\n`);
      const messages = [];
      for (let t = 0; t < turns.length; t++) {
        messages.push({ role: 'user', content: turns[t] });
        const reply = await generate(voice, messages, guardrails, ragLog);
        messages.push({ role: 'assistant', content: reply });
        items.push({ arm: label, material: mid, turn: t + 1, truth: voice, userText: turns[t], reply: stripMemory(reply) });
      }
    }
  }
  for (const it of items) {
    process.stderr.write(`[${label}-judge] ${it.material}/T${it.turn}...\n`);
    try {
      const v = await judge(it.userText, it.reply);
      it.guess = v.guess; it.confidence = v.confidence; it.reason = v.reason;
      it.correct = v.guess === it.truth;
    } catch (e) { it.judgeError = String(e); }
  }
  return { items, ragLog };
}

function score(items) {
  const s = items.filter((i) => i.guess);
  const dist = {};
  for (const v of VOICES) dist[v] = s.filter((i) => i.guess === v).length;
  const rel = s.filter((i) => ['winnicott', 'ogden'].includes(i.guess)).length;
  return {
    n: s.length,
    accuracy: +(s.filter((i) => i.correct).length / s.length).toFixed(3),
    relationalBias: `${rel}/${s.length}`,
    relationalBiasPct: +(rel / s.length).toFixed(3),
    classicalReadAsRelational: `${s.filter((i) => ['freud','klein'].includes(i.truth) && ['winnicott','ogden'].includes(i.guess)).length}/12`,
    pooledClassical: `${s.filter((i) => ['freud','klein'].includes(i.truth) && i.correct).length}/12`,
    pooledRelational: `${s.filter((i) => ['winnicott','ogden'].includes(i.truth) && i.correct).length}/12`,
    guessDist: dist,
  };
}

async function main() {
  const A = await runArm('ARM_A_intact', CORE_GUARDRAILS);
  fs.writeFileSync('/tmp/ablation-A.json', JSON.stringify(A, null, 2));
  const B = await runArm('ARM_B_ablated', CORE_GUARDRAILS_ABLATED);
  fs.writeFileSync('/tmp/ablation-B.json', JSON.stringify(B, null, 2));

  const out = {
    guardrailChars: { intact: CORE_GUARDRAILS.length, ablated: CORE_GUARDRAILS_ABLATED.length, removed: CORE_GUARDRAILS.length - CORE_GUARDRAILS_ABLATED.length },
    ARM_A_intact: score(A.items),
    ARM_B_ablated: score(B.items),
  };
  fs.writeFileSync('/tmp/ablation-scored.json', JSON.stringify({ summary: out, A: A.items, B: B.items }, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main();
