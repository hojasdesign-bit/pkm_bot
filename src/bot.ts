import { Bot } from "grammy";
import type { Env } from "./config/env.ts";
import type { MyContext } from "./core/context.ts";
import { handleBotError } from "./core/errors.ts";
import { SupabaseRest } from "./infra/supabase/client.ts";
import { privateComposer } from "./routes/private.ts";
import { groupComposer } from "./routes/group.ts";
import {
  handlePreCheckout,
  handleSuccessfulPayment,
} from "./features/private/shop/index.ts";

export function createBot(env: Env): Bot<MyContext> {
  const bot = new Bot<MyContext>(env.BOT_TOKEN);

  // Attach env + Supabase to every context. No Deno APIs, no session in KV.
  const db = new SupabaseRest(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  bot.use(async (ctx, next) => {
    ctx.env = env;
    ctx.db = db;
    await next();
  });

  // Payments have no chat on pre_checkout_query -> register globally.
  bot.on("pre_checkout_query", handlePreCheckout);
  bot.on(":successful_payment", handleSuccessfulPayment);

  // Main router: PV vs Grupo. Anything else is logged and ignored.
  bot.use(async (ctx, next) => {
    const type = ctx.chat?.type;
    if (type === "private") {
      await privateComposer.middleware()(ctx, next);
    } else if (type === "group" || type === "supergroup") {
      await groupComposer.middleware()(ctx, next);
    } else if (type === undefined) {
      // Updates without chat (e.g. pre_checkout) already handled above.
      await next();
    } else {
      console.log(`Ignoring chat type: ${type}`);
    }
  });

  bot.catch(handleBotError);
  return bot;
}
