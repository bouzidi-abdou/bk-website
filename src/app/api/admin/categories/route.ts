import { NextResponse, type NextRequest } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { env } from "@/lib/env";
import { TINTS } from "@/lib/utils";
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
    const rows = await db
      .select({
        id: categories.id,
        key: categories.key,
        nameAr: categories.nameAr,
        nameEn: categories.nameEn,
        icon: categories.icon,
        tint: categories.tint,
        sortOrder: categories.sortOrder,
        active: categories.active,
        productCount: sql<number>`(
          select count(*)::int from products where products.category = ${categories.key}
        )`,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder));
    return NextResponse.json({ categories: rows });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}

export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const nameAr = sanitize(body.nameAr, 60);
  const nameEn = sanitize(body.nameEn, 60);
  const icon = sanitize(body.icon, 40);
  const tint = sanitize(body.tint, 24);
  const rawKey = sanitize(body.key, 30)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

  if (!nameAr || nameAr.length < 2) {
    return NextResponse.json({ message: "الاسم العربي مطلوب" }, { status: 400 });
  }
  if (!nameEn || nameEn.length < 2) {
    return NextResponse.json({ message: "الاسم الإنجليزي مطلوب" }, { status: 400 });
  }

  const key = rawKey || `cat-${Math.random().toString(36).slice(2, 7)}`;

  try {
    const [exists] = await db
      .select()
      .from(categories)
      .where(eq(categories.key, key))
      .limit(1);
    if (exists) {
      return NextResponse.json(
        { message: "المعرّف مستخدم بالفعل — اختر معرّفاً آخر" },
        { status: 409 }
      );
    }

    const [created] = await db
      .insert(categories)
      .values({
        key,
        nameAr,
        nameEn,
        icon: ICONS[icon] ? icon : "Package",
        tint: TINTS[tint] ? tint : "violet",
        sortOrder: Math.min(999, Math.max(1, Number(body.sortOrder) || 100)),
        active: true,
      })
      .returning();

    return NextResponse.json({ ok: true, category: created });
  } catch {
    return NextResponse.json({ message: "تعذّر إنشاء القسم" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { id?: string; active?: boolean; sortOrder?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!body.id || !UUID_RE.test(body.id)) {
    return NextResponse.json({ message: "قسم غير صالح" }, { status: 400 });
  }

  const patch: Partial<{ active: boolean; sortOrder: number }> = {};
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.sortOrder === "number") {
    patch.sortOrder = Math.min(999, Math.max(1, Math.floor(body.sortOrder)));
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "لا يوجد تعديل" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(categories)
      .set(patch)
      .where(eq(categories.id, body.id))
      .returning();
    return NextResponse.json({ ok: true, category: updated });
  } catch {
    return NextResponse.json({ message: "تعذّر التحديث" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ message: "قسم غير صالح" }, { status: 400 });
  }

  try {
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    if (!cat) {
      return NextResponse.json({ message: "القسم غير موجود" }, { status: 404 });
    }

    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.category, cat.key));

    if (n > 0) {
      return NextResponse.json(
        { message: `لا يمكن الحذف — القسم يحتوي ${n} منتج. انقلها أو احذفها أولاً.` },
        { status: 409 }
      );
    }

    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
