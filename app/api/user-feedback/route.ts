import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { THEORIST_VOICE } from '@/lib/theorist-voices';
import {
  PERSONAS,
  buildUserSimSystem,
  buildUserFeedbackSystem,
  buildTurnContext,
} from '@/lib/user-feedback-prompt';

// POST /api/user-feedback
// body: { personaId: string, theorist: string, turns?: number }
// מריץ שיחה מדומה בין פרסונה לבין הסוכן, ואז מחזיר פידבק חווייתי

const DEFAULT_TURNS = 5;
const MAX_TURNS = 8;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { personaId = 'michal', theorist = 'klein', turns: rawTurns } = body;
  const turns = Math.min(Number(rawTurns) || DEFAULT_TURNS, MAX_TURNS);

  const persona = PERSONAS[personaId];
  if (!persona) {
    return NextResponse.json({ error: `Unknown persona: ${personaId}` }, { status: 400 });
  }

  const therapistSystem = THEORIST_VOICE[theorist];
  if (!therapistSystem) {
    return NextResponse.json({ error: `Unknown theorist: ${theorist}` }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // היסטוריה נפרדת לכל צד
  const therapistHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  const transcript: { speaker: 'user' | 'therapist'; text: string }[] = [];

  // ─── לולאת שיחה ──────────────────────────────────────────────
  for (let i = 0; i < turns; i++) {
    // תור המשתמש המדומה
    const turnContext = buildTurnContext(persona, transcript, i === 0);

    const userSimRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 350,
      system: buildUserSimSystem(persona),
      messages: [
        // להלן: ההיסטוריה הפנימית של הסוכן-משתמש (רק user/assistant של הסים עצמו)
        // פה אנחנו לא שומרים היסטוריה — כל תור מקבל את כל השיחה כהקשר בתוך ה-turnContext
        { role: 'user', content: turnContext },
      ],
    });

    const userMsg =
      userSimRes.content[0]?.type === 'text' ? userSimRes.content[0].text.trim() : '';
    if (!userMsg) break;

    transcript.push({ speaker: 'user', text: userMsg });
    therapistHistory.push({ role: 'user', content: userMsg });

    // תור המטפל (הסוכן הפסיכואנליטי)
    const therapistRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: therapistSystem,
      messages: therapistHistory,
    });

    const therapistMsg =
      therapistRes.content[0]?.type === 'text' ? therapistRes.content[0].text.trim() : '';
    if (!therapistMsg) break;

    transcript.push({ speaker: 'therapist', text: therapistMsg });
    therapistHistory.push({ role: 'assistant', content: therapistMsg });
  }

  // ─── פידבק ──────────────────────────────────────────────────
  const transcriptForFeedback = transcript
    .map(t => `${t.speaker === 'user' ? persona.name : 'הסוכן'}: ${t.text}`)
    .join('\n\n');

  const feedbackRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system: buildUserFeedbackSystem(persona),
    messages: [
      {
        role: 'user',
        content: `[השיחה שהייתה לך עם הסוכן]\n\n${transcriptForFeedback}\n\n---\nכתוב/י פידבק אישי. JSON בלבד.`,
      },
    ],
  });

  const raw =
    feedbackRes.content[0]?.type === 'text' ? feedbackRes.content[0].text : '';

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let feedback: Record<string, unknown> = {};
  try {
    feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw };
  } catch {
    feedback = { raw };
  }

  return NextResponse.json({
    persona: personaId,
    personaName: persona.name,
    theorist,
    turns: transcript.length / 2,
    transcript,
    feedback,
  });
}
