"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  Store,
} from "lucide-react";
import DiscordIcon from "./discord-icon";
import LoginModal from "./login-modal";
import { cn } from "@/lib/utils";

type MeState = {
  user: {
    id: string;
    discordId: string;
    username: string;
    globalName: string | null;
    avatar: string;
  } | null;
  configured: boolean;
  isAdmin?: boolean;
} | null;

export default function AuthButton({
  className,
  mobile = false,
}: {
  className?: string;
  mobile?: boolean;
}) {
  const [me, setMe] = useState<MeState>(null);
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ user: null, configured: false }));
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!me) {
    return (
      <div className="h-11 w-40 animate-pulse rounded-full bg-neutral-200/80 dark:bg-neutral-800/80" />
    );
  }

  if (!me.user) {
    return (
      <div className={cn("w-full", className)}>
        <button
          onClick={() => setLoginOpen(true)}
          className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-accent px-5 py-3 text-sm font-black text-white shadow-lg shadow-accent/25 transition hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-xl hover:shadow-accent/35 lg:w-auto"
        >
          <DiscordIcon className="size-4.5 transition-transform duration-500 group-hover:rotate-[360deg]" />
          دخول عبر ديسكورد
        </button>
        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          next={pathname || "/"}
          configured={me.configured}
        />
      </div>
    );
  }

  const u = me.user;

  if (mobile) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="mb-2 flex items-center gap-3 rounded-2xl bg-neutral-100/80 p-3 dark:bg-neutral-800/60">
          <Image
            src={u.avatar}
            alt=""
            width={42}
            height={42}
            className="size-10 shrink-0 rounded-full ring-2 ring-accent/60"
            unoptimized
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">
              {u.globalName || u.username}
            </p>
            <p className="truncate text-[10px] font-bold text-neutral-400">
              @{u.username}
            </p>
          </div>
        </div>

        {me.isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-2xl bg-accent/[0.08] px-4 py-3 text-sm font-black text-accent"
          >
            <LayoutDashboard className="size-4" />
            لوحة الإدارة
          </Link>
        )}
        <Link
          href={`/profile/${u.username}`}
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <CircleUserRound className="size-4 text-neutral-400" />
          ملفي الشخصي
        </Link>
        <Link
          href="/seller"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Store className="size-4 text-neutral-400" />
          لوحة البائع
        </Link>
        <Link
          href="/account"
          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Package className="size-4 text-neutral-400" />
          حسابي وطلباتي
        </Link>
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-500/10"
        >
          <LogOut className="size-4" />
          تسجيل الخروج
        </button>
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-full border border-neutral-200 bg-white/80 py-1.5 pe-3 ps-1.5 shadow-sm transition hover:border-neutral-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/80 dark:hover:border-neutral-700 lg:w-auto"
      >
        <span className="relative">
          <Image
            src={u.avatar}
            alt={u.username}
            width={34}
            height={34}
            className="rounded-full ring-2 ring-accent/50"
            unoptimized
          />
          <span className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full border-2 border-white bg-emerald-500 dark:border-neutral-900" />
        </span>
        <span className="max-w-[110px] truncate text-sm font-extrabold">
          {u.globalName || u.username}
        </span>
        <ChevronDown
          className={cn(
            "size-4 text-neutral-400 transition-transform duration-300",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
          <div className="card-enter absolute end-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-100/80 p-3 dark:bg-neutral-800/60">
              <Image
                src={u.avatar}
                alt=""
                width={42}
                height={42}
                className="rounded-full ring-2 ring-accent/60"
                unoptimized
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  {u.globalName || u.username}
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                  <DiscordIcon className="size-3 text-accent" />
                  @{u.username}
                </p>
              </div>
            </div>

            <div className="mt-2 space-y-1">
              {me.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl bg-accent/[0.08] px-3 py-2.5 text-sm font-black text-accent transition hover:bg-accent/15"
                >
                  <LayoutDashboard className="size-4" />
                  لوحة الإدارة
                </Link>
              )}
              <Link
                href={`/profile/${u.username}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <CircleUserRound className="size-4 text-neutral-400" />
                ملفي الشخصي
              </Link>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Package className="size-4 text-neutral-400" />
                حسابي
              </Link>
              <Link
                href="/seller"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Store className="size-4 text-neutral-400" />
                لوحة البائع
              </Link>
              <Link
                href="/account#orders"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <Package className="size-4 text-neutral-400" />
                طلباتي
              </Link>
              <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs text-neutral-400">
                <ShieldCheck className="size-4 text-emerald-500" />
                حساب موثّق عبر Discord
              </div>
            </div>

            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/";
              }}
              className="mt-1 flex w-full items-center gap-3 rounded-2xl border-t border-neutral-100 px-3 py-3 text-sm font-bold text-rose-500 transition hover:bg-rose-50 dark:border-neutral-800 dark:hover:bg-rose-500/10"
            >
              <LogOut className="size-4" />
              تسجيل الخروج
            </button>
          </div>
        )}
    </div>
  );
}
