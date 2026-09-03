"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Coins,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  Minus,
  Package,
  PartyPopper,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Timer,
  X,
  TriangleAlert,
  Sparkles,
  Heart,
  ChevronLeft,
  Award,
  Gift,
  Ticket,
  Rocket,
  Crown,
  BellRing,
} from "lucide-react";
import DiscordIcon from "./discord-icon";
import LoginModal from "./login-modal";
import IconTile from "./icon-tile";
import { sfx } from "@/lib/sounds";
import { cn } from "@/lib/utils";
import { formatCoins, usdToCoins } from "@/lib/coins";

type FlowProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  deliveryTime: string;
  icon: string;
  tint: string;
  imageUrl?: string | null;
  couponCode?: string | null;
  couponPercent?: number | null;
};

type Stage = "idle" | "checkout" | "processing" | "success" | "error";

const METHODS = [
  { id: "card", label: "بطاقة بنكية", sub: "فيزا / ماستركارد", icon: CreditCard },
  { id: "balance", label: "BK COIN", sub: "رصيد محفظتك", icon: Coins },
] as const;

const STEPS = [
  "التحقق من توفّر المنتج في المخزون",
  "تأكيد عملية الدفع بشكل آمن",
  "إنشاء تذكرة التسليم في الديسكورد",
];

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function BuyFlow({ product }: { product: FlowProduct }) {
  const [mounted, setMounted] = useState(false);
  const [me, setMe] = useState<{
    user: unknown;
    configured: boolean;
    balance?: string;
  } | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<string>("card");
  const [step, setStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [orderTotal, setOrderTotal] = useState("");
  const [copied, setCopied] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponOk, setCouponOk] = useState(false);
  const [rails, setRails] = useState<{
    stripe: boolean;
  } | null>(null);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch("/api/payment-methods")
      .then((r) => r.json())
      .then(setRails)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ user: null, configured: false }));
  }, []);

  useEffect(() => {
    if (stage === "idle") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [stage]);

  useEffect(() => {
    if (stage === "idle" || stage === "processing") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const subtotal = useMemo(() => product.price * qty, [product.price, qty]);
  const couponRate =
    couponOk && product.couponPercent ? product.couponPercent / 100 : 0;
  const discountValue = subtotal * couponRate;
  const total = Math.max(0, subtotal - discountValue);

  function startCheckout() {
    if (!me) return;
    if (!me.user) {
      setLoginOpen(true);
      return;
    }
    sfx.open();
    setStage("checkout");
  }

  async function payWithCard() {
    sfx.purchase();
    setStage("processing");
    setStep(1);
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || "تعذّر فتح بوابة الدفع");
      window.location.href = data.url;
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "تعذّر فتح بوابة الدفع");
      setStage("error");
      sfx.error();
    }
  }

  async function confirmOrder() {
    if (method === "card" && rails?.stripe) return payWithCard();
    sfx.purchase();
    setStage("processing");
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 780);
    const t2 = setTimeout(() => setStep(2), 1500);

    try {
      const req = fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: qty,
          paymentMethod: method,
          coupon: couponOk ? couponInput.trim().toUpperCase() : undefined,
        }),
      });
      const [res] = await Promise.all([req, delay(2100)]);
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "حدث خطأ غير متوقع");
      setOrderCode(data.order.code);
      setOrderTotal(data.order.total);
      setStage("success");
      sfx.success();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "حدث خطأ غير متوقع");
      setStage("error");
      sfx.error();
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
  }

  function close() {
    if (stage === "processing") return;
    setStage("idle");
  }

  const overlay =
    stage !== "idle" ? (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-contain p-0 sm:p-6"
        onClick={close}
        data-lenis-prevent
      >
        <div className="fixed inset-0 bg-white/75 backdrop-blur-md dark:bg-neutral-950/85" />

        <div
          onClick={(e) => e.stopPropagation()}
          className="card-enter relative z-10 my-auto flex min-h-full w-full flex-col border border-neutral-200/80 bg-white shadow-xl dark:border-white/10 dark:bg-neutral-900 sm:min-h-0 sm:max-w-lg sm:rounded-[2rem]"
        >
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-accent to-transparent" />

          {/* header */}
          <div className="flex items-center justify-between border-b border-neutral-200/70 px-6 py-4 dark:border-white/[0.06]">
            <div className="flex items-center gap-3">
              <IconTile name={product.icon} tint={product.tint} size="sm" glow />
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-black">
                  {stage === "success" && (
                    <Sparkles className="size-3.5 text-amber-500" />
                  )}
                  {stage === "success"
                    ? "شكراً لثقتك بنا"
                    : stage === "processing"
                      ? "جاري معالجة طلبك"
                      : stage === "error"
                        ? "تعذّر إتمام الطلب"
                        : "إتمام عملية الشراء"}
                </h3>
                <p className="line-clamp-1 text-[11px] font-bold text-neutral-400">
                  {product.name}
                </p>
              </div>
            </div>
            {stage !== "processing" && (
              <button
                onClick={close}
                aria-label="إغلاق"
                className="grid size-9 shrink-0 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-900/[0.06] hover:text-neutral-700 dark:hover:bg-white/10"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* ---------- CHECKOUT ---------- */}
            {stage === "checkout" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl border border-neutral-200/70 p-4 dark:border-white/10">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <IconTile name={product.icon} tint={product.tint} size="md" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-black">{product.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-emerald-500">
                      <Timer className="size-3.5" />
                      {product.deliveryTime}
                    </p>
                  </div>
                  <div className="text-end">
                    {product.oldPrice && (
                      <p className="text-[10px] font-bold text-neutral-400 line-through">
                        ${product.oldPrice.toFixed(2)}
                      </p>
                    )}
                    <p className="font-display text-lg font-bold">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-neutral-200/70 p-4 dark:border-white/10">
                  <span className="text-sm font-black">الكمية</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQty((v) => Math.max(1, v - 1))}
                      className="grid size-9 place-items-center rounded-full border border-neutral-200 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white dark:border-white/15 dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-900"
                      aria-label="تقليل"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="font-display w-6 text-center text-lg font-bold">
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty((v) => Math.min(10, v + 1))}
                      className="grid size-9 place-items-center rounded-full border border-neutral-200 transition hover:border-neutral-900 hover:bg-neutral-900 hover:text-white dark:border-white/15 dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-900"
                      aria-label="زيادة"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-sm font-black">طريقة الدفع</p>
                  <div className="grid grid-cols-2 gap-3">
                    {METHODS.map(({ id, label, sub, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setMethod(id)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-2xl border p-3.5 text-start transition",
                          method === id
                            ? "border-accent bg-accent/[0.08] ring-1 ring-accent/40"
                            : "border-neutral-200 hover:border-neutral-300 dark:border-white/10 dark:hover:border-white/20"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-5",
                            method === id ? "text-accent" : "text-neutral-400"
                          )}
                        />
                        <span className="min-w-0">
                          <b className="block text-xs font-black">{label}</b>
                          <span className="block truncate text-[10px] font-bold text-neutral-400">
                            {id === "card" && rails?.stripe
                              ? "بطاقة · Apple Pay · Google Pay"
                              : sub}
                          </span>
                        </span>
                        {method === id && (
                          <span className="absolute -top-1.5 -start-1.5 grid size-5 place-items-center rounded-full bg-accent text-white shadow-lg shadow-accent/40">
                            <Check className="size-3" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {method === "card" && !rails?.stripe && (
                  <p className="flex items-start gap-2 rounded-2xl bg-amber-400/10 px-4 py-3 text-[10px] font-bold leading-5 text-amber-600 dark:text-amber-400">
                    <TriangleAlert className="size-3.5 shrink-0" />
                    الدفع بالبطاقة غير مفعّل بعد — اختر طريقة أخرى أو تواصل مع
                    الإدارة عبر الدردشة.
                  </p>
                )}

                {method === "balance" && (
                  <p className="flex items-center justify-between rounded-2xl bg-amber-400/10 px-4 py-3 text-[11px] font-black text-amber-600 dark:text-amber-400">
                    <span className="flex items-center gap-2">
                      <Coins className="size-3.5" />
                      السعر {formatCoins(usdToCoins(total))} BK · رصيدك
                    </span>
                    <span className="font-display">
                      {formatCoins(me?.balance ?? 0)} BK
                    </span>
                  </p>
                )}

                {product.couponCode && (
                  <div>
                    <p className="mb-2 text-sm font-black">كود الخصم</p>
                    <div className="flex gap-2" dir="ltr">
                      <input
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponOk(false);
                        }}
                        placeholder="أدخل الكود"
                        className="w-full rounded-2xl border border-neutral-200 bg-transparent px-4 py-3 font-display text-sm font-bold uppercase tracking-widest outline-none focus:border-accent dark:border-white/10"
                      />
                      <button
                        onClick={() =>
                          setCouponOk(
                            couponInput.trim().toUpperCase() ===
                              (product.couponCode ?? "").toUpperCase()
                          )
                        }
                        className="shrink-0 rounded-2xl bg-neutral-900 px-5 text-xs font-black text-white dark:bg-white dark:text-neutral-900"
                      >
                        تطبيق
                      </button>
                    </div>
                    {couponOk && (
                      <p className="mt-2 text-[11px] font-black text-emerald-500">
                        تم تطبيق خصم {product.couponPercent}%
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2.5 rounded-2xl border border-neutral-200/60 bg-neutral-50/70 p-5 text-sm dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="flex justify-between font-bold text-neutral-500 dark:text-neutral-400">
                    <span>سعر الوحدة</span>
                    <span className="font-display">${product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-neutral-500 dark:text-neutral-400">
                    <span>الكمية</span>
                    <span className="font-display">×{qty}</span>
                  </div>
                  {couponOk && (
                    <div className="flex justify-between font-bold text-emerald-500">
                      <span>خصم الكوبون ({product.couponPercent}%)</span>
                      <span className="font-display">-${discountValue.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-neutral-500 dark:text-neutral-400">
                    <span>رسوم المعالجة</span>
                    <span className="text-emerald-500">مجاناً</span>
                  </div>
                  <div className="my-2 border-t border-dashed border-neutral-200 dark:border-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="font-black">الإجمالي</span>
                    <span className="shine-text font-display text-2xl font-bold">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={confirmOrder}
                  className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-accent px-8 py-4 text-base font-black text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5 hover:bg-accent-dark"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Lock className="size-4.5" />
                  {method === "card" && rails?.stripe
                    ? `الانتقال للدفع الآمن — $${total.toFixed(2)}`
                    : `تأكيد الطلب والدفع — $${total.toFixed(2)}`}
                </button>
                <p className="flex items-center justify-center gap-2 text-[10px] font-bold text-neutral-400">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  معاملة مشفرة وآمنة — يمكنك إلغاء الطلب لاحقاً من صفحة طلباتي
                </p>
              </div>
            )}

            {/* ---------- PROCESSING ---------- */}
            {stage === "processing" && (
              <div className="py-10">
                <div className="relative mx-auto mb-8 grid size-24 place-items-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-accent/15" />
                  <span className="grid size-16 place-items-center rounded-full bg-accent text-white shadow-xl shadow-accent/40">
                    <Loader2 className="size-7 animate-spin" />
                  </span>
                </div>
                <div className="mx-auto max-w-xs space-y-4">
                  {STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "grid size-7 place-items-center rounded-full border transition-all duration-500",
                          i < step
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : i === step
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-neutral-200 text-neutral-300 dark:border-white/10 dark:text-neutral-600"
                        )}
                      >
                        {i < step ? (
                          <Check className="size-3.5" />
                        ) : i === step ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-bold transition-colors duration-500",
                          i <= step
                            ? "text-neutral-800 dark:text-neutral-100"
                            : "text-neutral-400 dark:text-neutral-600"
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ---------- SUCCESS (PREMIUM · ICONS ONLY) ---------- */}
            {stage === "success" && (
              <div className="space-y-6">
                {/* VIP Header Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/[0.03] to-transparent p-6 text-center ring-1 ring-emerald-500/20">
                  {/* decorative glows */}
                  <span className="absolute -end-6 -top-6 size-28 rounded-full bg-emerald-500/15 blur-2xl" />
                  <span className="absolute -start-8 -bottom-8 size-32 rounded-full bg-amber-400/10 blur-3xl" />

                  {/* floating sparkles */}
                  <Sparkles className="absolute end-6 top-4 size-3.5 text-amber-400/70 animate-pulse" />
                  <Sparkles
                    className="absolute start-8 top-10 size-2.5 text-amber-400/50 animate-pulse"
                    style={{ animationDelay: "400ms" }}
                  />
                  <Sparkles
                    className="absolute end-12 bottom-6 size-3 text-emerald-400/60 animate-pulse"
                    style={{ animationDelay: "800ms" }}
                  />

                  {/* Big animated icon */}
                  <div className="relative mx-auto grid size-24 place-items-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
                    <span className="absolute inset-2 rounded-full bg-emerald-500/10 blur-md" />
                    <div className="relative grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-xl shadow-emerald-500/40">
                      <PartyPopper className="size-8" />
                    </div>
                  </div>

                  {/* VIP badge */}
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-l from-amber-500/20 to-amber-400/10 px-3 py-1 ring-1 ring-amber-400/30">
                    <Crown className="size-3 text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      عميل مميّز
                    </span>
                  </div>

                  <h4 className="mt-3 flex items-center justify-center gap-2 text-xl font-black text-neutral-900 dark:text-white">
                    تم تأكيد طلبك بنجاح
                  </h4>

                  <p className="mx-auto mt-2 max-w-sm text-xs font-medium leading-relaxed text-neutral-500 dark:text-neutral-400">
                    ممتنون جداً لاختيارك متجرنا — نحن لا نبيع منتجات فقط، بل نضمن
                    لك تجربة تليق بك كعضو مميّز في عائلة BK MARKET.
                  </p>
                </div>

                {/* ROADMAP */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h5 className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      <Award className="size-4 text-accent" />
                      خريطة استلام طلبك
                    </h5>
                    <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500">
                      <Timer className="size-3" />
                      {product.deliveryTime}
                    </span>
                  </div>

                  <div className="relative rounded-2xl border border-neutral-200/70 bg-neutral-50/50 p-5 dark:border-white/10 dark:bg-white/[0.02]">
                    {/* vertical line */}
                    <span className="absolute start-[30px] top-8 bottom-8 w-px bg-gradient-to-b from-emerald-500 via-accent to-neutral-200 dark:to-neutral-800" />

                    <div className="space-y-5">
                      {/* Step 1 — done */}
                      <div className="relative flex items-start gap-3">
                        <div className="relative grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                          <Check className="size-4" strokeWidth={3} />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="flex items-center gap-1.5 text-xs font-black text-neutral-800 dark:text-neutral-100">
                            <ShoppingBag className="size-3.5 text-emerald-500" />
                            تم الدفع وحجز المنتج باسمك
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold leading-5 text-neutral-400">
                            تم تأكيد المبلغ وتجهيز الأنظمة لإصدار تذكرتك الآن.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 — active */}
                      <div className="relative flex items-start gap-3">
                        <div className="relative grid size-8 shrink-0 place-items-center rounded-xl bg-accent text-white shadow-md shadow-accent/40">
                          <span className="absolute inset-0 animate-ping rounded-xl bg-accent/40" />
                          <Ticket className="relative size-4" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="flex items-center gap-1.5 text-xs font-black text-neutral-800 dark:text-neutral-100">
                            <DiscordIcon className="size-3.5 text-accent" />
                            توجّه إلى سيرفر الديسكورد
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold leading-5 text-neutral-400">
                            ستجد تذكرة خاصة باسمك جاهزة لاستلام الطلب فوراً من فريقنا.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 — upcoming */}
                      <div className="relative flex items-start gap-3">
                        <div className="grid size-8 shrink-0 place-items-center rounded-xl border-2 border-dashed border-neutral-300 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
                          <Gift className="size-4" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="flex items-center gap-1.5 text-xs font-black text-neutral-600 dark:text-neutral-300">
                            <Rocket className="size-3.5 text-neutral-400" />
                            الاستلام والتفعيل الفوري
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold leading-5 text-neutral-400">
                            سيسلّمك فريق الدعم الكود أو يفعّل الخدمة خلال دقائق.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Receipt Card */}
                <div className="rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-neutral-50/70 to-white p-4 dark:border-white/[0.06] dark:from-white/[0.03] dark:to-transparent">
                  <div className="flex items-center justify-between border-b border-dashed border-neutral-200/70 pb-3 dark:border-white/10">
                    <div className="text-start">
                      <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-neutral-400">
                        <ShieldCheck className="size-3 text-emerald-500" />
                        رقم الفاتورة المميّز
                      </p>
                      <p className="font-display mt-0.5 text-base font-black tracking-wider text-neutral-800 dark:text-neutral-100">
                        #{orderCode}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(orderCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1600);
                      }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black transition",
                        copied
                          ? "bg-emerald-500 text-white"
                          : "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="size-3" strokeWidth={3} /> تم النسخ
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> نسخ الرقم
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      إجمالي المدفوع
                    </span>
                    <span className="font-display text-lg font-black text-emerald-500">
                      ${orderTotal}
                    </span>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="space-y-3">
                  <a
                    href="https://discord.gg/your-invite"
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-l from-accent to-accent-dark px-8 py-4 text-base font-black text-white shadow-lg shadow-accent/30 transition hover:-translate-y-0.5"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <DiscordIcon className="size-5 shrink-0" />
                    <span>افتح الديسكورد لاستلام طلبك الآن</span>
                    <ChevronLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-1" />
                  </a>

                  <div className="flex gap-3">
                    <Link
                      href="/account"
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-neutral-200 py-3.5 text-xs font-black transition hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/5"
                    >
                      <Package className="size-4 text-neutral-400" />
                      تتبّع طلباتي
                    </Link>
                    <button
                      onClick={close}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-neutral-900/5 py-3.5 text-xs font-black transition hover:bg-neutral-900/10 dark:bg-white/5 dark:hover:bg-white/10"
                    >
                      <ShoppingBag className="size-4 text-neutral-400" />
                      متابعة التسوق
                    </button>
                  </div>
                </div>

                {/* Footer tip */}
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/5 px-4 py-2.5 text-[10px] font-bold text-amber-600 ring-1 ring-inset ring-amber-500/15 dark:text-amber-400">
                  <BellRing className="size-3.5" />
                  فعّل استقبال الرسائل الخاصة في الديسكورد حتى لا يفوتك التسليم
                </div>

                <p className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-neutral-400">
                  <Heart className="size-3 text-rose-500" fill="currentColor" />
                  نقدّر ثقتك بنا — عائلة BK MARKET
                </p>
              </div>
            )}

            {/* ---------- ERROR ---------- */}
            {stage === "error" && (
              <div className="py-10 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-rose-500/10 text-rose-500">
                  <X className="size-8" />
                </div>
                <h4 className="mt-5 text-lg font-black">تعذّر إتمام الطلب</h4>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                  {errorMsg}
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStage("checkout")}
                    className="flex-1 rounded-2xl bg-neutral-900 py-3.5 text-sm font-black text-white dark:bg-white dark:text-neutral-900"
                  >
                    حاول مجدداً
                  </button>
                  <button
                    onClick={close}
                    className="flex-1 rounded-2xl border border-neutral-200 py-3.5 text-sm font-black dark:border-white/10"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>

          {stage === "checkout" && (
            <div className="flex items-center justify-center gap-2 border-t border-neutral-200/60 py-3 text-[11px] font-bold text-neutral-400 dark:border-white/[0.06]">
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              ضمان BK MARKET يحمي أموالك حتى استلام المنتج كاملاً
            </div>
          )}
        </div>
      </div>
    ) : null;

  return (
    <>
      <button
        onClick={startCheckout}
        disabled={!me}
        className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-neutral-900 px-8 py-4.5 text-base font-black text-white shadow-xl shadow-neutral-900/20 transition hover:-translate-y-0.5 hover:shadow-2xl disabled:cursor-wait disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:shadow-white/5"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-l from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full dark:via-black/10" />
        {!me ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <ShoppingBag className="size-5" />
        )}
        اشترِ الآن — ${product.price.toFixed(2)}
      </button>
      <p className="mt-3 flex items-center justify-center gap-2 text-[11px] font-bold text-neutral-400">
        <Lock className="size-3.5" />
        تسجيل الدخول عبر ديسكورد مطلوب لإتمام الشراء
      </p>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        next={pathname || `/product/${product.slug}`}
        configured={me?.configured ?? false}
        title="خطوة واحدة تفصلك عن الشراء"
        subtitle="سجّل دخولك بحساب الديسكورد لإتمام طلبك واستلامه فوراً"
      />

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}