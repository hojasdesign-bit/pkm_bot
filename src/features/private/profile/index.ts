import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../../../core/context.ts";
import { getUser, listUserPokemon } from "../../../infra/supabase/repositories.ts";
import { sendStickerForKey } from "../../shared/stickers/service.ts";

export const profileComposer = new Composer<MyContext>();

profileComposer.callbackQuery("menu:stats", async (ctx) => {
  await ctx.answerCallbackQuery();
  const from = ctx.from;
  if (!from) return;
  const user = await getUser(ctx.db, from.id);
  if (!user) {
    await ctx.reply("Usa /start para empezar tu aventura.");
    return;
  }
  const mons = await listUserPokemon(ctx.db, from.id);
  const starter = mons.find((m) => m.is_starter) ?? mons[0];
  const started = user.created_at ? new Date(user.created_at).toLocaleDateString("es-ES") : "—";

  await sendStickerForKey(ctx, "oak_stats");
  await ctx.reply(
    `📊 <b>Estadísticas de ${escapeHtml(from.first_name)}</b>\n\n` +
      `🧬 Generación: Gen ${user.generation}\n` +
      `⭐ Inicial: ${starter ? `${starter.pokemon_name} (Nv. ${starter.level})` : "—"}\n` +
      `🔴 Poké Balls: ${user.pokeballs}\n` +
      `🟡 Super Balls: ${user.super_balls}\n` +
      `⚫ Ultra Balls: ${user.ultra_balls}\n` +
      `🧪 Pociones: ${user.potions}\n` +
      `💊 Revivir: ${user.revives}\n` +
      `👥 Referidos: ${user.referrals_count} (bonus: ${user.referral_balls_claimed}/2)\n` +
      `🎒 Pokémon: ${mons.length}\n` +
      `📅 Inicio: ${started}`,
    {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().text("⬅️ Volver", "menu:back"),
    },
  );
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
