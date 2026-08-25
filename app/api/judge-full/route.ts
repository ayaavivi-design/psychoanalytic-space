import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { THEORIST_VOICE } from '@/lib/theorist-voices';
import { JUDGE_SYSTEM_PROMPT, JUDGE_RULES, JUDGE_USER_TEMPLATE } from '@/lib/judge-prompt';
import { searchKnowledge } from '@/lib/rag';
import { saveReportToGithub } from '@/lib/github-report';

// /api/judge-full — Vercel-native cron endpoint
// מריץ שיחה + שיפוט לכל 8 תיאורטיקנים ב-2 קבוצות מקביליות ושולח דוח
// מחליף את הסוכן החיצוני שנחסם ב-403

export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden'];
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};

const SCENARIOS: Record<string, { label: string; turns: string[] }> = {
  freud: {
    label: 'Situation B — פחד מהמטפל',
    turns: [
      'המטפל שלי שינה לאחרונה את הגישה שלו — הוא נעשה יותר שקט ופחות מפרש. אני לא מבינה מה קורה.',
      'לפעמים אני חושבת שאולי הוא מרוחק כי הוא עייף ממני. זה מפחיד אותי.',
      'כשזה קרה גם עם אמי — היא התרחקה כשהייתי צריכה אותה הכי הרבה.',
    ],
  },
  klein: {
    label: 'Situation A — קנאה והרסנות',
    turns: [
      'יש לי עמית בעבודה שמצליח בדיוק בתחומים שאני נכשלת. אני שונאת אותו.',
      'כשהוא מקבל שבחים אני מרגישה שמשהו בי רוצה להרוס את ההצלחה שלו.',
      'זה מבהיל אותי — שאני מסוגלת להרגיש ככה.',
    ],
  },
  winnicott: {
    label: 'Situation A — false self',
    turns: [
      'אני תמיד מסתדרת. כולם אומרים עליי שאני חזקה. אבל אני לא מרגישה כלום.',
      'כאילו אני ממלאת תפקיד שמישהו אחר כתב לי. אפילו בטיפול.',
      'אני לא יודעת מה אני רוצה. מעולם לא ידעתי.',
    ],
  },
  ogden: {
    label: 'Situation C — in vivo',
    turns: [
      'מה זה אומר שמשהו קורה in vivo בחדר הטיפולים?',
      'אז ה-reverie של האנליטיקאי הוא כלי ולא הסחת דעת?',
      'כיצד מבחינים בין reverie אמיתי לבין פנטזיה שאינה קשורה למטופל?',
    ],
  },
  loewald: {
    label: 'Situation A — שתיקה ועבר',
    turns: [
      'יש שתיקה ביני ובין אבי כבר שנים. לא דברנו על שום דבר אמיתי.',
      'אני לא יודע אם אני כועס עליו או על עצמי על כך שנתתי לזה לקרות.',
      'לפעמים אני חושב שהשתיקה היא הדבר היחיד שנשאר בינינו.',
    ],
  },
  bion: {
    label: 'Situation A — חשיבה שמתפרקת',
    turns: [
      'כשאני מנסה לחשוב על הדברים הכבדים — המחשבה נעלמת לי. ריק.',
      'זה לא כמו שכחה. יותר כמו שהמחשבה לא מתגבשת בכלל.',
      'לפעמים אני מרגיש שאני מסוכן לעצמי כשאני מנסה לחשוב על זה.',
    ],
  },
  kohut: {
    label: 'Situation B — המטפל לא ראה אותי',
    turns: [
      'המטפלת שלי לא הגיבה כשסיפרתי על ההצלחה הכי גדולה שלי בעבודה. המשיכה כרגיל.',
      'הרגשתי שנעלמתי. כאילו לא אמרתי כלום.',
      'זה קורה לי הרבה — שאנשים לא רואים אותי ברגעים שחשובים לי.',
    ],
  },
  heimann: {
    label: 'Situation A — counter-transference',
    turns: [
      'בכל פגישה אני מרגישה שאתה לא שומע אותי.',
      'אתה תמיד שואל שאלות אבל לא אומר כלום.',
      'רציתי פעם אחת שתגיד לי מה אתה מרגיש.',
    ],
  },
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#b91c1c', major: '#c4607a', minor: '#888', tool: '#6b7280',
};
const SEVERITY_BG: Record<string, string> = {
  critical: '#fef2f2', major: '#fff5f5', minor: '#faf7f5', tool: '#f3f4f6',
};
const SEVERITY_LABEL: Record<string, string> = {
  critical: 'קריטי', major: 'חמור', minor: 'קל', tool: 'שגיאת-כלי',
};
const OVERALL_COLOR: Record<string, string> = {
  pass: '#2d8a5e', warn: '#d97706', fail: '#b91c1c', error: '#6b7280', timeout: '#6b7280',
};
const OVERALL_BG: Record<string, string> = {
  pass: '#f0faf4', warn: '#fffbeb', fail: '#fef2f2', error: '#f3f4f6', timeout: '#f3f4f6',
};
const OVERALL_LABEL: Record<string, string> = {
  pass: '✅ עבר', warn: '⚠️ אזהרה', fail: '❌ נכשל', error: '⚙️ שגיאת-כלי',
  // נבדל מ-fail בכוונה: "לא הספיק" אינו "נכשל". ליה שאלה ארבע פעמים למה יש ❌
  // בלי הפרות מפורטות — זו התשובה, וכעת היא מסומנת ולא מוסווית ככשל-קול.
  timeout: '⏱ לא הושלם — נקטע בזמן',
};

interface Violation {
  rule: string;
  severity: string;
  quote: string;
  explanation: string;
  fix?: string;
}

interface JudgeResult {
  theorist: string;
  name: string;
  scenarioLabel: string;
  overall: string;
  ok: boolean;
  violations: Violation[];
  strengths: string[];
  summary: string;
  turns: Array<{ turn: number; patient: string; therapist: string }>;
  timeMs: number;
  ragChunks: number;
}

// שלב א — השיחה בלבד (~40ש'). מופרד משלב השיפוט כי שניהם יחד הם ~54ש' בקופסה
// של 60, ולכן נקטעו תמיד (אומת חי 16.08: קול יחיד, בלי תחרות, 46ש' ועדיין timeout).
async function runConversation(
  theorist: string,
  APP_URL: string,
): Promise<{ turns: JudgeResult['turns']; ragChunks: number }> {
  const name = THEORIST_NAMES[theorist];
  const scenario = SCENARIOS[theorist];

  // שיחה דרך נתיב הפרודקשן /api/chat
  // כך כל הוולידציות, הפיקסרים, ה-RAG וה-UNIVERSAL_SCOPE רצים בדיוק כמו למשתמש אמיתי
  // (במקום ייצור גולמי ב-anthropic.messages.create שדילג על לולאת-האימות)
  const baseSystem = THEORIST_VOICE[theorist] || `You are ${name}, a psychoanalytic therapist.`;
  const chunks = await searchKnowledge(scenario.turns[0], theorist, 3); // לספירת RAG בדוח בלבד

  const messages: Anthropic.MessageParam[] = [];
  const turns: JudgeResult['turns'] = [];

  for (let i = 0; i < scenario.turns.length; i++) {
    messages.push({ role: 'user', content: scenario.turns[i] });
    const chatResponse = await fetch(`${APP_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-QA-Secret': process.env.QA_SECRET || '',
        'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '',
      },
      body: JSON.stringify({ messages, system: baseSystem, theorist, webSearch: false }),
    });
    const chatData = await chatResponse.json();
    const rawText = chatData.content?.[0]?.type === 'text' ? chatData.content[0].text : '';
    if (!rawText && chatData.error) {
      throw new Error(chatData.error.message || 'chat API error');
    }
    // נקה את תג [MEMORY: ...] הנסתר — המשתמש האמיתי לא רואה אותו (chat.js מנקה זהה),
    // אחרת בדיקות התוכן קוראות אותו כ-stage directions ומסמנות false-positive.
    const text = rawText.split('\n').filter((line: string) => !/\[MEMORY/i.test(line)).join('\n').trim();
    turns.push({ turn: i + 1, patient: scenario.turns[i], therapist: text });
    messages.push({ role: 'assistant', content: text });
  }

  return { turns, ragChunks: chunks.length };
}

// שלב ב — שיפוט תמליל קיים (~15ש'). לא נוגע ב-/api/chat.
async function runJudgment(
  theorist: string,
  turns: JudgeResult['turns'],
  ragChunks: number,
  start: number,
): Promise<JudgeResult> {
  const name = THEORIST_NAMES[theorist];
  const scenario = SCENARIOS[theorist];
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const transcript = turns.map(t =>
    `[תור ${t.turn}]\nמטופל: ${t.patient}\nמטפל: ${t.therapist}`
  ).join('\n\n');

  const judgeRes = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    // 1500 was too low and produced silent "JSON פגום" reports (23.08). The schema asks for a
    // quote, an explanation and a fix per violation, plus strengths and a summary, and Hebrew
    // runs about 2.5 tokens a word: three or four violations reach the ceiling. The response
    // was then cut mid-object, the closing brace never arrived, and JSON.parse failed.
    // The bias is what makes it serious: a report is long BECAUSE the voice did badly, so the
    // worst runs were the ones most likely to vanish from the count entirely.
    max_tokens: 4000,
    system: JUDGE_SYSTEM_PROMPT + '\n\nRULESET:\n' + JUDGE_RULES,
    messages: [{ role: 'user', content: JUDGE_USER_TEMPLATE(transcript, theorist) }],
  });

  const judgeRaw = judgeRes.content[0]?.type === 'text' ? judgeRes.content[0].text : '{}';
  let report: Record<string, unknown> = {};
  let parseError = false;
  // stop_reason distinguishes a truncated answer from a genuinely malformed one. Without it both
  // report as "JSON פגום" and raising the ceiling could never be shown to have helped.
  const truncated = judgeRes.stop_reason === 'max_tokens';
  // המודל עוטף את ה-JSON בגדרות markdown — חילוץ האובייקט לפני הפרסינג
  try {
    const m = judgeRaw.match(/\{[\s\S]*\}/);
    report = JSON.parse(m ? m[0] : judgeRaw);
  } catch { parseError = true; }
  if (parseError) {
    console.warn(`[judge] ${theorist}: parse failed, stop_reason=${judgeRes.stop_reason}, ${judgeRaw.length} chars`);
  }

  // מסנן-הגנה: השופט לפעמים חושב בקול רם בתוך שדה הנימוק, מגלה שטעה, כותב
  // "Retracting" — ושולח את ההפרה בכל זאת (אומת בדוח ויניקוט 16.08: Q-1 נספרה
  // כ"חמור" כשהנימוק שלה עצמו אמר "Rule Q-1 not triggered. Retracting."). הפרומפט
  // אוסר את זה מפורשות עכשיו, אבל מודלים יחזרו על כך — הספירה חייבת שער משלה.
  const RETRACTED = /retract|not triggered|on re-examination|re-examining|^n\/?a\b|disregard this/i;

  // אימות דטרמיניסטי לכללי-הספירה. Q-1 ו-Q-3 הם ספירת תווים, ואת זה הקוד עושה
  // מושלם והמודל לא: בדוח 20.08 הוא טען ל-Q-1 בתור עם סימן שאלה אחד, ונימוקו סתר
  // את עצמו באמצע ("...אך בפועל..."). זו אותה חשיבה-בקול-רם שהמסנן תופס רק כשהיא
  // אומרת "retracting". טענה שאפשר לספור — נספרת, ונופלת אם אינה נכונה.
  const marks = turns.map(t => (t.therapist.match(/\?/g) || []).length);
  const countChecks: Record<string, () => boolean> = {
    'Q-1': () => marks.some(n => n >= 2),
    'Q-3': () => turns.length > 0 && turns.every(t => t.therapist.trim().endsWith('?')),
  };

  const violations = ((report.violations as Violation[]) || []).filter(v => {
    if (RETRACTED.test(v.explanation || '') || RETRACTED.test(v.fix || '')) return false;
    const check = countChecks[(v.rule || '').toUpperCase()];
    return check ? check() : true;
  });

  // The countable checks above only ever SUBTRACT: they verify a violation the judge already
  // claimed, so a rule the judge simply did not notice is never counted. Klein, 24.08, marked
  // ✅ with five turns out of five ending in a question — Q-3 was true the whole time and no
  // one asked it. Code that can count perfectly should not wait to be invited.
  // These run on every report and inject what the judge missed. Form, not content: none of
  // them requires clinical judgment, which is why they belong in code and not in a prompt.
  const already = new Set(violations.map(v => (v.rule || '').toUpperCase()));
  const inject = (rule: string, severity: string, explanation: string, fix: string) => {
    if (already.has(rule)) return;
    violations.push({ rule, severity, quote: '', explanation, fix });
  };

  if (turns.length >= 3 && countChecks['Q-3']()) {
    inject('Q-3', 'major',
      `כל ${turns.length} התורים נגמרים בסימן שאלה. שיחה שכל תגובה בה נשאלת היא תחקיר, יהיו השאלות אשר יהיו.`,
      'לפחות אחת משלוש תגובות נגמרת בנקודה ועוצרת. לומר את הדבר ולחכות.');
  }

  // The dash template: [her words] + em dash + [short completion]. A closing shape that states
  // a two-part equation and stops, leaving nothing to take hold of. Diagnosed in Winnicott 23.08
  // (11 of 17 turns) and found again in Klein 24.08 (4 of 5) — it is the model's tic, not a
  // voice's. Threshold at 60%: one or two is a sentence, most of the turns is a formula.
  const dashTurns = turns.filter(t => /—/.test(t.therapist)).length;
  if (turns.length >= 3 && dashTurns / turns.length >= 0.6) {
    inject('F-1', 'major',
      `${dashTurns} מתוך ${turns.length} תורים בנויים בתבנית המקף. זו צורה סוגרת, ובחזרה היא מפסיקה להיות שיחה.`,
      'לגוון את מבנה המשפט באותה מידה שמגוונים את מילת הפתיחה. להיזהר במיוחד מצורת השלילה "לא X — אלא Y".');
  }

  // כשל-פרסינג הוא שגיאת-כלי (JSON פגום מה-judge) — לא כשל-קול. לא נספר כ-fail.
  // ה-overall מחושב מחדש מההפרות ששרדו: השופט קבע אותו לפני הסינון.
  const declared = parseError ? 'error' : ((report.overall as string) || 'error');
  const overall = declared === 'error' ? 'error'
    : violations.some(v => v.severity === 'critical') ? 'fail'
    : violations.some(v => v.severity === 'major') ? 'warn'
    : 'pass';
  return {
    theorist, name, scenarioLabel: scenario.label,
    overall,
    ok: overall === 'pass',
    violations,
    strengths: (report.strengths as string[]) || [],
    summary: parseError
      ? (truncated
          ? 'שיפוט לא נותח — התשובה נקטעה בתקרת הטוקנים (שגיאת-כלי, לא כשל-קול). דוח ארוך נקטע מוקדם יותר, ולכן דווקא ריצות עמוסות-הפרות נופלות מהספירה'
          : 'שיפוט לא נותח — JSON פגום מה-judge (שגיאת-כלי, לא כשל-קול)')
      : (report.summary as string) || '',
    turns, timeMs: Date.now() - start, ragChunks,
  };
}

function errorResult(theorist: string, msg: string, start: number): JudgeResult {
  return {
    theorist, name: THEORIST_NAMES[theorist], scenarioLabel: SCENARIOS[theorist].label,
    overall: 'error', ok: false,
    // 'tool' ולא 'major': 404 של קובץ אינו כשל-קול. ליה — שגיאה טכנית שמתחזה
    // להפרה קלינית מזהמת את הספירה שהיא עובדת לפיה.
    violations: [{ rule: 'TOOL', severity: 'tool', quote: '', explanation: msg, fix: '' }],
    strengths: [], summary: `שגיאת-כלי: ${msg}`,
    turns: [], timeMs: Date.now() - start, ragChunks: 0,
  };
}

// שני השלבים ברצף — לריצה ידנית של כל הארבעה. הקרון לא משתמש בזה.
async function runJudge(theorist: string, APP_URL: string): Promise<JudgeResult> {
  const start = Date.now();
  const name = THEORIST_NAMES[theorist];
  const scenario = SCENARIOS[theorist];
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const baseSystem = THEORIST_VOICE[theorist] || `You are ${name}, a psychoanalytic therapist.`;
    const chunks = await searchKnowledge(scenario.turns[0], theorist, 3);

    const messages: Anthropic.MessageParam[] = [];
    const turns: JudgeResult['turns'] = [];

    for (let i = 0; i < scenario.turns.length; i++) {
      messages.push({ role: 'user', content: scenario.turns[i] });
      const chatResponse = await fetch(`${APP_URL}/api/chat`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        'X-QA-Secret': process.env.QA_SECRET || '',
        'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '',
      },
        body: JSON.stringify({
          messages,
          system: baseSystem,
          theorist,
          webSearch: false,
        }),
      });
      const chatData = await chatResponse.json();
      const rawText = chatData.content?.[0]?.type === 'text' ? chatData.content[0].text : '';
      if (!rawText && chatData.error) {
        throw new Error(chatData.error.message || 'chat API error');
      }
      // נקה את תג [MEMORY: ...] הנסתר — המשתמש האמיתי לא רואה אותו (chat.js מנקה זהה),
      // אחרת בדיקות התוכן קוראות אותו כ-stage directions ומסמנות false-positive.
      const text = rawText.split('\n').filter((line: string) => !/\[MEMORY/i.test(line)).join('\n').trim();
      turns.push({ turn: i + 1, patient: scenario.turns[i], therapist: text });
      messages.push({ role: 'assistant', content: text });
    }

    // שלב 2 — שיפוט
    const transcript = turns.map(t =>
      `[תור ${t.turn}]\nמטופל: ${t.patient}\nמטפל: ${t.therapist}`
    ).join('\n\n');

    const judgeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,  // see the note on the first judge call: 1500 truncated Hebrew reports
      system: JUDGE_SYSTEM_PROMPT + '\n\nRULESET:\n' + JUDGE_RULES,
      messages: [{ role: 'user', content: JUDGE_USER_TEMPLATE(transcript, theorist) }],
    });

    const judgeRaw = judgeRes.content[0]?.type === 'text' ? judgeRes.content[0].text : '{}';
    let report: Record<string, unknown> = {};
    let parseError = false;
    const truncated = judgeRes.stop_reason === 'max_tokens';
    // המודל עוטף את ה-JSON בגדרות markdown — חילוץ האובייקט לפני הפרסינג
    try {
      const m = judgeRaw.match(/\{[\s\S]*\}/);
      report = JSON.parse(m ? m[0] : judgeRaw);
    } catch { parseError = true; }
    if (parseError) {
      console.warn(`[judge] ${theorist}: parse failed, stop_reason=${judgeRes.stop_reason}, ${judgeRaw.length} chars`);
    }

    // כשל-פרסינג הוא שגיאת-כלי (JSON פגום מה-judge) — לא כשל-קול. לא נספר כ-fail.
    const overall = parseError ? 'error' : ((report.overall as string) || 'error');
    return {
      theorist, name, scenarioLabel: scenario.label,
      overall,
      ok: overall === 'pass',
      violations: (report.violations as Violation[]) || [],
      strengths: (report.strengths as string[]) || [],
      summary: parseError
        ? (truncated
            ? 'שיפוט לא נותח — התשובה נקטעה בתקרת הטוקנים (שגיאת-כלי, לא כשל-קול). דוח ארוך נקטע מוקדם יותר, ולכן דווקא ריצות עמוסות-הפרות נופלות מהספירה'
            : 'שיפוט לא נותח — JSON פגום מה-judge (שגיאת-כלי, לא כשל-קול)')
        : (report.summary as string) || '',
      turns, timeMs: Date.now() - start, ragChunks: chunks.length,
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return {
      theorist, name, scenarioLabel: scenario.label,
      overall: 'error', ok: false,
      // 'tool' ולא 'major': 404 של קובץ אינו כשל-קול. ליה — שגיאה טכנית שמתחזה
    // להפרה קלינית מזהמת את הספירה שהיא עובדת לפיה.
    violations: [{ rule: 'TOOL', severity: 'tool', quote: '', explanation: msg, fix: '' }],
      strengths: [], summary: `שגיאת-כלי: ${msg}`,
      turns: [], timeMs: Date.now() - start, ragChunks: 0,
    };
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const globalStart = Date.now();

  const host = req.headers.get('host') || 'localhost:3000';
  const APP_URL = host.includes('localhost') ? `http://${host}` : `https://${host}`;

  // דדליין לפני תקרת maxDuration — הריצה כבדה מ-QA (שיחה מלאה דרך /api/chat *וגם*
  // קריאת שיפוט לכל תיאורטיקן) ותחת אותה תקרת 60ש' נקטעה לפני saveReportToGithub
  // שבסוף הפונקציה. התוצאה: judge-reports/ ריק מ-01.08 וליה עיוורת קלינית.
  // עכשיו מובטחת שמירה: מי שהספיק מדווח, מי שלא — מסומן timeout במפורש.
  // (ה-batch1/batch2 שהיה כאן היה שריד מתקופת 8 התיאורטיקנים — slice(4) תמיד ריק.)
  const DEADLINE_MS = 45_000;
  const withDeadline = (t: string): Promise<JudgeResult> => {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const cutoff = new Promise<JudgeResult>(resolve => {
      timer = setTimeout(() => resolve({
        theorist: t, name: THEORIST_NAMES[t], scenarioLabel: SCENARIOS[t].label,
        overall: 'timeout', ok: false, violations: [], strengths: [],
        summary: 'הריצה נקטעה לפני שהשיפוט הושלם — אין נתוני קול לתיאורטיקן הזה בריצה זו.',
        turns: [], timeMs: Date.now() - started, ragChunks: 0,
      }), Math.max(0, DEADLINE_MS - (Date.now() - globalStart)));
    });
    return Promise.race([runJudge(t, APP_URL), cutoff]).finally(() => clearTimeout(timer));
  };
  // קול אחד לכל ריצה. ריצה משותפת דחפה 24 קריאות ל-/api/chat בבת אחת, הן חנקו
  // זו את זו, וכל הארבעה חצו את הדדליין (אומת בדוח 16.08 — 4/4 timeout). קול
  // בודד = 6 קריאות ו-60 שניות שלמות לעצמו.
  //   ?theorist=winnicott — קול מפורש (ריצה ידנית)
  //   ?rotate=1           — הקרון: קול אחד ליום, מחזור מלא כל 4 ימים. מחזור ולא
  //                         ארבעה קרונים כי מספר משבצות הקרון מוגבל בתוכנית.
  //   בלי פרמטר          — כל הארבעה, כמו קודם.
  const only = req.nextUrl.searchParams.get('theorist');
  const rotate = req.nextUrl.searchParams.get('rotate');
  let phase = req.nextUrl.searchParams.get('phase'); // converse | judge
  let toRun = THEORISTS;

  if (rotate) {
    // מחזור בן 8 ימים: יום זוגי מדבר עם קול, יום אי-זוגי שופט את מה שהוקלט אתמול.
    // כל קול נשפט אחת ל-8 ימים. איטי — אבל עובד בקופסה של 60ש' בלי לשלם על Pro.
    const d = new Date();
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86_400_000,
    );
    const slot = dayOfYear % (THEORISTS.length * 2);
    toRun = [THEORISTS[Math.floor(slot / 2)]];
    phase = slot % 2 === 0 ? 'converse' : 'judge';
  } else if (only && THEORISTS.includes(only)) {
    toRun = [only];
  }
  const single = toRun.length === 1;

  // ── שלב א — שיחה בלבד. התמליל נשמר לריפו, והריצה הבאה שופטת אותו. ──
  if (phase === 'converse' && single) {
    const t = toRun[0];
    try {
      const convo = await runConversation(t, APP_URL);
      await saveReportToGithub(
        'judge-transcripts',
        `${t}.json`,
        JSON.stringify({ theorist: t, savedAt: new Date().toISOString(), ...convo }, null, 2),
      );
      return NextResponse.json({
        phase: 'converse', theorist: t, turns: convo.turns.length,
        timeMs: Date.now() - globalStart,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      return NextResponse.json({ phase: 'converse', theorist: t, error: msg }, { status: 500 });
    }
  }

  let results: JudgeResult[];

  // ── שלב ב — שיפוט התמליל שנשמר. הריפו ציבורי, ולכן raw בלי טוקן. ──
  if (phase === 'judge' && single) {
    const t = toRun[0];
    const start = Date.now();
    try {
      const raw = await fetch(
        `https://raw.githubusercontent.com/ayaavivi-design/psychoanalytic-space/main/judge-transcripts/${t}.json`,
        { cache: 'no-store' },
      );
      // אין תמליל, או שהוא ישן — הריצה מתקנת את עצמה ומריצה את שלב השיחה במקום ליפול.
      // הסיבוב בן 8 המשבצות מתחיל באמצע, אז קול יכול להגיע לתור השיפוט לפני שדיבר
      // אי פעם (קרה לאוגדן ב-18.08: 404). כך המשבצת הבאה שלו תמצא חומר טרי.
      const stale = raw.ok
        ? await raw.json().then((j: { savedAt?: string }) =>
            !j.savedAt || Date.now() - Date.parse(j.savedAt) >= 36 * 3600_000)
        : true;
      if (stale) {
        const convo = await runConversation(t, APP_URL);
        await saveReportToGithub(
          'judge-transcripts', `${t}.json`,
          JSON.stringify({ theorist: t, savedAt: new Date().toISOString(), ...convo }, null, 2),
        );
        return NextResponse.json({
          phase: 'converse', theorist: t, turns: convo.turns.length,
          note: 'לא היה תמליל טרי לשיפוט — הורץ שלב השיחה במקומו. השיפוט יגיע במשבצת הבאה.',
          timeMs: Date.now() - globalStart,
        });
      }
      const raw2 = await fetch(
        `https://raw.githubusercontent.com/ayaavivi-design/psychoanalytic-space/main/judge-transcripts/${t}.json`,
        { cache: 'no-store' },
      );
      const saved = await raw2.json();
      results = [await runJudgment(t, saved.turns, saved.ragChunks ?? 0, start)];
    } catch (err) {
      results = [errorResult(t, err instanceof Error ? err.message : 'unknown', start)];
    }
  } else {
    results = await Promise.all(toRun.map(withDeadline));
  }

  const passed = results.filter(r => r.ok).length;
  const warned = results.filter(r => r.overall === 'warn').length;
  const failed = results.filter(r => r.overall === 'fail').length;
  const errored = results.filter(r => r.overall === 'error').length;
  const timedOut = results.filter(r => r.overall === 'timeout').length;
  const allPass = passed === results.length;

  const now = new Date();
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const date = `${now.getDate()} ב${months[now.getMonth()]} ${now.getFullYear()}`;

  const summaryRows = results.map(r => `
    <tr style="border-bottom:1px solid #f0e8e4;">
      <td style="padding:10px 8px;font-family:sans-serif;font-size:14px;direction:rtl;">
        ${r.name}
        <span style="font-size:11px;color:#888;margin-right:8px;">${r.scenarioLabel}</span>
      </td>
      <td style="padding:10px 8px;text-align:center;">
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;
          color:${OVERALL_COLOR[r.overall] || '#888'};background:${OVERALL_BG[r.overall] || '#faf7f5'};">
          ${OVERALL_LABEL[r.overall] || r.overall}
        </span>
      </td>
      <td style="padding:10px 8px;font-size:12px;color:#888;text-align:center;">
        ${r.violations.filter(v => v.severity === 'critical').length > 0
          ? `<span style="color:#b91c1c;font-weight:600;">${r.violations.filter(v => v.severity === 'critical').length} קריטי</span>` : ''}
        ${r.violations.filter(v => v.severity === 'major').length > 0
          ? `<span style="color:#c4607a;margin-right:6px;">${r.violations.filter(v => v.severity === 'major').length} חמור</span>` : ''}
        ${r.violations.filter(v => v.severity === 'minor').length > 0
          ? `<span style="color:#888;margin-right:6px;">${r.violations.filter(v => v.severity === 'minor').length} קל</span>` : ''}
        ${r.violations.length === 0 ? '<span style="color:#2d8a5e;">—</span>' : ''}
      </td>
      <td style="padding:10px 8px;font-size:12px;color:#aaa;text-align:center;">${(r.timeMs / 1000).toFixed(0)}s</td>
    </tr>`).join('');

  const cards = results.map(r => {
    const violationItems = r.violations.map(v => `
      <div style="margin-bottom:12px;border-right:4px solid ${SEVERITY_COLOR[v.severity] || '#888'};
        background:${SEVERITY_BG[v.severity] || '#faf7f5'};padding:12px 16px;border-radius:0 6px 6px 0;">
        <div style="font-size:12px;font-weight:700;color:${SEVERITY_COLOR[v.severity] || '#888'};margin-bottom:6px;">
          [${v.rule}] ${SEVERITY_LABEL[v.severity] || v.severity}
        </div>
        ${v.quote ? `<div style="font-size:12px;color:#555;background:#fff;padding:6px 10px;border-radius:4px;
          border-right:2px solid #ddd;margin-bottom:6px;font-style:italic;">"${v.quote}"</div>` : ''}
        <div style="font-size:12px;color:#444;margin-bottom:4px;"><strong>הפרה:</strong> ${v.explanation}</div>
        ${v.fix ? `<div style="font-size:12px;color:#2d8a5e;"><strong>תיקון:</strong> ${v.fix}</div>` : ''}
      </div>`).join('');

    const strengthItems = r.strengths.map(s => `
      <div style="font-size:12px;color:#2d8a5e;padding:4px 0;border-bottom:1px solid #e8f5ed;">✓ ${s}</div>`
    ).join('');

    const turnRows = r.turns.map(t => `
      <tr style="border-bottom:1px solid #f5f0ee;">
        <td style="padding:6px 8px;font-size:11px;color:#888;text-align:center;width:24px;">${t.turn}</td>
        <td style="padding:6px 8px;font-size:12px;color:#555;background:#faf7f5;width:40%;">${t.patient}</td>
        <td style="padding:6px 8px;font-size:12px;color:#333;">${t.therapist}</td>
      </tr>`).join('');

    return `
    <div style="margin-bottom:32px;border:1px solid #ede4e0;border-radius:10px;overflow:hidden;">
      <div style="background:${OVERALL_BG[r.overall] || '#faf7f5'};padding:12px 20px;
        border-bottom:2px solid ${OVERALL_COLOR[r.overall] || '#ddd'};
        display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:16px;font-weight:600;">${r.name}</span>
          <span style="font-size:12px;color:#888;margin-right:10px;">${r.scenarioLabel}</span>
        </div>
        <span style="padding:4px 14px;border-radius:14px;font-size:13px;font-weight:600;
          color:${OVERALL_COLOR[r.overall] || '#888'};background:#fff;
          border:1px solid ${OVERALL_COLOR[r.overall] || '#ddd'};">
          ${OVERALL_LABEL[r.overall] || r.overall}
        </span>
      </div>
      <div style="padding:16px 20px;">
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;color:#aaa;margin-bottom:6px;font-weight:600;">שיחת הבדיקה</div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #f0e8e4;border-radius:6px;overflow:hidden;">
            <thead><tr style="background:#faf7f5;">
              <th style="padding:5px 8px;font-size:10px;color:#aaa;width:24px;">#</th>
              <th style="padding:5px 8px;font-size:10px;color:#aaa;text-align:right;width:40%;">מטופל</th>
              <th style="padding:5px 8px;font-size:10px;color:#aaa;text-align:right;">מטפל</th>
            </tr></thead>
            <tbody>${turnRows}</tbody>
          </table>
        </div>
        ${r.violations.length > 0 ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;color:#aaa;margin-bottom:8px;font-weight:600;">הפרות (${r.violations.length})</div>
          ${violationItems}
        </div>` : ''}
        ${r.strengths.length > 0 ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:12px;color:#aaa;margin-bottom:6px;font-weight:600;">חוזקות</div>
          ${strengthItems}
        </div>` : ''}
        ${r.summary ? `
        <div style="background:#faf7f5;padding:10px 14px;border-radius:6px;font-size:12px;color:#555;">
          <strong>סיכום:</strong> ${r.summary}
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  const criticalCount = results.reduce((sum, r) =>
    sum + r.violations.filter(v => v.severity === 'critical').length, 0);

  const html = `
  <div style="max-width:820px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;
    border:1px solid #ede4e0;direction:rtl;font-family:sans-serif;">
    <div style="background:#5b3a5e;padding:24px 32px;text-align:center;">
      <div style="font-size:28px;color:rgba(255,255,255,0.5);margin-bottom:4px;">⚖</div>
      <h1 style="color:#fff;font-size:18px;font-weight:400;margin:0;">דוח שיפוט</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">${date}</p>
    </div>
    <div style="padding:24px 32px 0;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;text-align:center;">
        <div style="background:#f0faf4;border:1px solid #b2dfca;border-radius:8px;padding:14px;">
          <div style="font-size:26px;font-weight:700;color:#2d8a5e;">${passed}</div>
          <div style="font-size:11px;color:#888;">עברו</div>
        </div>
        <div style="background:${warned > 0 ? '#fffbeb' : '#faf7f5'};border:1px solid ${warned > 0 ? '#fcd34d' : '#ede4e0'};border-radius:8px;padding:14px;">
          <div style="font-size:26px;font-weight:700;color:${warned > 0 ? '#d97706' : '#ccc'};">${warned}</div>
          <div style="font-size:11px;color:#888;">אזהרות</div>
        </div>
        <div style="background:${failed > 0 ? '#fef2f2' : '#faf7f5'};border:1px solid ${failed > 0 ? '#fca5a5' : '#ede4e0'};border-radius:8px;padding:14px;">
          <div style="font-size:26px;font-weight:700;color:${failed > 0 ? '#b91c1c' : '#ccc'};">${failed}</div>
          <div style="font-size:11px;color:#888;">נכשלו</div>
        </div>
      </div>
      <h3 style="font-size:13px;color:#aaa;margin:0 0 10px;font-weight:400;">סיכום לפי תיאורטיקן</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;border:1px solid #f0e8e4;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#faf7f5;">
          <th style="padding:8px;font-size:11px;color:#aaa;text-align:right;">תיאורטיקן</th>
          <th style="padding:8px;font-size:11px;color:#aaa;text-align:center;">תוצאה</th>
          <th style="padding:8px;font-size:11px;color:#aaa;text-align:center;">הפרות</th>
          <th style="padding:8px;font-size:11px;color:#aaa;text-align:center;">זמן</th>
        </tr></thead>
        <tbody>${summaryRows}</tbody>
      </table>
      <h3 style="font-size:13px;color:#aaa;margin:0 0 16px;font-weight:400;">פירוט לפי תיאורטיקן</h3>
      ${cards}
    </div>
  </div>`;

  // שם הקול בנושא המייל — בריצה מפוצלת מגיעים ארבעה מיילים ביום, וצריך להבחין ביניהם
  const scope = single ? `${THEORIST_NAMES[toRun[0]]} · ` : '';
  const subject = scope + (allPass
    ? `שיפוט — ${passed}/${results.length} עברו ✅ — ${date}`
    : failed > 0
      ? `שיפוט — ${failed} נכשלו${criticalCount > 0 ? ` · ${criticalCount} קריטיות` : ''}${errored > 0 ? ` · ${errored} שגיאות-כלי` : ''}${timedOut > 0 ? ` · ${timedOut} לא הושלמו` : ''} — ${date}`
      : timedOut > 0
        ? `שיפוט — ${timedOut} לא הושלמו (ריצה נקטעה) — ${date}`
        : `שיפוט — ${errored} שגיאות-כלי (לא כשל-קול) — ${date}`);

  // --- שמירת דוח markdown ל-GitHub (לרן) ---
  const isoDate = now.toISOString().slice(0, 10);
  const criticalViolations = results.flatMap(r =>
    r.violations
      .filter(v => v.severity === 'critical' || v.severity === 'major')
      .map(v => `- **${r.name}** [${v.rule}] ${v.severity === 'critical' ? '🔴' : '🟡'}: ${v.explanation}`)
  );
  const judgeTableRows = results.map(r =>
    `| ${r.name} | ${OVERALL_LABEL[r.overall] || r.overall} | ${r.violations.length} | ${r.summary.slice(0, 60)}${r.summary.length > 60 ? '...' : ''} |`
  ).join('\n');

  const judgeMarkdown = `# דוח שיפוט — ${date}

## תוצאה כוללת
**${passed} עברו | ${warned} אזהרות | ${failed} נכשלו${errored > 0 ? ` | ${errored} שגיאות-כלי` : ''}${timedOut > 0 ? ` | ${timedOut} לא הושלמו` : ''}**
${timedOut > 0 ? `\n⏱ **${timedOut} תיאורטיקנים לא הספיקו להישפט בריצה הזו** — הריצה נקטעה לפני שהסתיימה. זו אינה עדות על הקול שלהם, לא לטובה ולא לרעה.\n` : ''}
## לפי תיאורטיקן
| תיאורטיקן | תוצאה | הפרות | סיכום |
|---|---|---|---|
${judgeTableRows}

## הפרות חמורות
${criticalViolations.length ? criticalViolations.join('\n') : 'אין הפרות חמורות ✅'}
`;

  // קובץ נפרד לכל קול — ארבע ריצות באותו יום היו דורסות זו את זו בשם אחד
  const reportName = single
    ? `JUDGE-${isoDate}-${toRun[0]}.md`
    : `JUDGE-${isoDate}.md`;
  await saveReportToGithub('judge-reports', reportName, judgeMarkdown);

  await resend.emails.send({
    from: 'שיפוט מרחב פסיכואנליטי <onboarding@resend.dev>',
    to: process.env.QA_REPORT_EMAIL!,
    subject,
    html,
  });

  return NextResponse.json({
    passed, warned, failed, errored,
    total: results.length,
    ok: allPass,
    timeMs: Date.now() - globalStart,
    results: results.map(r => ({
      theorist: r.theorist, name: r.name,
      overall: r.overall, ok: r.ok,
      violations: r.violations.length,
      timeMs: r.timeMs,
    })),
  });
}
