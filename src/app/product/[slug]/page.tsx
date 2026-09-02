import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, desc, eq, ne } from "drizzle-orm";
import {
  Check,
  ChevronLeft,
  Headset,
  Layers,
  RotateCcw,
  ShieldCheck,
  Star,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { db } from "@/db";
import { products } from "@/db/schema";
import { trackVisit } from "@/lib/track";
import { dbSafe } from "@/lib/safe";
import DbBanner from "@/components/db-banner";
import BuyFlow from "@/components/buy-flow";
import ProductCard, { type CardProduct } from "@/components/product-card";
import ProductIcon from "@/components/product-icon";
import TiltCard from "@/components/tilt-card";
import Reveal, { RevealItem, RevealStagger } from "@/components/reveal";
import SectionHeading from "@/components/section-heading";
import { TINTS, cn, formatNumber } from "@/lib/utils";
import { getCategoryMap } from "@/lib/categories";

export const dynamic = "force-dynamic";

function serialize(p: typeof products.$inferSelect): CardProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    price: Number(p.price),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    icon: p.icon,
    tint: p.tint,
    imageUrl: p.imageUrl,
    badge: p.badge,
    deliveryTime: p.deliveryTime,
    rating: p.rating,
    sales: p.sales,
    publisher: { name: "BK MARKET", username: null, avatar: null, verified: true },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [p] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  return {
    title: p ? `${p.name} — BK MARKET` : "BK MARKET",
    description: p?.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { ok: prodOk, data: found } = await dbSafe(
    () =>
      db.select().from(products).where(eq(products.slug, slug)).limit(1),
    [] as (typeof products.$inferSelect)[]
  );
  const p = found[0];
  if (!p) {
    if (!prodOk) {
      return (
        <section className="flex min-h-[70vh] items-center justify-center px-4 pt-24">
          <DbBanner
            title="تعذّر تحميل المنتج مؤقتاً"
            sub="قاعدة البيانات غير متاحة حالياً — عد بعد قليل، أو افتح /api/health إن كنت صاحب الموقع."
          />
        </section>
      );
    }
    notFound();
  }

  const [{ data: related }] = await Promise.all([
    dbSafe(
      () =>
        db
          .select()
          .from(products)
          .where(and(eq(products.category, p.category), ne(products.id, p.id)))
          .orderBy(desc(products.sales))
          .limit(4),
      [] as (typeof products.$inferSelect)[]
    ),
    trackVisit(`/product/${slug}`),
  ]);

  const price = Number(p.price);
  const oldPrice = p.oldPrice ? Number(p.oldPrice) : null;
  const tint = TINTS[p.tint] ?? TINTS.violet;
  const catMap = await getCategoryMap();
  const category = catMap[p.category];
  const lowStock = p.stock < 20;

  return (
    <>
      <section className="relative overflow-hidden pb-20 pt-40 md:pt-48">
        <div className="absolute inset-0 -z-10">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_20%,black,transparent)]" />
          <div className="absolute -top-24 end-[12%] size-[340px] rounded-full bg-accent/10 blur-[80px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* breadcrumb */}
          <Reveal y={30}>
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-neutral-400">
              <Link href="/" className="transition hover:text-neutral-900 dark:hover:text-white">
                الرئيسية
              </Link>
              <ChevronLeft className="size-3.5" />
              <Link href="/store" className="transition hover:text-neutral-900 dark:hover:text-white">
                المتجر
              </Link>
              <ChevronLeft className="size-3.5" />
              <Link
                href={`/store?cat=${p.category}`}
                className="transition hover:text-neutral-900 dark:hover:text-white"
              >
                {category?.ar}
              </Link>
              <ChevronLeft className="size-3.5" />
              <span className="text-neutral-700 dark:text-neutral-200">{p.name}</span>
            </nav>
          </Reveal>

          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
            {/* -------- visual -------- */}
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <TiltCard intensity={6} glare={false}>
                <div className="relative overflow-hidden rounded-[2.5rem] border border-neutral-200/80 bg-neutral-950 p-10 text-white dark:border-white/10 dark:bg-neutral-900">
                  <div className="bg-grid absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
                  <div className="absolute -top-20 -start-20 size-64 rounded-full bg-accent/25 blur-[70px]" />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      {p.badge && (
                        <span className="rounded-full bg-white px-4 py-1.5 text-[11px] font-black text-neutral-900">
                          {p.badge}
                        </span>
                      )}
                      {oldPrice && (
                        <span className="rounded-full bg-rose-500 px-4 py-1.5 text-[11px] font-black text-white">
                          وفّر {Math.round((1 - price / oldPrice) * 100)}%
                        </span>
                      )}
                    </div>

                    {p.imageUrl ? (
                      <div className="relative mx-auto my-10 overflow-hidden rounded-[2rem] ring-1 ring-white/15">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="max-h-64 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 to-transparent" />
                      </div>
                    ) : (
                      <div className="relative mx-auto my-12 grid size-48 place-items-center">
                        <span className="absolute inset-0 rounded-full border border-white/10" />
                        <span className="absolute inset-4 rounded-full border border-dashed border-white/20" />
                        <span
                          className="absolute inset-10 rounded-full bg-gradient-to-br opacity-40 blur-xl"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle, rgba(88,101,242,.8), transparent 70%)",
                          }}
                        />
                        <span className="relative grid size-24 place-items-center rounded-3xl bg-white/[0.06] ring-1 ring-inset ring-white/15 backdrop-blur">
                          <span className={cn("grid size-24 place-items-center rounded-3xl bg-gradient-to-br", tint.tile)}>
                            <ProductIcon name={p.icon} className="size-12" />
                          </span>
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { icon: Zap, label: "التسليم", value: p.deliveryTime },
                        { icon: ShieldCheck, label: "الضمان", value: "استبدال كامل" },
                        { icon: TrendingUp, label: "المبيعات", value: formatNumber(p.sales) },
                      ].map(({ icon: Icon, label, value }) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
                        >
                          <Icon className="mx-auto size-4.5 text-accent" />
                          <p className="mt-2 text-[10px] font-bold text-neutral-400">
                            {label}
                          </p>
                          <p className="mt-0.5 text-[13px] font-black leading-5">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TiltCard>
            </Reveal>

            {/* -------- info -------- */}
            <div>
              <Reveal y={40}>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/store?cat=${p.category}`}
                    className="flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1.5 text-[11px] font-black text-white dark:bg-white dark:text-neutral-900"
                  >
                    <Layers className="size-3" />
                    {category?.ar}
                  </Link>
                  <span className="flex items-center gap-1.5 rounded-full border border-neutral-200 px-3.5 py-1.5 text-[11px] font-black text-amber-500 dark:border-white/10">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    {p.rating} — {formatNumber(Math.round(p.sales / 4))} تقييم
                  </span>
                </div>
                <h1 className="mt-5 text-3xl font-black leading-[1.3] md:text-[2.6rem] md:leading-[1.25]">
                  {p.name}
                </h1>
                {p.nameEn && (
                  <p className="mt-2 font-display text-xs uppercase tracking-[0.25em] text-neutral-400">
                    {p.nameEn}
                  </p>
                )}
                <p className="mt-5 text-sm leading-8 text-neutral-500 dark:text-neutral-400 md:text-[15px]">
                  {p.description}
                </p>
              </Reveal>

              <Reveal y={40} delay={0.08} className="mt-7">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {p.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 rounded-2xl border border-neutral-200/70 bg-white p-3.5 text-[13px] font-bold leading-6 dark:border-white/[0.07] dark:bg-white/[0.03]"
                    >
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <Check className="size-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal y={40} delay={0.14} className="mt-8">
                <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-900/[0.05] dark:border-white/[0.08] dark:bg-neutral-900/80 sm:p-7">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                        السعر الحالي
                      </p>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="shine-text font-display text-4xl font-bold tracking-tight">
                          ${price.toFixed(2)}
                        </span>
                        {oldPrice && (
                          <span className="text-base font-bold text-neutral-400 line-through">
                            ${oldPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black",
                        lowStock
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-emerald-500/10 text-emerald-500"
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", lowStock ? "bg-amber-500 animate-pulse-soft" : "bg-emerald-500")} />
                      {lowStock
                        ? `كمية محدودة — متبقي ${p.stock} فقط`
                        : `متوفر — ${p.stock} قطعة في المخزون`}
                    </span>
                  </div>

                  <div className="mt-5">
                    <BuyFlow
                      product={{
                        id: p.id,
                        name: p.name,
                        slug: p.slug,
                        price,
                        oldPrice,
                        deliveryTime: p.deliveryTime,
                        icon: p.icon,
                        tint: p.tint,
                        imageUrl: p.imageUrl,
                        couponCode: p.couponCode,
                        couponPercent: p.couponPercent,
                      }}
                    />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-neutral-100 pt-5 text-center dark:border-white/[0.06]">
                    {[
                      { icon: Truck, label: "توصيل فوري" },
                      { icon: RotateCcw, label: "ضمان استبدال" },
                      { icon: Headset, label: "دعم 24/7" },
                    ].map(({ icon: Icon, label }) => (
                      <span
                        key={label}
                        className="flex items-center justify-center gap-1.5 text-[11px] font-black text-neutral-500 dark:text-neutral-400"
                      >
                        <Icon className="size-4 text-accent" />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* related */}
      {related.length > 0 && (
        <section className="border-t border-neutral-200/70 bg-neutral-100/60 py-20 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="قد يعجبك أيضاً"
              title={
                <>
                  منتجات مشابهة من قسم{" "}
                  <span className="text-accent">{category?.ar}</span>
                </>
              }
            />
            <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => (
                <RevealItem key={r.id}>
                  <ProductCard product={serialize(r)} />
                </RevealItem>
              ))}
            </RevealStagger>
          </div>
        </section>
      )}
    </>
  );
}
