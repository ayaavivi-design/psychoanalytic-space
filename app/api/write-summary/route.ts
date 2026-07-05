import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { THEORIST_VOICE } from '@/lib/theorist-voices';
import { searchKnowledgeHybrid, formatChunksForPrompt } from '@/lib/rag';

// POST /api/write-summary
// body: { text: string, lang?: 'he' | 'en' }
// Distills a patient's between-sessions writing into a session-ready summary.
// The summarizer IS Winnicott (full voice + RAG), woven in — never named, no jargon.
// Output shape is unchanged (key_points + bring_to_session) so the existing UI renders as-is.

const TASK_PROMPT = `══════════════════════════════════════
TASK — DISTILL A PATIENT'S BETWEEN-SESSIONS WRITING
You are reading a note a patient wrote between therapy sessions — what stayed with them,
what they are carrying toward the next session. Read it the way you think: from what is
almost-said, from the part of them trying to find words. Then distill it for them, so they
can bring it to their own therapist.

Return ONLY valid JSON. The very first character must be { and the very last must be }.

FORMAT:
{
  "key_points": ["2–4 short phrases in the PATIENT'S OWN FIRST-PERSON VOICE (\"אני…\", \"כשנשאלתי…\", \"הדלת שאני…\") — what is most ALIVE in what they wrote, including what sits just under the surface. These are the patient's own notes to themselves — NEVER a third-person description of them (not \"מתנצלת\"/\"היא\", but \"אני מתנצלת\")."],
  "bring_to_session": "1–2 sentences, first person, in the patient's own voice — what they might bring to their therapist. Name the real thing gently; do not tie it into a tidy conclusion."
}

HOW YOU WRITE HERE:
- EVERYTHING is in the patient's FIRST PERSON — these are their own notes to themselves, never a description written about them in third person.
- Your sensibility is woven in — DO NOT name yourself or any theorist, and use NO jargon (no "true self", "holding", "transitional object", etc.). Speak plainly; the depth is in what you NOTICE, not in terminology.
- Stay grounded in what they actually wrote — surface what is there and just-beneath it; do NOT invent events or feelings they did not express.
- This is a holding reflection that helps them find words — NOT a clinical record, NOT a diagnosis, NOT advice.
- Respond in the language of the note: Hebrew note → all values in Hebrew; English note → all values in English.
- HEBREW QUALITY: write natural, grammatically correct Hebrew. Watch a common error — the first-person past of "להגיד" is "אמרתי", NEVER "הגדתי" (which is not a word). Re-read every Hebrew value before returning it.
══════════════════════════════════════`;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== 'string' || text.trim().length < 5) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const t = text.trim();

  // RAG — ground the reflection in Winnicott's original texts (best-effort).
  let ragContext = '';
  try {
    const chunks = await searchKnowledgeHybrid(t, 'winnicott', 4);
    ragContext = formatChunksForPrompt(chunks);
  } catch { /* RAG is best-effort */ }

  // One Winnicott: full voice block + the distill instruction + his texts.
  const voice = THEORIST_VOICE['winnicott'] || '';
  const system = `${voice}\n\n──────────\n\n${TASK_PROMPT}${ragContext}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 900,
    system,
    messages: [{ role: 'user', content: t }],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });

  try {
    const summary = JSON.parse(jsonMatch[0]);
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }
}
