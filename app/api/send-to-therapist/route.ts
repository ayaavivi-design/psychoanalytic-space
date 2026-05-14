import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireAuth } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return auth.errorResponse;

  const { email, subject, html } = await req.json();

  if (!email || !subject || !html) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
  }

  await resend.emails.send({
    from: 'Between <onboarding@resend.dev>',
    to: email,
    subject,
    html,
  });

  return NextResponse.json({ sent: true });
}
