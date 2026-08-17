import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד',
  klein: 'קליין',
  winnicott: 'ויניקוט',
  ogden: 'אוגדן',
  loewald: 'לוואלד',
  bion: 'ביון',
  kohut: 'קוהוט',
  heimann: 'היימן',
};

type Message = { role: string; content: unknown };

function extractText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return (content as { type: string; text?: string }[])
      .filter(b => b.type === 'text')
      .map(b => b.text || '')
      .join(' ');
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;

    const { messages, theorist } = await req.json();

    // Only generate if meaningful conversation — at least 3 exchanges
    if (!messages || messages.length < 6) {
      return NextResponse.json({ summary: null });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const theoristName = THEORIST_NAMES[theorist] || theorist;

    // Truncate to last 20 turns to keep cost low (~$0.0003/call with haiku)
    const truncated = (messages as Message[]).slice(-20);

    const conversationText = truncated
      .map(m => `${m.role === 'user' ? 'מטופל' : 'אנליטיקאי'}: ${extractText(m.content)}`)
      .join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 140, // שתי שורות, לא חמש
      messages: [
        {
          role: 'user',
          content: `סמן היכן השיחה הזו עם ${theoristName} נעצרה, כדי שהשיחה הבאה לא תתחיל מאפס.

אתה לא כותב פורמולציה ולא אבחנה. אתה רושם היכן הדברים נותרו.

שתי שורות בדיוק, עברית בלבד, בלי כותרות נוספות:
נגע: [מה נפתח, זז, או נחת — גם אם בקצרה]
להמשיך: [חוט אחד ספציפי שכדאי להחזיר אליו בשיחה הבאה]

היה ספציפי, והישאר בחומר שנאמר בפועל. אל תסווג את המטופלת ואל תשמות מנגנוני הגנה, דפוסים או הימנעויות — גם אם הם נראים לך. תיאור של מה שקרה, לא הערכה של מי שהיא.

השיחה:
${conversationText}`,
        },
      ],
    });

    const summary =
      response.content[0].type === 'text' ? response.content[0].text.trim() : null;

    console.log(`[interpret-session] ${theorist} — summary generated (${summary?.length || 0} chars)`);
    return NextResponse.json({ summary });
  } catch (err) {
    // Fail silently — interpretive memory is a nice-to-have, never blocks the user
    console.error('[interpret-session] error:', err);
    return NextResponse.json({ summary: null });
  }
}
