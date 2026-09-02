"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { sfx } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export default function CancelOrder({ orderId }: { orderId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function run(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3500);
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الإلغاء");
      sfx.cancel();
      setConfirming(false);
      router.refresh();
    } catch (e) {
      sfx.error();
      setErr(e instanceof Error ? e.message : "تعذّر الإلغاء");
      setTimeout(() => setErr(null), 4000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={run}
        disabled={busy}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-black transition disabled:opacity-60",
          confirming
            ? "border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-500/25"
            : "border-neutral-200 text-neutral-400 hover:border-rose-300 hover:text-rose-500 dark:border-white/10"
        )}
      >
        {busy ? (
          <Loader2 className="size-3 animate-spin" />
        ) : confirming ? (
          <TriangleAlert className="size-3" />
        ) : (
          <X className="size-3" />
        )}
        {confirming ? "تأكيد الإلغاء؟" : "إلغاء الطلب"}
      </button>
      {err && (
        <p className="absolute end-0 top-full mt-1.5 whitespace-nowrap rounded-lg bg-rose-500/10 px-2.5 py-1 text-[9px] font-black text-rose-500">
          {err}
        </p>
      )}
    </div>
  );
}
