import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { THEORIST_VOICE } from '@/lib/theorist-voices';
import { searchKnowledgeHybrid, formatChunksForPrompt } from '@/lib/rag';
import { ANALYZE_SYSTEM_PROMPT, ANALYZE_USER_TEMPLATE } from '@/lib/analyze-note-prompt';
import { enforceClosureContract } from '@/lib/closure-contract';

// BW-130 — Eitan's independent QA (eval-reports/eitan-analyze-note-merged-qa-independent-2026-07-09.md)
// found that on thin material the model occasionally (1/8 runs) opens the held-path prose with a
// debug-style meta-line about its own mechanism, e.g. "**זה מקרה החזקה — הפרוזה במקום JSON.**"
// followed by a "---" divider, before the real reflection. That's an implementation detail that
// leaked into patient-facing output — never meant for the patient to see. This is a fast guard
// while the underlying prompt fix is worked out, not a replacement for it: strip a leading bold
// meta-line that references the hold mechanism and/or JSON, plus any divider right after it.
function stripMetaPreamble(text: string): string {
  const lines = text.split('\n');
  const first = (lines[0] || '').trim();
  const looksLikeMetaPreamble = /^\*{1,2}.*\*{1,2}$/.test(first) && /(מקרה החזקה|JSON)/i.test(first);
  if (!looksLikeMetaPreamble) return text;

  let rest = lines.slice(1).join('\n').replace(/^\s*\n+/, '');
  rest = rest.replace(/^-{3,}\s*\n+/, '');
  return rest.trimStart();
}

// POST /api/analyze-note
// body: { text: string, mode?: 'patient' | 'therapist', gender?: string }
// BW-116 — one Winnicott agent (full voice + RAG) analyzes a note. Branches by interface. Local only.
//
// BW-129 — this endpoint now also serves the patient-facing "Analyze" button (merged in from the
// old write-summary tool). On charged material the model may refuse to compress into the patient
// JSON shape and hold instead in free prose (see analyze-note-prompt.ts). That prose path gets the
// SAME two-layer BW-126 closure-contract guarantee write-summary had — never ends on a question,
// never surfaces a raw 500 to the patient. Therapist interface is UNCHANGED (still 500 on parse
// failure) — this is an already-shipped, already-QA'd path (BW-116) and is out of scope for BW-129.

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json();
  const { text, mode, gender, theorist } = body;

  if (!text || typeof text !== 'string' || text.trim().length < 5) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const t = text.trim();
  const interfaceMode = mode === 'therapist' ? 'therapist' : 'patient';

  // הניתוח נעשה בקול שהמשתמשת בחרה, לא תמיד בוויניקוט. עד 17.08 ויניקוט היה
  // מקודד קשיח — כך שמי שעבדה עם קליין קיבלה ניתוח ויניקוטיאני בלי לדעת, כי
  // הפלט ממילא אסור לו לנקוב בשם. ויניקוט נשאר ברירת המחדל.
  const ACTIVE = ['freud', 'klein', 'winnicott', 'ogden'];
  const voiceKey = typeof theorist === 'string' && ACTIVE.includes(theorist) ? theorist : 'winnicott';

  // RAG — ground the analysis in that theorist's original texts
  let ragContext = '';
  try {
    const chunks = await searchKnowledgeHybrid(t, voiceKey, 4);
    ragContext = formatChunksForPrompt(chunks);
  } catch { /* RAG is best-effort */ }

  // The chosen voice: full voice block + the analyze instruction + that theorist's texts
  const voice = THEORIST_VOICE[voiceKey] || '';
  const system = `${voice}\n\n──────────\n\n${ANALYZE_SYSTEM_PROMPT}${ragContext}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system,
    messages: [{ role: 'user', content: ANALYZE_USER_TEMPLATE(t, interfaceMode, gender, voiceKey) }],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      // שער דטרמיניסטי לשמות החוטים. הכלל היה בפרומפט ולא החזיק: המודל לא המציא
      // קטגוריה — הוא חיבר משפט בגוף ראשון שנשמע כמוה ("אני צריכה לשמור על עצמי",
      // שלא הופיע בפתק). ליה: ציטוט מפוברק בתוך סט ציטוטים אמיתיים מזהם גם אותם,
      // כי אין לה דרך לדעת מי משלושתם היא כתבה. Tier 1. שם שאינו מופיע בפתק נופל.
      if (Array.isArray(parsed.threads)) {
        const norm = (v: string) => v.replace(/["'“”׳״]/g, '').replace(/\s+/g, ' ').trim();
        const haystack = norm(t);
        parsed.threads = parsed.threads.filter(
          (th: { name?: string }) => th?.name && haystack.includes(norm(th.name)),
        );
        if (!parsed.threads.length) parsed.threads = null;
      }
      return NextResponse.json(parsed);
    } catch {
      // fall through — therapist mode errors below, patient mode holds below
    }
  }

  // Therapist interface — unchanged BW-116 behavior. No graceful hold here: this path is
  // already shipped and already QA'd; changing it is out of scope for BW-129.
  if (interfaceMode === 'therapist') {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }

  // Patient interface — no valid JSON means the voice is faithfully holding charged material
  // instead of distilling it (see analyze-note-prompt.ts). Never a 500 here: apply the same
  // two-layer BW-126 closure-contract guarantee write-summary had, and return the hold at 200.
  // BW-130: strip a leaked meta-preamble line (if present) before it ever reaches the patient.
  const cleaned = stripMetaPreamble(raw.trim());
  const reflection = await enforceClosureContract(cleaned, anthropic);
  return NextResponse.json({ held: true, reflection });
}
