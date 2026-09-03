"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  Headset,
  Package,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Users,
} from "lucide-react";
import DiscordIcon from "./discord-icon";
import CountUp from "./count-up";
import { DISCORD_INVITE_URL, TINTS, cn } from "@/lib/utils";

type Cat = { key: string; ar: string; en: string; icon: string; tint: string };

const EASE = [0.16, 1, 0.3, 1] as const;

export type LiveStats = {
  visits: number;
  users: number;
  orders: number;
  products: number;
};

const STAT_CARDS = [
  { key: "visits", icon: Eye, label: "زيارة حيّة", tint: "blue" },
  { key: "users", icon: Users, label: "عضو مسجّل", tint: "violet" },
  { key: "orders", icon: ShoppingBag, label: "طلب فعلي", tint: "emerald" },
  { key: "products", icon: Package, label: "منتج متاح", tint: "amber" },
] as const;

export default function Hero({
  stats,
  categories,
}: {
  stats: LiveStats;
  categories: Cat[];
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 55, damping: 18 });
  const sy = useSpring(my, { stiffness: 55, damping: 18 });

  const bgX = useTransform(sx, (v) => v * 18);
  const bgY = useTransform(sy, (v) => v * 14);

  return (
    <section
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      className="relative overflow-hidden pb-14 pt-40 md:pt-52"
    >
      <div className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_72%_58%_at_50%_30%,black,transparent)]" />
        <motion.div
          style={{ x: bgX, y: bgY }}
          className="absolute -top-40 start-[10%] size-[520px] rounded-full bg-accent/14 blur-[100px] dark:bg-accent/18"
        />
        <div className="absolute top-1/3 end-[2%] size-[360px] rounded-full bg-indigo-400/12 blur-[90px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.08, ease: EASE }}
          className="mt-9 font-display text-[11px] uppercase tracking-[0.4em] text-neutral-400"
        >
          Welcome  to
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 64, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.14, ease: EASE }}
          className="shine-text mt-4 font-display text-[14vw] font-bold uppercase leading-[0.98] tracking-tight sm:text-7xl lg:text-[6.4rem]"
        >
          BK MARKET
        </motion.h1>

        

        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          className="mx-auto mt-8 max-w-2xl text-2xl font-black leading-snug md:text-[2.25rem]"
        >
          متجر رقمي فاخر{" "}
          <span className="relative inline-block text-accent">
            لكل احتياجاتك الإلكترونية
            <svg
              className="absolute -bottom-2 start-0 w-full"
              height="8"
              viewBox="0 0 200 8"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d="M2 6 Q 60 0 100 4 T 198 3"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="opacity-55"
              />
            </svg>
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.38, ease: EASE }}
          className="mx-auto mt-6 max-w-xl text-sm leading-8 text-neutral-500 dark:text-neutral-400 md:text-base"
        >
          فيزات وبطاقات هدايا، اشتراكات بريميوم لكل المنصات المشهورة، حسابات
          قديمة نادرة، نيترو وبوستات، وخدمات برمجة وتصميم احترافية — بأسعار
          تحت الجملة وتسليم أسرع مما تتخيل.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.46, ease: EASE }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/store"
            className="group relative flex items-center gap-3 overflow-hidden rounded-full bg-neutral-900 px-9 py-4.5 text-sm font-black text-white shadow-xl shadow-neutral-900/20 transition hover:-translate-y-1 hover:shadow-2xl dark:bg-white dark:text-neutral-900 dark:shadow-white/10"
          >
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-black/15" />
            تصفّح المتجر
            <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1.5" />
          </Link>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-full border border-neutral-300 px-8 py-4.5 text-sm font-black transition hover:-translate-y-1 hover:border-accent hover:bg-accent hover:text-white dark:border-white/15 dark:hover:border-accent"
          >
            <DiscordIcon className="size-4.5 text-accent transition group-hover:text-white" />
            انضم لسيرفر الديسكورد
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.54, ease: EASE }}
          className="mt-12 flex flex-wrap items-center justify-center gap-2.5"
        >
          {categories.slice(0, 6).map((c) => {
            const t = TINTS[c.tint] ?? TINTS.violet;
            return (
              <Link
                key={c.key}
                href={`/store?cat=${c.key}`}
                className="group flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/70 px-4 py-2.5 text-[11px] font-black text-neutral-600 backdrop-blur transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-neutral-300"
              >
                <Package className={cn("size-3.5 transition", t.text)} />
                {c.ar}
              </Link>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.62 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-bold text-neutral-500 dark:text-neutral-400"
        >
          <span className="flex items-center gap-2">
            <span className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400" />
              ))}
            </span>
            تقييم 4.9 من عملائنا
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-500" /> ضمان استبدال
          </span>
          <span className="flex items-center gap-2">
            <Truck className="size-4 text-accent" /> تسليم خلال دقائق
          </span>
          <span className="flex items-center gap-2">
            <Headset className="size-4 text-indigo-500" /> دعم 24/7
          </span>
        </motion.div>

      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.95, delay: 0.68, ease: EASE }}
        className="mx-auto mt-20 max-w-4xl px-4 sm:px-6"
      >
        <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white/85 shadow-[0_24px_60px_-30px_rgba(12,12,20,0.18)] backdrop-blur dark:border-white/[0.07] dark:bg-neutral-900/75">
          <div className="flex items-center justify-center gap-2 border-b border-neutral-100 py-2.5 dark:border-white/[0.06]">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            <span className="font-display text-[9px] uppercase tracking-[0.32em] text-neutral-400">
              Live Statistics
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STAT_CARDS.map(({ key, icon: Icon, label, tint }) => {
              const t = TINTS[tint] ?? TINTS.violet;
              return (
                <div
                  key={key}
                  className="border-b border-neutral-100 px-4 py-7 text-center last:border-b-0 odd:border-e md:border-b-0 md:odd:border-e-0 md:border-e dark:border-white/[0.06]"
                >
                  <span
                    className={cn(
                      "mx-auto grid size-10 place-items-center rounded-xl bg-gradient-to-br",
                      t.tile
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <p className="font-display mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                    <CountUp to={stats[key]} />
                  </p>
                  <p className="mt-1.5 text-[10px] font-bold text-neutral-400">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}