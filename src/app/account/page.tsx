import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  CalendarDays,
  Package,
  PackageOpen,
  ShieldCheck,
  Wallet,
  Coins,
  Ticket,
  CircleUser,
  Palette,
} from "lucide-react";
import { db } from "@/db";
import { coinTx, orders, products, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import Reveal, { RevealItem, RevealStagger } from "@/components/reveal";
import IconTile from "@/components/icon-tile";
import CancelOrder from "@/components/cancel-order";
import MyTickets from "@/components/my-tickets";
import ProfileEditor from "@/components/profile-editor";
import HashScroll from "@/components/hash-scroll";
import AppearanceSection from "@/components/appearance-section";
import VerifiedBadge from "@/components/verified-badge";
import BkCoin from "@/components/bk-coin";
import { coinsToUsd, formatCoins } from "@/lib/coins";
import { planOf } from "@/lib/effects";
import DiscordIcon from "@/components/discord-icon";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  processing: {
    label: "قيد التنفيذ",
    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  completed: {
    label: "مكتمل",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  cancelled: {
    label: "ملغي",
    cls: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  refunded: {
    label: "مسترجع",
    cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

const PAY: Record<string, string> = {
  paypal: "PayPal",
  crypto: "كريبتو USDT",
  card: "بطاقة بنكية",
  balance: "رصيد المتجر",
};

export default async function AccountPage() {
  const session = await getSessionUser();
  if (!session) redirect(`/api/auth/discord?next=${encodeURIComponent("/account")}`);

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  const rows = await db
    .select({
      id: orders.id,
      quantity: orders.quantity,
      unitPrice: orders.unitPrice,
      discount: orders.discount,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      status: orders.status,
      createdAt: orders.createdAt,
      productName: products.name,
      productSlug: products.slug,
      productIcon: products.icon,
      productTint: products.tint,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.userId, session.id))
    .orderBy(desc(orders.createdAt));

  const ledger = await db
    .select({
      id: coinTx.id,
      amount: coinTx.amount,
      kind: coinTx.kind,
      note: coinTx.note,
      createdAt: coinTx.createdAt,
    })
    .from(coinTx)
    .where(eq(coinTx.userId, session.id))
    .orderBy(desc(coinTx.createdAt))
    .limit(8);

  const avatarSrc = dbUser?.avatarUrl || session.avatar;
  const displayName =
    dbUser?.displayName || session.globalName || session.username;
  const balance = Number(dbUser?.balance ?? 0);
  const totalSpent = rows.reduce((a, r) => a + Number(r.total), 0);
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(d);

  return (
    <section className="relative overflow-hidden pb-24 pt-44 md:pt-52">
      <HashScroll />
      <div className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_65%_45%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-24 end-[15%] size-[320px] rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* profile card */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-neutral-200/80 bg-white p-8 shadow-xl shadow-neutral-900/[0.05] dark:border-white/[0.08] dark:bg-neutral-900/70 md:p-10">
            <div className="absolute -top-24 -end-24 size-64 rounded-full bg-accent/15 blur-[70px]" />
            <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center">
              <div className="relative">
                <span className="absolute -inset-2 rounded-full bg-[conic-gradient(from_90deg,#5865f2,#a5b0ff,#5865f2)] opacity-60 blur-md" />
                <Image
                  src={session.avatar}
                  alt={session.username}
                  width={96}
                  height={96}
                  className="relative size-24 rounded-full ring-4 ring-white dark:ring-neutral-900"
                  unoptimized
                />
                <span className="absolute bottom-1 end-1 grid size-7 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white dark:border-neutral-900">
                  <ShieldCheck className="size-3.5" />
                </span>
              </div>

              <div className="flex-1">
                <p className="font-display text-[10px] uppercase tracking-[0.35em] text-neutral-400">
                  BK MARKET MEMBER
                </p>
                <h1 className="mt-1.5 flex flex-wrap items-center gap-2 text-2xl font-black md:text-3xl">
                  <span className="break-words">
                    {dbUser?.displayName || session.globalName || session.username}
                  </span>
                  {dbUser && planOf(dbUser) !== "free" && (
                    <VerifiedBadge
                      tier={planOf(dbUser) === "premium" ? "premium" : "basic"}
                      className="size-6"
                    />
                  )}
                </h1>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400">
                  <DiscordIcon className="size-4 text-accent" />
                  @{session.username}
                  <span className="text-neutral-300 dark:text-neutral-600">•</span>
                  <CalendarDays className="size-4" />
                  عضو منذ {dbUser ? fmtDate(dbUser.createdAt) : "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:w-64">
                <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <Package className="mx-auto size-4.5 text-accent" />
                  <p className="font-display mt-1.5 text-xl font-bold">{rows.length}</p>
                  <p className="text-[10px] font-bold text-neutral-400">طلب إجمالي</p>
                </div>
                <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4 text-center dark:border-white/[0.07] dark:bg-white/[0.03]">
                  <Wallet className="mx-auto size-4.5 text-emerald-500" />
                  <p className="font-display mt-1.5 text-xl font-bold">
                    ${totalSpent.toFixed(2)}
                  </p>
                  <p className="text-[10px] font-bold text-neutral-400">إجمالي الإنفاق</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* profile */}
        <Reveal delay={0.04} className="mt-8" y={40}>
          <div id="profile" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-xl font-black">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-white">
                <CircleUser className="size-5" />
              </span>
              ملفي الشخصي
            </h2>
            <div className="mt-5">
              <ProfileEditor
                fallbackAvatar={session.avatar}
                activeFrame={dbUser?.activeFrame}
                activeEffect={dbUser?.activeEffect}
              />
            </div>
          </div>
        </Reveal>

        {/* appearance & subscription */}
        <Reveal delay={0.05} className="mt-8" y={40}>
          <div id="appearance" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-xl font-black">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-white">
                <Palette className="size-5" />
              </span>
              المظهر والعضوية
            </h2>
            <p className="mt-2 text-xs font-bold text-neutral-400">
              إطارات وتأثيرات حصرية لملفك الشخصي · خطط التوثيق ومزاياها
            </p>
            <div className="mt-5">
              <AppearanceSection
                avatar={avatarSrc}
                name={displayName}
                verified={planOf(dbUser ?? {}) !== "free"}
              />
            </div>
          </div>
        </Reveal>

        {/* BK COIN wallet */}
        <Reveal delay={0.06} className="mt-6" y={40}>
          <div className="overflow-hidden rounded-[2rem] border border-amber-400/30 bg-gradient-to-br from-amber-400/[0.09] to-orange-400/[0.04] p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-amber-400/15 ring-1 ring-inset ring-amber-400/25">
                  <BkCoin className="size-9" />
                </span>
                <div>
                  <p className="font-display text-[10px] uppercase tracking-[0.3em] text-amber-600/70 dark:text-amber-400/70">
                    BK COIN WALLET
                  </p>
                  <p className="font-display mt-1 text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {formatCoins(balance)}
                  </p>
                  <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                    100 BK COIN = 1 دولار · يعادل ${coinsToUsd(balance).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="max-w-xs text-[11px] font-bold leading-6 text-neutral-500 dark:text-neutral-400">
                استخدم رصيدك للدفع الفوري عند الشراء — اختر «رصيد المتجر» في
                نافذة الدفع. لشحن الرصيد تواصل مع الإدارة عبر الدردشة.
              </div>
            </div>

            {ledger.length > 0 && (
              <div className="mt-6 space-y-2 border-t border-amber-400/20 pt-4">
                {ledger.map((t) => {
                  const amt = Number(t.amount);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 text-[11px] font-bold"
                    >
                      <span className="min-w-0 flex-1 truncate text-neutral-500 dark:text-neutral-400">
                        {t.kind === "topup"
                          ? "شحن رصيد"
                          : t.kind === "purchase"
                            ? "دفع مقابل شراء"
                            : t.kind === "refund"
                              ? "استرجاع رصيد"
                              : "خصم"}
                        {t.note ? ` · ${t.note}` : ""}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {fmtDate(t.createdAt)}
                      </span>
                      <span
                        className={cn(
                          "font-display shrink-0 font-bold",
                          amt >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}
                      >
                        {amt >= 0 ? "+" : ""}
                        {formatCoins(amt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Reveal>

        {/* tickets */}
        <Reveal delay={0.08} className="mt-12" y={40}>
          <div id="tickets" className="scroll-mt-28">
            <h2 className="flex items-center gap-3 text-xl font-black">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-white">
                <Ticket className="size-5" />
              </span>
              تذاكري
            </h2>
            <p className="mt-2 text-xs font-bold text-neutral-400">
              تواصل مباشرة مع فريق الإدارة بخصوص أي طلب أو استفسار
            </p>
            <div className="mt-5">
              <MyTickets />
            </div>
          </div>
        </Reveal>

        {/* orders */}
        <Reveal delay={0.1} className="mt-12" y={40}>
          <div id="orders" className="flex scroll-mt-28 items-center justify-between">
            <h2 className="flex items-center gap-3 text-xl font-black">
              <span className="grid size-10 place-items-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                <Package className="size-5" />
              </span>
              طلباتي
            </h2>
            <Link
              href="/store"
              className="group flex items-center gap-2 text-xs font-black text-accent transition hover:gap-3"
            >
              تسوّق المزيد
              <ArrowLeft className="size-3.5" />
            </Link>
          </div>
        </Reveal>

        {rows.length > 0 ? (
          <RevealStagger className="mt-6 space-y-4">
            {rows.map((o) => {
              const st = STATUS[o.status] ?? STATUS.processing;
              return (
                <RevealItem key={o.id}>
                  <Link
                    href={`/product/${o.productSlug}`}
                    className="group flex flex-col gap-5 rounded-3xl border border-neutral-200/80 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl sm:flex-row sm:items-center dark:border-white/[0.07] dark:bg-neutral-900/70 dark:hover:border-white/15"
                  >
                    <IconTile name={o.productIcon} tint={o.productTint} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-black group-hover:text-accent">
                          {o.productName}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-black",
                            st.cls
                          )}
                        >
                          {st.label}
                        </span>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-neutral-400">
                        <span className="font-display">
                          BK-{o.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span>الكمية ×{o.quantity}</span>
                        <span>{PAY[o.paymentMethod] ?? o.paymentMethod}</span>
                        <span>{fmtDate(o.createdAt)}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
                      <span className="font-display text-lg font-bold">
                        ${Number(o.total).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        {o.status === "processing" && (
                          <CancelOrder orderId={o.id} />
                        )}
                        <span className="grid size-8 place-items-center rounded-full border border-neutral-200 text-neutral-400 transition group-hover:border-accent group-hover:bg-accent group-hover:text-white dark:border-white/10">
                          <ArrowLeft className="size-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealStagger>
        ) : (
          <Reveal delay={0.15} y={40} className="mt-6">
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 py-16 text-center dark:border-white/10">
              <span className="grid size-20 place-items-center rounded-3xl bg-neutral-100 text-neutral-300 dark:bg-white/5 dark:text-neutral-600">
                <PackageOpen className="size-10" />
              </span>
              <h3 className="mt-6 text-lg font-black">لا توجد طلبات بعد</h3>
              <p className="mt-2 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
                أول طلب لك على بُعد ضغطة واحدة — تصفح المتجر واختر ما يناسبك.
              </p>
              <Link
                href="/store"
                className="group mt-6 flex items-center gap-2.5 rounded-full bg-neutral-900 px-7 py-3.5 text-xs font-black text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-neutral-900"
              >
                ابدأ التسوق الآن
                <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
