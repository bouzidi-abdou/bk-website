import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { roles, userRoles, users } from "@/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { avatarUrl } from "@/lib/discord";
import { env } from "@/lib/env";
import { ICONS } from "@/components/product-icon";
import {
  guardLimit,
  getClientIp,
  rateLimit,
  sameOrigin,
  sanitize,
  tooManyRequests,
} from "@/lib/security";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLORS = new Set(["amber", "rose", "blue", "violet", "emerald", "slate"]);

async function guard(req: NextRequest): Promise<NextResponse | SessionUser> {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const limited = guardLimit(req, "admin");
  if (limited) return limited;

  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  if (!(await isAdminUser(session.discordId))) {
    return NextResponse.json({ message: "لا تملك صلاحيات الإدارة" }, { status: 403 });
  }
  return session;
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  try {
    const list = await db
      .select({
        id: roles.id,
        key: roles.key,
        name: roles.name,
        icon: roles.icon,
        color: roles.color,
        sortOrder: roles.sortOrder,
        members: sql<number>`(
          select count(*)::int from user_roles where user_roles.role_id = ${roles.id}
        )`,
      })
      .from(roles)
      .orderBy(asc(roles.sortOrder));

    const members = await db
      .select({
        userId: users.id,
        username: users.username,
        displayName: users.displayName,
        globalName: users.globalName,
        discordId: users.discordId,
        avatar: users.avatar,
        avatarUrl: users.avatarUrl,
        roleId: userRoles.roleId,
      })
      .from(users)
      .leftJoin(userRoles, eq(userRoles.userId, users.id))
      .limit(300);

    const byUser = new Map<
      string,
      {
        userId: string;
        name: string;
        username: string;
        avatar: string;
        roleIds: string[];
      }
    >();
    for (const m of members) {
      const cur = byUser.get(m.userId) ?? {
        userId: m.userId,
        name: m.displayName || m.globalName || m.username,
        username: m.username,
        avatar: m.avatarUrl || avatarUrl(m.discordId, m.avatar),
        roleIds: [],
      };
      if (m.roleId) cur.roleIds.push(m.roleId);
      byUser.set(m.userId, cur);
    }

    return NextResponse.json({
      roles: list,
      members: Array.from(byUser.values()),
    });
  } catch {
    return NextResponse.json({ roles: [], members: [] });
  }
}

/** create role */
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const name = sanitize(body.name, 30);
  const icon = sanitize(body.icon, 40);
  const color = sanitize(body.color, 16);
  const rawKey = sanitize(body.key, 24)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  if (!name || name.length < 2) {
    return NextResponse.json({ message: "اسم الرتبة مطلوب" }, { status: 400 });
  }
  const key = rawKey || `role-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const [exists] = await db
      .select()
      .from(roles)
      .where(eq(roles.key, key))
      .limit(1);
    if (exists) {
      return NextResponse.json({ message: "المعرّف مستخدم" }, { status: 409 });
    }
    const [created] = await db
      .insert(roles)
      .values({
        key,
        name,
        icon: ICONS[icon] ? icon : "Shield",
        color: COLORS.has(color) ? color : "violet",
        sortOrder: Math.min(999, Math.max(1, Number(body.sortOrder) || 100)),
      })
      .returning();
    return NextResponse.json({ ok: true, role: created });
  } catch {
    return NextResponse.json({ message: "تعذّر الإنشاء" }, { status: 500 });
  }
}

/** assign / unassign a role */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { userId?: string; roleId?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  if (
    !body.userId ||
    !UUID_RE.test(body.userId) ||
    !body.roleId ||
    !UUID_RE.test(body.roleId)
  ) {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  try {
    if (body.action === "remove") {
      await db
        .delete(userRoles)
        .where(
          and(
            eq(userRoles.userId, body.userId),
            eq(userRoles.roleId, body.roleId)
          )
        );
      return NextResponse.json({ ok: true, assigned: false });
    }

    const [exists] = await db
      .select()
      .from(userRoles)
      .where(
        and(eq(userRoles.userId, body.userId), eq(userRoles.roleId, body.roleId))
      )
      .limit(1);
    if (!exists) {
      await db
        .insert(userRoles)
        .values({ userId: body.userId, roleId: body.roleId });
    }
    return NextResponse.json({ ok: true, assigned: true });
  } catch {
    return NextResponse.json({ message: "تعذّر التحديث" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ message: "رتبة غير صالحة" }, { status: 400 });
  }
  try {
    await db.delete(roles).where(eq(roles.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
