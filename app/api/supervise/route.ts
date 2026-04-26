import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { SUPERVISION_SYSTEM_PROMPT, SUPERVISION_USER_TEMPLATE } from '@/lib/supervise-prompt';

// POST /api/supervise
// body: { transcript: string, theorist: string }
// מחזיר דוח פיקוח קליני מובנה

// Keep only the last N exchanges from a transcript to stay within token limits.
// Each exchange is a "[תור N]\nמטופל: ...\nמטפל: ..." block.
function truncateTranscript(transcript: string, maxExchanges: number): string {
  const blocks = transcript.split(/\n\n(?=\[תור )/).filter(Boolean);
  if (blocks.length <= maxExchanges) return transcript;
  const kept = blocks.slice(-maxExchanges);
  return `[...${blocks.length - maxExchanges} תורות קודמים הושמטו לקריאות]\n\n` + kept.join('\n\n');
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transcript, theorist } = body;

  if (!transcript || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Truncate very long transcripts to the last 8 exchanges to avoid token overflow.
  // Clinical supervision does not need the full history — the last 8 turns contain
  // the freshest material and are sufficient for a meaningful report.
  const truncatedTranscript = truncateTranscript(transcript, 8);

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: SUPERVISION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: SUPERVISION_USER_TEMPLATE(truncatedTranscript, theorist || 'לא צוין'),
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
