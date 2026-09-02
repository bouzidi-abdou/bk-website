import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldAlert, Store } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { resolveSeller } from "@/lib/seller";
import { getCategories } from "@/lib/categories";
import { trackVisit } from "@/lib/track";
import SellerDashboard from "@/components/seller-dashboard";
import { SellerBadge } from "@/components/verified-badge";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة البائع — BK MARKET" };

export default async function SellerPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect(`/api/auth/discord?next=${encodeURIComponent("/seller")}`);
  }

  const { seller } = await resolveSeller(session);
  await trackVisit("/seller");

  if (!seller) {
    return (
      <section className="flex min-h-[80vh] items-center justify-center px-4 pt-24">
        <div className="max-w-md rounded-[2rem] border border-neutral-200/80 bg-white p-10 text-center shadow-xl dark:border-white/[0.08] dark:bg-neutral-900/70">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-400/10 text-amber-500">
            <ShieldAlert className="size-8" />
          </span>
          <h1 className="mt-6 text-xl font-black">لوحة البائعين</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            هذه اللوحة مخصصة للبائعين المعتمدين فقط. يمكنك التقديم للانضمام
            لبرنامج البائعين والحصول على شارة بائع موثّق ولوحة نشر خاصة.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/apply"
              className="rounded-full bg-neutral-900 px-7 py-3 text-xs font-black text-white dark:bg-white dark:text-neutral-900"
            >
              التقديم كبائع
            </Link>
            <Link
              href="/"
              className="rounded-full border border-neutral-200 px-7 py-3 text-xs font-black dark:border-white/10"
            >
              الرئيسية
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const categories = await getCategories();

  return (
    <section className="relative overflow-hidden pb-24 pt-32 md:pt-40">
      <div className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_65%_40%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-24 end-[15%] size-[300px] rounded-full bg-emerald-400/10 blur-[90px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.35em] text-neutral-400">
              <Store className="size-3.5 text-emerald-500" />
              SELLER DASHBOARD
            </p>
            <h1 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-black md:text-4xl">
              لوحة <span className="shine-text font-display">البائع</span>
              <SellerBadge className="size-7" />
            </h1>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
            بائع معتمد — @{session.username}
          </span>
        </div>

        <div className="mt-8">
          <SellerDashboard
            categories={categories.map((c) => ({ key: c.key, ar: c.ar }))}
          />
        </div>
      </div>
    </section>
  );
}
