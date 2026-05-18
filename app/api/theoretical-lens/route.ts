import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { THEORIST_VOICE } from '@/lib/theorist-voices';

// POST /api/theoretical-lens
// body: { transcript: string, theorist_key: string, lang: 'he' | 'en' }
// מחזיר ניתוח תיאורטי בשלושה בלוקים אחרי סשן עם ורה/אליוט

const LENS_NAMES: Record<string, { he: string; en: string }> = {
  freud:    { he: 'פרויד',   en: 'Freud'    },
  klein:    { he: 'קליין',   en: 'Klein'    },
  winnicott:{ he: 'ויניקוט', en: 'Winnicott' },
  ogden:    { he: 'אוגדן',   en: 'Ogden'    },
};

function buildSystemPrompt(theoristKey: string, lang: string): string {
  const voice = THEORIST_VOICE[theoristKey] || '';
  const isHe = lang !== 'en';

  const instructions = isHe ? `
אתה ${LENS_NAMES[theoristKey]?.he || theoristKey}. קראת שיחה שהתנהלה בין מטופל/ת לבין מלווה תמיכתי.
אתה מתבקש לספק ניתוח תיאורטי קצר של השיחה — לא כמטפל שלהם, אלא כתיאורטיקן שקרא תמלול.

השב בדיוק במבנה JSON הבא בלבד (ללא טקסט נוסף לפני או אחרי):
{
  "block1": "מה בולט מבחינת הגישה שלך — 2-4 משפטים",
  "block2": "מה לא נאמר, מה נותר מתחת לפני השטח — 2-4 משפטים",
  "block3": "שאלה אחת שהיית מביא לסשן הבא עם המטפל/ת — משפט אחד"
}

כתוב בעברית. היה ממוקד, לא אקדמי. אל תפרש יתר על המידה. דבר מתוך הגישה שלך.
` : `
You are ${LENS_NAMES[theoristKey]?.en || theoristKey}. You have read a conversation between a patient and a supportive companion.
You are asked to provide a brief theoretical reading of the session — not as their therapist, but as a theorist who has read the transcript.

Respond with exactly the following JSON structure (no text before or after):
{
  "block1": "What stands out from your theoretical perspective — 2-4 sentences",
  "block2": "What was unsaid, what remains beneath the surface — 2-4 sentences",
  "block3": "One question you would bring to the next session with the therapist — one sentence"
}

Write in English. Be focused, not academic. Do not over-interpret. Speak from within your approach.
`;

  // הכנס את הקול של התיאורטיקן כרקע — רק 600 תווים ראשונים (הפרסונה הבסיסית, לא כל הכללים)
  const voiceContext = voice.slice(0, 600).trim();

  return `${voiceContext}\n\n---\n${instructions}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const body = await req.json();
  const { transcript, theorist_key, lang } = body;

  if (!transcript || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'Missing transcript' }, { status: 400 });
  }

  const validKeys = ['freud', 'klein', 'winnicott', 'ogden'];
  if (!theorist_key || !validKeys.includes(theorist_key)) {
    return NextResponse.json({ error: 'Invalid theorist_key' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const isHe = (lang || 'he') !== 'en';
  const userMessage = isHe
    ? `להלן תמלול השיחה:\n\n${transcript}\n\nאנא ספק את הניתוח בפורמט JSON המבוקש.`
    : `Here is the session transcript:\n\n${transcript}\n\nPlease provide your analysis in the requested JSON format.`;

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: buildSystemPrompt(theorist_key, lang || 'he'),
    messages: [{ role: 'user', content: userMessage }],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '';

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }

  let result: Record<string, string> = {};
  try {
    result = JSON.parse(jsonMatch[0]);
  } catch {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }

  const theoristName = LENS_NAMES[theorist_key]?.[isHe ? 'he' : 'en'] || theorist_key;

  return NextResponse.json({
    block1: result.block1 || '',
    block2: result.block2 || '',
    block3: result.block3 || '',
    theorist_name: theoristName,
  });
}
