import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/admin/stats
// Authorization: Bearer <token>
// מחזיר נתוני אנליטיקה מלאים — נגיש רק לאדמין

const ADMIN_EMAIL = 'ayaavivi@gmail.com';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // אימות — אדמין לפי מייל (עקבי עם chat.js) או לפי is_admin במטאדאטה
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  const isAdmin = !authError && user && (
    user.email === ADMIN_EMAIL ||
    user.user_metadata?.is_admin === true
  );
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // שיחות
  const { data: conversations } = await supabase
    .from('user_conversations')
    .select('*')
    .order('created_at', { ascending: false });

  // סה"כ משתמשים רשומים
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  const convs = conversations || [];

  // Retention funnel — מקסימום מספר שיחה לכל משתמש
  const userMaxConv: Record<string, number> = {};
  const theoristCounts: Record<string, number> = {};
  let totalMessages = 0;
  let messagesWithCount = 0;
  let hadSummary = 0;
  let hadSupervision = 0;
  let pdfDownloaded = 0;
  let sentToTherapist = 0;
  let usedClinicalMode = 0;

  for (const c of convs) {
    const uid = c.user_id as string;
    const convNum = (c.conversation_number as number) || 1;
    userMaxConv[uid] = Math.max(userMaxConv[uid] || 0, convNum);

    if (c.theorist) {
      theoristCounts[c.theorist as string] = (theoristCounts[c.theorist as string] || 0) + 1;
    }
    if ((c.message_count as number) > 0) {
      totalMessages += c.message_count as number;
      messagesWithCount++;
    }
    if (c.had_summary) hadSummary++;
    if (c.had_supervision) hadSupervision++;
    if (c.pdf_downloaded) pdfDownloaded++;
    if (c.sent_to_therapist) sentToTherapist++;
    if (c.used_clinical_mode) usedClinicalMode++;
  }

  const usersWithConvs = Object.keys(userMaxConv).length;
  const retention = {
    conv1: usersWithConvs,
    conv2: Object.values(userMaxConv).filter(n => n >= 2).length,
    conv3: Object.values(userMaxConv).filter(n => n >= 3).length,
    conv4plus: Object.values(userMaxConv).filter(n => n >= 4).length,
  };

  // שיחות השבוע האחרון
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = convs.filter(c => new Date(c.created_at as string) > weekAgo).length;

  // תיאורטיקנים ממוינים
  const theoristsSorted = Object.entries(theoristCounts).sort((a, b) => b[1] - a[1]);

  // 20 שיחות אחרונות עם אימייל
  const recentConvs = convs.slice(0, 20);
  const recentUserIds = new Set(recentConvs.map(c => c.user_id as string));
  const userEmailMap: Record<string, string> = {};
  for (const u of (users || [])) {
    if (recentUserIds.has(u.id)) {
      userEmailMap[u.id] = u.email || '—';
    }
  }

  // מיפוי user_id → שיחות לצורך הטבלה
  const userConvCount: Record<string, number> = {};
  const userLastActive: Record<string, string> = {};
  for (const c of convs) {
    const uid = c.user_id as string;
    userConvCount[uid] = (userConvCount[uid] || 0) + 1;
    if (!userLastActive[uid] || new Date(c.created_at as string) > new Date(userLastActive[uid])) {
      userLastActive[uid] = c.created_at as string;
    }
  }

  // רשימת כל המשתמשים הרשומים — כולל כאלה שלא פתחו שיחה עדיין
  const allUsers = (users || []).map(u => ({
    email: u.email || '—',
    createdAt: u.created_at as string,
    convCount: userConvCount[u.id] || 0,
    lastActive: userLastActive[u.id] || null,
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    totalRegistered: users?.length || 0,
    totalConversations: convs.length,
    thisWeek,
    retention,
    features: { hadSummary, hadSupervision, pdfDownloaded, sentToTherapist, usedClinicalMode },
    theorists: theoristsSorted,
    avgMessages: messagesWithCount > 0 ? Math.round(totalMessages / messagesWithCount) : 0,
    allUsers,
  });
}
