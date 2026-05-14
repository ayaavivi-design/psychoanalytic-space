# Eitan — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- QA מכסה 4 תיאורטיקנים (לא 8 — הופחת לחסכון בעלות)
- Cron: יומי, Vercel native
- אין open bugs כרגע

---

## Decisions & Gotchas
- **selectWinnicottDefault warning = false positive**: `updateSessionTitle(true)` נקרא בשורה 423 חיצונית — לא regression.
- **updateReflectionBtn**: חסרה קריאה = bug אמיתי. חייבת ב-4 מקומות. בדוק זאת בכל PR.
- **data-bw-hidden = pattern נכון** ל-BW-38 — לא style.display.
- **restoreConversation**: `updateSessionTitle(true)` אחרי `updateReflectionBtn()` — bug שנמצא ותוקן. לשמור בזיכרון כ-pattern לחפש בעתיד.

---

## History (last 10)
1. BW-38 sign-off: data-bw-hidden pattern approved ✅
2. restoreConversation bug: נמצאה `updateSessionTitle(true)` חסרה — Oliver תיקן, sign-off ✅
3. QA הופחת ל-4 תיאורטיקנים (cost optimization — מאי 2026)
