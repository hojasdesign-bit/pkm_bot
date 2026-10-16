import type { BotError } from "grammy";

export function handleBotError(err: BotError): void {
  const ctx = err.ctx;
  // Never log tokens or secrets. Only the update id + error kind.
  console.error(`Error while handling update ${ctx.update.update_id}:`, err.error);
  try {
    const chatId = ctx.chat?.id;
    if (chatId) {
      void ctx.api
        .sendMessage(chatId, "Ocurrió un error. Inténtalo de nuevo en un momento.")
        .catch(() => undefined);
    }
  } catch {
    // ignore secondary errors
  }
}
