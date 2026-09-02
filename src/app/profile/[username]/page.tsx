import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, count, desc, eq, ne, sum } from "drizzle-orm";
import {
  CalendarDays,
  Globe,
  MapPin,
  Package,
  Palette,
  Settings,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { db } from "@/db";
import { orders, products, roles, userRoles, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { avatarUrl } from "@/lib/discord";
import { accent, formatCoins } from "@/lib/coins";
import { cosmeticClass, planOf } from "@/lib/effects";
import { dbSafe } from "@/lib/safe";
import VerifiedBadge, { SellerBadge } from "@/components/verified-badge";
import BkCoin from "@/components/bk-coin";
import RoleBadge from "@/components/role-badge";
import DiscordIcon from "@/components/discord-icon";
import IconTile from "@/components/icon-tile";
import { cn, DISCORD_INVITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${decodeURIComponent(username)} — BK MARKET` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const handle = decodeURIComponent(username).replace(/^@/, "");

  const { data: rows } = await dbSafe(
    () => db.select().from(users).where(eq(users.username, handle)).limit(1),
    [] as (typeof users.$inferSelect)[]
  );
  const user = rows[0];
  if (!user) notFound();

  const session = await getSessionUser();
  const isSelf = session?.id === user.id;

  if (!user.profilePublic && !isSelf) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center px-4 pt-32">
        <div className="max-w-sm rounded-3xl border border-neutral-200/80 bg-white p-10 text-center dark:border-white/[0.08] dark:bg-neutral-900/70">
          <ShieldCheck className="mx-auto size-10 text-neutral-300" />
          <h1 className="mt-4 text-lg font-black">هذا الملف خاص</h1>
          <p className="mt-2 text-xs leading-6 text-neutral-500">
            اختار صاحب الحساب إخفاء ملفه الشخصي.
          </p>
        </div>
      </section>
    );
  }

  const [{ data: statRows }, { data: recent }, { data: myRoles }] = await Promise.all([
    dbSafe(
      () =>
        db
          .select({ n: count(), spent: sum(orders.total) })
          .from(orders)
          .where(
            and(eq(orders.userId, user.id), ne(orders.status, "cancelled"))
          ),
      [{ n: 0, spent: "0" }]
    ),
    dbSafe(
      () =>
        db
          .select({
            id: orders.id,
            createdAt: orders.createdAt,
            name: products.name,
            slug: products.slug,
            icon: products.icon,
            tint: products.tint,
          })
          .from(orders)
          .innerJoin(products, eq(orders.productId, products.id))
          .where(
            and(eq(orders.userId, user.id), ne(orders.status, "cancelled"))
          )
          .orderBy(desc(orders.createdAt))
          .limit(6),
      [] as {
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
        icon: string;
        tint: string;
      }[]
    ),
    dbSafe(
      () =>
        db
          .select({
            key: roles.key,
            name: roles.name,
            icon: roles.icon,
            color: roles.color,
            sortOrder: roles.sortOrder,
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, user.id))
          .orderBy(roles.sortOrder),
      [] as { key: string; name: string; icon: string; color: string; sortOrder: number }[]
    ),
  ]);

  const a = accent(user.accentColor);
  const avatar = user.avatarUrl || avatarUrl(user.discordId, user.avatar, 256);
  const name = user.displayName || user.globalName || user.username;
  const plan = planOf(user);
  const isVerified = plan !== "free";
  const frameCls = cosmeticClass(user.activeFrame);
  const effectCls = cosmeticClass(user.activeEffect);
  const orderCount = statRows[0]?.n ?? 0;
  const joined = new Intl.DateTimeFormat("ar", { dateStyle: "long" }).format(
    user.createdAt
  );

  return (
    <section className="pb-24 pt-28 md:pt-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* ---------- card ---------- */}
        <div className="overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-white shadow-[0_30px_70px_-40px_rgba(12,12,20,0.35)] dark:border-white/[0.07] dark:bg-neutral-900/70">
          {/* banner — isolated stacking context, never overlaps the avatar */}
          <div className="relative isolate z-0">
            <div
              className={cn(
                "relative h-36 overflow-hidden bg-gradient-to-br sm:h-52",
                a.grad,
                effectCls
              )}
            >
              {user.bannerUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.bannerUrl}
                  alt=""
                  className="size-full object-cover"
                />
              )}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent dark:from-neutral-900" />
            </div>
          </div>

          {/* identity */}
          <div className="relative z-10 px-5 pb-5 sm:px-7 sm:pb-7">
            <div className="-mt-14 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
              <span className="relative z-20 inline-block rounded-full bg-white p-1 shadow-xl dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={user.username}
                  className={cn(
                    "block size-24 rounded-full object-cover sm:size-28",
                    frameCls
                  )}
                />
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {isSelf ? (
                  <>
                    <Link
                      href="/account#profile"
                      className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-[11px] font-black text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-neutral-900"
                    >
                      <Settings className="size-3.5" />
                      تعديل الملف
                    </Link>
                    <Link
                      href="/account#appearance"
                      className="flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2.5 text-[11px] font-black transition hover:border-accent hover:text-accent dark:border-white/10"
                    >
                      <Palette className="size-3.5" />
                      المظهر
                    </Link>
                  </>
                ) : (
                  <a
                    href={`https://discord.com/users/${user.discordId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[11px] font-black text-white transition hover:-translate-y-0.5"
                  >
                    <DiscordIcon className="size-3.5" />
                    تواصل عبر ديسكورد
                  </a>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-black">
                <span className="break-words">{name}</span>
                {isVerified && (
                  <VerifiedBadge tier={plan === "premium" ? "premium" : "basic"} className="size-6" />
                )}
                {user.seller && <SellerBadge className="size-6" />}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-neutral-400">
                <span className="flex items-center gap-1">
                  <DiscordIcon className={cn("size-3.5", a.text)} />@
                  {user.username}
                </span>

              </p>

              {myRoles.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {myRoles.map((r) => (
                    <RoleBadge key={r.key} role={r} />
                  ))}
                </div>
              )}

              {user.bio && (
                <p className="mt-4 whitespace-pre-line break-words text-[13px] leading-7 text-neutral-600 dark:text-neutral-300">
                  {user.bio}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  انضم في {joined}
                </span>
                {user.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {user.location}
                  </span>
                )}
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className={cn(
                      "flex max-w-full items-center gap-1.5 truncate hover:underline",
                      a.text
                    )}
                  >
                    <Globe className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {user.website.replace(/^https?:\/\//, "")}
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-neutral-200/70 p-3.5 text-center dark:border-white/[0.07]">
                <ShoppingBag className="mx-auto size-4 text-accent" />
                <p className="font-display mt-1.5 text-lg font-bold">{orderCount}</p>
                <p className="text-[9px] font-black text-neutral-400">طلب</p>
              </div>
              <div className="rounded-2xl border border-neutral-200/70 p-3.5 text-center dark:border-white/[0.07]">
                <BkCoin className="mx-auto size-5" />
                <p className="font-display mt-1.5 text-lg font-bold text-amber-500">
                  {isSelf ? formatCoins(user.balance) : "—"}
                </p>
                <p className="text-[9px] font-black text-neutral-400">BK COIN</p>
              </div>
              <div className="rounded-2xl border border-neutral-200/70 p-3.5 text-center dark:border-white/[0.07]">
                {plan === "free" ? (
                  <ShieldCheck className="mx-auto size-4 text-neutral-300" />
                ) : (
                  <VerifiedBadge
                    tier={plan === "premium" ? "premium" : "basic"}
                    className="mx-auto size-4"
                    tooltip={false}
                  />
                )}
                <p
                  className={cn(
                    "font-display mt-1.5 text-sm font-bold",
                    plan === "premium"
                      ? "text-amber-500"
                      : plan === "basic"
                        ? "text-neutral-500 dark:text-neutral-300"
                        : "text-neutral-400"
                  )}
                >
                  {plan === "premium" ? "PREMIUM" : plan === "basic" ? "BASIC" : "عادي"}
                </p>
                <p className="text-[9px] font-black text-neutral-400">العضوية</p>
              </div>
              <div className="rounded-2xl border border-neutral-200/70 p-3.5 text-center dark:border-white/[0.07]">
                <SellerBadge className="mx-auto size-4" />
                <p
                  className={cn(
                    "font-display mt-1.5 text-sm font-bold",
                    user.seller ? "text-emerald-500" : "text-neutral-400"
                  )}
                >
                  {user.seller ? "بائع" : "عضو"}
                </p>
                <p className="text-[9px] font-black text-neutral-400">النوع</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- showcase ---------- */}
        {recent.length > 0 && (
          <div className="mt-6 rounded-[1.75rem] border border-neutral-200/80 bg-white p-5 sm:p-6 dark:border-white/[0.07] dark:bg-neutral-900/70">
            <h2 className="flex items-center gap-2.5 text-sm font-black">
              <ShoppingBag className="size-4 text-accent" />
              مقتنيات {isSelf ? "حسابك" : "العضو"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/product/${r.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200/70 p-3 transition hover:-translate-y-0.5 hover:border-accent/40 dark:border-white/[0.07]"
                >
                  <IconTile name={r.icon} tint={r.tint} size="sm" />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-xs font-black">{r.name}</b>
                    <span className="text-[9px] font-bold text-neutral-400">
                      {new Intl.DateTimeFormat("ar", {
                        dateStyle: "short",
                      }).format(r.createdAt)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ---------- cta ---------- */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-neutral-200/80 bg-neutral-950 p-5 text-white sm:p-6 dark:border-white/[0.07]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent">
              <Package className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black">انضم لمجتمع BK MARKET</p>
              <p className="mt-0.5 text-[11px] text-neutral-400">
                منتجات رقمية بأسعار تحت الجملة وتسليم فوري
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/store"
              className="rounded-full bg-white px-5 py-2.5 text-[11px] font-black text-neutral-900 transition hover:-translate-y-0.5"
            >
              المتجر
            </Link>
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[11px] font-black transition hover:-translate-y-0.5"
            >
              <DiscordIcon className="size-3.5" />
              السيرفر
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
