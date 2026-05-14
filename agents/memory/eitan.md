# Eitan — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- QA מכסה 4 תיאורטיקנים (לא 8 — הופחת לחסכון בעלות)
- Cron: יומי, Vercel native
- Open bug: BW-43 — bw_mode has no effect on system prompt (session = explore at API level)

---

## Decisions & Gotchas
- **selectWinnicottDefault warning = false positive**: `updateSessionTitle(true)` נקרא בשורה 423 חיצונית — לא regression.
- **updateReflectionBtn**: חסרה קריאה = bug אמיתי. חייבת ב-4 מקומות. בדוק זאת בכל PR.
- **data-bw-hidden = pattern נכון** ל-BW-38 — לא style.display.
- **restoreConversation**: `updateSessionTitle(true)` אחרי `updateReflectionBtn()` — bug שנמצא ותוקן. לשמור בזיכרון כ-pattern לחפש בעתיד.

---

## History (last 10)
1. BW-43 opened: bw_mode has no effect on system prompt — session = explore at API level (מאי 2026)
2. BW-38 sign-off: data-bw-hidden pattern approved ✅
3. restoreConversation bug: נמצאה `updateSessionTitle(true)` חסרה — Oliver תיקן, sign-off ✅
4. QA הופחת ל-4 תיאורטיקנים (cost optimization — מאי 2026)
