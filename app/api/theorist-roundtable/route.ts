import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { THEORIST_VOICE } from '@/lib/theorist-voices';

// POST /api/theorist-roundtable
// body: {
//   patient_message: string,
//   initial_responses: { theorist: string, name: string, response: string }[]
// }
// שולחן עגול: כל תיאורטיקן רואה מה שאר עמיתיו אמרו ומגיב בקצרה

const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};

const ROUNDTABLE_SUFFIX = `

---
ROUNDTABLE MODE — you are now in a brief collegial exchange.
You have just heard your colleagues' initial responses to the patient's statement above.
Add your brief reaction — 2 sentences maximum.
Rules:
- Speak in your own theoretical voice
- You may agree, disagree, or add what was missed
- Be specific: name what in a colleague's response you are responding to, or name what none of them addressed
- Do not summarize or repeat what was already said
- Do not introduce yourself or explain your school
- 2 sentences. No more.`;

type InitialResponse = { theorist: string; name: string; response: string; error?: string };

async function getReaction(
  anthropic: Anthropic,
  theorist: string,
  patientMessage: string,
  allResponses: InitialResponse[]
): Promise<{ theorist: string; name: string; reaction: string; error?: string }> {
  try {
    const othersText = allResponses
      .filter(r => r.theorist !== theorist && !r.error)
      .map(r => `${r.name}: "${r.response}"`)
      .join('\n\n');

    const userContent = `ציטוט המטופל: "${patientMessage}"

תגובות עמיתיך:
${othersText}

כעת — תגובתך הקצרה (2 משפטים):`;

    const system = THEORIST_VOICE[theorist] + ROUNDTABLE_SUFFIX;

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      system,
      messages: [{ role: 'user', content: userContent }],
    });

    const reaction = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';
    return { theorist, name: THEORIST_NAMES[theorist] || theorist, reaction };
  } catch (err) {
    return {
      theorist,
      name: THEORIST_NAMES[theorist] || theorist,
      reaction: '',
      error: err instanceof Error ? err.message : 'שגיאה',
    };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { patient_message, initial_responses } = body;

  if (!patient_message || !Array.isArray(initial_responses) || initial_responses.length === 0) {
    return NextResponse.json({ error: 'Missing patient_message or initial_responses' }, { status: 400 });
  }

  const validResponses: InitialResponse[] = (initial_responses as InitialResponse[]).filter(
    r => r.theorist && THEORIST_VOICE[r.theorist] && r.response
  );

  if (validResponses.length === 0) {
    return NextResponse.json({ error: 'No valid responses to react to' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const reactions = await Promise.all(
    validResponses.map(r => getReaction(anthropic, r.theorist, patient_message, validResponses))
  );

  return NextResponse.json({ reactions, patient_message });
}
