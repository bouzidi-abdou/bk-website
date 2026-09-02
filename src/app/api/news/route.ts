import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { news, newsLikes, roles, userRoles, users } from "@/db/schema";
import { planOf } from "@/lib/effects";
import { getSessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { avatarUrl } from "@/lib/discord";
import {
  guardLimit,
  getClientIp,
  isValidHttpUrl,
  rateLimit,
  sameOrigin,
  sanitize,
  tooManyRequests,
} from "@/lib/security";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KINDS = new Set(["news", "update", "offer", "alert"]);

export async function GET() {
  const session = await getSessionUser();

  try {
    const rows = await db
      .select({
        id: news.id,
        title: news.title,
        body: news.body,
        imageUrl: news.imageUrl,
        kind: news.kind,
        pinned: news.pinned,
        likeCount: news.likeCount,
        createdAt: news.createdAt,
        authorName: news.authorName,
        authorUsername: users.username,
        authorDisplay: users.displayName,
        authorAvatar: users.avatar,
        authorCustomAvatar: users.avatarUrl,
        authorDiscordId: users.discordId,
        authorVerified: users.verified,
        authorVerifiedUntil: users.verifiedUntil,
        authorPlan: users.plan,
        authorId: users.id,
        sections: news.sections,
      })
      .from(news)
      .leftJoin(users, eq(news.authorId, users.id))
      .orderBy(desc(news.pinned), desc(news.createdAt))
      .limit(60);

    // roles for post authors
    const authorIds = Array.from(
      new Set(rows.map((r) => r.authorId).filter(Boolean))
    ) as string[];
    const roleMap = new Map<
      string,
      { key: string; name: string; icon: string; color: string }[]
    >();
    if (authorIds.length > 0) {
      const rr = await db
        .select({
          userId: userRoles.userId,
          key: roles.key,
          name: roles.name,
          icon: roles.icon,
          color: roles.color,
          sortOrder: roles.sortOrder,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .orderBy(roles.sortOrder);
      for (const r of rr) {
        if (!authorIds.includes(r.userId)) continue;
        const list = roleMap.get(r.userId) ?? [];
        list.push({ key: r.key, name: r.name, icon: r.icon, color: r.color });
        roleMap.set(r.userId, list);
      }
    }

    let likedIds: string[] = [];
    if (session) {
      const likes = await db
        .select({ newsId: newsLikes.newsId })
        .from(newsLikes)
        .where(eq(newsLikes.userId, session.id));
      likedIds = likes.map((l) => l.newsId);
    }

    return NextResponse.json({
      posts: rows.map((r) => ({
        id: r.id,
        title: r.title,
        body: r.body,
        imageUrl: r.imageUrl,
        kind: r.kind,
        pinned: r.pinned,
        likeCount: r.likeCount,
        createdAt: r.createdAt,
        sections: r.sections ?? [],
        liked: likedIds.includes(r.id),
        author: {
          name:
            r.authorDisplay || r.authorUsername || r.authorName || "BK MARKET",
          username: r.authorUsername,
          verified:
            planOf({
              verified: r.authorVerified,
              verifiedUntil: r.authorVerifiedUntil,
              plan: r.authorPlan,
            }) !== "free",
          tier:
            planOf({
              verified: r.authorVerified,
              verifiedUntil: r.authorVerifiedUntil,
              plan: r.authorPlan,
            }) === "premium"
              ? "premium"
              : "basic",
          roles: r.authorId ? (roleMap.get(r.authorId) ?? []) : [],
          avatar:
            r.authorCustomAvatar ||
            (r.authorDiscordId
              ? avatarUrl(r.authorDiscordId, r.authorAvatar)
              : null),
        },
      })),
      guest: !session,
    });
  } catch {
    return NextResponse.json({ posts: [], guest: !session });
  }
}

/** Toggle like */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { message: "سجّل دخولك للتفاعل مع المنشورات" },
      { status: 401 }
    );
  }
  const limited = guardLimit(req, "newsLike", session.id);
  if (limited) return limited;

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!body.id || !UUID_RE.test(body.id)) {
    return NextResponse.json({ message: "منشور غير صالح" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select()
      .from(newsLikes)
      .where(and(eq(newsLikes.newsId, body.id), eq(newsLikes.userId, session.id)))
      .limit(1);

    if (existing) {
      await db.delete(newsLikes).where(eq(newsLikes.id, existing.id));
      const [row] = await db
        .update(news)
        .set({ likeCount: sql`GREATEST(0, ${news.likeCount} - 1)` })
        .where(eq(news.id, body.id))
        .returning({ likeCount: news.likeCount });
      return NextResponse.json({ ok: true, liked: false, likeCount: row?.likeCount ?? 0 });
    }

    await db.insert(newsLikes).values({ newsId: body.id, userId: session.id });
    const [row] = await db
      .update(news)
      .set({ likeCount: sql`${news.likeCount} + 1` })
      .where(eq(news.id, body.id))
      .returning({ likeCount: news.likeCount });
    return NextResponse.json({ ok: true, liked: true, likeCount: row?.likeCount ?? 1 });
  } catch {
    return NextResponse.json({ message: "تعذّر التفاعل" }, { status: 500 });
  }
}

/** Admin: publish a post */
export async function PUT(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  if (!(await isAdminUser(session.discordId))) {
    return NextResponse.json({ message: "لا تملك صلاحيات الإدارة" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const title = sanitize(body.title, 120);
  const text = sanitize(body.body, 2000);
  const imageUrl = sanitize(body.imageUrl, 500);
  const kind = sanitize(body.kind, 20);
  const rawSections = Array.isArray(body.sections) ? body.sections : [];
  const sections = rawSections
    .slice(0, 12)
    .map((x) => {
      const o = x as { heading?: unknown; content?: unknown };
      return {
        heading: sanitize(o.heading, 100),
        content: sanitize(o.content, 1500),
      };
    })
    .filter((x) => x.heading || x.content);

  if (!title || title.length < 3) {
    return NextResponse.json({ message: "العنوان مطلوب" }, { status: 400 });
  }
  if ((!text || text.length < 5) && sections.length === 0) {
    return NextResponse.json({ message: "المحتوى مطلوب" }, { status: 400 });
  }
  if (imageUrl && !isValidHttpUrl(imageUrl, true)) {
    return NextResponse.json({ message: "رابط الصورة غير صالح" }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(news)
      .values({
        title,
        body: text,
        imageUrl: imageUrl || null,
        sections,
        kind: KINDS.has(kind) ? kind : "news",
        pinned: Boolean(body.pinned),
        authorId: session.id,
        authorName: session.globalName || session.username,
      })
      .returning();
    return NextResponse.json({ ok: true, post: created });
  } catch {
    return NextResponse.json({ message: "تعذّر النشر" }, { status: 500 });
  }
}

/** Admin: delete */
export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session || !(await isAdminUser(session.discordId))) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ message: "منشور غير صالح" }, { status: 400 });
  }
  try {
    await db.delete(news).where(eq(news.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
