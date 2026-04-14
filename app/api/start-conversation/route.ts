import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_CONVERSATIONS = 3;

export async function POST(req: NextRequest) {
  // בפיתוח — תמיד מאפשרים
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.json({ allowed: true });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // אימות הטוקן
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // אדמין — ללא הגבלה
  if (user.user_metadata?.is_admin === true) {
    return NextResponse.json({ allowed: true, admin: true });
  }

  const used = (user.user_metadata?.conversations_used ?? 0) as number;

  if (used >= MAX_CONVERSATIONS) {
    return NextResponse.json({ allowed: false, used, max: MAX_CONVERSATIONS }, { status: 403 });
  }

  // עדכון מונה ב-user_metadata
  await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, conversations_used: used + 1 }
  });

  // רישום מינימלי — user_id + created_at בלבד
  await supabase.from('user_conversations').insert({ user_id: user.id });

  return NextResponse.json({ allowed: true, used: used + 1, max: MAX_CONVERSATIONS });
}
