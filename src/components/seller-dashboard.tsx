"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Minus,
  Package,
  Percent,
  Plus,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import IconTile from "./icon-tile";
import ProductIcon, { ICONS } from "./product-icon";
import BkCoin from "./bk-coin";
import { TINTS, cn } from "@/lib/utils";
import { usdToCoins, formatCoins } from "@/lib/coins";

type SellerProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: string;
  icon: string;
  tint: string;
  stock: number;
  sales: number;
};

type Stats = {
  listed: number;
  sales: number;
  gross: string;
  commission: string;
  net: string;
  commissionRate: number;
};

type Tab = "overview" | "publish" | "products";

const ICON_KEYS = Object.keys(ICONS);
const TINT_KEYS = Object.keys(TINTS);

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-900";
const labelCls =
  "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function SellerDashboard({
  categories,
}: {
  categories: { key: string; ar: string }[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [items, setItems] = useState<SellerProduct[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    description: "",
    category: categories[0]?.key ?? "cards",
    price: "",
    stock: "50",
    deliveryTime: "فوري",
    imageUrl: "",
    icon: "Package",
    tint: "emerald",
    features: "",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/products");
      const data = await res.json();
      setItems(data.products ?? []);
      setStats(data.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function publish() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر النشر");
      setMsg({ ok: true, text: `تم نشر "${data.product.name}" في المتجر` });
      setForm((f) => ({
        ...f,
        name: "",
        nameEn: "",
        description: "",
        price: "",
        imageUrl: "",
        features: "",
      }));
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, payload: { stock?: number }) {
    setItems((l) => l.map((p) => (p.id === id ? { ...p, ...payload } : p)));
    await fetch("/api/seller/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
  }

  async function remove(id: string) {
    if (confirmDel !== id) {
      setConfirmDel(id);
      setTimeout(() => setConfirmDel(null), 3000);
      return;
    }
    setConfirmDel(null);
    setItems((l) => l.filter((p) => p.id !== id));
    await fetch(`/api/seller/products?id=${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  const TABS = [
    { id: "overview" as Tab, label: "نظرة عامة", Icon: BarChart3 },
    { id: "publish" as Tab, label: "نشر منتج", Icon: Plus },
    { id: "products" as Tab, label: `منتجاتي (${items.length})`, Icon: Package },
  ];

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white dark:border-white/[0.07] dark:bg-neutral-900/70">
      <div className="flex border-b border-neutral-100 dark:border-white/[0.06]">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "relative flex flex-1 items-center justify-center gap-2 px-3 py-4 text-[11px] font-black transition sm:text-sm",
              tab === id
                ? "text-accent"
                : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            )}
          >
            <Icon className="size-4" />
            {label}
            {tab === id && (
              <span className="absolute inset-x-6 bottom-0 h-[3px] rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6">
        {/* ---------------- OVERVIEW ---------------- */}
        {tab === "overview" && stats && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
                <Package className="size-5 text-accent" />
                <p className="font-display mt-3 text-2xl font-bold">
                  {stats.listed}
                </p>
                <p className="text-[10px] font-black text-neutral-400">
                  منتج منشور
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
                <TrendingUp className="size-5 text-emerald-500" />
                <p className="font-display mt-3 text-2xl font-bold">
                  {stats.sales}
                </p>
                <p className="text-[10px] font-black text-neutral-400">
                  عملية بيع
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5">
                <Wallet className="size-5 text-emerald-500" />
                <p className="font-display mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${stats.net}
                </p>
                <p className="text-[10px] font-black text-neutral-500 dark:text-neutral-400">
                  صافي أرباحك
                </p>
                <p className="mt-1 flex items-center gap-1 text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70">
                  <BkCoin className="size-3" />
                  {formatCoins(usdToCoins(Number(stats.net)))} BK
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
                <Percent className="size-5 text-amber-500" />
                <p className="font-display mt-3 text-2xl font-bold text-amber-500">
                  ${stats.commission}
                </p>
                <p className="text-[10px] font-black text-neutral-400">
                  عمولة المتجر ({Math.round(stats.commissionRate * 100)}%)
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
              <h3 className="text-sm font-black">كيف تُحسب أرباحك؟</h3>
              <div className="mt-4 space-y-2.5 text-[11px] font-bold">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    إجمالي المبيعات
                  </span>
                  <span className="font-display">${stats.gross}</span>
                </div>
                <div className="flex items-center justify-between text-amber-500">
                  <span>
                    عمولة المنصة ({Math.round(stats.commissionRate * 100)}%)
                  </span>
                  <span className="font-display">−${stats.commission}</span>
                </div>
                <div className="my-2 border-t border-dashed border-neutral-200 dark:border-white/10" />
                <div className="flex items-center justify-between text-emerald-500">
                  <span className="font-black">صافي الأرباح</span>
                  <span className="font-display text-base font-bold">
                    ${stats.net}
                  </span>
                </div>
              </div>
              <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-[10px] leading-6 text-neutral-500 dark:bg-white/[0.04] dark:text-neutral-400">
                تُضاف الأرباح إلى محفظة BK COIN الخاصة بك بعد اكتمال الطلب
                وتأكيد التسليم من العميل. للاستفسار عن الصرف تواصل مع الإدارة
                عبر التذاكر.
              </p>
            </div>
          </div>
        )}

        {/* ---------------- PUBLISH ---------------- */}
        {tab === "publish" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <label className={labelCls}>اسم المنتج *</label>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="مثال: اشتراك Netflix شهر"
              />
            </div>
            <div>
              <label className={labelCls}>الاسم بالإنجليزية</label>
              <input
                className={inputCls}
                dir="ltr"
                value={form.nameEn}
                onChange={(e) => set("nameEn", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>القسم *</label>
              <select
                className={cn(inputCls, "cursor-pointer appearance-none")}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.ar}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>الوصف *</label>
              <textarea
                className={cn(inputCls, "min-h-24 resize-y leading-7")}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="اشرح المنتج وطريقة التسليم بوضوح"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 lg:col-span-2">
              <div>
                <label className={labelCls}>السعر $ *</label>
                <input
                  className={inputCls}
                  dir="ltr"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="9.99"
                />
              </div>
              <div>
                <label className={labelCls}>الكمية *</label>
                <input
                  className={inputCls}
                  dir="ltr"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div>
                <label className={labelCls}>مدة التسليم</label>
                <input
                  className={inputCls}
                  value={form.deliveryTime}
                  onChange={(e) => set("deliveryTime", e.target.value)}
                />
              </div>
            </div>

            {form.price && (
              <p className="flex items-center justify-between rounded-2xl bg-emerald-500/[0.07] px-4 py-3 text-[11px] font-black text-emerald-600 lg:col-span-2 dark:text-emerald-400">
                <span>ربحك من كل عملية بيع (بعد عمولة 5%)</span>
                <span className="font-display">
                  ${(Number(form.price) * 0.95).toFixed(2)}
                </span>
              </p>
            )}

            <div className="lg:col-span-2">
              <label className={labelCls}>رابط الصورة (https)</label>
              <div className="relative">
                <ImageIcon className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  className={cn(inputCls, "ps-10")}
                  dir="ltr"
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://example.com/product.png"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className={labelCls}>المميزات (كل ميزة في سطر)</label>
              <textarea
                className={cn(inputCls, "min-h-20 resize-y leading-7")}
                value={form.features}
                onChange={(e) => set("features", e.target.value)}
                placeholder={"تسليم فوري\nضمان استبدال"}
              />
            </div>

            <div className="lg:col-span-2">
              <label className={labelCls}>الأيقونة</label>
              <div
                className="grid max-h-32 grid-cols-8 gap-2 overflow-y-auto rounded-2xl border border-neutral-200 p-3 dark:border-white/10"
                data-lenis-prevent
              >
                {ICON_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => set("icon", k)}
                    className={cn(
                      "grid aspect-square place-items-center rounded-xl border transition",
                      form.icon === k
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-neutral-200 text-neutral-400 dark:border-white/10"
                    )}
                  >
                    <ProductIcon name={k} className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <label className={labelCls}>اللون</label>
              <div className="flex flex-wrap gap-2">
                {TINT_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => set("tint", k)}
                    className={cn(
                      "grid size-9 place-items-center rounded-full transition",
                      TINTS[k].solid,
                      form.tint === k
                        ? "scale-110 ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900"
                        : "opacity-50"
                    )}
                  >
                    {form.tint === k && <Check className="size-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {msg && (
              <p
                className={cn(
                  "flex items-center gap-2 rounded-2xl px-4 py-3 text-[11px] font-black lg:col-span-2",
                  msg.ok
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-rose-500/10 text-rose-500"
                )}
              >
                {msg.ok ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}
                {msg.text}
              </p>
            )}

            <button
              onClick={publish}
              disabled={busy || !form.name.trim() || !form.price}
              className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-black text-white transition hover:bg-neutral-700 disabled:opacity-50 lg:col-span-2 dark:bg-white dark:text-neutral-900"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              نشر المنتج في المتجر
            </button>
          </div>
        )}

        {/* ---------------- MY PRODUCTS ---------------- */}
        {tab === "products" && (
          <div className="space-y-3">
            {items.length === 0 && (
              <p className="py-12 text-center text-sm font-bold text-neutral-400">
                لم تنشر أي منتج بعد — ابدأ من تبويب «نشر منتج».
              </p>
            )}
            {items.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200/70 p-4 dark:border-white/[0.07]"
              >
                <IconTile name={p.icon} tint={p.tint} size="sm" />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-black">{p.name}</h4>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-neutral-400">
                    <span>{categories.find((c) => c.key === p.category)?.ar}</span>
                    <span>•</span>
                    <span className="font-display">${Number(p.price).toFixed(2)}</span>
                    <span>•</span>
                    <span>{p.sales} مبيعة</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-2 py-1.5 dark:border-white/10">
                  <button
                    onClick={() => patch(p.id, { stock: Math.max(0, p.stock - 1) })}
                    className="grid size-6 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
                    aria-label="إنقاص"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span
                    className={cn(
                      "min-w-10 text-center font-display text-xs font-bold",
                      p.stock < 5 && "text-amber-500"
                    )}
                  >
                    {p.stock}
                  </span>
                  <button
                    onClick={() => patch(p.id, { stock: p.stock + 1 })}
                    className="grid size-6 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
                    aria-label="زيادة"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>

                <Link
                  href={`/product/${p.slug}`}
                  target="_blank"
                  className="grid size-9 place-items-center rounded-full border border-neutral-200 text-neutral-400 transition hover:border-accent hover:text-accent dark:border-white/10"
                  aria-label="عرض"
                >
                  <ExternalLink className="size-4" />
                </Link>

                <button
                  onClick={() => remove(p.id)}
                  className={cn(
                    "grid h-9 place-items-center rounded-full border px-3 text-[10px] font-black transition",
                    confirmDel === p.id
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-neutral-200 text-neutral-400 hover:border-rose-300 hover:text-rose-500 dark:border-white/10"
                  )}
                >
                  {confirmDel === p.id ? "تأكيد الحذف؟" : <Trash2 className="size-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
