"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  House,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 pt-24">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white p-10 text-center shadow-2xl dark:border-white/[0.08] dark:bg-neutral-900/80">
        <span className="relative mx-auto grid size-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-rose-500/10" />
          <TriangleAlert className="relative size-8" />
        </span>

        <h1 className="mt-6 text-xl font-black">حدث خطأ في الخادم</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-500 dark:text-neutral-400">
          المشكلة من جهة الخادم وليست من جهازك. غالباً متغيّر بيئة مفقود أو أن
          قاعدة البيانات لم تُهيّأ بعد على الاستضافة.
        </p>

        <a
          href="/api/health"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-neutral-100 px-4 py-3 text-xs font-black text-neutral-600 transition hover:bg-neutral-200 dark:bg-white/[0.05] dark:text-neutral-300 dark:hover:bg-white/10"
        >
          <Activity className="size-4 text-emerald-500" />
          صفحة التشخيص المباشر /api/health
        </a>

        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-xs font-black text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
          >
            <RotateCcw className="size-3.5" />
            حاول مجدداً
          </button>
          <Link
            href="/"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-3.5 text-xs font-black transition hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            <House className="size-3.5" />
            الرئيسية
          </Link>
        </div>

        {error.digest && (
          <p className="mt-4 font-display text-[10px] tracking-widest text-neutral-300 dark:text-neutral-600">
            REF: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
