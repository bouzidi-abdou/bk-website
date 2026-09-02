import { sql } from "drizzle-orm";
import { db } from "@/db";
import { trackVisit } from "@/lib/track";
import { dbSafe } from "@/lib/safe";
import { getCategories } from "@/lib/categories";
import Hero, { type LiveStats } from "@/components/hero";
import DbBanner from "@/components/db-banner";
import { HowSection, CTASection } from "@/components/home-sections";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ ok: dbOk, data: liveStats }] = await Promise.all([
    dbSafe(
      async () => {
        const result = await db.execute<LiveStats>(sql`
          SELECT
            (SELECT count(*)::int FROM visits) AS visits,
            (SELECT count(*)::int FROM users) AS users,
            (SELECT count(*)::int FROM orders WHERE status <> 'cancelled') AS orders,
            (SELECT count(*)::int FROM products) AS products
        `);
        return (
          result.rows[0] ?? { visits: 0, users: 0, orders: 0, products: 0 }
        );
      },
      { visits: 0, users: 0, orders: 0, products: 0 } satisfies LiveStats
    ),
    trackVisit("/"),
  ]);

  const catList = await getCategories();

  return (
    <>
      <Hero stats={liveStats} categories={catList} />
      {!dbOk && <DbBanner />}
      <HowSection />
      <CTASection />
    </>
  );
}
