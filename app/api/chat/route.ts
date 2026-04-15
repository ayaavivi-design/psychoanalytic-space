import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge, formatChunksForPrompt } from '@/lib/rag';

const THEORISTS_WITH_RAG = new Set(['freud', 'klein', 'winnicott', 'ogden', 'loewald', 'bion', 'kohut', 'heimann']);

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

  // מחפשים את התגובה האחרונה של האנליטיקאי בהיסטוריה
  const prevAssistant = [...messages].reverse().find(m => m.role === 'assistant');
  if (!prevAssistant) return text;

  const prevText = typeof prevAssistant.content === 'string'
    ? prevAssistant.content
    : (prevAssistant.content as { type: string; text?: string }[])?.[0]?.text || '';
  const prevOpening = prevText.trim().split(/\s/)[0];

  if (currentOpening !== prevOpening) return text;

  // אותה מילת פתיחה — שולחים לתיקון
  const fixResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system,
    messages: [
      ...messages,
      { role: 'assistant', content: text },
      {
        role: 'user',
        content: `עצור. התגובה מתחילה ב"${currentOpening}" — בדיוק כמו התגובה הקודמת שלך.
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
  const fixResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
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
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const body = await req.json();
    const { messages, system, webSearch, theorist } = body;

    // RAG
    let enrichedSystem = system + UNIVERSAL_SCOPE_INSTRUCTION;
    if (theorist && THEORISTS_WITH_RAG.has(theorist) && messages?.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
      const query = typeof lastUserMessage?.content === 'string'
        ? lastUserMessage.content
        : lastUserMessage?.content?.[0]?.text || '';

      if (query) {
        const chunks = await searchKnowledge(query, theorist, 4);
        console.log(`[RAG] ${theorist} — נמצאו ${chunks.length} קטעים:`, chunks.map(c => `${c.source_title} (${c.source_year}) — דמיון: ${c.similarity?.toFixed(2)}`));
        const ragContext = formatChunksForPrompt(chunks);
        if (ragContext) enrichedSystem = system + ragContext;
      }
    }

    const tools: Anthropic.Tool[] = webSearch
      ? [{ type: 'web_search_20250305', name: 'web_search' } as unknown as Anthropic.Tool]
      : [];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
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
