import { eq, type SupabaseRest } from "./client.ts";
import type {
  PkmPayment,
  PkmReferral,
  PkmShopItem,
  PkmSticker,
  PkmUser,
  PkmUserPokemon,
} from "./types.ts";

// --- Users ---
export async function getUser(
  db: SupabaseRest,
  telegramId: number,
): Promise<PkmUser | null> {
  return db.selectOne<PkmUser>("pkm_users", `select=*&${eq("telegram_id", telegramId)}`);
}

export async function createUser(
  db: SupabaseRest,
  user: Omit<PkmUser, "created_at" | "updated_at">,
): Promise<PkmUser> {
  return db.insert<PkmUser>("pkm_users", user as unknown as Record<string, unknown>);
}

export async function updateUser(
  db: SupabaseRest,
  telegramId: number,
  patch: Partial<PkmUser>,
): Promise<void> {
  await db.update("pkm_users", eq("telegram_id", telegramId), patch as Record<string, unknown>);
}

// --- User Pokémon ---
export async function listUserPokemon(
  db: SupabaseRest,
  ownerId: number,
): Promise<PkmUserPokemon[]> {
  return db.select<PkmUserPokemon>(
    "pkm_user_pokemon",
    `select=*&${eq("owner_id", ownerId)}&order=created_at.asc`,
  );
}

export async function addUserPokemon(
  db: SupabaseRest,
  row: Omit<PkmUserPokemon, "id" | "created_at">,
): Promise<PkmUserPokemon> {
  return db.insert<PkmUserPokemon>("pkm_user_pokemon", row as unknown as Record<string, unknown>);
}

// --- Stickers ---
export async function getSticker(
  db: SupabaseRest,
  entityKey: string,
): Promise<PkmSticker | null> {
  return db.selectOne<PkmSticker>(
    "pkm_stickers",
    `select=*&${eq("entity_key", entityKey)}&${eq("active", true)}`,
  );
}

// --- Shop ---
export async function listShopItems(db: SupabaseRest): Promise<PkmShopItem[]> {
  return db.select<PkmShopItem>(
    "pkm_shop_items",
    "select=*&active=eq.true&order=sort_order.asc",
  );
}

export async function getShopItem(
  db: SupabaseRest,
  id: string,
): Promise<PkmShopItem | null> {
  return db.selectOne<PkmShopItem>(
    "pkm_shop_items",
    `select=*&${eq("id", id)}&${eq("active", true)}`,
  );
}

// --- Referrals ---
export async function getReferralByReferred(
  db: SupabaseRest,
  referredId: number,
): Promise<PkmReferral | null> {
  return db.selectOne<PkmReferral>(
    "pkm_referrals",
    `select=*&${eq("referred_id", referredId)}`,
  );
}

export async function createReferral(
  db: SupabaseRest,
  referrerId: number,
  referredId: number,
): Promise<PkmReferral> {
  return db.insert<PkmReferral>("pkm_referrals", {
    referrer_id: referrerId,
    referred_id: referredId,
    rewarded: true,
  });
}

// --- Payments ---
export async function createPayment(
  db: SupabaseRest,
  row: Omit<PkmPayment, "id" | "created_at">,
): Promise<PkmPayment> {
  return db.insert<PkmPayment>("pkm_payments", row as unknown as Record<string, unknown>);
}
