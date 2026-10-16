import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../../../core/context.ts";
import { getUser, listUserPokemon } from "../../../infra/supabase/repositories.ts";
import { sendStickerForKey } from "../../shared/stickers/service.ts";

export const collectionComposer = new Composer<MyContext>();

collectionComposer.callbackQuery("menu:collection", async (ctx) => {
  await ctx.answerCallbackQuery();
  const from = ctx.from;
  if (!from) return;
  const user = await getUser(ctx.db, from.id);
  if (!user) {
    await ctx.reply("Usa /start para empezar tu aventura.");
    return;
  }
  const mons = await listUserPokemon(ctx.db, from.id);
  if (mons.length === 0) {
    await ctx.reply("Aún no tienes Pokémon. Usa /start para elegir tu inicial.");
    return;
  }
  await ctx.reply(`🎒 <b>Tu colección (${mons.length})</b>`, { parse_mode: "HTML" });
  for (const mon of mons) {
    await sendStickerForKey(ctx, mon.pokemon_id);
    await ctx.reply(
      `<b>${escapeHtml(mon.pokemon_name)}</b> — Nv. ${mon.level}${mon.is_starter ? " ⭐ Inicial" : ""}`,
      { parse_mode: "HTML" },
    );
  }
  await ctx.reply("Fin de la colección.", {
    reply_markup: new InlineKeyboard().text("⬅️ Volver", "menu:back"),
  });
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
