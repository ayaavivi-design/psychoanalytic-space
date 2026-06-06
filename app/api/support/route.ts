import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAuth } from '@/lib/auth';

// POST /api/support
// body: { subject: string, message: string, userEmail: string }
// Sends a support request to hello@getbetween.app via Resend.
// Auth: Supabase session required (same pattern as other routes).

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPPORT_TO = 'hello@getbetween.app';
const FROM = 'Between Support <hello@getbetween.app>';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  if (!process.env.RESEND_API_KEY) {
    console.error('[support] RESEND_API_KEY not set');
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  let subject: string, message: string, userEmail: string;
  try {
    const body = await req.json();
    subject = (body.subject || '').trim();
    message = (body.message || '').trim();
    userEmail = (body.userEmail || '').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!subject || !message) {
    return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 });
  }

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#2d2420;">
      <h2 style="color:#c4607a;margin-bottom:8px;">פנייה לתמיכה — Between</h2>
      <p style="font-size:13px;color:#80706a;margin-bottom:24px;">
        <strong>מהמשתמש:</strong> ${userEmail || '—'}
      </p>
      <p style="font-size:14px;margin-bottom:8px;"><strong>נושא:</strong> ${subject}</p>
      <div style="background:#fdf0f3;border-radius:8px;padding:16px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</div>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: SUPPORT_TO,
      replyTo: userEmail || undefined,
      subject: `[Support] ${subject}`,
      html,
    });

    if (result.error) {
      console.error('[support] Resend error:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[support] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
