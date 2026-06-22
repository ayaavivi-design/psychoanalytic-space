-- BW-112 — ארגון התייעצויות לפי מקרה מאונמז (Therapist case organization)
-- כל התייעצות שייכת ל"מקרה" פסבדונימי. נשמר אך ורק טקסט מאונמז — לעולם לא פרט מזהה ולא טקסט גולמי.
-- כתיבה דרך service role (צד-שרת); קריאה ל-owner בלבד דרך RLS.
-- כלל MEMORY (מאי 2026): כל טבלה חדשה חייבת REVOKE/GRANT מפורש — לא לסמוך על ברירת המחדל של Supabase.

-- ── מקרים ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS therapist_cases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,                         -- פסבדונים שהמטפל בוחר ("מקרה א׳"). לא שם אמיתי.
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS therapist_cases_user_idx ON therapist_cases (user_id, created_at DESC);

ALTER TABLE therapist_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own cases"
  ON therapist_cases FOR SELECT
  USING (auth.uid() = user_id);
-- אין מדיניות INSERT/UPDATE/DELETE ל-anon/authenticated — כתיבה דרך service role בלבד.

REVOKE ALL ON therapist_cases FROM anon, authenticated;
GRANT SELECT ON therapist_cases TO authenticated;

-- ── התייעצויות (מאונמזות) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_consultations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid REFERENCES therapist_cases(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,  -- denormalized ל-RLS ישיר
  mode text NOT NULL CHECK (mode IN ('consult', 'roundtable', 'research')),
  theorists text[] NOT NULL DEFAULT '{}',
  anonymized_text text NOT NULL,               -- אך ורק טקסט מאונמז. הגולמי לא נכתב לעולם.
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS case_consultations_case_idx ON case_consultations (case_id, created_at DESC);

ALTER TABLE case_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own consultations"
  ON case_consultations FOR SELECT
  USING (auth.uid() = user_id);
-- כתיבה דרך service role בלבד.

REVOKE ALL ON case_consultations FROM anon, authenticated;
GRANT SELECT ON case_consultations TO authenticated;
