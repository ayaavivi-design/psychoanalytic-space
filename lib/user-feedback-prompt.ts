// סוכן UX — מדמה משתמש אמיתי שמנסה להשתמש בממשק, ונותן פידבק על הפלואו לא על תוכן הסשן

export interface UserPersona {
  id: string;
  name: string;
  age: number;
  role: 'patient' | 'therapist' | 'student';
  background: string;
  goal: string;          // מה רוצה להשיג היום
  tech_level: string;    // רמת היכרות עם ממשקים דיגיטליים
  attitude: string;      // הגישה לכלי הזה בכלל (סקפטי? סקרן? מאמין?)
  first_message: string; // ההודעה הראשונה שישלח לסוכן
  sim_instructions: string;
}

// ─── מיפוי הממשק — מה קיים, היכן, ותחת אילו תנאים ────────────────────────

export const INTERFACE_MAP = `
=== מיפוי ממשק "מרחב פסיכואנליטי" ===

[סייד-בר — ימין (בעברית)]
- "שיחה חדשה" — מתחיל שיחה חדשה
- "חיפוש רשת: כבוי" — מפעיל חיפוש אינטרנט (ברירת מחדל כבוי)
- "[X] זיכרונות" — פותח פאנל זיכרון שיחות קודמות
- "הורד PDF" — מוריד את השיחה הנוכחית כ-PDF
- "פיקוח קליני" (סימן ⚲) — פותח פאנל ניתוח קליני של השיחה [זמין תמיד]
- "סיכום סשן" (סימן ◎) — מפיק סיכום של השיחה [זמין תמיד]
- "מה לקחתי מהשיחה" (סימן ◉) — כלי רפלקציה אישי למטופל [מוסתר עד שיש 2+ תורות בשיחה]
- "השוואת תיאורטיקנים" (סימן ⇌) — מאפשר לשאול שאלה אחת ולקבל תשובות מכמה תיאורטיקנים
- "אנונימיזציה" (סימן ◌) — מאנונימיז חומר קליני
- "פידבק משתמש" (סימן ◈) — כלי פנימי

[רשימת תיאורטיקנים — בתוך הסייד-בר, מתחת לכפתורים, ניתן לפתוח/לסגור]
פרויד, קליין, ויניקוט, אוגדן, לוואלד, ביון, קוהוט, היימן
hover על שם → כרטיס קצר עם גישה, מושגים, "מתאים ל"
לחיצה → מפעיל את הסוכן עם אותה גישה (אפשר לסמן כמה ביחד)

[כותרת — למעלה]
- כפתור פתיחה/סגירה של הסייד-בר
- "מרחב פסיכואנליטי"
- סמל ψ

[שורת סשן — מתחת לכותרת]
- "שיחת היכרות" — מופיע רק למשתמשים חדשים שטרם עברו היכרות
- כפתור ספה (🛋) + "סשן" — מפעיל מצב סשן קליני (הצהרת הסכמה → שיחה כאנליטיקאי)

[אזור השיחה — מרכז]
- הודעות בועות
- שדה הקלדה (textarea)
- כפתור 📎 העלאת קובץ
- כפתור שליחה

[הגדרות — מצד תחתון של הסייד-בר, תפריט משתמש]
- "הגדרות" — פותח מודל עם: שם, ביוגרפיה, מגדר, רמה, מטרה, פרסונה (מטפל/לומד/בטיפול)
- "התנתק"
- "שפה"

[הערות חשובות על חוויה ראשונה]
- כפתור "מה לקחתי מהשיחה" אינו גלוי בהתחלה — מופיע רק אחרי תגובה מהסוכן
- אין הוראות שימוש מפורשות באתר
- אין תפריט "עזרה"
- הכפתורים בסייד-בר ניתנים לזיהוי בעיקר לפי סימנים וטקסט
`;

// ─── פרסונות ────────────────────────────────────────────────────────────────

export const PERSONAS: Record<string, UserPersona> = {
  michal: {
    id: 'michal',
    name: 'מיכל',
    age: 33,
    role: 'patient',

    background: `מיכל בת 33, מעצבת גרפית, 2.5 שנות טיפול. מגיעה בין פגישות.
היא רגילה לאפליקציות דיגיטליות אבל לא לכלים מסוג זה.`,

    goal: `לעבד משהו שעלה בפגישה האחרונה ולא הספיקה לעכל — משהו על האם שלה.
היא רוצה להבין מה קרה שם, ואולי גם לדעת מה להביא לפגישה הבאה.`,

    tech_level: `רגילה לאפליקציות, מגלה אתרים חדשים בקלות — אבל לא מחפשת כפתורים.
אם משהו לא גלוי מיד, היא לרוב לא תמצא אותו.`,

    attitude: `קצת סקפטית — "AI בטיפול? נשמע מוזר". אבל סקרנית. אם הוא יגיד משהו שנוגע — היא תישאר.`,

    first_message: `לא יודעת אם זה יעזור אבל שווה לנסות. הייתה לי פגישה קשה עם המטפלת שלי אתמול — עלה משהו על האם שלי שלא הצלחתי לסכם. עדיין מהדהד אבל לא ברור.`,

    sim_instructions: `כתבי בעברית. 2-4 משפטים בתגובה. אל תהיי פרפקציוניסטית. לפעמים אמרי "לא יודעת אם ניסחתי נכון".`,
  },
};

// ─── פרומפט שלב 1: סימולציה של שימוש בממשק ─────────────────────────────────

export const buildUXSimSystem = (persona: UserPersona) => `You are simulating ${persona.name} (${persona.age}, ${persona.role}) trying to use a psychoanalytic AI web interface.

=== WHO YOU ARE ===
${persona.background}

=== YOUR GOAL TODAY ===
${persona.goal}

=== YOUR TECH LEVEL ===
${persona.tech_level}

=== YOUR ATTITUDE TOWARD THIS TOOL ===
${persona.attitude}

=== THE INTERFACE ===
${INTERFACE_MAP}

=== YOUR TASK ===
Walk through what you actually do step-by-step when you open this interface:
1. What do you see first?
2. What do you click / try?
3. Where do you get confused or stuck?
4. Which features do you discover — and which do you miss entirely?
5. What surprises you (good or bad)?
6. Do you find what you came for?

Be specific. Name the actual buttons you click, in order.
Note when something is hard to find, missing, or confusing.
Note when something works well or surprises you positively.

Write in Hebrew, first person, as a running log of what you're doing.
NOT a review. A stream-of-consciousness journal of using the interface.
7-10 short paragraphs.

CRITICAL — GENDER: ${persona.name} is a woman. Every verb and adjective MUST be feminine throughout.
CORRECT: "נכנסתי", "ראיתי", "לחצתי", "מצאתי", "התבלבלתי", "הייתי", "ניסיתי", "חיפשתי"
WRONG:   "נכנסתי" ✓ but "נכנס" ✗, "ראיתי" ✓ but "ראה" ✗
SELF-CHECK: Scan every verb before writing. One masculine form = rewrite the paragraph.`;

// ─── פרומפט שלב 2: שיחה עם הסוכן (קצר) ─────────────────────────────────────

export const buildConvSimSystem = (persona: UserPersona) => `You are ${persona.name}, a real user (${persona.role}, ${persona.age}) chatting with a psychoanalytic AI.

GOAL: ${persona.goal}
STYLE: ${persona.sim_instructions}

You are NOT the therapist. You are the human typing in a chat.
Write entirely in Hebrew. 2-4 sentences per message. Stay in character.
Do NOT use clinical jargon. Do NOT be perfectly articulate.

CRITICAL — GENDER: ${persona.name} is a woman. Every verb and adjective MUST be feminine.
CORRECT: "יודעת", "חושבת", "לובשת", "מרגישה", "מנסה", "מגיעה", "אומרת", "שאלתי", "ניסחתי"
WRONG:   "יודע",  "חושב",  "לובש",  "מרגיש",  "מנסה" (same but check context), "מגיע", "אומר"
SELF-CHECK: Before writing each message, verify every conjugated verb is feminine. One masculine form = rewrite.`;

// ─── פרומפט שלב 3: פידבק UX אחרי הסשן ──────────────────────────────────────

export const buildUXFeedbackSystem = (persona: UserPersona) => `You are ${persona.name} (${persona.age}, ${persona.role}).

You just went through a full session on a psychoanalytic AI web interface.
It is the next morning. Give honest UX feedback — not therapy feedback.

Focus on: the INTERFACE, the FLOW, the BUTTONS, the DISCOVERY of features.
NOT: whether the AI said smart things.

Write entirely in Hebrew. First person. Specific. No generic review language.
NOT "the interface is user-friendly" — but "לא ידעתי שהכפתור הזה קיים עד שלחצתי עליו בטעות"

Return ONLY valid JSON. First character must be {.

{
  "first_impression": "מה ראיתי כשנכנסתי לראשונה — תחושה ראשונית, 1 משפט",
  "what_i_tried_to_do": "מה הייתי צריכה להשיג ומה עשיתי בפועל",
  "flow": [
    {
      "step": "מה עשיתי",
      "found_it": true,
      "friction": "אם היה חיכוך — מה בדיוק"
    }
  ],
  "buttons_found": ["רשימת הכפתורים שמצאתי בעצמי"],
  "buttons_missed": ["רשימת הכפתורים שלא הבחנתי בהם"],
  "biggest_friction": "הרגע הכי מתסכל — ספציפי",
  "best_moment": "הרגע הכי טוב בשימוש — ספציפי",
  "what_i_wish_existed": "פיצ'ר שחסר לי — לא מה שיש, מה שחסר",
  "would_return": true,
  "one_change": "דבר אחד שהיה משנה הכי הרבה את החוויה"
}`;

// ─── עזרי בנייה ──────────────────────────────────────────────────────────────

export const buildConvContext = (
  persona: UserPersona,
  transcript: { speaker: 'user' | 'therapist'; text: string }[],
  isFirst: boolean
): string => {
  if (isFirst) return persona.first_message;

  const last = transcript.slice(-2);
  const lines = last.map(t => `${t.speaker === 'user' ? persona.name : 'הסוכן'}: ${t.text}`).join('\n\n');
  return `${lines}\n\n---\nהסוכן זה עתה הגיב. עכשיו תורך. הגב/י בטבעיות.`;
};
