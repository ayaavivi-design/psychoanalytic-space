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
- **BLANK SCREEN ROOT CAUSE — welcome.remove() = FORBIDDEN**: `appendMessage()` ו-`showThinking()` קראו ל-`welcome.remove()` — מחקו לצמיתות את ה-`#welcome` שמנוהל ע"י React. `performNewChat()` לא מצא אותו → מסך ריק. **הכלל:** לעולם לא לקרוא ל-`welcome.remove()` — רק `welcome.style.display = 'none'`. לבדוק בכל PR שנוגע ב-`appendMessage` / `showThinking`.

---

## History (last 10)
1. fix(blank-screen): welcome.remove() זוהה כ-root cause — תוקן ל-style.display='none' (מאי 2026)
2. BW-43 תוקן: bw_mode משפיע על system prompt, session mode עובד כהלכה (מאי 2026)
3. BW-38 sign-off: data-bw-hidden pattern approved ✅
4. restoreConversation bug: נמצאה `updateSessionTitle(true)` חסרה — Oliver תיקן, sign-off ✅
5. QA הופחת ל-4 תיאורטיקנים (cost optimization — מאי 2026)
