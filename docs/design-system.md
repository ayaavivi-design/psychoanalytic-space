# Between — Design System
_Maya, Head of UX/UI · May 2026_

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
font: Rubik 14px / weight 400
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
| **LG** | 11px 36px | Rubik 14px | 22px | Primary CTA (Continue) |
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

| token | ערך | שימוש |
|-------|-----|-------|
| `radius-sm` | 8px | sidebar items, tooltips, dropdowns |
| `radius-md` | 12px | theorist cards, message bubbles |
| `radius-lg` | 14px | mode cards |
| `radius-pill` | 20–22px | buttons ראשיים, flow buttons, input |
| `radius-circle` | 50% | avatars, circular action buttons |

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

1. **border-radius בלתי עקבי** — 8, 12, 14, 16, 20, 22, 24px בשימוש בו-זמנית. צריך לאחד ל-5 ערכים בלבד (ראו טבלה למעלה).

2. **גדלי פונט יותר מדי** — 14 גדלים שונים. למשל: 15px ו-14px קיימים זה לצד זה בלי הבחנה ברורה. לאחד ל-9 גדלים מהסקאלה.

3. **אין כפתור Disabled state** — כשהמשתמש לא יכול להמשיך (לא בחר תיאורטיקן, input ריק) — אין עיצוב אחיד לmissing state.

4. **Continue button רחב מדי** על mobile — צריך `max-width: 220px; align-self: center`.

5. **Back button לא עקבי** — פעם `← חזרה` פעם `← Back` — הקופי צריך לעבור דרך שון.

---

## 8. מה הבא

לפני שממשיכים לבנות כלים חדשים — ממליצה לאוליבר לקחת את הסקאלה הזו ולעדכן את globals.css:
- לסגור את בעיות הborder-radius (unify)
- להוסיף את ה-spacing ו-radius כ-CSS custom properties

כל screen חדש מתחיל מהסיסטם הזה, לא ממניפסט עיצוב נפרד.

---
_גרסה 1.0 · מאיה · מאי 2026_
