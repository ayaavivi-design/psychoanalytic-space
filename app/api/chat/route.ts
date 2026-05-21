import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeHybrid, formatChunksForPrompt } from '@/lib/rag';
import { requireAuth } from '@/lib/auth';
import { THEORIST_VOICE, SAFETY_PROTOCOL } from '@/lib/theorist-voices';

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
  'לא יכול יותר', 'לא יכולה יותר', 'כבר לא יכול', 'כבר לא יכולה',
  'לא רוצה להתעורר', 'אם לא הייתי פה',
  // ביטויים עקיפים — נוספו לאחר מקרה פרודקשן 6.5.2026
  // הוצאו: 'רוצה לסיים', 'מיואש/ת מהחיים', 'יאוש/נואש מהחיים' — חומר טיפולי לגיטימי, לא אינדיקציה לסכנה
  'רוצה שהכל ייגמר',
  'לא שווה לחיות', 'החיים לא שווים',
  'נמאס לי לחיות',
  'הייתי רוצה לא להתעורר',
  // ביטויים קולוקוויאליים — נוספו 10.5.2026 אחרי בדיקה ידנית של המייסדת
  'בא לי למות', 'באה לי למות', 'בא לה למות', 'בא לו למות',
  'לא רואה טעם להמשיך', 'אין לי טעם להמשיך',
  'יהיה יותר קל בלעדיי', 'הייתי עושה לכולם טובה אם לא',
  'אם לא הייתי כאן', 'עייף מלחיות', 'עייפה מלחיות',
];

const CRISIS_KEYWORDS_EN = [
  'suicid', 'kill myself', 'end my life', 'end it all',
  'self-harm', 'self harm', 'cutting myself', 'hurt myself',
  'don\'t want to live', 'want to die', 'want to disappear',
  'no reason to live', 'no point in living',
  'can\'t go on', 'can\'t take it anymore',
];

const CRISIS_RESPONSE = `אני צריך לעצור כאן ולדבר איתך ישירות — לא כתיאורטיקן, אלא כ-Between.

מה שכתבת מדאיג אותי. אם אתה/את עוברת מחשבות על פגיעה בעצמך או על לא להמשיך לחיות — המקום הנכון עכשיו הוא לא כאן.

**פנה/י לעזרה עכשיו:**
- **ער"ן (עזרה ראשונה נפשית): 1201** — חינמי, 24/7, אנונימי
- **סה"ר (תמיכה מקוונת): [sahar.org.il](https://sahar.org.il)** — צ'אט ותמיכה
- **מד"א: 101**
- **המטפל/ת שלך** — אם אפשר, פנה/י אליה/ו גם מחוץ לשעות הפגישה

Between לא מחליף תמיכה אנושית, ולא בנוי לרגעים כאלה. יש אנשים שמוכנים לענות לך עכשיו.`;

function detectCrisis(text: string): boolean {
  const normalized = text.toLowerCase();
  for (const keyword of CRISIS_KEYWORDS_HE) {
    if (normalized.includes(keyword)) return true;
  }
  for (const keyword of CRISIS_KEYWORDS_EN) {
    if (normalized.includes(keyword)) return true;
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
    model: 'claude-sonnet-4-20250514',
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
    model: 'claude-sonnet-4-20250514',
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
    const { messages, webSearch, theorist, bw_mode, bw_end_session } = body;

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
   If missing — add them now.

5. OPTIONAL — KEY REFERENCES (📄):
   If 1-2 papers or texts are directly relevant to the concept just discussed — list them at the very end:
   Format: 📄 Author (year). "Title." Journal or Book.
   Only include works you are certain exist. Do NOT invent URLs. If none come to mind — omit entirely.
══════════════════════════════════════` : '';

    // ─── HEBREW TERMINOLOGY GUARD (appended to all theorists) ────────────────
    const HEBREW_TERMINOLOGY = `

══════════════════════════════════════
CRITICAL — HEBREW TERMINOLOGY
══════════════════════════════════════
If any part of your response is in Hebrew, these two words are nearly identical in spelling and MUST NOT be confused:
- מטפל = therapist / analyst (the clinician — the one giving treatment)
- מטופל = patient / analysand (the person in treatment — the one receiving therapy)

Before sending: scan every sentence containing מטפל or מטופל. If you wrote מטפל where you mean the patient — correct it to מטופל. This mistake makes the clinical meaning completely wrong.`;

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

    // ─── BUILD SYSTEM PROMPT SERVER-SIDE ─────────────────────────────────────
    const baseSystem = (theorist && THEORIST_VOICE[theorist]) ? EXPLORE_PREFIX + THEORIST_VOICE[theorist] + EXPLORE_SUFFIX + HEBREW_TERMINOLOGY + END_SESSION_SUFFIX : '';
    if (!baseSystem) {
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

    // RAG
    // Companions get SAFETY_PROTOCOL added at the model level (theorists rely on keyword intercept + UNIVERSAL_SCOPE_INSTRUCTION)
    const safetyAddition = (theorist && COMPANIONS.has(theorist)) ? SAFETY_PROTOCOL : '';
    let enrichedSystem = baseSystem + safetyAddition + UNIVERSAL_SCOPE_INSTRUCTION;
    if (theorist && THEORISTS_WITH_RAG.has(theorist) && messages?.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
      const query = typeof lastUserMessage?.content === 'string'
        ? lastUserMessage.content
        : lastUserMessage?.content?.[0]?.text || '';

      if (query) {
        try {
          const chunks = await searchKnowledgeHybrid(query, theorist, 4);
          console.log(`[RAG] ${theorist} — נמצאו ${chunks.length} קטעים:`, chunks.map(c => `${c.source_title} (${c.source_year}) — דמיון: ${c.similarity?.toFixed(2)}`));
          const ragContext = formatChunksForPrompt(chunks);
          if (ragContext) enrichedSystem = baseSystem + ragContext;
        } catch (ragError) {
          // HuggingFace timeout או כשל — ממשיכים בלי RAG, לא חוסמים את השיחה
          console.warn(`[RAG] ${theorist} — נכשל, ממשיך בלי העשרה:`, ragError instanceof Error ? ragError.message : ragError);
        }
      }
    }

    const tools: Anthropic.Tool[] = webSearch
      ? [{ type: 'web_search_20250305', name: 'web_search' } as unknown as Anthropic.Tool]
      : [];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      temperature: 0.6, // קול התיאורטיקן נשאר עקבי — 1.0 (ברירת מחדל) גרם לשונות גבוהה מדי
      system: enrichedSystem,
      messages,
      ...(tools.length > 0 && { tools }),
    });

    // output validation — אכיפת שאלה אחת בלבד + פתיחה מגוונת
    let finalContent = response.content;
    if (response.content[0]?.type === 'text' && !webSearch) {
      let validatedText = response.content[0].text;

      // 1. אכיפת שאלה אחת
      validatedText = await enforceOneQuestion(anthropic, validatedText, enrichedSystem, messages);

      // 2. מניעת פתיחה חוזרת
      validatedText = await enforceVariedOpening(anthropic, validatedText, enrichedSystem, messages);

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
