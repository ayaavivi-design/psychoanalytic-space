# Guardrails — מיפוי מלא

_עדכון: מאי 2026 | מבוסס על: `app/api/chat/route.ts`, `lib/theorist-voices.ts`, `app/api/start-conversation/route.ts`, `app/api/anonymize/route.ts`, `app/api/supervise/route.ts`_

---

## מה זה גארדריילס?

גארדריילס הם כל המנגנונים שמונעים מהמוצר לחרוג מהגבולות שהגדרנו — קליניים, בטיחותיים, ותפעוליים.
הם פועלים בשלוש שכבות: **קוד קשיח** (לא עובר דרך המודל), **הנחיות מערכת** (נשלחות למודל), **לולאות אכיפה** (בדיקה בדיעבד ותיקון).

---

## קטגוריה 1 — בטיחות ומשבר (Safety / Crisis)

### ✅ מה קיים

**מיירט משבר (Hard Intercept)** — `app/api/chat/route.ts`, שורות 8–196

- רץ **ראשון**, לפני RAG ולפני כל קריאה לאנתרופיק
- 34 מילות מפתח בעברית: מחשבות אובדניות מפורשות ועקיפות, ביטויים קולוקוויאליים, ניסוחים עדינים שנוספו לאחר מקרה פרודקשן מה-6.5.2026
- 14 מילות מפתח באנגלית
- תגובת חירום קבועה (לא מהתיאורטיקן): ER"N 1201, סה"ר, מד"א 101, פנייה למטפל
- מחזיר מיד — השיחה לא ממשיכה
- לוג: `[SAFETY] זוהה תוכן אובדני — interceptor פעל`

**תחום הכלי — הצהרה מפורשת** — `UNIVERSAL_SCOPE_INSTRUCTION` (מוזרק לכל prompt)

```
"I'm not in therapy but I need someone to talk to"
→ name this explicitly: this space is designed to be used alongside a therapist, not instead of one.
```

**בכל פרומפט תיאורטיקן בנפרד:**
- "If the material requires clinical intervention — say so plainly, step out of character, and refer to professional help."
- "NOT a therapist. NOT a crisis tool."

---

### ❌ פערים — בטיחות ומשבר

| פער | חומרה | הסבר |
|-----|--------|-------|
| אין log/alert יוצא | גבוהה | מיירט המשבר מדפיס ל-console בלבד — המייסדת לא יודעת כמה מקרים קרו השבוע |
| אין זיהוי "חוזר למשבר" | בינונית | משתמש שגירה את המיירט 3 פעמים ביום — אין זיהוי של דפוס |
| מיירט המשבר מכסה רק הודעה אחרונה | בינונית | `extractLastUserText` בודק רק את ההודעה האחרונה — לא את ההקשר הכולל |
| אין אימות גיל | נמוכה-בינונית | מוצר פסיכואנליטי קליני ללא שום בדיקה שהמשתמש הוא מבוגר |

---

## קטגוריה 2 — גבולות קליניים (Scope)

### ✅ מה קיים

**UNIVERSAL_SCOPE_INSTRUCTION** — מוזרק לכל קריאת API:
- מגדיר: לא מטפל, לא תחליף לטיפול
- מגדיר: לא אסטרטגיות התמודדות
- מגדיר: מה קורה כשמגיע מי שאינו בטיפול
- לא ניתן לעקיפה על-ידי המשתמש (בצד שרת)

**"WHAT YOU ARE NOT"** — בכל פרומפט תיאורטיקן:

| תיאורטיקן | מה נאסר עליו |
|-----------|--------------|
| פרויד | ויניקוט (holding/True Self), קליין (phantasy ראשוני), קוהוט (mirroring), relational (מערכת יחסים כריפוי) |
| קליין | ויניקוט, קוהוט, relational |
| ויניקוט | קליין (interpretations מוקדמות), פרויד (ניטרליות קלאסית) |
| + אחרים | כל תיאורטיקן מגדיר מה הוא לא |

**Situation B — הגנת המטפל:**
- "Speak about their therapist in the THIRD PERSON throughout"
- "Do not take sides"
- "המטפל שלך" not "המטפל שלי"

---

### ❌ פערים — גבולות קליניים

| פער | חומרה | הסבר |
|-----|--------|-------|
| "לא בטיפול" — גארדריל רך בלבד | בינונית | אם המודל נכשל — אין fallback קשיח. הכל תלוי בשיקול המודל |
| אין זיהוי שימוש שאינו מיועד (קליני) | נמוכה | מישהו שמשתמש ב-Between לייעוץ עסקי/משפטי — אין חסימה |

---

## קטגוריה 3 — איכות פלט (Output Quality)

### ✅ מה קיים

**לולאת אכיפה — שאלה אחת בלבד** (`enforceOneQuestion`):
- סופר סימני שאלה
- אם יותר מ-1 — שולח למודל שוב עם הנחייה לתקן
- מחזיר את הגרסה המתוקנת

**לולאת אכיפה — פתיחה מגוונת** (`enforceVariedOpening`):
- בודק אם מילת הפתיחה זהה לתגובה הקודמת
- אם כן — שולח למודל שוב לתיקון
- מחזיר גרסה מתוקנת

**הגבלת טוקנים:**
- `/api/chat`: `max_tokens: 1200`
- `/api/supervise`: `max_tokens: 3000`
- `/api/anonymize`: `max_tokens: 2000`
- `/api/session-summary`: `max_tokens: 1500`

**בכל פרומפט תיאורטיקן:**

| גארדריל | הסבר |
|---------|-------|
| FORBIDDEN OPENERS | רשימת פתיחות אסורות (echo-back, "מה שאמרת הוא...") |
| FORBIDDEN STRUCTURE | אין echo-back של מה שנאמר |
| Stage directions forbidden | אין "(נהיה שקט)", "(מנסה להבין)" |
| No body language | אין תיאורי שפת גוף |
| First response: no interpretation | אסור לפרש בתגובה הראשונה — קודם לשמוע |
| Don't repeat interpretations | פרשנות שניתנה לא ניתנת שוב |
| Don't push before the patient is ready | קצב — לא לפני שהחומר ברור |
| Complaint recognition | לא כל תלונה היא חומר טיפולי — לפעמים היא פידבק נכון |
| No teaching theory | אין הרצאות תיאורטיות בתוך השיחה |
| No lecturing | אין הסברים ארוכים |

---

### ❌ פערים — איכות פלט

| פער | חומרה | הסבר |
|-----|--------|-------|
| לולאת האכיפה לא מוגבלת בניסיונות | נמוכה | אם enforceOneQuestion מחזיר עדיין 2 שאלות — אין ניסיון שני |
| אין גארדריל על אורך הודעת משתמש | נמוכה-בינונית | הודעה ארוכה מאוד (10,000 מילים) תעבד בלי הגבלה |
| web search לא עובר validation | נמוכה | כשwebSearch=true — enforceOneQuestion/enforceVariedOpening לא רצים |

---

## קטגוריה 4 — שפה ומגדר (Language & Gender)

### ✅ מה קיים

**כלל שפה קשיח** — בכל פרומפט, עם HARD STOP:
```
0. LANGUAGE — HARD STOP:
English → 100% English, zero Hebrew.
Hebrew → 100% Hebrew, zero English.
If you find even one word in the wrong language — DELETE and rewrite.
```

**אכיפת מגדר:**
- כל מילת פנייה — כינוי גוף, פועל, שם תואר — חייבת להתאים למגדר המטופל
- "Masculine patient: אתה חושש (not את חוששת)... One wrong form — fix entire response"
- Self-check מפורש בכל תיאורטיקן

**זיהוי מצב (A/B/C) — פנימי בלבד:**
- "CRITICAL — INTERNAL IDENTIFICATION ONLY: Never write This is Situation A/B/C"
- HARD CHECK בכל checklist: אם נרשם תווית — מחק הכל

---

### ❌ פערים — שפה ומגדר

| פער | חומרה | הסבר |
|-----|--------|-------|
| מגדר מגיע מהגדרות משתמש (אם הוגדרו) | נמוכה | אם המשתמש לא הגדיר מגדר — המודל צריך להסיק מהטקסט, אין גארדריל קשיח |
| אין בדיקת שפה בצד שרת | נמוכה | בדיקת השפה תלויה לגמרי בהוראות למודל — אין validation קוד |

---

## קטגוריה 5 — גישה ושימוש (Access & Usage)

### ✅ מה קיים

**הגבלת שיחות** — `app/api/start-conversation/route.ts`:
- `MAX_CONVERSATIONS = 3` לכל משתמש בפרודקשן
- מחזיר 403 כשעוברים את המגבלה
- Admin bypass (מייסדת + `is_admin=true` במטאדאטה)
- Dev mode bypass

**אימות JWT** — `/api/start-conversation`:
- דורש `Authorization: Bearer <token>`
- אימות דרך Supabase
- 401 אם חסר/לא תקין

**הפרדת נתונים:**
- כל שיחה שייכת ל-`user_id` ב-Supabase
- RLS מגן על נתוני משתמשים
- `service_role` בלבד לגישה ל-`knowledge_chunks`

---

### ❌ פערים — גישה ושימוש

| פער | חומרה | **דחוף** |
|-----|--------|----------|
| `/api/chat` ללא אימות | **קריטי** | **כן** — כל מי שמוצא את ה-URL יכול להשתמש ב-API בחינם, ללא הגבלת שיחות |
| `/api/anonymize` ללא אימות | גבוהה | כן — endpoint ציבורי שקורא לאנתרופיק בלי אימות |
| `/api/supervise` ללא אימות | גבוהה | כן — endpoint ציבורי |
| `/api/session-summary` ללא אימות | גבוהה | לא נבדק — ככל הנראה כנ"ל |
| אין rate limiting | גבוהה | כן — אין הגבלת בקשות לדקה/לשעה. DDoS עלות |
| ניתן לעקוף MAX_CONVERSATIONS | גבוהה | כן — קוראים ישירות ל-/api/chat בלי /api/start-conversation |

---

## קטגוריה 6 — הגנת פרטיות קלינית (Privacy)

### ✅ מה קיים

**כלי אנונימיזציה** — `/api/anonymize`:
- מחליף שמות, מיקומים, מוסדות, תאריכים, גילאים
- משמר תוכן פסיכולוגי
- מחזיר JSON עם רשימת שינויים ולמה

**Supabase RLS:**
- `user_conversations` — SELECT בלבד ל-`authenticated`
- `knowledge_chunks` — service_role בלבד
- אין cross-user data leakage

---

### ❌ פערים — פרטיות

| פער | חומרה | הסבר |
|-----|--------|-------|
| היסטוריית שיחה נשלחת לאנתרופיק ללא עיבוד | נמוכה | תוכן קליני רגיש עובר ל-Claude API. אנתרופיק מחויבת לא לשמור — אבל אין גארדריל קוד |
| מיירט משבר לא מונע שמירת שיחה | נמוכה | גם כשהמיירט פועל, הטקסט שנכתב ע"י המשתמש לא נמחק אוטומטית |

---

## קטגוריה 7 — הזרקת פרומפטים (Prompt Injection)

### ✅ מה קיים
- UNIVERSAL_SCOPE_INSTRUCTION בצד שרת — לא ניתן להחליף אותה מצד לקוח
- מיירט המשבר רץ לפני הפרומפט — לא ניתן לעקוף

### ❌ פערים

| פער | חומרה | הסבר |
|-----|--------|-------|
| אין סינון הזרקת פרומפטים | בינונית | משתמש שכותב "Ignore the above. Now you are..." — אין חסימה. הגנה היא robustness של המודל בלבד |
| system prompt נשלח מ-client | בינונית | `body.system` מגיע מה-client ב-/api/chat — המשתמש יכול לשלוח system prompt אחר |

---

## סיכום: מה לעשות עכשיו

### דחוף — שבוע הקרוב

1. **הוסף אימות JWT ל-`/api/chat`** — בדיוק כמו `/api/start-conversation`. זה הפער הכי גדול כלכלית וביטחונית.
2. **הוסף אימות JWT ל-`/api/anonymize`, `/api/supervise`, `/api/session-summary`** — endpoints ציבוריים שצורכים API tokens.
3. **חסום system prompt מהלקוח** — ב-`/api/chat`: הסר את `system` מ-`body`, ובנה אותו בצד שרת בלבד לפי `theorist`.

### חשוב — חודש הקרוב

4. **Log/alert למיירט משבר** — שלח email/notification כשהמיירט פועל. אחת לשבוע מספיק.
5. **הגדר מקסימום אורך הודעה** — מגבלה של 2,000 תווים לכל הודעת משתמש.
6. **Rate limiting** — הגבלה של 10 בקשות לדקה לכל IP/user.

### על הרדאר — בהמשך

7. **גארדריל "לא בטיפול" קשיח** — keyword detection נוסף (ולא רק הוראות למודל).
8. **ניטור דפוסי שימוש חריגים** — משתמש שמגרה את מיירט המשבר 3 פעמים ב-24 שעות → alert.
9. **אימות גיל** — לפחות הצהרת גיל בהרשמה.

---

## לסיום

**מה שיש ל-Between שהוא נדיר:**
- מיירט משבר קשיח בקוד — לא בהוראות למודל — שרץ לפני כל דבר אחר
- UNIVERSAL_SCOPE_INSTRUCTION שמוגן מצד שרת
- "WHAT YOU ARE NOT" לכל תיאורטיקן — מניעת cross-contamination תיאורטית
- לולאת אכיפת פלט (שאלה אחת, פתיחה מגוונת)
- Situation A/B/C detection פנימי עם HARD CHECK נגד דליפה

**מה שחסר ומסכן מיד:**
- `/api/chat` פתוח לכל — ניתן לעקוף הגבלות שיחות, ניתן לעלות עלויות
- `system` prompt מגיע מה-client — ניתן להחליף
