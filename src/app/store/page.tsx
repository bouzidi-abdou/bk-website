import { desc } from "drizzle-orm";
import { db } from "@/db";
import { products, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { avatarUrl } from "@/lib/discord";
import { trackVisit } from "@/lib/track";
import { dbSafe } from "@/lib/safe";
import { getCategories } from "@/lib/categories";
import StoreBrowser from "@/components/store-browser";
import DbBanner from "@/components/db-banner";
import type { CardProduct } from "@/components/product-card";

export const dynamic = "force-dynamic";

type Row = {
  p: typeof products.$inferSelect;
  pub: {
    username: string | null;
    displayName: string | null;
    globalName: string | null;
    avatar: string | null;
    avatarUrl: string | null;
    discordId: string | null;
    verified: boolean | null;
  } | null;
};

function serialize({ p, pub }: Row): CardProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    price: Number(p.price),
    oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
    icon: p.icon,
    tint: p.tint,
    imageUrl: p.imageUrl,
    badge: p.badge,
    deliveryTime: p.deliveryTime,
    rating: p.rating,
    sales: p.sales,
    publisher: pub?.username
      ? {
          name: pub.displayName || pub.globalName || pub.username,
          username: pub.username,
          avatar:
            pub.avatarUrl ||
            (pub.discordId ? avatarUrl(pub.discordId, pub.avatar) : null),
          verified: Boolean(pub.verified),
        }
      : { name: "BK MARKET", username: null, avatar: null, verified: true },
  };
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  const catList = await getCategories();
  const [{ ok: dbOk, data: rows }] = await Promise.all([
    dbSafe(
      () =>
        db
          .select({
            p: products,
            pub: {
              username: users.username,
              displayName: users.displayName,
              globalName: users.globalName,
              avatar: users.avatar,
              avatarUrl: users.avatarUrl,
              discordId: users.discordId,
              verified: users.verified,
            },
          })
          .from(products)
          .leftJoin(users, eq(products.publisherId, users.id))
          .orderBy(desc(products.featured), desc(products.sales)),
      [] as Row[]
    ),
    trackVisit("/store"),
  ]);

  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-44 md:pt-52">
        <div className="absolute inset-0 -z-10">
          <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,black,transparent)]" />
          <div className="absolute -top-24 start-1/3 size-[380px] rounded-full bg-accent/10 blur-[80px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="font-display text-[11px] uppercase tracking-[0.4em] text-neutral-400">
            BK MARKET STORE
          </p>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            المتجر <span className="shine-text font-display tracking-tight">الكامل</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-neutral-500 dark:text-neutral-400">
            {rows.length} منتجاً رقمياً منتقى بعناية — ابحث، رشّح، واطلب خلال
            أقل من دقيقة.
          </p>
        </div>
        <div className="mt-9 border-y border-neutral-200/70 bg-white dark:border-white/[0.06] dark:bg-neutral-900/40">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-px bg-neutral-200/70 text-center dark:bg-white/[0.06] sm:grid-cols-4">
            {["أسعار واضحة", "تسليم سريع", "طلبات محفوظة", "دعم مباشر"].map(
              (item) => (
                <span
                  key={item}
                  className="bg-white px-3 py-3 text-[10px] font-black text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400"
                >
                  {item}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {!dbOk && <DbBanner title="المتجر قيد التهيئة مؤقتاً" />}

      <section className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8">
        <StoreBrowser
          products={rows.map(serialize)}
          initialCat={cat ?? "all"}
          categories={catList}
        />
      </section>
    </>
  );
}
