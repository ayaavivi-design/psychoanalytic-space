import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { THEORIST_VOICE } from '@/lib/theorist-voices';
import {
  PERSONAS,
  buildUXSimSystem,
  buildConvSimSystem,
  buildUXFeedbackSystem,
  buildConvContext,
} from '@/lib/user-feedback-prompt';

// POST /api/user-feedback
// body: { personaId, theorist, turns? }
//
// שלב 1: הסוכן מדמה ניווט בממשק (stream-of-consciousness)
// שלב 2: שיחה קצרה עם הסוכן הפסיכואנליטי
// שלב 3: פידבק UX ספציפי — כפתורים, פלואו, חיכוך, מה חסר

const CONV_TURNS = 3; // שיחה קצרה — מספיקה כדי לקבל טעימה

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { personaId = 'michal', theorist = 'klein' } = body;

  const persona = PERSONAS[personaId];
  if (!persona) return NextResponse.json({ error: `Unknown persona: ${personaId}` }, { status: 400 });

  const therapistSystem = THEORIST_VOICE[theorist];
  if (!therapistSystem) return NextResponse.json({ error: `Unknown theorist: ${theorist}` }, { status: 400 });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // ─── שלב 1: סימולציה של ניווט בממשק ─────────────────────────────────────
  const uxNavRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 900,
    system: buildUXSimSystem(persona),
    messages: [
      {
        role: 'user',
        content: `פתחת את האתר. כתוב/י יומן ניווט — מה עשית, מה מצאת, מה לא מצאת. ספציפי. גוף ראשון. עברית.`,
      },
    ],
  });

  const uxNavLog = uxNavRes.content[0]?.type === 'text' ? uxNavRes.content[0].text : '';

  // ─── שלב 2: שיחה קצרה עם הסוכן ──────────────────────────────────────────
  const therapistHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  const transcript: { speaker: 'user' | 'therapist'; text: string }[] = [];

  for (let i = 0; i < CONV_TURNS; i++) {
    // הודעת משתמש
    const turnContext = buildConvContext(persona, transcript, i === 0);

    const userMsgRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 280,
      system: buildConvSimSystem(persona),
      messages: [{ role: 'user', content: turnContext }],
    });

    const userMsg = userMsgRes.content[0]?.type === 'text' ? userMsgRes.content[0].text.trim() : '';
    if (!userMsg) break;

    transcript.push({ speaker: 'user', text: userMsg });
    therapistHistory.push({ role: 'user', content: userMsg });

    // תגובת המטפל
    const therapistRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: therapistSystem,
      messages: therapistHistory,
    });

    const therapistMsg = therapistRes.content[0]?.type === 'text' ? therapistRes.content[0].text.trim() : '';
    if (!therapistMsg) break;

    transcript.push({ speaker: 'therapist', text: therapistMsg });
    therapistHistory.push({ role: 'assistant', content: therapistMsg });
  }

  // ─── שלב 3: פידבק UX ─────────────────────────────────────────────────────
  const transcriptStr = transcript
    .map(t => `${t.speaker === 'user' ? persona.name : 'הסוכן'}: ${t.text}`)
    .join('\n\n');

  const feedbackRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system: buildUXFeedbackSystem(persona),
    messages: [
      {
        role: 'user',
        content: `[יומן הניווט שלך בממשק]\n${uxNavLog}\n\n[השיחה שניהלת]\n${transcriptStr}\n\n---\nכתוב/י פידבק UX. JSON בלבד.`,
      },
    ],
  });

  const raw = feedbackRes.content[0]?.type === 'text' ? feedbackRes.content[0].text : '';
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
    uxNavLog,
    transcript,
    feedback,
  });
}
