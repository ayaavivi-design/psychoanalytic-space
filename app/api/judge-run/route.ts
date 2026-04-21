import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { THEORIST_VOICE, SAFETY_PROTOCOL } from '@/lib/theorist-voices';
import { JUDGE_SYSTEM_PROMPT, JUDGE_RULES, JUDGE_USER_TEMPLATE } from '@/lib/judge-prompt';
import { searchKnowledge, formatChunksForPrompt } from '@/lib/rag';

// מריץ שיחה של 3 תורות + שיפוט מיידי
// ~15-20s לתיאורטיקן — בטוח בגבול 60s

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann'];
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};

// תסריטים — כל תיאורטיקן מקבל תסריט שמאתגר את הכשל הספציפי שלו
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

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const theorist = req.nextUrl.searchParams.get('theorist');
  if (!theorist || !THEORISTS.includes(theorist)) {
    return NextResponse.json({ error: 'Unknown theorist' }, { status: 400 });
  }

  const start = Date.now();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const scenario = SCENARIOS[theorist];

  try {
    // שלב 1 — הרצת שיחה
    const systemBase = THEORIST_VOICE[theorist] + SAFETY_PROTOCOL;
    const chunks = await searchKnowledge(scenario.turns[0], theorist, 3);
    const ragContext = formatChunksForPrompt(chunks);
    const system = ragContext ? systemBase + ragContext : systemBase;

    const messages: Anthropic.MessageParam[] = [];
    const turns: { turn: number; patient: string; therapist: string }[] = [];

    for (let i = 0; i < scenario.turns.length; i++) {
      messages.push({ role: 'user', content: scenario.turns[i] });
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system,
        messages,
      });
      const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
      turns.push({ turn: i + 1, patient: scenario.turns[i], therapist: text });
      messages.push({ role: 'assistant', content: text });
    }

    // שלב 2 — בניית טרנסקריפט לשיפוט
    const transcript = turns.map(t =>
      `[תור ${t.turn}]\nמטופל: ${t.patient}\nמטפל: ${t.therapist}`
    ).join('\n\n');

    // שלב 3 — שיפוט
    const judgeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: JUDGE_SYSTEM_PROMPT + '\n\nRULESET:\n' + JUDGE_RULES,
      messages: [{ role: 'user', content: JUDGE_USER_TEMPLATE(transcript, theorist) }],
    });

    const judgeRaw = judgeRes.content[0]?.type === 'text' ? judgeRes.content[0].text : '{}';
    let judgeReport: Record<string, unknown> = {};
    try { judgeReport = JSON.parse(judgeRaw); } catch { judgeReport = { raw: judgeRaw }; }

    const timeMs = Date.now() - start;
    const overall = (judgeReport.overall as string) || 'unknown';
    const violations = (judgeReport.violations as unknown[]) || [];

    return NextResponse.json({
      theorist,
      name: THEORIST_NAMES[theorist],
      scenarioLabel: scenario.label,
      overall,
      ok: overall === 'pass',
      violations,
      strengths: judgeReport.strengths || [],
      summary: judgeReport.summary || '',
      turns,
      timeMs,
      ragChunks: chunks.length,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({
      theorist,
      name: THEORIST_NAMES[theorist],
      scenarioLabel: scenario.label,
      overall: 'fail',
      ok: false,
      violations: [{ rule: 'ERROR', severity: 'critical', quote: '', explanation: message, fix: '' }],
      strengths: [],
      summary: `שגיאה: ${message}`,
      turns: [],
      timeMs: Date.now() - start,
      ragChunks: 0,
    });
  }
}
