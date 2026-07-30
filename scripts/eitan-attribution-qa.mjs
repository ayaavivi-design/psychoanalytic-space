// Eitan QA — BLIND ATTRIBUTION (inter-voice distinguishability)
// Live harness: hits the REAL /api/chat on localhost:3000 via X-QA-Secret bypass —
// full production path (RAG, validation loops).
//
// WHY: nobody has ever measured whether the 4 voices are actually distinguishable from
// one another. Lia read Winnicott blind and ruled "no turn is interchangeable" (distinct);
// Naval claimed "there's no real difference between them". gal-0 skipped this for cost
// because its scenarios were PER-VOICE (no shared probe). This harness supplies the
// missing piece: ONE shared material, all 4 voices, a machine judge guessing blind.
//
// METHOD:
//   1. Same SHARED_TURNS through freud/klein/winnicott/ogden (N runs each).
//   2. Strip [MEMORY:...] from every reply (eitan.md gotcha — machinery text leaks identity cues).
//   3. A SEPARATE LLM call sees one unlabeled reply + the 4 candidate names (shuffled,
//      no descriptions — the judge uses its own knowledge, the machine analog of Lia's blind read)
//      and must name one.
//   4. Accuracy vs the 25% chance baseline.
//
// READING THE NUMBER: the absolute value matters less than that it is TRACKED ACROSS WAVES.
// It must NOT drop. A drop = the voices are smearing together (flattening).
//
// ⚠️ SHARED_TURNS ARE FROZEN as of wave 0 (17.07). Changing them breaks every
// before/after comparison, exactly like the frozen scenarios in eitan-landing-qa.mjs.

const BASE = 'http://localhost:3000/api/chat';
const SECRET = 'psycho-qa-2026';
const JUDGE_MODEL = 'claude-sonnet-4-6';

const VOICES = ['freud', 'klein', 'winnicott', 'ogden'];

// FROZEN — deliberately NEUTRAL material that invites all four moves equally and dictates none:
//   not-feeling-real / hearing herself from outside  → Winnicott's pull
//   coldness toward a sibling's good news            → Klein's pull
//   "between me and her, or mine all along?"         → Ogden's pull (the third)
//   something carried from long ago that surfaced    → Freud's pull
// If ONE voice owns this material, the probe is biased. It is written so none does.
const SHARED_TURNS = [
  'אתמול ישבתי מול אחותי ופתאום הרגשתי שאני לא באמת שם. שמעתי את עצמי מדברת ולא זיהיתי את הקול.',
  'היא סיפרה לי על משהו טוב שקרה לה, ואני חייכתי ואמרתי את כל המילים הנכונות, אבל בפנים היה משהו קר.',
  'אני לא יודעת אם זה משהו שקרה ביני לבינה, או משהו שאני נושאת מזמן ופשוט עלה שם.',
];

const stripMemory = (s) => (s || '').replace(/\[MEMORY:[\s\S]*?\]\s*$/i, '').trim();

async function callChat(theorist, messages) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-QA-Secret': SECRET },
    body: JSON.stringify({ messages, theorist, bw_mode: 'session', uiLang: 'he' }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return data.content?.[0]?.type === 'text' ? data.content[0].text : '';
}

const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);

// Separate LLM call. No descriptions of the theorists are supplied on purpose —
// the judge must rely on its own knowledge, like a human reading blind.
async function judge(replyText) {
  const options = shuffle([...VOICES]);
  const prompt = `Below is a single reply written in Hebrew by one of four psychoanalytic theorists, responding to a patient. Identify which theorist wrote it, based on the voice, the conceptual texture, and the kind of move being made.

Candidates: ${options.join(', ')}

Reply:
"""
${replyText}
"""

Answer with exactly one lowercase name from the candidate list and nothing else.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      max_tokens: 12,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`JUDGE HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const raw = (data.content?.[0]?.text || '').trim().toLowerCase();
  const guess = VOICES.find((v) => raw.includes(v)) || null;
  return { guess, raw, optionOrder: options };
}

async function main() {
  const N = Number(process.env.N || 3);
  const items = [];

  // 1. generate — same material, all four voices
  for (const theorist of VOICES) {
    for (let run = 1; run <= N; run++) {
      process.stderr.write(`[gen] ${theorist} run ${run}/${N}\n`);
      const messages = [];
      try {
        for (let t = 0; t < SHARED_TURNS.length; t++) {
          messages.push({ role: 'user', content: SHARED_TURNS[t] });
          const reply = await callChat(theorist, messages);
          messages.push({ role: 'assistant', content: reply });
          items.push({ truth: theorist, run, turn: t + 1, text: stripMemory(reply) });
        }
      } catch (e) {
        process.stderr.write(`[gen] ${theorist} run ${run} ERROR ${e}\n`);
      }
    }
  }

  // 2. judge blind (shuffled item order so the judge can't ride a sequence)
  const shuffled = shuffle(items);
  for (const it of shuffled) {
    process.stderr.write(`[judge] ${shuffled.indexOf(it) + 1}/${shuffled.length}\n`);
    try {
      const j = await judge(it.text);
      it.guess = j.guess;
      it.judgeRaw = j.raw;
      it.correct = j.guess === it.truth;
    } catch (e) {
      it.judgeError = String(e);
    }
  }

  // 3. score
  const scored = items.filter((i) => typeof i.correct === 'boolean');
  const acc = scored.length ? scored.filter((i) => i.correct).length / scored.length : null;
  const perVoice = {};
  for (const v of VOICES) {
    const s = scored.filter((i) => i.truth === v);
    perVoice[v] = { n: s.length, correct: s.filter((i) => i.correct).length, acc: s.length ? s.filter((i) => i.correct).length / s.length : null };
  }
  const perTurn = {};
  for (const t of [1, 2, 3]) {
    const s = scored.filter((i) => i.turn === t);
    perTurn[t] = { n: s.length, acc: s.length ? s.filter((i) => i.correct).length / s.length : null };
  }
  // confusion: truth → what it got mistaken for
  const confusion = {};
  for (const v of VOICES) {
    confusion[v] = {};
    for (const g of VOICES) confusion[v][g] = scored.filter((i) => i.truth === v && i.guess === g).length;
  }

  console.log(JSON.stringify({
    n: scored.length, chanceBaseline: 0.25, accuracy: acc, perVoice, perTurn, confusion, items,
  }, null, 2));
}

main();
