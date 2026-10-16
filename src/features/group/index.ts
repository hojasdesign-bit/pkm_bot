import { Composer } from "grammy";
import type { MyContext } from "../../core/context.ts";

/**
 * Group — Fase 1: router exists, but group features arrive in Fase 2.
 * No capture, no battles, no private data leaked in groups.
 * Only /start gets a short notice; other group messages are ignored.
 */
export const groupComposer = new Composer<MyContext>();

groupComposer.command("start", async (ctx) => {
  await ctx.reply(
    "👋 ¡Hola! Las funciones de grupo (apariciones, capturas y batallas) llegan en la Fase 2.\n\n" +
      "Por ahora, abre el chat privado del bot con /start para elegir tu inicial.",
  );
});
