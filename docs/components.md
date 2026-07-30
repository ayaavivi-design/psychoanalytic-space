# תיעוד קומפוננטים — Between
_מסמך זה הוא מקור האמת לכל קומפוננט בממשק. קוראים לפני שנוגעים._
_עודכן: מאי 2026_

---

## עקרון

**אין קומפוננט חדש לפני שבדקת שלא קיים כבר אחד דומה.**
כל קומפוננט שכאן מוגדר — אסור להמציא גרסה מקבילה שלו.

---

## 1. Bubble — בועת הודעה

שני variants. ה-markup זהה, ה-CSS שונה לפי context.

### 1.1 User bubble
```css
.message.user .message-body {
  display: inline-block;
  background: var(--accent-soft);           /* rgba(196,96,122,0.08) */
  border: 1px solid rgba(196,96,122,0.12);
  border-radius: var(--radius-lg) var(--radius-xs) var(--radius-lg) var(--radius-lg);
  /* 16px  4px  16px  16px — פינה ימנית עליונה קטנה */
  padding: 10px 16px;
  font-family: var(--font-rubik), sans-serif;
  font-size: var(--fs-body-lg);   /* 15px */
  font-weight: 300;
  color: var(--text);
  text-align: right;
}
```

### 1.2 Assistant bubble
```css
.message.assistant .message-body {
  background: rgba(253,248,246,0.7);        /* בין --bg ל-surface */
  border: 1px solid var(--border);
  border-radius: var(--radius-xs) var(--radius-lg) var(--radius-lg) var(--radius-lg);
  /* 4px  16px  16px  16px — פינה שמאלית עליונה קטנה */
  padding: 14px 18px;
  font-size: var(--fs-body-lg);   /* 15px */
  font-weight: 300;
  box-shadow: 0 1px 4px rgba(45,36,32,0.04);
}
```

### 1.3 Role label
```css
.message-role {
  font-size: var(--fs-caption);   /* 11px */
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  opacity: 0.7;
}
```

### 1.4 Attribution (theorist signature)
```css
.attribution {
  margin-top: 10px;
  font-size: var(--fs-caption);   /* 11px */
  color: var(--accent-dim);
  font-style: italic;
  letter-spacing: 0.05em;
}
```

### 1.5 Thinking indicator
```html
<div class="thinking-indicator">
  <div class="thinking-dot"></div>
  <div class="thinking-dot"></div>
  <div class="thinking-dot"></div>
</div>
```
3 נקודות 4×4px, animation `blink` עם delay 0 / 0.2s / 0.4s. צבע `var(--accent-dim)`.

### ❌ מה אסור
- לא לשנות את ה-border-radius — הפינה הקטנה היא עיצוב מכוון (speech bubble direction)
- לא להוסיף background צבעוני ל-assistant — רק הגוון הכמעט-שקוף הנוכחי
- לא לשנות line-height מ-1.85 — זה ריווח שנבחר ספציפית לקריאה בעברית

---

## 2. Input — שדה קלט

מבנה קבוע: `input-area-outer > input-area > input-wrap > (#user-input + #send-btn)`.

```css
.input-area-outer {
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: center;
}
.input-area {
  padding: 20px 32px 24px;
  max-width: 800px;
  width: 100%;
}
.input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);        /* 16px */
  padding: 10px 10px 10px 16px;
  box-shadow: 0 2px 8px rgba(45,36,32,0.06);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-wrap:focus-within {
  border-color: var(--accent-dim);
  box-shadow: 0 2px 12px rgba(196,96,122,0.1);
}
.input-wrap.bw-error {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(196,96,122,0.15);
}
#user-input {
  flex: 1;
  background: none;
  border: none;
  font-size: var(--fs-body-lg);   /* 15px */
  font-weight: 300;
  line-height: 1.85;
  min-height: 26px;
  max-height: 140px;
  direction: rtl;
  resize: none;
}
#user-input::placeholder { color: var(--accent-dim); opacity: 0.6; }
```

### Send button
```css
#send-btn {
  width: 40px; height: 40px; min-width: 40px;
  border-radius: var(--radius-circle);
  background: var(--accent);
  color: rgba(255,255,255,0.88);
}
#send-btn:hover { background: #b0506a; transform: scale(1.04); }
#send-btn:disabled { opacity: 0.25; cursor: not-allowed; transform: none; }
```

### States
| state | CSS | תיאור |
|-------|-----|-------|
| default | `.input-wrap` | border: var(--border) |
| focus | `.input-wrap:focus-within` | border: var(--accent-dim), shadow ורדרד |
| error | `.input-wrap.bw-error` | border + shadow בaccent — לשגיאת API בלבד |
| hidden | `data-bw-hidden` attr | נסתר בשלבי הבחירה |

### ❌ מה אסור
- לא לשנות `direction: rtl` ב-`#user-input` — גורם לבעיות ב-Hebrew/mixed text
- לא להוסיף `resize` — `resize: none` מכוון

---

## 3. Sidebar Item — פריט בסייד-בר

```html
<div class="sb-item [active]">
  <span class="sb-icon">
    <!-- Lucide React icon: size={15} strokeWidth={1.75} -->
    <!-- OR: <span class="sb-icon" style="font-size:14px;line-height:1">◎</span> -->
  </span>
  <span class="sb-label">טקסט</span>
</div>
```

```css
.sb-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border-radius: var(--radius-sm);   /* 8px */
  font-size: var(--fs-body-md);      /* 13px */
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s;
}
.sb-item:hover  { background: rgba(196,96,122,0.06); }
.sb-item.active { color: var(--accent); background: rgba(196,96,122,0.08); }
.sb-icon { width: 20px; min-width: 20px; color: var(--muted); }
.sb-item:hover .sb-icon,
.sb-item.active .sb-icon { color: var(--accent); }
```

### Section label
```css
.sb-section-label {
  font-size: var(--fs-caption);   /* 11px */
  color: var(--muted);
  padding: 8px 14px 2px;
  letter-spacing: 0.07em;
}
```

### Touch target
הפריט עצמו מקבל `min-height: 44px` דרך ה-padding + line-height הטבעי.
**בדיקה:** `getBoundingClientRect().height >= 44px`.

### ❌ מה אסור
- לא לדרוס את צבע `.sb-icon` inline — ה-CSS מנהל אותו (default → hover → active)
- יוצא מן הכלל: סמלים שמייצגים state פעיל (Naval) מקבלים `color: var(--accent)` ישירות

---

## 4. Modal — Overlay

Between משתמש ב-overlay פשוט, לא ב-dialog HTML. כל המודלים בנויים אותו דבר.

### מבנה
```html
<div id="[modal-id]" class="modal-overlay" style="display:none;">
  <div class="modal-box">
    <div class="modal-content">...</div>
    <div class="modal-actions">
      <button class="bw-confirm-btn">פעולה ראשית</button>
    </div>
  </div>
</div>
```

### CSS pattern
```css
/* Overlay */
position: fixed;
inset: 0;
background: rgba(45,36,32,0.3–0.5);   /* תלוי בחומרת ה-interruption */
backdrop-filter: blur(4px);            /* רק ב-panels כבדים */
z-index: 100–200;
display: flex;
align-items: center;
justify-content: center;

/* Box */
background: var(--surface);
border-radius: var(--radius-sm);       /* 8px */
padding: 28px–32px;
max-width: 440px–560px;
width: 90%;
box-shadow: 0 8px 40px rgba(0,0,0,0.18);
```

### מודלים קיימים
| ID | שימוש | z-index |
|----|-------|---------|
| `#memory-panel` | זיכרונות — panel צד | 100 |
| `#supervision-panel` | פיקוח קליני | 200 |
| `#privacy-modal` | מדיניות פרטיות | 200 |
| `#choose-popup` | בחירת תיאורטיקן | 150 |

### ❌ מה אסור
- לא להשתמש ב-`<dialog>` HTML — הפרויקט לא משתמש בו
- לא להוסיף מודל חדש בלי לבדוק שאחד מהקיימים לא מתאים

---

## 5. Tooltip — כלי hover

הטולטיפ ב-Between הוא **React component** עם fixed positioning — לא CSS `::after`.

### Implementation (page.tsx)
```tsx
// State
const [tooltip, setTooltip] = useState<{...} | null>(null);

// Trigger
onMouseEnter={(e) => setTooltip({ x: ..., y: ..., data: theorist })}
onMouseLeave={() => setTooltip(null)}

// Render
{tooltip && (
  <div style={{
    position: 'fixed',
    left: tooltip.x, top: tooltip.y,
    padding: '4px 12px',
    borderRadius: 'var(--radius-xl)',   /* 22px */
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    boxShadow: '0 4px 16px rgba(45,36,32,0.1)',
    transition: 'all 0.18s',
    zIndex: 999,
    pointerEvents: 'none',
  }}>
    {/* content */}
  </div>
)}
```

### מה הטולטיפ מציג לתיאורטיקנים
שלושה שדות: גישה (approach), מושגים (concepts), עבור מי (forWhom).

### ❌ מה אסור
- לא לצור `::after` tooltip ב-CSS — זה מוגבל, לא תומך ב-RTL, לא נגיש
- לא להוסיף `pointer-events: auto` — הטולטיפ תמיד `pointer-events: none`
- לא לשנות את ה-`position: fixed` ל-`absolute` — ייגרם clipping ב-overflow containers

---

## 6. Flow Buttons — כפתורי בחירת נקודת מוצא

כפתורים שמוצגים כשמתחילים שיחה (בחירת context).

```css
.flow-btn {
  width: 100%;
  max-width: 340px;
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);   /* 22px */
  padding: 11px 28px;
  font-size: var(--fs-body-md);      /* 13px */
  font-weight: 300;
}
.flow-btn:hover,
.flow-btn.flow-btn-hover {
  background: var(--accent-soft);
  border-color: var(--accent);
}
```

**הטקסטים** — מוגדרים ב-`public/onboarding-config.json`. לא hardcoded בקוד.

---

## 7. Suggestion Bubbles — הצעות המשך

קבוצת כפתורים קטנים שמציעים המשך אחרי תגובת AI.

```css
#suggestion-bubbles {
  display: flex;
  gap: var(--space-sm);     /* 8px */
  flex-wrap: wrap;
  justify-content: flex-end;
  direction: rtl;
}
.suggestion-btn {
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);   /* 22px */
  padding: 6px 14px;
  font-size: var(--fs-body-md);      /* 13px */
  font-weight: 300;
  color: var(--muted);
  white-space: nowrap;
}
.suggestion-btn:hover {
  background: var(--accent-soft);
  border-color: var(--accent-dim);
  color: var(--text);
}
/* גרסה עדינה */
#suggestion-bubbles.subtle .suggestion-btn {
  font-size: var(--fs-caption);   /* 11px */
  padding: 4px 10px;
  opacity: 0.6;
}
```

---

_שאלות על implementation → /dev (Oliver)_
_שאלות על עיצוב חדש → /maya_
_שאלות על קופי בכפתורים → /shaun_
