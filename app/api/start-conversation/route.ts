import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_CONVERSATIONS = 3;
const ADMIN_EMAIL = 'ayaavivi@gmail.com';

// הכרעת איה 29.08.2026: רושמים בלי לחסום.
// שער שלב 0 (OPEN_DECISIONS) צריך נתוני חזרה, ובלי רישום אין לו כלום.
// אבל תיקון הרישום לבדו היה מדליק גם את גדר שלוש השיחות על משתמשות
// אמיתיות, כי המונה בשרת היה מתחיל לעלות. לכן השתיים הופרדו:
// הרישום פועל תמיד, והחסימה מותנית בדגל שכבוי כברירת מחדל.
// כדי להדליק אותה שוב: BW_ENFORCE_CONV_LIMIT=1 במשתני הסביבה.
// כשהחסימה כבויה גם המונה אינו עולה, כי מונה שאינו חוסם אינו אומר כלום.
const ENFORCE_LIMIT = process.env.BW_ENFORCE_CONV_LIMIT === '1';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const body = await req.json().catch(() => ({}));
  const theorist = (body.theorist as string) || null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // אימות הטוקן
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // בפיתוח — תמיד מאפשרים (אחרי אימות, כדי לשמור נתונים)
  const isDev = process.env.NODE_ENV !== 'production';

  // אדמין — ללא הגבלה (לפי מייל או is_admin במטאדאטה, עקבי עם chat.js)
  const isAdmin = user.email === ADMIN_EMAIL || user.user_metadata?.is_admin === true;

  const used = (user.user_metadata?.conversations_used ?? 0) as number;

  if (ENFORCE_LIMIT && !isDev && !isAdmin && used >= MAX_CONVERSATIONS) {
    return NextResponse.json({ allowed: false, used, max: MAX_CONVERSATIONS }, { status: 403 });
  }

  // עדכון מונה ב-user_metadata (לא לאדמין, ורק כשהחסימה פעילה)
  if (ENFORCE_LIMIT && !isAdmin) {
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, conversations_used: used + 1 }
    });
  }

  // רישום שיחה עם theorist ומספר שיחה
  const { data: conv } = await supabase
    .from('user_conversations')
    .insert({
      user_id: user.id,
      theorist,
      conversation_number: (ENFORCE_LIMIT && !isAdmin) ? used + 1 : null,
    })
    .select('id')
    .single();

  return NextResponse.json({
    allowed: true,
    enforcing: ENFORCE_LIMIT || undefined,
    admin: isAdmin || undefined,
    used: (ENFORCE_LIMIT && !isAdmin) ? used + 1 : undefined,
    max: (ENFORCE_LIMIT && !isAdmin) ? MAX_CONVERSATIONS : undefined,
    conversation_id: conv?.id ?? null,
  });
}
