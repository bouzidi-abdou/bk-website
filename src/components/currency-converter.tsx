"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronDown,
  CircleDollarSign,
  RefreshCcw,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import IconTile from "./icon-tile";
import Reveal from "./reveal";
import {
  CURRENCIES,
  formatMoney,
  getCurrency,
  timeAgo,
  type Currency,
} from "@/lib/currency";
import { TINTS, cn } from "@/lib/utils";

/* ------------------------- animated number ------------------------- */

function AnimatedMoney({ value }: { value: number }) {
  return <span>{formatMoney(value)}</span>;
}

/* ------------------------ currency dropdown ------------------------ */

function CurrencySelect({
  value,
  onChange,
  other,
}: {
  value: string;
  onChange: (code: string) => void;
  other: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const cur = getCurrency(value);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CURRENCIES.filter(
      (c) =>
        !needle ||
        c.code.toLowerCase().includes(needle) ||
        c.name.includes(needle)
    );
  }, [q]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 transition",
          open
            ? "border-accent ring-2 ring-accent/20"
            : "border-neutral-200 hover:border-neutral-300 dark:border-white/10 dark:hover:border-white/20"
        )}
      >
        <span
          className={cn(
            "grid size-8 place-items-center rounded-xl text-[11px] font-black text-white",
            TINTS[cur.tint]?.solid ?? "bg-accent"
          )}
        >
          {cur.symbol}
        </span>
        <span className="text-start leading-4">
          <b className="block font-display text-xs font-bold">{cur.code}</b>
          <span className="max-w-20 truncate text-[10px] font-bold text-neutral-400">
            {cur.name}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-neutral-400 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="absolute end-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900"
          data-lenis-prevent
        >
          <div className="relative border-b border-neutral-100 p-2.5 dark:border-white/[0.06]">
            <Search className="absolute start-5 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن عملة…"
              className="w-full rounded-xl bg-neutral-50 py-2.5 ps-9 pe-3 text-xs font-bold outline-none focus:ring-2 focus:ring-accent/20 dark:bg-white/[0.04]"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1.5">
            {list.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                  setQ("");
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-start transition",
                  c.code === value
                    ? "bg-accent/[0.08]"
                    : "hover:bg-neutral-50 dark:hover:bg-white/[0.04]"
                )}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-black text-white",
                    TINTS[c.tint]?.solid ?? "bg-accent"
                  )}
                >
                  {c.symbol}
                </span>
                <span className="flex-1 leading-4">
                  <b className="block font-display text-xs font-bold">{c.code}</b>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {c.name}
                  </span>
                </span>
                {c.code === value && <Check className="size-4 text-accent" />}
                {c.code === other && (
                  <SwapTag label="الطرف الآخر" />
                )}
              </button>
            ))}
            {list.length === 0 && (
              <p className="py-8 text-center text-xs font-bold text-neutral-400">
                لا توجد عملة بهذا الاسم
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SwapTag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black text-neutral-400 dark:bg-white/10">
      {label}
    </span>
  );
}

/* --------------------------- main widget --------------------------- */

export type ConvProduct = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  tint: string;
  price: number;
};

export default function CurrencyConverter({
  rates,
  updated,
  live,
  products,
}: {
  rates: Record<string, number>;
  updated: string | null;
  live: boolean;
  products: ConvProduct[];
}) {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("DZD");
  const [amount, setAmount] = useState("10");

  const amt = parseFloat(amount.replace(/[^\d.]/g, "")) || 0;
  const rate =
    rates[from] && rates[to] ? rates[to] / rates[from] : 0;
  const result = amt * rate;
  const fromCur = getCurrency(from);
  const toCur = getCurrency(to);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div>
      {/* -------- converter card -------- */}
      <div className="relative">
        <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-accent/15 via-transparent to-indigo-400/10 blur-2xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-2xl shadow-neutral-900/[0.07] dark:border-white/10 dark:bg-neutral-900/80 dark:shadow-black/40">
          {/* header */}
          <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 dark:border-white/[0.06]">
            <span className="flex items-center gap-2 text-xs font-black text-neutral-500 dark:text-neutral-300">
              <CircleDollarSign className="size-4 text-accent" />
              محوّل العملات المباشر
            </span>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black",
                live
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-amber-500/10 text-amber-500"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  live ? "bg-emerald-500 animate-pulse-soft" : "bg-amber-500"
                )}
              />
              {live ? "أسعار حيّة" : "أسعار استرشادية"}
            </span>
          </div>

          <div className="relative p-5 sm:p-7">
            {/* FROM */}
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50/60 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black text-neutral-400">
                  لديك — من
                </span>
                <CurrencySelect value={from} onChange={setFrom} other={to} />
              </div>
              <div className="mt-4 flex items-end gap-3">
                <input
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 10))
                  }
                  inputMode="decimal"
                  dir="ltr"
                  aria-label="المبلغ"
                  className="w-full min-w-0 flex-1 bg-transparent text-left font-display text-4xl font-bold tracking-tight outline-none placeholder:text-neutral-300 sm:text-5xl"
                  placeholder="0"
                />
                <span className="pb-1.5 text-sm font-black text-neutral-400">
                  {fromCur.name}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2" dir="ltr">
                {[1, 5, 10, 25, 50, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 font-display text-[11px] font-bold transition",
                      amt === v
                        ? "border-accent bg-accent text-white"
                        : "border-neutral-200 bg-white text-neutral-500 hover:border-accent/40 hover:text-accent dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-400"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* SWAP */}
            <div className="relative z-10 -my-4 flex justify-center">
              <button
                onClick={swap}
                aria-label="تبديل العملتين"
                className="grid size-12 place-items-center rounded-full border-4 border-white bg-accent text-white shadow-lg transition-colors hover:bg-accent-dark dark:border-neutral-900"
              >
                <ArrowUpDown className="size-5" />
              </button>
            </div>

            {/* TO */}
            <div className="rounded-3xl border border-accent/25 bg-accent/[0.04] p-5 dark:bg-accent/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-black text-accent/80">
                  تحصل تقريباً — إلى
                </span>
                <CurrencySelect value={to} onChange={setTo} other={from} />
              </div>
              <div className="mt-4 flex items-end gap-3">
                <p
                  dir="ltr"
                  className="shine-text min-w-0 flex-1 truncate text-left font-display text-4xl font-bold tracking-tight sm:text-5xl"
                >
                  <AnimatedMoney value={result} />
                </p>
                <span className="pb-1.5 text-sm font-black text-accent/70">
                  {toCur.name} ({toCur.symbol})
                </span>
              </div>
            </div>

            {/* rate line */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-5 py-3.5 text-[11px] font-black text-neutral-500 dark:bg-white/[0.03] dark:text-neutral-300">
              <span className="flex items-center gap-2" dir="ltr">
                <b className="font-display text-accent">1 {from}</b>
                <ArrowLeft className="size-3.5" />
                <b className="font-display">{formatMoney(rate, rate < 1 ? 4 : 2)} {to}</b>
              </span>
              <span className="flex items-center gap-1.5 text-neutral-400">
                <RefreshCcw className="size-3" />
                آخر تحديث: {live ? timeAgo(updated) : "أسعار مخزنة"}
              </span>
            </div>

            <p className="mt-3 text-center text-[10px] font-bold leading-5 text-neutral-400">
              الأسعار استرشادية لمساعدتك على حساب تكلفة منتجاتك بعملتك المحلية،
              وقد تختلف قليلاً عن السعر النهائي عند الدفع حسب وسيلة التحويل.
            </p>
          </div>
        </div>
      </div>

      {/* -------- products in your currency -------- */}
      <Reveal className="mt-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-1.5 text-[11px] font-black text-neutral-500 dark:border-white/10 dark:text-neutral-400">
            <CircleDollarSign className="size-3.5 text-accent" />
            كم تكلف منتجاتنا بعملتك؟
          </span>
          <h2 className="mt-4 text-2xl font-black md:text-3xl">
            أسعار مختارة محسوبة مباشرة بـ
            <span className="text-accent"> {toCur.name}</span>
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            غيّر العملة من الأعلى وشاهد الأسعار تتحدّث فوراً أمامك.
          </p>
        </div>
      </Reveal>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const converted = p.price * (rates[to] ?? 1);
          return (
            <Link
              key={p.id}
              href={`/product/${p.slug}`}
              className="group flex items-center gap-4 rounded-3xl border border-neutral-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl dark:border-white/[0.07] dark:bg-neutral-900/70 dark:hover:border-white/15"
            >
              <IconTile name={p.icon} tint={p.tint} size="md" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-black group-hover:text-accent">
                  {p.name}
                </h3>
                <p className="mt-1 flex items-center gap-2 text-[11px] font-bold text-neutral-400">
                  <span className="font-display">${p.price.toFixed(2)}</span>
                  <ArrowLeft className="size-3" />
                  <span className={cn("font-display text-sm font-bold", TINTS[p.tint]?.text)}>
                    <AnimatedMoney value={converted} /> {to}
                  </span>
                </p>
              </div>
              <TrendingUp className="size-4 shrink-0 text-neutral-300 transition group-hover:text-accent" />
            </Link>
          );
        })}
      </div>

      <Reveal className="mt-10">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-neutral-200/80 bg-neutral-950 p-6 text-white sm:flex-row dark:border-white/10">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/40">
              <Wallet className="size-6" />
            </span>
            <div>
              <h3 className="text-base font-black">جاهز للشراء بأي عملة؟</h3>
              <p className="mt-0.5 text-xs leading-6 text-neutral-400">
                نقبل PayPal وكريبتو USDT والبطاقات البنكية — والتحويل يتم تلقائياً.
              </p>
            </div>
          </div>
          <Link
            href="/store"
            className="group flex shrink-0 items-center gap-2.5 rounded-full bg-white px-6 py-3.5 text-xs font-black text-neutral-900 transition hover:-translate-y-0.5"
          >
            تصفّح المتجر
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
