import { NextResponse, type NextRequest } from "next/server";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { orders, roles, userRoles, users } from "@/db/schema";
import { avatarUrl } from "@/lib/discord";
import { planOf, cosmeticClass } from "@/lib/effects";
import { guardLimit } from "@/lib/security";

/** Public mini-profile used by the hover/preview card. */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const limited = guardLimit(req, "read");
  if (limited) return limited;

  const { username } = await params;
  const handle = decodeURIComponent(username).replace(/^@/, "").slice(0, 40);

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, handle))
      .limit(1);

    if (!user) {
      return NextResponse.json({ found: false }, { status: 404 });
    }
    if (!user.profilePublic) {
      return NextResponse.json({ found: false, private: true }, { status: 403 });
    }

    const [[stat], myRoles] = await Promise.all([
      db
        .select({ n: count() })
        .from(orders)
        .where(and(eq(orders.userId, user.id), ne(orders.status, "cancelled"))),
      db
        .select({
          key: roles.key,
          name: roles.name,
          icon: roles.icon,
          color: roles.color,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, user.id))
        .orderBy(roles.sortOrder),
    ]);

    const plan = planOf(user);

    return NextResponse.json(
      {
        found: true,
        profile: {
          username: user.username,
          name: user.displayName || user.globalName || user.username,
          bio: user.bio,
          avatar: user.avatarUrl || avatarUrl(user.discordId, user.avatar, 128),
          bannerUrl: user.bannerUrl,
          accentColor: user.accentColor,
          location: user.location,
          website: user.website,
          verified: plan !== "free",
          tier: plan === "premium" ? "premium" : "basic",
          plan,
          roles: myRoles,
          frameCls: cosmeticClass(user.activeFrame),
          effectCls: cosmeticClass(user.activeEffect),
          orders: stat?.n ?? 0,
          joined: user.createdAt,
        },
      },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch {
    return NextResponse.json({ found: false }, { status: 500 });
  }
}
