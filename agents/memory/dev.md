# Oliver — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- Stack: Next.js 16 App Router · React 19 · chat.js (~5000 שורות vanilla JS)
- DB: Supabase — `knowledge_chunks` (RAG) · `user_conversations` (usage)
- Deploy: Vercel + native crons (vercel.json) · repo: ayaavivi-design/psychoanalytic-space
- Stripe: ON HOLD — ממתין לפתיחת חשבון
- Auth: Supabase Auth · guard `if (!supabaseClient)` לפני כל קריאת auth
- Input visibility: `data-bw-hidden` attribute (BW-38) — לא style.display

---

## Decisions & Gotchas
- **Supabase permissions**: תמיד `REVOKE`/`GRANT` מפורשים על טבלאות חדשות. אל תסמוך על ברירת מחדל — משתנה מאוקטובר 2026.
- **CCR → Vercel = 403**: CCR agents לא יכולים לקרוא ל-deployment URLs. crons חייבים להיות vercel-native (vercel.json).
- **supabaseClient guard**: תמיד `if (!supabaseClient)` לפני signIn/signUp/resetPassword — CDN לא תמיד נטען לפני הלחיצה.
- **updateReflectionBtn**: חייב להיקרא ב-4 מקומות — אחרי AI response, אחרי restoreConversation, ב-init, אחרי confirmTheoristEntry. חסרה קריאה אחת = bug.
- **restoreConversation**: חייב `updateSessionTitle(true)` אחרי `updateReflectionBtn()` — active-theorist-bar לא מתרענן בלי זה.
- **data-bw-hidden**: pattern לניהול visibility של auth-screen ו-flow elements — לא style.display.
- **input-area**: מוסתר ב-showModeSelect() + showTheoristEntry(), מוצג חזרה כש-chat מתחיל בפועל.
- **stream idle timeout**: ב-CCR — כתוב → שמור ל-/tmp → כתוב → שמור. לא לייצר הכל בתגובה אחת.
- **QA classification source-of-truth**: `lib/qa-fixer-map.ts` הוא המקור היחיד שממפה קוד issue → fixer בפרודקשן. qa-full מסווג כל issue ל-realFail (אין fixer → המשתמש רואה) או caught (יש fixer → caught≠clean אבל לא דלף). שמרני: קוד לא מוכר → fail.
- **QA drift guard**: `scripts/qa-drift-check.mjs` (npm run qa:drift) מאמת ששמות ה-fixers ב-QA_RULES קיימים ב-chat/route.ts, ושכל קוד ש-checkTurn פולט מסווג ב-QA_RULES. הרץ אחרי כל שינוי ל-checkTurn או ל-fixers. **לא** מחובר ל-build (אין test runner בפרויקט) — הרצה ידנית/cron.
- **fixers בפרודקשן הם local non-exported**: enforceOneQuestion/enforceVariedOpening/enforceSemanticRules ב-chat/route.ts אינם מיוצאים. המפה מסתמכת עליהם בשמם בלבד — לכן drift guard גרפי, לא import.
- **secrets בסקריפטי Python**: כל סקריפט ב-`scripts/` חייב לקרוא את ה-service_role מ-`os.environ["SUPABASE_SERVICE_ROLE_KEY"]` — לעולם לא hardcoded. הריפו ציבורי. ה-env var name הקנוני בכל הסטאק (lib/rag.ts, Edge Function, סקריפטים) = `SUPABASE_SERVICE_ROLE_KEY`. anon/publishable key (`sb_publishable_...` ב-chat.js) הוא ציבורי בכוונה — מוגן ע"י RLS, לא דליפה.
- **דליפת מפתח = rotation, לא edit**: עריכת קובץ לא מנקה את git history. אם service_role דלף — חייב Roll ב-Supabase דשבורד (זה הורג את הישן) + עדכון env ב-Vercel + redeploy. scrubbing של history אופציונלי אחרי rotation.

---

## History (last 10)
1. feat(BW-94, ogden-voice): תיקון פרומפט בלבד ל-lib/theorist-voices.ts (בלוק אוגדן) — הזרקת סקשן מתויג VOICE IDENTITY אחרי פסקת analytic-third (~שורה 1421), לפני BETWEEN SESSIONS FRAME. שני נוסחים של ליה מילה במילה: (1) voice anchor "Speak from reverie, not from knowledge... never tell the patient what they are doing or who they are. Work from what is created between you" (2) SELF-CORRECTION trigger כשהמטופל מסמן נחרצות → קבל מיד, הרף ניסוח, חזור ל-reverie. **gotcha:** הטריגר הקיים ב-~1460 (WHEN PATIENT SAYS GOING IN CIRCLES) חל רק על Situation B — החדש רחב, חל בכל סיטואציה. המראה ההפוך של BW-100 (פרויד שואל יותר מדי / אוגדן קובע יותר מדי). tsc נקי (EXIT=0). אפס env/DB/route/build. **לוקאלי בלבד — BW-94 In Progress, Done רק אחרי release (איה מחליטה). בלי commit/push.** (יוני 2026)
2. feat(BW-96/97, prompt-fidelity): הזרקתי את נוסחי הכלל המדויקים של ליה לשני prompts (בלי לשנות מילה — ליה בעלת הניסוח). **summary-prompt.ts**: 2 כללים (INTERPRETATION IS NOT FACT + SEPARATE WHO SAID WHAT) תחת סקשן Rules, בין כלל GENDER לשורת הסיום. **supervise-prompt.ts**: 3 כללים (REGISTER NOT JUST CONTENT + PATIENT META-FEEDBACK IS PRIMARY DATA + SOPHISTICATION IS NOT FIDELITY) אחרי סקשן VOICE FIDELITY, + תיקון overall-logic ("overall cannot be pass if patient named stance as off... OR register contradicts theorist's voice"). **gotcha:** הלוגיקה הקיימת של supervise ("QUESTIONS ARE NOT INTERPRETATIONS" + "pass requires interpretive moves") מטה לכיוון הכשל — תגמלה נוכחות פרשנות, לכן אוגדן נחרץ קיבל "strong". בלי תיקון overall-logic שלושת הכללים לא בועטים. כל הטקסט הקליני בתוך template literals (backticks) — אפוסטרופים בטוחים, אין escaping. tsc נקי (TSC_EXIT=0). **לוקאלי בלבד — ממתין לאימות /eval של ליה לפני Done. בלי commit/push.** (יוני 2026)
3. style(BW-77, design refresh): פלטת רוז עמוקה + פונט עברית Assistant — נדחף לפרודקשן (commit b62b6c3, dpl_fBn6o1 READY). globals.css + between-tokens.json: --bg #fdf8f6→#f3e7e2, surface #fff→#fffaf8, border→#e6d6cf, muted→#74645e, accent-deep→#a8475f, thinking→#ecc7d4; **accent #c4607a לא זז**. layout.tsx: David_Libre→Assistant (next/font/google, weights 300-600, --font-assistant), חל על welcome + RTL entry headings + כותרת Hold. לטיני ללא שינוי (Cormorant+Rubik). 6 קבצים. WCAG AA עבר, lint:tokens נקי, tsc נקי. **gotcha:** accent כטקסט על הרוז = 3.27 (מתחת ל-4.5) — רק כותרת welcome דקורטיבית 22px, היה 3.76 על הרקע הישן; אופציה להעביר ל-accent-deep בעתיד. BW-77 Done. (יוני 2026)
4. security(service_role leak): מפתח service_role של Supabase היה hardcoded ב-4 סקריפטי Python בריפו ציבורי (ingest.py, ingest_one.py, split_freud.py, split_freud_complete.py). הוצא ל-`os.environ["SUPABASE_SERVICE_ROLE_KEY"]`. **נדחף** (commit eb01874, dpl_7Q3PFR READY) + איה ביצעה rotation (secret key חדש ב-Vercel + Disable JWT-based keys ב-Supabase) → המפתח הישן נוטרל. פרודקשן env-based, אפס runtime impact. BW-76 Done. (יוני 2026)
5. style(BW-69, token-align): 3 תיקוני טוקן בטוחים על מסך ה-Hold (app/page.tsx, inline). placeholder lineHeight 1.7→1.6 (normal); footer padding '8px 14px'→'8px 12px' + talk wrapper '10px 14px 14px'→'10px 12px 12px' (space-md); talk button borderRadius 10→16 (radius-lg). tsc נקי. (יוני 2026)
6. fix(BW-68 safety, Tier 1): `handleEnterConversation` ב-app/page.tsx — בדיקת crisis סרקה רק `pub` (טקסט ציבורי). מצוקה שסומנה private לא הפעילה את showCrisisBanner. תיקון: סורק `full` להחלטה על הבאנר, אבל `enterHoldConversation(theorist, pub)` לא שונה — התיאורטיקן עדיין לא רואה private. בטיחות ופרטיות לא מתנגשות. tsc נקי. נדחף בגרסת Hold 02.06. (יוני 2026)
7. feat(qa-classification): מקור-אמת `lib/qa-fixer-map.ts` (QA_RULES, classifyIssues, severityOf, codeOf). qa-full/route.ts מסווג כל issue ל-realFail/caught. `scripts/qa-drift-check.mjs` + `npm run qa:drift`. אפס שינוי ל-chat/route.ts. typecheck נקי, drift עבר. (יוני 2026)
8. refactor(hold→write): Hold UI כרטיס לבן + voice (Mic) + כותרת "מה נשאר איתך" + כפתורים בשורה אחת. handleHoldSave/Share → saveWriteEntry (localStorage). ארכיון → openWriteArchive(). _bwFromHold flag מדלג על flow buttons. /api/hold נמחק (BW-75). (מאי 2026)
9. feat(/hold): voice + i18n + design polish — Web Speech API (zero cost, `he-IL`/`en-US`), globe toggle + `bw_lang` localStorage, CSS vars throughout, `position:fixed;inset:0` fixes sidebar bleed from root layout. (מאי 2026)
10. feat(write→theorist): THEORIST_OPENING he_write/en_write variants. showTheoristOpening() async. buildSystemPrompt() WRITE CONTEXT block. confirmTheoristEntry() bypass flow buttons. saveWriteEntry() + openWriteArchive() localStorage (bw_writes). Private bubble context-aware via window._bwPrivateSpanTarget. (מאי 2026)
