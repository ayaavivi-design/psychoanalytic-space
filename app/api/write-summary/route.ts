import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// POST /api/write-summary
// body: { text: string, lang?: 'he' | 'en' }
// Structures a patient's written note into session-ready format

const SYSTEM_PROMPT = `You receive a free-form note written by a therapy patient — something they want to bring to their next session.
Return ONLY valid JSON. The very first character must be { and the very last must be }.

FORMAT:
{
  "key_points": ["2–4 short phrases — the most important things said, in order of importance"],
  "bring_to_session": "1–2 sentences — written in first person from the patient's voice — what I want to say or explore with my therapist"
}

Rules:
- Stay close to what was written. Do not interpret or add clinical framing.
- bring_to_session: use the patient's own language, not therapeutic jargon.
- If the note is in Hebrew — return all text values in Hebrew.
- If the note is in English — return all text values in English.`;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== 'string' || text.trim().length < 5) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text.trim() }],
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
