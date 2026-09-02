import Link from "next/link";
import {
  BadgeCheck,
  Briefcase,
  Headset,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Logo from "./logo";
import DiscordIcon from "./discord-icon";
import BkCoin from "./bk-coin";
import { DISCORD_INVITE_URL } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: Zap, label: "تسليم فوري" },
  { icon: ShieldCheck, label: "ضمان استبدال" },
  { icon: BadgeCheck, label: "بائعون معتمدون" },
  { icon: Headset, label: "دعم على مدار الساعة" },
];

const LINKS = [
  { href: "/store", label: "المتجر" },
  { href: "/news", label: "الأخبار والإعلانات" },
  { href: "/apply", label: "التقديم والتوظيف" },
  { href: "/exchange", label: "مركز الصرف" },
  { href: "/account", label: "حسابي وطلباتي" },
  { href: "/account#appearance", label: "العضوية والمظهر" },
];

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200/70 bg-neutral-950 text-neutral-300 dark:border-white/[0.06] dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr_1fr]">
          {/* brand */}
          <div>
            <Logo href="/" />
            <p className="mt-6 max-w-md text-sm leading-8 text-neutral-400">
              <b className="text-neutral-200">BK MARKET</b> متجر رقمي متخصص في
              بيع المنتجات الإلكترونية الأصلية: بطاقات الهدايا والفيزا
              الافتراضية، اشتراكات المنصات العالمية، الحسابات المميزة، وخدمات
              البرمجة والتصميم. نعتمد على مورّدين موثوقين وبائعين معتمدين
              لضمان جودة كل عملية شراء، مع نظام طلبات وتذاكر يحفظ حقوق العميل
              من لحظة الدفع حتى الاستلام.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-2 sm:max-w-md">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-[11px] font-bold text-neutral-300"
                >
                  <Icon className="size-3.5 shrink-0 text-accent" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* links */}
          <div>
            <h4 className="font-display text-[10px] uppercase tracking-[0.28em] text-neutral-500">
              روابط المنصة
            </h4>
            <ul className="mt-6 space-y-3.5 text-sm">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-neutral-400 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* community + currency */}
          <div>
            <h4 className="font-display text-[10px] uppercase tracking-[0.28em] text-neutral-500">
              المجتمع
            </h4>
            <p className="mt-6 text-sm leading-7 text-neutral-400">
              كل الطلبات والاستفسارات تُدار داخل الموقع عبر التذاكر، ومجتمعنا
              الرسمي على ديسكورد للإعلانات والعروض.
            </p>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2.5 rounded-full bg-accent px-6 py-3 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-accent-dark"
            >
              <DiscordIcon className="size-4" />
              انضم لسيرفر الديسكورد
            </a>

            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-4">
              <BkCoin className="size-9 shrink-0" />
              <div>
                <p className="text-xs font-black text-amber-400">BK COIN</p>
                <p className="mt-0.5 text-[10px] font-bold leading-5 text-neutral-400">
                  عملة المتجر الرسمية — 100 BK = 1 دولار
                </p>
              </div>
            </div>

            <Link
              href="/apply"
              className="mt-4 flex items-center gap-2 text-[11px] font-black text-neutral-400 transition hover:text-white"
            >
              <Briefcase className="size-3.5 text-accent" />
              انضم لفريق البائعين المعتمدين
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-[11px] text-neutral-500 md:flex-row">
          <p>© 2026 BK MARKET — جميع الحقوق محفوظة.</p>
          <p className="text-center md:text-end">
            متجر مستقل غير تابع لأي علامة تجارية مذكورة.
          </p>
        </div>
      </div>
    </footer>
  );
}
