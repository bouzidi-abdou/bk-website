import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `$${n.toFixed(2)}`;
}

/** Client + server safe public values */
export const SITE_LOGO_URL =
  process.env.NEXT_PUBLIC_SITE_LOGO_URL ??
  "https://c.top4top.io/p_3891uufxn1.png";

/** Official BK MARKET Discord community */
export const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE ?? "https://discord.gg/duvCmjDkBJ";

export function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}`;
}

export const CATEGORIES: Record<
  string,
  { ar: string; en: string; icon: string; tint: string }
> = {
  nitro: { ar: "نيترو وديسكورد", en: "Discord & Nitro", icon: "Zap", tint: "violet" },
  cards: { ar: "بطاقات وفيزات", en: "Cards & Gift Cards", icon: "CreditCard", tint: "slate" },
  subs: { ar: "اشتراكات بريميوم", en: "Premium Subscriptions", icon: "Crown", tint: "rose" },
  aged: { ar: "حسابات قديمة", en: "Aged Accounts", icon: "History", tint: "amber" },
  dev: { ar: "برمجة وتطوير", en: "Development", icon: "Code2", tint: "blue" },
  design: { ar: "تصميم وإبداع", en: "Design & Creative", icon: "Palette", tint: "emerald" },
};

export const TINTS: Record<
  string,
  { tile: string; glow: string; text: string; wash: string; solid: string }
> = {
  violet: {
    tile: "from-violet-500/15 to-indigo-500/10 text-violet-600 dark:text-violet-400",
    glow: "group-hover:shadow-violet-500/20",
    text: "text-violet-600 dark:text-violet-400",
    wash: "bg-violet-500/[0.07]",
    solid: "bg-violet-500",
  },
  slate: {
    tile: "from-slate-500/15 to-neutral-500/10 text-slate-600 dark:text-slate-300",
    glow: "group-hover:shadow-slate-500/20",
    text: "text-slate-600 dark:text-slate-300",
    wash: "bg-slate-500/[0.08]",
    solid: "bg-slate-500",
  },
  rose: {
    tile: "from-rose-500/15 to-red-500/10 text-rose-600 dark:text-rose-400",
    glow: "group-hover:shadow-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    wash: "bg-rose-500/[0.07]",
    solid: "bg-rose-500",
  },
  amber: {
    tile: "from-amber-500/15 to-orange-500/10 text-amber-600 dark:text-amber-400",
    glow: "group-hover:shadow-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    wash: "bg-amber-500/[0.08]",
    solid: "bg-amber-500",
  },
  blue: {
    tile: "from-blue-500/15 to-cyan-500/10 text-blue-600 dark:text-blue-400",
    glow: "group-hover:shadow-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    wash: "bg-blue-500/[0.07]",
    solid: "bg-blue-500",
  },
  emerald: {
    tile: "from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
    glow: "group-hover:shadow-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    wash: "bg-emerald-500/[0.07]",
    solid: "bg-emerald-500",
  },
};
