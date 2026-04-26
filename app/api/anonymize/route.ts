import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/anonymize
// body: { text: string }
// מזהה ומחליף פרטים מזהים בחומר קליני

const SYSTEM = `You are a clinical text anonymizer. Your task: detect and replace personally identifying information in psychotherapy case material, while preserving all psychological/clinical content.

REPLACE:
- Full names, first names, nicknames → initials only. Use two random letters with a dot: "שרה" → "מ.ע", "David" → "R.T". Each name gets unique initials — do not reuse the same initials for different people.
- Specific ages → approximate decade: "בת 42" → "בת ארבעים ומשהו", "age 67" → "in his late sixties"
- Specific cities / neighborhoods → general region: "תל אביב" → "עיר גדולה במרכז", "Brooklyn" → "large city"
- Specific institutions (hospitals, schools, workplaces) → type only: "בית חולים שיבא" → "בית חולים", "Google" → "חברת טכנולוגיה"
- Specific professions WITH identifiers → general: "רופאה בדרמטולוגיה" → "מקצוענית רפואית" — but "רופאה" alone can stay
- Specific dates / years → relative time: "מרץ 2021" → "לפני כשלוש שנים", "January 15th" → "מוקדם השנה"
- Distinctive physical descriptions that could identify → omit or generalize

DO NOT CHANGE:
- Psychological content, emotions, dynamics, defenses, symptoms
- Relationship labels (אמא, אבא, אח, בעל) — these are fine
- Theoretical/clinical observations
- General professions without location or specialty identifiers
- The flow and structure of the text

Return ONLY valid JSON, no prose outside it:
{
  "anonymized": "the complete anonymized text",
  "changes": [
    { "original": "שרה", "replacement": "מ.ע", "type": "שם" },
    { "original": "תל אביב", "replacement": "עיר גדולה במרכז", "type": "מיקום" }
  ]
}

If there is nothing to anonymize, return the original text unchanged with an empty changes array.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: `אנא אנונם את הטקסט הבא:\n\n${text}` }],
  });

  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '{}';

  try {
    const result = JSON.parse(raw);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'parse_failed', raw }, { status: 500 });
  }
}
