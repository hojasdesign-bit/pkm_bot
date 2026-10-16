import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../../../core/context.ts";
import { getBotUsername } from "../../../config/env.ts";
import {
  addUserPokemon,
  createUser,
  getUser,
  listUserPokemon,
} from "../../../infra/supabase/repositories.ts";
import {
  findStarter,
  generationForUser,
  startersForGeneration,
} from "../../../data/starters.ts";
import { sendStickerForKey } from "../../shared/stickers/service.ts";
import {
  buildReferralLink,
  parseReferralPayload,
  processReferralReward,
} from "../referrals/service.ts";

export const onboardingComposer = new Composer<MyContext>();

function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("📊 Estadísticas", "menu:stats")
    .text("🛒 Tienda", "menu:shop")
    .row()
    .text("👥 Referidos", "menu:referrals")
    .text("🎒 Colección", "menu:collection");
}

export async function showMainMenu(ctx: MyContext, firstName: string): Promise<void> {
  await sendStickerForKey(ctx, "oak_return");
  await ctx.reply(
    `¡Bienvenido de nuevo, <b>${escapeHtml(firstName)}</b>! Soy el Profesor Oak.\n\n¿Qué quieres hacer?`,
    { parse_mode: "HTML", reply_markup: mainMenuKeyboard() },
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

onboardingComposer.command("start", async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  const existing = await getUser(ctx.db, from.id);
  if (existing) {
    await showMainMenu(ctx, from.first_name);
    return;
  }

  // New user: deterministic generation, never recalculated later.
  const generation = generationForUser(from.id);
  const starters = startersForGeneration(generation);
  const referrerId = parseReferralPayload(ctx.match);
  const safeRef = referrerId && referrerId !== from.id ? referrerId : 0;

  await sendStickerForKey(ctx, "oak_welcome");
  await ctx.reply(
    `¡Hola, <b>${escapeHtml(from.first_name)}</b>! Soy el <b>Profesor Oak</b>.\n\n` +
      `Bienvenido al mundo Pokémon. Tu generación es la <b>Gen ${generation}</b> — siempre será la misma.\n\n` +
      `Elige a tu compañero inicial:`,
    { parse_mode: "HTML" },
  );

  for (const starter of starters) {
    await sendStickerForKey(ctx, starter.id);
    await ctx.reply(
      `<b>${starter.name}</b> (#${starter.dex})\n` +
        `Tipo: ${starter.types}\n${starter.description}`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text(
          `Elegir a ${starter.name}`,
          `starter:${starter.id}:${safeRef}`,
        ),
      },
    );
  }
});

onboardingComposer.callbackQuery(/^starter:([a-z]+):(\d+)$/, async (ctx) => {
  const from = ctx.from;
  if (!from) return;
  const [, starterId, refRaw] = ctx.match as unknown as [string, string, string];
  const referrerId = Number(refRaw);

  // Already onboarded -> no re-choice.
  const existing = await getUser(ctx.db, from.id);
  if (existing) {
    await ctx.answerCallbackQuery({ text: "Ya tienes tu inicial." });
    return;
  }

  const generation = generationForUser(from.id);
  const starters = startersForGeneration(generation);
  const starter = starters.find((s) => s.id === starterId) ?? findStarter(starterId);
  if (!starter || !starters.some((s) => s.id === starterId)) {
    await ctx.answerCallbackQuery({ text: "Ese inicial no es de tu generación." });
    return;
  }

  await createUser(ctx.db, {
    telegram_id: from.id,
    username: from.username ?? null,
    first_name: from.first_name,
    generation,
    starter_id: starter.id,
    pokeballs: 2,
    super_balls: 0,
    ultra_balls: 0,
    potions: 0,
    revives: 0,
    coins: 0,
    referred_by: referrerId > 0 ? referrerId : null,
    referrals_count: 0,
    referral_balls_claimed: 0,
  });

  await addUserPokemon(ctx.db, {
    owner_id: from.id,
    pokemon_id: starter.id,
    pokemon_name: starter.name,
    level: 5,
    xp: 0,
    is_starter: true,
  });

  // Referral: only counts now that onboarding is complete.
  if (referrerId > 0 && referrerId !== from.id) {
    await processReferralReward(ctx.db, referrerId, from.id, async (to, text) => {
      await ctx.api.sendMessage(to, text).catch(() => undefined);
    });
  }

  await ctx.answerCallbackQuery({ text: `¡${starter.name} es tu compañero!` });
  await sendStickerForKey(ctx, starter.id);
  await ctx.reply(
    `¡Excelente! <b>${starter.name}</b> es ahora tu compañero inicial (Nv. 5).\n\n` +
      `Te he dado <b>2 Poké Balls</b> para empezar. ¡Ve a atrapar Pokémon!`,
    { parse_mode: "HTML", reply_markup: mainMenuKeyboard() },
  );
});

onboardingComposer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showMainMenu(ctx, ctx.from?.first_name ?? "Entrenador");
});

onboardingComposer.callbackQuery("menu:back", async (ctx) => {
  await ctx.answerCallbackQuery();
  await showMainMenu(ctx, ctx.from?.first_name ?? "Entrenador");
});

export { buildReferralLink, getBotUsername };
export { listUserPokemon };
