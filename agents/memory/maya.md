# Maya — Working Memory
_עדכן אוטומטית בסוף כל session. לא לערוך ידנית._

---

## Context
- design-system.html: v1.1 — מסונכרן עם globals.css
- globals.css: כל font-sizes מטוקנות (--fs-*), כל border-radius מטוקנות (--radius-*)
- components.md: 7 קומפוננטים מתועדים (Bubble, Input, Sidebar, Modal, Tooltip, Flow, Suggestions)
- icon-system.md: Lucide (size=15, strokeWidth=1.75) + רשימת Unicode מאושרת
- UX-RULES.md: 9 כללים פעילים
- between-tokens.json: source of truth לכל מדידה
- **מסך בחירה (BW-41) — ממצאי מאי 2026:**
  - Mode toggle: שני האפשרויות `--muted` בטעינה — אין selected state ברירת מחדל. צריך: "סשן" נבחר כברירת מחדל.
  - welcome padding-top: 8px בפועל — צריך 32px (space-xl).
  - שתי כותרות זהות 19px — צריך היררכיה: ראשית 20px italic, שנייה 19px.
  - theorist grid: `margin: 0 195px` ידני — צריך `width:fit-content; margin:0 auto`.
- **Domain:** psychoanalytic-space.vercel.app ו-chat.getbetween.app = אותו deployment. הראשון לפיתוח/QA, השני לשיווק/משתמשים.
- design-system.md: עודכן עם לינקי live בראש הקובץ.

---

## Decisions & Gotchas
- **Tooltip**: React fixed-position state component בלבד — לעולם לא CSS `::after`. clipping ב-overflow containers.
- **User bubble**: background: var(--accent-soft) + border subtle — לא solid accent (#c4607a).
- **Input wrap**: border-radius: var(--radius-lg) = 16px — לא 24px.
- **line-height בועות**: 1.85 — לא לשנות. נבחר ספציפית לקריאות עברית.
- **נרמול גדלים**: 10px→11px (--fs-caption) · 14px→13px (--fs-body-md) · 17px→18px (--fs-heading-card) · 16px→15px (--fs-body-lg).
- **Breakpoints**: לא תומכים ב-var() בתוך @media — ערכים hardcoded: 600px · 900px · 1200px.
- **design-system.html**: self-contained, לא יורש globals.css — כל שינוי טוקן חייב sync ידני לקובץ הזה.
- **preview_eval = prototype בלבד**: CSS שמוזרק דרך eval הוא זמני. לא לדווח "מוכן" בלי לכתוב לקוד האמיתי.

---

## History (last 10)
1. ניתוח מסך הבחירה (BW-41): 4 ממצאים — mode toggle ללא selected state, padding-top נמוך, כותרות זהות, grid margin ידני. עדכון design-system.md עם לינקי live.
2. design-system.html v1.1: full token sync, bubble spec fix, States demo + Grid/Breakpoints sections
3. components.md: 7 קומפוננטים מתועדים עם CSS spec + forbidden patterns לכל אחד
4. icon-system.md: Lucide + Unicode two-language system, approved lists, size specs
5. font-size tokenization: globals.css — 37 ערכי hardcoded → 10 tokens (--fs-*)
6. border-radius fix: תיקון תיעוד design-system.md (radius-lg היה מתועד כ-14px, נכון 16px)
