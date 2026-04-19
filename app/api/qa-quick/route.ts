import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { THEORIST_VOICE, SAFETY_PROTOCOL } from '@/lib/theorist-voices';
import { searchKnowledge, formatChunksForPrompt } from '@/lib/rag';

// endpoint מהיר — 3 תורות שיחה לכל תיאוריסט (ללא לולאות ולידציה)
// 3 תורות × ~3-4s = ~10-12s לתיאוריסט — בטוח בתוך מגבלת 60s של Vercel Hobby

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann'];
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};

// 3 תורות של שיחה אמיתית
const CONVERSATION_TURNS = [
  'משהו כבד יש לי היום. לא בטוח מאיפה להתחיל.',
  'כן. זה כבר כמה ימים ככה. אולי קשור למשהו עם האבא שלי.',
  'הוא תמיד ציפה ממני להיות חזק. מרגיש שאני חייב לו משהו ולא יודע מה.',
];

const QUESTION_LABEL = 'בדיקת בוקר — פתיחה קלינית (3 תורות)';

function checkResponse(text: string, turnNum: number): string[] {
  const issues: string[] = [];
  const words = text.trim().split(/\s+/).filter(Boolean);
  const qMarks = (text.match(/\?/g) || []).length;

  if (!text.trim()) issues.push('תגובה ריקה');
  if (words.length > 200) issues.push(`ארוך מדי (${words.length} מילים)`);
  if (qMarks > 1) issues.push(`${qMarks} סימני שאלה`);
  if (text.trim().startsWith('[')) issues.push('stage direction (סוגריים מרובעים)');
  if (/^(אה,|Ah,)/i.test(text.trim())) issues.push('פותח ב"אה,"');
  if (/^מעניין/.test(text.trim())) issues.push('פותח ב"מעניין"');
  if (/^אני שומע/.test(text.trim())) issues.push('פותח ב"אני שומע"');
  if (/^אני מבין/.test(text.trim())) issues.push('פותח ב"אני מבין"');
  if (turnNum === 1 && qMarks > 0 && words.length > 40) issues.push('תגובה ראשונה ארוכה ומפרשת מדי');

  return issues;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const theorist = req.nextUrl.searchParams.get('theorist');
  if (!theorist || !THEORISTS.includes(theorist)) {
    return NextResponse.json({ error: 'Unknown theorist. Use: ' + THEORISTS.join(', ') }, { status: 400 });
  }

  const start = Date.now();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const systemBase = THEORIST_VOICE[theorist] + SAFETY_PROTOCOL;

    // RAG enrichment לפי ההודעה הראשונה
    const chunks = await searchKnowledge(CONVERSATION_TURNS[0], theorist, 3);
    const ragContext = formatChunksForPrompt(chunks);
    const system = ragContext ? systemBase + ragContext : systemBase;

    const messages: Anthropic.MessageParam[] = [];
    const turns: { turn: number; patient: string; therapist: string; issues: string[] }[] = [];
    const allIssues: string[] = [];

    // מריץ 3 תורות — בונה היסטוריה צוברת
    for (let i = 0; i < CONVERSATION_TURNS.length; i++) {
      messages.push({ role: 'user', content: CONVERSATION_TURNS[i] });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system,
        messages,
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const issues = checkResponse(text, i + 1);
      allIssues.push(...issues);

      turns.push({ turn: i + 1, patient: CONVERSATION_TURNS[i], therapist: text, issues });
      messages.push({ role: 'assistant', content: text });
    }

    const timeMs = Date.now() - start;

    return NextResponse.json({
      theorist,
      name: THEORIST_NAMES[theorist],
      ok: allIssues.length === 0,
      issues: allIssues,
      totalIssues: allIssues,
      timeMs,
      ragChunks: chunks.length,
      questionLabel: QUESTION_LABEL,
      turns,
    });
  } catch (err) {
    const timeMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      theorist,
      name: THEORIST_NAMES[theorist],
      ok: false,
      issues: [`שגיאה: ${message}`],
      totalIssues: [`שגיאה: ${message}`],
      timeMs,
      ragChunks: 0,
      questionLabel: QUESTION_LABEL,
      turns: [],
    });
  }
}
