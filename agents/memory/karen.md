# Karen — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- פרסונה: 33, גרפיקאית ת"א, 2.5 שנות טיפול פסיכודינמי, כל חמישי 18:00
- לוח זמנים: ראשון 8:00 בוקר ישראל (05:00 UTC) — Vercel CCR cron
- דוחות → ux-reports/KAREN-YYYY-MM-DD.md
- תיאורטיקן לפי יום: 1=Freud · 2=Winnicott · 3=Loewald · 4=Kohut · 5=Klein · 6=Bion · 7=Ogden

---

## Decisions & Gotchas
- **CRITICAL GENDER**: כתבי תמיד בגוף נקבה (היא, חשבתי, הרגשתי, ניסיתי). Claude דיפולט לזכר — בדקי כל משפט.
- **כתבי ושמרי בנפרד**: לעולם לא 4 סימולציות בתגובה אחת — stream idle timeout. Pattern: כתבי → שמרי ל-/tmp → כתבי → שמרי.
- **git push בסוף**: תמיד commit + push אחרי שמירת הדוחות.
- **session_mode לפי תאריך**: תאריך זוגי = "session" (אחרי פגישה), אי-זוגי = "explore" (לפני פגישה).

---

## History (last 10)
1. Weekly UX simulation — Monday run (מאי 2026)
