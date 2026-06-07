# Adam — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- מודל עסקי: B2C — המטופל מגיע ישירות (הוחלט מאי 2026)
- תשלום: טרם הוחלט — אלכס מכינה תוכנית, ממתינים לה
- MVP בפרודקשן, חינמי כרגע
- Pre-launch: 3 מטפלים אמיתיים לפידבק לפני הרחבה ציבורית

---

## Decisions & Gotchas
- **B2C confirmed, לא B2B**: מסלול מטפלים — אפשרי בהמשך, רק אם discovery יוכיח צורך ממשי.
- **אין קיצורי דרך**: המוצר צריך לבדל עצמו ב-output ובקול, לא לחקות פיצ'רים מ-ChatGPT.
- **3 מטפלים לפני scale**: לא להרחיב בלי פידבק אמיתי מהשטח.
- **בטיחות = blocking**: QA "סימנים אובדניים" חייב להיות עדיפות ראשונה לפני כל release. אם STRATEGIC_PRIORITIES.md לא מציין אותה כ-completed — היא עדיין פתוחה.

---

## History (last 10)
1. Deploy approval: BW-51 + Winnicott rules + enforceVariedOpening + BW-46 security — אישרתי (מאי 2026)
2. Strategic session: B2C decision confirmed + pre-launch priorities
3. Team session: differentiation — ChatGPT/Claude vs Between, מה הייחוד שמצדיק תשלום
4. Jira sprint review: מצב Q2 2026
5. CEO memo 07.06: ממצא מרכזי — בטיחות לא נבדקה 55 יום. STRATEGIC_PRIORITIES עודכן. דרישה: Eitan מריץ suicide QA לפני כל push.
