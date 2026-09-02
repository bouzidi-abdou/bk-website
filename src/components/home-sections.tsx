import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  LogIn,
  PackageCheck,
} from "lucide-react";
import DiscordIcon from "./discord-icon";
import { DISCORD_INVITE_URL } from "@/lib/utils";

const STEPS = [
  {
    n: "01",
    icon: LogIn,
    title: "سجّل حسابك",
    text: "ادخل عبر ديسكورد بضغطة واحدة واحصل على حساب وملف شخصي ومحفظة.",
  },
  {
    n: "02",
    icon: CreditCard,
    title: "اختر وادفع",
    text: "استخدم البطاقة البنكية أو BK COIN مع ملخص واضح قبل تأكيد الطلب.",
  },
  {
    n: "03",
    icon: PackageCheck,
    title: "تابع واستلم",
    text: "تُفتح تذكرة تلقائياً وتتابع الطلب وتتواصل مع الإدارة حتى الاستلام.",
  },
];

export function HowSection() {
  return (
    <section id="how" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-1.5 text-[10px] font-black text-neutral-500 dark:border-white/10 dark:text-neutral-400">
            <span className="size-1.5 rounded-full bg-accent" />
            كيف تعمل المنصة؟
          </span>
          <h2 className="mt-5 text-3xl font-black md:text-4xl">
            ثلاث خطوات فقط <span className="text-accent">من الدخول للاستلام</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            رحلة شراء مختصرة وواضحة، مصممة لتعمل بسلاسة على الهاتف والحاسوب.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {STEPS.map(({ n, icon: Icon, title, text }) => (
            <div
              key={n}
              className="group relative overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white p-7 transition-all duration-500 hover:-translate-y-2 hover:border-accent/40 hover:shadow-[0_28px_60px_-28px_rgba(88,101,242,0.45)] dark:border-white/[0.07] dark:bg-neutral-900/70"
            >
              {/* big number sitting behind the content */}
              <span
                aria-hidden
                className="pointer-events-none absolute -top-6 -end-2 select-none font-display text-[7rem] font-bold leading-none text-neutral-900/[0.045] transition-all duration-500 group-hover:scale-110 group-hover:text-accent/15 dark:text-white/[0.05]"
              >
                {n}
              </span>
              {/* hover glow */}
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-16 -start-10 size-40 rounded-full bg-accent/0 blur-3xl transition-all duration-700 group-hover:bg-accent/25"
              />

              <div className="relative">
                <span className="grid size-14 place-items-center rounded-2xl bg-neutral-900 text-white shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:bg-accent group-hover:shadow-accent/40 dark:bg-white dark:text-neutral-900 dark:group-hover:bg-accent dark:group-hover:text-white">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-6 text-lg font-black transition-colors duration-300 group-hover:text-accent">
                  {title}
                </h3>
                <p className="mt-2.5 text-[13px] leading-7 text-neutral-500 dark:text-neutral-400">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Lightweight platform callout: useful links, no background image or motion. */
export function CTASection() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-14 text-center text-white dark:bg-black md:py-18">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          One account. One platform.
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-[1.3] md:text-4xl">
          ابدأ بالمتجر، تابع الأخبار، وخصّص ملفك من مكان واحد
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-neutral-400">
          العضوية تمنحك توثيقاً بطابع BK، خصومات فعلية، أولوية دعم، ومظاهر
          اختيارية لا تُحمّل على صفحات المتجر العامة.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/store"
            className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-black text-neutral-900 transition hover:-translate-y-0.5"
          >
            فتح المتجر
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <Link
            href="/account#appearance"
            className="rounded-full border border-white/15 px-7 py-3.5 text-xs font-black text-neutral-200 transition hover:border-white/40"
          >
            العضوية والمظهر
          </Link>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-xs font-black text-white transition hover:bg-accent-dark"
          >
            <DiscordIcon className="size-3.5" />
            مجتمع ديسكورد
          </a>
        </div>
      </div>
    </section>
  );
}
