"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Coins,
  Crown,
  Loader2,
  Lock,
  Layers,
  Palette,
  TriangleAlert,
} from "lucide-react";
import VerifiedBadge from "./verified-badge";
import { EFFECTS, FRAMES, type Cosmetic } from "@/lib/effects";
import { formatCoins } from "@/lib/coins";
import { cn } from "@/lib/utils";
import BkCoin from "./bk-coin";

type State = {
  guest: boolean;
  owned: string[];
  balance: string;
  plan: "free" | "basic" | "premium";
  activeEffect: string | null;
  activeFrame: string | null;
};

export default function CosmeticsStore({
  avatar,
  name,
  verified,
}: {
  avatar: string;
  name: string;
  verified: boolean;
}) {
  const [st, setSt] = useState<State | null>(null);
  const [tab, setTab] = useState<"frame" | "effect">("frame");
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);
  const [previewEffect, setPreviewEffect] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/cosmetics");
    const data = await res.json();
    setSt(data);
    setPreviewFrame(data.activeFrame ?? null);
    setPreviewEffect(data.activeEffect ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!st) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  const premium = st.plan === "premium";
  const list = tab === "frame" ? FRAMES : EFFECTS;
  const owns = (c: Cosmetic) =>
    c.price === 0 || st.owned.includes(c.id) || premium;

  const frameCls = FRAMES.find((f) => f.id === previewFrame)?.cls ?? "";
  const effectCls = EFFECTS.find((e) => e.id === previewEffect)?.cls ?? "";

  async function buy(c: Cosmetic) {
    setBusy(c.id);
    setMsg(null);
    try {
      const res = await fetch("/api/cosmetics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الشراء");
      setMsg({
        ok: true,
        text: data.free
          ? `${c.name} مجاني لأعضاء PREMIUM — تم إضافته`
          : `تم شراء ${c.name} بنجاح`,
      });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(null);
    }
  }

  async function apply() {
    setBusy("apply");
    setMsg(null);
    try {
      const res = await fetch("/api/cosmetics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: previewFrame, effect: previewEffect }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر التطبيق");
      setMsg({ ok: true, text: "تم تطبيق المظهر على ملفك الشخصي" });
      await load();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(null);
    }
  }

  const dirty =
    previewFrame !== st.activeFrame || previewEffect !== st.activeEffect;

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* ------------- live preview ------------- */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-white shadow-sm dark:border-white/[0.07] dark:bg-neutral-900/70">
          <div className="relative isolate z-0">
            <div
              className={cn(
                "relative h-40 overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-700 dark:from-neutral-800 dark:to-neutral-950",
                effectCls
              )}
            >
              <span className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-neutral-900" />
            </div>
          </div>

          <div className="relative z-10 px-5 pb-5">
            <div className="-mt-14 flex justify-center">
              <span className="relative z-20 inline-block rounded-full bg-white p-1 shadow-xl dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt=""
                  className={cn("block size-24 rounded-full object-cover", frameCls)}
                />
              </span>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-base font-black">
              <span className="truncate">{name}</span>
              {verified && (
                <VerifiedBadge tier={premium ? "premium" : "basic"} className="size-4" />
              )}
            </p>
            <p className="mt-1 text-center text-[10px] font-bold text-neutral-400">
              معاينة مباشرة لمظهر ملفك
            </p>

            <button
              onClick={apply}
              disabled={!dirty || busy === "apply"}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3 text-xs font-black text-white transition hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900"
            >
              {busy === "apply" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              {dirty ? "تطبيق المظهر" : "المظهر مطبَّق"}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] px-4 py-3">
          <span className="flex items-center gap-2 text-[11px] font-black text-amber-600 dark:text-amber-400">
            <BkCoin className="size-4" />
            رصيدك
          </span>
          <span className="font-display text-sm font-bold text-amber-600 dark:text-amber-400">
            {formatCoins(st.balance)} BK
          </span>
        </div>

        {premium && (
          <p className="mt-2 flex items-center gap-2 rounded-2xl bg-amber-400/10 px-4 py-2.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
            <Crown className="size-3.5" />
            عضو PREMIUM — كل التأثيرات مجانية لك
          </p>
        )}
      </div>

      {/* ------------- catalogue ------------- */}
      <div>
        <div className="flex gap-2">
          {([
            { id: "frame" as const, label: `الإطارات (${FRAMES.length})`, Icon: Palette },
            { id: "effect" as const, label: `التأثيرات (${EFFECTS.length})`, Icon: Layers },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-black transition",
                tab === id
                  ? "border-accent bg-accent/[0.08] text-accent"
                  : "border-neutral-200 text-neutral-400 dark:border-white/10"
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        <p className="mt-3 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-2.5 text-[10px] font-black text-neutral-500 dark:bg-white/[0.04] dark:text-neutral-400">
          <span>
            تمتلك {st.owned.length} من {FRAMES.length + EFFECTS.length} عنصر
          </span>
          <span className="text-accent">
            {premium ? "PREMIUM — الكل مفتوح" : "اشترك في PREMIUM لفتح الكل"}
          </span>
        </p>

        {msg && (
          <p
            className={cn(
              "mt-3 flex items-center gap-2 rounded-2xl px-4 py-3 text-[11px] font-black",
              msg.ok
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-rose-500/10 text-rose-500"
            )}
          >
            {msg.ok ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}
            {msg.text}
          </p>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {list.map((c) => {
            const has = owns(c);
            const selected =
              (c.category === "frame" ? previewFrame : previewEffect) === c.id ||
              (c.price === 0 &&
                !(c.category === "frame" ? previewFrame : previewEffect));
            return (
              <div
                key={c.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
                  selected
                    ? "border-accent bg-accent/[0.06] shadow-lg shadow-accent/10"
                    : "border-neutral-200/70 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md dark:border-white/[0.07] dark:hover:border-white/15"
                )}
              >
                {c.tier === "premium" && (
                  <span className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[8px] font-black text-amber-500">
                    <Crown className="size-2.5" />
                    PREMIUM
                  </span>
                )}

                <div className="flex items-center gap-3">
                  {/* mini preview */}
                  <div className="relative grid size-14 shrink-0 place-items-center">
                    {c.category === "effect" ? (
                      <span
                        className={cn(
                          "relative size-14 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-600 ring-1 ring-inset ring-white/10",
                          c.cls
                        )}
                      />
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={avatar}
                        alt=""
                        className={cn("cosmetic-preview size-12 rounded-full object-cover", c.cls)}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-xs font-black">{c.name}</b>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-neutral-400">
                      {c.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() =>
                      c.category === "frame"
                        ? setPreviewFrame(c.id === "frame-none" ? null : c.id)
                        : setPreviewEffect(c.id === "fx-none" ? null : c.id)
                    }
                    className="flex-1 rounded-xl border border-neutral-200 py-2 text-[10px] font-black text-neutral-500 transition hover:border-accent hover:text-accent dark:border-white/10"
                  >
                    معاينة
                  </button>

                  {has ? (
                    <span className="flex items-center gap-1 rounded-xl bg-emerald-500/10 px-3 py-2 text-[10px] font-black text-emerald-500">
                      <Check className="size-3" />
                      مملوك
                    </span>
                  ) : (
                    <button
                      onClick={() => buy(c)}
                      disabled={busy === c.id || st.guest}
                      className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-[10px] font-black text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                    >
                      {busy === c.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Coins className="size-3" />
                      )}
                      {formatCoins(c.price)}
                    </button>
                  )}
                </div>

                {!has && st.guest && (
                  <span className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-[1px] dark:bg-neutral-900/70">
                    <Lock className="size-5 text-neutral-400" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
