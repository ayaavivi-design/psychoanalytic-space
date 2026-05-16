# Eitan — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- QA מכסה 4 תיאורטיקנים (לא 8 — הופחת לחסכון בעלות)
- Cron: יומי, Vercel native
- BW-43 — סגור (bw_mode תוקן)
- BW-35 — סגור (Safety interceptor: 8/8 PASS, שני ביטויים × 4 תיאורטיקנים)
- BW-36 Q-3 — ליבת הבעיה נפתרה ברמת הפרומפט. ⚠️ WARNING: אין cross-turn enforcement ב-validation loop
- ויניקוט פרומפט Q-W: Q-W1 PASS, Q-W2 PASS, Q-W3 CONCERN (semantic faithfulness לא נאכף בלופ)
- BW-51 — סגור ✅ PASS (flow-selection div DOM-only, invisible, PDF-only. Known limitation: לא שורד restoreConversation)

---

## Decisions & Gotchas
- **selectWinnicottDefault warning = false positive**: `updateSessionTitle(true)` נקרא בשורה 423 חיצונית — לא regression.
- **updateReflectionBtn**: חסרה קריאה = bug אמיתי. חייבת ב-4 מקומות. בדוק זאת בכל PR.
- **data-bw-hidden = pattern נכון** ל-BW-38 — לא style.display.
- **restoreConversation**: `updateSessionTitle(true)` אחרי `updateReflectionBtn()` — bug שנמצא ותוקן. לשמור בזיכרון כ-pattern לחפש בעתיד.
- **BLANK SCREEN ROOT CAUSE — welcome.remove() = FORBIDDEN**: `appendMessage()` ו-`showThinking()` קראו ל-`welcome.remove()` — מחקו לצמיתות את ה-`#welcome` שמנוהל ע"י React. `performNewChat()` לא מצא אותו → מסך ריק. **הכלל:** לעולם לא לקרוא ל-`welcome.remove()` — רק `welcome.style.display = 'none'`. לבדוק בכל PR שנוגע ב-`appendMessage` / `showThinking`.
- **BW-51 flow-selection known limitation**: `div.flow-selection` הוא DOM-only, לא שורד `restoreConversation`. PDF מסשן שחזר מזיכרון לא יציג Entry Point. לא bug — מגבלת תכנון.

---

## History (last 10)
1. Post-production QA 16.05: 4/4 PASS, BW-51+BW-46+enforceVariedOpening verified in prod ✅ (מאי 2026)
2. BW-51 sign-off: PASS ✅ — flow-selection DOM indicator + PDF export. Warning: לא שורד restoreConversation (known limitation, לא בלוקר) (מאי 2026)
3. ויניקוט QA post-prompt fix: Q-W1 PASS, Q-W2 PASS, Q-W3 CONCERN — שיום רגש ו-sentence completion לא ניתנים לאכיפה בלופ (מאי 2026)
2. BW-35 Safety QA: 8/8 PASS — interceptor עובד על כל 4 תיאורטיקנים × 2 תרחישים (מאי 2026)
2. BW-36 Q-3 re-run: ✅ LIKELY RESOLVED ברמת פרומפט. ⚠️ WARNING: אין cross-turn validation (מאי 2026)
3. fix(blank-screen): welcome.remove() זוהה כ-root cause — תוקן ל-style.display='none' (מאי 2026)
4. BW-43 תוקן: bw_mode משפיע על system prompt, session mode עובד כהלכה (מאי 2026)
5. BW-38 sign-off: data-bw-hidden pattern approved ✅
6. restoreConversation bug: נמצאה `updateSessionTitle(true)` חסרה — Oliver תיקן, sign-off ✅
7. QA הופחת ל-4 תיאורטיקנים (cost optimization — מאי 2026)
