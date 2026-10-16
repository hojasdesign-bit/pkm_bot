import { Composer, InlineKeyboard } from "grammy";
import type { MyContext } from "../../../core/context.ts";
import {
  createPayment,
  getShopItem,
  getUser,
  listShopItems,
  updateUser,
} from "../../../infra/supabase/repositories.ts";
import { sendStickerForKey } from "../../shared/stickers/service.ts";

/**
 * Shop — Fase 1: ONLY Stars (TON is out for now).
 * Invoice via Telegram Stars (currency XTR, empty provider token).
 */
export const shopComposer = new Composer<MyContext>();

shopComposer.callbackQuery("menu:shop", async (ctx) => {
  await ctx.answerCallbackQuery();
  const items = await listShopItems(ctx.db);
  if (items.length === 0) {
    await ctx.reply("La tienda está vacía por ahora.");
    return;
  }
  await sendStickerForKey(ctx, "oak_shop");
  await ctx.reply("🛒 <b>Tienda</b> — paga con Stars ⭐", { parse_mode: "HTML" });
  for (const item of items) {
    await sendStickerForKey(ctx, item.sticker_key);
    await ctx.reply(
      `${item.emoji} <b>${escapeHtml(item.name)}</b>\n${escapeHtml(item.description)}\nPrecio: <b>${item.price_stars} ⭐</b>`,
      {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().text(
          `Comprar — ${item.price_stars} ⭐`,
          `buy:${item.id}`,
        ),
      },
    );
  }
  await ctx.reply("Elige un producto para comprar con Stars.", {
    reply_markup: new InlineKeyboard().text("⬅️ Volver", "menu:back"),
  });
});

shopComposer.callbackQuery(/^buy:(.+)$/, async (ctx) => {
  const itemId = (ctx.match as unknown as [string, string])[1];
  const from = ctx.from;
  if (!from) return;
  const item = await getShopItem(ctx.db, itemId);
  if (!item) {
    await ctx.answerCallbackQuery({ text: "Producto no disponible." });
    return;
  }
  await ctx.answerCallbackQuery();
  const payload = `shop:${item.id}:${from.id}`;
  // Stars: currency XTR, provider_token empty (in `other`).
  await ctx.api.sendInvoice(
    from.id,
    item.name,
    item.description,
    payload,
    "XTR",
    [{ label: item.name, amount: item.price_stars }],
    { provider_token: "" },
  );
});

/** Global handlers: pre_checkout has no chat, so register at bot level. */
export async function handlePreCheckout(ctx: MyContext): Promise<void> {
  const query = ctx.preCheckoutQuery;
  if (!query) return;
  const payload = query.invoice_payload ?? "";
  const parts = payload.split(":");
  const ok = parts[0] === "shop" && parts.length === 3;
  if (!ok) {
    await ctx.answerPreCheckoutQuery(false, "Pago no válido.");
    return;
  }
  const item = await getShopItem(ctx.db, parts[1]!);
  if (!item) {
    await ctx.answerPreCheckoutQuery(false, "Producto no disponible.");
    return;
  }
  await ctx.answerPreCheckoutQuery(true);
}

export async function handleSuccessfulPayment(ctx: MyContext): Promise<void> {
  const payment = ctx.message?.successful_payment;
  if (!payment || !ctx.from) return;
  const parts = (payment.invoice_payload ?? "").split(":");
  if (parts[0] !== "shop" || parts.length !== 3) return;
  const [, itemId, userIdRaw] = parts;
  const userId = Number(userIdRaw);
  if (userId !== ctx.from.id) return; // prevent spoofing

  const item = await getShopItem(ctx.db, itemId!);
  if (!item) return;
  const user = await getUser(ctx.db, userId);
  if (!user) return;

  // Credit items.
  const patch: Record<string, number> = {};
  switch (item.item_type) {
    case "pokeball":
      patch.pokeballs = user.pokeballs + item.quantity;
      break;
    case "superball":
      patch.super_balls = user.super_balls + item.quantity;
      break;
    case "ultraball":
      patch.ultra_balls = user.ultra_balls + item.quantity;
      break;
    case "potion":
      patch.potions = user.potions + item.quantity;
      break;
    case "revive":
      patch.revives = user.revives + item.quantity;
      break;
    default:
      patch.pokeballs = user.pokeballs + item.quantity;
  }
  await updateUser(ctx.db, userId, patch as never);
  await createPayment(ctx.db, {
    user_id: userId,
    item_id: item.id,
    stars: payment.total_amount,
    telegram_payment_charge_id: payment.telegram_payment_charge_id ?? null,
    status: "completed",
  });

  await sendStickerForKey(ctx, item.sticker_key);
  await ctx.reply(
    `✅ ¡Compra completada! Recibiste <b>${escapeHtml(item.name)}</b> por ${payment.total_amount} ⭐.`,
    { parse_mode: "HTML" },
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
