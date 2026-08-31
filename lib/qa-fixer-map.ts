// lib/qa-fixer-map.ts
// מקור אמת יחיד: מיפוי כל קוד QA ל-fixer בפרודקשן (app/api/chat/route.ts).
//
// מטרה: ה-QA היומי (qa-full) בודק פלט גולמי ומסמן issues מכנית. חלק מהם נתפסים
// ומתוקנים בפרודקשן ע"י לולאת ה-output validation לפני שמשתמש רואה — וחלקם לא.
// המפה הזו מסווגת כל issue ל:
//   • FAIL    — אין fixer בפרודקשן → המשתמש רואה את זה.
//   • WARNING — יש fixer מתאים → המשתמש כנראה לא רואה, אבל caught ≠ clean
//               (ל-fixers אין re-validation), וזה גם עלה קריאת תיקון נוספת.
//
// ⚠️ DRIFT: כשמוסיפים fixer חדש ל-chat/route.ts או קוד חדש ל-checkTurn ב-qa-full —
// חייבים לעדכן את QA_RULES כאן. scripts/qa-drift-check.mjs מאמת שאין drift.

export type ProductionFixer =
  | 'enforceOneQuestion'
  | 'enforceVariedOpening'
  | 'enforceSemanticRules' | 'enforceLanding';

export interface QaRule {
  code: string;
  /** שם ה-fixer בפרודקשן שתופס את הבעיה, או null אם אין רשת ביטחון — המשתמש רואה. */
  fixer: ProductionFixer | null;
  /** הסבר קצר בעברית לדוח. */
  label: string;
}

// כל הקודים ש-checkTurn ב-qa-full יכול לפלוט.
// עיקרון סיווג שמרני (איתן): כשלא בטוחים שפרודקשן תופס — מסמנים null (FAIL), לא מסתירים.
export const QA_RULES: Record<string, QaRule> = {
  'Q-1': { code: 'Q-1', fixer: 'enforceOneQuestion',   label: 'יותר משאלה אחת' },
  'O-7': { code: 'O-7', fixer: 'enforceVariedOpening', label: 'פתיחה חוזרת' },
  'S-1': { code: 'S-1', fixer: null,                   label: 'stage directions' },
  // 31.08.2026: נוסף enforceLanding ב-chat/route.ts, ובכל זאת Q-3 נשאר null
  // בכוונה. ה-QA מריץ את השיחה **דרך** נתיב הפרודקשן, כלומר הפיקסרים כבר רצו
  // לפני שהטקסט נמדד. הפרה ש-QA עדיין רואה אינה "נתפסה", היא **חמקה מהרשת**,
  // וזה חמור יותר ולא פחות. סימון fixer כאן היה מוריד אותה מאדום לכתום ומסתיר
  // בדיוק את המקרה שבגללו הפיקסר נכתב.
  'Q-3': { code: 'Q-3', fixer: null,                   label: 'כל התגובות שאלות — אין תצפית' },
  // O = פתיחה אסורה (FORBIDDEN_OPENERS). חלקי: רק "אה" נתפס ב-enforceSemanticRules,
  // שאר הפתיחות ('יום טוב', 'שלום,', 'אני כאן'...) אינן נתפסות. שמרני → FAIL.
  'O':   { code: 'O',   fixer: null,                   label: 'פתיחה אסורה (רק "אה" נתפס בפרודקשן)' },
  // ── נוספו 31.08.2026 · שני הכללים שנכנסו לפרומפטים באותו יום ולמדידה לא הייתה
  //    דרך לראות אותם. "4/4 נקי" של הריצה הקודמת היה נכון ולא אמר כלום עליהם.
  'L-1': { code: 'L-1', fixer: null,                   label: 'אף תור לא נחת · כולם נגמרו בשאלה' },
  'A-1': { code: 'A-1', fixer: null,                   label: 'עצה או הכרעה במקום המטופלת · לבדיקה' },
  // 31.08.2026: נמצא בתמליל חי של קליין, "את/ה נשאר/ת בתוך הבית". האיסור על
  // צורת הלוכסן קיים בפרומפט, ולא הייתה לו שום בדיקה. הוא חמור במיוחד כי
  // הוא הסימן הבולט ביותר לכך שמדובר בתבנית ולא באדם.
  'S-2': { code: 'S-2', fixer: null,                   label: 'צורת לוכסן — "את/ה", "נשאר/ת"' },
};

/** שמות ה-fixers שהמפה מסתמכת על קיומם ב-chat/route.ts — בשימוש ה-drift check. */
export const REFERENCED_FIXERS: ProductionFixer[] = Array.from(
  new Set(
    Object.values(QA_RULES)
      .map(r => r.fixer)
      .filter((f): f is ProductionFixer => f !== null)
  )
);

/**
 * מחלץ את קוד ה-issue ממחרוזת.
 * תומך ב: "[תור 2] O-7: פתיחה חוזרת", "O-7: ...", "[Q-3] ...".
 */
export function codeOf(issue: string): string {
  let s = issue.trim();
  s = s.replace(/^\[תור\s*\d+\]\s*/, ''); // הסרת תחילית "[תור N] "
  const bracket = s.match(/^\[([^\]]+)\]/); // פורמט "[CODE] ..."
  if (bracket) return bracket[1].trim();
  const colon = s.indexOf(':'); // פורמט "CODE: ..."
  if (colon !== -1) return s.slice(0, colon).trim();
  return s.trim();
}

export type Severity = 'fail' | 'warning';

/** סיווג issue בודד. קוד לא מוכר → fail (להציף, לא להסתיר). */
export function severityOf(issue: string): Severity {
  const rule = QA_RULES[codeOf(issue)];
  if (!rule) return 'fail';
  return rule.fixer ? 'warning' : 'fail';
}

export interface Classification {
  /** המשתמש רואה — אין fixer בפרודקשן. */
  realFails: string[];
  /** פרודקשן כנראה מתקן — caught ≠ clean, וגם עלה קריאת תיקון. */
  caught: string[];
  /** קודים שלא קיימים ב-QA_RULES — drift אמיתי, מטופל כ-fail. */
  unknownCodes: string[];
}

export function classifyIssues(issues: string[]): Classification {
  const realFails: string[] = [];
  const caught: string[] = [];
  const unknownCodes: string[] = [];
  for (const issue of issues) {
    const code = codeOf(issue);
    const rule = QA_RULES[code];
    if (!rule) {
      if (!unknownCodes.includes(code)) unknownCodes.push(code);
      realFails.push(issue); // קוד לא מוכר → להציף כ-fail
      continue;
    }
    if (rule.fixer) caught.push(issue);
    else realFails.push(issue);
  }
  return { realFails, caught, unknownCodes };
}
