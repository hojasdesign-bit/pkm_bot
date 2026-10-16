import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../../../core/context.ts";
import { getBotUsername } from "../../../config/env.ts";
import { getUser } from "../../../infra/supabase/repositories.ts";
import { buildReferralLink } from "./service.ts";

export const referralsComposer = new Composer<MyContext>();

referralsComposer.callbackQuery("menu:referrals", async (ctx) => {
  await ctx.answerCallbackQuery();
  const from = ctx.from;
  if (!from) return;
  const user = await getUser(ctx.db, from.id);
  if (!user) {
    await ctx.reply("Usa /start para empezar tu aventura.");
    return;
  }
  const link = buildReferralLink(getBotUsername(ctx.env), from.id);
  const next = user.referrals_count === 0
    ? "Trae 1 referido para +1 Poké Ball."
    : user.referrals_count < 6
      ? `Te faltan ${6 - user.referrals_count} referido(s) para la segunda Poké Ball extra.`
      : "Ya conseguiste el máximo (2 Poké Balls extra por referidos).";

  await ctx.reply(
    `👥 <b>Referidos</b>\n\n` +
      `Tu enlace:\n<code>${link}</code>\n\n` +
      `Referidos: <b>${user.referrals_count}</b>\n` +
      `Bonus por referidos: <b>${user.referral_balls_claimed}/2</b>\n\n${next}\n\n` +
      `Solo cuenta cuando tu invitado completa el onboarding (elige su inicial).`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("⬅️ Volver", "menu:back"),
    },
  );
});
