# Mobile Header — Redesign Spec (hand-off)
_Between · 23.07.2026 · מסמך hand-off ל-Claude Design_
_מקור הערכים: `app/globals.css` (live) · ספק עיצובי: מאיה · החלטות: איה_

> **Abstract (EN):** Between is a Hebrew, RTL psychoanalytic web app used between therapy sessions. The mobile top-bar (iPhone Safari, ≤600px) became overcrowded after a change — six elements in one row, and the wordmark "Between" is clipped off the right edge. This spec defines the target: a clean 3-element mobile header (identity + two actions), with secondary controls moved into an existing account menu. Desktop must not change. All values must map to the design tokens below; reuse existing components — do not invent new ones.

---

## 1. ההקשר

- **המוצר:** מרחב פסיכואנליטי לזמן שבין פגישות טיפול. עברית, RTL, אינטימי (כמו מכתב — לא טכנולוגי).
- **המשטח לתיקון:** שורת הכותרת העליונה במובייל בלבד (iPhone Safari, breakpoint ≤ 600px).
- **מה לא נוגעים בו:** **הכותרת בדסקטופ עובדת — אסור לשנות אותה.** התיקון כולו בתוך `@media (max-width: 600px)`.

---

## 2. הבעיה (מצב נוכחי)

שורת הכותרת במובייל מנסה להחזיק **6 אלמנטים** בשורה אחת ברוחב 375px, משמאל לימין:

`✎ (שיחה חדשה) · ? (תמיכה) · 🌐 (שפה) · [שיחת היכרות — pill ורוד רחב] · A (אווטאר) · Between (שם המוצר)`

**חשבון רוחב @375px:**

| אלמנט | רוחב מוערך |
|---|---|
| ✎ new-chat | 44 |
| ? support | 44 |
| 🌐 language | ~40 |
| "שיחת היכרות" (pill) | ~130 |
| A avatar | 44 |
| Between (wordmark) | ~95 |
| padding + gaps | ~60 |
| **סה"כ** | **~457px** |

עודף של **~80px** → שם המוצר "Between" (שנמצא אחרון בסדר הפריסה במובייל) **נדחק מחוץ למסך ונחתך** ("Betwee").

**שורש הבעיה:** אין היררכיה — הכותרת הפכה ל"מדף" שמחזיק כל כפתור שהיה בדסקטופ. כותרת של טלפון צריכה להחזיק **זהות + 2 פעולות ראשיות, לא יותר.**

---

## 3. המטרה (הספק)

כותרת מובייל ב-**3 חלקים בלבד**:

```
┌────────────────────────────────────┐
│  Between                 ✎    (A)  │
│  זהות / identity        חדש   חשבון │
└────────────────────────────────────┘
```

1. **"Between" = עוגן הזהות. שלם תמיד, לא נחתך לעולם.** מעוגן בצד (לא ממורכז-צף כמו בדסקטופ). `white-space: nowrap`.
2. **צד הפעולות = ✎ + A בלבד** — שני targets של 44×44px, מקובצים יחד.
3. **כל השאר יורד לתוך תפריט החשבון (A):**
   - `?` (תמיכה) → פריט בתפריט
   - `🌐` (החלפת שפה עב/אנ) → פריט בתפריט
   - **"שיחת היכרות" (intake) → פריט בתפריט, באזור ההגדרות** ← _החלטת איה (23.07): "להכניס את האינטייק לתוך הסטינגס"._

> intake הוא CTA של onboarding **למטופל חדש בלבד** (נעלם אחרי השלמה). חייב להישאר נגיש — לכן נכנס לתפריט, לא מוסתר.

---

## 4. תפריט החשבון (כבר קיים בקוד — `#bw-account-menu`)

נפתח בלחיצה על האווטאר (A). כרגע מכיל:
- **כלים:** חיפוש רשת · סיכום התייעצות · הורד PDF (מופיע רק בתוך שיחה)
- **חשבון:** הגדרות · התנתק

**מה מתווסף אליו** (הספק): `?` תמיכה · `🌐` שפה · **שיחת היכרות** (באזור החשבון/הגדרות, מטופל-חדש בלבד).
כל הפריטים מבוססי-persona: מטופל לא רואה כלי-מטפל.

---

## 5. Design Tokens (live — מ-`app/globals.css`)

**⚠️ כל ערך בעיצוב חייב להיות אחד מאלה. אין להמציא ערכים.**

### צבעים
| טוקן | ערך |
|---|---|
| `--bg` | `#f3e7e2` (רקע רוז חם) |
| `--surface` | `#fffaf8` |
| `--border` | `#e6d6cf` |
| `--text` | `#2d2420` |
| `--muted` | `#74645e` |
| `--accent` | `#c4607a` (ורוד עמוק — המותג) |
| `--accent-dim` | `#d4899a` |
| `--accent-deep` | `#a8475f` |
| `--accent-soft` | `rgba(196,96,122,0.08)` |
| `--thinking` | `#ecc7d4` |

### ריווח (Spacing)
`--space-xs 4` · `--space-sm 8` · `--space-md 12` · `--space-lg 20` · `--space-xl 32`

### עגלגלות (Radius)
`--radius-xs 4` · `--radius-sm 8` (dropdowns/items) · `--radius-md 12` · `--radius-lg 16` · `--radius-xl 22` (pill buttons) · `--radius-circle 50%` (avatars)

### טיפוגרפיה
- **גופנים:** Cormorant (כותרות/עומק) · Rubik (גוף/עשייה). **לא לערבב.**
- מידות: `--fs-caption 11` · `--fs-body-sm 12` · `--fs-body-md 13` (UI/כפתורים) · `--fs-body-lg 15` · `--fs-heading-card 18` · `--fs-heading-md 20` · `--fs-heading-lg 22` · `--fs-heading-xl 26` (שם המוצר).
- משקלים: light 300 · regular 400 · medium 500.

### Breakpoints
`600px` (מובייל — טלפון) · `900px` (טאבלט) · `1200px` (דסקטופ). **התיקון כולו ב-≤600px.**

---

## 6. חוקים מחייבים (UX-RULES)

1. **שימוש חוזר לפני חידוש** — הכותרת, האווטאר, פריטי-התפריט (`.sb-item`), התפריט (`#bw-account-menu`) — **כולם כבר קיימים**. להשתמש בהם, לא לבנות חדשים.
2. **כל ערך = טוקן.** ערך שלא ברשימה למעלה = סטייה.
3. **Touch target ≥ 44×44px** לכל אלמנט לחיץ.
4. **RTL** — הממשק עברי; אלמנטים לא הפוכים. (שורת הכותרת עצמה `dir=ltr` כי "Between" הוא wordmark לטיני, אבל תוכן התפריט עברי RTL.)
5. **אסור לחתוך טקסט** — במיוחד לא את שם המותג.
6. **דסקטופ לא משתנה.**
7. **אייקונים:** Lucide בגודל `size=15, strokeWidth=1.75` (או 16 בכותרת) — ✎=PenLine, 🌐=Globe, ?=טקסט. סמלי Unicode ייחודיים רק מהרשימה המאושרת.

---

## 7. מה מבקשים מ-Claude Design

כיוון עיצובי / mockup לכותרת מובייל @375 ו-@393 שפותר את הצפיפות לפי המטרה בסעיף 3:
- פריסת ה-3 חלקים (Between שלם + ✎/A) — מרווחים, יישור, גדלים מדויקים בטוקנים.
- מצב **התפריט פתוח** (איך ?/🌐/intake יושבים בו, כולל היררכיית הסקשנים).
- לא נדרש קוד — spec/mockup ויזואלי מבוסס-טוקנים. המימוש ייעשה אצלנו (Oliver) לפי הכיוון.
