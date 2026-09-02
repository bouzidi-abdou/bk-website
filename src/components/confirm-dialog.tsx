"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reusable confirmation modal rendered in a portal so it always covers the
 * whole page, regardless of the parent's overflow or stacking context.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  tone = "accent",
  icon,
  children,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "accent" | "danger" | "success";
  icon?: ReactNode;
  children?: ReactNode;
  busy?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onClose]);

  if (!mounted || !open) return null;

  const toneCls =
    tone === "danger"
      ? "bg-rose-500 hover:bg-rose-600"
      : tone === "success"
        ? "bg-emerald-500 hover:bg-emerald-600"
        : "bg-accent hover:bg-accent-dark";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4"
      onClick={() => !busy && onClose()}
      data-lenis-prevent
    >
      <div className="fixed inset-0 bg-neutral-950/60 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-enter relative z-10 my-auto w-full max-w-md overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900"
      >
        <div className="flex items-start gap-4 p-6 pb-4">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl",
              tone === "danger"
                ? "bg-rose-500/10 text-rose-500"
                : tone === "success"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-accent/10 text-accent"
            )}
          >
            {icon ?? <TriangleAlert className="size-6" />}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black leading-6">{title}</h3>
            {description && (
              <p className="mt-1.5 text-[12px] leading-6 text-neutral-500 dark:text-neutral-400">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={() => !busy && onClose()}
            aria-label="إغلاق"
            className="grid size-8 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </div>

        {children && <div className="px-6 pb-4">{children}</div>}

        <div className="flex gap-3 border-t border-neutral-100 p-4 dark:border-white/[0.06]">
          <button
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black text-white transition disabled:opacity-60",
              toneCls
            )}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-2xl border border-neutral-200 px-6 text-xs font-black transition hover:bg-neutral-50 disabled:opacity-60 dark:border-white/10 dark:hover:bg-white/5"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
