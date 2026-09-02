"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Star, Zap } from "lucide-react";
import IconTile from "./icon-tile";
import ProductIcon from "./product-icon";
import VerifiedBadge from "./verified-badge";
import { cn, formatNumber, TINTS } from "@/lib/utils";

export type ProductPublisher = {
  name: string;
  username: string | null;
  avatar: string | null;
  verified: boolean;
};

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  oldPrice: number | null;
  icon: string;
  tint: string;
  imageUrl: string | null;
  badge: string | null;
  deliveryTime: string;
  rating: string;
  sales: number;
  publisher?: ProductPublisher | null;
};

function Publisher({ publisher }: { publisher: ProductPublisher }) {
  return (
    <div className="flex min-w-0 items-center gap-2 border-t border-neutral-100 pt-3 dark:border-white/[0.06]">
      {publisher.avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={publisher.avatar}
          alt=""
          loading="lazy"
          className="size-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent text-[7px] font-black text-white">
          BK
        </span>
      )}
      <span className="min-w-0 truncate text-[10px] font-bold text-neutral-400">
        نشره {publisher.name}
      </span>
      {publisher.verified && (
        <VerifiedBadge className="size-3" tooltip={false} />
      )}
    </div>
  );
}

export default function ProductCard({
  product,
  view = "grid",
}: {
  product: CardProduct;
  view?: "grid" | "list";
}) {
  const tint = TINTS[product.tint] ?? TINTS.violet;
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  if (view === "list") {
    return (
      <Link href={`/product/${product.slug}`} className="group block">
        <article className="flex min-w-0 flex-wrap items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4 transition duration-200 hover:border-neutral-300 hover:shadow-md dark:border-white/[0.07] dark:bg-neutral-900/70 dark:hover:border-white/15 sm:flex-nowrap">
          <IconTile name={product.icon} tint={product.tint} size="md" />
          <div className="min-w-0 flex-1 basis-[180px]">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 truncate text-sm font-black transition-colors group-hover:text-accent">
                {product.name}
              </h3>
              {product.badge && (
                <span className="shrink-0 rounded-full bg-neutral-900 px-2.5 py-0.5 text-[9px] font-black text-white dark:bg-white dark:text-neutral-900">
                  {product.badge}
                </span>
              )}
            </div>
            <p className="mt-1 line-clamp-1 break-words text-xs text-neutral-500 dark:text-neutral-400">
              {product.description}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-black text-neutral-400">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="size-3 fill-amber-400" /> {product.rating}
              </span>
              <span className="flex items-center gap-1 text-emerald-500">
                <Zap className="size-3" />
                {product.deliveryTime.split("—")[0].trim()}
              </span>
              <span>{formatNumber(product.sales)} مبيعة</span>
            </div>
          </div>

          <div className="ms-auto flex shrink-0 items-center gap-3">
            <div className="text-end">
              {product.oldPrice && (
                <p className="text-[10px] font-bold text-neutral-400 line-through">
                  ${product.oldPrice.toFixed(2)}
                </p>
              )}
              <p className="font-display text-lg font-bold">
                ${product.price.toFixed(2)}
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-full border border-neutral-200 text-neutral-500 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-white dark:border-white/10">
              <ArrowLeft className="size-4" />
            </span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <article className="relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-neutral-200/80 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-white/[0.07] dark:bg-neutral-900/70 dark:hover:border-white/15">
        <div className="relative h-32 overflow-hidden">
          {product.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-white to-transparent dark:from-neutral-900" />
            </>
          ) : (
            <div className={cn("relative size-full bg-gradient-to-br", tint.tile)}>
              <span className="bg-grid absolute inset-0 opacity-25" />
              <ProductIcon
                name={product.icon}
                className={cn(
                  "absolute -bottom-5 -end-3 size-28 rotate-12 opacity-15",
                  tint.text
                )}
              />
              <span className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white to-transparent dark:from-neutral-900" />
            </div>
          )}

          <div className="absolute inset-x-4 top-3 flex items-start justify-between gap-2">
            {product.badge ? (
              <span className="max-w-[65%] truncate rounded-full bg-neutral-900 px-3 py-1 text-[9px] font-black text-white dark:bg-white dark:text-neutral-900">
                {product.badge}
              </span>
            ) : (
              <span />
            )}
            {discount > 0 && (
              <span className="shrink-0 rounded-full bg-rose-500 px-2.5 py-1 text-[9px] font-black text-white">
                −{discount}%
              </span>
            )}
          </div>

          <div className="absolute -bottom-5 start-5">
            <IconTile name={product.icon} tint={product.tint} size="md" />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col px-5 pb-4 pt-8">
          <h3 className="line-clamp-2 break-words text-[14px] font-black leading-6 transition-colors group-hover:text-accent">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 flex-1 break-words text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
            {product.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5 overflow-hidden">
            <span className="flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-1 text-[9px] font-black text-amber-500">
              <Star className="size-2.5 fill-amber-400" /> {product.rating}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[9px] font-black text-emerald-500">
              <Zap className="size-2.5" />
              {product.deliveryTime.split("—")[0].trim()}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-black text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-300">
              <ShieldCheck className="size-2.5" /> ضمان
            </span>
          </div>

          <div className="mt-3 flex items-end justify-between gap-3 border-t border-neutral-100 pt-3 dark:border-white/[0.06]">
            <div className="min-w-0">
              <p className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-neutral-400">
                {formatNumber(product.sales)} عملية بيع
              </p>
              <div className="mt-1 flex min-w-0 items-baseline gap-2">
                <span className="font-display text-xl font-bold leading-none">
                  ${product.price.toFixed(2)}
                </span>
                {product.oldPrice && (
                  <span className="truncate text-[10px] font-bold text-neutral-400 line-through">
                    ${product.oldPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <span className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 text-[10px] font-black text-white transition-colors group-hover:bg-accent dark:bg-white dark:text-neutral-900 dark:group-hover:bg-accent dark:group-hover:text-white">
              اشترِ <ArrowLeft className="size-3" />
            </span>
          </div>

          {product.publisher && (
            <div className="mt-3">
              <Publisher publisher={product.publisher} />
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
