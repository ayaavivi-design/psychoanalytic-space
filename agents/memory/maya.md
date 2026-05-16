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
1. מפרט עיצוב מצגת ולידציה — שמור ב-bizdev/presentation-design-spec-2026-05.md (מאי 2026)
2. סקירת UI מלאה — מאי 2026: 5 ממצאים קונקרטיים (ראה למטה)
2. ניתוח מסך הבחירה (BW-41): 4 ממצאים — mode toggle ללא selected state, padding-top נמוך, כותרות זהות, grid margin ידני. עדכון design-system.md עם לינקי live.
3. design-system.html v1.1: full token sync, bubble spec fix, States demo + Grid/Breakpoints sections
4. components.md: 7 קומפוננטים מתועדים עם CSS spec + forbidden patterns לכל אחד
5. icon-system.md: Lucide + Unicode two-language system, approved lists, size specs
6. font-size tokenization: globals.css — 37 ערכי hardcoded → 10 tokens (--fs-*)
7. border-radius fix: תיקון תיעוד design-system.md (radius-lg היה מתועד כ-14px, נכון 16px)

## ממצאי סקירת UI — מאי 2026

### ממצא 1 — welcome padding-top: 8px (קיים), צריך 32px
- **קובץ:** `app/globals.css`, selector `.welcome`
- **ממצא:** `padding: 8px 40px` — ה-8px בראש גורם לתוכן לצוף גבוה מדי ומאבד את תחושת המרכוז האנכי
- **תיקון:** `padding: var(--space-xl) 40px` = 32px בראש
- **למה:** ה-`justify-content: flex-start` מתנהג נכון רק אם יש padding מספיק מהראש. בלעדיו, הכותרת נוחתת ישירות מתחת ל-header ונראית כאילו נשמטה.

### ממצא 2 — `שיחת היכרות` chip — מיקום תלוי, בולט מדי בצד שמאל
- **קובץ:** `app/globals.css`, `app/page.tsx` — `.header-session`
- **ממצא:** ה-chip `שיחת היכרות` מופיע כ-`position: absolute` (ריצה לראש לפי screenshot) ומרוחק מהאלמנטים שהוא מתאר. הוא צף בחלל ריק מתחת לשם `Between` בלי הקשר ויזואלי ברור.
- **תיקון:** להעביר אותו להיות חלק מה-`header-session` row, עם `margin-inline-end: auto` כדי לשבת בצד הנכון. `padding: 4px var(--space-md)`.

### ממצא 3 — בועת AI: background לא-טוקן + gap בין הודעות: 28px hardcoded
- **קובץ:** `app/globals.css`, selectors `.message.assistant .message-body` ו-`#chat`
- **ממצא א:** `background: rgba(253,248,246,0.7)` — ערך שאינו טוקן. הצבע הוא וריאציה של `--bg` ב-70% אטימות. צריך: `background: var(--bg)` או `var(--surface)`.
- **ממצא ב:** `gap: 28px` ב-`#chat` — לא בטוקנים (הסקאלה: 4/8/12/20/32). הכי קרוב הוא `--space-xl` = 32px.
- **תיקון:** `.message.assistant .message-body { background: var(--surface); }` ו-`#chat { gap: var(--space-xl); }`

### ממצא 4 — כפתורי auth screen: border-radius 4px hardcoded, font-size 14px hardcoded
- **קובץ:** `app/page.tsx` — inline styles של `#auth-email`, `#auth-password`, `#signin-btn`, `#signup-btn`
- **ממצא:** `borderRadius: 4` (= `--radius-xs`) על שדות קלט — אבל לפי המערכת, input צריך `--radius-lg` = 16px (כמו `.input-wrap`). כפתורים עם `borderRadius: 4` — צריך `--radius-xl` = 22px (pill). `fontSize: 14` — לא בטוקנים (הסקאלה: 9/11/12/13/15/18/20/22/26/48).
- **תיקון:** `borderRadius: 'var(--radius-lg)'` על inputs, `borderRadius: 'var(--radius-xl)'` על כפתורים, `fontSize: 'var(--fs-body-md)'` = 13px.

### ממצא 5 — copy: "כלי" בדיסקליימר — מילה שאסורה לפי copy-voice.md
- **קובץ:** `app/page.tsx` — `#auth-disclaimer`
- **ממצא:** הטקסט כולל "Between הוא **כלי** לחשיבה" — "כלי" נמצא ברשימת "מילים שלא" ב-`docs/copy-voice.md`. הסיבה: Between היא לא כלי — היא נוכחות.
- **תיקון מוצע (לעבור דרך שון):** "Between נועד לחשיבה ולהבנה עצמית" — ללא המילה "כלי". לסמן לשון לאישור שון לפני עדכון.
