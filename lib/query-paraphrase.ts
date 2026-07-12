import Anthropic from '@anthropic-ai/sdk';

// ─────────────────────────────────────────────────────────────────────────────
// Query paraphrase for retrieval (register-gap fix layer 1(ב), 12.07)
//
// The RAG corpus is theoretical English. A patient writes short, colloquial
// Hebrew ("למה הכל כל כך מורכב אצלי ומנותק?"). Embedding that directly against
// the corpus retrieves sub-floor (< 0.59) — the query and the corpus live in
// different languages AND different registers. Query expansion (layer 1(א))
// lifted the score but did not clear the floor (Eitan, 12.07).
//
// This step reframes the patient's material into 2–3 sentences of neutral,
// descriptive theoretical English BEFORE embedding, bridging both gaps at once.
//
// CRITICAL BOUNDARIES:
//   • Descriptive, NOT diagnostic/interpretive — "התבוננות לא אבחנה" (CORE red line).
//     A diagnosing paraphrase would bias retrieval and misrepresent the material.
//   • Ephemeral — the output is used ONLY as the embedding query, then discarded.
//     The patient never sees it; the theorist voice never receives it.
//   • Never blocks — on any failure we return the original query, so retrieval
//     still runs on the expanded-Hebrew query (layer 1(א) behavior).
// ─────────────────────────────────────────────────────────────────────────────

const PARAPHRASE_SYSTEM = `You reframe a patient's own words (usually colloquial Hebrew) into a short, neutral search query for a psychoanalytic knowledge base written in English.

Rules:
- Output 2–3 short sentences of plain theoretical English describing the emotional theme and psychic experience present in the text.
- Translate affect and theme into theoretical vocabulary (e.g. fragmentation, disconnection, loss, control, shame, longing) — but stay DESCRIPTIVE.
- Do NOT diagnose, interpret, or infer hidden meaning. Describe what is present, not what it "really means".
- Do NOT address the patient, do NOT give advice, do NOT ask questions.
- Output only the reframed query text — no preamble, no quotes, no labels.`;

export async function paraphraseForRetrieval(
  anthropic: Anthropic,
  query: string
): Promise<string> {
  if (!query?.trim()) return query;
  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 150,
      system: PARAPHRASE_SYSTEM,
      messages: [{ role: 'user', content: query }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('')
      .trim();
    return text || query; // empty completion → fall back to raw query
  } catch (e) {
    console.warn('[RAG] paraphrase failed, using raw query:', e instanceof Error ? e.message : e);
    return query; // never block retrieval
  }
}
