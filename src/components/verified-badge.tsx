"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type BadgeTier = "basic" | "premium";

const LABEL: Record<BadgeTier, string> = {
  basic: "Basic Member",
  premium: "Premium Member",
};

/**
 * BK MARKET verification mark — filled circle + check, themed to the store.
 * The tooltip renders in a portal with fixed coordinates so it is always
 * perfectly centred above the badge and never clipped by overflow-hidden
 * parents (cards, banners…).
 */
export default function VerifiedBadge({
  tier = "basic",
  className,
  title,
  tooltip = true,
}: {
  tier?: BadgeTier;
  className?: string;
  title?: string;
  tooltip?: boolean;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  const premium = tier === "premium";
  const label = title ?? LABEL[tier];
  const gid = premium ? "bkVerifyGold" : "bkVerifySilver";

  function show() {
    if (!tooltip) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.top, left: r.left + r.width / 2 });
  }

  return (
    <>
      <span
        ref={ref}
        className={cn("relative inline-flex shrink-0 align-middle", className)}
        onMouseEnter={show}
        onMouseLeave={() => setPos(null)}
        onFocus={show}
        onBlur={() => setPos(null)}
        tabIndex={tooltip ? 0 : -1}
        aria-label={label}
      >
        <svg viewBox="0 0 24 24" className="size-full" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              {premium ? (
                <>
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="55%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#d4d4d8" />
                  <stop offset="55%" stopColor="#9ca3af" />
                  <stop offset="100%" stopColor="#6b7280" />
                </>
              )}
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="11" fill={`url(#${gid})`} />
          <circle
            cx="12"
            cy="12"
            r="11"
            fill="none"
            stroke="rgba(255,255,255,.35)"
            strokeWidth="1"
          />
          <path
            d="M10.6 15.6 7.2 12.2l1.5-1.5 1.9 1.9 4.7-4.7 1.5 1.5-6.2 6.2Z"
            fill="#fff"
          />
        </svg>
      </span>

      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: "fixed",
              top: pos.top - 8,
              left: pos.left,
              transform: "translate(-50%, -100%)",
            }}
            className="pointer-events-none z-[9999] block"
          >
            <span
              className={cn(
                "relative block whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-black text-white shadow-lg",
                premium ? "bg-amber-500" : "bg-neutral-800 dark:bg-neutral-700"
              )}
            >
              {label}
              <span
                className={cn(
                  "absolute -bottom-[3px] left-1/2 size-2 -translate-x-1/2 rotate-45",
                  premium ? "bg-amber-500" : "bg-neutral-800 dark:bg-neutral-700"
                )}
              />
            </span>
          </span>,
          document.body
        )}
    </>
  );
}

/** Seller badge — storefront mark for approved sellers. */
export function SellerBadge({
  className,
  title = "بائع معتمد",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 align-middle", className)}
      title={title}
      aria-label={title}
    >
      <svg viewBox="0 0 24 24" className="size-full" aria-hidden="true">
        <defs>
          <linearGradient id="bkSeller" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
        <path
          d="M12 1.6 3.4 5.1v6.2c0 5.2 3.6 9.7 8.6 11.1 5-1.4 8.6-5.9 8.6-11.1V5.1L12 1.6Z"
          fill="url(#bkSeller)"
        />
        <path
          d="M8.2 11.4h7.6M8.2 14.2h5"
          stroke="#fff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="8" r="1.7" fill="#fff" />
      </svg>
    </span>
  );
}

/** name + badge inline helper */
export function NameWithBadge({
  name,
  verified,
  tier = "basic",
  className,
  badgeClass = "size-3.5",
}: {
  name: string;
  verified?: boolean;
  tier?: BadgeTier;
  className?: string;
  badgeClass?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1", className)}>
      <span className="truncate">{name}</span>
      {verified && <VerifiedBadge tier={tier} className={badgeClass} />}
    </span>
  );
}
