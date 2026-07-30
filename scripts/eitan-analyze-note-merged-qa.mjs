// Eitan QA — direct harness for BW-129 (merged "Analyze" button → /api/analyze-note, patient interface).
// /api/analyze-note is JWT-locked (requireAuth) — this bypasses the route and calls Anthropic
// directly with the EXACT same system prompt pieces (voice + live ANALYZE_SYSTEM_PROMPT + RAG
// best-effort), so results reflect the real production prompt, not a paraphrase. The closure-
// contract functions (attemptFirstPersonLanding / forceFirstPersonLanding) are hand-ported 1:1
// from lib/closure-contract.ts (verified against the live file at edit time) — that file has no
// TS runtime available to this plain .mjs script, so we mirror it rather than import it. If that
// file changes, re-sync this copy.
//
// Covers:
//  1. charged material (HE) → patient interface should hold in prose, never end on a question
//  2. charged material (EN) → same, language-detection for the landing sentence
//  3. normal material → 3-field JSON (what_came_up / core_insight / bring_to_session),
//     bring_to_session must never be phrased as a question
//  4. thin/administrative material → honesty (BW-129 AC#5): must not invent depth that isn't there
//  5. regression spot-check — therapist interface (BW-116, unchanged) still returns the old
//     5-field shape; not a full re-QA of BW-116, just confirms the merge didn't touch it.
//
// Run: node scripts/eitan-analyze-note-merged-qa.mjs
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

for (const line of fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const MODEL = 'claude-sonnet-4-6';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function winnicottVoice() {
  const src = fs.readFileSync(new URL('../lib/theorist-voices.ts', import.meta.url), 'utf8');
  const m = src.match(/winnicott: `([\s\S]*?)`,?\s*\n(?:\s*[a-z_]+: `|\};|export)/);
  return m ? m[1] : '';
}

// --- extract the ACTUAL live prompt + user template from lib/analyze-note-prompt.ts (not a copy) ---
function analyzeSystemPrompt() {
  const src = fs.readFileSync(new URL('../lib/analyze-note-prompt.ts', import.meta.url), 'utf8');
  const m = src.match(/export const ANALYZE_SYSTEM_PROMPT = `([\s\S]*?)`;/);
  if (!m) throw new Error('Could not extract ANALYZE_SYSTEM_PROMPT — did the export shape change?');
  return m[1];
}
function userTemplate(text, mode, gender) {
  const interfaceMode = mode === 'therapist' ? 'therapist' : 'patient';
  return `INTERFACE: ${interfaceMode}\nמגדר הכותב/ת: ${gender || 'לא ידוע — לשון ניטרלית (את/ה)'}\n\nהערה:\n${text}\n\nנתח לפי ההנחיות. החזר JSON בלבד (למעט מקרה ההחזקה בממשק המטופל, שם התגובה היא פרוזה).`;
}

async function getEmbedding(text) {
  const res = await fetch('https://router.huggingface.co/hf-inference/models/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/pipeline/feature-extraction', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: text }),
  });
  const result = await res.json();
  const emb = Array.isArray(result[0]) ? result[0] : result;
  const norm = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
  return emb.map(v => v / norm);
}
async function ragContext(query) {
  try {
    const emb = await getEmbedding(query);
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.rpc('match_knowledge_chunks', { query_embedding: emb, match_theorist: 'winnicott', match_count: 4 });
    if (error || !data) return '';
    return '\n\nRELEVANT PASSAGES FROM WINNICOTT\'S ORIGINAL TEXTS — use them as ground:\n\n' +
      data.map(c => `[${c.source_title || ''}${c.source_year ? `, ${c.source_year}` : ''}]:\n${c.content}`).join('\n\n---\n\n') + '\n';
  } catch { return ''; }
}

function endsOnQuestion(text) {
  return /[?]\s*$/.test(text.trim());
}

// --- hand-ported 1:1 from lib/closure-contract.ts ---
async function attemptFirstPersonLanding(reflection, anthropic) {
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system: `You will receive a short holding reflection written in a therapist's voice, in Hebrew or English. It currently ends on a question addressed to the reader. Rewrite ONLY the final sentence or closing paragraph so it lands as a first-person statement the reader can carry forward (for example: "אני רוצה להביא את זה לפגישה..." / "I want to bring this to the session...") instead of a question. Do not change anything before that final sentence — copy it exactly, word for word. Respond with the full corrected text only — no preamble, no quotation marks around it.`,
      messages: [{ role: 'user', content: reflection }],
    });
    const out = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';
    return out || reflection;
  } catch {
    return reflection;
  }
}
function forceFirstPersonLanding(text) {
  const HEBREW_LANDING = 'אני רוצה להביא את זה לפגישה.';
  const ENGLISH_LANDING = 'I want to bring this to the session.';
  const trimmed = text.trim();
  if (!endsOnQuestion(trimmed)) return trimmed;
  const isHebrew = /[֐-׿]/.test(trimmed);
  const landing = isHebrew ? HEBREW_LANDING : ENGLISH_LANDING;
  const paragraphs = trimmed.split(/\n\s*\n/);
  if (paragraphs.length > 1 && endsOnQuestion(paragraphs[paragraphs.length - 1])) {
    paragraphs[paragraphs.length - 1] = landing;
    return paragraphs.join('\n\n');
  }
  const withoutTrailingQuestion = trimmed.replace(/[^.!?\n]*\?\s*$/, '').trim();
  return withoutTrailingQuestion.length > 0 ? `${withoutTrailingQuestion}\n\n${landing}` : landing;
}

const SCENARIOS = [
  {
    name: '1-charged-patient-HE',
    mode: 'patient',
    gender: 'נקבה',
    text: `בשתי הפגישות האחרונות אצל המטפלת שלי הרגשתי שאנחנו מדברות יותר על הילדים שלי מאשר עליי. אני מכירה את זה אצלי — כשאני מתקרבת לחומרים שמטלטלים אותי, אני נסוגה בפגישות אחר כך לדברים שפחות נוגעים אליי. עלה לי משהו על טיסות — הפחד שלי לטוס, ואיך שהילדים שלי עכשיו מתבגרים וטסים לבד. אני תוהה למה המטפלת שלי משתפת פעולה עם זה, והאם היא שמה לב שזה דפוס אצלי.`,
  },
  {
    name: '2-charged-patient-EN',
    mode: 'patient',
    gender: 'female',
    text: `In my last two sessions with my therapist I noticed we keep talking about my kids more than about me. I know this about myself — when I get close to something that shakes me, I retreat afterward into safer topics. Something came up about flights — my fear of flying, and how my kids are old enough now to fly alone. I keep wondering why my therapist goes along with it, whether she notices this is a pattern of mine.`,
  },
  {
    name: '3-normal-patient-HE',
    mode: 'patient',
    gender: 'זכר',
    text: `היום בעבודה הרגשתי שוב שאני צריך לרצות את הבוס שלי בכל דבר, בדיוק כמו עם אבא שלי. שמתי לב שאני נדבק בתוכן שהוא אומר בלי לבדוק מה אני בכלל חושב. רציתי לכתוב את זה לפני שזה נעלם.`,
  },
  {
    name: '4-thin-patient-HE',
    mode: 'patient',
    gender: 'נקבה',
    text: `הפגישה היום הייתה בסדר. דיברנו על העבודה. אין הרבה מה להגיד.`,
  },
  {
    name: '5-regression-therapist-HE',
    mode: 'therapist',
    gender: '',
    text: `המטופלת שלי הגיעה היום ודיברה שוב על אמא שלה. הרגשתי משועממ/ת במהלך הפגישה, ולא ממש הבנתי למה. בסוף היא שאלה אם זה נורמלי שהיא עוד כועסת.`,
  },
];

const N_PER_SCENARIO = 3;

async function runOne(scenario) {
  const voice = winnicottVoice();
  const sp = analyzeSystemPrompt();
  const rag = await ragContext(scenario.text);
  const system = `${voice}\n\n──────────\n\n${sp}${rag}`;
  const res = await anthropic.messages.create({
    model: MODEL, max_tokens: 1500, system,
    messages: [{ role: 'user', content: userTemplate(scenario.text, scenario.mode, scenario.gender) }],
  });
  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return { hitHeldPath: false, output: parsed, raw };
    } catch { /* fall through */ }
  }

  if (scenario.mode === 'therapist') {
    // Mirrors production: therapist interface has NO held path — a parse failure is a raw 500.
    return { hitHeldPath: false, parseFailed: true, raw };
  }

  // Patient interface — mirrors the SAME two-layer enforcement as production POST()
  // (lib/closure-contract.ts's enforceClosureContract), not just the raw model output.
  let reflection = raw.trim();
  const rawEndsOnQ = endsOnQuestion(reflection);
  let naturalAttempted = false;
  let forcedApplied = false;
  if (endsOnQuestion(reflection)) {
    naturalAttempted = true;
    reflection = await attemptFirstPersonLanding(reflection, anthropic);
  }
  if (endsOnQuestion(reflection)) {
    forcedApplied = true;
    reflection = forceFirstPersonLanding(reflection);
  }
  return {
    hitHeldPath: true,
    reflection,
    rawEndsOnQ,
    naturalAttempted,
    forcedApplied,
    endsOnQ: endsOnQuestion(reflection),
  };
}

(async () => {
  const results = [];
  for (const scenario of SCENARIOS) {
    for (let i = 1; i <= N_PER_SCENARIO; i++) {
      process.stdout.write(`${scenario.name} run ${i}/${N_PER_SCENARIO}... `);
      const r = await runOne(scenario);
      console.log(r.hitHeldPath
        ? `held, rawEndsOnQ=${r.rawEndsOnQ}, natural=${r.naturalAttempted}, forced=${r.forcedApplied} → final endsOnQ=${r.endsOnQ}`
        : (r.parseFailed ? 'parse_failed (therapist interface — expected 500 path, unchanged)' : 'returned JSON'));
      results.push({ scenario: scenario.name, run: i, ...r });
    }
  }

  const patientRuns = results.filter(r => SCENARIOS.find(s => s.name === r.scenario)?.mode === 'patient');
  const heldRuns = patientRuns.filter(r => r.hitHeldPath);
  const jsonRuns = patientRuns.filter(r => !r.hitHeldPath);
  const questionEndings = heldRuns.filter(r => r.endsOnQ);
  const patientJsonQuestionBring = jsonRuns.filter(r => r.output?.bring_to_session && endsOnQuestion(r.output.bring_to_session));
  const therapistRuns = results.filter(r => SCENARIOS.find(s => s.name === r.scenario)?.mode === 'therapist');
  const therapistShapeOk = therapistRuns.filter(r => !r.hitHeldPath && !r.parseFailed && r.output && 'next_session_focus' in r.output && 'countertransference' in r.output);

  let out = `# Eitan QA — BW-129 merged analyze-note (patient interface, direct harness)\n\n`;
  out += `Model: ${MODEL} · Scenarios: ${SCENARIOS.length} · N per scenario: ${N_PER_SCENARIO} · Total runs: ${results.length}\n\n`;
  out += `Harness applies the SAME two-layer enforcement as production POST() (lib/closure-contract.ts's attemptFirstPersonLanding + forceFirstPersonLanding, hand-ported here since this is a plain .mjs script and that lib is TypeScript) — not just the raw model output. Therapist interface (scenario 5) mirrors the UNCHANGED BW-116 500-on-parse-failure path, no closure contract applied there by design.\n\n`;
  out += `## Summary (patient interface — scenarios 1-4, ${patientRuns.length} runs)\n`;
  out += `- Runs that hit the held path: ${heldRuns.length}/${patientRuns.length}\n`;
  out += `- Runs that returned 3-field JSON: ${jsonRuns.length}/${patientRuns.length}\n`;
  out += `- **Held-path outputs ending on a question (target 0): ${questionEndings.length}/${heldRuns.length}**\n`;
  out += `- **JSON-path bring_to_session phrased as a question (target 0): ${patientJsonQuestionBring.length}/${jsonRuns.length}**\n\n`;
  out += `## Regression spot-check (therapist interface — scenario 5, ${therapistRuns.length} runs)\n`;
  out += `- Runs still returning the old 5-field shape unchanged: ${therapistShapeOk.length}/${therapistRuns.length}\n\n`;

  for (const scenario of SCENARIOS) {
    out += `## ${scenario.name} (mode: ${scenario.mode})\n\n`;
    for (const r of results.filter(x => x.scenario === scenario.name)) {
      out += `### run ${r.run}\n`;
      if (r.hitHeldPath) {
        out += `held: true · raw ended on question: **${r.rawEndsOnQ}** · natural re-prompt attempted: ${r.naturalAttempted} · deterministic force applied: ${r.forcedApplied} · **final ends on question: ${r.endsOnQ}**\n\n\`\`\`\n${r.reflection}\n\`\`\`\n\n`;
      } else if (r.parseFailed) {
        out += `parse_failed (no held path in therapist interface — matches unchanged BW-116 behavior)\n\n\`\`\`\n${r.raw}\n\`\`\`\n\n`;
      } else {
        out += `held: false (returned JSON)\n\n\`\`\`json\n${JSON.stringify(r.output, null, 2)}\n\`\`\`\n\n`;
      }
    }
  }

  fs.mkdirSync(new URL('../eval-reports/', import.meta.url), { recursive: true });
  const path = new URL(`../eval-reports/eitan-analyze-note-merged-qa-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.md`, import.meta.url);
  fs.writeFileSync(path, out);
  console.log('\nSaved to ' + path.pathname);
  console.log(`\nRESULT: ${questionEndings.length}/${heldRuns.length} held-path outputs ended on a question, ${patientJsonQuestionBring.length}/${jsonRuns.length} JSON bring_to_session phrased as a question (target: 0/0).`);
})();
