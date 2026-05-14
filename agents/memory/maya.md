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
1. design-system.html v1.1: full token sync, bubble spec fix, States demo + Grid/Breakpoints sections
2. components.md: 7 קומפוננטים מתועדים עם CSS spec + forbidden patterns לכל אחד
3. icon-system.md: Lucide + Unicode two-language system, approved lists, size specs
4. font-size tokenization: globals.css — 37 ערכי hardcoded → 10 tokens (--fs-*)
5. border-radius fix: תיקון תיעוד design-system.md (radius-lg היה מתועד כ-14px, נכון 16px)
