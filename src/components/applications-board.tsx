"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock,
  Loader2,
  Lock,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import DiscordIcon from "./discord-icon";
import ProductIcon from "./product-icon";
import { TINTS, cn } from "@/lib/utils";

type AppType = {
  id: string;
  key: string;
  title: string;
  subtitle: string | null;
  description: string;
  icon: string;
  tint: string;
  terms: string[];
  open: boolean;
  closedNote: string | null;
};

type Mine = {
  id: string;
  code: string;
  typeId: string;
  status: string;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "قيد المراجعة",
    cls: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  },
  accepted: {
    label: "مقبول",
    cls: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  },
  rejected: {
    label: "مرفوض",
    cls: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
  },
};

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-900";
const labelCls =
  "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function ApplicationsBoard() {
  const [types, setTypes] = useState<AppType[]>([]);
  const [mine, setMine] = useState<Mine[]>([]);
  const [guest, setGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AppType | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    nickname: "",
    location: "",
    age: "",
    hobbies: "",
    productTypes: "",
    experience: "",
    contact: "",
    note: "",
    agree: false,
  });
  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      setTypes(data.types ?? []);
      setMine(data.mine ?? []);
      setGuest(Boolean(data.guest));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (!active) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, typeId: active.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الإرسال");
      setMsg({
        ok: true,
        text: `تم إرسال طلبك بنجاح — رقم الطلب ${data.application.code}. سيتواصل معك الفريق قريباً.`,
      });
      setForm({
        fullName: "",
        nickname: "",
        location: "",
        age: "",
        hobbies: "",
        productTypes: "",
        experience: "",
        contact: "",
        note: "",
        agree: false,
      });
      await load();
      setTimeout(() => setActive(null), 1800);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  /* ------------------------------ form view ------------------------------ */
  if (active) {
    const t = TINTS[active.tint] ?? TINTS.violet;
    return (
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => {
            setActive(null);
            setMsg(null);
          }}
          className="mb-5 flex items-center gap-2 text-xs font-black text-neutral-400 transition hover:text-accent"
        >
          <ArrowLeft className="size-3.5 rotate-180" />
          رجوع لقائمة التقديمات
        </button>

        <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white dark:border-white/[0.07] dark:bg-neutral-900/70">
          <div className={cn("flex items-center gap-4 bg-gradient-to-br p-6", t.tile)}>
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/70 dark:bg-neutral-900/60">
              <ProductIcon name={active.icon} className="size-7" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black">{active.title}</h2>
              {active.subtitle && (
                <p className="mt-0.5 text-[11px] font-bold opacity-70">
                  {active.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="p-6">
            {active.description && (
              <p className="text-[13px] leading-7 text-neutral-600 dark:text-neutral-300">
                {active.description}
              </p>
            )}

            {active.terms.length > 0 && (
              <div className="mt-5 rounded-2xl border border-neutral-200/70 p-4 dark:border-white/10">
                <p className="flex items-center gap-2 text-xs font-black">
                  <CircleAlert className="size-4 text-accent" />
                  الشروط والأحكام
                </p>
                <ul className="mt-3 space-y-2">
                  {active.terms.map((term, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-[11px] font-bold leading-6 text-neutral-600 dark:text-neutral-300"
                    >
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-accent/10 text-[8px] font-black text-accent">
                        {i + 1}
                      </span>
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>الاسم الكامل *</label>
                <input
                  className={inputCls}
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="اسمك الحقيقي"
                />
              </div>
              <div>
                <label className={labelCls}>اللقب / الاسم المستعار</label>
                <input
                  className={inputCls}
                  value={form.nickname}
                  onChange={(e) => set("nickname", e.target.value)}
                  placeholder="كيف تحب أن نناديك"
                />
              </div>
              <div>
                <label className={labelCls}>مكان الإقامة</label>
                <input
                  className={inputCls}
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="الدولة / المدينة"
                />
              </div>
              <div>
                <label className={labelCls}>العمر</label>
                <input
                  className={inputCls}
                  dir="ltr"
                  inputMode="numeric"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 2))}
                  placeholder="20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>الهوايات والاهتمامات</label>
                <input
                  className={inputCls}
                  value={form.hobbies}
                  onChange={(e) => set("hobbies", e.target.value)}
                  placeholder="مثال: تصميم، برمجة، ألعاب"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>نوع المنتجات التي ستقدّمها *</label>
                <input
                  className={inputCls}
                  value={form.productTypes}
                  onChange={(e) => set("productTypes", e.target.value)}
                  placeholder="مثال: بطاقات هدايا، اشتراكات، خدمات تصميم"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>خبرتك السابقة</label>
                <textarea
                  className={cn(inputCls, "min-h-24 resize-y leading-7")}
                  value={form.experience}
                  onChange={(e) => set("experience", e.target.value)}
                  placeholder="اذكر خبرتك في البيع الرقمي أو أي متاجر عملت معها"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>وسيلة تواصل إضافية</label>
                <input
                  className={inputCls}
                  value={form.contact}
                  onChange={(e) => set("contact", e.target.value)}
                  placeholder="تيليجرام / بريد / رقم (اختياري)"
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>ملاحظات إضافية</label>
                <textarea
                  className={cn(inputCls, "min-h-20 resize-y leading-7")}
                  value={form.note}
                  onChange={(e) => set("note", e.target.value)}
                  placeholder="أي شيء تود إخبار الفريق به"
                />
              </div>

              <button
                onClick={() => set("agree", !form.agree)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-4 text-start transition sm:col-span-2",
                  form.agree
                    ? "border-accent bg-accent/[0.06]"
                    : "border-neutral-200 dark:border-white/10"
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md border-2 transition",
                    form.agree
                      ? "border-accent bg-accent text-white"
                      : "border-neutral-300 dark:border-white/20"
                  )}
                >
                  {form.agree && <Check className="size-3" />}
                </span>
                <span className="text-[11px] font-black leading-6">
                  أوافق على جميع الشروط والأحكام المذكورة أعلاه، وأتحمّل مسؤولية
                  صحة البيانات المقدّمة.
                </span>
              </button>

              {msg && (
                <p
                  className={cn(
                    "flex items-start gap-2 rounded-2xl px-4 py-3 text-[11px] font-black leading-6 sm:col-span-2",
                    msg.ok
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-500"
                  )}
                >
                  {msg.ok ? (
                    <Check className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  )}
                  {msg.text}
                </p>
              )}

              <button
                onClick={submit}
                disabled={busy || !form.agree || !form.fullName.trim()}
                className="flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-black text-white transition hover:bg-neutral-700 disabled:opacity-50 sm:col-span-2 dark:bg-white dark:text-neutral-900"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                إرسال الطلب
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ list view ------------------------------ */
  return (
    <div>
      {guest && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/25 bg-accent/[0.05] p-5">
          <p className="text-xs font-black leading-6">
            سجّل دخولك عبر ديسكورد لتتمكن من إرسال طلب التقديم ومتابعة حالته.
          </p>
          <a
            href="/api/auth/discord?next=/apply"
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-black text-white transition hover:bg-accent-dark"
          >
            <DiscordIcon className="size-4" />
            تسجيل الدخول
          </a>
        </div>
      )}

      {mine.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-black">طلباتي السابقة</h2>
          <div className="space-y-2">
            {mine.map((m) => {
              const st = STATUS_META[m.status] ?? STATUS_META.pending;
              const type = types.find((t) => t.id === m.typeId);
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-200/70 p-4 dark:border-white/[0.07]"
                >
                  <span className="font-display text-xs font-bold text-neutral-400">
                    {m.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-black">
                    {type?.title ?? "تقديم"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black ring-1 ring-inset",
                      st.cls
                    )}
                  >
                    {st.label}
                  </span>
                  <span className="text-[10px] font-bold text-neutral-400">
                    {new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
                      new Date(m.createdAt)
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {types.map((t) => {
          const tint = TINTS[t.tint] ?? TINTS.violet;
          return (
            <div
              key={t.id}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-[1.75rem] border bg-white transition duration-300 dark:bg-neutral-900/70",
                t.open
                  ? "border-neutral-200/80 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-lg dark:border-white/[0.07] dark:hover:border-white/15"
                  : "border-dashed border-neutral-300 opacity-75 dark:border-white/10"
              )}
            >
              <div className={cn("flex items-start gap-4 bg-gradient-to-br p-6", tint.tile)}>
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/70 dark:bg-neutral-900/60">
                  <ProductIcon name={t.icon} className="size-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-black">{t.title}</h3>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-black ring-1 ring-inset",
                        t.open
                          ? "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
                          : "bg-neutral-500/15 text-neutral-600 ring-neutral-500/25 dark:text-neutral-300"
                      )}
                    >
                      {t.open ? "مفتوح" : "مغلق"}
                    </span>
                  </div>
                  {t.subtitle && (
                    <p className="mt-1 text-[11px] font-bold opacity-75">
                      {t.subtitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <p className="line-clamp-3 flex-1 text-[12px] leading-6 text-neutral-500 dark:text-neutral-400">
                  {t.description}
                </p>

                {t.terms.length > 0 && (
                  <p className="mt-4 flex items-center gap-2 text-[10px] font-black text-neutral-400">
                    <CircleAlert className="size-3.5" />
                    {t.terms.length} شروط يجب الموافقة عليها
                  </p>
                )}

                {t.open ? (
                  <button
                    onClick={() => {
                      setActive(t);
                      setMsg(null);
                    }}
                    disabled={guest}
                    className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-xs font-black text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
                  >
                    {guest ? <Lock className="size-3.5" /> : <Send className="size-3.5" />}
                    {guest ? "سجّل دخولك للتقديم" : "قدّم الآن"}
                  </button>
                ) : (
                  <div className="mt-5">
                    <button
                      disabled
                      className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-neutral-200 py-3.5 text-xs font-black text-neutral-500 dark:bg-white/10 dark:text-neutral-400"
                    >
                      <X className="size-3.5" />
                      التقديم مغلق حالياً
                    </button>
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-bold text-neutral-400">
                      <Clock className="size-3" />
                      {t.closedNote || "سيُعاد فتح التقديم قريباً — تابع الأخبار"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {types.length === 0 && (
          <div className="rounded-3xl border border-dashed border-neutral-300 py-16 text-center md:col-span-2 dark:border-white/10">
            <p className="text-sm font-black">لا توجد تقديمات متاحة حالياً</p>
            <p className="mt-2 text-xs text-neutral-400">
              تابع صفحة الأخبار لمعرفة فتح التقديمات الجديدة.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
