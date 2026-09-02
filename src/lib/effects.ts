/**
 * BK MARKET cosmetics catalogue.
 * Every effect is pure CSS (classes live in globals.css) so runtime cost is
 * effectively zero — no canvas, no JS animation loops.
 */

export type Cosmetic = {
  id: string;
  name: string;
  desc: string;
  price: number; // BK COIN
  cls: string;
  tier: "basic" | "premium";
  category: "frame" | "effect";
};

/** Avatar frames */
export const FRAMES: Cosmetic[] = [
  {
    id: "frame-none",
    name: "Default",
    desc: "المظهر الافتراضي بدون إطار",
    price: 0,
    cls: "",
    tier: "basic",
    category: "frame",
  },
  {
    id: "frame-steel",
    name: "Steel",
    desc: "حلقة معدنية رمادية أنيقة",
    price: 150,
    cls: "fx-frame-steel",
    tier: "basic",
    category: "frame",
  },
  {
    id: "frame-gold",
    name: "Gold",
    desc: "إطار ذهبي بلمعة دافئة",
    price: 300,
    cls: "fx-frame-gold",
    tier: "basic",
    category: "frame",
  },
  {
    id: "frame-mint",
    name: "Mint",
    desc: "توهّج أخضر هادئ",
    price: 300,
    cls: "fx-frame-mint",
    tier: "basic",
    category: "frame",
  },
  {
    id: "frame-pulse",
    name: "Pulse",
    desc: "نبض بنفسجي متكرر حول الصورة",
    price: 450,
    cls: "fx-frame-pulse",
    tier: "basic",
    category: "frame",
  },
  {
    id: "frame-orbit",
    name: "Orbit",
    desc: "قوس ضوئي يدور حول صورتك",
    price: 650,
    cls: "fx-frame-orbit",
    tier: "premium",
    category: "frame",
  },
  {
    id: "frame-spectrum",
    name: "Spectrum",
    desc: "حلقة ألوان متدرّجة متحركة",
    price: 800,
    cls: "fx-frame-spectrum",
    tier: "premium",
    category: "frame",
  },
  {
    id: "frame-inferno",
    name: "Inferno",
    desc: "هالة نارية متوهجة تدور",
    price: 1000,
    cls: "fx-frame-inferno",
    tier: "premium",
    category: "frame",
  },
];

/** Banner / profile background effects */
export const EFFECTS: Cosmetic[] = [
  {
    id: "fx-none",
    name: "Clean",
    desc: "خلفية بسيطة بدون تأثير",
    price: 0,
    cls: "",
    tier: "basic",
    category: "effect",
  },
  {
    id: "fx-starlight",
    name: "Starlight",
    desc: "نجوم صغيرة تتلألأ بهدوء",
    price: 250,
    cls: "fx-starlight",
    tier: "basic",
    category: "effect",
  },
  {
    id: "fx-mesh",
    name: "Mesh",
    desc: "شبكة رقمية تنزلق ببطء",
    price: 250,
    cls: "fx-mesh",
    tier: "basic",
    category: "effect",
  },
  {
    id: "fx-sunset",
    name: "Sunset",
    desc: "تدرّج دافئ يتحرك بنعومة",
    price: 400,
    cls: "fx-sunset",
    tier: "basic",
    category: "effect",
  },
  {
    id: "fx-aurora",
    name: "Aurora",
    desc: "موجات شفق ملوّنة",
    price: 550,
    cls: "fx-aurora",
    tier: "premium",
    category: "effect",
  },
  {
    id: "fx-snowfall",
    name: "Snowfall",
    desc: "ندف بيضاء تتساقط بلطف",
    price: 550,
    cls: "fx-snowfall",
    tier: "premium",
    category: "effect",
  },
  {
    id: "fx-embers",
    name: "Embers",
    desc: "شرارات دافئة تصعد للأعلى",
    price: 700,
    cls: "fx-embers",
    tier: "premium",
    category: "effect",
  },
  {
    id: "fx-hologram",
    name: "Hologram",
    desc: "شعاع هولوجرافي يمسح البانر",
    price: 850,
    cls: "fx-hologram",
    tier: "premium",
    category: "effect",
  },
];

export const ALL_COSMETICS = [...FRAMES, ...EFFECTS];

export function getCosmetic(id: string | null | undefined) {
  if (!id) return null;
  return ALL_COSMETICS.find((c) => c.id === id) ?? null;
}

export function cosmeticClass(id: string | null | undefined) {
  return getCosmetic(id)?.cls ?? "";
}

/* ------------------------------- plans ---------------------------------- */

export type PlanId = "free" | "basic" | "premium";

export type Plan = {
  id: PlanId;
  name: string;
  priceCoins: number;
  priceUsd: number;
  days: number;
  badge: boolean;
  color: string;
  perks: string[];
  freeCosmetics: number;
};

export const PLANS: Record<Exclude<PlanId, "free">, Plan> = {
  basic: {
    id: "basic",
    name: "BASIC",
    priceCoins: 99,
    priceUsd: 0.99,
    days: 30,
    badge: true,
    color: "slate",
    perks: [
      "علامة توثيق فضية بجانب اسمك",
      "إطار Steel مجاني لصورتك",
      "خصم 3% دائم على كل مشترياتك",
      "أولوية في الرد على التذاكر",
      "شارة عضو موثّق في الأخبار والملف",
    ],
    freeCosmetics: 1,
  },
  premium: {
    id: "premium",
    name: "PREMIUM",
    priceCoins: 299,
    priceUsd: 2.99,
    days: 30,
    badge: true,
    color: "amber",
    perks: [
      "علامة توثيق ذهبية مميزة",
      "كل الإطارات والتأثيرات مفتوحة مجاناً",
      "خصم 7% دائم على كل مشترياتك",
      "أولوية قصوى في الدعم والتسليم",
      "تأثيرات بانر حصرية للملف الشخصي",
      "ظهور حسابك ضمن الأعضاء المميزين",
    ],
    freeCosmetics: 99,
  },
};

export function planOf(user: {
  plan?: string | null;
  verified?: boolean | null;
  verifiedUntil?: Date | string | null;
}): PlanId {
  const active =
    user.verified &&
    (!user.verifiedUntil || new Date(user.verifiedUntil) > new Date());
  if (!active) return "free";
  return user.plan === "premium" ? "premium" : "basic";
}

export function planDiscount(plan: PlanId): number {
  if (plan === "premium") return 0.07;
  if (plan === "basic") return 0.03;
  return 0;
}
