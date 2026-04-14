import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { rating, comment, theorist } = await req.json();

  try {
    await resend.emails.send({
      from: 'פידבק מרחב פסיכואנליטי <onboarding@resend.dev>',
      to: process.env.QA_REPORT_EMAIL!,
      subject: `פידבק משתמש — ${rating}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; padding: 24px; max-width: 480px;">
          <h2 style="color: #c4607a;">פידבק מהמרחב</h2>
          <p><strong>דירוג:</strong> ${rating}</p>
          ${theorist ? `<p><strong>תיאורטיקאי:</strong> ${theorist}</p>` : ''}
          ${comment ? `<p><strong>הערה:</strong><br>${comment}</p>` : ''}
          <p style="color:#999;font-size:12px;">${new Date().toLocaleString('he-IL')}</p>
        </div>
      `
    });
  } catch (e) {
    console.error('[Feedback] שגיאה בשליחת מייל:', e);
    // לא חוסמים את המשתמש אם המייל נכשל
  }

  return NextResponse.json({ ok: true });
}
