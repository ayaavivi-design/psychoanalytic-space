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

---

## History (last 10)
1. feat(write→theorist): THEORIST_OPENING he_write/en_write variants. showTheoristOpening() async — API call when _bwWriteSessionContext present, fallback static. buildSystemPrompt() WRITE CONTEXT block (holds content, forbids "מה כתבתי?"). confirmTheoristEntry() bypass flow buttons when write context. Toggle + 2-button footer in openWriteSummary(). saveWriteEntry() + openWriteArchive() localStorage (bw_writes). Private bubble context-aware: detects .bw-private parent → "בטל" un-marking via window._bwPrivateSpanTarget. (מאי 2026)
2. feat(write-mode/private): contenteditable replaces textarea. Panel wrapper (surface bg + border + radius-md). "רק אני" bubble on selection → `.bw-private` span (accentSoft bg). `getPublicWriteContent()` strips private spans for summary. (מאי 2026)
3. feat(end-session): `triggerEndSession()` + `showEndSessionButton()` + `showEndSessionActions()` — button after 4+ exchanges, theorist closing, two action buttons. `bw_end_session` flag in API. (מאי 2026)
4. feat(write-mode): "Write" — 3rd mode pill. `showWriteInterface()` + `openWriteSummary()` + `/api/write-summary` (Haiku). Sidebar "Session notes" btn. `bw-write-mode` body class hides input bar. (מאי 2026)
5. feat(after-session-flow): "עוד מהפגישה" — 3-step flow: button → textarea → theorist → conversation. confirmTheoristEntry() checks _bwAfterSessionText.
6. feat(explore-mode): EXPLORE_MODE_INSTRUCTION injected into buildSystemPrompt — research context, 1000-word depth, no probing, named redirect.
7. feat(BW-54): theoretical lens after session — maybeOfferTheoreticalLens(), picker modal, POST /api/theoretical-lens, 3-block output.
8. fix(BW-53): gap tokens + companion no-default — confirm button disabled until selection.
9. feat(BW-53): companion cards (Vera/Elliot) — session mode shows 2 companion cards. renderTheoristGridForMode() single source of truth.
10. feat: /api/daily-summary — CCR email bridge (Resend, x-internal-token auth).
