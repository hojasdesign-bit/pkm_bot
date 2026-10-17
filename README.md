# pkm-bot — Bot de Pokémon para Telegram (Fase 1)

Bot de captura y batallas (Fase 1 = onboarding + referidos + regreso + tienda Stars).
Stack: **Cloudflare Workers + Grammy + Supabase**. Sin Deno, sin Cloudflare KV, sin Deno KV.

## Fase 1 — Alcance

- **Onboarding en privado con el Profesor Oak:** sticker + texto + botones inline. Nombre = nombre de Telegram (nunca se pregunta).
- **Generación determinista:** `generation = (telegram_id % 9) + 1`, guardada en el primer `/start`, nunca recalculada. El usuario elige 1 de los 3 iniciales de su generación. Sin shiny. Al elegir: inicial Nv. 5 + 2 Poké Balls. No se puede cambiar después.
  - Gen 1: Bulbasaur / Charmander / Squirtle
  - Gen 2: Chikorita / Cyndaquil / Totodile
  - Gen 3: Treecko / Torchic / Mudkip
  - Gen 4: Turtwig / Chimchar / Piplup
  - Gen 5: Snivy / Tepig / Oshawott
  - Gen 6: Chespin / Fennekin / Froakie
  - Gen 7: Rowlet / Litten / Popplio
  - Gen 8: Grookey / Scorbunny / Sobble
  - Gen 9: Sprigatito / Fuecoco / Quaxly
- **Referidos:** enlace `t.me/<bot>?start=ref_<id>`. Solo cuenta cuando el invitado completa el onboarding (elige inicial). Sin auto-referido ni duplicados. Hito 1: 1 referido = +1 Poké Ball. Hito 2: 6 en total = +1 Poké Ball extra. Máximo 2 extras por referidos. Se notifica al referidor.
- **Retorno:** `/start` de usuario existente → sticker Oak + menú: Estadísticas, Tienda, Referidos, Colección.
- **Estadísticas:** inicial + nivel, Poké Balls / Super / Ultra, pociones, revivir, referidos, fecha de inicio.
- **Tienda SOLO Stars (TON fuera en Fase 1):** catálogo en Supabase. Pago con factura nativa de Telegram (`sendInvoice`, `pre_checkout_query`, `successful_payment`). Al pagar, acredita los ítems.
- **Stickers:** tabla `pkm_stickers` (`entity_type` professor/pokemon/item, `entity_key`, `file_id`). Telegram guarda el archivo, Supabase solo el `file_id`. Placeholders reales que SÍ se envían, nunca vacío. Reemplaza `file_id` en Supabase para usar stickers reales.
- **Grupo (Fase 1):** el router existe pero solo avisa que las funciones de grupo llegan en Fase 2. Sin capturar ni batallar. Sin datos privados en grupo.
- **Admin:** `/add` y `/init` son stubs documentados en Fase 1 (los datos se editan en Supabase).

Captura y batallas llegan en Fase 2 / 3. No están implementadas en Fase 1.

## Arquitectura

Segmentada PV vs Grupo. Handlers finos, lógica en servicios, nunca SQL en handlers.

```
src/
  index.ts                 # Worker entry: export default { fetch }
  bot.ts                   # createBot(env): env+DB middleware, pagos globales, router PV/Grupo
  config/env.ts            # Env validado (BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ...)
  core/                    # context, errors
  routes/
    private.ts             # Composer PV
    group.ts               # Composer Grupo
  features/
    private/
      onboarding/          # /start, elegir inicial
      profile/             # estadísticas
      referrals/           # enlace + progreso (service: hitos)
      shop/                # catálogo + Stars (invoice, pre-checkout, successful_payment)
      collection/          # colección
    group/                 # aviso Fase 2
    shared/stickers/       # resolve + envío sticker (placeholder si file_id = PLACEHOLDER_*)
    admin/                 # /add, /init stubs
  infra/supabase/          # client (fetch REST), repositories, types
  data/starters.ts         # 27 iniciales
  assets/placeholder.webp  # sticker placeholder real (reconstruir desde .base64, ver abajo)
  assets/placeholder.webp.base64  # base64 del placeholder (la API de subida es solo texto)
```

## Supabase

Proyecto: **pkm** — `https://muewqztrdypwqqipadgj.supabase.co`
(El proyecto anterior `filmalert` / `lbmgxxdfjmdaclkwafwr` se deja como respaldo y ya NO se usa.)

Tablas (prefijo `pkm_`, no chocan con `daily_series`):

- `pkm_users` — telegram_id PK, username, first_name, generation, starter_id, pokeballs, super_balls, ultra_balls, potions, revives, coins, referred_by, referrals_count, referral_balls_claimed, created_at, updated_at. RLS activado + política permisiva MVP.
- `pkm_user_pokemon` — id uuid PK, owner_id, pokemon_id, pokemon_name, level, xp, is_starter.
- `pkm_stickers` — id uuid PK, entity_type, entity_key unique, file_id, is_placeholder, active. Sembrados 36: `oak_welcome`, `oak_return`, `oak_shop`, `oak_stats` + 27 iniciales + `pokeball`, `superball`, `ultraball`, `potion`, `revive`.
- `pkm_shop_items` — id PK, name, description, emoji, quantity, price_stars, item_type, sticker_key, active, sort_order. Sembrados 6: Poké Ball x3 (25 ⭐), Poké Ball x10 (75 ⭐), Super Ball x3 (50 ⭐), Ultra Ball x2 (90 ⭐), Poción x5 (20 ⭐), Revivir x3 (40 ⭐).
- `pkm_referrals` — id uuid PK, referrer_id, referred_id unique, rewarded.
- `pkm_payments` — id uuid PK, user_id, item_id, stars, telegram_payment_charge_id, status.

### Cambiar un sticker real

1. Envía el sticker al bot (o súbelo a Telegram) y copia su `file_id`.
2. En Supabase → Table Editor → `pkm_stickers` → busca `entity_key` (ej. `oak_welcome`) → pega el `file_id` real y pon `is_placeholder = false`.
3. El bot lo usa al instante, sin redeploy.

### Cambiar precios / catálogo

Edita `pkm_shop_items` en Supabase. El bot lee el catálogo en cada apertura de tienda.

## Desarrollo local

```bash
npm install
cp .dev.vars.example .dev.vars   # rellena SIN secretos reales en git
npm run dev                      # wrangler dev
npm run check                    # tsc --noEmit
```

`.dev.vars` está en `.gitignore`. Nunca subas secretos.

## Despliegue en Cloudflare Workers

1. Conecta el repo en Cloudflare Dashboard → Workers → Create → Importa `hojasdesign-bit/pkm_bot`.
   O con CLI: `npx wrangler deploy` (requiere `wrangler login`).
2. Configura secretos (nunca en código ni en `wrangler.toml`):
   ```bash
   wrangler secret put BOT_TOKEN
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   # Opcionales:
   wrangler secret put BOT_USERNAME
   wrangler secret put ADMIN_IDS
   wrangler secret put WEBHOOK_SECRET
   ```
   - `BOT_TOKEN`: token del bot desde @BotFather.
   - `SUPABASE_URL`: `https://muewqztrdypwqqipadgj.supabase.co` (proyecto `pkm`).
   - `SUPABASE_SERVICE_ROLE_KEY`: clave service_role (solo servidor, nunca la publiques).
   - `BOT_USERNAME`: username del bot sin @ (para enlaces de referido). Si no lo pones, usa `pkm_bot`.
   - `ADMIN_IDS`: IDs de Telegram separados por coma para `/add` y `/init`.
   - `WEBHOOK_SECRET`: opcional, secreto para verificar el webhook de Telegram.
3. Despliega: `wrangler deploy`. Anota la URL del Worker, ej. `https://pkm-bot.<subdominio>.workers.dev`.
4. Pon el webhook de Telegram (sustituye `<TOKEN>` y `<WORKER_URL>`):
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WORKER_URL>/&secret_token=<WEBHOOK_SECRET>"
   ```
   Si no usas `WEBHOOK_SECRET`, omite `&secret_token=...`.
5. Verifica: `GET <WORKER_URL>/health` → `ok`. Abre el bot en Telegram y prueba `/start`.

### Reconstruir el placeholder .webp (la subida por API es solo texto)

El archivo `src/assets/placeholder.webp` es binario y no se pudo subir por la API de GitHub (solo texto). En el repo va `src/assets/placeholder.webp.base64`. Para reconstruirlo:

```bash
base64 -d src/assets/placeholder.webp.base64 > src/assets/placeholder.webp
```

Luego súbelo por la web de GitHub (Add file → Upload files) a `src/assets/placeholder.webp`. Hasta entonces, el bot envía el texto siempre; el sticker placeholder se envía cuando el archivo exista en `main`.

## Pendiente del usuario

- Crear el bot en @BotFather y guardar `BOT_TOKEN` como secreto en Cloudflare (nunca en chat).
- Conectar el repo en Cloudflare Workers y desplegar.
- Configurar el webhook como arriba.
- Reemplazar los 36 `file_id` placeholder en `pkm_stickers` por stickers reales.
