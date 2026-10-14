// A visitor's thumbs up or down on one of Vex's answers. The thumb shows the
// choice at once, and is put back if the server does not keep it.

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

/**
 * Rates a saved reply: shows the rating at once, saves it, and if the save
 * fails puts back the rating it replaced, unless the visitor has chosen again
 * meanwhile. Resolves with whether the rating was saved.
 */
export async function rateReply(
  message: ChatMessage,
  value: Feedback | null,
  dispatch: (action: ChatAction) => void,
  save: (messageId: number, value: Feedback | null) => Promise<void>,
): Promise<boolean> {
  if (message.serverId === undefined) return false;
  const previous = message.feedback ?? null;
  dispatch({ type: "rate", id: message.id, feedback: value });
  try {
    await save(message.serverId, value);
    return true;
  } catch (err) {
    console.error("Saving the rating failed", err);
    dispatch({ type: "rate", id: message.id, feedback: previous, ifCurrent: value });
    return false;
  }
}
