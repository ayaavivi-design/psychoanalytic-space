import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_EVENTS = ['had_summary', 'had_supervision', 'pdf_downloaded', 'sent_to_therapist'] as const;
type EventName = typeof VALID_EVENTS[number];

// POST /api/track-event
// body: { conversation_id, event, message_count?, used_clinical_mode? }
// עדכון שורת user_conversations עם אירוע שהתרחש

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await req.json();
  const { conversation_id, event, message_count, used_clinical_mode } = body;

  if (!conversation_id || !event) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (!VALID_EVENTS.includes(event as EventName)) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  const update: Record<string, unknown> = { [event]: true };
  if (typeof message_count === 'number' && message_count > 0) {
    update.message_count = message_count;
  }
  if (typeof used_clinical_mode === 'boolean') {
    update.used_clinical_mode = used_clinical_mode;
  }

  await supabase
    .from('user_conversations')
    .update(update)
    .eq('id', conversation_id)
    .eq('user_id', user.id); // אבטחה: רק שורות של המשתמש עצמו

  return NextResponse.json({ ok: true });
}
