export interface Env {
  BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BOT_USERNAME?: string;
  ADMIN_IDS?: string;
  WEBHOOK_SECRET?: string;
}

export function validateEnv(raw: unknown): Env {
  const env = raw as Partial<Env>;
  const missing: string[] = [];
  if (!env.BOT_TOKEN) missing.push("BOT_TOKEN");
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  return {
    BOT_TOKEN: env.BOT_TOKEN as string,
    SUPABASE_URL: (env.SUPABASE_URL as string).replace(/\/$/, ""),
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY as string,
    BOT_USERNAME: env.BOT_USERNAME,
    ADMIN_IDS: env.ADMIN_IDS,
    WEBHOOK_SECRET: env.WEBHOOK_SECRET,
  };
}

export function getAdminIds(env: Env): number[] {
  if (!env.ADMIN_IDS) return [];
  return env.ADMIN_IDS.split(/[,\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
}

export function getBotUsername(env: Env): string {
  return (env.BOT_USERNAME ?? "").trim() || "pkm_bot";
}

export function isAdmin(env: Env, userId?: number): boolean {
  if (!userId) return false;
  return getAdminIds(env).includes(userId);
}
