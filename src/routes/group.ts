import { Composer } from "grammy";
import type { MyContext } from "../core/context.ts";
import { groupComposer as groupFeature } from "../features/group/index.ts";

/** Group composer (Fase 1: only the Fase-2 notice). */
export const groupComposer = new Composer<MyContext>();
groupComposer.use(groupFeature);
