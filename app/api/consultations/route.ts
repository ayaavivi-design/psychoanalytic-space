import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { anonymizeText } from '@/lib/anonymize';

// BW-112 — consultations under a case. Anonymize-at-intake (enforced). Owner-scoped.
// POST /api/consultations  body: { case_id, mode, theorists[], text }  → anonymize → store
// GET  /api/consultations?case_id=...                                  → list for a case
// The raw text is NEVER written to the DB — only the anonymized version.

const MODES = ['consult', 'roundtable', 'research', 'note'];

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
  const case_id = typeof body.case_id === 'string' ? body.case_id : '';
  const mode = typeof body.mode === 'string' ? body.mode : '';
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const theorists = Array.isArray(body.theorists) ? body.theorists.filter((t: unknown) => typeof t === 'string') : [];

  if (!case_id || !MODES.includes(mode) || !text) {
    return NextResponse.json({ error: 'Missing or invalid case_id / mode / text' }, { status: 400 });
  }

  // Verify the case belongs to this therapist (ownership gate)
  const { data: ownedCase } = await supabase
    .from('therapist_cases')
    .select('id')
    .eq('id', case_id)
    .eq('user_id', user.id)
    .single();
  if (!ownedCase) return NextResponse.json({ error: 'case_not_found' }, { status: 404 });

  // Anonymize-at-intake — mandatory. If it fails, reject; never store raw text.
  let anonymized: string;
  try {
    anonymized = await anonymizeText(text);
  } catch {
    return NextResponse.json({ error: 'anonymize_failed' }, { status: 502 });
  }

  const { data, error } = await supabase
    .from('case_consultations')
    .insert({ case_id, user_id: user.id, mode, theorists, anonymized_text: anonymized })
    .select('id, case_id, mode, theorists, anonymized_text, created_at')
    .single();

  if (error) return NextResponse.json({ error: 'insert_failed' }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH /api/consultations  body: { id, text }  → edit an entry (re-anonymize). Owner-scoped.
export async function PATCH(req: NextRequest) {
  const { user, supabase } = await authUser(req);
  if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : '';
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!id || !text) return NextResponse.json({ error: 'Missing id or text' }, { status: 400 });

  const { data: owned } = await supabase
    .from('case_consultations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!owned) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  let anonymized: string;
  try {
    anonymized = await anonymizeText(text);
  } catch {
    return NextResponse.json({ error: 'anonymize_failed' }, { status: 502 });
  }

  const { error } = await supabase
    .from('case_consultations')
    .update({ anonymized_text: anonymized })
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/consultations?id=xxx  → permanently delete one consultation record
export async function DELETE(req: NextRequest) {
  const { user, supabase } = await authUser(req);
  if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id') || '';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase
    .from('case_consultations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { user, supabase } = await authUser(req);
  if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const case_id = req.nextUrl.searchParams.get('case_id');
  if (!case_id) return NextResponse.json({ error: 'Missing case_id' }, { status: 400 });

  const { data, error } = await supabase
    .from('case_consultations')
    .select('id, case_id, mode, theorists, anonymized_text, created_at')
    .eq('case_id', case_id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'list_failed' }, { status: 500 });
  return NextResponse.json({ consultations: data ?? [] });
}
