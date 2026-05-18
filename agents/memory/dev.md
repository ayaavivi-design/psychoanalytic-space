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
1. feat(BW-54): theoretical lens after session — maybeOfferTheoreticalLens() after feedback, picker modal (freud/klein/winnicott/ogden), POST /api/theoretical-lens, 3-block output. Support mailto link in settings (hello@getbetween.app).
2. fix(BW-53): gap tokens + companion no-default — gap: var(--space-lg) in globals.css + page.tsx; first-time users see no pre-selected companion card; confirm button disabled until selection; selectTheoristEntry() enables it on click.
2. feat(BW-53): companion cards (Vera/Elliot) — session mode shows 2 companion cards with SVG icons instead of theorist grid. explore mode unchanged. renderTheoristGridForMode() is the single source of truth. localStorage: bw_companion persists choice.
2. feat: /api/daily-summary — CCR email bridge endpoint (Resend, x-internal-token auth). ממתין ל-INTERNAL_API_TOKEN ב-Vercel + עדכון CCR routine
3. feat(BW-51): flow selection indicator — DOM element + PDF export (startFlow + exportPDF בלבד)
4. fix(restore): `updateSessionTitle(true)` אחרי `restoreConversation` — active-theorist-bar לא התרענן
5. feat: הסתרת `.input-area` בשלבי הבחירה (showModeSelect + showTheoristEntry)
6. feat(BW-41): זרימת כניסה מאוחדת — מסך מצב + תיאורטיקן, תרגום עברית, fix logout/login, design tokens
7. fix(BW-38): data-bw-hidden pattern לניהול auth-screen visibility
8. fix(security): REVOKE הרשאות עודפות מ-knowledge_chunks ו-user_conversations (הכנה לאוק׳ 2026)
