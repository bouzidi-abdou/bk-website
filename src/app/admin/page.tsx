import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, count, desc, eq, gte, sum } from "drizzle-orm";
import {
  Eye,
  Package,
  ShieldAlert,
  ShoppingBag,
  LayoutDashboard,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { db } from "@/db";
import { orders, products, users, visits } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { avatarUrl } from "@/lib/discord";
import { planOf } from "@/lib/effects";
import { getCategories } from "@/lib/categories";
import AdminPanel, {
  type AdminProduct,
  type AdminOrder,
  type AdminUser,
} from "@/components/admin-panel";
import IconTile from "@/components/icon-tile";
import DiscordIcon from "@/components/discord-icon";
import { TINTS, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "لوحة الإدارة — BK MARKET" };

export default async function AdminPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect(`/api/auth/discord?next=${encodeURIComponent("/admin")}`);
  }
  const admin = await isAdminUser(session.discordId);

  if (!admin) {
    return (
      <section className="flex min-h-[80vh] items-center justify-center px-4 pt-24">
        <div className="max-w-md rounded-[2rem] border border-neutral-200/80 bg-white p-10 text-center shadow-xl dark:border-white/[0.08] dark:bg-neutral-900/70">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
            <ShieldAlert className="size-8" />
          </span>
          <h1 className="mt-6 text-xl font-black">منطقة محظورة</h1>
          <p className="mt-3 text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            هذه الصفحة مخصصة لإدارة المتجر فقط — حسابك{" "}
            <b className="font-display text-neutral-700 dark:text-neutral-200">
              @{session.username}
            </b>{" "}
            لا يمتلك رتبة الإدارة المطلوبة.
          </p>
          <p className="mt-4 rounded-2xl bg-neutral-100 p-4 text-[11px] leading-6 text-neutral-500 dark:bg-white/[0.04] dark:text-neutral-400">
            يتم التحقق عبر رتبة ديسكورد (ADMIN_ROLE_ID مع بوت)، أو قائمة
            ADMIN_DISCORD_IDS في إعدادات البيئة.
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

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    [{ n: totalVisits }],
    [{ n: todayVisits }],
    [{ n: weekVisits }],
    [{ n: usersCount }],
    [{ n: ordersCount }],
    [{ revenue }],
    allProducts,
    recentOrders,
  ] = await Promise.all([
    db.select({ n: count() }).from(visits),
    db.select({ n: count() }).from(visits).where(gte(visits.createdAt, todayStart)),
    db.select({ n: count() }).from(visits).where(gte(visits.createdAt, weekAgo)),
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(orders),
    db.select({ revenue: sum(orders.total) }).from(orders),
    db.select().from(products).orderBy(asc(products.category), desc(products.sales)),
    db
      .select({
        id: orders.id,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
        quantity: orders.quantity,
        paymentMethod: orders.paymentMethod,
        productName: products.name,
        icon: products.icon,
        tint: products.tint,
        buyer: users.username,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .innerJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt))
      .limit(60),
  ]);

  const memberRows = await db
    .select({
      id: users.id,
      username: users.username,
      globalName: users.globalName,
      discordId: users.discordId,
      avatar: users.avatar,
      seller: users.seller,
      plan: users.plan,
      verified: users.verified,
      verifiedUntil: users.verifiedUntil,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(60);

  const spendByUser = new Map<string, { n: number; sum: number }>();
  const allOrderRows = await db
    .select({ userId: orders.userId, total: orders.total })
    .from(orders);
  for (const o of allOrderRows) {
    const cur = spendByUser.get(o.userId) ?? { n: 0, sum: 0 };
    cur.n += 1;
    cur.sum += Number(o.total);
    spendByUser.set(o.userId, cur);
  }

  const catList = await getCategories();

  const fmtShort = (d: Date) =>
    new Intl.DateTimeFormat("ar", { dateStyle: "short" }).format(d);

  const panelOrders: AdminOrder[] = recentOrders.map((o) => ({
    id: o.id,
    code: `BK-${o.id.slice(0, 8).toUpperCase()}`,
    productName: o.productName,
    icon: o.icon,
    tint: o.tint,
    quantity: o.quantity,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    createdAt: fmtShort(o.createdAt),
    buyer: o.buyer,
  }));

  const panelUsers: AdminUser[] = memberRows.map((u) => {
    const s = spendByUser.get(u.id);
    return {
      id: u.id,
      username: u.username,
      globalName: u.globalName,
      discordId: u.discordId,
      avatar: avatarUrl(u.discordId, u.avatar),
      seller: u.seller,
      plan: planOf(u),
      verified: planOf(u) !== "free",
      createdAt: fmtShort(u.createdAt),
      orderCount: s?.n ?? 0,
      spent: (s?.sum ?? 0).toFixed(2),
    };
  });

  const stats = [
    { icon: Eye, tint: "blue", label: "زيارات اليوم", value: todayVisits, sub: `${weekVisits} هذا الأسبوع` },
    { icon: TrendingUp, tint: "violet", label: "إجمالي الزيارات", value: totalVisits, sub: "منذ الإطلاق" },
    { icon: Users, tint: "emerald", label: "الأعضاء المسجلون", value: usersCount, sub: "عبر ديسكورد" },
    { icon: ShoppingBag, tint: "amber", label: "إجمالي الطلبات", value: ordersCount, sub: "كل الحالات" },
    { icon: Wallet, tint: "rose", label: "قيمة الطلبات", value: `$${Number(revenue ?? 0).toFixed(2)}`, sub: "إجمالي تراكمي" },
    { icon: Store, tint: "slate", label: "المنتجات", value: allProducts.length, sub: "في المتجر" },
  ];

  const panelItems: AdminProduct[] = allProducts.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    icon: p.icon,
    tint: p.tint,
    stock: p.stock,
    sales: p.sales,
    featured: p.featured,
    description: p.description,
    badge: p.badge,
    deliveryTime: p.deliveryTime,
    imageUrl: p.imageUrl,
    couponCode: p.couponCode,
    couponPercent: p.couponPercent,
  }));

  const overview = (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats.map(({ icon: Icon, tint, label, value, sub }) => (
          <div
            key={label}
            className="rounded-3xl border border-neutral-200/80 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-white/[0.07] dark:bg-neutral-900/70"
          >
            <span
              className={cn(
                "grid size-10 place-items-center rounded-xl bg-gradient-to-br",
                (TINTS[tint] ?? TINTS.violet).tile
              )}
            >
              <Icon className="size-5" />
            </span>
            <p className="font-display mt-3 truncate text-xl font-bold">{value}</p>
            <p className="mt-0.5 text-[11px] font-black text-neutral-500 dark:text-neutral-400">
              {label}
            </p>
            <p className="text-[9px] font-bold text-neutral-400">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="relative overflow-hidden pb-24 pt-40 md:pt-44">
      <div className="absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_65%_40%_at_50%_0%,black,transparent)]" />
        <div className="absolute -top-24 end-[15%] size-[300px] rounded-full bg-accent/10 blur-[80px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.35em] text-neutral-400">
              <LayoutDashboard className="size-3.5 text-accent" />
              ADMIN DASHBOARD
            </p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              لوحة إدارة <span className="shine-text font-display">BK MARKET</span>
            </h1>
          </div>
          <span className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
            <DiscordIcon className="size-3.5" />
            رتبة إدارة موثّقة — @{session.username}
          </span>
        </div>

        <AdminPanel
          initialProducts={panelItems}
          initialOrders={panelOrders}
          initialUsers={panelUsers}
          categories={catList.map((c) => ({ key: c.key, ar: c.ar }))}
          username={session.username}
          overview={overview}
        />
      </div>
    </section>
  );
}
