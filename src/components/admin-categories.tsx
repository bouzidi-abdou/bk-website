"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  FolderPlus,
  Loader2,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import IconTile from "./icon-tile";
import ProductIcon, { ICONS } from "./product-icon";
import { TINTS, cn } from "@/lib/utils";

type Cat = {
  id: string;
  key: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  tint: string;
  sortOrder: number;
  active: boolean;
  productCount: number;
};

const ICON_KEYS = Object.keys(ICONS);
const TINT_KEYS = Object.keys(TINTS);

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-900";
const labelCls = "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function AdminCategories() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const router = useRouter();

  const [form, setForm] = useState({
    nameAr: "",
    nameEn: "",
    key: "",
    icon: "Package",
    tint: "violet",
    sortOrder: "100",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCats(data.categories ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الإنشاء");
      setMsg({ ok: true, text: `تم إنشاء قسم "${data.category.nameAr}" بنجاح` });
      setForm((f) => ({ ...f, nameAr: "", nameEn: "", key: "" }));
      await load();
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: Cat) {
    setCats((l) => l.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)));
    await fetch("/api/admin/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    router.refresh();
  }

  async function remove(c: Cat) {
    if (confirmDel !== c.id) {
      setConfirmDel(c.id);
      setTimeout(() => setConfirmDel(null), 3000);
      return;
    }
    setConfirmDel(null);
    const res = await fetch(`/api/admin/categories?id=${c.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg({ ok: false, text: data.message });
      return;
    }
    await load();
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* list */}
      <div>
        {loading ? (
          <div className="grid h-40 place-items-center">
            <Loader2 className="size-6 animate-spin text-neutral-300" />
          </div>
        ) : (
          <div className="space-y-3">
            {cats.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "flex flex-wrap items-center gap-4 rounded-2xl border p-4 transition",
                  c.active
                    ? "border-neutral-200/70 dark:border-white/[0.07]"
                    : "border-dashed border-neutral-300 opacity-60 dark:border-white/10"
                )}
              >
                <IconTile name={c.icon} tint={c.tint} size="md" />
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-black">{c.nameAr}</h4>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-neutral-400">
                    <span className="font-display">{c.nameEn}</span>
                    <span>•</span>
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-white/10">
                      {c.key}
                    </code>
                    <span>•</span>
                    <span>{c.productCount} منتج</span>
                    <span>•</span>
                    <span>ترتيب {c.sortOrder}</span>
                  </p>
                </div>
                <button
                  onClick={() => toggle(c)}
                  aria-label={c.active ? "إخفاء" : "إظهار"}
                  className={cn(
                    "grid size-9 place-items-center rounded-full border transition",
                    c.active
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : "border-neutral-200 text-neutral-400 dark:border-white/10"
                  )}
                >
                  {c.active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                <button
                  onClick={() => remove(c)}
                  className={cn(
                    "grid h-9 place-items-center rounded-full border px-3 text-[10px] font-black transition",
                    confirmDel === c.id
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-neutral-200 text-neutral-400 hover:border-rose-300 hover:text-rose-500 dark:border-white/10"
                  )}
                >
                  {confirmDel === c.id ? "تأكيد الحذف؟" : <Trash2 className="size-4" />}
                </button>
              </div>
            ))}
            {cats.length === 0 && (
              <p className="py-12 text-center text-sm font-bold text-neutral-400">
                لا توجد أقسام — أنشئ أول قسم من النموذج المجاور.
              </p>
            )}
          </div>
        )}
      </div>

      {/* create form */}
      <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
        <h4 className="flex items-center gap-2 text-sm font-black">
          <FolderPlus className="size-4 text-accent" />
          قسم جديد
        </h4>

        <div className="mt-4 space-y-3">
          <div>
            <label className={labelCls}>الاسم بالعربية *</label>
            <input
              className={inputCls}
              placeholder="مثال: ألعاب وشحن"
              value={form.nameAr}
              onChange={(e) => set("nameAr", e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>الاسم بالإنجليزية *</label>
            <input
              className={inputCls}
              dir="ltr"
              placeholder="Games & Topup"
              value={form.nameEn}
              onChange={(e) => set("nameEn", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>المعرّف (اختياري)</label>
              <input
                className={inputCls}
                dir="ltr"
                placeholder="games"
                value={form.key}
                onChange={(e) =>
                  set("key", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                }
              />
            </div>
            <div>
              <label className={labelCls}>الترتيب</label>
              <input
                className={inputCls}
                dir="ltr"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>الأيقونة</label>
            <div
              className="grid max-h-36 grid-cols-6 gap-2 overflow-y-auto rounded-2xl border border-neutral-200 p-3 dark:border-white/10"
              data-lenis-prevent
            >
              {ICON_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("icon", k)}
                  title={k}
                  className={cn(
                    "grid aspect-square place-items-center rounded-xl border transition",
                    form.icon === k
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-neutral-200 text-neutral-400 hover:border-neutral-400 dark:border-white/10"
                  )}
                >
                  <ProductIcon name={k} className="size-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>اللون</label>
            <div className="flex flex-wrap gap-2">
              {TINT_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("tint", k)}
                  aria-label={k}
                  className={cn(
                    "grid size-9 place-items-center rounded-full transition",
                    TINTS[k].solid,
                    form.tint === k
                      ? "scale-110 ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900"
                      : "opacity-50 hover:opacity-90"
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
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black",
                msg.ok
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-rose-500/10 text-rose-500"
              )}
            >
              {msg.ok ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
              {msg.text}
            </p>
          )}

          <button
            onClick={create}
            disabled={busy || !form.nameAr || !form.nameEn}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-xs font-black text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <FolderPlus className="size-4" />}
            إنشاء القسم
          </button>
        </div>
      </div>
    </div>
  );
}
