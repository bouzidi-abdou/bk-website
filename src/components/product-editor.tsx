"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgePercent,
  Check,
  Image as ImageIcon,
  Loader2,
  Save,
  TriangleAlert,
  X,
} from "lucide-react";
import ProductIcon, { ICONS } from "./product-icon";
import { TINTS, cn } from "@/lib/utils";

export type EditableProduct = {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  oldPrice: number | null;
  icon: string;
  tint: string;
  stock: number;
  badge?: string | null;
  deliveryTime?: string | null;
  imageUrl?: string | null;
  couponCode?: string | null;
  couponPercent?: number | null;
};

const ICON_KEYS = Object.keys(ICONS);
const TINT_KEYS = Object.keys(TINTS);

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-900";
const labelCls = "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function ProductEditor({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: EditableProduct;
  categories: { key: string; ar: string }[];
  onClose: () => void;
  onSaved: (p: EditableProduct) => void;
}) {
  const [f, setF] = useState({
    name: product.name,
    description: product.description ?? "",
    category: product.category,
    price: String(product.price),
    oldPrice: product.oldPrice ? String(product.oldPrice) : "",
    stock: String(product.stock),
    badge: product.badge ?? "",
    deliveryTime: product.deliveryTime ?? "فوري",
    imageUrl: product.imageUrl ?? "",
    icon: product.icon,
    tint: product.tint,
    couponCode: product.couponCode ?? "",
    couponPercent: product.couponPercent ? String(product.couponPercent) : "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          name: f.name,
          description: f.description || undefined,
          category: f.category,
          price: Number(f.price),
          oldPrice: f.oldPrice ? Number(f.oldPrice) : null,
          stock: Number(f.stock),
          badge: f.badge,
          deliveryTime: f.deliveryTime,
          imageUrl: f.imageUrl,
          icon: f.icon,
          tint: f.tint,
          couponCode: f.couponCode || null,
          couponPercent: f.couponPercent ? Number(f.couponPercent) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الحفظ");
      setMsg({ ok: true, text: "تم حفظ التعديلات بنجاح" });
      onSaved({
        ...product,
        name: f.name,
        category: f.category,
        price: Number(f.price),
        oldPrice: f.oldPrice ? Number(f.oldPrice) : null,
        stock: Number(f.stock),
        icon: f.icon,
        tint: f.tint,
        couponCode: f.couponCode || null,
        couponPercent: f.couponPercent ? Number(f.couponPercent) : null,
      });
      setTimeout(onClose, 700);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-0 sm:p-6"
      onClick={onClose}
      data-lenis-prevent
    >
      <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 my-auto max-h-full w-full overflow-y-auto border border-neutral-200 bg-white shadow-2xl sm:max-w-2xl sm:rounded-[1.75rem] dark:border-white/10 dark:bg-neutral-900"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200/70 bg-white/95 px-5 py-4 backdrop-blur dark:border-white/[0.07] dark:bg-neutral-900/95">
          <h3 className="text-sm font-black">تعديل المنتج</h3>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid size-9 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>اسم المنتج</label>
            <input className={inputCls} value={f.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>الوصف</label>
            <textarea
              className={cn(inputCls, "min-h-20 resize-y leading-7")}
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>القسم</label>
            <select
              className={cn(inputCls, "cursor-pointer appearance-none")}
              value={f.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.ar}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>الشارة</label>
            <input
              className={inputCls}
              placeholder="الأكثر مبيعاً"
              value={f.badge}
              onChange={(e) => set("badge", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 sm:col-span-2">
            <div>
              <label className={labelCls}>السعر $</label>
              <input
                className={inputCls}
                dir="ltr"
                inputMode="decimal"
                value={f.price}
                onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <div>
              <label className={labelCls}>قبل الخصم $</label>
              <input
                className={inputCls}
                dir="ltr"
                inputMode="decimal"
                placeholder="فارغ = بلا خصم"
                value={f.oldPrice}
                onChange={(e) => set("oldPrice", e.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
            <div>
              <label className={labelCls}>المخزون</label>
              <input
                className={inputCls}
                dir="ltr"
                inputMode="numeric"
                value={f.stock}
                onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          {/* coupon */}
          <div className="rounded-2xl border border-dashed border-neutral-300 p-4 sm:col-span-2 dark:border-white/15">
            <p className="flex items-center gap-2 text-xs font-black">
              <BadgePercent className="size-4 text-accent" />
              كوبون خاص بهذا المنتج
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>الكود</label>
                <input
                  className={cn(inputCls, "uppercase")}
                  dir="ltr"
                  placeholder="SAVE20"
                  value={f.couponCode}
                  onChange={(e) => set("couponCode", e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className={labelCls}>نسبة الخصم %</label>
                <input
                  className={inputCls}
                  dir="ltr"
                  inputMode="numeric"
                  placeholder="20"
                  value={f.couponPercent}
                  onChange={(e) =>
                    set("couponPercent", e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                />
              </div>
            </div>
            {f.couponCode && (
              <button
                onClick={() => {
                  set("couponCode", "");
                  set("couponPercent", "");
                }}
                className="mt-2 text-[10px] font-black text-rose-500 hover:underline"
              >
                إزالة الكوبون
              </button>
            )}
          </div>

          <div>
            <label className={labelCls}>مدة التسليم</label>
            <input
              className={inputCls}
              value={f.deliveryTime}
              onChange={(e) => set("deliveryTime", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>رابط الصورة</label>
            <div className="relative">
              <ImageIcon className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                className={cn(inputCls, "ps-10")}
                dir="ltr"
                value={f.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
              />
            </div>
          </div>

          <div className="sm:col-span-2">
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
                    f.icon === k
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-neutral-200 text-neutral-400 dark:border-white/10"
                  )}
                >
                  <ProductIcon name={k} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className={labelCls}>اللون</label>
            <div className="flex flex-wrap gap-2">
              {TINT_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => set("tint", k)}
                  className={cn(
                    "grid size-9 place-items-center rounded-full transition",
                    TINTS[k].solid,
                    f.tint === k ? "scale-110 ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900" : "opacity-50"
                  )}
                >
                  {f.tint === k && <Check className="size-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {msg && (
            <p
              className={cn(
                "flex items-center gap-2 rounded-2xl px-4 py-3 text-[11px] font-black sm:col-span-2",
                msg.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              )}
            >
              {msg.ok ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}
              {msg.text}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex gap-3 border-t border-neutral-200/70 bg-white/95 p-4 backdrop-blur dark:border-white/[0.07] dark:bg-neutral-900/95">
          <button
            onClick={save}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-xs font-black text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            حفظ التعديلات
          </button>
          <button
            onClick={onClose}
            className="rounded-2xl border border-neutral-200 px-6 text-xs font-black dark:border-white/10"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
