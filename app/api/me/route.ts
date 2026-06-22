import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET /api/me — returns { isTherapist } by checking the authenticated user's email
// against BW_THERAPIST_ALLOWLIST (comma-separated emails, env var).
// BW-111 (POC slice): therapist access is server-gated by allowlist — NOT a public self-select.
// Fail-closed: any auth failure / missing email → isTherapist:false (patient).

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.errorResponse) return NextResponse.json({ isTherapist: false });

  const email = (auth.user?.email || '').toLowerCase().trim();
  const allow = (process.env.BW_THERAPIST_ALLOWLIST || '')
    .split(',')
    .map(e => e.toLowerCase().trim())
    .filter(Boolean);

  const isTherapist = !!email && allow.includes(email);
  return NextResponse.json({ isTherapist });
}
