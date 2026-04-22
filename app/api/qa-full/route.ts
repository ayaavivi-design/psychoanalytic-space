import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { THEORIST_VOICE, SAFETY_PROTOCOL } from '@/lib/theorist-voices';
import { searchKnowledge, formatChunksForPrompt } from '@/lib/rag';

// /api/qa-full — endpoint קל לcron של Vercel
// מריץ 3 תורות לכל תיאורטיקן במקביל (~10s) ושולח email
// אין תלות בסוכן חיצוני, אין בעיית IP

export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann'];
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};

const CONVERSATION_TURNS = [
  'משהו כבד יש לי היום. לא בטוח מאיפה להתחיל.',
  'כן. זה כבר כמה ימים ככה. אולי קשור למשהו עם האבא שלי.',
  'הוא תמיד ציפה ממני להיות חזק. מרגיש שאני חייב לו משהו ולא יודע מה.',
];

const FORBIDDEN_OPENERS = ['יום טוב', 'שלום,', 'Good day', 'אני כאן', 'אני שומע ש', 'מעניין,', 'מעניין.', 'אה,'];

function checkTurn(text: string, turnIndex: number, prevOpener: string | null): {
  issues: string[]; opener: string
} {
  const issues: string[] = [];
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks > 1) issues.push(`Q-1: ${questionMarks} שאלות`);

  const opener = text.trim().split(/\s/)[0] || '';
  if (turnIndex === 0) {
    for (const f of FORBIDDEN_OPENERS) {
      if (text.startsWith(f)) { issues.push(`O: פתיחה אסורה "${f}"`); break; }
    }
  }
  if (prevOpener && opener === prevOpener) {
    issues.push(`O-7: פתיחה חוזרת "${opener}"`);
  }
  if (text.includes('[') && text.includes(']')) {
    issues.push('S-1: stage directions');
  }
  return { issues, opener };
}

async function runTheorist(theorist: string): Promise<{
  theorist: string; name: string; ok: boolean;
  issues: string[]; totalIssues: string[];
  timeMs: number; ragChunks: number;
  questionLabel: string;
  turns: { turn: number; patient: string; therapist: string; issues: string[] }[];
}> {
  const start = Date.now();
  const name = THEORIST_NAMES[theorist];
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const allIssues: string[] = [];
  const turns: { turn: number; patient: string; therapist: string; issues: string[] }[] = [];

  try {
    const systemBase = THEORIST_VOICE[theorist] + SAFETY_PROTOCOL;
    const chunks = await searchKnowledge(CONVERSATION_TURNS[0], theorist, 3);
    const ragContext = formatChunksForPrompt(chunks);
    const system = ragContext ? systemBase + ragContext : systemBase;

    const messages: Anthropic.MessageParam[] = [];
    let prevOpener: string | null = null;

    for (let i = 0; i < CONVERSATION_TURNS.length; i++) {
      messages.push({ role: 'user', content: CONVERSATION_TURNS[i] });
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system,
        messages,
      });
      const text = res.content[0]?.type === 'text' ? res.content[0].text : '';
      const { issues, opener } = checkTurn(text, i, prevOpener);
      prevOpener = opener;
      allIssues.push(...issues.map(iss => `[תור ${i + 1}] ${iss}`));
      turns.push({ turn: i + 1, patient: CONVERSATION_TURNS[i], therapist: text, issues });
      messages.push({ role: 'assistant', content: text });
    }

    const allQs = turns.every(t => t.therapist.includes('?'));
    if (allQs) allIssues.push('[Q-3] כל התגובות שאלות — אין משפט');

    return {
      theorist, name,
      ok: allIssues.length === 0,
      issues: allIssues, totalIssues: allIssues,
      timeMs: Date.now() - start,
      ragChunks: chunks.length,
      questionLabel: 'בדיקת בוקר — פתיחה קלינית (3 תורות)',
      turns,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return {
      theorist, name, ok: false,
      issues: [msg], totalIssues: [msg],
      timeMs: Date.now() - start, ragChunks: 0,
      questionLabel: 'בדיקת בוקר',
      turns,
    };
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const results = await Promise.all(THEORISTS.map(runTheorist));

  const passed = results.filter(r => r.ok).length;
  const allOk = passed === results.length;

  const now = new Date();
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const date = `${now.getDate()} ב${months[now.getMonth()]} ${now.getFullYear()}`;

  // --- HTML email ---
  const summaryRows = results.map(r => `
    <tr style="border-bottom:1px solid #f0e8e4;">
      <td style="padding:10px 8px;font-family:sans-serif;font-size:14px;">${r.ok ? '✅' : '⚠️'} ${r.name}</td>
      <td style="padding:10px 8px;font-size:13px;color:#888;">${(r.timeMs / 1000).toFixed(0)}s</td>
      <td style="padding:10px 8px;font-size:13px;color:#888;">${r.ragChunks} קטעים</td>
      <td style="padding:10px 8px;font-size:12px;color:#c4607a;">${(r.totalIssues).join(' | ') || '—'}</td>
    </tr>`).join('');

  const conversations = results.map(r => `
    <div style="margin-bottom:24px;border:1px solid #ede4e0;border-radius:8px;overflow:hidden;">
      <div style="background:${r.ok ? '#f0faf4' : '#fff5f5'};padding:10px 16px;">
        <span style="font-size:14px;font-weight:600;">${r.ok ? '✅' : '⚠️'} ${r.name}</span>
        <span style="font-size:12px;color:#888;margin-right:12px;">${r.turns.length} תורות • ${(r.timeMs / 1000).toFixed(0)}s</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#faf7f5;">
          <th style="padding:6px 8px;font-size:11px;color:#aaa;width:40px;">#</th>
          <th style="padding:6px 8px;font-size:11px;color:#aaa;text-align:right;">מטופל</th>
          <th style="padding:6px 8px;font-size:11px;color:#aaa;text-align:right;">מטפל</th>
        </tr></thead>
        <tbody>${r.turns.map(t => `
          <tr style="border-bottom:1px solid #f5f0ee;">
            <td style="padding:6px 8px;font-size:12px;color:#888;text-align:center;">${t.turn}</td>
            <td style="padding:6px 8px;font-size:12px;color:#555;background:#faf7f5;">${t.patient}</td>
            <td style="padding:6px 8px;font-size:12px;color:#333;">${t.therapist}${t.issues.length ? `<br><span style="color:#c4607a;font-size:11px;">⚠️ ${t.issues.join(' | ')}</span>` : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');

  const html = `
  <div style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ede4e0;direction:rtl;font-family:sans-serif;">
    <div style="background:#c4607a;padding:24px 32px;text-align:center;">
      <div style="font-size:28px;color:rgba(255,255,255,0.6);margin-bottom:4px;">ψ</div>
      <h1 style="color:#fff;font-size:18px;font-weight:400;margin:0;">בדיקת איכות יומית</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">${date}</p>
    </div>
    <div style="padding:24px 32px;">
      <div style="background:${allOk ? '#f0faf4' : '#fff8f0'};border:1px solid ${allOk ? '#b2dfca' : '#f5cba7'};border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;font-weight:600;color:${allOk ? '#2d8a5e' : '#c4607a'};">${passed}/${results.length}</div>
        <div style="font-size:13px;color:#888;margin-top:4px;">${allOk ? 'כל הבדיקות עברו ✅' : 'נמצאו דגלים לבדיקה ⚠️'}</div>
      </div>
      <h3 style="font-size:14px;color:#888;margin:0 0 12px;font-weight:400;">סיכום</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
        <thead><tr style="background:#faf7f5;">
          <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">תיאורטיקן</th>
          <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">זמן</th>
          <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">RAG</th>
          <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">דגלים</th>
        </tr></thead>
        <tbody>${summaryRows}</tbody>
      </table>
      <h3 style="font-size:14px;color:#888;margin:0 0 12px;font-weight:400;">שיחות מלאות</h3>
      ${conversations}
    </div>
  </div>`;

  await resend.emails.send({
    from: 'QA מרחב פסיכואנליטי <onboarding@resend.dev>',
    to: process.env.QA_REPORT_EMAIL!,
    subject: `בדיקת איכות — ${passed}/${results.length} — ${date}`,
    html,
  });

  return NextResponse.json({
    passed, total: results.length, ok: allOk,
    timeMs: Date.now() - start,
    results: results.map(r => ({
      theorist: r.theorist, name: r.name, ok: r.ok,
      issues: r.totalIssues, timeMs: r.timeMs,
    })),
  });
}
