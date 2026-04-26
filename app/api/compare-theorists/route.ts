import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { THEORIST_VOICE, SAFETY_PROTOCOL } from '@/lib/theorist-voices';

// POST /api/compare-theorists
// body: { patient_message: string, theorists: string[] }
// מריץ את כל התיאורטיקנים הנבחרים במקביל ומחזיר את תגובתם לאותו ציטוט

const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};

const VALID_THEORISTS = Object.keys(THEORIST_NAMES);

async function getTheoristResponse(
  anthropic: Anthropic,
  theorist: string,
  patientMessage: string
): Promise<{ theorist: string; name: string; response: string; error?: string }> {
  try {
    const system = THEORIST_VOICE[theorist] + SAFETY_PROTOCOL;
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: patientMessage }],
    });
    const response = res.content[0]?.type === 'text' ? res.content[0].text : '';
    return { theorist, name: THEORIST_NAMES[theorist], response };
  } catch (err) {
    return {
      theorist,
      name: THEORIST_NAMES[theorist],
      response: '',
      error: err instanceof Error ? err.message : 'שגיאה לא ידועה',
    };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patient_message, theorists } = body;

  if (!patient_message || typeof patient_message !== 'string') {
    return NextResponse.json({ error: 'Missing patient_message' }, { status: 400 });
  }

  const selected: string[] = Array.isArray(theorists)
    ? theorists.filter((t: string) => VALID_THEORISTS.includes(t)).slice(0, 8)
    : VALID_THEORISTS;

  if (selected.length === 0) {
    return NextResponse.json({ error: 'No valid theorists selected' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const comparisons = await Promise.all(
    selected.map(t => getTheoristResponse(anthropic, t, patient_message))
  );

  return NextResponse.json({ comparisons, patient_message });
}
