import { DatabaseZap } from "lucide-react";

/** Shown only when the database is unreachable — never blocks the page. */
export default function DbBanner({
  title = "المتجر قيد التهيئة مؤقتاً",
  sub = "تعذّر الاتصال بقاعدة البيانات — عد بعد قليل. إن كنت صاحب الموقع، افتح /api/health للتشخيص الفوري.",
}: {
  title?: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto mt-8 max-w-2xl px-4">
      <div className="flex items-start gap-4 rounded-2xl border border-amber-400/40 bg-amber-400/[0.08] p-4.5 text-start">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-500">
          <DatabaseZap className="size-5" />
        </span>
        <div>
          <p className="text-sm font-black text-amber-600 dark:text-amber-400">
            {title}
          </p>
          <p className="mt-1 text-xs leading-5.5 font-bold text-amber-600/70 dark:text-amber-400/70">
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}
