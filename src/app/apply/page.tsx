import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { trackVisit } from "@/lib/track";
import ApplicationsBoard from "@/components/applications-board";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التقديمات والتوظيف — BK MARKET",
  description:
    "قدّم على المناصب المتاحة في BK MARKET — كن بائعاً معتمداً وانشر منتجاتك داخل المتجر بلوحة تحكم خاصة وشارة بائع موثّق.",
};

export default async function ApplyPage() {
  await trackVisit("/apply");

  return (
    <section className="relative overflow-hidden pb-24 pt-32 md:pt-40">
      <div className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_45%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-24 start-1/2 size-[320px] -translate-x-1/2 rounded-full bg-accent/10 blur-[90px]" />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-4 py-1.5 text-[11px] font-black text-neutral-500 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
            <Briefcase className="size-3.5 text-accent" />
            BK MARKET CAREERS
          </span>
          <h1 className="mt-5 text-3xl font-black md:text-5xl">
            التقديمات <span className="shine-text font-display">والتوظيف</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-neutral-500 dark:text-neutral-400">
            انضم لفريق BK MARKET رسمياً — قدّم طلبك، وافق على الشروط، وسيراجع
            الفريق طلبك ويتواصل معك داخل الموقع.
          </p>
        </div>

        <div className="mt-12">
          <ApplicationsBoard />
        </div>
      </div>
    </section>
  );
}
