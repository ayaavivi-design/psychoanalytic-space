# Eitan — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- QA מכסה 4 תיאורטיקנים (vera + elliot נעלמו מהדוחות מ-30.05 ואילך — לא ידוע אם הוסרו מה-cron או שינוי אחר)
- Cron: יומי, Vercel native — qa-full route
- BW-43 — סגור (bw_mode תוקן)
- BW-35 — סגור (Safety interceptor: 8/8 PASS, שני ביטויים × 4 תיאורטיקנים)
- BW-36 Q-3 — ליבת הבעיה נפתרה ברמת הפרומפט. ⚠️ WARNING: אין cross-turn enforcement ב-validation loop
- ויניקוט פרומפט Q-W: Q-W1 PASS, Q-W2 PASS, Q-W3 CONCERN (semantic faithfulness לא נאכף בלופ)
- BW-51 — סגור ✅ PASS (flow-selection div DOM-only, invisible, PDF-only. Known limitation: לא שורד restoreConversation)
- elliot mirroring rule — תוקן ונבדק 19.05.2026: הכלל החדש (מילה/ביטוי קצר, לא בכל תגובה, לא משפט שלם) נמצא בפרומפט שורה 1613. PASS (קוד בלבד)
- **קליין — דפוס over-question**: 06.06🟡(תור3) → 07✅ → 08🟡(תור5) → 09✅ → 10🟡(תור2) → 11✅ → 12✅ → 13✅. **שלושה ימים רצופים נקיים — הדפוס נקטע לפחות זמנית.** VOICE IDENTITY block: סטטוס יישום לא ידוע — לאשר עם אוליבר.
- **IDENTITY QUESTION rule** — אושר בקוד ל-4 תיאורטיקנים: פרויד (454), קליין (904), ויניקוט (1405), אוגדן (1809). OPEN_DECISIONS ממתין לאישור live test ע"י ליה לפני סגירה רשמית.
- **Klein reality-reason guard** — הוסף commit 001d7c2 ב-08.06. ייתכן שתרם לימים הנקיים — אין הוכחה.
- **RAG drop 01.06**: פרויד + קליין + אוגדן → RAG=0. חזרו ל-RAG=3 מ-02.06 ואילך. הסיבה לא הובנה — **פעולה נדרשת: לשלוף לוגי Vercel מ-01.06 לפני שיחזור**.
- **13.06 סטטוס**: 3/4 — פרויד 🔴 FAIL. RAG=3 לכולם. קליין ✅ שלישי ברצף. **post-release re-run (23:37) אישר שוב 3/4 + safety 4/4 — יציב.**
- **פרויד Q-3 — דגל פעיל**: 13.06 בוקר כשל Q-3 (כל התגובות שאלות בלבד, אין תצפית). ב-re-run של 23:37 הדגל היה שונה — [עקביות] אורך תגובה אחיד (סטייה 3.8 מילים), לא Q-3 — תנודתיות sampling של אותו דפוס. נפתח **BW-99** (WATCH, Low) — מעקב 14-15.06, תיקון רק אם חוזר. נדרש בעתיד: Observation Rule לבלוק פרויד + check בוולידציה.
- **BW-96/97 — בפרודקשן ✅ (13.06)**: prompt fidelity ל-downstream agents (summary + supervise). smoke test שלי PASS (template literal tsc EXIT=0 + runtime JSON דרך /eval ליה). post-prod QA יציב. הריליס לא נגע בקולות התיאורטיקנים — לכן דגל פרויד אינו regression מהריליס.

---

## Decisions & Gotchas
- **hold_entries table חסרה**: `app/api/hold/route.ts` מבצע `insert` לטבלה שלא קיימת בשום migration. לפני כל test של כפתור שמור — לוודא שהטבלה נוצרה ב-Supabase (עם RLS נכון).
- **explore mode הוסר מה-DOM ב-d8212af**: כל ה-`querySelector('.bw-mode-secondary')` ב-chat.js מחזיר null. לבדוק בכל PR שנוגע ב-page.tsx אם כפתורי המצב קיימים.
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
1. Smoke test dependency vulns 14.06: PASS — חתמתי eitan-approval.md. שינוי package.json+lockfile בלבד (uuid+ws fix · הסרת @xenova/transformers → CRITICAL protobufjs נמחק · next 16.2.1→16.2.9 patch). audit 12→3 (Critical 1→0, High 4→0). אימות עצמי: tsc EXIT=0 · build EXIT=0 · lockfile נקי מ-xenova+protobufjs · dev server כל בקשות 200 · e2e `/api/qa-quick?theorist=freud` HTTP 200 10.4s ragChunks=3 אפס דגלים. **RAG עבד בלי @xenova — הוכחה שהחבילה מתה (embeddings מ-HF remote).** 3 שנותרו לא בני-תיקון בטוח (anthropic-sdk Memory Tool לא בשימוש + postcss transitive בתוך next). לוקאלי, לא נדחף. (יוני 2026)
2. Release BW-96/97 13.06: smoke test PASS (template literal tsc EXIT=0 + runtime JSON תקין דרך /eval ליה). חתמתי release/eitan-approval.md, סם דחף לפרודקשן (commit 29fe835, deploy READY). שני ה-issues → Done. **post-prod QA (live API): 3/4 + safety 4/4 — יציב, אין rollback. פרויד 🔴 = דגל קיים (BW-99), לא regression מהריליס. דוח: release-reports/post-qa-2026-06-13-2337.md (commit d24d5e3).** (יוני 2026)
1. QA יומי 13.06: 3/4 — פרויד 🔴 FAIL (Q-3: כל התגובות שאלות בלבד, ללא תצפית — כשל שמשתמש רואה). קליין ✅ שלישי ברצף. נדרש: Observation Rule לבלוק פרויד + check בוולידציה. Atlassian MCP לא זמין — Jira לא עודכן. (יוני 2026)
1. QA יומי 12.06: 4/4 PASS ✅. קליין נקייה — שני ימים רצופים, הדפוס נקטע (כשל לא התממש כפי שניבאתי). גילוי: IDENTITY QUESTION rule בקוד ל-4 תיאורטיקנים — ממתין live test מליה לסגירה. VOICE IDENTITY block עדיין לא יושם. (יוני 2026)
1. QA יומי 11.06: 4/4 PASS ✅. RAG=3 לכולם. קליין נקייה — alternating pattern ממשיך. VOICE IDENTITY fix עדיין לא בוצע — 4 ימים מאז ממליצת ליה. כשל צפוי ב-12.06. שאלת זהות ישירה (OPEN_DECISIONS) — 20 יום, לא נבדקה. (יוני 2026)
1. QA יומי 10.06: 3/4 — קליין 🟡 Q-1 תור 2 (regression — מוקדם מ-08.06 תור 5). VOICE IDENTITY fix עדיין לא בוצע — 3 ימים. Atlassian MCP לא זמין — Jira לא עודכן. (יוני 2026)
1. QA יומי 09.06: 4/4 PASS ✅. RAG=3 לכולם. קליין נקייה היום — דפוס לסירוגין ממשיך (כשל צפוי מחר). VOICE IDENTITY fix (ליה 07.06) עדיין לא בוצע — 2 ימים. Atlassian MCP לא זמין — Jira לא עודכן. (יוני 2026)
1. QA יומי 08.06: 3/4 — קליין 🟡 Q-1 תור 5 (נתפס בפרודקשן). RAG=3 לכולם. VOICE IDENTITY fix (ליה 07.06) עדיין לא בוצע — 4 ימים. Atlassian MCP לא זמין — Jira לא עודכן. (יוני 2026)
1. QA יומי 07.06: 4/4 PASS מלא. RAG=3 לכולם. Check 5a (קליין) עדיין לא בוצע — 3 ימים מאז ממליצת ליה HIGH priority. RAG drop מ-01.06 עדיין לא נחקר. (יוני 2026)
1. QA יומי 06.06: 3/4 PASS מלא + קליין 🟡 Q-1 (שתי שאלות תור 3, נתפס בפרודקשן). RAG=3 לכולם. check 5a עדיין לא בוצע — HIGH priority, דחוף. Atlassian MCP לא זמין — Jira לא עודכן. (יוני 2026)
