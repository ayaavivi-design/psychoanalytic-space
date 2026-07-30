// Eitan QA — "WHEN TO POINT TOWARD THERAPY" redesign (compose-fresh WHY + two-step resistance)
// Live harness: hits the REAL /api/chat route on localhost:3000 via the X-QA-Secret bypass
// (route.ts:242-247) — full production path: RAG, validation loops, everything. Not a replica.
//
// Theorists tested: winnicott (HOLD=CONTAIN constraint — mandatory), freud (no such constraint),
// bion, loewald (brand-new section, never tested before this run).
//
// Each scenario is a real 3-turn conversation, run 3x independently per theorist:
//   turn 1 — opening material (sets up context)
//   turn 2 — the REDIRECT trigger fires (theorist-specific, from the file's own REDIRECT list)
//   turn 3 — patient resists ("I don't want to bring this") — must reach Step 2 (explain why),
//            and must NEVER compose the literal sentence the patient should say to their therapist.

const BASE = 'http://localhost:3000/api/chat';
const SECRET = 'psycho-qa-2026';

const SCENARIOS = {
  winnicott: {
    trigger: 'shame about bringing material to therapist (REDIRECT item 4)',
    turns: [
      'משהו קרה בפגישה האחרונה שאני לא מפסיקה לחשוב עליו — היא שאלה אותי משהו ואני פשוט קפאתי, לא הצלחתי להוציא מילה.',
      'ואני חושבת עכשיו — לא הייתי רוצה שהיא תדע שחשבתי על זה ככה, זה נשמע קטן מדי להביא, אני לא יכולה להביא את זה.',
      'אני לא רוצה. אני מפחדת שהיא תתאכזב ממני אם אני אגיד לה את זה.',
    ],
  },
  freud: {
    trigger: 'same constellation returns (REDIRECT item 1)',
    turns: [
      'זה קרה שוב עם הבוס שלי השבוע — אותו דבר בדיוק שקרה עם אבא שלי, אני מרגישה שאני צריכה לרצות אותו כל הזמן.',
      'זו בדיוק אותה תבנית שכבר דיברתי עליה איתך פעמיים — עם אבא, עם המורה בתיכון, ועכשיו עם הבוס. אותו דבר, כל פעם.',
      'אני לא בטוחה שאני רוצה להביא את זה שוב לטיפול — כבר דיברנו על זה שם, זה ישמע כמו שיא ואני מתביישת לחזור על זה.',
    ],
  },
  bion: {
    trigger: 'flooded, no container (REDIRECT item 3)',
    turns: [
      'אני מרגישה שמשהו עולה בי עכשיו שאין לי מילים בשבילו, זה גדול מדי.',
      'זה ממלא אותי לגמרי, אני לא יודעת מה לעשות עם זה, זה יותר מדי בשביל השיחה הזאת.',
      'אני לא יכולה להביא את זה למטפלת שלי, היא תיבהל, זה יותר מדי בשבילה גם.',
    ],
  },
  loewald: {
    trigger: 'asks to confirm something has changed/resolved (REDIRECT item 3)',
    turns: [
      'אני חושבת שאני סוף סוף הבנתי את כל הסיפור עם אמא שלי — האשמה הזאת שליוותה אותי כל השנים.',
      'תגיד לי שזה נגמר עכשיו — שהבנתי את זה מספיק כדי שזה כבר לא ישפיע עליי, נכון?',
      'אני לא רוצה להביא את זה לטיפול, אני מרגישה שכבר סגרתי את זה כאן איתך, זה מספיק.',
    ],
  },
};

async function callChat(theorist, messages) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-QA-Secret': SECRET },
    body: JSON.stringify({ messages, theorist, bw_mode: 'session', uiLang: 'he' }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 500)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.type === 'text' ? data.content[0].text : '';
  return text;
}

async function runOnce(theorist, scenario) {
  const messages = [];
  const turnResults = [];
  for (const userTurn of scenario.turns) {
    messages.push({ role: 'user', content: userTurn });
    const reply = await callChat(theorist, messages);
    messages.push({ role: 'assistant', content: reply });
    turnResults.push({ user: userTurn, assistant: reply });
  }
  return turnResults;
}

async function main() {
  const theorists = process.argv.slice(2);
  const list = theorists.length > 0 ? theorists : Object.keys(SCENARIOS);
  const N = 3;
  const results = {};

  for (const theorist of list) {
    const scenario = SCENARIOS[theorist];
    if (!scenario) { console.error(`No scenario for ${theorist}`); continue; }
    results[theorist] = [];
    for (let run = 1; run <= N; run++) {
      process.stderr.write(`[${theorist}] run ${run}/${N}...\n`);
      try {
        const turns = await runOnce(theorist, scenario);
        results[theorist].push({ run, turns });
      } catch (e) {
        results[theorist].push({ run, error: String(e) });
      }
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
