"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  CalendarDays,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import VerifiedBadge from "./verified-badge";
import RoleBadge from "./role-badge";
import { accent } from "@/lib/coins";
import { cn } from "@/lib/utils";

type Mini = {
  username: string;
  name: string;
  bio: string | null;
  avatar: string;
  bannerUrl: string | null;
  accentColor: string;
  location: string | null;
  website: string | null;
  verified: boolean;
  tier: "basic" | "premium";
  plan: string;
  roles: { key: string; name: string; icon: string; color: string }[];
  frameCls: string;
  effectCls: string;
  orders: number;
  joined: string;
};

/** tiny in-memory cache so hovering the same user twice is instant */
const cache = new Map<string, Mini | null>();

const CARD_W = 300;

export default function ProfilePreview({
  username,
  children,
  className,
}: {
  username: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [data, setData] = useState<Mini | null | undefined>(
    cache.get(username)
  );
  const anchorRef = useRef<HTMLSpanElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, r.left + r.width / 2 - CARD_W / 2),
      window.innerWidth - CARD_W - 12
    );
    // prefer below; flip above when there is no room
    const below = r.bottom + 10;
    const needed = 320;
    const top =
      window.innerHeight - r.bottom < needed && r.top > needed
        ? Math.max(12, r.top - needed - 4)
        : below;
    setPos({ top, left });
  }, []);

  const load = useCallback(async () => {
    if (cache.has(username)) {
      setData(cache.get(username));
      return;
    }
    try {
      const res = await fetch(`/api/profile/${encodeURIComponent(username)}`);
      const json = await res.json();
      const value = json?.found ? (json.profile as Mini) : null;
      cache.set(username, value);
      setData(value);
    } catch {
      cache.set(username, null);
      setData(null);
    }
  }, [username]);

  function show() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      place();
      setOpen(true);
      void load();
    }, 180);
  }

  function hide() {
    if (openTimer.current) clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (openTimer.current) clearTimeout(openTimer.current);
    },
    []
  );

  const a = data ? accent(data.accentColor) : accent("violet");

  const card =
    open && pos ? (
      <div
        style={{ top: pos.top, left: pos.left, width: CARD_W }}
        onMouseEnter={() => {
          if (closeTimer.current) clearTimeout(closeTimer.current);
        }}
        onMouseLeave={hide}
        className="fixed z-[9998] animate-[card-in_.22s_cubic-bezier(.16,1,.3,1)_both]"
      >
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900">
          {data === undefined ? (
            <div className="grid h-32 place-items-center">
              <Loader2 className="size-5 animate-spin text-neutral-300" />
            </div>
          ) : data === null ? (
            <p className="px-5 py-8 text-center text-xs font-bold text-neutral-400">
              هذا الملف غير متاح
            </p>
          ) : (
            <>
              {/* banner */}
              <div className="relative isolate z-0">
                <div
                  className={cn(
                    "relative h-16 overflow-hidden bg-gradient-to-br",
                    a.grad,
                    data.effectCls
                  )}
                >
                  {data.bannerUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={data.bannerUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="relative z-10 px-4 pb-4">
                <div className="-mt-8">
                  <span className="relative z-20 inline-block rounded-full bg-white p-0.5 shadow-lg dark:bg-neutral-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.avatar}
                      alt=""
                      className={cn(
                        "block size-14 rounded-full object-cover",
                        data.frameCls
                      )}
                    />
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  <b className="truncate text-sm font-black">{data.name}</b>
                  {data.verified && (
                    <VerifiedBadge tier={data.tier} className="size-4" />
                  )}
                </div>
                <p className="text-[10px] font-bold text-neutral-400">
                  @{data.username}
                </p>

                {data.roles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {data.roles.slice(0, 3).map((r) => (
                      <RoleBadge key={r.key} role={r} size="sm" />
                    ))}
                  </div>
                )}

                {data.bio && (
                  <p className="mt-2.5 line-clamp-2 text-[11px] leading-5 text-neutral-500 dark:text-neutral-400">
                    {data.bio}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold text-neutral-400">
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="size-3" />
                    {data.orders} طلب
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    {new Intl.DateTimeFormat("ar", {
                      year: "numeric",
                      month: "short",
                    }).format(new Date(data.joined))}
                  </span>
                  {data.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {data.location}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/profile/${data.username}`}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 py-2 text-[10px] font-black text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                  >
                    الملف الكامل
                    <ExternalLink className="size-3" />
                  </Link>
                  {data.website && (
                    <a
                      href={data.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="grid size-8 place-items-center rounded-xl border border-neutral-200 text-neutral-400 transition hover:border-accent hover:text-accent dark:border-white/10"
                    >
                      <Globe className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <span
        ref={anchorRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => {
          // tap on touch devices opens the card instead of navigating
          if (window.matchMedia("(hover: none)").matches) {
            e.preventDefault();
            e.stopPropagation();
            if (open) {
              setOpen(false);
            } else {
              place();
              setOpen(true);
              void load();
            }
          }
        }}
        className={cn("inline-flex cursor-pointer", className)}
      >
        {children}
      </span>
      {typeof document !== "undefined" && card
        ? createPortal(card, document.body)
        : null}
    </>
  );
}
