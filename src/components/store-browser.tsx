"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownWideNarrow,
  ChevronDown,
  Flame,
  LayoutGrid,
  List,
  PackageSearch,
  Search,
  SlidersHorizontal,
  Tag,
  X,
} from "lucide-react";
import ProductCard, { type CardProduct } from "./product-card";
import ProductIcon from "./product-icon";
import { cn } from "@/lib/utils";

type Cat = { key: string; ar: string; en: string; icon: string; tint: string };

type Sort = "popular" | "price-asc" | "price-desc" | "rating" | "newest";
type View = "grid" | "list";

const SORTS: { id: Sort; label: string }[] = [
  { id: "popular", label: "الأكثر مبيعاً" },
  { id: "rating", label: "الأعلى تقييماً" },
  { id: "price-asc", label: "السعر: من الأقل" },
  { id: "price-desc", label: "السعر: من الأعلى" },
  { id: "newest", label: "العروض والخصومات" },
];

export default function StoreBrowser({
  products,
  initialCat = "all",
  categories,
}: {
  products: CardProduct[];
  initialCat?: string;
  categories: Cat[];
}) {
  const [cat, setCat] = useState(initialCat);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("popular");
  const [view, setView] = useState<View>("grid");
  const [onlyDeals, setOnlyDeals] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // press "/" to jump to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const priceCap = useMemo(
    () => Math.ceil(Math.max(...products.map((p) => p.price), 10)),
    [products]
  );
  const effectiveMax = maxPrice || priceCap;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products.length };
    for (const p of products) c[p.category] = (c[p.category] ?? 0) + 1;
    return c;
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (onlyDeals) list = list.filter((p) => p.oldPrice);
    list = list.filter((p) => p.price <= effectiveMax);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle)
      );
    }
    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => Number(b.rating) - Number(a.rating));
        break;
      case "newest":
        list.sort((a, b) => {
          const da = a.oldPrice ? 1 - a.price / a.oldPrice : 0;
          const db = b.oldPrice ? 1 - b.price / b.oldPrice : 0;
          return db - da;
        });
        break;
      default:
        list.sort((a, b) => b.sales - a.sales);
    }
    return list;
  }, [products, cat, q, sort, onlyDeals, effectiveMax]);

  const dealsCount = products.filter((p) => p.oldPrice).length;
  const activeFilters =
    (cat !== "all" ? 1 : 0) + (onlyDeals ? 1 : 0) + (maxPrice ? 1 : 0);

  function reset() {
    setQ("");
    setCat("all");
    setOnlyDeals(false);
    setMaxPrice(0);
  }

  return (
    <div>
      {/* ============ control deck ============ */}
      <div className="relative z-10 -mx-2 rounded-[1.5rem] border border-neutral-200/70 bg-white/90 p-3 shadow-[0_18px_40px_-24px_rgba(12,12,20,0.18)] backdrop-blur-sm dark:border-white/[0.07] dark:bg-neutral-900/80 sm:mx-0">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* search */}
          <div className="relative flex-1">
            <Search className="absolute start-4 top-1/2 size-4.5 -translate-y-1/2 text-neutral-400" />
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن نيترو، نتفليكس، بطاقة ستيم…  ( / )"
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3.5 ps-11 pe-10 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-900"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                aria-label="مسح البحث"
                className="absolute end-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* sort */}
          <div className="relative">
            <ArrowDownWideNarrow className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as Sort);
              }}
              aria-label="ترتيب"
              className="w-full cursor-pointer appearance-none rounded-2xl border border-neutral-200 bg-white py-3.5 ps-11 pe-8 text-sm font-bold outline-none transition focus:border-accent dark:border-white/10 dark:bg-neutral-900 lg:w-52"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* view switch + mobile filters toggle */}
          <div className="flex items-center gap-2">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3.5 text-xs font-black transition lg:hidden",
              filtersOpen || activeFilters > 0
                ? "border-accent bg-accent/[0.08] text-accent"
                : "border-neutral-200 text-neutral-500 dark:border-white/10"
            )}
          >
            <SlidersHorizontal className="size-4" />
            الفلاتر
            {activeFilters > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] text-white">
                {activeFilters}
              </span>
            )}
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                filtersOpen && "rotate-180"
              )}
            />
          </button>
          <div className="flex items-center gap-1 rounded-2xl border border-neutral-200 bg-white p-1 dark:border-white/10 dark:bg-neutral-900">
            {([
              { id: "grid" as View, Icon: LayoutGrid },
              { id: "list" as View, Icon: List },
            ]).map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setView(id);
                }}
                aria-label={id === "grid" ? "عرض شبكي" : "عرض قائمة"}
                className={cn(
                  "grid size-10 place-items-center rounded-xl transition",
                  view === id
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                )}
              >
                <Icon className="size-4.5" />
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* category pills + advanced filters (collapsible on mobile) */}
        <div className={cn("lg:block", filtersOpen ? "block" : "hidden")}>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterPill
            active={cat === "all"}
            onClick={() => {
              setCat("all");
            }}
            label="الكل"
            count={counts.all}
          />
          {categories.map((c) => (
            <FilterPill
              key={c.key}
              active={cat === c.key}
              onClick={() => {
                setCat(c.key);
              }}
              label={c.ar}
              icon={c.icon}
              count={counts[c.key] ?? 0}
            />
          ))}
        </div>

        {/* deals + price range */}
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-neutral-200/60 pt-3 dark:border-white/[0.06]">
          <button
            onClick={() => {
              setOnlyDeals((v) => !v);
            }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-black transition",
              onlyDeals
                ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                : "border-neutral-200 text-neutral-500 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-neutral-300"
            )}
          >
            <Flame className="size-3.5" />
            العروض فقط
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px]",
                onlyDeals ? "bg-white/25" : "bg-neutral-100 dark:bg-white/10"
              )}
            >
              {dealsCount}
            </span>
          </button>

          <div className="flex min-w-52 flex-1 items-center gap-3">
            <Tag className="size-3.5 shrink-0 text-neutral-400" />
            <input
              type="range"
              min={1}
              max={priceCap}
              value={effectiveMax}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              aria-label="أقصى سعر"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-accent dark:bg-white/10"
            />
            <span className="font-display shrink-0 text-[11px] font-bold text-neutral-500 dark:text-neutral-300">
              ≤ ${effectiveMax}
            </span>
          </div>

          {activeFilters > 0 && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 rounded-full bg-neutral-900/[0.05] px-3.5 py-2 text-[11px] font-black text-neutral-500 transition hover:bg-neutral-900/10 dark:bg-white/[0.06] dark:text-neutral-300"
            >
              <X className="size-3" />
              مسح {activeFilters} فلتر
            </button>
          )}
        </div>
        </div>
      </div>

      {/* ============ results ============ */}
      <div className="mt-8 flex items-center gap-2 text-xs font-bold text-neutral-400">
        <SlidersHorizontal className="size-3.5" />
        عرض <b className="text-neutral-700 dark:text-neutral-200">{filtered.length}</b> من{" "}
        {products.length} منتج
        {cat !== "all" && (
          <span className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-accent">
            {categories.find((c) => c.key === cat)?.ar ?? cat}
          </span>
        )}
      </div>

      {filtered.length > 0 ? (
        <div
          key={`${cat}-${q}-${sort}-${view}-${onlyDeals}-${effectiveMax}`}
          className={cn(
            "mt-6",
            view === "grid"
              ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-3"
          )}
        >
          {filtered.map((p) => (
            <div key={p.id}>
              <ProductCard product={p} view={view} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center py-16 text-center">
          <span className="grid size-20 place-items-center rounded-3xl bg-neutral-100 text-neutral-300 dark:bg-white/5 dark:text-neutral-600">
            <PackageSearch className="size-10" />
          </span>
          <h3 className="mt-6 text-lg font-black">لا توجد نتائج مطابقة</h3>
          <p className="mt-2 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
            جرّب كلمة بحث مختلفة أو وسّع نطاق السعر أو تصفح قسماً آخر.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-full bg-neutral-900 px-6 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-neutral-900"
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition-all",
        active
          ? "border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-900/20 dark:border-white dark:bg-white dark:text-neutral-900"
          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-white/25"
      )}
    >
      {icon && (
        <ProductIcon
          name={icon}
          className={cn("size-3.5", active ? "" : "text-neutral-400")}
        />
      )}
      {label}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px]",
          active
            ? "bg-white/20 dark:bg-black/15"
            : "bg-neutral-100 text-neutral-400 dark:bg-white/10"
        )}
      >
        {count}
      </span>
    </button>
  );
}
