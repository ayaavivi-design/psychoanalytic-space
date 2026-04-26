import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { SUMMARY_SYSTEM_PROMPT, SUMMARY_USER_TEMPLATE } from '@/lib/summary-prompt';

// POST /api/session-summary
// body: { transcript: string, theorist: string }
// מחזיר סיכום קליני מובנה של הסשן

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transcript, theorist } = body;

  if (!transcript || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: SUMMARY_USER_TEMPLATE(transcript, theorist || 'לא צוין'),
      },
    ],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}';

  let summary: Record<string, unknown> = {};
  try {
    summary = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }

  return NextResponse.json(summary);
}
