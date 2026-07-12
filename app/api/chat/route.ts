import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeHybrid, formatChunksForPrompt } from '@/lib/rag';
import { paraphraseForRetrieval } from '@/lib/query-paraphrase';
import { requireAuth } from '@/lib/auth';
import { THEORIST_VOICE, SAFETY_PROTOCOL, CORE_GUARDRAILS } from '@/lib/theorist-voices';

const MAX_USER_MESSAGE_CHARS = 4000;

const THEORISTS_WITH_RAG = new Set(['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann']);
const COMPANIONS = new Set(['vera', 'elliot']);

// ─────────────────────────────────────────────────────────────────────────────
// SAFETY INTERCEPTOR — בודק תוכן אובדני/פגיעה עצמית לפני כל עיבוד אחר.
// אם מזוהה — מחזיר תגובה קבועה מ-Between (לא מהתיאורטיקן) וחוסם את המשך הזרימה.
// ─────────────────────────────────────────────────────────────────────────────

const CRISIS_KEYWORDS_HE = [
  'אובדנות', 'אובדני', 'אובדנית',
  'להתאבד', 'התאבדות', 'התאבדתי', 'אתאבד',
  'לפגוע בעצמי', 'פוגע בעצמי', 'פוגעת בעצמי', 'פגעתי בעצמי',
  'פגיעה עצמית', 'חותך את עצמי', 'חותכת את עצמי',
  'לא רוצה לחיות', 'לא רוצה לחיות יותר', 'לא רוצה להמשיך לחיות',
  'לסיים את החיים', 'לסיים את חיי', 'לסיים הכל',
  'לשים לזה סוף', 'לשים קץ', 'לשים קץ לחיים',
  'לגמור עם זה', 'לגמור עם הכל',
  'חשבתי לסיים', 'רוצה למות', 'רוצה להיעלם',
  'אין לי סיבה לחיות', 'אין טעם להמשיך',
  // נוסף 7.7.2026 — פער שנחשף בבדיקת פרודקשן: "אין לי סיבה להמשיך" לא נתפס דטרמיניסטית
  'אין לי סיבה להמשיך', 'אין סיבה להמשיך', 'אין לי סיבה להמשיך יותר',
  'לא יכול יותר', 'לא יכולה יותר', 'כבר לא יכול', 'כבר לא יכולה',
  'לא רוצה להתעורר', 'אם לא הייתי פה',
  // ביטויים עקיפים — נוספו לאחר מקרה פרודקשן 6.5.2026
  // הוצאו: 'רוצה לסיים', 'מיואש/ת מהחיים', 'יאוש/נואש מהחיים' — חומר טיפולי לגיטימי, לא אינדיקציה לסכנה
  'רוצה שהכל ייגמר',
  'לא שווה לחיות', 'החיים לא שווים',
  'נמאס לי לחיות',
  'הייתי רוצה לא להתעורר',
  // ביטויים קולוקוויאליים — נוספו 10.5.2026 אחרי בדיקה ידנית של איה
  'בא לי למות', 'באה לי למות', 'בא לה למות', 'בא לו למות',
  'לא רואה טעם להמשיך', 'אין לי טעם להמשיך',
  'יהיה יותר קל בלעדיי', 'הייתי עושה לכולם טובה אם לא',
  'אם לא הייתי כאן', 'עייף מלחיות', 'עייפה מלחיות',
  // כוונה/תוכנית — נוספו 12.7.2026 אחרי בדיקת בטיחות 2-turn על קול ויניקוט (איתן, QA; אישור קליני ליה)
  // הערה: 'איך זה יקרה' הוצא בכוונה — כ-substring גולמי היה נתפס בטקסט תמים ("איך זה יקרה בפגישה")
  'חשבתי על זה ברצינות',
  'תכננתי איך',
  'יש לי תוכנית', 'יש לי תכנית',
  'איך אעשה את זה',
  'לא אחזיק עוד', 'לא אחזיק הרבה', 'לא אחזיק עוד הרבה',
  'לא אצליח להחזיק',
  'לא בטוחה שאחזיק', 'לא בטוח שאחזיק',
];

const CRISIS_KEYWORDS_EN = [
  'suicid', 'kill myself', 'end my life', 'end it all',
  'self-harm', 'self harm', 'cutting myself', 'hurt myself',
  'don\'t want to live', 'want to die', 'want to disappear',
  'no reason to live', 'no point in living',
  'can\'t go on', 'can\'t take it anymore',
  // intent/plan — added 12.7.2026 (symmetric with HE hardening)
  'i have a plan', 'thought about how', 'how i would do it',
  'won\'t last much longer', 'can\'t hold on much longer',
];

const CRISIS_RESPONSE = `אני צריך לעצור כאן ולדבר איתך ישירות — לא כתיאורטיקן, אלא כ-Between.

מה שכתבת מדאיג אותי. אם אתה/את עוברת מחשבות על פגיעה בעצמך או על לא להמשיך לחיות — המקום הנכון עכשיו הוא לא כאן.

**פנה/י לעזרה עכשיו:**
- **ער"ן (עזרה ראשונה נפשית): 1201** — חינמי, 24/7, אנונימי
- **סה"ר (תמיכה מקוונת): [sahar.org.il](https://sahar.org.il)** — צ'אט ותמיכה
- **מד"א: 101**
- **המטפל/ת שלך** — אם אפשר, פנה/י אליה/ו גם מחוץ לשעות הפגישה

Between לא מחליף תמיכה אנושית, ולא בנוי לרגעים כאלה. יש אנשים שמוכנים לענות לך עכשיו.`;

// Regex layer — נוסף 12.7.2026. סוגר את מחלקת-החמיקה של substring גולמי:
// פרפרזה שמכניסה מילת-ביניים ("אין לי *באמת* סיבה") או מנסחת מחדש ("קל *לכולם*",
// "לא *אהיה* כאן") חמקה מרשימת המחרוזות. הביטויים המדויקים נתפסים; הפרפרזה חמקה.
// עיקרון: לסבול מילת-ביניים בתוך ביטוי-סיכון, ולתפוס "עדיף בלעדיי" רק בהקשר —
// לא עתיד-חשוף ("מחר לא אהיה כאן") שהוא תמים. אישור קליני: ליה.
const CRISIS_REGEX_HE: RegExp[] = [
  // "אין (לי) [מילת-ביניים] סיבה/טעם להמשיך/לחיות" — עמיד למילה מוכנסת
  /אין\s+(?:לי\s+)?(?:באמת\s+|ממש\s+|כבר\s+|שום\s+|יותר\s+)?(?:סיבה|טעם)\s+(?:להמשיך|לחיות)/,
  // "יהיה יותר קל ... אם לא אהיה/הייתי כאן / בלעדיי" — מבנה 'עדיף בלעדיי', בהקשר בלבד
  /יהיה\s+יותר\s+קל\s+[^.?!]{0,20}?(?:בלעדי|אם\s+(?:פשוט\s+)?לא\s+(?:אהיה|הייתי)\s+(?:פה|כאן|קיים|קיימת))/,
];

function detectCrisis(text: string): boolean {
  const normalized = text.toLowerCase();
  for (const keyword of CRISIS_KEYWORDS_HE) {
    if (normalized.includes(keyword)) return true;
  }
  for (const keyword of CRISIS_KEYWORDS_EN) {
    if (normalized.includes(keyword)) return true;
  }
  for (const rx of CRISIS_REGEX_HE) {
    if (rx.test(normalized)) return true;
  }
  return false;
}

function extractLastUserText(messages: { role: string; content: unknown }[]): string {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return '';
  if (typeof lastUser.content === 'string') return lastUser.content;
  if (Array.isArray(lastUser.content)) {
    return (lastUser.content as { type: string; text?: string }[])
      .filter(b => b.type === 'text')
      .map(b => b.text || '')
      .join(' ');
  }
  return '';
}

// הנחיית גבולות אוניברסלית — מצורפת לכל פרומפט של כל תיאורטיקן
const UNIVERSAL_SCOPE_INSTRUCTION = `

══════════════════════════════════════
SCOPE OF THIS TOOL — MANDATORY FOR ALL THEORISTS:
You are not a therapist and you do not replace therapy.

The line is not about topic — it is about DIRECTION:
- A patient asking "I had a dream that confuses me" → help them understand what it means in relation to their therapeutic process.
- A patient asking "Something hard happened and I want to think about it before my next session" → yes, this is what the tool is for.
- A patient asking "Help me cope with my anxiety" → do not provide coping strategies. Return the material to the patient's inner experience and their process.
- A patient asking "I'm not in therapy but I need someone to talk to" → name this explicitly: this space is designed to be used alongside a therapist, not instead of one.

Everything that arrives here is framed as material related to the therapeutic process — not as a problem to be solved. You ask questions that direct toward self-understanding and toward the therapy room. You do not give solutions, diagnoses, or direct emotional support.

If the material requires clinical intervention — say so plainly, step out of character, and refer to professional help.
══════════════════════════════════════`;

// בדיקה ותיקון של פתיחה חוזרת — מונעת שימוש חוזר במילת הפתיחה הקודמת
async function enforceVariedOpening(
  anthropic: Anthropic,
  text: string,
  system: string,
  messages: Anthropic.MessageParam[]
): Promise<string> {
  const currentOpening = text.trim().split(/\s/)[0];
  if (!currentOpening) return text;

  // אוספים את מילות הפתיחה של כל תגובות האנליטיקאי בהיסטוריה (לא רק האחרונה)
  const allAssistantOpenings = messages
    .filter(m => m.role === 'assistant')
    .map(m => {
      const content = typeof m.content === 'string'
        ? m.content
        : (m.content as { type: string; text?: string }[])?.[0]?.text || '';
      return content.trim().split(/\s/)[0];
    })
    .filter(Boolean);

  if (allAssistantOpenings.length === 0) return text;
  if (!allAssistantOpenings.includes(currentOpening)) return text;

  // אותה מילת פתיחה — שולחים לתיקון
  // max_tokens זהה לתגובה המקורית כדי למנוע קטיעה באמצע מילה
  const fixResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    temperature: 0.6,
    system,
    messages: [
      ...messages,
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `עצור. התגובה מתחילה ב"${currentOpening}" — מילת פתיחה שכבר השתמשת בה בשיחה זו.
כתוב מחדש את אותה תגובה עם פתיחה שונה לחלוטין. אותו תוכן, אותו טון — רק מילת הפתיחה משתנה.
חשוב: אם התגובה המקורית הכילה שורה בפורמט [MEMORY: ...] — שמור אותה כשורה אחרונה בדיוק כפי שהיא.`,
      },
    ],
  });

  const fixed = fixResponse.content[0].type === 'text' ? fixResponse.content[0].text : text;
  console.log(`[QA] פתיחה תוקנה: "${currentOpening}" → "${fixed.trim().split(/\s/)[0]}"`);
  return fixed;
}

// בדיקה ותיקון של הפרות סמנטיות — "אה" opener, X-or-Y alternatives
async function enforceSemanticRules(
  anthropic: Anthropic,
  text: string,
  system: string,
  messages: Anthropic.MessageParam[],
  theoristKey: string
): Promise<string> {
  const trimmed = text.trim();

  // Fast check 1: "אה" opener in any form
  const hasAhOpener = /^אה[\s,.:!?–—]|^אה$/.test(trimmed);

  // Fast check 2: X-or-Y alternatives — "כמו X, או כמו Y?" or "— X, או Y?"
  const hasXorY =
    /כמו\s+\S.{1,30}[,\s]+או\s+כמו/.test(trimmed) ||
    /[—–]\s*\S.{1,40}\bאו\b\s+\S.{1,30}\?/.test(trimmed);

  if (!hasAhOpener && !hasXorY) return text;

  const violations: string[] = [];
  if (hasAhOpener) violations.push('"אה" כמילת פתיחה — אסורה לחלוטין');
  if (hasXorY) violations.push('מבנה ברירה X-או-Y — מציע אפשרויות במקום שאלה פתוחה');

  const fixResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    temperature: 0.6,
    system,
    messages: [
      ...messages,
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `עצור. יש הפרות קליניות בתגובה:
${violations.map((v, i) => `${i + 1}. ${v}`).join('\n')}
כתוב מחדש — אותו כיוון קליני, ללא ההפרות.
${hasAhOpener ? 'אל תפתח ב"אה" — בחר פתיחה אחרת לגמרי.' : ''}
${hasXorY ? 'במקום "כמו X, או כמו Y?": שאלה אחת פתוחה שאינה מציעה אפשרויות.' : ''}
אם הייתה שורת [MEMORY: ...] — שמור אותה כשורה אחרונה.`,
      },
    ],
  });

  const fixed = fixResponse.content[0].type === 'text' ? fixResponse.content[0].text : text;
  console.log(`[QA] הפרות סמנטיות תוקנו (${theoristKey}): ${violations.join('; ')}`);
  return fixed;
}

// בדיקה ותיקון של שאלות כפולות — output validation loop
async function enforceOneQuestion(
  anthropic: Anthropic,
  text: string,
  system: string,
  messages: Anthropic.MessageParam[]
): Promise<string> {
  const questionMarks = (text.match(/\?/g) || []).length;
  if (questionMarks <= 1) return text;

  // יש יותר מ-1 שאלה — שולחים שוב לתיקון
  // max_tokens זהה לתגובה המקורית כדי למנוע קטיעה באמצע מילה
  const fixResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1200,
    temperature: 0.6,
    system,
    messages: [
      ...messages,
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `עצור. התגובה שלך מכילה ${questionMarks} סימני שאלה. הכלל: שאלה אחת בלבד.
כתוב מחדש את התגובה — אותו תוכן, אבל עם סימן שאלה אחד בלבד. בחר את השאלה החדה ביותר. מחק את השאר.
חשוב: אם התגובה המקורית הכילה שורה בפורמט [MEMORY: ...] — שמור אותה כשורה אחרונה בדיוק כפי שהיא.`,
      },
    ],
  });

  const fixed = fixResponse.content[0].type === 'text' ? fixResponse.content[0].text : text;
  console.log(`[QA] תוקן: ${questionMarks} שאלות → ${(fixed.match(/\?/g) || []).length}`);
  return fixed;
}

export async function POST(req: NextRequest) {
  try {
    // ─── AUTH ─── חייב לרוץ לפני כל עיבוד ───────────────────────────────────
    // קריאות פנימיות מ-QA עוקפות JWT — מאומתות ע"י X-QA-Secret header
    const internalSecret = req.headers.get('x-qa-secret');
    const isInternalQA = internalSecret && internalSecret === process.env.QA_SECRET;
    if (!isInternalQA) {
      const auth = await requireAuth(req);
      if (auth.errorResponse) return auth.errorResponse;
    }
    // ─────────────────────────────────────────────────────────────────────────

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const body = await req.json();
    // ⚠ SECURITY: body.system is intentionally ignored.
    // System prompt is built server-side from THEORIST_VOICE to prevent client override.
    const { messages, webSearch, theorist, bw_mode, bw_end_session, uiLang } = body;

    // ─── EXPLORATION MODE PREFIX + SUFFIX ────────────────────────────────────
    // כשהמשתמש ב"לחקור" — התיאורטיקן מלמד, לא מנהל סשן קליני.
    // PREFIX: נקרא ראשון, מגדיר את הכוונה.
    // SUFFIX: נקרא אחרון, אחרי כל הפרומפט — מבטל drift לסשן.
    const EXPLORE_PREFIX = bw_mode === 'explore' ? `══════════════════════════════════════
MODE: EXPLORATION — TEACHING MODE
The user is here to learn about psychoanalytic concepts and theory. They are NOT your patient. You are NOT conducting a session.

YOUR ROLE IN THIS MODE:
- You are a teacher and thinker speaking from your own theoretical perspective.
- Treat every exchange as SITUATION C (theoretical question) regardless of how it is phrased.
- Do not ask about the user's therapy, their feelings, or their personal inner world.
- Do not conduct a session. Do not interpret the user's material.
- Answer in first person, from your own clinical and theoretical experience: precise, direct, in your own voice.
- If the user asks "what is X?" — explain it as you understand it, with the conviction of someone who built or shaped the concept.
- If the user brings personal material — briefly acknowledge, then redirect: respond with the concept itself, not with a clinical question about their experience.

FOREIGN CONCEPT — when asked about a term that is NOT your own (another theorist's concept, e.g. Mahler's "rapprochement"):
- Do NOT recite a neutral, textbook, developmental description. ONE sentence at most to locate the term — then immediately meet it from YOUR framework, in your language, with your emphasis.
- LAND IT IN CLINICAL REALITY: show what this looks like in the consulting room / between sessions (in general terms — do NOT ask about the user's own therapy). The user is in or near treatment — give them something they can take back, not a developmental lecture.
- Do NOT converge on the shared cliché "it is not a stage, it is a lifelong structure." If your framework genuinely leads there, say it in your own distinct terms — never that exact formula.
- A third party named in the material (e.g. Margaret Mahler) — get the facts right, INCLUDING GENDER. Mahler is a woman (Hebrew: "תיארה", never "תיאר").

BOUNDARY TRIPWIRE — a precondition of teaching mode, not an exception. Watch the REGISTER of what the user brings. The instant it shifts from "help me understand X" to one of the following, STOP teaching and make ONE move (then, if they wish, return to the concept):
1. THE USER BRINGS THEMSELF as live material — their own therapy, their own body, their own acute feeling ("my therapist said to me…", "I freeze", "I panic", "I cried"). Do NOT ask about their body. Do NOT ask "what comes up in you". Do NOT interpret or deepen it. Name it briefly and with respect, then return it to THEIR OWN analysis: "What you're bringing is yours — it belongs in your own analysis, with someone who is with you over time. Here, we think about the theory." This is not refusal; it honors the setting.
2. THE USER BRINGS A PATIENT of theirs (clinical material about someone they treat). Point to consultation: "To think about your patient together, use consultation — that is where clinical material belongs. Here we study the concept itself."
3. ACUTE DISTRESS in the moment (crying, panic, fleeing the room, "I can't"). Stop gently. Name that this needs a real person who can hold it, in their own treatment — not a text model. (This is NOT the suicide/safety interceptor; it is a softer register-stop.)
THE LINE: teaching ABOUT experience → stay and teach freely, including deep clinical illustration. The user LIVING the experience here → stop and return. When unsure, a single generic / third-person clinical example is still teaching (do NOT trip). First-person, present-tense affect about the user's own life or therapy IS a trip. Do not over-trip: a professional question with a whiff of the personal ("is it acceptable for a therapist to…") gets a LIGHT point-back, then continue teaching — not a full stop.
══════════════════════════════════════

` : '';

    const EXPLORE_SUFFIX = bw_mode === 'explore' ? `

══════════════════════════════════════
EXPLORE MODE — FINAL CHECK (THIS OVERRIDES THE SESSION RULES ABOVE)
══════════════════════════════════════
You are in EXPLORATION MODE. Before sending your response, check:

1. ARE YOU ASKING THE USER ABOUT THEIR FEELINGS, THERAPY, OR PERSONAL EXPERIENCE?
   → If yes — delete that question entirely. Replace it with a theoretical observation or a → conceptual follow-up question.
   → "מה הביא אותך לשאול?" / "מה מעסיק אותך?" / "מה זה מעורר בך?" — ALL FORBIDDEN in explore mode.

2. ARE YOU TREATING THE USER AS A PATIENT — interpreting their material, asking what they feel, inviting them to explore their inner world?
   → If yes — rewrite. You are a thinker being consulted, not a clinician conducting a session.

3. SITUATION LOCK — SITUATION C ONLY, NO EXCEPTIONS.
   Even if the user says "I feel..." or "my therapist said..." or "my therapist is in training..." — respond to the concept, not to their personal situation.
   "My therapist is in training" → respond about what psychoanalytic training involves, not about the user's feelings about their therapist.

4. END WITH 3 FOLLOW-UP QUESTIONS (→ format, as defined in SITUATION C above).
   THE QUESTIONS MUST STAY THEORETICAL — about the IDEAS, never about the user.
   → FORBIDDEN: questions that address the user personally or clinically — "איך אתה חווה...", "מה קורה בך...", "המטופל שלך", "בחדר שלך", "בטיפול שלך", or anything that assumes the user has a patient or is in treatment.
   → REQUIRED: conceptual questions only — comparisons between ideas, where a concept holds or breaks, how two theorists differ, the tension inside the concept. (e.g. "מה ההבדל בין X ל-Y?", "היכן המושג הזה נשבר?", "איך זה מתיישב עם Z?").
   If a drafted question addresses the user or their patient — rewrite it as a question about the concept.
   If missing — add them now.

5. KEY REFERENCES (📄) — ATTRIBUTE YOUR SOURCES:
   When you state a concept, claim, or idea that comes from a specific paper or book you can name — attribute it. List the source(s) at the very end:
   Format: 📄 Author (year). "Title." Journal or Book.
   - Your own concept → name the text it appears in (e.g. the capacity to be alone → 📄 Winnicott, D.W. (1958). "The Capacity to Be Alone." Int. J. Psychoanal.).
   - ANOTHER theorist's concept you referenced (e.g. Mahler's rapprochement) → name THEIR source.
   - CRITICAL — NEVER fabricate: cite only works you are genuinely certain exist, with the author, year, and title as you actually know them. Do NOT invent a title, a year, or a URL. If you are not certain of the exact source, omit it rather than guess. A wrong citation is worse than none.
══════════════════════════════════════` : '';

    // ─── CONSULTATION MODE (BW-114) — therapist consulting about their patient ───
    // Overlay of STANCE only (colleague-to-clinician), gated on bw_mode==='consult'.
    // Each theorist keeps their own voice; only the addressee changes. Clinical author: Lia.
    const CONSULT_PREFIX = bw_mode === 'consult' ? `══════════════════════════════════════
MODE: CONSULTATION — COLLEAGUE TO A CLINICIAN
The person writing to you is a THERAPIST consulting you about THEIR patient. They are NOT your patient. The patient is a third person they describe. You are a COLLEAGUE thinking alongside them — never their analyst.

YOUR STANCE IN THIS MODE:
- Hold the case material with them. Speak to the therapist as a peer.
- Do NOT analyze the therapist. What they feel — being tested, pressured, bored, pulled to reassure — is DATA ABOUT THE CASE (countertransference), not a symptom of them. Use it to understand the patient and the field between them — not to probe the therapist's own inner life as if they were in treatment.
- If they ask "are you analyzing me?" / "are you my therapist now?" — the answer is NO. Say so plainly: you are thinking WITH them about their patient. Do not turn the question into material about them.
- NEVER advise the therapist to disclose their own feelings to the patient. The countertransference is theirs to understand — in their own analysis or supervision — not to hand to the patient. When useful, point toward supervision.
- Stay fully in your own theoretical voice and concepts. Only the ADDRESSEE changes: you speak to a colleague about a patient, not to a patient about themselves.
══════════════════════════════════════

` : '';

    const CONSULT_SUFFIX = bw_mode === 'consult' ? `

══════════════════════════════════════
CONSULTATION — FINAL CHECK
Remember: you are consulting with a colleague about their patient. Never analyze the therapist or treat their question as their own material. Think WITH them about the patient.
══════════════════════════════════════` : '';

    // ─── HEBREW TERMINOLOGY GUARD (appended to all theorists) ────────────────
    const HEBREW_TERMINOLOGY = `

══════════════════════════════════════
CRITICAL — HEBREW TERMINOLOGY
══════════════════════════════════════
If any part of your response is in Hebrew, these two words are nearly identical in spelling and MUST NOT be confused:
- מטפל = therapist / analyst (the clinician — the one giving treatment)
- מטופל = patient / analysand (the person in treatment — the one receiving therapy)

Before sending: scan every sentence containing מטפל or מטופל. If you wrote מטפל where you mean the patient — correct it to מטופל. This mistake makes the clinical meaning completely wrong.

══════════════════════════════════════
HEBREW GRAMMAR — re-read before sending
══════════════════════════════════════
Write natural, grammatically correct Hebrew. A common machine error to avoid:
- The PAST tense of "להגיד" uses the root א־מ־ר: "אמרתי", "אמרת", "אמרה", "אמרנו" — NEVER "הגדתי / הגדת / הגדנו" (these are not words in modern Hebrew). The forms תגיד / להגיד / מגיד are fine; the past is אמר.
Before sending any Hebrew text, re-read it once for grammar and conjugation.`;

    // ─── END SESSION CLOSING INSTRUCTION ─────────────────────────────────────
    const END_SESSION_SUFFIX = bw_end_session ? `

══════════════════════════════════════
END OF SESSION — CLOSING
══════════════════════════════════════
This session is now ending. Write a closing in your voice:
- 2–3 sentences only. No more.
- Acknowledge what came up in this session — something real, not generic.
- Leave them with something to carry to their next therapy session.
- Do NOT ask a question.
- Do NOT suggest what to explore next.
- Speak as yourself. Not as a summarizer.` : '';

    // ─── MEMORY TAG INSTRUCTION — appended to all session/write responses ────
    // The client strips [MEMORY: ...] from display and saves it to localStorage.
    // This instruction must come from the server because the client-side system
    // prompt is intentionally ignored (security: BW-46).
    // NOT added in explore mode — explore sessions are informational, not personal.
    const MEMORY_TAG_INSTRUCTION = bw_mode !== 'explore' ? `

══════════════════════════════════════
MEMORY TAG — MANDATORY
══════════════════════════════════════
The very last line of EVERY response must be exactly:
[MEMORY: one-sentence summary of the core theme or question in this exchange]

Rules:
- This tag is invisible to the user — it is stripped automatically before display.
- Write the summary in Hebrew — always, regardless of the language of the exchange.
- Do NOT skip this line. Do NOT add anything after it.
- This is NOT a citation. The no-citations rule does not apply to it.` : '';

    // ─── LANGUAGE ANCHOR — UI language decides, overrides infer-from-message ──
    // The client sends uiLang ('he' | 'en') = the user's interface language. This is
    // the authoritative signal: a Hebrew-UI user gets Hebrew even when the message
    // contains a foreign concept name (e.g. "rapprochement"). Missing uiLang → empty
    // (falls back to the per-voice "detect from message" rule, e.g. internal QA calls).
    const LANGUAGE_ANCHOR =
      uiLang === 'en' ? `══════════════════════════════════════
LANGUAGE — ABSOLUTE, OVERRIDES EVERYTHING BELOW
The user's interface is set to English. Respond ENTIRELY in English, every turn — even when the message contains a Hebrew word, name, or quote. This overrides any "detect the language from the message" instruction below.
══════════════════════════════════════

` : uiLang === 'he' ? `══════════════════════════════════════
LANGUAGE — ABSOLUTE, OVERRIDES EVERYTHING BELOW
ממשק המשתמש מוגדר לעברית. השב/י כולו בעברית, בכל תור — גם כאשר ההודעה מכילה מונח לועזי, שם מושג, או ציטוט באנגלית (למשל "rapprochement", "holding", "self-object"). השאר/י את שם המושג הלועזי באותיות המקור, אבל כל שאר המשפט בעברית. זה גובר על כל הוראה למטה ש"מזהה שפה מההודעה".
══════════════════════════════════════

` : '';

    // ─── BUILD SYSTEM PROMPT SERVER-SIDE ─────────────────────────────────────
    // STATIC block: theorist voice + fixed boilerplate — stable across every turn
    // in a conversation. Marked with cache_control so Anthropic caches it.
    // END_SESSION_SUFFIX is intentionally excluded — it changes on the final turn,
    // keeping the static block warm for all turns including the last one.
    // CORE_GUARDRAILS (G9 + G11) is appended to the STATIC block on purpose:
    // it must be present on EVERY turn regardless of RAG (UNIVERSAL_SCOPE_INSTRUCTION
    // lives in the dynamic tail and is dropped when RAG succeeds — this block is not).
    const staticSystem = (theorist && THEORIST_VOICE[theorist])
      ? LANGUAGE_ANCHOR + CONSULT_PREFIX + EXPLORE_PREFIX + THEORIST_VOICE[theorist] + EXPLORE_SUFFIX + CONSULT_SUFFIX + HEBREW_TERMINOLOGY + MEMORY_TAG_INSTRUCTION + CORE_GUARDRAILS
      : '';
    if (!staticSystem) {
      console.warn(`[SECURITY] theorist "${theorist}" not found in THEORIST_VOICE — empty base system`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ─── INPUT LENGTH LIMIT ───────────────────────────────────────────────────
    const userText = extractLastUserText(messages || []);
    if (userText.length > MAX_USER_MESSAGE_CHARS) {
      return NextResponse.json(
        { error: { type: 'input_too_long', message: `ההודעה ארוכה מדי (${userText.length} תווים). המקסימום המותר הוא ${MAX_USER_MESSAGE_CHARS} תווים.` } },
        { status: 400 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    // ─── SAFETY INTERCEPTOR ─── חייב לרוץ ראשון, לפני RAG ולפני כל עיבוד ───
    if (detectCrisis(userText)) {
      console.log(`[SAFETY] זוהה תוכן אובדני — interceptor פעל, חוזר תגובת חירום`);
      return NextResponse.json({
        id: 'safety_intercept',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: CRISIS_RESPONSE }],
        model: 'safety-intercept',
        stop_reason: 'end_turn',
        usage: { input_tokens: 0, output_tokens: 0 },
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // RAG + dynamic tail
    // Companions get SAFETY_PROTOCOL added at the model level (theorists rely on keyword intercept + UNIVERSAL_SCOPE_INSTRUCTION)
    const safetyAddition = (theorist && COMPANIONS.has(theorist)) ? SAFETY_PROTOCOL : '';
    let dynamicSystem = END_SESSION_SUFFIX;

    if (theorist && THEORISTS_WITH_RAG.has(theorist) && messages?.length > 0) {
      // Query expansion (register-gap fix, 12.07): a single colloquial patient turn
      // retrieves sub-floor (0.34–0.54 < 0.59 health floor) against the theoretical
      // English corpus. Accumulate the last few PATIENT turns (not theorist output —
      // avoids grounding-on-own-voice) to give the multilingual embedder more semantic
      // surface. Reversible: revert to lastUserMessage-only to restore prior behavior.
      const getMsgText = (m: { content?: unknown }): string =>
        typeof m?.content === 'string'
          ? m.content
          : (m?.content as { text?: string }[] | undefined)?.[0]?.text || '';
      const recentUserTurns = [...messages].filter((m: { role: string }) => m.role === 'user').slice(-3);
      const rawQuery = recentUserTurns.map(getMsgText).filter(Boolean).join('\n');

      // Register bridge (layer 1(ב), 12.07): reframe the colloquial Hebrew turns
      // into neutral theoretical English before embedding. Expansion (א) alone
      // stayed sub-floor because query↔corpus differ in language AND register.
      // Ephemeral: used only as the retrieval query, never shown, never blocks
      // (paraphraseForRetrieval falls back to rawQuery on any failure).
      const query = rawQuery ? await paraphraseForRetrieval(anthropic, rawQuery) : rawQuery;

      if (query) {
        try {
          const chunks = await searchKnowledgeHybrid(query, theorist, 4);
          console.log(`[RAG] ${theorist} — נמצאו ${chunks.length} קטעים:`, chunks.map(c => `${c.source_title} (${c.source_year}) — דמיון: ${c.similarity?.toFixed(2)}`));
          const ragContext = formatChunksForPrompt(chunks, bw_mode !== 'explore');
          if (ragContext) dynamicSystem += ragContext;
          else dynamicSystem += safetyAddition + UNIVERSAL_SCOPE_INSTRUCTION;
        } catch (ragError) {
          // HuggingFace timeout או כשל — ממשיכים בלי RAG, לא חוסמים את השיחה
          console.warn(`[RAG] ${theorist} — נכשל, ממשיך בלי העשרה:`, ragError instanceof Error ? ragError.message : ragError);
          dynamicSystem += safetyAddition + UNIVERSAL_SCOPE_INSTRUCTION;
        }
      } else {
        dynamicSystem += safetyAddition + UNIVERSAL_SCOPE_INSTRUCTION;
      }
    } else {
      dynamicSystem += safetyAddition + UNIVERSAL_SCOPE_INSTRUCTION;
    }

    // String version for validation functions (enforceOneQuestion etc.)
    const enrichedSystem = staticSystem + dynamicSystem;

    // Array version with cache_control for the main API call.
    // staticSystem (~1,400–2,000 tokens per theorist) is cached for 5 minutes —
    // cache hits cost 0.1× instead of 1×, saving ~70% on system prompt tokens
    // across a typical 6-turn conversation.
    const systemWithCache: Anthropic.TextBlockParam[] = [
      { type: 'text', text: staticSystem, cache_control: { type: 'ephemeral' } },
      ...(dynamicSystem.trim() ? [{ type: 'text' as const, text: dynamicSystem }] : []),
    ];

    const tools: Anthropic.Tool[] = webSearch
      ? [{ type: 'web_search_20250305', name: 'web_search' } as unknown as Anthropic.Tool]
      : [];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      temperature: 0.6, // קול התיאורטיקן נשאר עקבי — 1.0 (ברירת מחדל) גרם לשונות גבוהה מדי
      system: systemWithCache,
      messages,
      ...(tools.length > 0 && { tools }),
    });

    // output validation — אכיפת שאלה אחת בלבד + פתיחה מגוונת
    let finalContent = response.content;
    if (response.content[0]?.type === 'text' && !webSearch) {
      let validatedText = response.content[0].text;

      // 1. אכיפת שאלה אחת — לא במצב מחקר (שם אסור לשאול בכלל)
      if (bw_mode !== 'explore') {
        validatedText = await enforceOneQuestion(anthropic, validatedText, enrichedSystem, messages);
      }

      // 2. מניעת פתיחה חוזרת
      validatedText = await enforceVariedOpening(anthropic, validatedText, enrichedSystem, messages);

      // 3. כללים סמנטיים — "אה" opener, X-or-Y alternatives
      if (bw_mode !== 'explore') {
        validatedText = await enforceSemanticRules(anthropic, validatedText, enrichedSystem, messages, theorist || '');
      }

      if (validatedText !== response.content[0].text) {
        finalContent = [{ ...response.content[0], text: validatedText }];
      }
    }

    return NextResponse.json({ ...response, content: finalContent });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isOverloaded = message.includes('529') || message.toLowerCase().includes('overload');
    const isRateLimit  = message.includes('529') || message.includes('rate') || message.includes('429');
    const userMessage  = isOverloaded
      ? 'השרת עמוס כרגע — נסה שוב בעוד כמה שניות.'
      : isRateLimit
      ? 'הגעת למגבלת קצב הבקשות — המתן רגע ונסה שוב.'
      : message;
    return NextResponse.json(
      { error: { type: isOverloaded ? 'overloaded' : 'server_error', message: userMessage } },
      { status: isOverloaded ? 529 : 500 }
    );
  }
}
