-- ════════════════════════════════════════
-- הרצה חד-פעמית ב-Supabase SQL Editor
-- ════════════════════════════════════════

-- 1. יצירת טבלת רישום שיחות
CREATE TABLE IF NOT EXISTS user_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rows"
  ON user_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- 2. הגדרת אדמין — ללא הגבלת שיחות
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'
WHERE email = 'ayaavivi@gmail.com';

-- ════════════════════════════════════════
-- טמפלייטים לשימוש עתידי (לא להריץ עכשיו)
-- ════════════════════════════════════════

-- איפוס משתמש ל-0 שיחות:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"conversations_used": 0}'
-- WHERE email = 'EMAIL_HERE';

-- הוספת 3 שיחות נוספות:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data ||
--   jsonb_build_object('conversations_used',
--     COALESCE((raw_user_meta_data->>'conversations_used')::int, 0) + 3)
-- WHERE email = 'EMAIL_HERE';

-- הגדרת אדמין נוסף:
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"is_admin": true}'
-- WHERE email = 'EMAIL_HERE';

-- סקירת כל המשתמשים:
-- SELECT email,
--        COALESCE(raw_user_meta_data->>'conversations_used', '0') AS used,
--        raw_user_meta_data->>'is_admin' AS is_admin,
--        last_sign_in_at
-- FROM auth.users
-- ORDER BY last_sign_in_at DESC;
