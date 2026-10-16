import { Composer } from "grammy";
import type { MyContext } from "../../core/context.ts";
import { isAdmin } from "../../config/env.ts";

/**
 * Admin — Fase 1 stubs (documented).
 * Stickers and shop are edited directly in Supabase:
 * - Stickers: table pkm_stickers (entity_key -> file_id)
 * - Shop: table pkm_shop_items
 * /add and /init exist as commands so the interface is stable,
 * but they do not write data in Fase 1.
 */
export const adminComposer = new Composer<MyContext>();

adminComposer.command("add", async (ctx) => {
  if (!isAdmin(ctx.env, ctx.from?.id)) return;
  await ctx.reply(
    "En Fase 1 los stickers se agregan en Supabase.\n\n" +
      "Tabla pkm_stickers: inserta una fila con entity_type, entity_key y file_id. " +
      "El bot lo usa al instante, sin redeploy.",
  );
});

adminComposer.command("init", async (ctx) => {
  if (!isAdmin(ctx.env, ctx.from?.id)) return;
  await ctx.reply(
    "En Fase 1 no hace falta /init: las tablas pkm_* y los datos iniciales " +
      "(36 stickers placeholder + 6 productos) ya se siembran con la migración de Supabase.",
  );
});
