import { Composer } from "grammy";
import type { MyContext } from "../core/context.ts";
import { onboardingComposer } from "../features/private/onboarding/index.ts";
import { profileComposer } from "../features/private/profile/index.ts";
import { referralsComposer } from "../features/private/referrals/index.ts";
import { shopComposer } from "../features/private/shop/index.ts";
import { collectionComposer } from "../features/private/collection/index.ts";
import { adminComposer } from "../features/admin/index.ts";

/** Private-chat composer: onboarding, profile, referrals, shop, collection, admin. */
export const privateComposer = new Composer<MyContext>();
privateComposer.use(onboardingComposer);
privateComposer.use(profileComposer);
privateComposer.use(referralsComposer);
privateComposer.use(shopComposer);
privateComposer.use(collectionComposer);
privateComposer.use(adminComposer);
