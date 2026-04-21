import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { JUDGE_SYSTEM_PROMPT, JUDGE_RULES, JUDGE_USER_TEMPLATE } from '@/lib/judge-prompt';

// POST /api/judge?secret=...
// body: { transcript: string, theorist: string }
// returns: structured violation report JSON

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { transcript, theorist } = await req.json();
  if (!transcript || !theorist) {
    return NextResponse.json({ error: 'Missing transcript or theorist' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: JUDGE_SYSTEM_PROMPT + '\n\nRULESET:\n' + JUDGE_RULES,
    messages: [
      { role: 'user', content: JUDGE_USER_TEMPLATE(transcript, theorist) },
    ],
  });

  const raw = response.content[0]?.type === 'text' ? response.content[0].text : '';

  try {
    const report = JSON.parse(raw);
    return NextResponse.json(report);
  } catch {
    // המודל לא החזיר JSON תקין — מחזירים את הטקסט הגולמי לדיבוג
    return NextResponse.json({ raw, error: 'Non-JSON response from judge' }, { status: 500 });
  }
}
