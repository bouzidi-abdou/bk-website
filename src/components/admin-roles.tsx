"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Loader2,
  Plus,
  Search,
  Shield,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import ProductIcon, { ICONS } from "./product-icon";
import RoleBadge from "./role-badge";
import { cn } from "@/lib/utils";

type Role = {
  id: string;
  key: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  members: number;
};

type Member = {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  roleIds: string[];
};

const COLORS = ["amber", "rose", "blue", "violet", "emerald", "slate"];
const COLOR_BG: Record<string, string> = {
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  slate: "bg-slate-500",
};
const ICON_KEYS = Object.keys(ICONS);

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-900";
const labelCls = "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    key: "",
    icon: "Shield",
    color: "violet",
    sortOrder: "100",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      setRoles(data.roles ?? []);
      setMembers(data.members ?? []);
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
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الإنشاء");
      setMsg({ ok: true, text: `تم إنشاء رتبة ${data.role.name}` });
      setForm((f) => ({ ...f, name: "", key: "" }));
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(userId: string, roleId: string, has: boolean) {
    setMembers((l) =>
      l.map((m) =>
        m.userId === userId
          ? {
              ...m,
              roleIds: has
                ? m.roleIds.filter((r) => r !== roleId)
                : [...m.roleIds, roleId],
            }
          : m
      )
    );
    await fetch("/api/admin/roles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        roleId,
        action: has ? "remove" : "add",
      }),
    });
    void load();
  }

  async function removeRole(id: string) {
    if (confirmDel !== id) {
      setConfirmDel(id);
      setTimeout(() => setConfirmDel(null), 3000);
      return;
    }
    setConfirmDel(null);
    await fetch(`/api/admin/roles?id=${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = q.trim()
    ? members.filter(
        (m) =>
          m.username.toLowerCase().includes(q.toLowerCase()) ||
          m.name.toLowerCase().includes(q.toLowerCase())
      )
    : members;

  if (loading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* members + assignment */}
      <div>
        <div className="relative mb-4">
          <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن عضو لمنحه رتبة…"
            className={cn(inputCls, "ps-11")}
          />
        </div>

        <div className="max-h-[520px] space-y-3 overflow-y-auto" data-lenis-prevent>
          {filtered.map((m) => (
            <div
              key={m.userId}
              className="rounded-2xl border border-neutral-200/70 p-4 dark:border-white/[0.07]"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.avatar}
                  alt=""
                  loading="lazy"
                  className="size-10 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-xs font-black">{m.name}</b>
                  <span className="text-[10px] font-bold text-neutral-400">
                    @{m.username}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {roles.map((r) => {
                  const has = m.roleIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggle(m.userId, r.id, has)}
                      className={cn(
                        "transition",
                        has ? "opacity-100" : "opacity-35 hover:opacity-70"
                      )}
                    >
                      <RoleBadge role={r} size="sm" />
                    </button>
                  );
                })}
                {roles.length === 0 && (
                  <span className="text-[10px] font-bold text-neutral-400">
                    أنشئ رتبة أولاً من النموذج المجاور
                  </span>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-xs font-bold text-neutral-400">
              لا يوجد أعضاء مطابقون.
            </p>
          )}
        </div>
      </div>

      {/* role manager */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
          <h4 className="flex items-center gap-2 text-sm font-black">
            <Shield className="size-4 text-accent" />
            رتبة جديدة
          </h4>

          <div className="mt-4 space-y-3">
            <div>
              <label className={labelCls}>الاسم *</label>
              <input
                className={inputCls}
                placeholder="OWNER"
                maxLength={30}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>المعرّف</label>
                <input
                  className={inputCls}
                  dir="ltr"
                  placeholder="owner"
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
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => set("color", c)}
                    className={cn(
                      "grid size-9 place-items-center rounded-full transition",
                      COLOR_BG[c],
                      form.color === c
                        ? "scale-110 ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900"
                        : "opacity-50"
                    )}
                  >
                    {form.color === c && <Check className="size-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* preview */}
            {form.name && (
              <div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.04]">
                <p className="mb-2 text-[9px] font-black text-neutral-400">معاينة</p>
                <RoleBadge
                  role={{
                    key: "preview",
                    name: form.name,
                    icon: form.icon,
                    color: form.color,
                  }}
                />
              </div>
            )}

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
              disabled={busy || !form.name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-xs font-black text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              إنشاء الرتبة
            </button>
          </div>
        </div>

        {/* existing roles */}
        <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
          <h4 className="text-sm font-black">الرتب الحالية</h4>
          <div className="mt-3 space-y-2">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                <RoleBadge role={r} size="sm" />
                <span className="flex-1 text-[9px] font-bold text-neutral-400">
                  {r.members} عضو
                </span>
                <button
                  onClick={() => removeRole(r.id)}
                  className={cn(
                    "rounded-lg px-2 py-1 text-[9px] font-black transition",
                    confirmDel === r.id
                      ? "bg-rose-500 text-white"
                      : "text-neutral-300 hover:text-rose-500"
                  )}
                >
                  {confirmDel === r.id ? "تأكيد" : <Trash2 className="size-3.5" />}
                </button>
              </div>
            ))}
            {roles.length === 0 && (
              <p className="py-6 text-center text-[10px] font-bold text-neutral-400">
                لا توجد رتب بعد.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
