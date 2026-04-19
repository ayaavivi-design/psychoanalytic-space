import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// endpoint קל — מקבל תוצאות JSON מהסוכן המרוחק ושולח email
// הסוכן מריץ כל תיאוריסט בנפרד (כל אחד < 60s) ומאגד כאן
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { results, specificResults, date, questionLabel, isSafety } = body;

  if (!results || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Missing results' }, { status: 400 });
  }

  const passed = results.filter((r: any) => r.ok).length;
  const specificPassed = (specificResults || []).filter((r: any) => r?.ok).length;
  const allOk = passed === results.length;

  const summary = results.map((r: any) => `
    <tr style="border-bottom:1px solid #f0e8e4;">
      <td style="padding:10px 8px;font-family:sans-serif;font-size:14px;">${r.ok ? '✅' : '⚠️'} ${r.name}</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:13px;color:#888;">${(r.timeMs / 1000).toFixed(0)}s</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:13px;color:#888;">${r.ragChunks} קטעים</td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:12px;color:#c4607a;">${(r.totalIssues || []).join(' | ') || '—'}</td>
    </tr>`).join('');

  const conversations = results.map((r: any) => `
    <div style="margin-bottom:24px;border:1px solid #ede4e0;border-radius:8px;overflow:hidden;">
      <div style="background:${r.ok ? '#f0faf4' : '#fff5f5'};padding:10px 16px;">
        <span style="font-size:14px;font-weight:600;">${r.ok ? '✅' : '⚠️'} ${r.name}</span>
        <span style="font-size:12px;color:#888;margin-right:12px;">${(r.turns || []).length} חילופים • ${(r.timeMs / 1000).toFixed(0)}s</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#faf7f5;">
          <th style="padding:6px 8px;font-size:11px;color:#aaa;width:40px;">#</th>
          <th style="padding:6px 8px;font-size:11px;color:#aaa;text-align:right;">מטופל</th>
          <th style="padding:6px 8px;font-size:11px;color:#aaa;text-align:right;">מטפל</th>
        </tr></thead>
        <tbody>${(r.turns || []).map((t: any) => `
          <tr style="border-bottom:1px solid #f5f0ee;">
            <td style="padding:6px 8px;font-size:12px;color:#888;text-align:center;">${t.turn}</td>
            <td style="padding:6px 8px;font-size:12px;color:#555;background:#faf7f5;">${t.patient}</td>
            <td style="padding:6px 8px;font-size:12px;color:#333;">${t.therapist}${(t.issues || []).length ? `<br><span style="color:#c4607a;font-size:11px;">⚠️ ${t.issues.join(' | ')}</span>` : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`).join('');

  const specificRows = (specificResults || []).filter(Boolean).map((r: any) => `
    <div style="margin-bottom:16px;border:1px solid ${r.ok ? '#d4edda' : '#f5c6cb'};border-right:4px solid ${r.ok ? '#2d8a5e' : '#c4607a'};border-radius:6px;padding:14px 18px;">
      <div style="font-weight:600;font-size:13px;margin-bottom:8px;">${r.ok ? '✅' : '⚠️'} ${r.name} · <span style="color:#888;font-weight:400;">${r.id}</span></div>
      <div style="font-size:12px;color:#555;background:#faf7f5;padding:8px 12px;border-radius:4px;margin-bottom:6px;"><strong>קלט:</strong> ${r.prompt}</div>
      <div style="font-size:12px;color:#333;padding:6px 12px;">${(r.response || '').slice(0, 200)}${(r.response || '').length > 200 ? '...' : ''}</div>
      ${(r.issues || []).length ? `<div style="font-size:11px;color:#c4607a;">⚠️ ${r.issues.join(' | ')}</div>` : '<div style="font-size:11px;color:#2d8a5e;">עבר את כל הבדיקות</div>'}
    </div>`).join('');

  const html = `
    <div style="max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #ede4e0;direction:rtl;">
      <div style="background:#c4607a;padding:24px 32px;text-align:center;">
        <div style="font-size:28px;color:rgba(255,255,255,0.6);margin-bottom:4px;">ψ</div>
        <h1 style="color:#fff;font-size:18px;font-weight:400;margin:0;">בדיקת איכות יומית</h1>
        <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">${date}</p>
        <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:4px 0 0;">תסריט: ${questionLabel}${isSafety ? ' 🔴 בטיחות' : ''}</p>
      </div>
      <div style="padding:24px 32px;">
        <div style="background:${allOk ? '#f0faf4' : '#fff8f0'};border:1px solid ${allOk ? '#b2dfca' : '#f5cba7'};border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
          <div style="font-size:28px;font-weight:600;color:${allOk ? '#2d8a5e' : '#c4607a'};">${passed}/${results.length}</div>
          <div style="font-size:13px;color:#888;margin-top:4px;">${allOk ? 'כל הבדיקות עברו ✅' : 'נמצאו דגלים לבדיקה ⚠️'}</div>
        </div>
        <h3 style="font-size:14px;color:#888;margin:0 0 12px;font-weight:400;">סיכום</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
          <thead><tr style="background:#faf7f5;">
            <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">תיאוריסט</th>
            <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">זמן</th>
            <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">RAG</th>
            <th style="padding:8px;font-size:12px;color:#a89;text-align:right;">דגלים</th>
          </tr></thead>
          <tbody>${summary}</tbody>
        </table>
        <h3 style="font-size:14px;color:#888;margin:0 0 12px;font-weight:400;">שיחות מלאות</h3>
        ${conversations}
        ${specificRows ? `<h3 style="font-size:14px;color:#888;margin:32px 0 12px;font-weight:400;">בדיקות ממוקדות לפי תיאורטיקן</h3>${specificRows}` : ''}
      </div>
    </div>`;

  await resend.emails.send({
    from: 'QA מרחב פסיכואנליטי <onboarding@resend.dev>',
    to: process.env.QA_REPORT_EMAIL!,
    subject: `בדיקת איכות — ${passed}/${results.length} תסריט · ${specificPassed}/${(specificResults || []).length} ממוקד — ${date}`,
    html,
  });

  return NextResponse.json({ sent: true, passed, total: results.length });
}
