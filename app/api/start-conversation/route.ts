import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_CONVERSATIONS = 3;
const ADMIN_EMAIL = 'ayaavivi@gmail.com';

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

  if (!isDev && !isAdmin && used >= MAX_CONVERSATIONS) {
    return NextResponse.json({ allowed: false, used, max: MAX_CONVERSATIONS }, { status: 403 });
  }

  // עדכון מונה ב-user_metadata (לא לאדמין)
  if (!isAdmin) {
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
      conversation_number: isAdmin ? null : used + 1,
    })
    .select('id')
    .single();

  return NextResponse.json({
    allowed: true,
    admin: isAdmin || undefined,
    used: isAdmin ? undefined : used + 1,
    max: isAdmin ? undefined : MAX_CONVERSATIONS,
    conversation_id: conv?.id ?? null,
  });
}
