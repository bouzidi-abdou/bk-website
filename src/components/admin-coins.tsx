"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Coins,
  Loader2,
  Minus,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BkCoin from "./bk-coin";
import { coinsToUsd, formatCoins } from "@/lib/coins";

type Wallet = {
  id: string;
  username: string;
  globalName: string | null;
  discordId: string;
  avatar: string;
  balance: string;
};

type Ledger = {
  id: string;
  amount: string;
  kind: string;
  note: string | null;
  byAdmin: string | null;
  createdAt: string;
  username: string;
};

const KIND_LABEL: Record<string, string> = {
  topup: "شحن",
  deduct: "خصم",
  purchase: "شراء",
  refund: "استرجاع",
};

export default function AdminCoins() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState("100");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/coins");
      const data = await res.json();
      setWallets(data.wallets ?? []);
      setLedger(data.ledger ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function apply(sign: 1 | -1) {
    if (!target) return;
    const value = Number(amount) * sign;
    if (!Number.isFinite(value) || value === 0) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id, amount: value, note }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر التحديث");
      setMsg({
        ok: true,
        text: `${sign > 0 ? "تم شحن" : "تم خصم"} ${formatCoins(Math.abs(value))} BK COIN — الرصيد الآن ${formatCoins(data.balance)}`,
      });
      setNote("");
      await load();
      setTarget((t) => (t ? { ...t, balance: data.balance } : t));
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  const filtered = q.trim()
    ? wallets.filter(
        (w) =>
          w.username.toLowerCase().includes(q.toLowerCase()) ||
          (w.globalName ?? "").toLowerCase().includes(q.toLowerCase())
      )
    : wallets;

  const totalIssued = wallets.reduce((a, w) => a + Number(w.balance), 0);

  if (loading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* header stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-amber-400/15">
            <BkCoin className="size-7" />
          </span>
          <p className="font-display mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCoins(totalIssued)}
          </p>
          <p className="text-[11px] font-black text-neutral-500 dark:text-neutral-400">
            إجمالي BK COIN المتداولة
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
          <p className="font-display text-2xl font-bold">{wallets.length}</p>
          <p className="text-[11px] font-black text-neutral-500 dark:text-neutral-400">
            محفظة عضو
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
          <p className="font-display text-2xl font-bold">100 : 1</p>
          <p className="text-[11px] font-black text-neutral-500 dark:text-neutral-400">
            100 BK COIN = 1 دولار
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* wallet list */}
        <div>
          <div className="relative mb-4">
            <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن عضو…"
              className="w-full rounded-2xl border border-neutral-200 bg-white py-3 ps-11 pe-4 text-sm font-bold outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
            />
          </div>
          <div className="max-h-[420px] space-y-2 overflow-y-auto" data-lenis-prevent>
            {filtered.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setTarget(w);
                  setMsg(null);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition",
                  target?.id === w.id
                    ? "border-accent bg-accent/[0.06]"
                    : "border-neutral-200/70 hover:border-neutral-300 dark:border-white/[0.07]"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.avatar}
                  alt=""
                  loading="lazy"
                  className="size-10 shrink-0 rounded-full object-cover"
                />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-xs font-black">
                    {w.globalName || w.username}
                  </b>
                  <span className="text-[10px] font-bold text-neutral-400">
                    @{w.username}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1.5 text-[11px] font-black text-amber-500">
                  <Coins className="size-3" />
                  {formatCoins(w.balance)}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-10 text-center text-xs font-bold text-neutral-400">
                لا يوجد أعضاء مطابقون.
              </p>
            )}
          </div>
        </div>

        {/* action card */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
            <h4 className="text-sm font-black">شحن / خصم رصيد</h4>
            {!target ? (
              <p className="mt-3 text-xs leading-6 text-neutral-400">
                اختر عضواً من القائمة لتعديل رصيده.
              </p>
            ) : (
              <>
                <div className="mt-4 flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={target.avatar} alt="" className="size-9 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-xs font-black">
                      {target.globalName || target.username}
                    </b>
                    <span className="text-[10px] font-bold text-amber-500">
                      الرصيد: {formatCoins(target.balance)} BK (${coinsToUsd(Number(target.balance)).toFixed(2)})
                    </span>
                  </div>
                </div>

                <label className="mt-4 block text-[11px] font-black text-neutral-500">
                  المبلغ (BK COIN)
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  dir="ltr"
                  inputMode="decimal"
                  className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-center font-display text-lg font-bold outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
                />
                <div className="mt-2 flex gap-1.5">
                  {[100, 500, 1000, 2500, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className="flex-1 rounded-lg border border-neutral-200 py-1.5 font-display text-[10px] font-bold text-neutral-500 transition hover:border-accent hover:text-accent dark:border-white/10"
                    >
                      {v}
                    </button>
                  ))}
                </div>

                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ملاحظة (اختياري)"
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-bold outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
                />

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => apply(1)}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-xs font-black text-white transition hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    شحن
                  </button>
                  <button
                    onClick={() => apply(-1)}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 text-xs font-black text-white transition hover:bg-rose-600 disabled:opacity-60"
                  >
                    <Minus className="size-4" />
                    خصم
                  </button>
                </div>

                {msg && (
                  <p
                    className={cn(
                      "mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black",
                      msg.ok
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-rose-500/10 text-rose-500"
                    )}
                  >
                    {msg.ok ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
                    {msg.text}
                  </p>
                )}
              </>
            )}
          </div>

          {/* ledger */}
          <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
            <h4 className="text-sm font-black">آخر الحركات</h4>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto" data-lenis-prevent>
              {ledger.length === 0 && (
                <p className="py-6 text-center text-[10px] font-bold text-neutral-400">
                  لا توجد حركات بعد.
                </p>
              )}
              {ledger.map((t) => {
                const amt = Number(t.amount);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2 text-[10px] font-bold last:border-0 dark:border-white/[0.05]"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      <b className="text-neutral-700 dark:text-neutral-200">
                        @{t.username}
                      </b>
                      <span className="text-neutral-400"> · {KIND_LABEL[t.kind] ?? t.kind}</span>
                      {t.note && <span className="text-neutral-400"> · {t.note}</span>}
                    </span>
                    <span
                      className={cn(
                        "font-display shrink-0 font-bold",
                        amt >= 0 ? "text-emerald-500" : "text-rose-500"
                      )}
                    >
                      {amt >= 0 ? "+" : ""}
                      {formatCoins(amt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
