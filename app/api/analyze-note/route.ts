import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { THEORIST_VOICE } from '@/lib/theorist-voices';
import { searchKnowledgeHybrid, formatChunksForPrompt } from '@/lib/rag';
import { ANALYZE_SYSTEM_PROMPT, ANALYZE_USER_TEMPLATE } from '@/lib/analyze-note-prompt';

// POST /api/analyze-note
// body: { text: string, mode?: 'patient' | 'therapist', gender?: string }
// BW-116 — one Winnicott agent (full voice + RAG) analyzes a note. Branches by interface. Local only.

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json();
  const { text, mode, gender } = body;

  if (!text || typeof text !== 'string' || text.trim().length < 5) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const t = text.trim();
  const interfaceMode = mode === 'therapist' ? 'therapist' : 'patient';

  // RAG — ground the analysis in Winnicott's original texts
  let ragContext = '';
  try {
    const chunks = await searchKnowledgeHybrid(t, 'winnicott', 4);
    ragContext = formatChunksForPrompt(chunks);
  } catch { /* RAG is best-effort */ }

  // One Winnicott: full voice block + the analyze instruction + his texts
  const voice = THEORIST_VOICE['winnicott'] || '';
  const system = `${voice}\n\n──────────\n\n${ANALYZE_SYSTEM_PROMPT}${ragContext}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system,
    messages: [{ role: 'user', content: ANALYZE_USER_TEMPLATE(t, interfaceMode, gender) }],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });

  try {
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }
}
