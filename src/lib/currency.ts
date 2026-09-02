export type Currency = {
  code: string;
  name: string;
  symbol: string;
  tint: string;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", name: "دولار أمريكي", symbol: "$", tint: "emerald" },
  { code: "USDT", name: "تيثر — كريبتو", symbol: "₮", tint: "emerald" },
  { code: "EUR", name: "يورو أوروبي", symbol: "€", tint: "blue" },
  { code: "GBP", name: "جنيه إسترليني", symbol: "£", tint: "violet" },
  { code: "DZD", name: "دينار جزائري", symbol: "دج", tint: "emerald" },
  { code: "TND", name: "دينار تونسي", symbol: "دت", tint: "rose" },
  { code: "MAD", name: "درهم مغربي", symbol: "دم", tint: "rose" },
  { code: "LYD", name: "دينار ليبي", symbol: "دل", tint: "amber" },
  { code: "EGP", name: "جنيه مصري", symbol: "ج.م", tint: "amber" },
  { code: "SAR", name: "ريال سعودي", symbol: "ر.س", tint: "emerald" },
  { code: "AED", name: "درهم إماراتي", symbol: "د.إ", tint: "blue" },
  { code: "QAR", name: "ريال قطري", symbol: "ر.ق", tint: "violet" },
  { code: "KWD", name: "دينار كويتي", symbol: "د.ك", tint: "emerald" },
  { code: "JOD", name: "دينار أردني", symbol: "د.أ", tint: "slate" },
  { code: "IQD", name: "دينار عراقي", symbol: "د.ع", tint: "slate" },
  { code: "TRY", name: "ليرة تركية", symbol: "₺", tint: "rose" },
];

/** استرشادية — تُستخدم إن تعذّر جلب الأسعار الحية */
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  USDT: 1.001,
  EUR: 0.92,
  GBP: 0.79,
  DZD: 134.5,
  TND: 3.16,
  MAD: 10.05,
  LYD: 4.85,
  EGP: 48.4,
  SAR: 3.75,
  AED: 3.6725,
  QAR: 3.64,
  KWD: 0.308,
  JOD: 0.709,
  IQD: 1310,
  TRY: 34.4,
};

export function getCurrency(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function formatMoney(value: number, digits?: number) {
  const d =
    digits ?? (value !== 0 && Math.abs(value) < 1 ? 4 : Math.abs(value) < 100 ? 2 : 2);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(value);
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  return `قبل ${Math.floor(hours / 24)} يوم`;
}
