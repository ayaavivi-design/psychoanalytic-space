import { createClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// Server-side conversation registration.
//
// user_conversations was frozen from 24.06 to 24.08. The only writer was
// /api/start-conversation, called from checkConversationLimit() in chat.js behind
// `if (conversationHistory.length === 0)`. Conversation content lives in the browser's
// localStorage, so any returning user already has history and the condition is false:
// the endpoint was never reached. Verified 12.08 on Vercel logs — zero calls to
// start-conversation while /api/chat was serving normally.
//
// The fix is to record from the server, inside /api/chat, which fires on every message
// and cannot be skipped by client state. A conversation is identified by the request
// itself: exactly one user message in `messages` means this is its first turn.
//
// WHAT IS RECORDED: user id, theorist, and the timestamp the row defaults to. Metadata
// only. Never content — that decision is settled (MEMORY.md, "תוכן שיחות לא נשמר בשרת")
// and this code must not become the place it quietly changes.
//
// WHAT IS NOT DONE HERE: enforcement. The three-conversation beta cap has not been
// applied since June, so turning it on from the server would start blocking people who
// are unlimited today. That is a product decision, not a bug fix, and it stays in
// /api/start-conversation until someone decides otherwise.
// ─────────────────────────────────────────────────────────────────────────────

export function isFirstTurn(messages: unknown): boolean {
  if (!Array.isArray(messages)) return false;
  return messages.filter(m => (m as { role?: string })?.role === 'user').length === 1;
}

// Fire-and-forget. Recording must never fail a conversation: a patient mid-session does
// not lose her answer because a stats row did not land.
export function recordConversationStart(userId: string, theorist: string | null): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || !userId) return;

  void (async () => {
    try {
      const supabase = createClient(url, key);
      const { error } = await supabase
        .from('user_conversations')
        .insert({ user_id: userId, theorist });
      if (error) console.warn('[usage] insert failed:', error.message);
      else console.log(`[usage] conversation recorded — theorist=${theorist ?? 'none'}`);
    } catch (e) {
      console.warn('[usage] insert threw:', e instanceof Error ? e.message : e);
    }
  })();
}
