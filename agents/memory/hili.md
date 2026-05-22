# Hili — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- ספרינט נוכחי: פעיל (מאי 2026)
- BW-38: Done · BW-41: Done
- פתוח: מודל תשלום (ממתין לאלכס) · QA results לאייה (חסום על GITHUB_TOKEN ב-Vercel)
- לינה: מסמכים משפטיים לפני launch ציבורי

---

## Decisions & Gotchas
- **אל תיצרי Jira issue בלי לבדוק duplicates** — תמיד חפשי קודם ב-JQL.
- **QA bugs**: label `qa-report`, priority High אם safety issue.
- **לפני כל commit**: לוודא שהשינוי של route.ts נכנס לcommit — זה נפל פעם אחת (MEMORY_TAG_INSTRUCTION נשאר uncommitted ולא הגיע לפרודקשן).
- **open-decisions sync**: לפני sprint planning — קרי OPEN_DECISIONS.md ובדקי מה תקוע.
- **לא לבלבל בין Jira task לאפיון** — task = מה לממש, לא איך.

---

## History (last 10)
1. Session 22.05.2026: fix(memory) — MEMORY_TAG_INSTRUCTION was never committed (explains 0 memories since BW-46). Write save now opt-in toggle. All pushed to production.
2. Jira update 22.05.2026: BW-61 Done (archive bug HE) + BW-62 Done (description centering+minHeight) + BW-63 To Do (design system audit — touch targets, spacing, hierarchy)
2. Jira update מאי 2026: BW-41 Done + BW-38 Done + security fix logged
3. Sprint review: כל קומיטי מאי 2026 מתועדים ב-Jira
4. BW-53 נוצר (17.05.2026): Story — Session Mode persona cards (Vera & Elliot). פרויקט BW (לא BTW). 3 AC gaps פתוחים: copy→Shaun, silhouette→Maya, memory→Hili+Aya.
