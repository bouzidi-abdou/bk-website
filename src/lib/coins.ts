/** BK COIN economy — 100 BK COIN = 1 USD */
export const COINS_PER_USD = 100;

/** USD amount → whole BK COIN */
export function usdToCoins(usd: number): number {
  return Math.round(usd * COINS_PER_USD);
}

/** BK COIN → USD value */
export function coinsToUsd(coins: number): number {
  return coins / COINS_PER_USD;
}

/** 1,250 → "1,250" */
export function formatCoins(coins: number | string): string {
  const n = typeof coins === "string" ? Number(coins) : coins;
  return new Intl.NumberFormat("en-US").format(Math.round(n || 0));
}

/** Verification subscription */
export const VERIFY_PRICE_USD = 0.99;
export const VERIFY_PRICE_COINS = usdToCoins(VERIFY_PRICE_USD); // 99
export const VERIFY_DAYS = 30;

/** Accent colours a member can pick for their profile */
export const ACCENTS: Record<
  string,
  { label: string; bg: string; text: string; ring: string; grad: string }
> = {
  violet: {
    label: "بنفسجي",
    bg: "bg-violet-500",
    text: "text-violet-500",
    ring: "ring-violet-500/40",
    grad: "from-violet-500/25 to-indigo-500/10",
  },
  blue: {
    label: "أزرق",
    bg: "bg-blue-500",
    text: "text-blue-500",
    ring: "ring-blue-500/40",
    grad: "from-blue-500/25 to-cyan-500/10",
  },
  emerald: {
    label: "أخضر",
    bg: "bg-emerald-500",
    text: "text-emerald-500",
    ring: "ring-emerald-500/40",
    grad: "from-emerald-500/25 to-teal-500/10",
  },
  amber: {
    label: "ذهبي",
    bg: "bg-amber-500",
    text: "text-amber-500",
    ring: "ring-amber-500/40",
    grad: "from-amber-500/25 to-orange-500/10",
  },
  rose: {
    label: "وردي",
    bg: "bg-rose-500",
    text: "text-rose-500",
    ring: "ring-rose-500/40",
    grad: "from-rose-500/25 to-pink-500/10",
  },
  slate: {
    label: "فضي",
    bg: "bg-slate-500",
    text: "text-slate-400",
    ring: "ring-slate-400/40",
    grad: "from-slate-500/25 to-neutral-500/10",
  },
};

export function accent(key: string) {
  return ACCENTS[key] ?? ACCENTS.violet;
}
