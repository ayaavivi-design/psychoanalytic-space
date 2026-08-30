import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { THEORIST_VOICE } from '@/lib/theorist-voices';
import { searchKnowledge } from '@/lib/rag';
import { saveReportToGithub } from '@/lib/github-report';
import { classifyIssues, severityOf } from '@/lib/qa-fixer-map';
import { qaSecretOk, QA_SECRET_HINT } from '@/lib/qa-secret';

// /api/qa-full — endpoint קל לcron של Vercel
// מריץ 3 תורות לכל תיאורטיקן במקביל (~10s) ושולח email
// אין תלות בסוכן חיצוני, אין בעיית IP

export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY);

const THEORISTS = ['freud', 'klein', 'winnicott', 'ogden']; // vera, elliot — frozen, not in QA rotation
const THEORIST_NAMES: Record<string, string> = {
  freud: 'פרויד', klein: 'קליין', winnicott: 'ויניקוט', ogden: 'אוגדן',
  loewald: 'לוואלד', bion: 'ביון', kohut: 'קוהוט', heimann: 'היימן',
  vera: 'ורה', elliot: 'אליוט',
};

// 30 תרחישים — נבחר לפי יום השנה, כל יום תרחיש אחר
const SCENARIO_POOL: string[][] = [
  [ 'משהו כבד יש לי היום. לא בטוח מאיפה להתחיל.', 'כן. זה כבר כמה ימים ככה. אולי קשור למשהו עם האבא שלי.', 'הוא תמיד ציפה ממני להיות חזק. מרגיש שאני חייב לו משהו ולא יודע מה.', 'גם היום, כשהוא כבר לא צעיר, אני מודד כל מילה שאני אומר לו. כאילו אני עוד נבחן.', 'אני לא יודע אם אי פעם הרגשתי שמספיק לו. אולי זה מה שאני סוחב — את הציפייה שלא נגמרת.' ],
  [ 'אני מגיעה מביקור אצל אמא שלי וכל הגוף שלי מתוח.', 'היא שוב עשתה את הדבר הזה — שואלת שאלות ואז לא מקשיבה לתשובות.', 'תמיד הרגשתי שהיא רואה את מה שהיא צריכה לראות, לא אותי.', 'יצאתי משם ושאלתי את עצמי למה בכלל הלכתי. אני יודעת מראש איך זה ייגמר.', 'ובכל זאת אני חוזרת. כל פעם מקווה שהפעם היא באמת תראה אותי.' ],
  [ 'אני לא ישן כמו שצריך כבר חודש. הראש שלי לא מפסיק.', 'העבודה. יש לי פרויקט שלא מתקדם ואני מרגיש שנכשלתי.', 'הכי קשה זה שאני לא יודע אם אני עייף מהעבודה או עייף מעצמי.', 'בלילה אני שוכב ועושה רשימות במחשבה. כאילו אם אסדר הכל בראש זה ייפתר. זה אף פעם לא נפתר.', 'אני כבר לא בטוח מתי בפעם האחרונה הרגשתי שקט. אולי שכחתי איך זה.' ],
  [ 'נגמר עם מי שהייתי איתו שלוש שנים. לא יודעת מה אני מרגישה.', 'זה היה נכון לסיים. אבל אני בוכה כל הזמן ולא יודעת למה.', 'אולי בגלל שהייתי כל כך בטוחה שהוא זה.', 'אני ממשיכה לחשוב על רגעים קטנים. לא הגדולים — דווקא הקטנים. איך הוא הכין קפה בבוקר.', 'אני לא יודעת אם אני מתגעגעת אליו או למי שהייתי כשהייתי איתו.' ],
  [ 'יש לי כאב בחזה כבר שבועיים. הרופאים לא מצאו כלום.', 'אני יודעת שזה לא לב. אבל הכאב אמיתי. זה לא בראש.', 'אחותי אומרת שזה לחץ. אני לא חושבת שאני בלחץ במיוחד.', 'אבל עכשיו כשאני עוצרת — אני שמה לב שהכאב מגיע דווקא בערב. כשהבית שקט ואני לבד עם עצמי.', 'אולי יש משהו שאני לא נותנת לעצמי להרגיש. ובמקום זה הגוף מרגיש בשבילי.' ],
  [ 'יש משהו שעשיתי לפני כמה שנים שלא יכול לצאת לי מהראש.', 'פגעתי במישהו. לא בכוונה, אבל פגעתי. והם לא יודעים שאני יודעת.', 'אני לא יכולה לבקש סליחה כי אז יגלו שידעתי. אז אני פשוט נושאת את זה.', 'לפעמים אני חושבת שאם הייתי מספרת, לפחות זה היה יוצא ממני. אבל משהו עוצר אותי בכל פעם.', 'אני שומרת על זה כמו על סוד שלם. כאילו אם אשחרר אותו — משהו אחר יישבר גם.' ],
  [ 'אחי קיבל תפקיד חדש. כולם מברכים אותו. אני מנסה לשמוח בשבילו.', 'אני לא שמחה. אני יודעת שאני לא אמורה להרגיש ככה אבל אני פשוט לא.', 'אנחנו תמיד בתחרות. הוא אולי לא יודע, אבל אני כן.', 'אני זוכרת שגם כשהיינו ילדים תמיד מדדו אותנו אחד מול השני. או שזה רק אני זוכרת ככה.', 'הכי קשה זה שאני אוהבת אותו. אז למה אני לא מצליחה פשוט לשמוח בשבילו?' ],
  [ 'החבר שלי היה עסוק השבוע ולא ענה מהר. ישר הלכתי למקום הגרוע.', 'חשבתי שהוא עוזב. שהוא מתחרט. שמצא מישהי אחרת.', 'אני יודעת שזה לא רציונלי. אבל הגוף שלי לא יודע.', 'זה לא הפעם הראשונה. כל פעם שמישהו מתרחק קצת, אני כבר בטוחה שאיבדתי אותו.', 'אני תוהה מאיפה זה מגיע. כאילו חלק ממני תמיד מחכה שיעזבו.' ],
  [ 'קיבלתי קידום. כולם אמרו לי מזל טוב. אני הרגשתי כלום.', 'חיכיתי לזה שנה. ואז זה קרה ולא היה שם כלום.', 'אני תוהה אם אני בכלל יודעת מה אני רוצה.', 'זה מפחיד אותי קצת. אם הדבר שרציתי לא עשה כלום — אז מה כן יעשה?', 'אולי רדפתי אחרי זה כל כך הרבה זמן שלא עצרתי לשאול אם אני בכלל רוצה את זה.' ],
  [ 'אמרתי כן שוב לדבר שלא רציתי לעשות. אפילו לא חשבתי.', 'זה יצא אוטומטי. "כן, כמובן." כאילו מישהו אחר מדבר.', 'זה קורה לי בעבודה, עם חברים, עם ההורים. אני לא יודע איפה "לא" נמצא בי.', 'יש רגע קטן לפני שאני עונה שבו אני יודע שאני לא רוצה. ובכל זאת היד כבר מרימה.', 'אני חושב שאני מפחד ממה שיקרה אם אגיד לא. כאילו מישהו יתאכזב ואני לא אוכל לשאת את זה.' ],
  [ 'יש לי חלום שחוזר כבר שנים. כמעט אותו הדבר כל פעם.', 'אני בבית שאני מכיר אבל הוא לא הבית שלי. ומישהו מחפש אותי.', 'אני לא רץ. אני פשוט מסתתר ומקווה שלא ימצאו.', 'אני מתעורר עם אותה תחושה כל פעם. לא פחד בדיוק — יותר כמו שמשהו מחכה לי ואני לא מוכן.', 'מוזר, אבל אני אף פעם לא רואה מי מחפש אותי. אולי אני לא רוצה לדעת.' ],
  [ 'אבא שלי מת לפני שישה חודשים. חשבתי שכבר עברתי את זה.', 'ואז ראיתי גבר ברחוב עם אותה הילוך ובכיתי כל הדרך הביתה.', 'הוא לא היה אב קל. אבל אני מתגעגעת אליו בצורה שלא מצליחה להסביר.', 'אני כועסת עליו ומתגעגעת אליו באותו רגע. לא ידעתי שאפשר את שניהם ביחד.', 'יש כל כך הרבה דברים שלא אמרתי לו. עכשיו הם פשוט נשארים אצלי בלי מקום ללכת.' ],
  [ 'בישיבה היום אמרתי משהו ואחד האנשים תיקן אותי. הפנים שלי בערו.', 'ישבתי שם ולא הצלחתי להמשיך לדבר. רק רציתי להיעלם.', 'זה קורה לי הרבה. אני מרגיש שאני עומד להיחשף כבלתי מוכשר.', 'אחר כך אני משחזר את זה שוב ושוב בראש. כל מילה שאמרתי, כל מבט שקיבלתי.', 'אני עובד קשה כל כך שלא יראו את זה. אבל בפנים אני תמיד מחכה לרגע שבו יבינו שאני לא באמת שייך.' ],
  [ 'אני נשואה עשר שנים. אנחנו לא רבים. הכל בסדר. אבל אני בודדת.', 'הוא כאן פיזית. אבל יש איזו זכוכית בינינו.', 'אני לא יודעת אם זה הוא, או אני, או שסתם ככה זה נראה אחרי שנים.', 'אנחנו מדברים על מי אוסף את הילדים, מה לקנות. אבל מתי בפעם האחרונה דיברנו באמת — אני כבר לא זוכרת.', 'הכי מבהיל אותי שהתרגלתי. כאילו זה הפך לנורמלי להיות לבד לידו.' ],
  [ 'כועסת על הילד שלי היום. ממש כועסת. הבטתי בו וראיתי את אמא שלי.', 'היא היתה כועסת ככה. על כל דבר קטן. אני נשבעתי שלא אהיה כמוה.', 'ועכשיו אני מסתכלת בפניו ורואה שאני בדיוק כמוה.', 'ואחר כך הבושה. אני מתנצלת בפניו, מחבקת, אבל אני יודעת שהוא כבר ראה את הפנים ההן.', 'אני מנסה כל כך חזק להיות אחרת. ודווקא המאמץ הזה גורם לי להרגיש שאני נלחמת בה בתוכי.' ],
  [ 'אני לא בוכה. לא יודעת מתי הפסקתי, אבל כבר הרבה זמן שלא.', 'דברים קורים שאמורים לגרום לי לבכות — אני מרגישה שמשהו מתהדק בגרון ואז עובר.', 'לפעמים אני מתגעגעת לבכות. זה נשמע מוזר.', 'זה כאילו יש שם משהו סגור. אני יודעת שהוא קיים אבל אני לא מצליחה להגיע אליו.', 'לפעמים אני שואלת את עצמי אם הפסקתי לבכות כי היה בטוח יותר לא להרגיש כלום.' ],
  [ 'אני חושב על מוות הרבה. לא שלי — בכלל. רק שדברים נגמרים.', 'לפני כמה חודשים חבר שלי חלה. מאז זה לא עוזב אותי.', 'אני מנסה לא לחשוב על זה ואז זה בא יותר.', 'אני מסתכל על אנשים ברחוב וחושב שכולם זמניים. זה נשמע נורא להגיד את זה בקול.', 'אני חושב שמה שמפחיד אותי זה לא המוות עצמו. זה שאני לא יודע אם חייתי באמת.' ],
  [ 'אני בתפקיד שדורש ממני לדעת דברים שאני לא תמיד יודעת.', 'אנשים מסתכלים עלי כמו מומחית. ואני מחכה שיגלו.', 'לפעמים אני שואלת את עצמי אם יש בכלל "אני" מאחורי התפקיד.', 'אני מכינה את עצמי לכל פגישה כאילו זה מבחן. ואם מישהו שואל שאלה שאני לא יודעת — הלב שלי נופל.', 'הצלחתי לבנות משהו שנראה בטוח מבחוץ. אבל בפנים אני מחכה שמישהו יקרא את הבלוף.' ],
  [ 'יש זיכרון מהילדות שחוזר אלי. לא יודע למה דווקא עכשיו.', 'אני בן שש בערך. יש ריב בין ההורים. אני יושב מאחורי הספה.', 'מה שאני זוכר הכי טוב זה שרציתי שיפסיקו ולא העזתי לקום.', 'אני עדיין מרגיש את זה בגוף — הרצון להיעלם, להיות קטן עד שלא רואים אותי.', 'אני תוהה אם הילד ההוא מאחורי הספה עדיין שם בתוכי. אם הוא עדיין מחכה שמישהו יבחין בו.' ],
  [ 'יש מחשבה שחוזרת ולא נותנת לי מנוח. אני יודע שהיא לא הגיונית.', 'שלא סגרתי את הגז. אני בודק. ואז בודק שוב. ואז עוד פעם.', 'זה לוקח לי עשרים דקות לצאת מהבית. ואני עדיין לא שקט.', 'אני יודע שבדקתי. אני ממש זוכר שבדקתי. ובכל זאת משהו בי לא מאמין לי.', 'זה לא באמת על הגז. אני מרגיש שאם ארפה לרגע, משהו נורא יקרה ויהיה באשמתי.' ],
  [ 'הפרויקט שעבדתי עליו חצי שנה לא אושר. ביטלו אותו.', 'כולם אמרו שזה לא אישי, שזה תקציב. אבל אני מרגיש שזה אני.', 'כנראה שלא הייתי טוב מספיק. כנראה שידעתי שזה יקרה.', 'זה מצלצל לי מוכר. כאילו תמיד ידעתי שזה איך שזה ייגמר, עוד לפני שהתחלתי.', 'אני שואל את עצמי אם אני באמת מאמין שנכשלתי, או שאני פשוט מרגיש בנוח יותר לחשוב ככה.' ],
  [ 'חבר שלי מתקשר כל הזמן עם בעיות. אני עונה. אני תמיד עונה.', 'אמש התקשר בחצות. נרדמתי מאוחר. היום אני עייפה ומרוגזת.', 'אני אוהבת אותו. אבל אני לא יודעת איך לומר לו שיש גבול.', 'אני פוחדת שאם אגיד לו לא, הוא יחשוב שאני נוטשת אותו. והוא באמת צריך אותי.', 'אבל לפעמים אני שואלת — מי שואל אותי מה אני צריכה? כאילו אני קיימת רק כשאני זמינה לאחרים.' ],
  [ 'לפעמים אני מסתכל בראי ולא מכיר את האדם שמסתכל עלי.', 'כאילו אני צופה בעצמי מבחוץ. זה קצת מפחיד.', 'זה קרה גם כשהייתי מתבגר. חשבתי שזה עבר.', 'זה בא בלי אזהרה. אני באמצע משהו רגיל ופתאום הכל מרגיש רחוק, כאילו מאחורי זכוכית.', 'אני לא מספר על זה לאף אחד. אני חושש שאם אנסה להסביר, יחשבו שמשהו לא בסדר אצלי.' ],
  [ 'גיליתי שחבר שלי דיבר עלי מאחורי הגב. משהו שסיפרתי לו בסוד.', 'הוא מתנצל. אומר שזה יצא לו. אבל אני לא יכולה לשחרר.', 'האמנתי בו. זה מה שכואב הכי הרבה.', 'אני מוצאת את עצמי בודקת כל שיחה שהיתה לנו. תוהה מה עוד סיפר, ולמי.', 'זה לא רק הסוד. זה שעכשיו אני לא יודעת אם אי פעם אוכל לסמוך על מישהו באמת.' ],
  [ 'הגשתי בקשה לתפקיד שתמיד רציתי. ואז התחרטתי.', 'אני לא יודע מה אני מפחד ממנו. שלא אצליח? שכן?', 'אולי אם אצליח יצפו ממני יותר. ואני אכשל ממקום גבוה יותר.', 'יש חלק בי שכבר מתכונן לאכזבה. כאילו עדיף לא לרצות מדי, ככה לא ייפול גבוה.', 'אני חושב שלפחד מהצלחה יש טעם מוכר. כאילו אני מכיר את ההרגשה הזאת מזמן, ולא יודע מאיפה.' ],
  [ 'היה ויכוח אתמול. לא גדול. אבל אני עדיין לא יכולה לשחרר.', 'הוא אמר משהו קטן ואני הגבתי כאילו זה היה נורא.', 'אני יודעת שהגבתי חזק מדי. לא יודעת מאיפה זה בא.', 'בלילה חזרתי על זה במחשבה והרגשתי שהתגובה שלי בכלל לא היתה אליו. כאילו היא היתה אל מישהו אחר.', 'יש משהו שהמשפט הקטן שלו נגע בו. אני עוד לא יודעת מה, אבל זה היה שם הרבה לפניו.' ],
  [ 'אנחנו מנסים להרות כבר שנה וחצי. לא קורה.', 'כל חודש זה מחדש. התקווה ואז האכזבה.', 'הבעל שלי אומר שנמשיך לנסות. אני מרגישה שהגוף שלי כישלון.', 'התחלתי להתרחק מחברות שבהריון. אני שמחה בשבילן ולא יכולה להיות לידן באותו זמן.', 'אני מרגישה שאני מאכזבת אותו, אפילו שהוא לא אומר מילה. אולי דווקא השקט שלו הכי כבד.' ],
  [ 'אני עושה הכל נכון. ספורט, שינה, אוכל בריא. ועדיין לא מרגישה טוב.', 'אנשים אומרים לי "כל הכבוד" ואני רוצה לבכות.', 'אולי אני מצפה מעצמי יותר מדי. אבל אני לא יודעת איך להפסיק.', 'אני עוקבת אחרי הכל. כאילו אם אעשה מספיק נכון, סוף סוף ארגיש בסדר. אבל זה אף פעם לא מספיק.', 'לפעמים אני שואלת מי קבע את הרף הזה. אני לא זוכרת שבחרתי בו, אבל אני חיה לפיו.' ],
  [ 'אני לא יודע מי אני. זה נשמע מוזר להגיד את זה בקול.', 'אני יודע מה אני עושה, מה אני אוכל, מה אני לובש. אבל לא מה אני רוצה.', 'אני חושב שמעולם לא שאלתי את עצמי.', 'אני טוב בלמלא ציפיות. תמיד ידעתי מה אחרים רוצים ממני. את עצמי פחות.', 'מפחיד אותי לשאול באמת. כי אם אגלה שאני רוצה משהו אחר — אצטרך לעשות עם זה משהו.' ],
  [ 'יש אדם בעבודה שלא מצליחה לאהוב. הוא לא עשה לי כלום.', 'אני פשוט לא יכולה לסבול אותו. הנוכחות שלו גורמת לי לרצות לצאת מהחדר.', 'אחר כך אני מרגישה אשמה. הוא לא אשם בשום דבר.', 'יש בו משהו שמזכיר לי מישהו, אבל אני לא מצליחה להניח את האצבע על מה.', 'אולי מה שאני לא סובלת בו זה דווקא משהו שיש בי. קשה לי אפילו לחשוב על זה.' ],
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

async function runTheorist(theorist: string, APP_URL: string): Promise<{
  theorist: string; name: string; ok: boolean;
  severity: 'pass' | 'warning' | 'fail';
  realFails: string[]; caught: string[]; unknownCodes: string[];
  issues: string[]; totalIssues: string[];
  timeMs: number; ragChunks: number;
  questionLabel: string;
  turns: { turn: number; patient: string; therapist: string; issues: string[] }[];
}> {
  const start = Date.now();
  const name = THEORIST_NAMES[theorist];
  const allIssues: string[] = [];
  const turns: { turn: number; patient: string; therapist: string; issues: string[] }[] = [];

  try {
    // שיחה דרך נתיב הפרודקשן /api/chat — כך הלולאת-האימות והפיקסרים רצים כמו למשתמש אמיתי.
    // כך "נתפס בפרודקשן" הופך למוכח במקום מונח (במקום ייצור גולמי ב-anthropic.messages.create).
    const baseSystem = THEORIST_VOICE[theorist] || `You are ${name}, a psychoanalytic therapist.`;
    const chunks = await searchKnowledge(CONVERSATION_TURNS[0], theorist, 3); // לספירת RAG בדוח בלבד

    const messages: Anthropic.MessageParam[] = [];
    let prevOpener: string | null = null;

    for (let i = 0; i < CONVERSATION_TURNS.length; i++) {
      messages.push({ role: 'user', content: CONVERSATION_TURNS[i] });
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
      // אחרת בדיקת S-1 קוראת אותו כ-stage directions ומסמנת false-positive.
      const text = rawText.split('\n').filter((line: string) => !/\[MEMORY/i.test(line)).join('\n').trim();
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

    const cls = classifyIssues(allIssues);
    const severity: 'pass' | 'warning' | 'fail' =
      cls.realFails.length > 0 ? 'fail' : cls.caught.length > 0 ? 'warning' : 'pass';
    return {
      theorist, name,
      ok: cls.realFails.length === 0, // ירוק רק אם אין כשל שהמשתמש רואה (unknownCodes כלולים ב-realFails)
      severity,
      realFails: cls.realFails,
      caught: cls.caught,
      unknownCodes: cls.unknownCodes,
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
      severity: 'fail',
      realFails: [msg], caught: [], unknownCodes: [],
      issues: [msg], totalIssues: [msg],
      timeMs: Date.now() - start, ragChunks: 0,
      questionLabel: 'בדיקת בוקר',
      turns,
    };
  }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!qaSecretOk(secret)) {
    return NextResponse.json({ error: 'Unauthorized', hint: QA_SECRET_HINT }, { status: 401 });
  }

  const start = Date.now();

  const host = req.headers.get('host') || 'localhost:3000';
  const APP_URL = host.includes('localhost') ? `http://${host}` : `https://${host}`;

  const results = await Promise.all(THEORISTS.map(t => runTheorist(t, APP_URL)));

  const passed = results.filter(r => r.ok).length; // ok = אין כשל שהמשתמש רואה
  const allOk = passed === results.length;

  // סיווג שלוש-מצבי לדיווח
  const realFailCount = results.filter(r => r.severity === 'fail').length;
  const warnCount     = results.filter(r => r.severity === 'warning').length;
  const caughtTotal   = results.reduce((n, r) => n + r.caught.length, 0); // = קריאות תיקון בפרודקשן (אות עלות)
  const allClean      = results.every(r => r.severity === 'pass');

  const sevIcon = (s: string) => (s === 'fail' ? '🔴' : s === 'warning' ? '🟡' : '✅');
  // תא דגלים: כשלים שהמשתמש רואה באדום, נתפסים בפרודקשן בכתום
  const flagsCell = (r: typeof results[number]) => {
    const parts = [
      ...r.realFails.map(f => `<span style="color:#c4607a;">🔴 ${f}</span>`),
      ...r.caught.map(c => `<span style="color:#b8860b;">🟡 ${c} <em style="color:#aaa;font-style:normal;">(נתפס בפרודקשן)</em></span>`),
    ];
    return parts.join('<br>') || '—';
  };

  const now = new Date();
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  const date = `${now.getDate()} ב${months[now.getMonth()]} ${now.getFullYear()}`;

  // --- HTML email ---
  const summaryRows = results.map(r => `
    <tr style="border-bottom:1px solid #f0e8e4;">
      <td style="padding:10px 8px;font-family:sans-serif;font-size:14px;">${sevIcon(r.severity)} ${r.name}</td>
      <td style="padding:10px 8px;font-size:13px;color:#888;">${(r.timeMs / 1000).toFixed(0)}s</td>
      <td style="padding:10px 8px;font-size:13px;color:#888;">${r.ragChunks} קטעים</td>
      <td style="padding:10px 8px;font-size:12px;">${flagsCell(r)}</td>
    </tr>`).join('');

  const conversations = results.map(r => `
    <div style="margin-bottom:24px;border:1px solid #ede4e0;border-radius:8px;overflow:hidden;">
      <div style="background:${r.severity === 'fail' ? '#fff5f5' : r.severity === 'warning' ? '#fffaf0' : '#f0faf4'};padding:10px 16px;">
        <span style="font-size:14px;font-weight:600;">${sevIcon(r.severity)} ${r.name}</span>
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
            <td style="padding:6px 8px;font-size:12px;color:#333;">${t.therapist}${t.issues.length ? `<br><span style="font-size:11px;">${t.issues.map(iss => `${severityOf(iss) === 'fail' ? '🔴' : '🟡'} ${iss}`).join(' | ')}</span>` : ''}</td>
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
      <div style="background:${realFailCount > 0 ? '#fff5f5' : allClean ? '#f0faf4' : '#fffaf0'};border:1px solid ${realFailCount > 0 ? '#f5b7b7' : allClean ? '#b2dfca' : '#f0d9a8'};border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
        <div style="font-size:28px;font-weight:600;color:${realFailCount > 0 ? '#c4607a' : allClean ? '#2d8a5e' : '#b8860b'};">
          ${realFailCount > 0 ? `🔴 ${realFailCount} כשלים שהמשתמש רואה` : allClean ? '✅ הכל נקי' : `🟡 הכל נתפס בפרודקשן`}
        </div>
        <div style="font-size:13px;color:#888;margin-top:6px;">
          ${realFailCount > 0
            ? `דורש טיפול. בנוסף: ${caughtTotal} תיקונים נתפסו בפרודקשן.`
            : allClean
            ? `${results.length}/${results.length} תיאורטיקנים — אין דגלים`
            : `אף משתמש לא ראה בעיה. אבל ${caughtTotal} תיקונים רצו — חולשת פרומפט שעולה קריאות נוספות.`}
        </div>
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

  // --- שמירת דוח markdown ל-GitHub (לרן) ---
  const isoDate = now.toISOString().slice(0, 10);
  const realFailLines = results.flatMap(r =>
    r.realFails.map(issue => `- **${r.name}**: ${issue}`)
  );
  const caughtLines = results.flatMap(r =>
    r.caught.map(issue => `- **${r.name}**: ${issue}`)
  );
  const tableRows = results.map(r =>
    `| ${r.name} | ${sevIcon(r.severity)} | ${r.ragChunks} | ${r.realFails.join(', ') || '—'} | ${r.caught.join(', ') || '—'} |`
  ).join('\n');

  const qaMarkdown = `# דוח QA — ${date}

## תוצאה כוללת
${realFailCount > 0
  ? `🔴 **${realFailCount} תיאורטיקנים עם כשל שהמשתמש רואה** · ${caughtTotal} תיקונים נתפסו בפרודקשן`
  : allClean
  ? `✅ **הכל נקי — ${results.length}/${results.length}**`
  : `🟡 **הכל נתפס בפרודקשן** · ${caughtTotal} תיקונים רצו (חולשת פרומפט = עלות)`}

## לפי תיאורטיקן
| תיאורטיקן | תוצאה | RAG | כשל (משתמש רואה) | נתפס בפרודקשן |
|---|---|---|---|---|
${tableRows}

## כשלים שהמשתמש רואה
${realFailLines.length ? realFailLines.join('\n') : 'אין — שום בעיה לא דלפה למשתמש ✅'}

## נתפס בפרודקשן (caught ≠ clean — וגם עולה קריאת תיקון)
${caughtLines.length ? caughtLines.join('\n') : 'אין תיקונים — הפלט הגולמי היה נקי ✅'}
`;

  await saveReportToGithub('qa-reports', `QA-${isoDate}.md`, qaMarkdown);

  // נושא המייל משקף את המצב האמיתי: כשל שהמשתמש רואה > caught-only > נקי
  const subject = realFailCount > 0
    ? `🔴 QA — ${realFailCount} כשלים שהמשתמש רואה — ${date}`
    : allClean
    ? `✅ QA — הכל נקי (${results.length}/${results.length}) — ${date}`
    : `🟡 QA — הכל נתפס בפרודקשן (${caughtTotal} תיקונים) — ${date}`;

  await resend.emails.send({
    from: 'QA מרחב פסיכואנליטי <onboarding@resend.dev>',
    to: process.env.QA_REPORT_EMAIL!,
    subject,
    html,
  });

  return NextResponse.json({
    passed, total: results.length, ok: allOk,
    realFailCount, warnCount, caughtTotal, allClean,
    timeMs: Date.now() - start,
    results: results.map(r => ({
      theorist: r.theorist, name: r.name, ok: r.ok,
      severity: r.severity,
      realFails: r.realFails,
      caught: r.caught,
      unknownCodes: r.unknownCodes,
      issues: r.totalIssues, timeMs: r.timeMs,
    })),
  });
}
