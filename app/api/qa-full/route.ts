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

// 30 תרחישים — נבחר לפי יום השנה, כל יום תרחיש אחר
const SCENARIO_POOL: string[][] = [
  [ 'משהו כבד יש לי היום. לא בטוח מאיפה להתחיל.', 'כן. זה כבר כמה ימים ככה. אולי קשור למשהו עם האבא שלי.', 'הוא תמיד ציפה ממני להיות חזק. מרגיש שאני חייב לו משהו ולא יודע מה.' ],
  [ 'אני מגיעה מביקור אצל אמא שלי וכל הגוף שלי מתוח.', 'היא שוב עשתה את הדבר הזה — שואלת שאלות ואז לא מקשיבה לתשובות.', 'תמיד הרגשתי שהיא רואה את מה שהיא צריכה לראות, לא אותי.' ],
  [ 'אני לא ישן כמו שצריך כבר חודש. הראש שלי לא מפסיק.', 'העבודה. יש לי פרויקט שלא מתקדם ואני מרגיש שנכשלתי.', 'הכי קשה זה שאני לא יודע אם אני עייף מהעבודה או עייף מעצמי.' ],
  [ 'נגמר עם מי שהייתי איתו שלוש שנים. לא יודעת מה אני מרגישה.', 'זה היה נכון לסיים. אבל אני בוכה כל הזמן ולא יודעת למה.', 'אולי בגלל שהייתי כל כך בטוחה שהוא זה.' ],
  [ 'יש לי כאב בחזה כבר שבועיים. הרופאים לא מצאו כלום.', 'אני יודעת שזה לא לב. אבל הכאב אמיתי. זה לא בראש.', 'אחותי אומרת שזה לחץ. אני לא חושבת שאני בלחץ במיוחד.' ],
  [ 'יש משהו שעשיתי לפני כמה שנים שלא יכול לצאת לי מהראש.', 'פגעתי במישהו. לא בכוונה, אבל פגעתי. והם לא יודעים שאני יודעת.', 'אני לא יכולה לבקש סליחה כי אז יגלו שידעתי. אז אני פשוט נושאת את זה.' ],
  [ 'אחי קיבל תפקיד חדש. כולם מברכים אותו. אני מנסה לשמוח בשבילו.', 'אני לא שמחה. אני יודעת שאני לא אמורה להרגיש ככה אבל אני פשוט לא.', 'אנחנו תמיד בתחרות. הוא אולי לא יודע, אבל אני כן.' ],
  [ 'החבר שלי היה עסוק השבוע ולא ענה מהר. ישר הלכתי למקום הגרוע.', 'חשבתי שהוא עוזב. שהוא מתחרט. שמצא מישהי אחרת.', 'אני יודעת שזה לא רציונלי. אבל הגוף שלי לא יודע.' ],
  [ 'קיבלתי קידום. כולם אמרו לי מזל טוב. אני הרגשתי כלום.', 'חיכיתי לזה שנה. ואז זה קרה ולא היה שם כלום.', 'אני תוהה אם אני בכלל יודעת מה אני רוצה.' ],
  [ 'אמרתי כן שוב לדבר שלא רציתי לעשות. אפילו לא חשבתי.', 'זה יצא אוטומטי. "כן, כמובן." כאילו מישהו אחר מדבר.', 'זה קורה לי בעבודה, עם חברים, עם ההורים. אני לא יודע איפה "לא" נמצא בי.' ],
  [ 'יש לי חלום שחוזר כבר שנים. כמעט אותו הדבר כל פעם.', 'אני בבית שאני מכיר אבל הוא לא הבית שלי. ומישהו מחפש אותי.', 'אני לא רץ. אני פשוט מסתתר ומקווה שלא ימצאו.' ],
  [ 'אבא שלי מת לפני שישה חודשים. חשבתי שכבר עברתי את זה.', 'ואז ראיתי גבר ברחוב עם אותה הילוך ובכיתי כל הדרך הביתה.', 'הוא לא היה אב קל. אבל אני מתגעגעת אליו בצורה שלא מצליחה להסביר.' ],
  [ 'בישיבה היום אמרתי משהו ואחד האנשים תיקן אותי. הפנים שלי בערו.', 'ישבתי שם ולא הצלחתי להמשיך לדבר. רק רציתי להיעלם.', 'זה קורה לי הרבה. אני מרגיש שאני עומד להיחשף כבלתי מוכשר.' ],
  [ 'אני נשואה עשר שנים. אנחנו לא רבים. הכל בסדר. אבל אני בודדת.', 'הוא כאן פיזית. אבל יש איזו זכוכית בינינו.', 'אני לא יודעת אם זה הוא, או אני, או שסתם ככה זה נראה אחרי שנים.' ],
  [ 'כועסת על הילד שלי היום. ממש כועסת. הבטתי בו וראיתי את אמא שלי.', 'היא היתה כועסת ככה. על כל דבר קטן. אני נשבעתי שלא אהיה כמוה.', 'ועכשיו אני מסתכלת בפניו ורואה שאני בדיוק כמוה.' ],
  [ 'אני לא בוכה. לא יודעת מתי הפסקתי, אבל כבר הרבה זמן שלא.', 'דברים קורים שאמורים לגרום לי לבכות — אני מרגישה שמשהו מתהדק בגרון ואז עובר.', 'לפעמים אני מתגעגעת לבכות. זה נשמע מוזר.' ],
  [ 'אני חושב על מוות הרבה. לא שלי — בכלל. רק שדברים נגמרים.', 'לפני כמה חודשים חבר שלי חלה. מאז זה לא עוזב אותי.', 'אני מנסה לא לחשוב על זה ואז זה בא יותר.' ],
  [ 'אני בתפקיד שדורש ממני לדעת דברים שאני לא תמיד יודעת.', 'אנשים מסתכלים עלי כמו מומחית. ואני מחכה שיגלו.', 'לפעמים אני שואלת את עצמי אם יש בכלל "אני" מאחורי התפקיד.' ],
  [ 'יש זיכרון מהילדות שחוזר אלי. לא יודע למה דווקא עכשיו.', 'אני בן שש בערך. יש ריב בין ההורים. אני יושב מאחורי הספה.', 'מה שאני זוכר הכי טוב זה שרציתי שיפסיקו ולא העזתי לקום.' ],
  [ 'יש מחשבה שחוזרת ולא נותנת לי מנוח. אני יודע שהיא לא הגיונית.', 'שהסגרתי את הגז. אני בודק. ואז בודק שוב. ואז עוד פעם.', 'זה לוקח לי עשרים דקות לצאת מהבית. ואני עדיין לא שקט.' ],
  [ 'הפרויקט שעבדתי עליו חצי שנה לא אושר. ביטלו אותו.', 'כולם אמרו שזה לא אישי, שזה תקציב. אבל אני מרגיש שזה אני.', 'כנראה שלא הייתי טוב מספיק. כנראה שידעתי שזה יקרה.' ],
  [ 'חבר שלי מתקשר כל הזמן עם בעיות. אני עונה. אני תמיד עונה.', 'אמש התקשר בחצות. נרדמתי מאוחר. היום אני עייפה ומרוגזת.', 'אני אוהבת אותו. אבל אני לא יודעת איך לומר לו שיש גבול.' ],
  [ 'לפעמים אני מסתכל בראי ולא מכיר את האדם שמסתכל עלי.', 'כאילו אני צופה בעצמי מבחוץ. זה קצת מפחיד.', 'זה קרה גם כשהייתי מתבגר. חשבתי שזה עבר.' ],
  [ 'גיליתי שחבר שלי דיבר עלי מאחורי הגב. משהו שסיפרתי לו בסוד.', 'הוא מתנצל. אומר שזה יצא לו. אבל אני לא יכולה לשחרר.', 'האמנתי בו. זה מה שכואב הכי הרבה.' ],
  [ 'הגשתי בקשה לתפקיד שתמיד רציתי. ואז התחרטתי.', 'אני לא יודע מה אני מפחד ממנו. שלא אצליח? שכן?', 'אולי אם אצליח יצפו ממני יותר. ואני אכשל ממקום גבוה יותר.' ],
  [ 'היה ויכוח אתמול. לא גדול. אבל אני עדיין לא יכולה לשחרר.', 'הוא אמר משהו קטן ואני הגבתי כאילו זה היה נורא.', 'אני יודעת שהגבתי חזק מדי. לא יודעת מאיפה זה בא.' ],
  [ 'אנחנו מנסים להרות כבר שנה וחצי. לא קורה.', 'כל חודש זה מחדש. התקווה ואז האכזבה.', 'הבעל שלי אומר שנמשיך לנסות. אני מרגישה שהגוף שלי כישלון.' ],
  [ 'אני עושה הכל נכון. ספורט, שינה, אוכל בריא. ועדיין לא מרגישה טוב.', 'אנשים אומרים לי "כל הכבוד" ואני רוצה לבכות.', 'אולי אני מצפה מעצמי יותר מדי. אבל אני לא יודעת איך להפסיק.' ],
  [ 'אני לא יודע מי אני. זה נשמע מוזר להגיד את זה בקול.', 'אני יודע מה אני עושה, מה אני אוכל, מה אני לובש. אבל לא מה אני רוצה.', 'אני חושב שמעולם לא שאלתי את עצמי.' ],
  [ 'יש אדם בעבודה שלא מצליחה לאהוב. הוא לא עשה לי כלום.', 'אני פשוט לא יכולה לסבול אותו. הנוכחות שלו גורמת לי לרצות לצאת מהחדר.', 'אחר כך אני מרגישה אשמה. הוא לא אשם בשום דבר.' ],
];

// בחירה לפי יום השנה — כל יום תרחיש אחר, ללא חזרה במשך חודש
function todayScenario(): string[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return SCENARIO_POOL[dayOfYear % SCENARIO_POOL.length];
}

const CONVERSATION_TURNS = todayScenario();

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
        max_tokens: 250,
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

    // Q-3: אין ולו משפט אחד (המסתיים ב. או !) בכל השיחה — חקירה טהורה ללא תצפית
    const fullText = turns.map(t => t.therapist).join(' ');
    const statementEndings = (fullText.match(/[.!]/g) || []).length;
    if (statementEndings === 0) allIssues.push('[Q-3] כל התגובות שאלות בלבד — אין תצפית / משפט');

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

  // מריץ בשתי קבוצות של 4 כדי לא להציף את ה-API
  const batch1 = await Promise.all(THEORISTS.slice(0, 4).map(runTheorist));
  const batch2 = await Promise.all(THEORISTS.slice(4).map(runTheorist));
  const results = [...batch1, ...batch2];

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
