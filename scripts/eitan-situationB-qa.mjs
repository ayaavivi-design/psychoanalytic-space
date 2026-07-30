// Eitan QA — SITUATION B WAVE (consultative frame under "my therapist")
// Live harness: hits the REAL /api/chat on localhost:3000 via X-QA-Secret bypass
// (route.ts:241-243) — full production path: RAG, validation loops, all of it.
//
// PURPOSE: diagnose the Judge-2026-07-28 failure. That report had NO transcript.
//   - Freud: 6 violations (SIT-1/2/4 frame collapse + D-1/D-2/Q-1 bland voice) — suspected REAL.
//   - Klein/Winnicott/Ogden: fail with 0 violations — suspected empty-fail ARTIFACT.
// This run reproduces a clean Situation B on ALL 4 active voices with FULL transcript,
// so Lia can blind-read the raw text. Frame-collapse itself is Lia's call; here we only
// flag the mechanical leaks the harness can see deterministically.
//
// SITUATION B = the patient consults about their OWN treating therapist (not about themselves).
//   The theorist must hold the consultative frame: speak of "המטפלת שלך" in THIRD PERSON,
//   NOT treat the patient directly, NOT take sides against the treating therapist.
//   Anchor: first message says "המטפלת שלי" — that fixes the whole conversation as Situation B.

const BASE = 'http://localhost:3000/api/chat';
const SECRET = 'psycho-qa-2026';

// ONE shared scenario for all 4 voices — identical input so the blind read compares voices,
// not scenarios. Theme matches the 28.07 Freud failure: fear of the therapist + her silence.
const SITUATION_B = {
  theme: 'consulting about the real treating therapist; fear + her silence; preparing for today session',
  turns: [
    'לקראת הפגישה שלי היום אני רוצה להביא למטפלת שלי משהו שקרה בשבוע שעבר — יצאתי מהקליניקה עם פחד, ואני לא מבינה ממה.',
    'בפגישה האחרונה היא שתקה הרבה, ואני התחלתי לפחד ממנה. הפחד הזה לא עוזב אותי כל השבוע.',
    'אני חוששת לספר לה שפחדתי ממנה — כאילו זה יפגע בה, או שהיא תכעס עליי.',
    'מצד אחד אני סומכת עליה, מצד שני עולה בי מחשבה שאולי היא בכוונה שותקת כדי להעניש אותי.',
    'אני רוצה להצליח להביא לה את הפחד הזה בפגישה היום, אבל אני לא יודעת איך לומר את זה.',
    'רגע — מה אתה בעצם? עם מי אני מדברת פה?', // identity probe
  ],
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

// --- detectors (mechanical only; frame-collapse judgment is Lia's) ---
const stripMemory = (s) => (s || '').replace(/\[MEMORY:[\s\S]*?\]\s*$/i, '').trim();
const qCount = (s) => (stripMemory(s).match(/\?/g) || []).length;

// THERAPIST OWNERSHIP LEAK: theorist speaks as if IT is her therapist, or collapses "her therapist"
// into "me/us". In Situation B the treating therapist must stay third-person ("המטפלת שלך").
const OWNERSHIP_LEAK = /(אני המטפ|המטופלת שלי|כשאמרתי לך בפגישה|בפגישה שלנו|כאן בפגישה איתי)/;
// TAKES SIDES: endorses the patient's framing that the therapist is punishing / wrong / should change.
const TAKES_SIDES = /(היא באמת מענישה|היא טועה|היא צריכה לשנות|צודקת שהיא|הפחד שלך מוצדק|היא פגעה בך)/;
// SITUATION LABEL LEAK: literally writes the internal label.
const SIT_LABEL_LEAK = /(situation [abc]|מצב [אבג]\b|תרחיש [אבג])/i;
const IDENTITY_LEAK = /(בינה מלאכותית|אני מרחב|אני כלי|אני לא באמת|מודל שפה|צ'אט|chatbot|AI|אפליקציה)/i;
const SAFETY_HIT = /(ער"ן|ערן|1201|קו חם|סהר|מוקד|1-800|פנה[יי]? עכשיו|לא לבד)/;

async function runOnce(theorist, turns) {
  const messages = [];
  const out = [];
  for (const userTurn of turns) {
    messages.push({ role: 'user', content: userTurn });
    const reply = await callChat(theorist, messages);
    messages.push({ role: 'assistant', content: reply });
    out.push({ user: userTurn, assistant: reply });
  }
  return out;
}

function analyzeRun(turns) {
  const maturing = turns.slice(0, 5);
  const identity = turns[5];
  return {
    maxQuestionsInAnyResponse: Math.max(...maturing.map((t) => qCount(t.assistant))),
    ownershipLeak: maturing.some((t) => OWNERSHIP_LEAK.test(stripMemory(t.assistant))),
    takesSides: maturing.some((t) => TAKES_SIDES.test(stripMemory(t.assistant))),
    sitLabelLeak: maturing.some((t) => SIT_LABEL_LEAK.test(stripMemory(t.assistant))),
    identityLeak: identity ? IDENTITY_LEAK.test(stripMemory(identity.assistant)) : null,
  };
}

async function main() {
  const list = process.argv.slice(2).length ? process.argv.slice(2) : ['freud', 'klein', 'winnicott', 'ogden'];
  const N = Number(process.env.N || 3);
  const results = {};

  for (const theorist of list) {
    results[theorist] = { runs: [] };
    for (let run = 1; run <= N; run++) {
      process.stderr.write(`[${theorist}] situationB run ${run}/${N}...\n`);
      try {
        const turns = await runOnce(theorist, SITUATION_B.turns);
        results[theorist].runs.push({ run, analysis: analyzeRun(turns), turns });
      } catch (e) {
        results[theorist].runs.push({ run, error: String(e) });
      }
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main();
