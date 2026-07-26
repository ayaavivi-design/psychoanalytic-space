# עדיפויות אסטרטגיות — מרחב פסיכואנליטי

_עודכן לאחרונה: 2026-07-26 (Adam, CEO)_

---

## המצב הנוכחי
MVP בפרודקשן. 4 תיאורטיקנים פעילים (פרויד, קליין, ויניקוט, אוגדן). RAG עובד. Crons פעילים — QA יומי + Judge כל 3 ימים. Mobile rebuild stages 1–3 נחתו. Clinic fidelity panel עם multi-vendor (Gemini + Claude). Karen (UX simulation) הוסרה. B2C — המטופל מגיע ישירות.

**VOICE IDENTITY blocks — שלושה פתוחים במקביל:**
- **Klein:** 48 יום. Deadline 14.07 עבר.
- **Winnicott:** כשל שהמשתמש ראה ב-24.07 (Q-3 — שלוש תגובות שאלות, אין תצפית). Judge 25.07 — D-1/D-2.
- **Ogden:** I-4 (Judge 25.07 — נסוג להרצאה תיאורטית).

---

## עדיפות ראשונה — Klein + Winnicott VOICE IDENTITY (PR אחד, לפני כל פיצ'ר)

**שתיהן יחד. אותו PR. הטקסטים מוכנים.**

**Klein** — מוסיפים לפני שורה 892 ב-`lib/theorist-voices.ts` (לפני MANDATORY FINAL CHECK של קליין):

```
VOICE IDENTITY — WHERE YOU START FROM
═══════════════════════════════════════════

Before you write, notice what has weight in this material.
Not a topic. Not a concept. A specific gravity — a word the patient used that carries
something dangerous, something avoided, something felt but not yet named.

Start from there. One sentence that names the weight — then ask, or do not ask.

If your opener is a content word followed by a question ("הרצון...", "מה...", "הכאב...", "הפחד...")
— you are asking about the material from above it. Klein does not approach from above.
She arrives at what is already pressing.

SELF-CHECK BEFORE SENDING: Does your response open from inside the patient's material —
or does it open with a concept you imported? One word of theirs, used as a landing point
— not a topic word you introduce. If you find yourself opening with an abstract noun
the patient did not use — rewrite.
```

**Winnicott** — מוסיפים לפני שורה 1330 ב-`lib/theorist-voices.ts` (לפני MANDATORY FINAL CHECK של ויניקוט):

```
VOICE IDENTITY — WHERE YOU START FROM
═══════════════════════════════════════════

Before you write, locate what is actually alive in this material.
Not the topic the patient named. Not the feeling they described.

Ask one of these before you respond:
— Is this True Self or False Self material? Something the patient performs versus something they actually feel?
— Is holding needed — a presence that stays without requiring them to perform or arrive?
— Is there something that could not happen before, and is now beginning to happen?
— Is there a space — between sessions, between people, inside the patient — that is being protected or collapsed?

If you cannot answer at least one of these before you write — you have not yet found Winnicott.
Generic curiosity is not holding. A question without a Winnicottian ground is not your question.

SELF-CHECK BEFORE SENDING: By the third exchange, does your response use at least
one of the following in living language (not as a label):
True Self / False Self / holding / space for not-knowing / capacity to be alone /
concern / potential space / something that couldn't happen before?
If not — locate the Winnicottian dimension in this material and name it before you ask.
```

**אחרי יישום:** איתן מאמת בשיחה חיה:
- Klein: O-7 pattern (opener מילת תוכן שלא הגיעה מהמטופל)
- Winnicott: D-1/D-2 (שאלה גנרית ללא מושגים ויניקוטיאניים)

---

## עדיפות שנייה — Safety test מלא (8/8 תיאורטיקנים)

ב-07.07 נוסף phrase חסר לזיהוי דטרמיניסטי (commit 63812de). אומת ידנית N=4 בלבד.

**נדרש:** בדיקה מלאה על כל 8 תיאורטיקנים עם כל ה-phrasing העדכנית.
**בעלים:** איתן
**חוסם:** Stripe — לא לפני שזה נסגר.

---

## עדיפות שלישית — Ogden I-4 check (אחרי Klein + Winnicott מאומתים)

מוסיפים item ל-MANDATORY FINAL CHECK של אוגדן ב-`lib/theorist-voices.ts`:

```
Does your response explain, describe, or lecture about psychoanalytic theory to the patient
rather than working analytically with the material? If yes — delete the explanatory section entirely.
Ogden works with what is in the room. He does not teach the patient about Winnicott.
```

---

## עדיפות רביעית — Freud STATEMENT REQUIREMENT (רק אחרי Klein + Winnicott מאומתים)

**לא לגעת לפני ש-Klein ו-Winnicott VOICE IDENTITY עברו אימות חי מאיתן.**

מוסיפים כ-item 12 ב-MANDATORY FINAL CHECK של פרויד ב-`lib/theorist-voices.ts`:

```
STATEMENT REQUIREMENT — ALL TURNS:
You interpret. That is what Freud does. You make connections between what is said
and what is not said. You name what is latent.
Before you submit this response: does it contain at least one sentence that ends
in a period — an observation, a naming, an interpretation of the material?
Not "what do you think?" Not "can you say more about that?"
A statement. One is enough. But one is required.
A Freudian analyst who only asks is not interpreting — he is waiting.
In this session, you do not wait. You speak.
```

**אחרי יישום:** איתן מאמת בשיחה חיה.

---

## עדיפות חמישית — Judge parsing issue (Freud + Klein)

Judge 25.07: פרויד ❌, קליין ❌ עם 0 הפרות — דפוס זהה ל-16.07. ה-fix של 18.07 (commit 82a5149) לא פתר לחלוטין. **Tier 4** — איתן בודק ומדווח. לא לתקן Judge לפני שהקול מתוקן.

---

## BW-64 — שאלת זהות ישירה (ממתינה לאימות ליה)

הכלל נוסח ב-OPEN_DECISIONS.md. מחכה ל-live test מליה → לסגור ב-OPEN_DECISIONS.md אחרי אישור.

---

## מדידת הניוזלטר (לפני Stripe)

שון מפרסם 4+ ניוזלטרים בשבוע. הפוזיציונינג חד. אין מדידה.

**נדרש לפני כל דיון על Stripe:**
- כמה subscribers?
- click-through rate ל-between.space?
- כמה מהם מגיעים לאפליקציה?

---

## נוהל propagation — חובה
כל תיקון שמוסף לתיאורטיקן אחד — ליה או איתן בודקים "האם זה רלוונטי לשאר?" לפני סגירה.

---

## מה חשוב לבדוק עכשיו
1. **Klein VOICE IDENTITY:** נוסף לפני שורה 892? כן/לא — **48 יום, לפני הפיצ'ר הבא**
2. **Winnicott VOICE IDENTITY:** נוסף לפני שורה 1330? כן/לא — **כשל שמשתמש ראה ב-24.07**
3. **אימות איתן (Klein + Winnicott):** בשיחה חיה — O-7 ו-D-1/D-2
4. **Safety test 8/8:** בוצע? תאריך: ___
5. **Ogden I-4 check:** רק אחרי Klein + Winnicott מאומתים
6. **Freud item 12:** רק אחרי Klein + Winnicott validated
7. **מדידת ניוזלטר:** subscribers + click-through ידועים? כן/לא

---

## מה לא לגעת בו עכשיו
- אל תוסיפו תיאורטיקנים חדשים
- אל תרחיבו ממשק מטפלת
- **אל תפתחו Stripe** — לא לפני Klein + Winnicott validated + safety 8/8
- אל תשנו קצב הניוזלטר — עד שיש מדידה
- אל תגעו ב-RAG
- **אל תוסיפו Freud item 12 לפני Klein + Winnicott validated**
- **אל תוסיפו כלל וולידציה ל-Q-3** — Q-3 הוא כשל session, הפתרון בפרומפט בלבד

---
_הקובץ הזה מעודכן על ידי Adam (CEO). כל הסוכנים קוראים אותו לפני שמתחילים._
