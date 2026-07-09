import Anthropic from '@anthropic-ai/sdk';

// Shared closure-contract enforcement — BW-126 (originally write-summary), reused by BW-129
// (analyze-note, patient interface). Do NOT duplicate this logic anywhere else — extend here.
//
// The problem this solves: on charged material, the model may faithfully refuse to compress
// into JSON and instead hold in free prose. That prose sometimes ends on a question addressed
// to the reader — which throws material back outward instead of holding it. This is a
// two-layer enforcement that does not depend on the model complying on the first try:
//   1) one corrective re-prompt attempt (keeps the prose natural, rewrites only the closing line)
//   2) a deterministic strip+replace net that runs regardless (guarantees zero question-endings
//      reach the reader, and guarantees the caller never has to fall back to a raw error).

export function endsOnQuestion(text: string): boolean {
  return /\?\s*$/.test(text.trim());
}

export async function attemptFirstPersonLanding(reflection: string, anthropic: Anthropic): Promise<string> {
  try {
    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `You will receive a short holding reflection written in a therapist's voice, in Hebrew or English. It currently ends on a question addressed to the reader. Rewrite ONLY the final sentence or closing paragraph so it lands as a first-person statement the reader can carry forward (for example: "אני רוצה להביא את זה לפגישה..." / "I want to bring this to the session...") instead of a question. Do not change anything before that final sentence — copy it exactly, word for word. Respond with the full corrected text only — no preamble, no quotation marks around it.`,
      messages: [{ role: 'user', content: reflection }],
    });
    const out = res.content[0]?.type === 'text' ? res.content[0].text.trim() : '';
    return out || reflection;
  } catch {
    return reflection; // best-effort — the deterministic net below still applies
  }
}

export function forceFirstPersonLanding(text: string): string {
  const HEBREW_LANDING = 'אני רוצה להביא את זה לפגישה.';
  const ENGLISH_LANDING = 'I want to bring this to the session.';
  const trimmed = text.trim();
  if (!endsOnQuestion(trimmed)) return trimmed;

  const isHebrew = /[֐-׿]/.test(trimmed);
  const landing = isHebrew ? HEBREW_LANDING : ENGLISH_LANDING;

  // Most common shape (per QA): the closing question is its own paragraph — drop it whole.
  const paragraphs = trimmed.split(/\n\s*\n/);
  if (paragraphs.length > 1 && endsOnQuestion(paragraphs[paragraphs.length - 1])) {
    paragraphs[paragraphs.length - 1] = landing;
    return paragraphs.join('\n\n');
  }

  // Fallback: strip the trailing question-sentence and append the landing.
  const withoutTrailingQuestion = trimmed.replace(/[^.!?\n]*\?\s*$/, '').trim();
  return withoutTrailingQuestion.length > 0 ? `${withoutTrailingQuestion}\n\n${landing}` : landing;
}

// Convenience wrapper — applies both layers in order, returns the final safe text.
export async function enforceClosureContract(raw: string, anthropic: Anthropic): Promise<string> {
  let reflection = raw.trim();
  if (endsOnQuestion(reflection)) {
    reflection = await attemptFirstPersonLanding(reflection, anthropic);
  }
  if (endsOnQuestion(reflection)) {
    reflection = forceFirstPersonLanding(reflection);
  }
  return reflection;
}
