-- מנוי בתשלום: $5/חודש, 7 ימי נסיון דרך Stripe, חסימה מלאה אחרי תשלום שנכשל.
-- 05.09.2026, שמואל יצא מהפרויקט ואיה מחליטה לארוז ולבדוק שימוש עצמאי.
--
-- הכלל של אלכס (agents/_frozen/2026-08-29-all/dev-prompt.md), מותאם: 7 ימים
-- ולא 14, ואין מכסת-שיחות-חינמית — יש רק trial ואחריו paid, ובלעדיו חסימה.
--
-- הטבלה נכתבת רק דרך service role (ה-webhook), בדיוק כמו user_conversations.
-- שדה userid יחיד לכל שורה: מנוי אחד למשתמש, לא היסטוריה של מנויים.
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  stripe_customer_id      text,
  stripe_subscription_id  text UNIQUE,
  -- none: לא נכנס לתהליך תשלום בכלל. trialing/active: יש גישה. past_due/canceled: חסום.
  status                  text NOT NULL DEFAULT 'none'
                            CHECK (status IN ('none', 'trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at           timestamptz,
  current_period_end      timestamptz,
  created_at              timestamptz DEFAULT now() NOT NULL,
  updated_at              timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- משתמשת יכולה לקרוא רק את השורה שלה, כדי שהמסך יציג מונה ימים וסטטוס
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- אין מדיניות INSERT/UPDATE ל-anon/authenticated בכוונה.
-- כתיבה יחידה: ה-webhook, עם service role key, אחרי אימות חתימת Stripe.
-- לקוחה שקוראת לעצמה 'active' דרך קריאת API ישירה לא יכולה — אין לה נתיב כתיבה בכלל.

-- אינדקס לחיפוש הפוך: webhook מקבל stripe_subscription_id ומחפש את המשתמשת
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx
  ON subscriptions (stripe_subscription_id);
