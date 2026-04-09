import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann'];
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
};
const FORBIDDEN_OPENERS = ['אה,', 'אה.', 'אה!', 'אה -', 'אה —', 'מעניין.', 'מעניין,', 'עכשיו אני מבין', 'עכשיו אני רואה', 'אני רוצה לשמוע'];
const TEST_MESSAGE = 'משהו כבד יש לי היום. לא בטוח מאיפה להתחיל.';

type TheoristResult = {
  theorist: string;
  name: string;
  ok: boolean;
  timeMs: number;
  ragChunks: number;
  response: string;
  issues: string[];
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

async function testTheorist(theorist: string): Promise<TheoristResult> {
  const name = THEORIST_NAMES[theorist];
  const issues: string[] = [];
  const start = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: `You are ${name}, a psychoanalytic therapist conducting a session. Respond in Hebrew. Ask only one question.`,
      messages: [{ role: 'user', content: TEST_MESSAGE }],
    });

    const timeMs = Date.now() - start;
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const ragChunks = await checkRAGChunks(theorist);

    // בדיקות איכות
    const questionMarks = (text.match(/\?/g) || []).length;
    if (questionMarks > 1) issues.push(`שאלות כפולות — ${questionMarks} סימני שאלה`);
    if (questionMarks === 0) issues.push('אין שאלה בכלל');

    const words = text.trim().split(/\s+/).length;
    if (words < 15) issues.push(`תגובה קצרה מדי — ${words} מילים`);
    if (words > 200) issues.push(`תגובה ארוכה מדי — ${words} מילים`);

    for (const opener of FORBIDDEN_OPENERS) {
      if (text.startsWith(opener)) { issues.push(`פתיחה אסורה: "${opener}"`); break; }
    }

    if (timeMs > 30000) issues.push(`זמן תגובה איטי — ${(timeMs/1000).toFixed(1)} שניות`);
    if (ragChunks === 0) issues.push('אין קטעי RAG במאגר');

    return { theorist, name, ok: issues.length === 0, timeMs, ragChunks, response: text.slice(0, 200), issues };
  } catch (err) {
    return { theorist, name, ok: false, timeMs: Date.now() - start, ragChunks: 0, response: '', issues: [`שגיאה: ${err instanceof Error ? err.message : 'unknown'}`] };
  }
}

function buildEmailHTML(results: TheoristResult[], date: string): string {
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  const allOk = passed === total;

  const rows = results.map(r => `
    <tr style="border-bottom:1px solid #f0e8e4;">
      <td style="padding:10px 8px;font-family:sans-serif;font-size:14px;">${r.ok ? '✅' : '⚠️'} ${r.name}</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:13px;color:#888;">${(r.timeMs/1000).toFixed(1)}s</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:13px;color:#888;">${r.ragChunks} קטעים</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:12px;color:#c4607a;">${r.issues.join(' | ') || '—'}</td>
    </tr>`).join('');

  return `
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ede4e0;direction:rtl;">
      <div style="background:#c4607a;padding:24px 32px;text-align:center;">
        <div style="font-size:28px;color:rgba(255,255,255,0.6);margin-bottom:4px;">ψ</div>
        <h1 style="color:#fff;font-size:18px;font-weight:400;margin:0;">בדיקת איכות יומית</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">${date}</p>
      </div>
      <div style="padding:24px 32px;">
        <div style="background:${allOk ? '#f0faf4' : '#fff8f0'};border:1px solid ${allOk ? '#b2dfca' : '#f5cba7'};border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
          <div style="font-size:28px;font-weight:600;color:${allOk ? '#2d8a5e' : '#c4607a'};">${passed}/${total}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">${allOk ? 'כל הבדיקות עברו ✅' : 'נמצאו דגלים לבדיקה ⚠️'}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#faf7f5;">
              <th style="padding:8px;font-family:sans-serif;font-size:12px;color:#a89;text-align:right;">תיאוריסט</th>
              <th style="padding:8px;font-family:sans-serif;font-size:12px;color:#a89;text-align:right;">זמן</th>
              <th style="padding:8px;font-family:sans-serif;font-size:12px;color:#a89;text-align:right;">RAG</th>
              <th style="padding:8px;font-family:sans-serif;font-size:12px;color:#a89;text-align:right;">דגלים</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: TheoristResult[] = [];
  for (const theorist of THEORISTS) {
    const result = await testTheorist(theorist);
    results.push(result);
  }

  const date = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  const passed = results.filter(r => r.ok).length;

  await resend.emails.send({
    from: 'QA מרחב פסיכואנליטי <onboarding@resend.dev>',
    to: process.env.QA_REPORT_EMAIL!,
    subject: `בדיקת איכות יומית — ${passed}/${THEORISTS.length} עברו — ${date}`,
    html: buildEmailHTML(results, date),
  });

  return NextResponse.json({ passed, total: THEORISTS.length, results });
}
