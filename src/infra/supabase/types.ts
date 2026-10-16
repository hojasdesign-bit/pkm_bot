export interface PkmUser {
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  generation: number;
  starter_id: string | null;
  pokeballs: number;
  super_balls: number;
  ultra_balls: number;
  potions: number;
  revives: number;
  coins: number;
  referred_by: number | null;
  referrals_count: number;
  referral_balls_claimed: number;
  created_at: string;
  updated_at: string;
}

export interface PkmUserPokemon {
  id: string;
  owner_id: number;
  pokemon_id: string;
  pokemon_name: string;
  level: number;
  xp: number;
  is_starter: boolean;
  created_at: string;
}

export interface PkmSticker {
  id: string;
  entity_type: string;
  entity_key: string;
  file_id: string;
  is_placeholder: boolean;
  active: boolean;
}

export interface PkmShopItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  quantity: number;
  price_stars: number;
  item_type: string;
  sticker_key: string;
  active: boolean;
  sort_order: number;
}

export interface PkmReferral {
  id: string;
  referrer_id: number;
  referred_id: number;
  rewarded: boolean;
  created_at: string;
}

export interface PkmPayment {
  id: string;
  user_id: number;
  item_id: string;
  stars: number;
  telegram_payment_charge_id: string | null;
  status: string;
  created_at: string;
}
