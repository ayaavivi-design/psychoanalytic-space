import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { THEORIST_VOICE, SAFETY_PROTOCOL } from '@/lib/theorist-voices';
import { JUDGE_SYSTEM_PROMPT, JUDGE_RULES, JUDGE_USER_TEMPLATE } from '@/lib/judge-prompt';
import { searchKnowledge, formatChunksForPrompt } from '@/lib/rag';

// /api/judge-full — Vercel-native cron endpoint
// מריץ שיחה + שיפוט לכל 8 תיאורטיקנים ב-2 קבוצות מקביליות ושולח דוח
// מחליף את הסוכן החיצוני שנחסם ב-403

export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann'];
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
  critical: '#b91c1c', major: '#c4607a', minor: '#888',
};
const SEVERITY_BG: Record<string, string> = {
  critical: '#fef2f2', major: '#fff5f5', minor: '#faf7f5',
};
const SEVERITY_LABEL: Record<string, string> = {
  critical: 'קריטי', major: 'חמור', minor: 'קל',
};
const OVERALL_COLOR: Record<string, string> = {
  pass: '#2d8a5e', warn: '#d97706', fail: '#b91c1c',
};
const OVERALL_BG: Record<string, string> = {
  pass: '#f0faf4', warn: '#fffbeb', fail: '#fef2f2',
};
const OVERALL_LABEL: Record<string, string> = {
  pass: '✅ עבר', warn: '⚠️ אזהרה', fail: '❌ נכשל',
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

async function runJudge(theorist: string): Promise<JudgeResult> {
  const start = Date.now();
  const name = THEORIST_NAMES[theorist];
  const scenario = SCENARIOS[theorist];
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // שלב 1 — שיחה
    const systemBase = THEORIST_VOICE[theorist] + SAFETY_PROTOCOL;
    const chunks = await searchKnowledge(scenario.turns[0], theorist, 3);
    const ragContext = formatChunksForPrompt(chunks);
    const system = ragContext ? systemBase + ragContext : systemBase;

    const messages: Anthropic.MessageParam[] = [];
    const turns: JudgeResult['turns'] = [];

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

    // שלב 2 — שיפוט
    const transcript = turns.map(t =>
      `[תור ${t.turn}]\nמטופל: ${t.patient}\nמטפל: ${t.therapist}`
    ).join('\n\n');

    const judgeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: JUDGE_SYSTEM_PROMPT + '\n\nRULESET:\n' + JUDGE_RULES,
      messages: [{ role: 'user', content: JUDGE_USER_TEMPLATE(transcript, theorist) }],
    });

    const judgeRaw = judgeRes.content[0]?.type === 'text' ? judgeRes.content[0].text : '{}';
    let report: Record<string, unknown> = {};
    try { report = JSON.parse(judgeRaw); } catch { report = {}; }

    const overall = (report.overall as string) || 'fail';
    return {
      theorist, name, scenarioLabel: scenario.label,
      overall,
      ok: overall === 'pass',
      violations: (report.violations as Violation[]) || [],
      strengths: (report.strengths as string[]) || [],
      summary: (report.summary as string) || '',
      turns, timeMs: Date.now() - start, ragChunks: chunks.length,
    };

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return {
      theorist, name, scenarioLabel: scenario.label,
      overall: 'fail', ok: false,
      violations: [{ rule: 'ERROR', severity: 'critical', quote: '', explanation: msg, fix: '' }],
      strengths: [], summary: `שגיאה: ${msg}`,
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

  const batch1 = await Promise.all(THEORISTS.slice(0, 4).map(runJudge));
  const batch2 = await Promise.all(THEORISTS.slice(4).map(runJudge));
  const results = [...batch1, ...batch2];

  const passed = results.filter(r => r.ok).length;
  const warned = results.filter(r => r.overall === 'warn').length;
  const failed = results.filter(r => r.overall === 'fail').length;
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

  const subject = allPass
    ? `שיפוט — ${passed}/${results.length} עברו ✅ — ${date}`
    : `שיפוט — ${failed} נכשלו${criticalCount > 0 ? ` · ${criticalCount} קריטיות` : ''} — ${date}`;

  await resend.emails.send({
    from: 'שיפוט מרחב פסיכואנליטי <onboarding@resend.dev>',
    to: process.env.QA_REPORT_EMAIL!,
    subject,
    html,
  });

  return NextResponse.json({
    passed, warned, failed,
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
