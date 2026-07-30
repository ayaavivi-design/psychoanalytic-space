# מערכת אייקונים — Between
_מסמך זה הוא מקור האמת לאייקונים. כל מי שמוסיף אייקון — קורא אותו._
_עודכן: מאי 2026_

---

## שתי שפות אייקונים — ולמה

Between משתמש בשתי מערכות אייקונים שונות **בכוונה**:

| שפה | מתי משתמשים | דוגמאות |
|-----|-------------|---------|
| **Lucide React** | פעולות UI סטנדרטיות — מה שהמשתמש *עושה* | שמור, הורד, פתח, סגור, שפה |
| **Unicode symbols** | כלים ייחודיים ל-Between — מה שהמשתמש *נמצא בו* | סיכום סשן, פיקוח, רפלקציה |

**הכלל:**
- אם האייקון קיים ב-Lucide ומתאים — השתמש ב-Lucide.
- אם מדובר בכלי שמגדיר את Between (קליני, אנליטי, מכשירי) — השתמש ב-Unicode symbol מהרשימה המאושרת למטה.
- **לעולם אל תמציא Unicode symbol חדש** מחוץ לרשימה.

---

## Lucide React — אייקוני ממשק

### ספציפיקציה קבועה
```tsx
size={15}
strokeWidth={1.75}
```
**כלל:** כל אייקון Lucide בממשק Between — בדיוק `size={15} strokeWidth={1.75}`. לא 16, לא 14, לא 2.

### רשימת האייקונים המאושרים

| אייקון | שם Lucide | שימוש |
|--------|-----------|-------|
| ✏️ | `PenLine` | שיחה חדשה |
| 🌐 | `Globe` | חיפוש אינטרנט |
| 🧠 | `Brain` | זיכרונות |
| ⬇️ | `Download` | הורדת PDF |
| 📖 | `BookOpen` | — |
| ⚙️ | `Settings` | הגדרות |
| 🚪 | `LogOut` | יציאה |
| 🌍 | `Languages` | החלפת שפה |
| ⌄ | `ChevronDown` | dropdown |

### כשצריך אייקון Lucide חדש
1. בדוק ב-[lucide.dev](https://lucide.dev) שהאייקון קיים
2. השתמש בדיוק ב: `size={15} strokeWidth={1.75}`
3. הוסף לטבלה למעלה

---

## Unicode Symbols — כלים ייחודיים ל-Between

### ספציפיקציה קבועה
```tsx
<span className="sb-icon" style={{ fontSize: 14, lineHeight: 1 }}>SYMBOL</span>
```
**כלל:** כל Unicode symbol ב-Between — בדיוק `fontSize: 14, lineHeight: 1`. לא 12, לא 15.

### רשימת הסמלים המאושרים

| סמל | Unicode | שם | שימוש |
|-----|---------|-----|-------|
| `◎` | U+25CE | BULLSEYE | סיכום סשן |
| `◉` | U+25C9 | FISHEYE | מה לקחתי מהשיחה |
| `⚲` | U+26B2 | NEUTER | פיקוח קליני |
| `◌` | U+25CC | DOTTED CIRCLE | אנונימיזציה |
| `◈` | U+25C8 | WHITE DIAMOND | השוואת תיאורטיקנים |
| `⬡` | U+2B21 | WHITE HEXAGON | חדר הבורד / Naval |
| `💬` | U+1F4AC | SPEECH BUBBLE | שיחה קיימת בסייד-בר |

### כשנדרש סמל חדש לכלי Between
לא בוחרים לבד. שלב חובה:
1. `/shaun` — מאשר שהסמל מתאים לשפה של Between
2. `/maya` — מאשרת את המיקום בממשק
3. מוסיפים לטבלה כאן לפני שנכנס לקוד

---

## צבע

שני הסוגים מקבלים את אותו הצבע דרך ה-CSS של `.sb-icon`:

```css
.sb-icon { color: var(--muted); }
.sb-item:hover .sb-icon,
.sb-item.active .sb-icon { color: var(--accent); }
```

**כלל:** לא לדרוס את הצבע inline — ה-CSS מנהל אותו.
יוצא מן הכלל: סמלים שמייצגים **מצב פעיל** (כמו Naval) — מקבלים `color: var(--accent)` ישירות.

---

## גודל ה-touch target

גם אם האייקון קטן (15px) — ה-`.sb-item` שעוטף אותו חייב להיות לפחות 44×44px.
האייקון עצמו קטן. המרחב הלחיץ — לא.

---

## Persona Icons — ורה ואליוט

אייקוני פרסונה ייחודיים לכרטיסי הבחירה **במצב סשן בלבד** — מחליפים את 4 כרטיסי הפסיכואנליטיקנים. מצב מחקר לא משתנה. אינם שייכים ל-Lucide ואינם Unicode — SVG מותאם אישית בלבד, מוטמע ב-`page.tsx` בלבד (לא ב-`chat.js`).

### ספציפיקציה
```tsx
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
strokeWidth={1.5}
strokeLinecap="round"
```
צבע: `currentColor` דרך CSS — `var(--muted)` במנוחה, `var(--accent)` ב-hover/active.

### Vera — ראש + קוקו גבוה
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round">
  <!-- bun -->
  <circle cx="12" cy="5.5" r="2"/>
  <!-- head -->
  <circle cx="12" cy="11" r="3.5"/>
  <!-- shoulders -->
  <path d="M6 21c0-3 2.7-5 6-5s6 2 6 5"/>
</svg>
```

### Elliot — ראש + שיער קצר
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
     stroke-width="1.5" stroke-linecap="round">
  <!-- short hair arc -->
  <path d="M8.5 9.5C8.5 7 10 6 12 6s3.5 1 3.5 3.5"/>
  <!-- head -->
  <circle cx="12" cy="11" r="3.5"/>
  <!-- shoulders -->
  <path d="M6 21c0-3 2.7-5 6-5s6 2 6 5"/>
</svg>
```

### כללים
- שני האייקונים מוטמעים ב-`page.tsx` בלבד — לא ב-`chat.js`
- גודל container הכרטיס לפי design tokens (כמו כרטיסי תיאורטיקן)
- לא לשנות את ה-SVG paths ללא אישור מאיה

---

## מה אסור

- ❌ אייקון Lucide בגודל שונה מ-`size={15} strokeWidth={1.75}`
- ❌ Unicode symbol מחוץ לרשימה המאושרת — גם אם "נראה מתאים"
- ❌ אמוג'י בממשק (מלבד `💬` שכבר קיים ומאושר)
- ❌ SVG inline ב-chat.js — כל אייקון חדש נכנס דרך page.tsx או כ-Symbol מאושר
- ❌ אייקון ללא `.sb-icon` wrapper בסייד-בר — הרמה וה-CSS חייבים להיות עקביים

---

_שאלות על בחירת סמל → /shaun + /maya_
_שאלות על implementation → /dev (Oliver)_
