-- טבלת רישום שיחות — user_id + created_at בלבד, ללא תוכן
CREATE TABLE IF NOT EXISTS user_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_conversations ENABLE ROW LEVEL SECURITY;

-- משתמש יכול לקרוא רק את השורות שלו
CREATE POLICY "Users can view own rows"
  ON user_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- הכנסה רק דרך service role (הצד-שרת)
-- אין מדיניות INSERT ל-anon/authenticated — השרת משתמש ב-service role key
