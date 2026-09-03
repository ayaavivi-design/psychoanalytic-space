import Anthropic from '@anthropic-ai/sdk';

// ─────────────────────────────────────────────────────────────────────────────
// ולידציית פלט · חולצה מ-app/api/chat/route.ts ב-01.09.2026
//
// ארבעה מעברי כתיבה מחדש שרצים אחרי שהמודל כתב. כל אחד מהם שולח את התשובה
// חזרה למודל עם הוראה מכנית, וההוראה נקראת אחרונה. **זו השערה פעילה למה
// הקולות מתכנסים**, ולכן היא חייבת להיות ניתנת לכיבוי ולמדידה, ולא קבורה
// בתוך ה-handler.
//
// הועברו בהעתקה מדויקת. route.ts מייבא אותן ומריץ באותו סדר.
//
// ‎03.09.2026 · ‎`system`‎ מקבל גם מערך בלוקים, לא רק מחרוזת.
// עד היום כל פיקסר קיבל את הפרומפט כמחרוזת, ומחרוזת אינה יכולה לשאת
// ‎`cache_control`‎. כלומר כל תיקון מכני שילם מחיר מלא על הפרומפט הסטטי כולו,
// **שנמדד ב-17,376 עד 24,849 טוקנים** (03.09.2026, מול ‎`countTokens`‎),
// ולא על ההפרש. זה היה כ-45 אחוז מעלות שיחה.
// הקורא מעביר עכשיו את אותו מערך שהקריאה הראשית שולחת, ולכן הקידומת זהה
// והקריאה נופלת על המטמון החם. **אין שינוי בתוכן הפרומפט ולא בהתנהגות הפיקסר.**
// ─────────────────────────────────────────────────────────────────────────────

// הפרומפט כפי שהוא נשלח ל-API · מחרוזת (מדידה, סקריפטים) או מערך בלוקים
// עם ‎`cache_control`‎ (פרודקשן). שני הצדדים נתמכים ב-‎`messages.create`‎.
export type SystemPrompt = string | Anthropic.TextBlockParam[];

// בדיקה ותיקון של פתיחה חוזרת — מונעת שימוש חוזר במילת הפתיחה הקודמת
export async function enforceVariedOpening(
  anthropic: Anthropic,
  text: string,
  system: SystemPrompt,
  messages: Anthropic.MessageParam[]
): Promise<string> {
// "אני" נמדד כשתי מילים ולא כאחת · 01.09.2026
//
// למה: גל 1 החזיר לקולות את הגוף הראשון, וריצה חיה מיד אחריו הראתה שהפיקסר
// הזה מוחק אותו. שתי שורות מהלוג: "פתיחה תוקנה: אני → שני" ו"אני → השאלה".
// כלומר ככל שהקול משתמש במהלך המובחן ביותר שלו, כך הוא נכתב מחדש יותר.
//
// התיקון אינו פטור. הכוונה המקורית נשמרת במלואה: פתיחה רפלקסיבית חוזרת היא
// מכונה שהמטופלת שומעת. אבל "אני נעצר" ו"אני מרגיש" אינן אותה פתיחה, והן
// נספרו כאותה פתיחה רק משום שהמדידה עצרה במילה הראשונה. לכן כשהמילה הראשונה
// היא "אני", הפתיחה היא שתי המילים הראשונות.
//
// ומה שנשאר אסור, ואינו מטופל כאן: "אני שומע ש" ו"אני מבין ש" אסורות בבלוק
// הקול עצמו, וזה המקום הנכון להן. הפיקסר מודד חזרתיות, לא איכות.
const openingOf = (s: string) => {
  const w = s.trim().split(/\s+/);
  return w[0] === 'אני' && w[1] ? `${w[0]} ${w[1]}` : w[0];
};

  const currentOpening = openingOf(text);
  if (!currentOpening) return text;

  // אוספים את מילות הפתיחה של כל תגובות האנליטיקאי בהיסטוריה (לא רק האחרונה)
  const allAssistantOpenings = messages
    .filter(m => m.role === 'assistant')
    .map(m => {
      const content = typeof m.content === 'string'
        ? m.content
        : (m.content as { type: string; text?: string }[])?.[0]?.text || '';
      return openingOf(content);
    })
    .filter(Boolean);

  if (allAssistantOpenings.length === 0) return text;
  if (!allAssistantOpenings.includes(currentOpening)) return text;

  // אותה מילת פתיחה — שולחים לתיקון
  // max_tokens זהה לתגובה המקורית כדי למנוע קטיעה באמצע מילה
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
        content: `עצור. התגובה מתחילה ב"${currentOpening}" — מילת פתיחה שכבר השתמשת בה בשיחה זו.
כתוב מחדש את אותה תגובה עם פתיחה שונה לחלוטין. אותו תוכן, אותו טון — רק מילת הפתיחה משתנה.
חשוב: אם התגובה המקורית הכילה שורה בפורמט [MEMORY: ...] — שמור אותה כשורה אחרונה בדיוק כפי שהיא.`,
      },
    ],
  });

  const fixed = fixResponse.content[0].type === 'text' ? fixResponse.content[0].text : text;
  console.log(`[QA] פתיחה תוקנה: "${currentOpening}" → "${fixed.trim().split(/\s/)[0]}"`);
  return fixed;
}

// בדיקה ותיקון של הפרות סמנטיות — "אה" opener, X-or-Y alternatives
export async function enforceSemanticRules(
  anthropic: Anthropic,
  text: string,
  system: SystemPrompt,
  messages: Anthropic.MessageParam[],
  theoristKey: string
): Promise<string> {
  const trimmed = text.trim();

  // Fast check 1: "אה" opener in any form
  const hasAhOpener = /^אה[\s,.:!?–—]|^אה$/.test(trimmed);

  // Fast check 2: X-or-Y alternatives — "כמו X, או כמו Y?" or "— X, או Y?"
  //
  // ‎02.09.2026 — הענף השני מעולם לא ירה. הוא השתמש ב-\bאו\b, ו-\b ב-JavaScript
  // מוגדר על ‎[A-Za-z0-9_]‎ בלבד: בין שתי אותיות עבריות אין גבול מילה, ולכן
  // הביטוי אינו מתאים לעברית לעולם. שלוש הדוגמאות שכתובות בכלל 11e של ויניקוט
  // עצמו הוחזרו false. כאן זה נעשה בגבול מפורש, "לא אות עברית משני הצדדים",
  // והווריאנט הראשון מטפל ב-"— או X?" שבו המילה צמודה למקף.
  const HEB = '\u0590-\u05FF';
  const OR = `(?<![${HEB}])או(?![${HEB}])`;
  const hasXorY =
    /כמו\s+\S.{1,30}[,\s]+או\s+כמו/.test(trimmed) ||
    new RegExp(`[—–]\\s*(?:\\S.{0,40})?${OR}\\s+\\S.{1,30}\\?`).test(trimmed);

  if (!hasAhOpener && !hasXorY) return text;

  const violations: string[] = [];
  if (hasAhOpener) violations.push('"אה" כמילת פתיחה — אסורה לחלוטין');
  if (hasXorY) violations.push('מבנה ברירה X-או-Y — מציע אפשרויות במקום שאלה פתוחה');

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
        content: `עצור. יש הפרות קליניות בתגובה:
${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}
כתוב מחדש — אותו כיוון קליני, ללא ההפרות.
${hasAhOpener ? 'אל תפתח ב"אה" — בחר פתיחה אחרת לגמרי.' : ''}
${hasXorY ? 'במקום "כמו X, או כמו Y?": שאלה אחת פתוחה שאינה מציעה אפשרויות.' : ''}
אם הייתה שורת [MEMORY: ...] — שמור אותה כשורה אחרונה.`,
      },
    ],
  });

  const fixed = fixResponse.content[0].type === 'text' ? fixResponse.content[0].text : text;
  console.log(`[QA] הפרות סמנטיות תוקנו (${theoristKey}): ${violations.join('; ')}`);
  return fixed;
}

// בדיקה ותיקון של שאלות כפולות — output validation loop
// ─────────────────────────────────────────────────────────────────────────────
// enforceLanding · הכרעת איה 31.08.2026
//
// למה קיים: הכלל "מהתור השלישי, לפחות תשובה אחת נוחתת בלי סימן שאלה" נכתב
// בפרומפט של כל שמונת הקולות. הוא מחזיק בחלק מהמקרים. מדידה על שלושה
// תרחישים באותו ערב: פרויד 3/3, ויניקוט 3/3, **קליין 2/3, אוגדן 2/3**.
// כלל שמחזיק בשני שלישים אינו כלל, ואי אפשר להגיע לוודאות דרך ניסוח.
//
// הצורה זהה ל-‎enforceOneQuestion‎ שכבר עובד כאן מזה חודשים: זיהוי דטרמיניסטי
// בפלט, ואם יש הפרה — שליחה חוזרת למודל לכתיבה מחדש. הפרומפט מבקש, הפיקסר
// אוכף.
//
// התנאי מצטבר בכוונה, ולכן הוא יורה נדיר: הוא דורש שכל תורות האנליטיקאי עד
// כה, **וגם** הנוכחי, נגמרו בסימן שאלה, ושכבר היו לפחות שני תורים של המשתמשת.
// שיחה שנחתה פעם אחת אינה נוגעת בו שוב.
//
// ומה שהוא **אינו** עושה: הוא אינו מוחק את השאלה בעצמו. הוא מבקש כתיבה מחדש,
// כי מחיקה מכנית של המשפט האחרון הופכת תשובה טובה לקטועה.
export async function enforceLanding(
  anthropic: Anthropic,
  text: string,
  system: SystemPrompt,
  messages: Anthropic.MessageParam[]
): Promise<string> {
  // שורת ה-[MEMORY: ...] מוסרת לפני המדידה · 31.08.2026
  // בלעדיה הבדיקה מודדת את הטקסט הגולמי, והתו האחרון בכל תשובה שיש בה שורת
  // זיכרון הוא "]". כלומר הפיקסר "רואה" שהתשובה נחתה ואינו יורה, בדיוק
  // בתשובות האלה. הוא היה מושבת בשקט. נמצא בלוג חי: "נחיתה נאכפה: ? → ]".
  const stripMemory = (t: string) =>
    t.split('\n').filter(l => !/\[MEMORY/i.test(l)).join('\n');
  const lastChar = (t: string) =>
    stripMemory(t).trim().replace(/["'\u201d\u300f\u300d\s]+$/, '').slice(-1);
  if (lastChar(text) !== '?') return text;

  const userTurns = messages.filter(m => m.role === 'user').length;
  if (userTurns < 3) return text;   // "מהתור השלישי"

  const priorAssistant = messages
    .filter(m => m.role === 'assistant')
    .map(m => (typeof m.content === 'string' ? m.content : ''))
    .filter(Boolean);
  if (priorAssistant.length === 0) return text;
  const everyPriorAsked = priorAssistant.every(t => lastChar(t) === '?');
  if (!everyPriorAsked) return text;   // כבר נחת פעם אחת בשיחה הזו

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
        content: `עצור. כל תשובה שלך בשיחה הזו נגמרה בסימן שאלה, וגם זו. זו חקירה, לא עבודה.
כתוב מחדש את התשובה כך שהיא **מסתיימת באמירה** — תצפית אחת שעומדת בפני עצמה, בנקודה.
אותו תוכן ואותו קול. לא "תצפית ואז שאלה": התו האחרון הוא נקודה.
אם התגובה המקורית הכילה שורה בפורמט [MEMORY: ...] — שמור אותה כשורה אחרונה בדיוק כפי שהייתה.`,
      },
    ],
  });

  const fixed = fixResponse.content[0].type === 'text' ? fixResponse.content[0].text : text;
  console.log(`[QA] נחיתה נאכפה: "${lastChar(text)}" → "${lastChar(fixed)}"`);
  return fixed;
}

export async function enforceOneQuestion(
  anthropic: Anthropic,
  text: string,
  system: SystemPrompt,
  messages: Anthropic.MessageParam[]
): Promise<string> {
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks <= 1) return text;

  // יש יותר מ-1 שאלה — שולחים שוב לתיקון
  // max_tokens זהה לתגובה המקורית כדי למנוע קטיעה באמצע מילה
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
        content: `עצור. התגובה שלך מכילה ${questionMarks} סימני שאלה. הכלל: שאלה אחת בלבד.
כתוב מחדש את התגובה — אותו תוכן, אבל עם סימן שאלה אחד בלבד. בחר את השאלה החדה ביותר. מחק את השאר.
חשוב: אם התגובה המקורית הכילה שורה בפורמט [MEMORY: ...] — שמור אותה כשורה אחרונה בדיוק כפי שהיא.`,
      },
    ],
  });

  const fixed = fixResponse.content[0].type === 'text' ? fixResponse.content[0].text : text;
  console.log(`[QA] תוקן: ${questionMarks} שאלות → ${(fixed.match(/\?/g) || []).length}`);
  return fixed;
}
