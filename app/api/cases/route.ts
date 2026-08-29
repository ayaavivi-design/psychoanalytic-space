import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// BW-112 — therapist cases (pseudonymous). Owner-scoped. Service-role writes.
// POST /api/cases  body: { label }            → create a case
// GET  /api/cases                              → list the therapist's cases

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function authUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return { user: null as null, supabase: null as null };
  const supabase = adminClient();
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !user) return { user: null as null, supabase: null as null };
  return { user, supabase };
}

export async function POST(req: NextRequest) {
  const { user, supabase } = await authUser(req);
  if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label) return NextResponse.json({ error: 'Missing label' }, { status: 400 });

  const { data, error } = await supabase
    .from('therapist_cases')
    .insert({ user_id: user.id, label })
    .select('id, label, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  return NextResponse.json(data);
}

export async function GET(req: NextRequest) {
  const { user, supabase } = await authUser(req);
  if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const archived = req.nextUrl.searchParams.get('archived') === '1';
  let q = supabase
    .from('therapist_cases')
    .select('id, label, created_at, archived_at')
    .eq('user_id', user.id);
  q = archived ? q.not('archived_at', 'is', null) : q.is('archived_at', null);
  const { data, error } = await q.order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'list_failed' }, { status: 500 });
  const rows = data ?? [];

  // מה יש בתוך כל מקרה · בלי זה כרטיס המקרה אומר רק שם ותאריך, ואין ממנו
  // דרך לדעת אם יש למה לחזור. שאילתה אחת לכל ההתייעצויות של המטפלת,
  // וצבירה בזיכרון — ולא שאילתה לכל מקרה. אין כאן טקסט קליני: רק ספירה,
  // מתי לאחרונה, ודרך איזו גישה.
  const ids = rows.map(r => r.id);
  if (ids.length) {
    const { data: cons } = await supabase
      .from('case_consultations')
      .select('case_id, theorists, created_at')
      .eq('user_id', user.id)
      .in('case_id', ids)
      .order('created_at', { ascending: false });
    const agg = new Map<string, { count: number; last_at: string; last_theorist: string | null }>();
    for (const c of cons ?? []) {
      const prev = agg.get(c.case_id);
      if (prev) prev.count += 1;
      // הרשימה ממוינת מהחדש לישן, ולכן הראשון שנראה לכל מקרה הוא האחרון בזמן
      else agg.set(c.case_id, { count: 1, last_at: c.created_at, last_theorist: c.theorists?.[0] ?? null });
    }
    return NextResponse.json({
      cases: rows.map(r => ({ ...r, ...(agg.get(r.id) ?? { count: 0, last_at: null, last_theorist: null }) })),
    });
  }
  return NextResponse.json({ cases: rows });
}

// DELETE /api/cases?id=xxx  → permanently delete a case and its consultations
export async function DELETE(req: NextRequest) {
  const { user, supabase } = await authUser(req);
  if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Delete related consultations first (FK constraint)
  await supabase.from('case_consultations').delete().eq('case_id', id).eq('user_id', user.id);

  // Delete the case itself
  const { error } = await supabase
    .from('therapist_cases')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH /api/cases  body: { id, archived?: boolean, label?: string }  → archive/restore or rename a case
export async function PATCH(req: NextRequest) {
  const { user, supabase } = await authUser(req);
  if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const updatePayload: Record<string, unknown> = {};
  if (typeof body.archived === 'boolean') {
    updatePayload.archived_at = body.archived === true ? new Date().toISOString() : null;
  }
  if (typeof body.label === 'string' && body.label.trim()) {
    updatePayload.label = body.label.trim();
  }
  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('therapist_cases')
    .update(updatePayload)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
