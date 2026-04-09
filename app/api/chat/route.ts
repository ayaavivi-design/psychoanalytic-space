import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge, formatChunksForPrompt } from '@/lib/rag';

// תיאוריסטים שיש להם ידע במאגר
const THEORISTS_WITH_RAG = new Set(['freud']);

export async function POST(req: NextRequest) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const body = await req.json();
    const { messages, system, webSearch, theorist } = body;

    // RAG — הוסף קטעים רלוונטיים אם יש מאגר לתיאוריסט הזה
    let enrichedSystem = system;
    if (theorist && THEORISTS_WITH_RAG.has(theorist) && messages?.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
      const query = typeof lastUserMessage?.content === 'string'
        ? lastUserMessage.content
        : lastUserMessage?.content?.[0]?.text || '';

      if (query) {
        const chunks = await searchKnowledge(query, theorist, 4);
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

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
