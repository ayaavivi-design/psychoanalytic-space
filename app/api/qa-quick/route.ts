import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { THEORIST_VOICE, SAFETY_PROTOCOL } from '@/lib/theorist-voices';
import { searchKnowledge, formatChunksForPrompt } from '@/lib/rag';

// endpoint מהיר — תור אחד בלבד לכל תיאוריסט
// מיועד לסוכן מרוחק שקורא לו בנפרד לכל תיאוריסט
// כל קריאה ~5-10s — בטוח בתוך מגבלת 60s של Vercel Hobby

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann'];
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};

const TEST_MESSAGE = 'משהו כבד יש לי היום. לא בטוח מאיפה להתחיל.';
const QUESTION_LABEL = 'בדיקת בוקר — פתיחה קלינית';

function checkResponse(text: string): string[] {
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

    // RAG enrichment — same as /api/chat
    const chunks = await searchKnowledge(TEST_MESSAGE, theorist, 3);
    const ragContext = formatChunksForPrompt(chunks);
    const system = ragContext ? systemBase + ragContext : systemBase;

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: TEST_MESSAGE },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system,
      messages,
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const issues = checkResponse(text);
    const timeMs = Date.now() - start;

    return NextResponse.json({
      theorist,
      name: THEORIST_NAMES[theorist],
      ok: issues.length === 0,
      response: text,
      issues,
      totalIssues: issues,
      timeMs,
      ragChunks: chunks.length,
      questionLabel: QUESTION_LABEL,
      turns: [{ turn: 1, patient: TEST_MESSAGE, therapist: text, issues }],
    });
  } catch (err) {
    const timeMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      theorist,
      name: THEORIST_NAMES[theorist],
      ok: false,
      response: '',
      issues: [`שגיאה: ${message}`],
      totalIssues: [`שגיאה: ${message}`],
      timeMs,
      ragChunks: 0,
      questionLabel: QUESTION_LABEL,
      turns: [],
    });
  }
}
