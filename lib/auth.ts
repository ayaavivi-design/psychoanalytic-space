import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// requireAuth — בדיקת JWT אחידה לכל ה-API routes
// שימוש:
//   const auth = await requireAuth(req);
//   if (auth.errorResponse) return auth.errorResponse;
//   const { user } = auth;
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
}

type AuthOk = { user: AuthUser; errorResponse: null };
type AuthFail = { user: null; errorResponse: NextResponse };
export type AuthResult = AuthOk | AuthFail;

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
    };
  }

  return { user: user as AuthUser, errorResponse: null };
}
