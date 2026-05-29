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
- **Hold UI (`/hold` route) — ממצאי מאי 2026:** padding-top 48px→28px, כרטיס max-height 360px, כותרת color→var(--text), placeholder opacity 0.9, כפתור שמור מוסתר עד hasContent. "שתף עם המטפל"/"שיחה" לא קיימים ב-/hold — שאלה פרודקטית פתוחה.
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
1. Hold UI deep audit (מאי 2026): 13 ממצאים — ראה פירוט למטה.
2. Hold UI review (מאי 2026): 7 ממצאים — padding-top גבוה (48→28px), כרטיס מתפח (flex:1 בלי max-height), כותרת בצבע muted (contrast fail), placeholder בהיר מדי, כפתור שמור נראה שבור כשריק, שתף+שיחה לא קיימים ב-/hold route (שאלה פרודקטית פתוחה לאיה/הילי).
2. מפרט עיצוב מצגת ולידציה — שמור ב-bizdev/presentation-design-spec-2026-05.md (מאי 2026)
3. סקירת UI מלאה — מאי 2026: 5 ממצאים קונקרטיים (ראה למטה)
4. ניתוח מסך הבחירה (BW-41): 4 ממצאים — mode toggle ללא selected state, padding-top נמוך, כותרות זהות, grid margin ידני. עדכון design-system.md עם לינקי live.
5. design-system.html v1.1: full token sync, bubble spec fix, States demo + Grid/Breakpoints sections
6. components.md: 7 קומפוננטים מתועדים עם CSS spec + forbidden patterns לכל אחד
7. icon-system.md: Lucide + Unicode two-language system, approved lists, size specs
8. font-size tokenization: globals.css — 37 ערכי hardcoded → 10 tokens (--fs-*)
9. border-radius fix: תיקון תיעוד design-system.md (radius-lg היה מתועד כ-14px, נכון 16px)

## ממצאי Hold UI deep audit — מאי 2026

### 13 ממצאים מוכחים (מדידה בפועל)

1. **כותרת — font-family שגוי**: `"David Libre"` בפועל במקום `Cormorant Garamond`. `var(--font-cormorant)` מתפרשת ל-David Libre — bug טכני.
2. **welcome padding-top: 0px** — צריך `--space-xl` = 32px (דלתא: -32px). תוכן צף גבוה מדי.
3. **line-height כותרת: 1.9** — לא בטוקנים. צריך 1.3–1.6.
4. **container gap: 16px** — לא בסקאלה (4/8/12/20/32). הקרוב `--space-lg` = 20px (דלתא: -4px).
5. **footer padding: 10px 16px** — לא עקבי עם body padding 20px. צריך 10px 20px (דלתא: +4px אופקי).
6. **גבהים לא עקביים**: שמור=35.5px, ניתוח=37.5px, שיחה=38px — שלושה גבהים שונים בשורה אחת.
7. **היררכיה הפוכה**: "שמור" קיבל Primary CTA (accent מלא) — "שיחה" קיבל accent-soft. פעולת הליבה נראית משנית.
8. **"ניתוח" border color**: `var(--border)` = מדהה ברקע. צריך `var(--muted)`.
9. **split button border broken**: `borderRight: "2px outset rgb(0,0,0)"` — browser default שגוי. נראה שבור לחלוטין.
10. **6 כפתורים בו-זמנית**: 3 פעולות + 3 suggestions = עומס קוגניטיבי.
11. **hint "סמן טקסט" לא מזהיר**: נראה כ-metadata, לא כ-affordance.
12. **footer כרטיס לא נבנה**: mic + ארכיון + hint — 3 elements שלא מדברים.
13. **RTL split button**: border direction לא תקין ב-RTL.

### קריטי ביותר
- היררכיית כפתורים הפוכה (שמור > שיחה במראה, הפוך בחשיבות)
- גבהים לא עקביים בשורת כפתורים
- font-family שגוי בכותרת (David Libre במקום Cormorant)

---

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
