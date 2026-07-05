# Adam — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- מודל עסקי: B2C — המטופל מגיע ישירות (הוחלט מאי 2026)
- תשלום: תוכנית אלכס מוכנה (₪49/חודש, ₪39 שנתי) — לא יושמה. ממתין לאחרי בטיחות.
- MVP בפרודקשן, חינמי כרגע
- Pre-launch: 3 מטפלים אמיתיים לפידבק לפני הרחבה ציבורית — לא התחיל
- ניוזלטר: 34 גיליונות (יולי 2026). #33 (פרויד) ו-#34 (AI ורעש) = פוזיציונינג חד ומדויק. אין עדות להפצה פעילה — וזה נכון כרגע.
- **עיוורון מערכתי 18 יום (ממצא מרכזי 05.07):** `vercel.json` `"crons": []` — ריק מאז 17.06. 18 ימים ללא QA וללא Judge. ליה הסלימה ל-Tier 1 מוחלט (01.07). Safety: 76+ ימים — Tier 2.
- **ממצא חדש 05.07:** ב-03.07 נדחף קומיט ל-`lib/theorist-voices.ts` (Winnicott hardening). Klein VOICE IDENTITY ו-Freud item 12 נמצאים באותו קובץ ולא נוספו. זה gap synchronization, לא gap ידע.

---

## Decisions & Gotchas
- **B2C confirmed, לא B2B**: מסלול מטפלים — אפשרי בהמשך, רק אם discovery יוכיח צורך ממשי.
- **אין קיצורי דרך**: המוצר צריך לבדל עצמו ב-output ובקול, לא לחקות פיצ'רים מ-ChatGPT.
- **3 מטפלים לפני scale**: לא להרחיב בלי פידבק אמיתי מהשטח.
- **בטיחות = blocking**: QA "סימנים אובדניים" חייב להיות עדיפות ראשונה לפני כל release. אם STRATEGIC_PRIORITIES.md לא מציין אותה כ-completed — היא עדיין פתוחה.
- **ממו CEO = לא מחייב בפועל**: ממו 07.06 אמר "עוצרים הכל" — צוות המשיך. Priority #1 לא תועד. הממו הוא אינפורמטיבי, לא אופרטיבי. עד שתהיה מנגנון אכיפה — לכפות תיעוד בכתב לפני כל push.
- **Q-3 = כתם עיוור של הוולידציה**: הוולידציה בודקת תגובה, Q-3 הוא כשל session. פרויד Q-3: 3 אירועים ב-40 יום (05.05, 18.05, 13.06). קליין Q-3: יוני 1. שניהם visible. הפתרון — STATEMENT REQUIREMENT בפרומפט, לא וולידציה.
- **נוהל propagation**: כל תיקון שמוסף לתיאורטיקן אחד — לבדוק אם רלוונטי לשאר לפני סגירה. Q-3 עבר מקליין לפרויד כי STATEMENT REQUIREMENT לא הועתק.
- **צינור ליה→אוליבר לא עובד**: ליה כותבת המלצות ב-judge-analysis/ — אין מנגנון שמפעיל את אוליבר לייישם. אוליבר לא רץ לבד. מי שאמור לקרוא ולהפעיל — לא ברור. Klein VOICE IDENTITY המלצה פעילה 32 יום (05.07). Freud STATEMENT REQUIREMENT המלצה פעילה 26 יום.
- **Judge cron ריק**: `vercel.json` `"crons": []` — ה-judge לא רץ אוטומטית. תיקון: שורה אחת. ליה מנתחת ידנית — לא בר-קיימא.
- **מודל פרש (16.06 P0)**: `claude-sonnet-4-20250514` פרש → judge נפל 8/8. תוקן אותו יום. אבל החשיפה: אין monitoring על תוקף מזהה המודל. לא רלוונטי כרגע — לזכור בתחלופה הבאה.
- **ממו 28.06 ביקש שיחה ישירה עם אוליבר לפני 30.06** — לא ידוע אם קרה. ב-03.07 קומיט ל-theorist-voices.ts הוכח — מי שדחף עבד בקובץ ולא הוסיף Klein/Freud.

---

## History (last 10)
1. Deploy approval: BW-51 + Winnicott rules + enforceVariedOpening + BW-46 security — אישרתי (מאי 2026)
2. Strategic session: B2C decision confirmed + pre-launch priorities
3. Team session: differentiation — ChatGPT/Claude vs Between, מה הייחוד שמצדיק תשלום
4. Jira sprint review: מצב Q2 2026
5. CEO memo 07.06: ממצא מרכזי — בטיחות לא נבדקה 55 יום. STRATEGIC_PRIORITIES עודכן. דרישה: Eitan מריץ suicide QA לפני כל push.
6. CEO memo 14.06: ממצא מרכזי — פרויד Q-3 visible failure (13.06), ממו 07.06 לא הופעל. STATEMENT REQUIREMENT לפרויד + תיעוד בטיחות חובה לפני הפוש הבא. נוהל propagation הוכנס ל-STRATEGIC_PRIORITIES.
7. CEO memo 21.06: ממצא מרכזי — צינור המשוב שבור. Klein VOICE IDENTITY + Freud STATEMENT REQUIREMENT + judge cron = 3 תיקונים מנוסחים שלא שוחררו. STRATEGIC_PRIORITIES עודכן.
8. CEO memo 28.06: ממצא מרכזי — אוליבר single point of failure. BW-111 (therapist UI) נדחף בזמן שה-cron ריק 12 ימים. ממו ביקש מאיה שיחה ישירה עם אוליבר לפני 30.06.
9. CEO memo 05.07: ממצא מרכזי — קומיט 03.07 ל-theorist-voices.ts (Winnicott). Klein/Freud blocks באותו קובץ, לא נוספו. Gap synchronization, לא gap ידע. 18 ימי עיוורון, safety Tier 2.
