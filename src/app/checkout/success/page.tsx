import Link from "next/link";
import { ArrowLeft, CheckCircle2, Package } from "lucide-react";
import DiscordIcon from "@/components/discord-icon";

export const dynamic = "force-dynamic";

export const metadata = { title: "تم الدفع بنجاح — BK MARKET" };

export default function CheckoutSuccessPage() {
  return (
    <section className="flex min-h-[80vh] items-center justify-center px-4 pt-32 pb-20">
      <div className="w-full max-w-md rounded-[2rem] border border-neutral-200/80 bg-white p-10 text-center shadow-2xl dark:border-white/[0.08] dark:bg-neutral-900">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/40">
          <CheckCircle2 className="size-10" />
        </div>
        <h1 className="mt-6 text-2xl font-black">تم الدفع بنجاح 🎉</h1>
        <p className="mt-3 text-sm leading-8 text-neutral-500 dark:text-neutral-400">
          استلمنا دفعتك بنجاح وتم تسجيل طلبك تلقائياً. سيصلك المنتج عبر رسالة
          خاصة وتذكرة في سيرفر الديسكورد خلال دقائق.
        </p>

        <div className="mt-7 flex gap-3">
          <Link
            href="/account"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-sm font-black text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
          >
            <Package className="size-4" />
            تتبّع طلباتي
          </Link>
          <Link
            href="/store"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-3.5 text-sm font-black transition hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            المتجر
            <ArrowLeft className="size-4" />
          </Link>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-[11px] font-bold text-neutral-400">
          <DiscordIcon className="size-3.5 text-accent" />
          تأكد من فتح الرسائل الخاصة (DMs) لاستلام الطلب
        </p>
      </div>
    </section>
  );
}
