import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { ArrowLeftRight } from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { trackVisit } from "@/lib/track";
import { env } from "@/lib/env";
import { dbSafe } from "@/lib/safe";
import CurrencyConverter from "@/components/currency-converter";
import { CURRENCIES, FALLBACK_RATES, formatMoney } from "@/lib/currency";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مركز الصرف — BK MARKET",
  description:
    "حوّل بين العملات بأسعار صرف حيّة: دولار، يورو، دينار جزائري وتونسي وليبي، درهم، ريال والمزيد — واحسب تكلفة منتجات BK MARKET بعملتك المحلية.",
};

async function getRates(): Promise<{
  rates: Record<string, number>;
  updated: string | null;
  live: boolean;
}> {
  try {
    const res = await fetch(env.EXCHANGE_API_URL, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("rates failed");
    const json = (await res.json()) as {
      rates?: Record<string, number>;
      time_last_update_utc?: string;
    };
    if (!json?.rates) throw new Error("no rates");
    const rates: Record<string, number> = { USD: 1, USDT: 1.001 };
    for (const c of CURRENCIES) {
      if (c.code === "USD" || c.code === "USDT") continue;
      rates[c.code] = json.rates[c.code] ?? FALLBACK_RATES[c.code];
    }
    return {
      rates,
      updated: json.time_last_update_utc ?? null,
      live: true,
    };
  } catch {
    return { rates: { ...FALLBACK_RATES }, updated: null, live: false };
  }
}

export default async function ExchangePage() {
  const [{ rates, updated, live }, { data: topProducts }] = await Promise.all([
    getRates(),
    dbSafe(
      () =>
        db
          .select({
            id: products.id,
            slug: products.slug,
            name: products.name,
            price: products.price,
            icon: products.icon,
            tint: products.tint,
          })
          .from(products)
          .orderBy(desc(products.sales))
          .limit(6),
      [] as {
        id: string;
        slug: string;
        name: string;
        price: string;
        icon: string;
        tint: string;
      }[]
    ),
    trackVisit("/exchange"),
  ]);

  const rateItems = CURRENCIES.filter((c) =>
    ["EUR", "DZD", "TND", "SAR"].includes(c.code)
  );

  return (
    <>
      <section className="relative overflow-hidden pb-14 pt-44 md:pt-52">
        <div className="absolute inset-0 -z-10">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_65%_65%_at_50%_0%,black,transparent)]" />
          <div className="absolute -top-24 start-[20%] size-[360px] rounded-full bg-accent/10 blur-[80px]" />
          <div className="absolute top-10 end-[8%] size-[280px] rounded-full bg-emerald-400/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-4 py-1.5 text-[11px] font-black text-neutral-500 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            BK MARKET EXCHANGE
          </span>
          <h1 className="mt-5 text-4xl font-black md:text-6xl">
            مركز{" "}
            <span className="shine-text font-display tracking-tight">الصرف</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-neutral-500 dark:text-neutral-400">
            حوّل بين أكثر من 15 عملة بأسعار صرف محدّثة — من الدولار إلى الدينار
            الجزائري والتونسي والدرهم المغربي وغيرها — واحسب تكلفة طلبك القادم
            بعملتك خلال ثوانٍ.
          </p>
        </div>

        <div className="mt-10 border-y border-neutral-200/70 bg-white dark:border-white/[0.06] dark:bg-neutral-900/40">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-px bg-neutral-200/70 dark:bg-white/[0.06] sm:grid-cols-4">
            {rateItems.map((c) => (
              <div
                key={c.code}
                className="bg-white px-3 py-3 text-center dark:bg-neutral-900"
              >
                <p className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-neutral-400">
                  USD <ArrowLeftRight className="size-2.5" /> {c.code}
                </p>
                <p className="font-display mt-1 text-xs font-bold">
                  {formatMoney(rates[c.code] ?? 0, (rates[c.code] ?? 0) < 1 ? 4 : 2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-28 sm:px-6">
        <CurrencyConverter
          rates={rates}
          updated={updated}
          live={live}
          products={topProducts.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            icon: p.icon,
            tint: p.tint,
            price: Number(p.price),
          }))}
        />
      </section>
    </>
  );
}
