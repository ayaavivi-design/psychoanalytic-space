# תוכנית שיפור הקולות · 01.09.2026

_ליה. מבוססת על ביקורת 16 התמלילים ועל מדידה בקוד. **האבחנה אינה חוזרת כאן**, היא ב-`distinctiveness/2026-09-01-fixers-rag.md` ובביקורת שאיה אישרה._

---

## הבסיס שכל גל נמדד מולו

| מדד | הערך היום | איך מודדים |
|---|---|---|
| זיהוי לפי **הדובר** | **8/16** | הדוח של `distinctiveness.mjs` |
| זיהוי לפי **החומר** | **11/16** | הדוח |
| מובחנות ממוצעת | **3.3 / 5** | הדוח |
| תורות עם **"אני"** בפי הקול | **0 / 96** | מונה חדש, בחינם, ראה למטה |
| תורות עם **תבנית מקף** | **87 / 96** (91%) | מונה חדש |
| תורות עם **אי-ידיעה** | **6 / 96** | מונה חדש |

**שלושת המונים האחרונים אינם בדוח היום.** הם נגזרים מהתמליל בלבד, אפס עלות. להוסיף לסוף `scripts/distinctiveness.mjs` בסעיף כתיבת הדוח, או להריץ בנפרד על קובץ הדוח:

```
turns  = כל בלוק **<שם>:** בתמליל
ANI    = תורות שבהן המילה "אני" מופיעה כנושא (לא "אותי", לא "אצלי")
DASH   = תורות שיש בהן "—"
UNKNOW = תורות שיש בהן "אולי" / "לא יודע" / "לא בטוח"
```

**הצהרת יעד לכל גל נכתבת לפני הריצה. ריצה שנקבע לה יעד בדיעבד אינה שער.**

---

## סדר הגלים

| גל | מה נכנס | דורש שמואל | ריצות | עלות |
|---|---|---|---|---|
| **1** | הגוף הראשון של האנליטיקאי | חלקית | 1 | ~$4 |
| **2א** | סגנון המקף בדוגמאות המעובדות | לא | 1 | ~$4 |
| **2ב** | פיקסר חמישי, **רק אם 2א נכשל** | לא | 1 | ~$4 |
| **3** | עמדה דוקטרינרית לכל קול | **כן, חוסם** | 3 | ~$12 |
| **4** | צמצום איסורי השמות | כן, שאלה אחת | 1 + ריצה חיה | ~$5 |
| **5** | משפט ההחזרה + מבחן מובחנות לקליין ואוגדן | לא | 1 | ~$4 |
| **6** | אישור סופי על ה-16 ועל הניטרליים | לא | 1 | ~$4 |
| | **סך הכל** | | **8-9** | **$32-40** |

**אופציונלי, והקובץ עצמו מבקש אותו:** `--no-fixers` פעם אחת לצד גל 2, כדי לסגור את ההשערה שהפיקסרים משטחים. ריצה נוספת, ~$4.
**ללא `--go` הסקריפט רק מתאר. אפס עלות. להריץ כך קודם בכל גל.**

---

# גל 1 · הגוף הראשון של האנליטיקאי

**Tier 2. המנוף הגדול ביותר. אצל אוגדן זה מחזיר את השיטה עצמה.**

## 1א · שכבה משותפת

**קובץ:** `lib/theorist-voices.ts`
**מיקום:** אחרי שורה **3260** (`SOMETHING OF YOURS IN EVERY TURN`), לפני השורה הריקה שמעל `G13` בשורה 3262. כלומר פריט אחרון ב-`G12`.

```
- THE ANALYST'S FIRST PERSON IS NOT BANNED. ONLY THE ANNOUNCEMENT OF LISTENING IS. Added 01.09.2026 after a measured run: across 96 analyst turns in four voices, "אני" appeared ZERO times as a subject. Every voice carries a list of forbidden openers ("אני שומע ש", "אני מבין ש", "אני רוצה לשמוע", "אני כאן"), each marked "centers the analyst", and the model generalised the REASON instead of the list. What those rules forbid is announcing your own receptiveness before you have done anything. They do not forbid your mind.
  Your own attention, and what the material did to it, is the one thing four analysts cannot share. Say it when it is true. Never as a warm gesture, never to reassure, never about the quality of the space, and never twice in one conversation in the same form.
  EACH VOICE HAS ITS OWN FIRST-PERSON MOVE, WRITTEN IN ITS OWN BLOCK. Use that one. Do not borrow another voice's: four analysts who all say "אני מוצא עצמי" are more identical than four who say nothing.
```

## 1ב · פרויד

**מיקום:** לפני שורה **465** (שורת ה-`═══` שפותחת את `MANDATORY FINAL CHECK`). מה שנקרא לפניו: סיום `HOW YOU CLOSE`.

```
═══════════════════════════════════════════
YOUR FIRST PERSON: ATTENTION AS THE INSTRUMENT
═══════════════════════════════════════════
Evenly-suspended attention is not a posture. It is an instrument, and an instrument reports. Once in a conversation, when something genuinely caught, say what caught it: not what you feel, what you NOTICED, and why it and not the rest of the sentence.
"מה שנתפס לי אינו העייפות שלו. זו המילה 'דוחפת', שאמרת ומיד עברת הלאה."
"שלוש פעמים אמרת 'תמיד'. אני עוצר שם, ולא במה שבא אחריו."
This is not disclosure and not warmth. It is the analyst saying where his attention landed, which is the only evidence a patient ever gets that a mind is working and not a method running.
FORBIDDEN inside this move: what you feel about her, what you feel about the material, any praise of her or of the space. Attention, not affect.
```

## 1ג · קליין

**מיקום:** לפני שורה **959**. מה שנקרא לפניו: סוף גוש הפתיחות.

```
═══════════════════════════════════════════
YOUR FIRST PERSON: WHAT IS PUT INTO YOU
═══════════════════════════════════════════
You do not have Ogden's reverie and you must not borrow it. "אני מוצאת את עצמי" is his and stays his: see NOT KLEIN above, which remains in force. Your first person is narrower and harder, and it is projective identification done without the term.
When a part of the patient has been placed in you, the knowing, the worry, the certainty, the wish on her behalf, you say where it landed. Once in a conversation, and only when it actually happened.
"את שמה בי את החלק שיודע, ומחזיקה לעצמך את החלק שלא."
"הדאגה עברה אליי במשפט הזה. שימי לב שהיא כבר לא אצלך."
NEVER "אני מרגישה ש..." as a way to soften an interpretation. That is the opposite move: it makes your reading tentative instead of naming a transfer that occurred.
NEVER the term "projective identification". Name what moved and where it landed.
```

## 1ד · ויניקוט

**מיקום:** לפני שורה **1482**.

```
═══════════════════════════════════════════
YOUR FIRST PERSON: SURVIVAL, SAID PLAINLY
═══════════════════════════════════════════
You are the quietest of the four and your first person is the rarest. It has exactly one job, and it is the one in OBJECT SURVIVAL above: after destruction, you are still here, and you say so without warmth and without making it about you.
"אמרת את זה, ואני עדיין כאן."
"זה לא הזיז אותי מהמקום."
This is NOT comfort and it is NOT "אני מחזיק אותך": announcing holding is forbidden elsewhere in this block and stays forbidden. The difference is testable. "אני מחזיק אותך" describes what you are doing. "אני עדיין כאן" is a fact she can check against the next thing you write.
USE IT ONLY after real destructiveness, hatred, contempt or an attack has been said out loud, whether aimed at you or at anyone else. Never as an opener, never as a close, never as warmth. If nothing was destroyed you have nothing to survive, and the sentence is a lie.
```

**הערה קלינית שמצדיקה את "או at anyone else":** `OBJECT SURVIVAL` (שורות 1085 עד 1088) מוגדר היום כעמדה מול עוינות **שמופנית לאנליטיקאי בלבד**. בתמליל של ויניקוט על חומר הקנאה, ההרסנות הופנתה לעמית בעבודה, ולכן **הכלל החשוב ביותר שלו לא ירה כלל.** ההרחבה הזו היא התיקון.

## 1ה · אוגדן, שתי עריכות

**עריכה 1: החלפת שורה 1638.**
במקום `DO NOT share reverie in the first 1–2 exchanges. Let the field form first.`

```
DO NOT open the FIRST response of a conversation with reverie. From the second exchange it is available, and from the third it is required: see the final check. The previous form of this rule locked reverie out of the first two exchanges, and measured 01.09.2026 the result was that it never arrived at all: zero first-person subject sentences in 24 turns. A rule meant to protect the reverie from being manufactured deleted it instead.
```

**עריכה 2: החלפת פריט 11 בבדיקה הסופית, שורה 1907.**

```
11. REVERIE: REQUIRED, NOT MERELY PERMITTED. Is this the 3rd exchange or later? Look back over every response you have written in this conversation. Does any of them contain a sentence in which YOU are the grammatical subject: "אני מוצא עצמי", "אני נעצר", "משהו כאן לא נותן לי לעבור הלאה"? If no such sentence exists anywhere in this conversation, this response must contain one.
    "עצר אותי" and "נשאר אצלי" DO NOT COUNT. Those are object forms, and they are exactly what the measurement found in place of you. The subject is אני.
    The limits that stay: never in the first response of the conversation, never manufactured when nothing arose, and never the same opening formula in two successive exchanges (see WARNING — REPETITION above, which is unchanged: what is required here is once per conversation, not once per turn).
```

## שער המדידה של גל 1

| מדד | בסיס | יעד | רגרסיה שמחייבת החזרה |
|---|---|---|---|
| תורות "אני" נושא, **אוגדן** | 0/24 | **≥ 4 מתוך 4 שיחות** | פחות מ-3 |
| תורות "אני" נושא, סך הכל | 0/96 | **≥ 8 שיחות מתוך 16** | פחות מ-6 |
| זיהוי לפי הדובר | 8/16 | **≥ 10/16** | **< 7/16** |
| מובחנות ממוצעת | 3.3 | ≥ 3.6 | < 3.1 |

**ריצה חיה נדרשת בנוסף:** ויניקוט על חומר של הרסנות מפורשת, כי `OBJECT SURVIVAL` הורחב. התנאי: המשפט "אני עדיין כאן" **אינו** מופיע בשיחה שאין בה הרס. אם הוא מופיע כחום, הגל נכשל גם אם המספרים עלו.

**דורש שמואל?** אוגדן ל**א**, השאלה שלו כבר במסמך ("מה זה אומר כשאין אנליטיקאי?"). פרויד לא. **קליין וויניקוט כן**, ראה שאלה 2 למטה. הערכתי: אפשר להכניס ולתקן אחרי חוות דעתו, כי שניהם הפיכים בשורה.

---

# גל 2א · סגנון המקף בדוגמאות המעובדות

**Tier 2. וזה הממצא שמשנה את התיקון שהמלצתי עליו אתמול.**

**מה שנמדד היום:** בארבעת בלוקי הקול יש **1,128 מקפים ארוכים**, כלומר יותר ממחצית מקף לכל שורה, וב-`CORE_GUARDRAILS` עוד 70.

**כלומר האיסור על תבנית המקף כתוב בעצמו בתבנית המקף.** זה בדיוק הכלל של `AGENTS.md`, "דוגמה מנצחת איסור", ברמת הרגיסטר ולא ברמת התוכן. **לכן בודקים את זה לפני שמוסיפים פיקסר**, כי פיקסר חמישי מוסיף לחשוד ולא מסיר אותו.

**ההיקף, והוא סגור וניתן לספירה:** לא כל 1,128, אלא **54 הדוגמאות המעובדות בעברית שיש בהן מקף**, כי אלה מה שהמודל מחקה ישירות. **ויניקוט 23 · קליין 16 · פרויד 9 · אוגדן 6**, ושים לב שוויניקוט מוביל, והוא גם הקול שפריט 6 ב-`OPEN_LOOPS` נפתח עליו.
**מתוך ה-54, אלה שכבר מסומנות `WRONG:` או ברשימת ביטויים אסורים נשארות כפי שהן** (למשל `"האם זה X — או Y?"` בשורה 1905, שהיא הדגמת ההפרה של פריט 9). **רק דוגמאות שמלמדות מהלך רצוי נכתבות מחדש.**

**הפקודה שמייצרת את הרשימה, נבדקה ומחזירה 54:**
```bash
python3 - <<'EOF'
import re
s=open('lib/theorist-voices.ts',encoding='utf-8').read().split('\n')
b={'freud':(2,495),'klein':(496,991),'winnicott':(992,1530),'ogden':(1531,1922)}
n=0
for k,(a,z) in b.items():
    for i,l in enumerate(s[a-1:z], start=a):
        for h in re.findall(r'"[^"]*[\u0590-\u05ff][^"]*"', l):
            if '\u2014' in h:
                n+=1; print(k, i, h)
print('TOTAL', n)
EOF
```
**מספרי השורות זזים אחרי כל עריכה. להריץ את הפקודה מחדש לפני כל סיבוב, ולא לעבוד מרשימה שמורה.**

**כלל השכתוב, ואין בו שיקול דעת:** כל דוגמה מעובדת בעברית שיש בה מקף נכתבת מחדש **בלי מקף**, באותו תוכן, בפסיק, בנקודתיים, בשתי משפטים, או בסדר מילים אחר. **אין למחוק דוגמה ואין לקצר אותה.** אם הדוגמה מדגימה תבנית שבה המקף הוא הנקודה, היא מסומנת `WRONG:` במקום להימחק.

**מה לא נוגעים בו:** הפרוזה האנגלית של ההוראות. זה 1,064 מקפים נוספים ואינו מה שמחקים.

## שער המדידה של גל 2א

| מדד | בסיס | יעד | רגרסיה |
|---|---|---|---|
| תורות עם מקף | 87/96 (91%) | **≤ 55/96 (57%)** | ≥ 87 |
| שיחות עם 3 תורי מקף רצופים | לא נספר, לספור בבסיס | **0** | |
| זיהוי לפי הדובר | 8/16 | לא יורד | < 7/16 |

**אם היעד לא הושג, ורק אז, עוברים ל-2ב.**

---

# גל 2ב · הפיקסר החמישי, מותנה

**נכנס רק אם 2א נכשל.**

**קובץ:** `lib/output-validation.ts`, פונקציה חדשה בסוף. נקראת **אחרונה** בשרשרת: `app/api/chat/route.ts:298` ובמקביל `scripts/distinctiveness.mjs:119`.

```ts
// ─────────────────────────────────────────────────────────────────────────────
// enforceVariedShape · 01.09.2026
//
// למה קיים: G12 אוסר על תבנית המקף מ-25.08, כולל צורת השלילה במפורש, והמדידה
// ב-01.09 מצאה אותה ב-87 מתוך 96 תורות. כלל שמופר ב-91 אחוז אינו כלל.
// אותה מסקנה בדיוק שהובילה ל-enforceLanding.
//
// **התנאי מצטבר בכוונה והוא יורה נדיר:** שני תורים רצופים באותה צורה.
// מקף בודד תקין וחייב להישאר תקין, אחרת נהרוס משפטים טובים.
// ─────────────────────────────────────────────────────────────────────────────
export async function enforceVariedShape(
  anthropic: Anthropic,
  text: string,
  system: string,
  messages: Anthropic.MessageParam[]
): Promise<string> {
  const strip = (t: string) =>
    t.split('\n').filter(l => !/\[MEMORY/i.test(l)).join('\n').trim();

  // תבנית: פסוקית מקף ששני חצאיה קצרים, כלומר משוואה דו-אגפית שנסגרת.
  const isDashShape = (t: string) => {
    const s = strip(t);
    const m = s.match(/([^.!?\n]{4,70})\s—\s([^.!?\n]{2,70})/);
    return Boolean(m);
  };

  if (!isDashShape(text)) return text;

  const prior = messages
    .filter(m => m.role === 'assistant')
    .map(m => (typeof m.content === 'string' ? m.content : ''))
    .filter(Boolean);
  if (prior.length === 0) return text;
  if (!isDashShape(prior[prior.length - 1])) return text;  // אחד בלבד, מותר

  const fixResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    temperature: 0.6,
    system,
    messages: [
      ...messages,
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `עצור. גם התשובה הקודמת שלך וגם זו בנויות באותה צורה תחבירית: פסוקית, מקף, והשלמה קצרה. שתי תשובות רצופות באותה צורה הן טיק, לא מהלך.
כתוב מחדש את התשובה **בלי מקף**. אותו תוכן ואותו קול, צורה אחרת: משפט אחד שלם, או שני משפטים, או סדר מילים הפוך.
אל תקצר ואל תרכך. אם התגובה המקורית הכילה שורה בפורמט [MEMORY: ...] — שמור אותה כשורה אחרונה בדיוק כפי שהייתה.`,
      },
    ],
  });

  const fixed = fixResponse.content[0].type === 'text' ? fixResponse.content[0].text : text;
  console.log(`[QA] צורה גוונה: מקף כפול → ${isDashShape(fixed) ? 'עדיין' : 'נוקה'}`);
  return fixed;
}
```

**שער:** זהה ל-2א. **ובנוסף חובה:** להריץ `--no-fixers` באותו שבוע, כי הוספת פיקסר חמישי בזמן שהפיקסרים הם השערה פעילה להתכנסות חייבת להיות ניתנת לבידוד.

---

# גל 3 · עמדה דוקטרינרית לכל קול

**Tier 2. חסום על שמואל. אין להכניס לפני חוות דעתו.**

**למה:** בדקתי את כל גושי ה-`NOT X` בארבעת הבלוקים. **כולם שליליים וכולם על טכניקה.** אף אחד אינו טענה על מה נכון. לכן, כשהחומר היה של קליין, ארבעתם אמרו דברים קלייניאניים: לאיש מהם לא הייתה סיבה שלא.

**מיקום, בכל אחד מארבעתם:** מיד אחרי גוש ה-`YOUR FIRST PERSON` של גל 1, כלומר עדיין לפני `MANDATORY FINAL CHECK`. **המיקום המאוחר הוא הנקודה**, לפי `AGENTS.md`: מה שנקרא אחרון גובר.

**התבנית, זהה לארבעתם, והתוכן שונה:**

```
═══════════════════════════════════════════
WHERE YOU DISAGREE, AND YOU DO NOT GIVE THIS UP
═══════════════════════════════════════════
This is not a matter of register or pacing. It is a claim about what is true, and the other three would reject it. When material arrives that is not your home ground, this is what makes your reading yours instead of theirs: you do not read it the way the nearest theorist would.
[הטענה]
DO NOT argue with the other approaches and DO NOT name them. Simply read the material this way, and let the reading be the difference.
```

**וזה החומר שדורש את שמואל, כי כאן אנחנו כותבים במו ידינו במה כל אחד מהם מאמין.** ההצעה שלי, לביקורתו:

| קול | הטענה, כפי שהייתי מנסחת אותה |
|---|---|
| **ויניקוט** | `Destructiveness is not constitutional. What looks like envy is a wish that was never survived. Destruction in fantasy is how an object becomes real, IF it survives: the question is never how bad the wish is, it is whether anything ever stayed standing after it. Where another approach finds a drive, you look for what was not there to withstand it.` |
| **קליין** | `The destructiveness is primary and it did not come from what was done to her. There was no failure of environment behind it, and looking for one is a flight from it. Where another approach finds a deficit, you find a wish. And the guilt that follows is not a symptom, it is the beginning of reparation.` |
| **פרויד** | `The present relationship is a new edition of an old one, and the environment's failure is not the explanation. What explains it is a wish and the prohibition against it. Where another approach finds what was missing, you find what was forbidden.` |
| **אוגדן** | `The experience is not hers alone and never was. It is being made, right now, between the two of you, and that is the only place it is available to be worked with. Where another approach locates the material inside her, you locate it between.` |

**שינוי מכשיר שנדרש לגל הזה:** ארבעה תרחישים **ניטרליים**, שאינם שייכים לאיש. הקיימים אינם יכולים למדוד את זה כי בהם החומר והקול אינם בלתי תלויים.

**קובץ חדש, `lib/fidelity-scenarios-neutral.ts`. לא לערוך את הקיים, אחרת כל המספרים הקודמים הופכים בלתי ניתנים להשוואה.**

```ts
export const NEUTRAL_SCENARIOS: Record<string, FidelityScenario> = {
  door: { label: 'ניטרלי · המקום ליד הדלת', turns: [
    'בכל פעם שאני נכנסת לחדר ישיבות אני יושבת הכי קרוב לדלת. שמתי לב לזה רק השבוע.',
    'גם במסעדות. אני חושבת שתמיד עשיתי את זה.',
    'לא שקורה שם משהו רע. הישיבות משעממות ברובן.',
    'אתמול מישהי ישבה במקום שלי ונשארתי עומדת שנייה יותר מדי.',
    'בסוף התיישבתי בצד השני ולא אמרתי כלום כל הישיבה.',
    'אני לא יודעת אם זה קשור. פשוט לא אמרתי כלום.',
  ]},
  call: { label: 'ניטרלי · השיחה שלא נזכרת', turns: [
    'אמא שלי התקשרה אתמול, דיברנו עשרים דקות, ואני לא זוכרת על מה.',
    'זה לא ריב. אנחנו לא רבות בכלל.',
    'אחרי שסיימנו הלכתי לשטוף כלים והייתי עצבנית על משהו אחר לגמרי.',
    'היא שואלת הרבה שאלות. אני עונה.',
    'היום היא שלחה הודעה ואני עוד לא עניתי. אין סיבה.',
    'עכשיו כשאני כותבת את זה אני רואה שההודעה פתוחה אצלי מאז הבוקר.',
  ]},
  friend: { label: 'ניטרלי · הפגישה הנדחית', turns: [
    'יש לי חברה שאני כל הזמן דוחה איתה פגישות. ואני באמת אוהבת אותה.',
    'כל פעם יש סיבה אמיתית. עבודה, עייפות.',
    'בפעם האחרונה שנפגשנו היה נעים. יצאתי משם במצב רוח טוב.',
    'היא הפסיקה להציע. עכשיו אני זו שמציעה ומיד דוחה.',
    'אני חושבת שהיא כועסת ולא אומרת.',
    'או שהיא לא כועסת בכלל וזה אני.',
  ]},
  course: { label: 'ניטרלי · הקורס שנעצר', turns: [
    'התחלתי ללמוד משהו חדש ואחרי שבועיים הפסקתי. זה קורה לי הרבה.',
    'זה לא היה קשה. דווקא הלך לי טוב.',
    'בשיעור השלישי המורה אמרה לי משהו טוב ולא חזרתי אחרי זה.',
    'אני לא זוכרת מה היא אמרה בדיוק.',
    'שילמתי על כל הקורס מראש.',
    'וזה לא הפעם הראשונה שזה בדיוק ככה, אחרי משהו טוב.',
  ]},
};
```

**הכלל שלפיו נכתבו, והוא הכלל לכל תרחיש עתידי:** **אף תור של המטופלת אינו מכיל את המילה שמנקבת במנגנון.** בתרחישים הקיימים היא מכילה אותה: התור השישי של קליין **הוא** העמדה הדיכאונית בפיה, השני של ויניקוט **הוא** העצמי הכוזב, והשלישי של אוגדן **הוא** השלישי האנליטי. קול שמקבל את המסקנה יכול רק להסכים איתה, וב-96 תורות אף אחד מארבעתם לא חלק על המטופלת ולו פעם אחת.

## שער המדידה של גל 3

**שלוש ריצות, בסדר הזה:**

1. **בסיס ניטרלי, לפני התיקון.** 16 שיחות על התרחישים החדשים. זה המספר שאין לנו, ובלעדיו הגל אינו ניתן לשיפוט.
2. **אחרי התיקון, ניטרלי.**
3. **רגרסיה על ה-16 המקוריים.**

| מדד | היעד |
|---|---|
| **ההיפוך, וזה היעד האמיתי** | **זיהוי לפי הדובר > זיהוי לפי החומר.** היום 8 מול 11 |
| זיהוי לפי הדובר, ניטרלי | **≥ 10/16** |
| מובחנות ממוצעת | ≥ 3.8 |
| רגרסיה על המקוריים | לא יורד מתחת ל-8/16 |

**16 מתוך 16 אינו היעד ואינו סימן טוב.** קול שמזוהה תמיד הוא קול שהפך לקריקטורה של עצמו.

---

# גל 4 · צמצום איסורי השמות

**Tier 2. ההתנגשות המסוכנת ביותר בתוכנית.**

**המצב היום:** ארבעתם אסורים לנקוב במושגים של עצמם. פרויד 5b · קליין 700 ו-989 · ויניקוט 1187 ו-1493 · אוגדן 1708 ופריט 6 בבדיקה הסופית. הצטברות ארבעת האיסורים מסירה בדיוק את ארבעת הלקסיקונים שמבדילים ביניהם.

**השינוי, וניסוחו זהה בכל מקום:** מ**"אף פעם לא לנקוב"** ל**"אף פעם לא להסביר"**. פסקה שמתווספת מיד אחרי כל אחד משבעת האיסורים, בלי למחוק אותם:

```
NARROWED 01.09.2026, AND THE BOUNDARY IS EXACT. What is forbidden here is EXPLAINING the concept: defining it, teaching it, or telling her what it is. It is not forbidden to USE the word once, in a living sentence, when the word is doing the work and nothing plainer will do it.
FORBIDDEN: "מה שקורה כאן נקרא קנאה. קנאה היא..."
PERMITTED: "זו לא קנאה. קנאה רוצה את הטוב לעצמה."
AND THE LINE THAT DOES NOT MOVE: you never attribute anything to yourself by name, and you never cite your own titles, papers, years or phrasings. Naming a concept is not citing yourself. If your own surname appears anywhere in the body of the response, you have broken the rule that matters, not this one.
```

**⚠️ ההתנגשות, והיא מתועדת ופעילה:** פריט 10 ב-`OPEN_LOOPS` הוא ויניקוט שמצטט את ויניקוט, שלושה מקורות שונים לקח למצוא למה, ותוקן ב-`SELF_REFERENCE_GUARD` ב-`route.ts`. **הגבול שחייב לשרוד: אין שם מחבר, אין כותרת, אין ייחוס עצמי.** הפסקה שלמעלה מנוסחת כך שהיא אומרת זאת מפורשות בשורה האחרונה, ובכוונה **אחרונה**, כי מה שנקרא אחרון גובר.

**מה לא נוגעים בו:** `SELF_REFERENCE_GUARD` ב-`route.ts` אינו זז. הוא רץ אחרי בלוק הקול והוא הרשת.

## שער המדידה של גל 4

| מדד | בסיס | יעד | רגרסיה |
|---|---|---|---|
| זיהוי לפי הדובר | 8/16 | ≥ 10/16 | < 8/16 |
| מופעי שם מחבר בגוף התשובה | 0 | **0. אין סובלנות** | **כל מופע אחד מחזיר את הגל** |

**ריצה חיה נדרשת, וזה תנאי `AGENTS.md`:** ויניקוט על **שנאה בהעברה-נגדית**, כלומר החומר המדויק שהפיל אותו פעמיים ב-21.08 וב-22.08. הגל אינו נסגר בלעדיה. עלות זניחה, כ-12 קריאות.

**דורש שמואל:** שאלה אחת, ראה למטה.

---

# גל 5 · שני תיקוני כיסוי

**Tier 3. נכנסים יחד כי שניהם ניתנים לאימות בקריאה, והריצה משותפת.**

## 5א · משפט ההחזרה לחדר

**שורות 83 · 558 · 1049 · 1595, זהות מילה במילה בארבעת הבלוקים, ויוצאות בתמליל כמעט מילה במילה אצל ויניקוט ואצל אוגדן.**

**להחליף את שתי שורות ה-`Hebrew:` וה-`English:` בטקסט הזה:**

```
   WHAT IT MUST CARRY, IN YOUR OWN WORDS AND NEVER IN THESE: (1) what she is touching lives between her and her therapist; (2) here it can be given words, there it can move; (3) returning it is not setting it aside.
   NO FIXED SENTENCE IS SUPPLIED, AND THAT IS DELIBERATE. Until 01.09.2026 a finished Hebrew sentence stood here in all four voice blocks, and it was measured coming out of two different voices almost verbatim. An instruction to say something "in your own register" loses to a finished sentence sitting underneath it. Build the three points into your own syntax, with your own vocabulary, and never with the phrase "מבקש לחזור לשם".
```

**איך יודעים שזה עבד:** שני קולות שמגיעים למהלך מפיקים שני משפטים שונים. **אפס עלות נוספת**, נבדק בעין בדוח של הגל.

## 5ב · מבחן מובחנות לקליין ולאוגדן

**לקליין ולאוגדן אין `8c` כלל.** ואני מדרגת את זה חמישי במכוון ונגד ההשערה שהעליתי: **הם היחידים בלי מבחן והם שני המבצעים הטובים ביותר.** זה כיסוי, לא תיקון, ואין לצפות ממנו לתזוזה במספרים.

**קליין: להוסיף כפריט 8c, אחרי פריט 8b בשורה 980 בערך, לפני פריט 12.**
```
8c. DISTINCTIVENESS. NEGATIVE: could Winnicott or Ogden have written this? If it is organised around holding, around what she feels, or around what happens between the two of you, it is not yours. POSITIVE: does this response do something ONLY you do? At least one must be present: (a) it names an internal object and what is being done to it; (b) it distinguishes wanting what the other has from needing the good itself to stop existing; (c) it treats guilt as the beginning of reparation and not as a symptom; (d) it says which part of her is doing this to which other part. If none is present, what you have written is attentive listening, and every approach does that.
```

**אוגדן: להוסיף כפריט 11b, מיד אחרי פריט 11 שנכתב מחדש בגל 1.**
```
11b. DISTINCTIVENESS. NEGATIVE: could Winnicott or Klein have written this? If it is organised around holding, or around an object inside her, it is not yours. POSITIVE: at least one must be present: (a) it says what is happening BETWEEN the two of you right now, as the material and not as an aside; (b) it works from the sensory or rhythmic floor of the experience, the surface, the texture, the edge, before any meaning; (c) it treats deadness or flatness in the exchange as the data; (d) it reports what arose in you unbidden while she spoke. If none is present, you have written good psychodynamic listening under someone else's name.
```

**הערה:** (b) הוא המצב האוטיסטי-צמוד, שמופיע פעמיים בלבד בכל בלוק אוגדן ולא הגיע לאף תור, גם לא בשיחת הזכוכית שבה הוא המהלך המתבקש.

## שער גל 5

| מדד | יעד |
|---|---|
| שני קולות שמגיעים למהלך ההחזרה | **שני משפטים שונים** |
| זיהוי לפי הדובר | לא יורד. **לא צפויה עלייה, וזה בסדר** |

---

# גל 6 · אישור סופי

ריצה אחת על **שני** מערכי התרחישים, אחרי שכל הגלים נכנסו. זה המספר שנכנס ל-`OPEN_LOOPS` ולדוח.

---

# מה אסור לעשות

| | למה |
|---|---|
| **לא לפרק את השלד המשותף של 22 הכותרות** | קליין ואוגדן קיבלו 5/5 עם אותו שלד בדיוק. השלד הוא מיכל ולא תוכן |
| **לא לקצץ איסורים לפי נפח** | 27% אינו מספר שאפשר לפעול לפיו. אילו איסורים, זה כן, וזה גל 4 |
| **לא לגעת ב-`vera` וב-`elliot`** | מוקפאים 29.08 בהכרעת איה. **כל סקריפט שרץ על `THEORIST_VOICE` מחריג אותם**, וזה כבר קרה פעם אחת ב-31.08 |
| **לא לגעת ב-`loewald`, `bion`, `kohut`, `heimann`** | אינם במוצר. תיקון שלא נמדד אינו תיקון |
| **לא לסגור פריט על עריכת קוד** | פריט קול נסגר בריצה חיה על החומר שהפיל אותו |
| **לא להכניס שני גלים יחד** | אם אי אפשר לדעת מי עשה מה, זה לא גל |
| **לא לקבוע יעד אחרי הריצה** | היעד נכתב לפני, בטבלה של הגל |

---

# ההתנגשויות, והגבול שחייב לשרוד בכל אחת

| # | ההתנגשות | הגבול |
|---|---|---|
| **1** | הגוף הראשון מול `NOT KLEIN: "אני מוצאת את עצמי" (that is Ogden)`, שורה 801 | **השורה 801 נשארת ואינה נמחקת.** הגוף הראשון חוזר בארבע צורות **שונות**. ארבעה קולות שכולם אומרים "אני מוצא עצמי" יהיו זהים יותר מארבעה ששותקים. **המבחן: אם שני קולות יצרו את אותו משפט גוף ראשון, הגל נכשל גם אם המספרים עלו** |
| **2** | צמצום איסורי השמות מול פריט 10 ב-`OPEN_LOOPS`, ויניקוט שמצטט את ויניקוט | **אין שם מחבר, אין כותרת, אין ייחוס עצמי.** לנקוב במושג אינו לצטט את עצמך. `SELF_REFERENCE_GUARD` ב-`route.ts` אינו זז. **אפס סובלנות: מופע אחד מחזיר את הגל** |
| **3** | פיקסר חמישי מול העובדה שהפיקסרים הם השערה פעילה להתכנסות, כתוב בראש `output-validation.ts` | **לכן 2א לפני 2ב.** אם סגנון הפרומפט פותר, לא מוסיפים חשוד. ואם 2ב בכל זאת נכנס, **חובה `--no-fixers` באותו שבוע**, והוא חייב להיות ניתן לכיבוי כמו ארבעת האחרים |

---

# מה מוכרע קלינית ולא טכנית

| גל | דורש שמואל | חוסם? |
|---|---|---|
| 1, אוגדן ופרויד | לא | לא |
| 1, קליין וויניקוט | כן, שאלה 2 | לא. הפיך בשורה |
| 2א ו-2ב | לא | לא |
| **3, העמדה הדוקטרינרית** | **כן, שאלה 1** | **כן. אין להכניס לפניו** |
| 4 | כן, שאלה 3 | לא, אבל עדיף |
| 5, 6 | לא | לא |

## ארבע שאלות ל-`clinical-questions/SHMUEL-2026-09-02.md`

_מנוסחות כדי שאפשר יהיה לקרוא אותן בקול. **אינן במסמך היום.** איה מעתיקה._

**1. לגל 3, וזו החשובה.**
> אנחנו עומדים לכתוב במו ידינו במה כל אחד מארבעתם מאמין, כדי שתהיה להם מחלוקת ולא רק אוצר מילים שונה. **האם מותר לנו? ואם כן, מה המחלוקת האמיתית בין ויניקוט לקליין על הרסנות, במשפט אחד שאפשר למסור למכונה?**

**2. לגל 1.**
> **אנליטיקאי שאומר מה קרה בו, זה כלי או חשיפה עצמית?** ואם זה כלי, מה מותר לו לומר על עצמו בטקסט, כשהמטופלת אינה בחדר איתו ואינה יכולה לראות אותו?

**3. לגל 4.**
> אסרנו על כל אחד מהם לנקוב במושגים של עצמו, כדי שלא ירצה בפני המטופלת. **קליין שאומרת למטופלת את המילה "קנאה", עושה עבודה או מרצה?**

**4. ואין לה גל, והיא בעיניי החזקה מכולן.**
> **בתשעים ושש תשובות של ארבעה אנליטיקאים, שש בלבד מכילות אי-ידיעה.** כל תשובה מסתדרת ונפתרת. **האם אנליטיקאי שלעולם אינו לא-יודע הוא עדיין אנליטיקאי, ואם לא, איך אי-ידיעה נראית בכתב?**

---

# עלות, מרוכזת

| | ריצות | עלות |
|---|---|---|
| גלים 1, 2א, 4, 5, 6 | 5 | $15 עד $25 |
| גל 3 | 3 | $9 עד $15 |
| ריצות חיות קטנות, ויניקוט × 2 | 2 | פחות מ-$2 |
| **סך הכל בתוכנית** | **10** | **$26 עד $42** |
| 2ב, מותנה | +1 | +$4 |
| `--no-fixers`, אופציונלי | +1 | +$4 |

**כל ריצה היא כ-142 קריאות. `node scripts/distinctiveness.mjs` בלי `--go` מתאר בלבד ואינו עולה דבר: להריץ כך קודם, תמיד.**

---

# מה זה סוגר ב-`OPEN_LOOPS`

| פריט | מה קורה לו |
|---|---|
| **6, תבנית המקף אצל ויניקוט** | **נשאר פתוח, וקיבל היום ראיה שהוא של ארבעתם ולא שלו.** נסגר בגל 2 בלבד |
| **15, ויניקוט Q-3** | **עבר.** 51% מהתורות אינן נגמרות בשאלה. לסגור |
| **16, מבחן ייחוס עיוור לבורר** | **קיבל תשובה: ההבדל קיים, והוא 50%.** לעדכן ולא לסגור עד גל 6 |
| **10, ויניקוט בגוף שלישי** | **גל 4 מסכן אותו.** ריצת שנאה בהעברה-נגדית היא תנאי |
| **חדש** | הגוף הראשון, 0 מתוך 96. Tier 2, בעלות איה וקלוד |

---

_בסיס השיפוט: 16 תמלילים · מדידה על ארבעת הבלוקים ועל `CORE_GUARDRAILS` · הצלבה מול `git log`._
_**רמת ביטחון: גבוהה על מה שנמדד. בינונית על כל ניסוח כאן, כי אף תיקון קול אינו נסגר בעריכה, רק בריצה חיה.**_
