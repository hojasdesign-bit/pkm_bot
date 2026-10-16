import { webhookCallback } from "grammy";
import { createBot } from "./bot.ts";
import { validateEnv } from "./config/env.ts";

/**
 * Cloudflare Workers entry.
 * - GET /health -> "ok"
 * - POST / (or /webhook) -> Telegram webhook
 * No Deno APIs. Env comes from Worker bindings / secrets.
 */
export default {
  async fetch(request: Request, rawEnv: unknown): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    let env;
    try {
      env = validateEnv(rawEnv);
    } catch {
      return new Response("Missing env configuration", { status: 500 });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const bot = createBot(env);
      const handleUpdate = webhookCallback(
        bot,
        "cloudflare-mod",
        env.WEBHOOK_SECRET ? { secretToken: env.WEBHOOK_SECRET } : undefined,
      );
      return await handleUpdate(request);
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response("Internal error", { status: 500 });
    }
  },
};
