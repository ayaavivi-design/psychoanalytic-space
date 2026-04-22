import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { SUPERVISION_SYSTEM_PROMPT, SUPERVISION_USER_TEMPLATE } from '@/lib/supervise-prompt';

// POST /api/supervise
// body: { transcript: string, theorist: string }
// מחזיר דוח פיקוח קליני מובנה

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transcript, theorist } = body;

  if (!transcript || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SUPERVISION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: SUPERVISION_USER_TEMPLATE(transcript, theorist || 'לא צוין'),
      },
    ],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}';

  let report: Record<string, unknown> = {};
  try {
    report = JSON.parse(raw);
  } catch {
    // אם לא JSON תקין — החזר שגיאה עם הטקסט הגולמי לדיבאג
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }

  return NextResponse.json(report);
}
