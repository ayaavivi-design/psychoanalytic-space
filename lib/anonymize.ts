import Anthropic from '@anthropic-ai/sdk';

// אנונימיזציה-בכניסה ל-BW-112. fail-safe: אם נכשל — זורק, והקורא לא ישמור טקסט גולמי.
// הערה: ה-SYSTEM משוכפל זמנית מ-app/api/anonymize/route.ts — לאחד בעתיד (cleanup).
const ANONYMIZE_SYSTEM = `You are a clinical text anonymizer. Your task: detect and replace personally identifying information in psychotherapy case material, while preserving all psychological/clinical content.

REPLACE:
- Full names, first names, nicknames → initials only (two random letters with a dot). Each name gets unique initials.
- Specific ages → approximate decade.
- Specific cities / neighborhoods → general region.
- Specific institutions (hospitals, schools, workplaces) → type only.
- Specific professions WITH identifiers → general (a bare profession can stay).
- Specific dates / years → relative time.
- Distinctive physical descriptions that could identify → omit or generalize.

DO NOT CHANGE:
- Psychological content, emotions, dynamics, defenses, symptoms.
- Relationship labels (אמא, אבא, אח, בעל).
- Theoretical/clinical observations.
- The flow and structure of the text.

Return ONLY valid JSON, no prose outside it:
{ "anonymized": "the complete anonymized text" }`;

export async function anonymizeText(text: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // התקרה נגזרת מאורך הקלט · הפלט הוא הטקסט כולו, ולכן תקרה קבועה של 2000
  // הספיקה לחומר פותח קצר וחתכה תמליל שלם של התייעצות באמצע. חיתוך פירושו
  // JSON פגום, כלומר ‎anonymize_failed‎, כלומר "לא נשמר דבר" על שיחה ארוכה
  // דווקא. תקרה עליונה נשארת, כי מעבר לה צריך פיצול ולא עוד טוקנים.
  const budget = Math.min(16000, Math.max(2000, Math.ceil(text.length * 1.4)));
  const res = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: budget,
    system: ANONYMIZE_SYSTEM,
    messages: [{ role: 'user', content: `אנא אנונם את הטקסט הבא:\n\n${text}` }],
  });
  const raw = res.content[0]?.type === 'text' ? res.content[0].text : '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('anonymize_failed');
  const result = JSON.parse(match[0]);
  if (typeof result.anonymized !== 'string' || !result.anonymized.trim()) {
    throw new Error('anonymize_failed');
  }
  return result.anonymized;
}
