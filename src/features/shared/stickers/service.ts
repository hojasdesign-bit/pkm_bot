import { InputFile } from "grammy";
import type { MyContext } from "../../../core/context.ts";
import { getSticker } from "../../../infra/supabase/repositories.ts";

/**
 * Placeholder sticker: a small .webp shipped in the repo.
 * Used whenever the Supabase file_id is still PLACEHOLDER_*.
 * The user replaces file_id in pkm_stickers to use real stickers.
 * This guarantees a sticker is ALWAYS sent, never an empty message.
 */
export const PLACEHOLDER_STICKER_URL =
  "https://raw.githubusercontent.com/hojasdesign-bit/pkm_bot/main/src/assets/placeholder.webp";

export function isPlaceholderFileId(fileId: string | null | undefined): boolean {
  if (!fileId) return true;
  return fileId.startsWith("PLACEHOLDER_");
}

export async function resolveStickerFileId(
  ctx: MyContext,
  entityKey: string,
): Promise<string> {
  try {
    const row = await getSticker(ctx.db, entityKey);
    if (row && row.file_id && !isPlaceholderFileId(row.file_id)) {
      return row.file_id;
    }
  } catch {
    // fall through to placeholder
  }
  return `PLACEHOLDER_${entityKey}`;
}

export async function sendStickerForKey(
  ctx: MyContext,
  entityKey: string,
  chatId?: number | string,
): Promise<void> {
  const target = chatId ?? ctx.chat?.id ?? ctx.from?.id;
  if (!target) return;
  const fileId = await resolveStickerFileId(ctx, entityKey);
  try {
    if (isPlaceholderFileId(fileId)) {
      await ctx.api.sendSticker(target, new InputFile(new URL(PLACEHOLDER_STICKER_URL)));
    } else {
      await ctx.api.sendSticker(target, fileId);
    }
  } catch {
    // Last-resort fallback: placeholder URL, never leave the message empty.
    try {
      await ctx.api.sendSticker(target, new InputFile(new URL(PLACEHOLDER_STICKER_URL)));
    } catch {
      // If even the placeholder fails, do nothing (caller still sends text).
    }
  }
}

export async function sendStickerToUser(
  ctx: MyContext,
  userId: number,
  entityKey: string,
): Promise<void> {
  await sendStickerForKey(ctx, entityKey, userId);
}
