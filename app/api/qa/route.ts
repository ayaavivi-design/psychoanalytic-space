import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // 5 דקות — מקסימום Vercel Pro

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann'];
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};

// מאגר שאלות מגוון — מתחלף כל יום לפי מספר היום בשנה
// כל שאלה כוללת מספר תגובות מטופל שממשיכות את השיחה
const QUESTION_BANK = [
  {
    label: 'פתיחה קלינית — כובד',
    turns: [
      'משהו כבד יש לי היום. לא בטוח מאיפה להתחיל.',
      'כן. זה כבר כמה ימים ככה.',
      'לא בדיוק יודע מה זה. פשוט כבד.',
      'אולי קשור למשהו עם האבא שלי.',
      'הוא תמיד ציפה ממני להיות חזק. אפילו כשהיה לי קשה.',
      'מרגיש שאני חייב לו משהו ולא יודע מה.',
      'כן, בדיוק. לא יכול להשתחרר מזה.',
    ],
  },
  {
    label: 'מצב תקיעות חוזרת',
    turns: [
      'אני תקוע. אותו מעגל חוזר כבר חודשים — עולה, נופל, עולה, נופל.',
      'זה קורה בכל תחום. בעבודה, בזוגיות, בכל דבר.',
      'אני יודע מה אני אמור לעשות. פשוט לא עושה.',
      'כשאני מנסה להבין למה — לא מוצא כלום. ריק.',
      'אולי אני פוחד מהצלחה? שמעתי שזה קיים.',
      'לא יודע. אולי. אבל זה מרגיש יותר כמו עייפות.',
      'עייפות מהמאמץ. מהתקווה שזה יהיה אחרת הפעם.',
    ],
  },
  {
    label: 'כעס בסשן',
    turns: [
      'אני כועס. לא רוצה להיות כאן אבל אני כאן.',
      'לא יודע. פשוט כועס על הכל.',
      'על עצמי בעיקר. על שאני ממשיך לחזור לאותם מקומות.',
      'כן, גם על אנשים אחרים. על כל מי שציפה ממני לתפקד.',
      'כשאני כועס ככה — אני לא מצליח לגשת למה שמתחת.',
      'מה אתה חושב שמתחת?',
      'כאב, כנראה. אבל קשה לגעת בו.',
    ],
  },
  {
    label: 'ייאוש וחוסר תקווה',
    turns: [
      'אני לא יודע אם יש בי עוד כוח לנסות. הכל מרגיש חסר טעם.',
      'זה לא בפעם הראשונה שאני מרגיש ככה.',
      'כשאני עייף, הכל נראה חסר מוצא.',
      'אנשים אומרים לי שיהיה בסדר. אני לא מאמין להם.',
      'אולי כי מעולם לא היה בסדר באמת.',
      'היו רגעים טובים. אבל תמיד עברו.',
      'אני לא יודע איך לתת לרגע טוב להישאר.',
    ],
  },
  {
    label: 'שאלה תיאורטית',
    turns: [
      'מה ההבדל בין העברה לבין מה שקורה ביחסים רגילים?',
      'אז כל קשר הוא סוג של העברה?',
      'אבל האנליטיקאי הוא ריאלי, לא?',
      'איך יודעים מתי הרגש הוא העברה ומתי הוא "אמיתי"?',
      'ומה אתה/את עושים עם זה — כשאתם יודעים?',
      'זה לא מרגיש מניפולטיבי — לדעת ולא לגיד?',
      'אני מבין. יש בזה משהו שמפחיד ומרגיע בו-זמנית.',
    ],
  },
];

// בחירת שאלת היום לפי יום בשנה
function getTodaysQuestion() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return QUESTION_BANK[dayOfYear % QUESTION_BANK.length];
}

const FORBIDDEN_OPENERS = [
  'אה,', 'אה.', 'אה!', 'אה -', 'אה —',
  'מעניין.', 'מעניין,',
  'עכשיו אני מבין', 'עכשיו אני רואה',
  'אני רוצה לשמוע',
];

type TurnResult = {
  turn: number;
  patient: string;
  therapist: string;
  issues: string[];
};

type TheoristResult = {
  theorist: string;
  name: string;
  ok: boolean;
  timeMs: number;
  ragChunks: number;
  turns: TurnResult[];
  totalIssues: string[];
  questionLabel: string;
};

async function checkRAGChunks(theorist: string): Promise<number> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { count } = await supabase
      .from('knowledge_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('theorist', theorist);
    return count || 0;
  } catch { return -1; }
}

function checkTurn(text: string, turnIndex: number): string[] {
  const issues: string[] = [];
  const words = text.trim().split(/\s+/).length;
  const questionMarks = (text.match(/\?/g) || []).length;

  if (words < 10) issues.push(`תגובה קצרה מדי — ${words} מילים`);
  if (words > 250) issues.push(`תגובה ארוכה מדי — ${words} מילים`);
  if (questionMarks > 1) issues.push(`שאלות כפולות — ${questionMarks} סימני שאלה`);

  // בדיקת פתיחות אסורות רק בתגובה הראשונה
  if (turnIndex === 0) {
    for (const opener of FORBIDDEN_OPENERS) {
      if (text.startsWith(opener)) {
        issues.push(`פתיחה אסורה: "${opener}"`);
        break;
      }
    }
    // בדיקת פתיחה גנרית "אני שומע/מבין ש"
    if (/^אני (שומע|מבינ|רואה|מרגיש) ש/.test(text)) {
      issues.push('פתיחה גנרית: "אני שומע/מבין ש..." — לא ייחודית למשפחה אנליטית');
    }
  }

  return issues;
}

async function testTheorist(theorist: string, question: typeof QUESTION_BANK[0]): Promise<TheoristResult> {
  const name = THEORIST_NAMES[theorist];
  const start = Date.now();
  const turnResults: TurnResult[] = [];
  const allIssues: string[] = [];

  // שיחה של 7 חילופי דברים
  const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];

  try {
    for (let i = 0; i < question.turns.length; i++) {
      const patientMessage = question.turns[i];
      conversationHistory.push({ role: 'user', content: patientMessage });

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: `You are ${name}, a psychoanalytic therapist conducting a session. Respond in Hebrew. Ask only one question maximum. Be true to your specific theoretical voice.`,
        messages: conversationHistory,
      });

      const therapistText = response.content[0].type === 'text' ? response.content[0].text : '';
      conversationHistory.push({ role: 'assistant', content: therapistText });

      const turnIssues = checkTurn(therapistText, i);
      allIssues.push(...turnIssues.map(issue => `[חילוף ${i + 1}] ${issue}`));

      turnResults.push({
        turn: i + 1,
        patient: patientMessage,
        therapist: therapistText.slice(0, 150),
        issues: turnIssues,
      });
    }

    const timeMs = Date.now() - start;
    const ragChunks = await checkRAGChunks(theorist);
    if (ragChunks === 0) allIssues.push('אין קטעי RAG במאגר');
    if (timeMs > 120000) allIssues.push(`זמן כולל איטי — ${(timeMs / 1000).toFixed(0)} שניות`);

    return {
      theorist, name,
      ok: allIssues.length === 0,
      timeMs, ragChunks,
      turns: turnResults,
      totalIssues: allIssues,
      questionLabel: question.label,
    };
  } catch (err) {
    return {
      theorist, name, ok: false,
      timeMs: Date.now() - start, ragChunks: 0,
      turns: turnResults,
      totalIssues: [`שגיאה: ${err instanceof Error ? err.message : 'unknown'}`],
      questionLabel: question.label,
    };
  }
}

function buildTurnsHTML(turns: TurnResult[]): string {
  return turns.map(t => `
    <tr style="border-bottom:1px solid #f5f0ee;">
      <td style="padding:6px 8px;font-size:12px;color:#888;width:40px;text-align:center;">${t.turn}</td>
      <td style="padding:6px 8px;font-size:12px;color:#555;background:#faf7f5;">${t.patient}</td>
      <td style="padding:6px 8px;font-size:12px;color:#333;">${t.therapist}${t.issues.length ? `<br><span style="color:#c4607a;font-size:11px;">⚠️ ${t.issues.join(' | ')}</span>` : ''}</td>
    </tr>`).join('');
}

function buildEmailHTML(results: TheoristResult[], date: string, questionLabel: string): string {
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  const allOk = passed === total;

  const summary = results.map(r => `
    <tr style="border-bottom:1px solid #f0e8e4;">
      <td style="padding:10px 8px;font-family:sans-serif;font-size:14px;">${r.ok ? '✅' : '⚠️'} ${r.name}</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:13px;color:#888;">${(r.timeMs / 1000).toFixed(0)}s</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:13px;color:#888;">${r.ragChunks} קטעים</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:12px;color:#c4607a;">${r.totalIssues.join(' | ') || '—'}</td>
    </tr>`).join('');

  const conversations = results.map(r => `
    <div style="margin-bottom:24px;border:1px solid #ede4e0;border-radius:8px;overflow:hidden;">
      <div style="background:${r.ok ? '#f0faf4' : '#fff5f5'};padding:10px 16px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;font-weight:600;">${r.ok ? '✅' : '⚠️'} ${r.name}</span>
        <span style="font-size:12px;color:#888;">${r.turns.length} חילופים • ${(r.timeMs / 1000).toFixed(0)}s</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#faf7f5;">
            <th style="padding:6px 8px;font-size:11px;color:#aaa;width:40px;">#</th>
            <th style="padding:6px 8px;font-size:11px;color:#aaa;text-align:right;">מטופל</th>
            <th style="padding:6px 8px;font-size:11px;color:#aaa;text-align:right;">מטפל</th>
          </tr>
        </thead>
        <tbody>${buildTurnsHTML(r.turns)}</tbody>
      </table>
    </div>`).join('');

  return `
    <div style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ede4e0;direction:rtl;">
      <div style="background:#c4607a;padding:24px 32px;text-align:center;">
        <div style="font-size:28px;color:rgba(255,255,255,0.6);margin-bottom:4px;">ψ</div>
        <h1 style="color:#fff;font-size:18px;font-weight:400;margin:0;">בדיקת איכות יומית</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">${date}</p>
        <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">תסריט: ${questionLabel}</p>
      </div>
      <div style="padding:24px 32px;">
        <div style="background:${allOk ? '#f0faf4' : '#fff8f0'};border:1px solid ${allOk ? '#b2dfca' : '#f5cba7'};border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
          <div style="font-size:28px;font-weight:600;color:${allOk ? '#2d8a5e' : '#c4607a'};">${passed}/${total}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">${allOk ? 'כל הבדיקות עברו ✅' : 'נמצאו דגלים לבדיקה ⚠️'}</div>
        </div>

        <h3 style="font-size:14px;color:#888;margin:0 0 12px;font-weight:400;">סיכום</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
          <thead>
            <tr style="background:#faf7f5;">
              <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">תיאוריסט</th>
              <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">זמן</th>
              <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">RAG</th>
              <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">דגלים</th>
            </tr>
          </thead>
          <tbody>${summary}</tbody>
        </table>

        <h3 style="font-size:14px;color:#888;margin:0 0 12px;font-weight:400;">שיחות מלאות</h3>
        ${conversations}
      </div>
    </div>`;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const question = getTodaysQuestion();

  // מקביל — כל 8 תיאוריסטים רצים יחד במקום בסדרה
  const results = await Promise.all(
    THEORISTS.map(theorist => testTheorist(theorist, question))
  );

  const date = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const passed = results.filter(r => r.ok).length;

  await resend.emails.send({
    from: 'QA מרחב פסיכואנליטי <onboarding@resend.dev>',
    to: process.env.QA_REPORT_EMAIL!,
    subject: `בדיקת איכות — ${passed}/${THEORISTS.length} — ${question.label} — ${date}`,
    html: buildEmailHTML(results, date, question.label),
  });

  return NextResponse.json({
    passed,
    total: THEORISTS.length,
    questionLabel: question.label,
    results: results.map(r => ({
      theorist: r.theorist,
      name: r.name,
      ok: r.ok,
      timeMs: r.timeMs,
      ragChunks: r.ragChunks,
      totalIssues: r.totalIssues,
      firstResponse: r.turns[0]?.therapist || '',
    })),
  });
}
