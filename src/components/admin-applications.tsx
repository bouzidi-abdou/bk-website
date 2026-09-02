"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Briefcase,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import DiscordIcon from "./discord-icon";
import ProductIcon, { ICONS } from "./product-icon";
import { SellerBadge } from "./verified-badge";
import { TINTS, cn } from "@/lib/utils";

type App = {
  id: string;
  code: string;
  status: string;
  fullName: string;
  nickname: string | null;
  location: string | null;
  age: string | null;
  hobbies: string | null;
  productTypes: string | null;
  experience: string | null;
  contact: string | null;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  typeTitle: string;
  typeKey: string;
  username: string;
  globalName: string | null;
  displayName: string | null;
  discordId: string;
  avatarUrl: string;
  seller: boolean;
};

type AppType = {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  icon: string;
  tint: string;
  open: boolean;
  closedNote: string | null;
  submissions: number;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-amber-500/10 text-amber-500 ring-amber-500/20" },
  accepted: { label: "مقبول", cls: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" },
  rejected: { label: "مرفوض", cls: "bg-rose-500/10 text-rose-500 ring-rose-500/20" },
};

const ICON_KEYS = Object.keys(ICONS);
const TINT_KEYS = Object.keys(TINTS);

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition focus:border-accent dark:border-white/10 dark:bg-neutral-900";
const labelCls = "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function AdminApplications() {
  const [apps, setApps] = useState<App[]>([]);
  const [types, setTypes] = useState<AppType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"apps" | "types">("apps");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    key: "",
    subtitle: "",
    description: "",
    terms: "",
    icon: "Briefcase",
    tint: "violet",
    grantsRole: "none",
    sortOrder: "100",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([
        fetch("/api/admin/applications").then((r) => r.json()),
        fetch("/api/admin/application-types").then((r) => r.json()),
      ]);
      setApps(a.applications ?? []);
      setTypes(t.types ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, status: string) {
    setApps((l) => l.map((a) => (a.id === id ? { ...a, status } : a)));
    await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await load();
  }

  async function removeApp(id: string) {
    setApps((l) => l.filter((a) => a.id !== id));
    await fetch(`/api/admin/applications?id=${id}`, { method: "DELETE" });
  }

  async function toggleType(t: AppType) {
    setTypes((l) => l.map((x) => (x.id === t.id ? { ...x, open: !x.open } : x)));
    await fetch("/api/admin/application-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, open: !t.open }),
    });
    await load();
  }

  async function createType() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/application-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الإنشاء");
      setMsg({ ok: true, text: `تم إنشاء قسم "${data.type.title}"` });
      setForm((f) => ({ ...f, title: "", key: "", subtitle: "", description: "", terms: "" }));
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  async function removeType(id: string) {
    if (confirmDel !== id) {
      setConfirmDel(id);
      setTimeout(() => setConfirmDel(null), 3000);
      return;
    }
    setConfirmDel(null);
    await fetch(`/api/admin/application-types?id=${id}`, { method: "DELETE" });
    await load();
  }

  if (loading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);
  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* view switch */}
      <div className="flex gap-2">
        {([
          { id: "apps" as const, label: `الطلبات (${apps.length})`, Icon: Briefcase },
          { id: "types" as const, label: `أقسام التقديم (${types.length})`, Icon: Plus },
        ]).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-black transition",
              view === id
                ? "border-accent bg-accent/[0.08] text-accent"
                : "border-neutral-200 text-neutral-400 dark:border-white/10"
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {view === "apps" ? (
        <>
          <div className="flex flex-wrap gap-2">
            {([
              { id: "pending" as const, label: `قيد المراجعة (${pendingCount})` },
              { id: "accepted" as const, label: "مقبولة" },
              { id: "rejected" as const, label: "مرفوضة" },
              { id: "all" as const, label: "الكل" },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-[10px] font-black transition",
                  filter === f.id
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                    : "border-neutral-200 text-neutral-500 dark:border-white/10"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm font-bold text-neutral-400">
                لا توجد طلبات في هذه الحالة.
              </p>
            )}

            {filtered.map((a) => {
              const st = STATUS_META[a.status] ?? STATUS_META.pending;
              const expanded = open === a.id;
              return (
                <div
                  key={a.id}
                  className="overflow-hidden rounded-2xl border border-neutral-200/70 dark:border-white/[0.07]"
                >
                  <button
                    onClick={() => setOpen(expanded ? null : a.id)}
                    className="flex w-full flex-wrap items-center gap-4 p-4 text-start transition hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.avatarUrl}
                      alt=""
                      loading="lazy"
                      className="size-12 shrink-0 rounded-full object-cover ring-2 ring-accent/30"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="truncate text-sm font-black">{a.fullName}</b>
                        {a.seller && <SellerBadge className="size-4" />}
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[9px] font-black ring-1 ring-inset",
                            st.cls
                          )}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-neutral-400">
                        <span className="font-display">{a.code}</span>
                        <span>•</span>
                        <span>{a.typeTitle}</span>
                        <span>•</span>
                        <span>@{a.username}</span>
                        <span>•</span>
                        <span>
                          {new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
                            new Date(a.createdAt)
                          )}
                        </span>
                      </p>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-neutral-100 bg-neutral-50/60 p-5 dark:border-white/[0.06] dark:bg-white/[0.02]">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["اللقب", a.nickname],
                          ["الإقامة", a.location],
                          ["العمر", a.age],
                          ["الهوايات", a.hobbies],
                          ["نوع المنتجات", a.productTypes],
                          ["وسيلة تواصل", a.contact],
                        ].map(([k, v]) =>
                          v ? (
                            <div
                              key={k as string}
                              className="rounded-xl bg-white p-3 dark:bg-neutral-900"
                            >
                              <p className="text-[9px] font-black text-neutral-400">{k}</p>
                              <p className="mt-1 break-words text-[11px] font-bold">{v}</p>
                            </div>
                          ) : null
                        )}
                      </div>

                      {a.experience && (
                        <div className="mt-3 rounded-xl bg-white p-3 dark:bg-neutral-900">
                          <p className="text-[9px] font-black text-neutral-400">الخبرة</p>
                          <p className="mt-1 whitespace-pre-line break-words text-[11px] font-bold leading-6">
                            {a.experience}
                          </p>
                        </div>
                      )}
                      {a.note && (
                        <div className="mt-3 rounded-xl bg-white p-3 dark:bg-neutral-900">
                          <p className="text-[9px] font-black text-neutral-400">ملاحظات</p>
                          <p className="mt-1 whitespace-pre-line break-words text-[11px] font-bold leading-6">
                            {a.note}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href={`https://discord.com/users/${a.discordId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-[10px] font-black text-white transition hover:bg-accent-dark"
                        >
                          <DiscordIcon className="size-3.5" />
                          حساب ديسكورد
                          <ExternalLink className="size-3" />
                        </a>
                        <a
                          href={`/profile/${a.username}`}
                          target="_blank"
                          className="rounded-xl border border-neutral-200 px-3.5 py-2 text-[10px] font-black text-neutral-500 transition hover:border-accent hover:text-accent dark:border-white/10"
                        >
                          الملف الشخصي
                        </a>
                        {a.status !== "accepted" && (
                          <button
                            onClick={() => decide(a.id, "accepted")}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-[10px] font-black text-white transition hover:bg-emerald-600"
                          >
                            <Check className="size-3.5" />
                            قبول ومنح رتبة بائع
                          </button>
                        )}
                        {a.status !== "rejected" && (
                          <button
                            onClick={() => decide(a.id, "rejected")}
                            className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3.5 py-2 text-[10px] font-black text-white transition hover:bg-rose-600"
                          >
                            <X className="size-3.5" />
                            رفض
                          </button>
                        )}
                        <button
                          onClick={() => removeApp(a.id)}
                          className="grid size-8 place-items-center rounded-xl border border-neutral-200 text-neutral-400 transition hover:border-rose-300 hover:text-rose-500 dark:border-white/10"
                          aria-label="حذف"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {types.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex flex-wrap items-center gap-4 rounded-2xl border p-4",
                  t.open
                    ? "border-neutral-200/70 dark:border-white/[0.07]"
                    : "border-dashed border-neutral-300 opacity-70 dark:border-white/10"
                )}
              >
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br",
                    (TINTS[t.tint] ?? TINTS.violet).tile
                  )}
                >
                  <ProductIcon name={t.icon} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-black">{t.title}</h4>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-neutral-400">
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-white/10">
                      {t.key}
                    </code>
                    <span>•</span>
                    <span>{t.submissions} طلب</span>
                    <span>•</span>
                    <span className={t.open ? "text-emerald-500" : "text-neutral-400"}>
                      {t.open ? "مفتوح" : "مغلق"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => toggleType(t)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-black transition",
                    t.open
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : "border-neutral-200 text-neutral-400 dark:border-white/10"
                  )}
                >
                  {t.open ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  {t.open ? "إغلاق التقديم" : "فتح التقديم"}
                </button>
                <button
                  onClick={() => removeType(t.id)}
                  className={cn(
                    "grid h-8 place-items-center rounded-full border px-3 text-[9px] font-black transition",
                    confirmDel === t.id
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-neutral-200 text-neutral-400 hover:text-rose-500 dark:border-white/10"
                  )}
                >
                  {confirmDel === t.id ? "تأكيد" : <Trash2 className="size-3.5" />}
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
            <h4 className="flex items-center gap-2 text-sm font-black">
              <Plus className="size-4 text-accent" />
              قسم تقديم جديد
            </h4>
            <div className="mt-4 space-y-3">
              <div>
                <label className={labelCls}>العنوان *</label>
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="التقديم كمشرف"
                />
              </div>
              <div>
                <label className={labelCls}>وصف مختصر</label>
                <input
                  className={inputCls}
                  value={form.subtitle}
                  onChange={(e) => set("subtitle", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>الوصف الكامل</label>
                <textarea
                  className={cn(inputCls, "min-h-20 resize-y leading-6")}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>الشروط (كل شرط في سطر)</label>
                <textarea
                  className={cn(inputCls, "min-h-24 resize-y leading-6")}
                  value={form.terms}
                  onChange={(e) => set("terms", e.target.value)}
                  placeholder={"الالتزام بالتواجد يومياً\nعدم إفشاء بيانات العملاء"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>المعرّف</label>
                  <input
                    className={inputCls}
                    dir="ltr"
                    value={form.key}
                    onChange={(e) =>
                      set("key", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>الرتبة الممنوحة</label>
                  <select
                    className={cn(inputCls, "cursor-pointer appearance-none")}
                    value={form.grantsRole}
                    onChange={(e) => set("grantsRole", e.target.value)}
                  >
                    <option value="none">بدون</option>
                    <option value="seller">بائع</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>الأيقونة</label>
                <div
                  className="grid max-h-28 grid-cols-6 gap-2 overflow-y-auto rounded-2xl border border-neutral-200 p-3 dark:border-white/10"
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

              <div>
                <label className={labelCls}>اللون</label>
                <div className="flex flex-wrap gap-2">
                  {TINT_KEYS.map((k) => (
                    <button
                      key={k}
                      onClick={() => set("tint", k)}
                      className={cn(
                        "grid size-8 place-items-center rounded-full transition",
                        TINTS[k].solid,
                        form.tint === k ? "scale-110 ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900" : "opacity-50"
                      )}
                    >
                      {form.tint === k && <Check className="size-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {msg && (
                <p
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black",
                    msg.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  )}
                >
                  {msg.ok ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
                  {msg.text}
                </p>
              )}

              <button
                onClick={createType}
                disabled={busy || !form.title.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-xs font-black text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                إنشاء القسم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
