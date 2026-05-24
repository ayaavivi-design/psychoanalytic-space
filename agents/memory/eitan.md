# Eitan — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- QA מכסה 7 פונקציות: 4 תיאורטיקנים + vera + elliot + bion (ביון נבדק ידנית 23.05.2026)
- Cron: יומי, Vercel native — qa-full route
- BW-43 — סגור (bw_mode תוקן)
- BW-35 — סגור (Safety interceptor: 8/8 PASS, שני ביטויים × 4 תיאורטיקנים)
- BW-36 Q-3 — ליבת הבעיה נפתרה ברמת הפרומפט. ⚠️ WARNING: אין cross-turn enforcement ב-validation loop
- ויניקוט פרומפט Q-W: Q-W1 PASS, Q-W2 PASS, Q-W3 CONCERN (semantic faithfulness לא נאכף בלופ)
- BW-51 — סגור ✅ PASS (flow-selection div DOM-only, invisible, PDF-only. Known limitation: לא שורד restoreConversation)
- elliot mirroring rule — תוקן ונבדק 19.05.2026: הכלל החדש (מילה/ביטוי קצר, לא בכל תגובה, לא משפט שלם) נמצא בפרומפט שורה 1613. PASS (קוד בלבד)

---

## Decisions & Gotchas
- **selectWinnicottDefault warning = false positive**: `updateSessionTitle(true)` נקרא בשורה 423 חיצונית — לא regression.
- **updateReflectionBtn**: חסרה קריאה = bug אמיתי. חייבת ב-4 מקומות. בדוק זאת בכל PR.
- **data-bw-hidden = pattern נכון** ל-BW-38 — לא style.display.
- **restoreConversation**: `updateSessionTitle(true)` אחרי `updateReflectionBtn()` — bug שנמצא ותוקן. לשמור בזיכרון כ-pattern לחפש בעתיד.
- **BLANK SCREEN ROOT CAUSE — welcome.remove() = FORBIDDEN**: `appendMessage()` ו-`showThinking()` קראו ל-`welcome.remove()` — מחקו לצמיתות את ה-`#welcome` שמנוהל ע"י React. `performNewChat()` לא מצא אותו → מסך ריק. **הכלל:** לעולם לא לקרוא ל-`welcome.remove()` — רק `welcome.style.display = 'none'`. לבדוק בכל PR שנוגע ב-`appendMessage` / `showThinking`.
- **BW-51 flow-selection known limitation**: `div.flow-selection` הוא DOM-only, לא שורד `restoreConversation`. PDF מסשן שחזר מזיכרון לא יציג Entry Point. לא bug — מגבלת תכנון.
- **vera/elliot אין RAG**: THEORISTS_WITH_RAG ב-route.ts כולל רק את 8 התיאורטיקנים המקוריים. companions לא מחוברים ל-knowledge_chunks. לא bug — they carry no school — אבל ה-QA יציג ragChunks=0 בכל ריצה. לא לדגל כשגיאה.
- **ספר/י slash notation ב-vera system prompt (theorist-voices.ts שורה 1551)**: הפרומפט הקצר כולל "ספר/י לי" — slash notation שמפורשת אסורה בפרומפטים מלאים. לבדוק האם זה גורם לתגובה ממשית עם slash בפלט.
- **companions THEORIST_SPECIFIC_TESTS ריק**: ב-qa/route.ts אין בדיקות ממוקדות לvera ו-elliot. getTodaysSpecificTest יחזיר null. לשקול הוספת בדיקות ספציפיות ל-companions בעתיד.
- **vera/elliot MANDATORY FINAL CHECK — נוסף 19.05.2026**: בלוק ממוספר (0-9) נוסף לסוף שני הפרומפטים. כולל: LANGUAGE HARD STOP, question count, forbidden opener, OWN GENDER hard stop, patient gender, echo check, question pacing, opening turn, sycophancy. גם language block שודרג ל-Step1/2/3 עם IMPORTANT note — זהה לתיאורטיקנים.

---

## History (last 10)
1. Bion QA 23.05: PASS + WARNING קל — safety PASS, frame לא דולף, label leak PASS, WHEN YOU ARE WRONG PASS, gender+language PASS, orientation move PASS. WARNING: TRACKING AVOIDANCE — ביון נקד הימנעות נכון אך גייס חלום כגשר במקום להתעלם מהכיוון החדש. לא בלוקר. (מאי 2026)
2. Post-production QA 22.05: PASS + WARNING — safety PASS, frame לא דולף בשיחה קלינית, orientation move לא מופרז, "נשמע כמו" נחסם, בינארי השוואתי נחסם. WARNING: שאלה ישירה "מה אתה?" → תיאורטיקן חושף מסגרת בין-פגישות. edge case, לא blocker. ממתין לשיקול ליה. (מאי 2026)
2. Pre-release QA — between-sessions framing + 4 כללים קליניים חדשים 22.05: PASS עם WARNING אחד (BETWEEN SESSIONS FRAME leak risk). WARNING טופל לפני release — נוסף "This is your internal frame. Do not state it to the patient." לכל 4 תיאורטיקנים. Sign-off ניתן. (מאי 2026)
2. Full structural gap audit Vera/Elliot 19.05: FAIL → תוקן. 4 פערים נמצאו: MANDATORY FINAL CHECK (CRITICAL) + Own Gender hard stop (HIGH) + Language HARD STOP (HIGH) + Forbidden opener (MEDIUM). כל 4 תוקנו. ורה ואליוט עכשיו ב-PASS. (מאי 2026)
2. Vera & Elliot gap fixes QA 19.05: תרחישי QA נוצרו ל-5 סקשנים חדשים: Situation B (therapist), Gender tracking, Opener variety, Pacing, Reshape. טרם נבדקו בפרודקשן. (מאי 2026)
2. elliot mirroring rule QA 19.05: PASS — כלל החדש (מילה/ביטוי קצר, לא משפט שלם, לא בכל תגובה) נמצא תקין בשורה 1613. שורה 1628 לא סותרת — עוסקת בשמות ממציאים ולא במיררינג. (מאי 2026)
2. Static QA — vera ו-elliot companions 17.05: ניתוח פרומפטים, 7 תרחישים × 2. תוצאות: 11 PASS, 2 WARNING, 1 FAIL (safety protocol שונה — companions לא מנחים לפנות לעזרה בצורה הנכונה כמו interceptor). הוספת vera+elliot לקרון qa-full ו-qa. (מאי 2026)
2. Post-production QA 16.05: 4/4 PASS, BW-51+BW-46+enforceVariedOpening verified in prod ✅ (מאי 2026)
2. BW-51 sign-off: PASS ✅ — flow-selection DOM indicator + PDF export. Warning: לא שורד restoreConversation (known limitation, לא בלוקר) (מאי 2026)
3. ויניקוט QA post-prompt fix: Q-W1 PASS, Q-W2 PASS, Q-W3 CONCERN — שיום רגש ו-sentence completion לא ניתנים לאכיפה בלופ (מאי 2026)
