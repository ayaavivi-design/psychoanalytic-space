import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { PATIENT_REFLECTION_SYSTEM_PROMPT, PATIENT_REFLECTION_USER_TEMPLATE } from '@/lib/patient-reflection-prompt';

// POST /api/patient-reflection
// body: { transcript: string }
// מחזיר רפלקציה אישית בגוף ראשון למטופל

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transcript } = body;

  if (!transcript || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: PATIENT_REFLECTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: PATIENT_REFLECTION_USER_TEMPLATE(transcript),
      },
    ],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '';

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }

  let reflection: Record<string, unknown> = {};
  try {
    reflection = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }

  return NextResponse.json(reflection);
}
