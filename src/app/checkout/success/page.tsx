import Link from "next/link";
import { ArrowLeft, CheckCircle2, Package, HeartHandshake, ShieldCheck } from "lucide-react";
import DiscordIcon from "@/components/discord-icon";

export const dynamic = "force-dynamic";

export const metadata = { title: "شكراً لثقتك بنا — BK MARKET" };

export default function CheckoutSuccessPage() {
  return (
    <section className="flex min-h-[85vh] items-center justify-center px-4 pt-32 pb-20">
      <div className="w-full max-w-lg rounded-[2.5rem] border border-neutral-200/80 bg-white p-8 sm:p-10 text-center shadow-2xl dark:border-white/[0.08] dark:bg-neutral-900">
        
        {/* أيقونة النجاح مع تأثيرات فخمة */}
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/30">
          <CheckCircle2 className="size-10" />
        </div>

        {/* عنوان رئيسي يعبر عن التقدير */}
        <h1 className="mt-6 font-display text-2xl font-black sm:text-3xl">
          أهلاً بك في عائلة <span className="text-accent">BK MARKET</span> 🎉
        </h1>

        {/* رسالة تقدير عميقة للزبون */}
        <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-600 dark:bg-white/[0.03] dark:text-neutral-300 sm:text-sm">
          <p className="font-bold text-neutral-800 dark:text-neutral-200">
            نحن نقدّر ثقتك الغالية فينا وبكل طلب اخترته من متجرنا.
          </p>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            تعاملنا معك ليس مجرد عملية بيع عادية، بل بداية شراكة وثقة دائمة. لقد تم تسجيل طلبك وعنايته بكل احترافية لضمان حصولك على أعلى قيمة وأفضل جودة تستحقها.
          </p>
        </div>

        {/* معلومات سريعة ومطمئنة */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs font-bold text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-500" /> طلب مؤمن ومضمون
          </span>
          <span className="flex items-center gap-1.5">
            <HeartHandshake className="size-4 text-accent" /> خدمة مخصصة لك
          </span>
        </div>

        {/* أزرار التنقل والتحكم */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/account"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-black text-white shadow-lg shadow-neutral-900/15 transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:shadow-white/10"
          >
            <Package className="size-4" />
            سجل طلباتي وتفاصيلها
          </Link>
          <Link
            href="/store"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-4 text-sm font-black transition hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            العودة للمتجر
            <ArrowLeft className="size-4" />
          </Link>
        </div>

        {/* تنبيه ديسكورد الراقي */}
        <div className="mt-6 border-t border-neutral-100 pt-5 dark:border-white/[0.06]">
          <p className="flex items-center justify-center gap-2 text-xs font-bold text-neutral-400">
            <DiscordIcon className="size-4 text-accent" />
            تأكد من فتح رسائل الديسكورد الخاصة (DMs) لاستلام مفتاح طلبك ورتبتك فوراً.
          </p>
        </div>

      </div>
    </section>
  );
}