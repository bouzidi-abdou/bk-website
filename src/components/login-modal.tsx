"use client";

import { Package, ShieldCheck, X, Zap } from "lucide-react";
import DiscordIcon from "./discord-icon";

export default function LoginModal({
  open,
  onClose,
  next,
  configured,
  title = "سجّل دخولك عبر ديسكورد",
  subtitle = "تسجيل الدخول مطلوب لإتمام أي عملية شراء في BK MARKET",
}: {
  open: boolean;
  onClose: () => void;
  next: string;
  configured: boolean;
  title?: string;
  subtitle?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
      data-lenis-prevent
    >
      <div className="absolute inset-0 bg-neutral-950/55 backdrop-blur-md" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="card-enter relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white p-7 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-8"
      >
        <button
          onClick={onClose}
          aria-label="إغلاق"
          className="absolute end-4 top-4 grid size-9 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/25">
          <DiscordIcon className="size-8" />
        </div>
        <h3 className="text-center text-xl font-black">{title}</h3>
        <p className="mt-2 text-center text-sm leading-6 text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>

        <ul className="mt-6 space-y-3 text-sm">
          {[
            { icon: Zap, text: "استلام سريع وربط الطلب بحسابك" },
            { icon: Package, text: "تتبّع الطلبات والتذاكر من مكان واحد" },
            { icon: ShieldCheck, text: "جلسة آمنة ومشفرة" },
          ].map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>

        <a
          href={`/api/auth/discord?next=${encodeURIComponent(next)}`}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-accent/25 transition hover:bg-accent-dark"
        >
          <DiscordIcon className="size-5" />
          متابعة عبر Discord
        </a>

        {!configured && (
          <p className="mt-4 rounded-xl bg-neutral-100 px-4 py-2.5 text-center text-[11px] leading-5 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            وضع المعاينة — سيُستخدم حساب تجريبي حتى يتم ضبط مفاتيح ديسكورد.
          </p>
        )}
      </div>
    </div>
  );
}
