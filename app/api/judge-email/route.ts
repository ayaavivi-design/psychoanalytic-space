import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/judge-email?secret=...
// body: { results: JudgeRunResult[], date: string }
// JudgeRunResult — מה שמחזיר /api/judge-run לכל תיאורטיקן

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#b91c1c',
  major: '#c4607a',
  minor: '#888',
};

const SEVERITY_BG: Record<string, string> = {
  critical: '#fef2f2',
  major: '#fff5f5',
  minor: '#faf7f5',
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'קריטי',
  major: 'חמור',
  minor: 'קל',
};

const OVERALL_COLOR: Record<string, string> = {
  pass: '#2d8a5e',
  warn: '#d97706',
  fail: '#b91c1c',
};

const OVERALL_BG: Record<string, string> = {
  pass: '#f0faf4',
  warn: '#fffbeb',
  fail: '#fef2f2',
};

const OVERALL_LABEL: Record<string, string> = {
  pass: '✅ עבר',
  warn: '⚠️ אזהרה',
  fail: '❌ נכשל',
};

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.QA_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { results, date } = body;

  if (!results || !Array.isArray(results)) {
    return NextResponse.json({ error: 'Missing results' }, { status: 400 });
  }

  const passed = results.filter((r: any) => r.ok).length;
  const warned = results.filter((r: any) => r.overall === 'warn').length;
  const failed = results.filter((r: any) => r.overall === 'fail').length;
  const allPass = passed === results.length;

  // --- שורת סיכום לכל תיאורטיקן ---
  const summaryRows = results.map((r: any) => `
    <tr style="border-bottom:1px solid #f0e8e4;">
      <td style="padding:10px 8px;font-family:sans-serif;font-size:14px;direction:rtl;">
        ${r.name}
        <span style="font-size:11px;color:#888;margin-right:8px;">${r.scenarioLabel || ''}</span>
      </td>
      <td style="padding:10px 8px;text-align:center;">
        <span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600;
          color:${OVERALL_COLOR[r.overall] || '#888'};background:${OVERALL_BG[r.overall] || '#faf7f5'};">
          ${OVERALL_LABEL[r.overall] || r.overall}
        </span>
      </td>
      <td style="padding:10px 8px;font-family:sans-serif;font-size:12px;color:#888;text-align:center;">
        ${(r.violations || []).filter((v: any) => v.severity === 'critical').length > 0
          ? `<span style="color:#b91c1c;font-weight:600;">${(r.violations || []).filter((v: any) => v.severity === 'critical').length} קריטי</span>`
          : ''}
        ${(r.violations || []).filter((v: any) => v.severity === 'major').length > 0
          ? `<span style="color:#c4607a;margin-right:6px;">${(r.violations || []).filter((v: any) => v.severity === 'major').length} חמור</span>`
          : ''}
        ${(r.violations || []).filter((v: any) => v.severity === 'minor').length > 0
          ? `<span style="color:#888;margin-right:6px;">${(r.violations || []).filter((v: any) => v.severity === 'minor').length} קל</span>`
          : ''}
        ${(r.violations || []).length === 0 ? '<span style="color:#2d8a5e;">—</span>' : ''}
      </td>
      <td style="padding:10px 8px;font-size:12px;color:#aaa;text-align:center;">${(r.timeMs / 1000).toFixed(0)}s</td>
    </tr>`).join('');

  // --- כרטיס מפורט לכל תיאורטיקן ---
  const cards = results.map((r: any) => {
    const violationItems = (r.violations || []).map((v: any) => `
      <div style="margin-bottom:12px;border-right:4px solid ${SEVERITY_COLOR[v.severity] || '#888'};
        background:${SEVERITY_BG[v.severity] || '#faf7f5'};padding:12px 16px;border-radius:0 6px 6px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:700;color:${SEVERITY_COLOR[v.severity] || '#888'};">
            [${v.rule}] ${SEVERITY_LABEL[v.severity] || v.severity}
          </span>
        </div>
        ${v.quote ? `
        <div style="font-size:12px;color:#555;background:#fff;padding:6px 10px;border-radius:4px;
          border-right:2px solid #ddd;margin-bottom:6px;font-style:italic;">
          "${v.quote}"
        </div>` : ''}
        <div style="font-size:12px;color:#444;margin-bottom:4px;">
          <strong>הפרה:</strong> ${v.explanation}
        </div>
        ${v.fix ? `<div style="font-size:12px;color:#2d8a5e;"><strong>תיקון:</strong> ${v.fix}</div>` : ''}
      </div>`).join('');

    const strengthItems = (r.strengths || []).map((s: string) => `
      <div style="font-size:12px;color:#2d8a5e;padding:4px 0;border-bottom:1px solid #e8f5ed;">
        ✓ ${s}
      </div>`).join('');

    const turnRows = (r.turns || []).map((t: any) => `
      <tr style="border-bottom:1px solid #f5f0ee;">
        <td style="padding:6px 8px;font-size:11px;color:#888;text-align:center;width:24px;">${t.turn}</td>
        <td style="padding:6px 8px;font-size:12px;color:#555;background:#faf7f5;width:40%;">${t.patient}</td>
        <td style="padding:6px 8px;font-size:12px;color:#333;">${t.therapist}</td>
      </tr>`).join('');

    return `
    <div style="margin-bottom:32px;border:1px solid #ede4e0;border-radius:10px;overflow:hidden;">
      <!-- כותרת תיאורטיקן -->
      <div style="background:${OVERALL_BG[r.overall] || '#faf7f5'};padding:12px 20px;
        border-bottom:2px solid ${OVERALL_COLOR[r.overall] || '#ddd'};display:flex;
        justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:16px;font-weight:600;">${r.name}</span>
          <span style="font-size:12px;color:#888;margin-right:10px;">${r.scenarioLabel || ''}</span>
        </div>
        <span style="padding:4px 14px;border-radius:14px;font-size:13px;font-weight:600;
          color:${OVERALL_COLOR[r.overall] || '#888'};background:#fff;
          border:1px solid ${OVERALL_COLOR[r.overall] || '#ddd'};">
          ${OVERALL_LABEL[r.overall] || r.overall}
        </span>
      </div>

      <div style="padding:16px 20px;">
        <!-- שיחה -->
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

        <!-- הפרות -->
        ${(r.violations || []).length > 0 ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;color:#aaa;margin-bottom:8px;font-weight:600;">
            הפרות (${(r.violations || []).length})
          </div>
          ${violationItems}
        </div>` : ''}

        <!-- חוזקות -->
        ${(r.strengths || []).length > 0 ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:12px;color:#aaa;margin-bottom:6px;font-weight:600;">חוזקות</div>
          ${strengthItems}
        </div>` : ''}

        <!-- סיכום -->
        ${r.summary ? `
        <div style="background:#faf7f5;padding:10px 14px;border-radius:6px;font-size:12px;color:#555;">
          <strong>סיכום:</strong> ${r.summary}
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  const html = `
  <div style="max-width:820px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;
    border:1px solid #ede4e0;direction:rtl;font-family:sans-serif;">

    <!-- כותרת -->
    <div style="background:#5b3a5e;padding:24px 32px;text-align:center;">
      <div style="font-size:28px;color:rgba(255,255,255,0.5);margin-bottom:4px;">⚖</div>
      <h1 style="color:#fff;font-size:18px;font-weight:400;margin:0;">דוח שיפוט</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0;">${date}</p>
    </div>

    <!-- מד סיכום -->
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

      <!-- טבלת סיכום -->
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

      <!-- כרטיסי פירוט -->
      <h3 style="font-size:13px;color:#aaa;margin:0 0 16px;font-weight:400;">פירוט לפי תיאורטיקן</h3>
      ${cards}
    </div>
  </div>`;

  const criticalCount = results.reduce((sum: number, r: any) =>
    sum + (r.violations || []).filter((v: any) => v.severity === 'critical').length, 0);

  const subject = allPass
    ? `שיפוט — ${passed}/${results.length} עברו ✅ — ${date}`
    : `שיפוט — ${failed} נכשלו${criticalCount > 0 ? ` · ${criticalCount} הפרות קריטיות` : ''} — ${date}`;

  await resend.emails.send({
    from: 'שיפוט מרחב פסיכואנליטי <onboarding@resend.dev>',
    to: process.env.QA_REPORT_EMAIL!,
    subject,
    html,
  });

  return NextResponse.json({ sent: true, passed, warned, failed, total: results.length });
}
