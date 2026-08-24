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

    const raw =
      response.content[0].type === 'text' ? response.content[0].text.trim() : null;

    // Deterministic gate on the way out (Lia, 24.08). The prompt above already asks for
    // description rather than classification, and asking is not enough: this summary is the
    // one piece of text that comes BACK to shape how the voice speaks to her, so a single
    // diagnostic noun in it teaches the voice a vocabulary she never used. Her example: a
    // summary reading "הגנה: הימנעות" makes the next opening speak avoidance at someone who
    // never said the word.
    // The distinction being enforced is not length or field count — the reduction from five
    // fields to two on 16.08 addressed neither — it is naming a mechanism versus describing
    // what happened. "נסוגה כשדיברנו על אמה" passes. "הימנעות" does not.
    // A blocked summary is simply not returned: nothing is stored, and the next conversation
    // starts without it. That is the safe failure.
    const DIAGNOSTIC_TERMS = [
      'הימנעות', 'נמנעת', 'הגנה', 'הגנות', 'התנגדות', 'מתנגדת',
      'הזדהות השלכתית', 'השלכה', 'הכחשה', 'פיצול', 'הדחקה',
      'עצמי כוזב', 'false self', 'העברה נגדית', 'התנגדותה',
      'מנגנון', 'דפוס הגנתי', 'אמביוולנטיות', 'רגרסיה',
    ];
    const hit = raw ? DIAGNOSTIC_TERMS.find(t => raw.includes(t)) : undefined;
    if (hit) {
      console.warn(`[interpret-session] ${theorist} — summary rejected, diagnostic term "${hit}"`);
      return NextResponse.json({ summary: null, rejected: 'diagnostic-term' });
    }

    const summary = raw;
    console.log(`[interpret-session] ${theorist} — summary generated (${summary?.length || 0} chars)`);
    return NextResponse.json({ summary });
  } catch (err) {
    // Fail silently — interpretive memory is a nice-to-have, never blocks the user
    console.error('[interpret-session] error:', err);
    return NextResponse.json({ summary: null });
  }
}
