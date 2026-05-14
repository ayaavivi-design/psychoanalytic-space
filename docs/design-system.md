# Between — Design System
_Maya, Head of UX/UI · May 2026_

**Live:** [https://psychoanalytic-space.vercel.app](https://psychoanalytic-space.vercel.app) · [https://chat.getbetween.app](https://chat.getbetween.app)

---

## עקרון מנחה

Between הוא מרחב שקט. הדיזיין לא מחליף את הפסיכואנליטיקאי — הוא מפנה לו מקום.
כל החלטה עיצובית שואלת: **האם זה מוסיף רעש, או פותח שקט?**

---

## 1. צבעים — Color Tokens

```css
--bg:          #fdf8f6   /* רקע כללי — לבן-שמנת */
--surface:     #fff      /* כרטיסים, panels */
--border:      #ede4e0   /* גבולות עדינים */
--text:        #2d2420   /* טקסט ראשי — כמעט שחור, חמים */
--muted:       #a8948e   /* טקסט משני — אפרסמון בהיר */
--accent:      #c4607a   /* צבע ראשי — ורוד-אדום */
--accent-dim:  #d4899a   /* accent בהיר יותר — hover, גבולות */
--accent-soft: rgba(196,96,122,0.08)  /* accent כמעט שקוף — selected bg */
--thinking:    #fdf0f3   /* רקע מחשבה של AI */
```

### שימוש
| Token | איפה משתמשים |
|-------|--------------|
| `--accent` | כפתורים ראשיים, בחירה פעילה, קישורים |
| `--accent-dim` | hover states, גבולות של selected cards |
| `--accent-soft` | רקע של selected state (כרטיס נבחר) |
| `--muted` | placeholder, labels, back buttons, metadata |
| `--text` | כל טקסט שהמשתמש קורא בתשומת לב |

---

## 2. פונטים — Typography

Between משתמש בשלושה פונטים עם תפקידים מוגדרים:

| פונט | משתנה | תפקיד |
|------|--------|--------|
| **Cormorant Garamond** | `var(--font-cormorant)` | כותרות, שמות תיאורטיקנים, quotes — הקול הספרותי |
| **Rubik** | `var(--font-rubik)` | ממשק, כפתורים, גוף — פונקציונלי וקריא |
| **David Libre** | `var(--font-david)` | כותרת welcome בלבד — גשר בין עברית ועיצוב |

### כלל: אל תערבבו. Cormorant = עומק. Rubik = עשייה.

---

## 3. סקאלת טיפוגרפיה — Type Scale

| שם | גודל | משקל | פונט | שימוש |
|----|------|------|------|-------|
| `display` | 48px | 300 | Cormorant | אלמנט דקורטיבי (ornament) |
| `heading-xl` | 26px | 300 | Cormorant | שם המוצר בheader — Between |
| `heading-lg` | 22px | 400 | David Libre | כותרת welcome — "מה עולה לך היום?" |
| `heading-md` | 20px | 300 | Cormorant | כותרת session פעילה |
| `heading-sm` | 19px | 300 | Cormorant | prompt בתוך flow — "עם מי תרצה?" |
| `heading-card` | 17–18px | 300 | Cormorant | שמות תיאורטיקנים, שמות mode cards |
| `body-lg` | 15px | 300 | Rubik | הודעות שיחה, שדה קלט |
| `body-md` | 13px | 300–400 | Rubik | UI כללי: sidebar, buttons, lang |
| `body-sm` | 12px | 400 | Rubik | טקסט משני: כפתורי flow, metadata |
| `caption` | 10–11px | 400 | Rubik | labels, disclaimer, timestamps |
| `micro` | 9px | 400 | Rubik | subtitles בתוך כרטיסים (uppercase) |

### עקרון: לא יותר מ-3 גדלים על מסך אחד בו-זמנית.

---

## 4. כפתורים — Button System

### 4.1 וריאנטים

#### Primary — כפתור ראשי
```
bg: var(--accent)
color: #fff
border: none
border-radius: 22px
padding: 11px 36px
font: Rubik 13px / weight 400  (`--fs-body-md`)
hover: opacity 0.87
```
_שימוש:_ Continue, שלח שיחה, כל CTA ראשי.
_כמות:_ כפתור אחד בלבד בגובה המסך.

#### Secondary — כפתור משני
```
bg: var(--surface)
color: var(--text)
border: 1.5px solid var(--border)
border-radius: 22px
padding: 10px 28px
font: Rubik 13px / weight 400
hover: border-color var(--accent-dim)
```
_שימוש:_ Intro conversation, פעולות לא קריטיות.

#### Ghost — כפתור שקוף
```
bg: transparent
color: var(--muted)
border: none
font: Rubik 12px / weight 400
cursor: pointer
hover: color var(--accent)
```
_שימוש:_ ← Back, ביטול, פעולות הרסיביות לא ראשיות.

#### Mode Toggle — pill בחירת מצב
```
container:
  bg: var(--border)          /* track אפרפר */
  border-radius: 22px
  display: flex

option (כל אחד):
  padding: 9px 20px
  font: Cormorant 18px / weight 300
  border-radius: 22px
  color: var(--muted)         /* לא נבחר */

option.selected:
  bg: var(--surface)          /* לבן */
  color: var(--text)
```
_שימוש:_ בחירת Session / Explore במסך הכניסה בלבד.
_כלל:_ שני אפשרויות בלבד. לא להרחיב ל-3+.

#### Theorist Chip — chip בחירת תיאורטיקן
```
width: 128px (קבוע — כל chip שווה, גם לשם קצר)
height: 43px
padding: 10px 0
border-radius: 22px
border: 1.5px solid var(--border)
font: Cormorant 17px / weight 300 / text-align center
selected: border var(--accent), bg var(--accent-soft)

grid: repeat(2, 128px), gap 10px 14px, fit-content, margin auto
```
_שימוש:_ מסך בחירת תיאורטיקן בלבד (לא sidebar).
_כלל:_ 128px קבוע — שמות קצרים (Bion, Klein) ושמות ארוכים (Winnicott) זהים בגודל.

#### Pill — כפתור עגלגל קטן
```
border-radius: 20px
padding: 7px 14px
font: Rubik 12px / weight 300
```
_שימוש:_ Flow buttons ("הפגישה עוד כאן"), Language switch.

---

### 4.2 גדלים — Button Sizes

| גודל | padding | font-size | border-radius | שימוש |
|------|---------|-----------|---------------|-------|
| **XL** | 9px 20px | Cormorant 18px | 22px | Mode toggle options |
| **LG** | 11px 36px | Rubik 13px (`--fs-body-md`) | 22px | Primary CTA (Continue) |
| **MD** | 10px 28px | Rubik 13px | 22px | Secondary actions |
| **SM** | 7px 14px | Rubik 12px | 20px | Pills, flow buttons |
| **XS** | 5px 10px | Rubik 11px | 8px | Sidebar items, tags |

---

## 5. ריווח — Spacing

| token | ערך | שימוש |
|-------|-----|-------|
| `space-xs` | 4px | gap פנימי בתוך כרטיס (שם + subtitle) |
| `space-sm` | 8px | gap בין אלמנטים קטנים, padding sections |
| `space-md` | 12–14px | gap בין כרטיסי תיאורטיקן, padding buttons MD |
| `space-lg` | 20–24px | gap בין blocks ראשיים, padding cards XL |
| `space-xl` | 32px | padding מסך / welcome container |
| `space-2xl` | 52px | הפרדה בין אזורי content גדולים |

---

## 6. Border Radius — עגלגלות

| token | ערך CSS | שימוש |
|-------|---------|-------|
| `radius-xs` | 4px | bubble corner, inline elements |
| `radius-sm` | 8px | sidebar items, tooltips, dropdowns |
| `radius-md` | 12px | theorist cards, small panels |
| `radius-lg` | 16px | input wrap, mode cards, message bubbles |
| `radius-xl` | 22px | כל כפתורי pill |
| `radius-circle` | 50% | avatars |

### כלל: לא יותר מ-2 ערכי radius על אותו מסך.

---

## 7. מסך כניסה — Entry Screen Layout

מסך איחוד בחירת מצב + תיאורטיקן בעמוד אחד.

```
#welcome
  justify-content: flex-start
  padding-top: 32px
  gap: 28px           ← בין בלוק המצב לבלוק התיאורטיקן

  #bw-mode-select
    display: flex / flex-direction: column / align-items: center
    gap: 16px         ← בין heading לטוגל

  #bw-theorist-select
    display: flex / flex-direction: column / align-items: center
    gap: 20px         ← בין chip grid לכפתור Continue
```

### body.bw-selecting — מה מוסתר בזמן בחירה
```css
body.bw-selecting .input-area   { display: none }  /* שדה קלט */
body.bw-selecting #clinical-btn { display: none }  /* כפתור ספה — כלי session בלבד */
```
_כלל:_ כל כלי ש"שייך לsession פעיל" מוסתר בשלבי הבחירה.

---

## 8. בעיות שמצאתי — Open Issues

1. ~~**border-radius בלתי עקבי**~~ — ✅ נפתר במאי 2026. כל ערכים עברו לטוקנים (`--radius-xs/sm/md/lg/xl/circle`). טבלת § 6 עודכנה: radius-lg=16px (לא 14px כפי שנרשם בטעות).

2. ~~**גדלי פונט יותר מדי**~~ — ✅ נפתר במאי 2026. 10 טוקנים הוגדרו ב-`:root` (`--fs-micro` עד `--fs-display`). כל hardcoded `font-size` ב-`globals.css` הוחלפו. ממצאי הגאת הנרמול: 10px→11px (caption), 14px→13px (body-md), 17px→18px (heading-card). יוצא מן הכלל: 64px דקורטיבי — נשאר hardcoded עם comment.

3. ~~**אין כפתור Disabled state**~~ — ✅ נפתר במאי 2026 — ראו פרק States למטה.

4. **Continue button רחב מדי** על mobile — צריך `max-width: 220px; align-self: center`. ✅ קיים ב-`.bw-confirm-btn`.

5. **Back button לא עקבי** — פעם `← חזרה` פעם `← Back` — הקופי צריך לעבור דרך שון.

---

---

## 9. States System

_מיושם ב-`globals.css` תחת "STATES SYSTEM". מאי 2026._

### כלל ה-States
כל אלמנט אינטראקטיבי חייב לתמוך ב-4 states: **default → hover → focus → active**.
אם הוא ניתן לבחירה: גם **selected**. אם הוא תלוי פעולה: גם **disabled** ו-**loading**.

---

### Focus-visible — טבעת פוקוס
**שיטה:** Double-ring — רווח בצבע הרקע + טבעת accent.
```css
box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent-dim);
```
**מיושם על:** `bw-confirm-btn`, `bw-mode-card`, `bw-theorist-card`, `flow-btn`,
`suggestion-btn`, `theorist-tag`, `sb-item`, `memory-indicator`, `#send-btn`.

**כלל:** אף אלמנט אינטראקטיבי חדש לא נכנס לקוד בלי `:focus-visible` — נגישות היא חלק מהסיסטם, לא תוספת.

---

### Disabled
| אלמנט | class / attribute | מראה |
|--------|-------------------|------|
| `.bw-confirm-btn` | `:disabled` או `.bw-disabled` | opacity 0.32, cursor not-allowed |
| כל `button` | `:disabled` | opacity 0.32, cursor not-allowed |

**כשמשתמש ב-JS:** עדיף `button.disabled = true` (attribute native) על `.bw-disabled` (class).

---

### Loading
| אלמנט | class | מראה |
|--------|-------|------|
| `.bw-confirm-btn` | `.bw-loading` | opacity 0.55 + spinner (::after) |

**בקוד (chat.js):**
```javascript
// לפני שמתחילה שיחה
confirmBtn.classList.add('bw-loading');
// אחרי שהשיחה נפתחה
confirmBtn.classList.remove('bw-loading');
```

---

### Error
| אלמנט | class | מראה |
|--------|-------|------|
| `.input-wrap` | `.bw-error` | border + box-shadow באדום-ורוד |

**שימוש:** כשה-API נכשל, כשיש בעיית חיבור. לא לשגיאות קלט — Between לא מאמת שדות.

---

### Active / Pressed
כל הכפתורים מגיבים ב-`scale(0.97–0.98)` ללחיצה.
אסור להוסיף transform נוסף לאלמנטים שכבר יש להם `transform` בהover.

---

## 10. מה הבא

**✅ הושלם (מאי 2026):**
- States system — focus, disabled, loading, error, active
- מערכת אייקונים — `docs/icon-system.md` (Lucide + Unicode, specs, רשימות מאושרות)
- border-radius — כל ערכים בטוקנים, טבלה עודכנה (6 ערכים: xs/sm/md/lg/xl/circle)
- font-size — 10 טוקני `--fs-*` ב-`:root`, כל hardcoded הוחלפו, סקאלה נוקתה

**בתור (עדיפות יורדת):**
1. ~~**תיעוד קומפוננטים**~~ — ✅ נפתר במאי 2026 — ראו `docs/components.md`
2. ~~**גריד ו-breakpoints**~~ — ✅ ראו § 11 למטה (tokens + breakpoint system)

כל screen חדש מתחיל מהסיסטם הזה, לא ממניפסט עיצוב נפרד.

---

## 11. גריד ו-Breakpoints

### 11.1 Layout Tokens

מוגדרים ב-`:root` ב-`globals.css`:

```css
--layout-sidebar:            220px   /* sidebar expanded */
--layout-sidebar-collapsed:   52px   /* sidebar collapsed (icons only) */
--layout-chat-max:            740px   /* max-width chat messages */
--layout-input-max:           800px   /* max-width input area */
--layout-content-max:         900px   /* max-width general content */
```

**כלל:** כל שינוי ב-sidebar width עובר דרך הטוקנים האלה — לא hardcoded.

---

### 11.2 Breakpoint System

שלושה breakpoints. **לא ניתן להשתמש ב-`var()`** בתוך `@media` ב-CSS — הערכים מוגדרים כ-comment בלבד ב-`:root`, ומשתמשים בפיקסלים ישירות.

| שם | ערך | מה משתנה |
|----|-----|----------|
| `--bp-mobile` | **600px** | sidebar נסגר, theorist grid → 2 עמודות 112px, mode card → `--fs-body-lg` |
| `--bp-tablet` | **900px** | sidebar collapse אוטומטי (לא מוגדר עדיין), content שורות צרות |
| `--bp-desktop` | **1200px** | full layout (ברירת מחדל) |

**מה קיים היום:**
```css
@media (max-width: 600px) {
  .bw-mode-card { font-size: var(--fs-body-lg); padding: 8px 18px; }
  #bw-theorist-grid { grid-template-columns: repeat(2, 112px) !important; }
}
```

**מה חסר לפני mobile launch:**
- `@media (max-width: 600px)`: sidebar → `width: 0` + overlay mode
- `@media (max-width: 600px)`: input area padding מצומצם
- `@media (max-width: 900px)`: sidebar starts collapsed

---

### 11.3 Layout Structure

```
╔══════════════════════════════════════════╗
║  #sidebar (220px)  │  #main-content      ║
║                    │  ┌───────────────┐  ║
║  .sb-item          │  │ header        │  ║
║  .sb-section-label │  ├───────────────┤  ║
║                    │  │ #chat         │  ║
║  220px / 52px      │  │ max-w: 740px  │  ║
║  transition: 0.2s  │  ├───────────────┤  ║
║                    │  │ .input-area   │  ║
║                    │  │ max-w: 800px  │  ║
║                    │  └───────────────┘  ║
╚══════════════════════════════════════════╝
```

**direction:** הכל `rtl` — sidebar בצד ימין, chat column בצד שמאל.

---

_גרסה 1.1 · מאיה · מאי 2026_
