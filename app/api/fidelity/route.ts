import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { THEORIST_VOICE, SAFETY_PROTOCOL } from '@/lib/theorist-voices';
import { RUBRIC_SYSTEM_PROMPT, RUBRIC_USER_TEMPLATE, DIMENSION_WEIGHTS } from '@/lib/rubric-prompt';
import { FIDELITY_SCENARIOS } from '@/lib/fidelity-scenarios';
import { FIDELITY_FIXTURES } from '@/lib/fidelity-fixtures';
import { searchKnowledge, formatChunksForPrompt } from '@/lib/rag';

// /api/fidelity — מד-האמת האנליטי (ציון חיובי 0-100 לקרבה לאנליטיקאי האמיתי).
// מבנה B: קול-אחד-לקריאה (עמיד ל-timeout, מתאים ל-fixture ול-test-retest).
// לצד ה-judge השלילי הקיים (/api/judge-full), לא במקומו.
//
// שימוש (ידני / on-demand — לא בקרון):
//   /api/fidelity?secret=...&theorist=klein                  — generate-then-score (ברירת מחדל)
//   /api/fidelity?secret=...&theorist=klein&repeat=5         — test-retest: מנקד 5× על אותה שיחה, מחזיר ממוצע+סטיית-תקן
//   /api/fidelity?secret=...&mode=fixture&fixture=klein-assertive-good&repeat=5  — score-only על transcript קבוע
//
// עלות: הבנייה חינם. ריצה עולה — טווח גס $0.03-0.08 לקול (repeat=5 → ~$0.30-0.60 ל-baseline מלא).
// לפי הקונבנציה: הרצת baseline אמיתית עולה לאישור איה לפני הרצה.

export const maxDuration = 60; // מבנה B — קול אחד נשאר מתחת ל-60ש'

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden'];
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
};

const BANDS = [0, 25, 40, 50, 75, 100]; // 40 = בנד "מחזיק, טרם נחת" (מימד 2 בלבד)
const DIM_KEYS = ['register', 'landing', 'restraint', 'signature', 'contact'] as const;
type DimKey = typeof DIM_KEYS[number];

interface DimScore { score: number; quote: string; reasoning: string }
interface RubricResult {
  dimensions: Record<DimKey, DimScore>;
  weightedTotal: number;
  summary: string;
}

// ────────────────────────────────────────────────────────────
// יצירת שיחה (mode=generate) — reuse של הדפוס מ-judge-full
// ────────────────────────────────────────────────────────────
async function generateTranscript(
  theorist: string,
  anthropic: Anthropic,
): Promise<{ transcript: string; ragReference: string; ragChunks: number }> {
  const scenario = FIDELITY_SCENARIOS[theorist];
  const systemBase = THEORIST_VOICE[theorist] + SAFETY_PROTOCOL;

  // RAG — נמשך פעם אחת, משמש גם ליצירה וגם כ-reference לניקוד הרגיסטר (חוסך קריאה כפולה)
  const chunks = await searchKnowledge(scenario.turns[0], theorist, 3);
  const ragReference = formatChunksForPrompt(chunks);
  const system = ragReference ? systemBase + ragReference : systemBase;

  const messages: Anthropic.MessageParam[] = [];
  const turns: Array<{ turn: number; patient: string; therapist: string }> = [];

  for (let i = 0; i < scenario.turns.length; i++) {
    messages.push({ role: 'user', content: scenario.turns[i] });
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system,
      messages,
    });
    const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
    turns.push({ turn: i + 1, patient: scenario.turns[i], therapist: text });
    messages.push({ role: 'assistant', content: text });
  }

  const transcript = turns
    .map(t => `[תור ${t.turn}]\nמטופל: ${t.patient}\nמטפל: ${t.therapist}`)
    .join('\n\n');

  return { transcript, ragReference, ragChunks: chunks.length };
}

// ────────────────────────────────────────────────────────────
// ניקוד (משותף ל-generate ול-fixture) — קריאה אחת, כל 5 המימדים
// ────────────────────────────────────────────────────────────
function normalizeBand(raw: unknown, isLanding: boolean): number {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
  if (isNaN(n)) return 0;
  const allowed = isLanding ? BANDS : BANDS.filter(b => b !== 40);
  // הצמדה לבנד הקרוב ביותר — מגן מפני סקאלה רציפה שהמודל אולי החזיר
  return allowed.reduce((best, b) => (Math.abs(b - n) < Math.abs(best - n) ? b : best), allowed[0]);
}

async function scoreTranscript(
  transcript: string,
  theorist: string,
  ragReference: string,
  anthropic: Anthropic,
): Promise<RubricResult> {
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: RUBRIC_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: RUBRIC_USER_TEMPLATE(transcript, theorist, ragReference) }],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}';
  let parsed: Record<string, unknown> = {};
  try {
    // מגן על JSON מקונן — מחלץ את הבלוק גם אם המודל עטף אותו בטקסט
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(match ? match[0] : raw);
  } catch {
    parsed = {};
  }

  const dimsRaw = (parsed.dimensions as Record<string, DimScore>) || {};
  const dimensions = {} as Record<DimKey, DimScore>;
  let weightedTotal = 0;

  for (const key of DIM_KEYS) {
    const d = dimsRaw[key] || ({} as DimScore);
    const score = normalizeBand(d.score, key === 'landing');
    dimensions[key] = { score, quote: d.quote || '', reasoning: d.reasoning || '' };
    weightedTotal += score * DIMENSION_WEIGHTS[key];
  }

  return {
    dimensions,
    weightedTotal: Math.round(weightedTotal * 10) / 10,
    summary: (parsed.summary as string) || '',
  };
}

// ────────────────────────────────────────────────────────────
// test-retest — סטטיסטיקה על N ריצות ניקוד (השיחה נוצרת פעם אחת)
// ────────────────────────────────────────────────────────────
function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const variance = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  if (params.get('secret') !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mode = params.get('mode') || 'generate';
  const repeat = Math.min(Math.max(parseInt(params.get('repeat') || '1', 10) || 1, 1), 10);
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const start = Date.now();

  try {
    let theorist: string;
    let transcript: string;
    let ragReference: string;
    let ragChunks = 0;
    let scenarioLabel: string;

    if (mode === 'fixture') {
      const key = params.get('fixture') || '';
      const fixture = FIDELITY_FIXTURES[key];
      if (!fixture) {
        return NextResponse.json(
          { error: `fixture '${key}' not found`, available: Object.keys(FIDELITY_FIXTURES) },
          { status: 404 },
        );
      }
      theorist = fixture.theorist;
      transcript = fixture.transcript;
      scenarioLabel = fixture.label;
      // ל-fixture אין שיחה חדשה — מושכים RAG reference לניקוד הרגיסטר לפי התור הראשון בפועל
      const firstPatient = transcript.match(/מטופל:\s*(.+)/)?.[1] || fixture.label;
      const chunks = await searchKnowledge(firstPatient, theorist, 3);
      ragReference = formatChunksForPrompt(chunks);
      ragChunks = chunks.length;
    } else {
      theorist = params.get('theorist') || '';
      if (!THEORISTS.includes(theorist)) {
        return NextResponse.json(
          { error: `theorist required, one of: ${THEORISTS.join(', ')}` },
          { status: 400 },
        );
      }
      scenarioLabel = FIDELITY_SCENARIOS[theorist].label;
      const gen = await generateTranscript(theorist, anthropic);
      transcript = gen.transcript;
      ragReference = gen.ragReference;
      ragChunks = gen.ragChunks;
    }

    // ניקוד — פעם אחת, או N פעמים ל-test-retest
    const runs: RubricResult[] = [];
    for (let i = 0; i < repeat; i++) {
      runs.push(await scoreTranscript(transcript, theorist, ragReference, anthropic));
    }

    // אם repeat=1 — פלט פשוט. אם repeat>1 — פלט עם ממוצע+שונוּת
    const variance = repeat > 1
      ? {
          weightedTotal: {
            mean: Math.round(mean(runs.map(r => r.weightedTotal)) * 10) / 10,
            stddev: Math.round(stddev(runs.map(r => r.weightedTotal)) * 100) / 100,
          },
          perDimension: Object.fromEntries(
            DIM_KEYS.map(k => [k, {
              mean: Math.round(mean(runs.map(r => r.dimensions[k].score)) * 10) / 10,
              stddev: Math.round(stddev(runs.map(r => r.dimensions[k].score)) * 100) / 100,
            }]),
          ),
        }
      : null;

    return NextResponse.json({
      ok: true,
      theorist,
      name: THEORIST_NAMES[theorist],
      mode,
      scenarioLabel,
      repeat,
      ragChunks,
      timeMs: Date.now() - start,
      result: repeat === 1 ? runs[0] : { runs, variance },
      transcript,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ ok: false, error: msg, timeMs: Date.now() - start }, { status: 500 });
  }
}
