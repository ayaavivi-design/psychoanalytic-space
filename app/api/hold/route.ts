import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Crisis detection — copied from app/api/chat/route.ts
// ─────────────────────────────────────────────────────────────────────────────

const CRISIS_KEYWORDS_HE = [
  'אובדנות', 'אובדני', 'אובדנית',
  'להתאבד', 'התאבדות', 'התאבדתי', 'אתאבד',
  'לפגוע בעצמי', 'פוגע בעצמי', 'פוגעת בעצמי', 'פגעתי בעצמי',
  'פגיעה עצמית', 'חותך את עצמי', 'חותכת את עצמי',
  'לא רוצה לחיות', 'לא רוצה לחיות יותר', 'לא רוצה להמשיך לחיות',
  'לסיים את החיים', 'לסיים את חיי', 'לסיים הכל',
  'לשים לזה סוף', 'לשים קץ', 'לשים קץ לחיים',
  'לגמור עם זה', 'לגמור עם הכל',
  'חשבתי לסיים', 'רוצה למות', 'רוצה להיעלם',
  'אין לי סיבה לחיות', 'אין טעם להמשיך',
  'לא יכול יותר', 'לא יכולה יותר', 'כבר לא יכול', 'כבר לא יכולה',
  'לא רוצה להתעורר', 'אם לא הייתי פה',
  'רוצה שהכל ייגמר',
  'לא שווה לחיות', 'החיים לא שווים',
  'נמאס לי לחיות',
  'הייתי רוצה לא להתעורר',
  'בא לי למות', 'באה לי למות', 'בא לה למות', 'בא לו למות',
  'לא רואה טעם להמשיך', 'אין לי טעם להמשיך',
  'יהיה יותר קל בלעדיי', 'הייתי עושה לכולם טובה אם לא',
  'אם לא הייתי כאן', 'עייף מלחיות', 'עייפה מלחיות',
];

const CRISIS_KEYWORDS_EN = [
  'suicid', 'kill myself', 'end my life', 'end it all',
  'self-harm', 'self harm', 'cutting myself', 'hurt myself',
  "don't want to live", 'want to die', 'want to disappear',
  'no reason to live', 'no point in living',
  "can't go on", "can't take it anymore",
];

function detectCrisis(text: string): boolean {
  const normalized = text.toLowerCase();
  for (const kw of CRISIS_KEYWORDS_HE) {
    if (normalized.includes(kw)) return true;
  }
  for (const kw of CRISIS_KEYWORDS_EN) {
    if (normalized.includes(kw)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/hold
// שומר תוכן ל-hold_entries. אין AI call. מחזיר { saved: true }.
// אם תוכן מצוקה — מחזיר גם { crisis: true }.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;
  const { user } = auth;

  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!content) {
    return NextResponse.json({ error: 'content required' }, { status: 400 });
  }

  const isCrisis = detectCrisis(content);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from('hold_entries')
    .insert({ user_id: user.id, content });

  if (error) {
    console.error('[hold] supabase insert error:', error.message);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }

  return NextResponse.json({ saved: true, ...(isCrisis && { crisis: true }) });
}
