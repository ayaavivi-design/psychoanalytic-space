import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Daily summary email endpoint — called by CCR routine (trig_01JdRKZ6PYo45zidg8pRpJDz)
// CCR cannot use RESEND_API_KEY directly; this endpoint bridges the gap.
//
// Auth: x-internal-token header must match INTERNAL_API_TOKEN env var
// Body: { subject: string, html: string }
//
// Env vars required:
//   RESEND_API_KEY      — already set in Vercel
//   INTERNAL_API_TOKEN  — new secret, set in Vercel + CCR routine env

const resend = new Resend(process.env.RESEND_API_KEY);
const TO = 'ayaavivi@gmail.com';

// NOTE: 'from' must be a verified Resend domain.
// Using onboarding@resend.dev (Resend test domain) until a custom domain is verified.
// To switch: verify updates.getbetween.app in Resend dashboard → change FROM below.
const FROM = 'Between Daily <onboarding@resend.dev>';

export async function POST(req: NextRequest) {
  // 1. Auth
  const token = req.headers.get('x-internal-token');
  if (!token || token !== process.env.INTERNAL_API_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate env
  if (!process.env.RESEND_API_KEY) {
    console.error('[daily-summary] RESEND_API_KEY not set');
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  // 3. Parse body
  let subject: string, html: string;
  try {
    const body = await req.json();
    subject = body.subject;
    html = body.html;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!subject || !html) {
    return NextResponse.json({ error: 'Missing subject or html' }, { status: 400 });
  }

  // 4. Send via Resend
  try {
    const result = await resend.emails.send({ from: FROM, to: TO, subject, html });
    if (result.error) {
      console.error('[daily-summary] Resend error:', result.error);
      return NextResponse.json({ error: result.error.message }, { status: 502 });
    }
    return NextResponse.json({ ok: true, id: result.data?.id });
  } catch (err) {
    console.error('[daily-summary] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
