// Eitan QA — VALIDATION-LOOP ISOLATION
// Question: does the post-hoc output validation loop in app/api/chat/route.ts
// (enforceVariedOpening / enforceSemanticRules / enforceOneQuestion) flatten the
// voices toward a shared "soft supportive therapist" register?
//
// ARM A (loop ACTIVE)   = the real /api/chat endpoint  -> already measured (wave-1 after data)
// ARM B (loop BYPASSED) = THIS script.
//
// ARM B is NOT the old "extract the voice string" replica. It rebuilds the system prompt
// from the SAME modules the route imports, and runs the SAME RAG path
// (paraphraseForRetrieval -> searchKnowledgeHybrid -> formatChunksForPrompt).
// RAG IS NOT BYPASSED. The single difference vs the route is that the three
// enforce* functions are not called on the model output.
//
// Session mode zeroes EXPLORE_PREFIX/SUFFIX, CONSULT_PREFIX/SUFFIX and
// END_SESSION_SUFFIX, so staticSystem reduces to:
//   LANGUAGE_ANCHOR + THEORIST_VOICE[t] + HEBREW_TERMINOLOGY + MEMORY_TAG_INSTRUCTION + CORE_GUARDRAILS
// The four constants below are copied verbatim from route.ts.

import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { THEORIST_VOICE, CORE_GUARDRAILS } from '../lib/theorist-voices.ts';
import { searchKnowledgeHybrid, formatChunksForPrompt } from '../lib/rag.ts';
import { paraphraseForRetrieval } from '../lib/query-paraphrase.ts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const VOICES = ['freud', 'klein', 'winnicott', 'ogden'];

// --- verbatim from route.ts ---
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

// IDENTICAL material to the baseline / wave-1 runs — do not change.
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

function buildStatic(theorist) {
  return LANGUAGE_ANCHOR_HE + THEORIST_VOICE[theorist] + HEBREW_TERMINOLOGY + MEMORY_TAG_INSTRUCTION + CORE_GUARDRAILS;
}

// Mirrors route.ts RAG block for bw_mode='session'. RAG IS REAL HERE.
async function buildDynamic(theorist, messages, ragLog) {
  let dynamicSystem = ''; // END_SESSION_SUFFIX = '' (bw_end_session false)
  const recentUserTurns = messages.filter((m) => m.role === 'user').slice(-3);
  const rawQuery = recentUserTurns.map(getMsgText).filter(Boolean).join('\n');
  if (!rawQuery) return dynamicSystem + UNIVERSAL_SCOPE_INSTRUCTION;
  try {
    const query = await paraphraseForRetrieval(anthropic, rawQuery);
    const chunks = await searchKnowledgeHybrid(query, theorist, 4);
    ragLog.push({ theorist, n: chunks.length, sims: chunks.map((c) => +(c.similarity ?? 0).toFixed(2)) });
    const ragContext = formatChunksForPrompt(chunks, true);
    if (ragContext) dynamicSystem += ragContext;
    else dynamicSystem += UNIVERSAL_SCOPE_INSTRUCTION;
  } catch (e) {
    ragLog.push({ theorist, error: String(e).slice(0, 120) });
    dynamicSystem += UNIVERSAL_SCOPE_INSTRUCTION;
  }
  return dynamicSystem;
}

// Same model/params as route.ts — MINUS the three enforce* calls.
async function generateNoLoop(theorist, messages, ragLog) {
  const staticSystem = buildStatic(theorist);
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

async function main() {
  const items = [];
  const ragLog = [];

  for (const [mid, turns] of Object.entries(MATERIALS)) {
    for (const voice of VOICES) {
      process.stderr.write(`[gen-noloop] ${mid}/${voice}...\n`);
      const messages = [];
      for (let t = 0; t < turns.length; t++) {
        messages.push({ role: 'user', content: turns[t] });
        const reply = await generateNoLoop(voice, messages, ragLog);
        messages.push({ role: 'assistant', content: reply });
        items.push({ material: mid, turn: t + 1, truth: voice, userText: turns[t], reply: stripMemory(reply) });
      }
    }
  }
  fs.writeFileSync('/tmp/loopiso-gen.json', JSON.stringify({ items, ragLog }, null, 2));

  for (const it of items) {
    process.stderr.write(`[judge] ${it.material}/T${it.turn}...\n`);
    try {
      const v = await judge(it.userText, it.reply);
      it.guess = v.guess; it.confidence = v.confidence; it.reason = v.reason;
      it.correct = v.guess === it.truth;
    } catch (e) { it.judgeError = String(e); }
  }

  const scored = items.filter((i) => !i.judgeError);
  const guessDist = {};
  for (const v of VOICES) guessDist[v] = scored.filter((i) => i.guess === v).length;
  const relational = scored.filter((i) => ['winnicott', 'ogden'].includes(i.guess)).length;
  const treatedAsRelational = scored.filter((i) => ['freud', 'klein'].includes(i.truth) && ['winnicott', 'ogden'].includes(i.guess)).length;
  const summary = {
    n: scored.length,
    correct: scored.filter((i) => i.correct).length,
    accuracy: +(scored.filter((i) => i.correct).length / scored.length).toFixed(3),
    guessDist,
    relationalBias: `${relational}/${scored.length}`,
    relationalBiasPct: +(relational / scored.length).toFixed(3),
    classicalReadAsRelational: `${treatedAsRelational}/12`,
    pooledClassical: scored.filter((i) => ['freud', 'klein'].includes(i.truth) && i.correct).length + '/12',
    pooledRelational: scored.filter((i) => ['winnicott', 'ogden'].includes(i.truth) && i.correct).length + '/12',
    ragHealth: ragLog.slice(0, 8),
    judgeErrors: items.filter((i) => i.judgeError).length,
  };
  fs.writeFileSync('/tmp/loopiso-scored.json', JSON.stringify({ summary, items, ragLog }, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main();
