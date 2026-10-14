// A visitor's thumbs up or down on one of Vex's answers. The thumb shows the
// choice at once; the saves go one at a time per answer, and a choice the
// server does not keep is put back to the last one it did.

import { endpoints } from "@/config/endpoints";
import { apiFetch } from "@/lib/apiClient";
import type { ChatAction, ChatMessage, Feedback } from "@/lib/vexChat";

interface SaveOptions {
  messageId: number;
  value: Feedback | null;
  sessionKey: string;
  csrfToken?: string | null;
}

/** Saves a rating (null takes it back). Only the conversation that holds the answer may rate it. */
export async function saveVexFeedback({
  messageId,
  value,
  sessionKey,
  csrfToken,
}: SaveOptions): Promise<void> {
  await apiFetch(endpoints.vex.messages.feedback(messageId), {
    method: "POST",
    headers: {
      "X-Vex-Session": sessionKey,
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
    },
    body: { value },
  });
}

/** One answer's ratings: what the server holds, what the visitor wants, and the saves under way. */
interface Rating {
  /** The message on screen, whose id changes when the history reloads. */
  id: string;
  confirmed: Feedback | null;
  wanted: Feedback | null;
  /** The saves in progress, resolving with whether the last choice was kept. */
  saving: Promise<boolean> | null;
}

/**
 * Rates saved replies. Each rating shows at once. Saves for one answer go one
 * at a time, so they cannot land out of order: while one is in flight only
 * the latest choice is remembered, and sent after it. If a save fails, the
 * thumb goes back to the last rating the server confirmed, unless a newer
 * choice is still to be sent. `rate` resolves with whether the visitor's
 * latest choice was saved.
 */
export function createReplyRater(
  dispatch: (action: ChatAction) => void,
  save: (messageId: number, value: Feedback | null) => Promise<void>,
) {
  const ratings = new Map<number, Rating>();

  const send = async (messageId: number, rating: Rating): Promise<boolean> => {
    while (rating.wanted !== rating.confirmed) {
      const value = rating.wanted;
      try {
        await save(messageId, value);
        rating.confirmed = value;
      } catch (err) {
        console.error("Saving the rating failed", err);
        // A newer choice made meanwhile is still sent.
        if (rating.wanted !== value) continue;
        rating.wanted = rating.confirmed;
        dispatch({ type: "rate", id: rating.id, feedback: rating.confirmed });
        return false;
      }
    }
    return true;
  };

  return (message: ChatMessage, value: Feedback | null): Promise<boolean> => {
    const messageId = message.serverId;
    if (messageId === undefined) return Promise.resolve(false);
    const shown = message.feedback ?? null;
    const rating = ratings.get(messageId) ?? {
      id: message.id,
      confirmed: shown,
      wanted: shown,
      saving: null,
    };
    ratings.set(messageId, rating);
    rating.id = message.id;
    rating.wanted = value;
    dispatch({ type: "rate", id: message.id, feedback: value });
    // Cleared once the saves have settled, which is never before the loop
    // has seen the latest choice.
    const saving = rating.saving ?? send(messageId, rating).finally(() => (rating.saving = null));
    rating.saving = saving;
    return saving;
  };
}
