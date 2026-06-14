# Adam — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- מודל עסקי: B2C — המטופל מגיע ישירות (הוחלט מאי 2026)
- תשלום: תוכנית אלכס מוכנה (₪49/חודש, ₪39 שנתי) — לא יושמה. 3 שלבים מוגדרים ב-cost-reports/PRICING-2026-05-04.md. ממתין לאחרי בטיחות.
- MVP בפרודקשן, חינמי כרגע
- Pre-launch: 3 מטפלים אמיתיים לפידבק לפני הרחבה ציבורית — לא התחיל
- ניוזלטר: 13 גיליונות, תוכן חזק — אין עדות להפצה פעילה או subscriber base

---

## Decisions & Gotchas
- **B2C confirmed, לא B2B**: מסלול מטפלים — אפשרי בהמשך, רק אם discovery יוכיח צורך ממשי.
- **אין קיצורי דרך**: המוצר צריך לבדל עצמו ב-output ובקול, לא לחקות פיצ'רים מ-ChatGPT.
- **3 מטפלים לפני scale**: לא להרחיב בלי פידבק אמיתי מהשטח.
- **בטיחות = blocking**: QA "סימנים אובדניים" חייב להיות עדיפות ראשונה לפני כל release. אם STRATEGIC_PRIORITIES.md לא מציין אותה כ-completed — היא עדיין פתוחה.
- **ממו CEO = לא מחייב בפועל**: ממו 07.06 אמר "עוצרים הכל" — צוות המשיך. Priority #1 לא תועד. הממו הוא אינפורמטיבי, לא אופרטיבי. עד שתהיה מנגנון אכיפה — לכפות תיעוד בכתב לפני כל push.
- **Q-3 = כתם עיוור של הוולידציה**: הוולידציה בודקת תגובה, Q-3 הוא כשל session. פרויד Q-3: 3 אירועים ב-40 יום (05.05, 18.05, 13.06). קליין Q-3: יוני 1. שניהם visible. הפתרון — STATEMENT REQUIREMENT בפרומפט, לא וולידציה.
- **נוהל propagation**: כל תיקון שמוסף לתיאורטיקן אחד — לבדוק אם רלוונטי לשאר לפני סגירה. Q-3 עבר מקליין לפרויד כי STATEMENT REQUIREMENT לא הועתק.

---

## History (last 10)
1. Deploy approval: BW-51 + Winnicott rules + enforceVariedOpening + BW-46 security — אישרתי (מאי 2026)
2. Strategic session: B2C decision confirmed + pre-launch priorities
3. Team session: differentiation — ChatGPT/Claude vs Between, מה הייחוד שמצדיק תשלום
4. Jira sprint review: מצב Q2 2026
5. CEO memo 07.06: ממצא מרכזי — בטיחות לא נבדקה 55 יום. STRATEGIC_PRIORITIES עודכן. דרישה: Eitan מריץ suicide QA לפני כל push.
6. CEO memo 14.06: ממצא מרכזי — פרויד Q-3 visible failure (13.06), ממו 07.06 לא הופעל. STATEMENT REQUIREMENT לפרויד + תיעוד בטיחות חובה לפני הפוש הבא. נוהל propagation הוכנס ל-STRATEGIC_PRIORITIES.
