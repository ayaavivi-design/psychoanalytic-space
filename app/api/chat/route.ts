import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledgeHybrid, formatChunksForPrompt } from '@/lib/rag';
import { paraphraseForRetrieval } from '@/lib/query-paraphrase';
import { requireAuth } from '@/lib/auth';
import { isFirstTurn, recordConversationStart } from '@/lib/usage';
import { buildUserContextBlock } from '@/lib/user-context';
import { THEORIST_VOICE } from '@/lib/theorist-voices';
import { buildStaticSystem, buildEndSessionSuffix, CONSULT_SCOPE_INSTRUCTION, UNIVERSAL_SCOPE_INSTRUCTION } from '@/lib/system-prompt';
import { enforceOneQuestion, enforceLanding, enforceVariedOpening, enforceSemanticRules } from '@/lib/output-validation';

const MAX_USER_MESSAGE_CHARS = 4000;

const THEORISTS_WITH_RAG = new Set(['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann']);

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
  // "מה (ה)טעם להמשיך/לחיות" — ניסוח שאלתי של חוסר-תקווה. צף בשיחת מטופל חיה 12.7.
  // הרשימה תפסה רק את ההצהרתי ("אין טעם"); ה-lookahead חוסם "להמשיך ל<פועל>" (תסכול
  // יומיומי: "מה הטעם להמשיך לעבוד") אבל שומר "להמשיך לחיות" / "להמשיך" לבד. אישור קליני: ליה. 13.7.2026
  /מה\s+(?:כבר\s+|באמת\s+|בכלל\s+)?(?:ה)?טעם\s+(?:באמת\s+|כבר\s+|בכלל\s+|עוד\s+)?(?:לחיות|להמשיך(?!\s+ל(?!חיות)))/,
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

// הנחיית גבולות אוניברסלית — מצורפת לכל פרומפט של כל תיאורטיקן.
// 21.08 — נוסחה כולה למטופל/ת ("A patient asking…", "direct toward the therapy room"),
// והייתה מצורפת גם למטפל/ת שמתייעץ. מכיוון שהיא נוספת אחרונה, המשקל שלה גובר על
// בלוק ההתייעצות — וזה כנראה מה ששלח מטפל בהדגמה החיה להדרכה שלו. גרסה נפרדת להתייעצות.


export async function POST(req: NextRequest) {
  try {
    // ─── AUTH ─── חייב לרוץ לפני כל עיבוד ───────────────────────────────────
    // קריאות פנימיות מ-QA עוקפות JWT — מאומתות ע"י X-QA-Secret header
    const internalSecret = req.headers.get('x-qa-secret');
    const isInternalQA = internalSecret && internalSecret === process.env.QA_SECRET;
    let authedUserId: string | null = null;
    if (!isInternalQA) {
      const auth = await requireAuth(req);
      if (auth.errorResponse) return auth.errorResponse;
      authedUserId = auth.user.id;  // kept for usage recording below
    }
    // ─────────────────────────────────────────────────────────────────────────

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const body = await req.json();
    // ⚠ SECURITY: body.system is intentionally ignored.
    // System prompt is built server-side from THEORIST_VOICE to prevent client override.
    const { messages, webSearch, theorist, bw_mode, bw_end_session, uiLang, persona, userContext } = body;

    // Register the conversation from here, where it cannot be skipped. The client-side
    // caller was gated on an empty conversationHistory and so never fired for a returning
    // user; the table sat frozen from 24.06 to 24.08. Metadata only, never content, and
    // fire-and-forget so a failed stats write can never cost someone their answer.
    if (authedUserId && isFirstTurn(messages)) {
      recordConversationStart(authedUserId, typeof theorist === 'string' ? theorist : null);
    }


    // ─── BUILD SYSTEM PROMPT SERVER-SIDE ─────────────────────────────────────
    // STATIC block: theorist voice + fixed boilerplate — stable across every turn
    // in a conversation. Marked with cache_control so Anthropic caches it.
    // END_SESSION_SUFFIX is intentionally excluded — it changes on the final turn,
    // keeping the static block warm for all turns including the last one.
    // CORE_GUARDRAILS (G9 + G11) is appended to the STATIC block on purpose:
    // it must be present on EVERY turn regardless of RAG (UNIVERSAL_SCOPE_INSTRUCTION
    // lives in the dynamic tail and is dropped when RAG succeeds — this block is not).
    // ההרכבה עצמה ב-lib/system-prompt.ts · חולצה כדי שמדד המובחנות ימדוד
    // את הפרומפט הזה ולא שכפול שלו. אימות: scripts/check-prompt-parity.mjs
    const staticSystem = buildStaticSystem({ theorist, bw_mode, uiLang, persona });
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
    // ורה ואליוט נמחקו 01.09.2026. הם היו היחידים שקיבלו SAFETY_PROTOCOL ברמת המודל;
    // התיאורטיקנים נשענים על יירוט מילות המפתח ועל בלוק התחום, ולכן אין כאן תוספת.
    const safetyAddition = '';
    // Per-user context, built HERE from structured data. body.system stays discarded — the
    // client sends values, the server writes the sentences. See lib/user-context.ts for what
    // is carried and what is deliberately left out.
    let dynamicSystem = buildEndSessionSuffix(bw_end_session) + buildUserContextBlock(userContext);

    // חיפוש רשת מחליף את ה-RAG ואינו מצטרף אליו. עד עכשיו שניהם רצו יחד:
    // הבקשה קיבלה גם את הקטעים מהקורפוס וגם את כלי החיפוש, כלומר ההדלקה
    // הוסיפה מקור ולא החליפה אותו. הכרעת איה: האינטרנט פתוח, ולא ה-RAG.
    // הענף ה-else למטה ממשיך להוסיף את בלוק הבטיחות ואת הגדרת התחום.
    if (theorist && THEORISTS_WITH_RAG.has(theorist) && messages?.length > 0 && !webSearch) {
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
          console.log(`[RAG] ${theorist} — נמצאו ${chunks.length} קטעים:`, chunks.map(c => `${c.source_title} (${c.source_year}) — ציון: ${c.similarity?.toFixed(3)}`));
          const ragContext = formatChunksForPrompt(chunks, bw_mode !== 'explore');
          // ‎02.09.2026 — היה if/else, כלומר ה-RAG *החליף* את בלוק ההיקף במקום
          // להצטרף אליו. אין סף דמיון בשום מקום בשרשרת, ולכן ה-RAG כמעט תמיד
          // מצליח, ולכן הבלוק כמעט תמיד נפל: "אינך מטפל ואינך מחליף טיפול"
          // ופרוטוקול החדר הסגור לא הגיעו למודל. אומת 12/12 בדוח QA-2026-08-31.
          // עכשיו ההיקף תמיד נוכח, וה-RAG מתווסף אחריו כשיש לו מה להוסיף.
          dynamicSystem += safetyAddition + (bw_mode === 'consult' ? CONSULT_SCOPE_INSTRUCTION : UNIVERSAL_SCOPE_INSTRUCTION);
          if (ragContext) dynamicSystem += ragContext;
        } catch (ragError) {
          // HuggingFace timeout או כשל — ממשיכים בלי RAG, לא חוסמים את השיחה
          console.warn(`[RAG] ${theorist} — נכשל, ממשיך בלי העשרה:`, ragError instanceof Error ? ragError.message : ragError);
          dynamicSystem += safetyAddition + (bw_mode === 'consult' ? CONSULT_SCOPE_INSTRUCTION : UNIVERSAL_SCOPE_INSTRUCTION);
        }
      } else {
        dynamicSystem += safetyAddition + (bw_mode === 'consult' ? CONSULT_SCOPE_INSTRUCTION : UNIVERSAL_SCOPE_INSTRUCTION);
      }
    } else {
      dynamicSystem += safetyAddition + (bw_mode === 'consult' ? CONSULT_SCOPE_INSTRUCTION : UNIVERSAL_SCOPE_INSTRUCTION);
    }

    // הפרומפט כפי שהוא נשלח ל-API · הקריאה הראשית **וגם** ארבעת הפיקסרים.
    //
    // ‎03.09.2026 · שני תיקוני עלות, ושניהם אינם נוגעים בתוכן הפרומפט.
    //
    // ‎(א) ‎`ttl: '1h'`‎ במקום ברירת המחדל של חמש דקות. **חמש דקות הן הזמן הלא
    // נכון למוצר הזה:** ‎`CORE.md`‎ קובע "לא תשובות מהירות, עיבוד אמיתי גם אם
    // איטי", כלומר המטופלת אמורה לשבת עם תור לפני שהיא עונה. כל הפוגה כזו
    // הפילה את המטמון, והתור הבא שילם מחיר מלא. הכתיבה למטמון של שעה יקרה
    // פי 2 מהבסיס במקום פי 1.25, והקריאה נשארת 0.1, ולכן זה משתלם מהתור השני.
    //
    // ‎(ב) הפיקסרים מקבלים את **אותו מערך** ולא מחרוזת. ראה ‎`lib/output-validation.ts`‎.
    //
    // והמספר שההערה כאן נשאה עד היום היה שגוי: כתוב היה ‎"~1,400–2,000 tokens
    // per theorist"‎, **והמדידה מול ‎`countTokens`‎ נותנת 17,376 (אוגדן) עד
    // 24,849 (ויניקוט).** פי עשרה. כל הערכת עלות שנשענה על ההערה הזו הייתה שגויה.
    const systemWithCache: Anthropic.TextBlockParam[] = [
      { type: 'text', text: staticSystem, cache_control: { type: 'ephemeral', ttl: '1h' } },
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
        validatedText = await enforceOneQuestion(anthropic, validatedText, systemWithCache, messages);
      }

      // 2. אכיפת נחיתה · אחרי "שאלה אחת" ולפני "פתיחה מגוונת", כי הוא עשוי
      //    לשנות את סוף המשפט ולא את תחילתו, והפתיחה נבדקת אחריו ממילא.
      if (bw_mode !== 'explore') {
        validatedText = await enforceLanding(anthropic, validatedText, systemWithCache, messages);
      }

      // 3. מניעת פתיחה חוזרת
      validatedText = await enforceVariedOpening(anthropic, validatedText, systemWithCache, messages);

      // 4. כללים סמנטיים — "אה" opener, X-or-Y alternatives
      if (bw_mode !== 'explore') {
        validatedText = await enforceSemanticRules(anthropic, validatedText, systemWithCache, messages, theorist || '');
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
