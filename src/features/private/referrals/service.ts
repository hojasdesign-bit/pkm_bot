import type { SupabaseRest } from "../../../infra/supabase/client.ts";
import {
  createReferral,
  getReferralByReferred,
  getUser,
  updateUser,
} from "../../../infra/supabase/repositories.ts";

/**
 * Referral rewards (Fase 1):
 * - 1st referred user who completes onboarding -> +1 Poké Ball
 * - 6th total (1 + 5 more) -> +1 extra Poké Ball
 * - Max 2 extra balls via referrals.
 */
export async function processReferralReward(
  db: SupabaseRest,
  referrerId: number,
  referredId: number,
  notify: (referrerId: number, text: string) => Promise<void>,
): Promise<void> {
  if (referrerId === referredId) return;
  const existing = await getReferralByReferred(db, referredId);
  if (existing) return;

  const referrer = await getUser(db, referrerId);
  if (!referrer) return; // referrer hasn't onboarded yet: no reward

  await createReferral(db, referrerId, referredId);

  const newCount = (referrer.referrals_count ?? 0) + 1;
  let claimed = referrer.referral_balls_claimed ?? 0;
  let ballsToAdd = 0;

  if (newCount === 1 && claimed < 1) {
    ballsToAdd = 1;
    claimed = 1;
  } else if (newCount === 6 && claimed < 2) {
    ballsToAdd = 1;
    claimed = 2;
  }

  const patch: Record<string, unknown> = {
    referrals_count: newCount,
    referral_balls_claimed: claimed,
  };
  if (ballsToAdd > 0) {
    patch.pokeballs = (referrer.pokeballs ?? 0) + ballsToAdd;
  }
  await updateUser(db, referrerId, patch as never);

  if (ballsToAdd > 0) {
    await notify(
      referrerId,
      `🎉 ¡Tu referido completó el onboarding! Has ganado +${ballsToAdd} Poké Ball. Ya tienes ${newCount} referido(s).`,
    ).catch(() => undefined);
  }
}

export function parseReferralPayload(match: unknown): number | null {
  if (typeof match !== "string" || !match) return null;
  const m = match.trim().match(/^ref_(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isFinite(id) ? id : null;
}

export function buildReferralLink(botUsername: string, userId: number): string {
  return `https://t.me/${botUsername}?start=ref_${userId}`;
}
