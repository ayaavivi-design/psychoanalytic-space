import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// שער נסיון · 06.09.2026 · שמואל יצא, איה עוברת ממוצר-בתיווך-מטפלים למוצר עצמאי.
//
// המודל: שבוע חינם מהשימוש הראשון בפועל, לא מההרשמה. בלי Stripe בשלב הזה —
// אם המשתמשת ממשיכה לרצות אחרי השבוע, היא כותבת מייל, ואיה מפעילה ידנית
// (status='active') דרך שורת SQL אחת. ראה docs/PROPOSAL-TRIAL-GATE-2026-09.md
// אם וכשעוברים ל-Stripe בפועל: אז ה-webhook כותב trialing/active/past_due/
// canceled, לא הפונקציה הזו.
//
// חמש המשתמשות שהיו קיימות ב-05.09.2026 (לפני שהשער הזה נכתב) קיבלו שורת
// status='active' ידנית וקבועה — הן לעולם לא עוברות דרך "שימוש ראשון" כאן,
// ולכן אף שינוי בפונקציה הזו לא יכול לגעת בהן.

const TRIAL_DAYS = 7;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type TrialGate =
  | { allowed: true }
  | { allowed: false; trialEndsAt: string | null };

// נקרא בתחילת כל endpoint שמייצר עלות אמיתית (קריאת AI): /api/chat,
// /api/analyze-note, /api/consultations (POST ו-PATCH — שניהם קוראים
// ל-anonymizeText, לא רק POST).
//
// שימוש ראשון של user_id שאין לו שורה בכלל → נוצרת שורה, שבעה ימים מעכשיו,
// והבקשה הנוכחית עוברת. זו הפעם היחידה שבה חוסר-שורה פירושו "התחל שעון",
// ולכן כל מי שכבר קיבלה שורת active לפני שהשער עלה אף פעם לא מגיעה לכאן
// בלי שורה — הענף הזה שייך רק למי שמתחילה עכשיו.
export async function checkAndStartTrial(userId: string): Promise<TrialGate> {
  const supabase = adminClient();

  const { data: existing, error: selErr } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('user_id', userId)
    .maybeSingle();

  // כשל תשתית בקריאה עצמה — לא חוסמים על באג שלנו, לא על המשתמשת
  if (selErr) {
    console.warn('[trial] select failed, allowing:', selErr.message);
    return { allowed: true };
  }

  if (!existing) {
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error: insErr } = await supabase
      .from('subscriptions')
      .insert({ user_id: userId, status: 'trialing', trial_ends_at: trialEndsAt });
    // מרוץ אפשרי: שתי בקשות ראשונות במקביל. insert שני נכשל על ה-PK,
    // וזה בסדר — השורה הראשונה כבר קיימת ונותנת את אותה תוצאה.
    if (insErr) console.warn('[trial] insert race or failure, allowing:', insErr.message);
    return { allowed: true };
  }

  if (existing.status === 'active') return { allowed: true };

  if (existing.status === 'trialing' && existing.trial_ends_at && new Date(existing.trial_ends_at) > new Date()) {
    return { allowed: true };
  }

  return { allowed: false, trialEndsAt: existing.trial_ends_at };
}
