import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldAlert, Ticket } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import AdminTickets from "@/components/admin-tickets";
import DiscordIcon from "@/components/discord-icon";

export const dynamic = "force-dynamic";
export const metadata = { title: "التذاكر — BK MARKET" };

export default async function AdminTicketsPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect(`/api/auth/discord?next=${encodeURIComponent("/admin/tickets")}`);
  }

  if (!(await isAdminUser(session.discordId))) {
    return (
      <section className="flex min-h-[80vh] items-center justify-center px-4 pt-24">
        <div className="max-w-md rounded-[2rem] border border-neutral-200/80 bg-white p-10 text-center shadow-xl dark:border-white/[0.08] dark:bg-neutral-900/70">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <ShieldAlert className="size-8" />
          </span>
          <h1 className="mt-6 text-xl font-black">منطقة محظورة</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            صفحة التذاكر مخصصة لفريق الإدارة فقط.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-neutral-900 px-7 py-3 text-xs font-black text-white dark:bg-white dark:text-neutral-900"
          >
            العودة للرئيسية
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden pb-24 pt-40 md:pt-44">
      <div className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_65%_40%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-24 end-[15%] size-[300px] rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.35em] text-neutral-400">
              <Ticket className="size-3.5 text-accent" />
              SUPPORT TICKETS
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              نظام <span className="shine-text font-display">التذاكر</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
              <DiscordIcon className="size-3.5" />@{session.username}
            </span>
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs font-black transition hover:border-accent hover:text-accent dark:border-white/10"
            >
              لوحة الإدارة
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <AdminTickets />
        </div>
      </div>
    </section>
  );
}
