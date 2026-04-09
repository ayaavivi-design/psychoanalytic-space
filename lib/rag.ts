import { pipeline, env } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';

// שמור מודל בזיכרון בין בקשות
env.cacheDir = '/tmp/transformers-cache';
let embedder: ReturnType<typeof pipeline> | null = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = pipeline(
      'feature-extraction',
      'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
    );
  }
  return embedder;
}

export async function searchKnowledge(
  query: string,
  theorist: string,
  count = 4
): Promise<{ content: string; source_title: string; source_year: number | null; similarity: number }[]> {
  try {
    const embed = await (await getEmbedder()) as any;
    const output = await embed(query, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data as Float32Array);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: embedding,
      match_theorist: theorist,
      match_count: count,
    });

    if (error || !data) return [];
    return data;
  } catch (e) {
    console.error('RAG search error:', e);
    return [];
  }
}

export function formatChunksForPrompt(
  chunks: { content: string; source_title: string; source_year: number | null }[]
): string {
  if (!chunks.length) return '';

  const passages = chunks
    .map((c) => {
      const source = c.source_title
        ? `${c.source_title}${c.source_year ? `, ${c.source_year}` : ''}`
        : '';
      return source ? `[${source}]:\n${c.content}` : c.content;
    })
    .join('\n\n---\n\n');

  return `\n\nRELEVANT PASSAGES FROM ORIGINAL TEXTS — these are direct excerpts. Use them as ground for your response. You may quote directly with attribution:\n\n${passages}\n\n---\n`;
}
