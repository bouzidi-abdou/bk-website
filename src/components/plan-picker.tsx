"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Coins, Crown, Loader2, TriangleAlert } from "lucide-react";
import VerifiedBadge from "./verified-badge";
import ConfirmDialog from "./confirm-dialog";
import BkCoin from "./bk-coin";
import { PLANS } from "@/lib/effects";
import { formatCoins } from "@/lib/coins";
import { cn } from "@/lib/utils";

type Current = {
  verified: boolean;
  until: string | null;
  balance: string;
  plan: "free" | "basic" | "premium";
} | null;

export default function PlanPicker() {
  const [current, setCurrent] = useState<Current>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<"basic" | "premium" | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/verify");
      const data = await res.json();
      setCurrent(data.current);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function subscribe(plan: "basic" | "premium") {
    setConfirm(null);
    setBusy(plan);
    setMsg(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الاشتراك");
      setMsg({ ok: true, text: `تم تفعيل اشتراك ${PLANS[plan].name} 🎉` });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="grid h-32 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  const balance = Number(current?.balance ?? 0);

  return (
    <div>
      {current?.verified && current.until && (
        <p className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
          <Check className="size-4" />
          اشتراكك {current.plan === "premium" ? "PREMIUM" : "BASIC"} فعّال حتى{" "}
          {new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(
            new Date(current.until)
          )}
        </p>
      )}

      {msg && (
        <p
          className={cn(
            "mb-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-[11px] font-black",
            msg.ok
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-rose-500/10 text-rose-500"
          )}
        >
          {msg.ok ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}
          {msg.text}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(["basic", "premium"] as const).map((id) => {
          const p = PLANS[id];
          const isPremium = id === "premium";
          const active = current?.plan === id;
          const afford = balance >= p.priceCoins;

          return (
            <div
              key={id}
              className={cn(
                "relative overflow-hidden rounded-[1.5rem] border p-6 transition",
                isPremium
                  ? "border-amber-400/40 bg-gradient-to-br from-amber-400/[0.08] to-transparent"
                  : "border-neutral-200/80 dark:border-white/[0.07]"
              )}
            >
              {isPremium && (
                <span className="absolute end-4 top-4 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[9px] font-black text-white">
                  <Crown className="size-2.5" />
                  الأفضل قيمة
                </span>
              )}

              <div className="flex items-center gap-2.5">
                <VerifiedBadge tier={id} className="size-7" />
                <div>
                  <h3 className="font-display text-lg font-bold tracking-wide">
                    {p.name}
                  </h3>
                  <p className="text-[10px] font-bold text-neutral-400">
                    {p.days} يوماً
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span
                  className={cn(
                    "font-display text-3xl font-bold",
                    isPremium ? "text-amber-500" : "text-neutral-700 dark:text-neutral-200"
                  )}
                >
                  {formatCoins(p.priceCoins)}
                </span>
                <span className="text-xs font-black text-neutral-400">BK</span>
                <span className="text-[11px] font-bold text-neutral-400">
                  (${p.priceUsd.toFixed(2)})
                </span>
              </div>

              <ul className="mt-5 space-y-2.5">
                {p.perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2 text-[11px] font-bold leading-5 text-neutral-600 dark:text-neutral-300"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0",
                        isPremium ? "text-amber-500" : "text-emerald-500"
                      )}
                    />
                    {perk}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setConfirm(id)}
                disabled={busy === id || !afford}
                className={cn(
                  "mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black transition disabled:opacity-50",
                  isPremium
                    ? "bg-amber-500 text-white hover:-translate-y-0.5 hover:bg-amber-600"
                    : "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                )}
              >
                {busy === id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Coins className="size-4" />
                )}
                {active ? "تجديد الاشتراك" : "اشترك الآن"}
              </button>

              {!afford && (
                <p className="mt-2 text-center text-[9px] font-bold text-amber-500">
                  رصيدك {formatCoins(balance)} BK — تحتاج{" "}
                  {formatCoins(p.priceCoins - balance)} BK إضافية
                </p>
              )}
            </div>
          );
        })}
      </div>

      {confirm && (
        <ConfirmDialog
          open
          busy={busy === confirm}
          onClose={() => setConfirm(null)}
          onConfirm={() => subscribe(confirm)}
          tone={confirm === "premium" ? "success" : "accent"}
          icon={<VerifiedBadge tier={confirm} className="size-7" tooltip={false} />}
          title={`تأكيد الاشتراك في ${PLANS[confirm].name}`}
          description={`سيتم خصم المبلغ فوراً من محفظتك وتفعيل الاشتراك لمدة ${PLANS[confirm].days} يوماً.`}
          confirmLabel={`اشترك الآن — ${formatCoins(PLANS[confirm].priceCoins)} BK`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] px-4 py-3">
              <span className="flex items-center gap-2 text-[11px] font-black text-amber-600 dark:text-amber-400">
                <BkCoin className="size-4" />
                المبلغ المخصوم
              </span>
              <span className="font-display text-base font-bold text-amber-600 dark:text-amber-400">
                {formatCoins(PLANS[confirm].priceCoins)} BK
              </span>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 text-[11px] font-bold dark:bg-white/[0.04]">
              <span className="text-neutral-500 dark:text-neutral-400">
                رصيدك بعد الاشتراك
              </span>
              <span className="font-display">
                {formatCoins(Math.max(0, balance - PLANS[confirm].priceCoins))} BK
              </span>
            </div>

            <div className="rounded-2xl border border-neutral-200/70 p-4 dark:border-white/10">
              <p className="text-[11px] font-black">ما ستحصل عليه</p>
              <ul className="mt-2.5 space-y-2">
                {PLANS[confirm].perks.map((perk) => (
                  <li
                    key={perk}
                    className="flex items-start gap-2 text-[11px] font-bold leading-5 text-neutral-600 dark:text-neutral-300"
                  >
                    <Check
                      className={cn(
                        "mt-0.5 size-3.5 shrink-0",
                        confirm === "premium" ? "text-amber-500" : "text-emerald-500"
                      )}
                    />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
