import type { Context } from "grammy";
import type { Env } from "../config/env.ts";
import type { SupabaseRest } from "../infra/supabase/client.ts";

export type MyContext = Context & {
  env: Env;
  db: SupabaseRest;
};
