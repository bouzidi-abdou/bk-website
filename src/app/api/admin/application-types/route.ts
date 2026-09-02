import { NextResponse, type NextRequest } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { applicationTypes } from "@/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { TINTS } from "@/lib/utils";
import { ICONS } from "@/components/product-icon";
import {
  guardLimit,
  sameOrigin,
  sanitize,
  sanitizeMultiline,
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
        id: applicationTypes.id,
        key: applicationTypes.key,
        title: applicationTypes.title,
        subtitle: applicationTypes.subtitle,
        description: applicationTypes.description,
        icon: applicationTypes.icon,
        tint: applicationTypes.tint,
        terms: applicationTypes.terms,
        open: applicationTypes.open,
        closedNote: applicationTypes.closedNote,
        sortOrder: applicationTypes.sortOrder,
        grantsRole: applicationTypes.grantsRole,
        submissions: sql<number>`(
          select count(*)::int from applications where applications.type_id = ${applicationTypes.id}
        )`,
      })
      .from(applicationTypes)
      .orderBy(asc(applicationTypes.sortOrder));
    return NextResponse.json({ types: rows });
  } catch {
    return NextResponse.json({ types: [] });
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

  const title = sanitize(body.title, 80);
  if (!title || title.length < 3) {
    return NextResponse.json({ message: "عنوان التقديم مطلوب" }, { status: 400 });
  }

  const rawKey = sanitize(body.key, 24)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
  const key = rawKey || `apply-${Math.random().toString(36).slice(2, 7)}`;
  const icon = sanitize(body.icon, 40);
  const tint = sanitize(body.tint, 24);

  try {
    const [exists] = await db
      .select()
      .from(applicationTypes)
      .where(eq(applicationTypes.key, key))
      .limit(1);
    if (exists) {
      return NextResponse.json({ message: "المعرّف مستخدم" }, { status: 409 });
    }

    const [created] = await db
      .insert(applicationTypes)
      .values({
        key,
        title,
        subtitle: sanitize(body.subtitle, 140) || null,
        description: sanitize(body.description, 900),
        icon: ICONS[icon] ? icon : "Briefcase",
        tint: TINTS[tint] ? tint : "violet",
        terms: sanitizeMultiline(body.terms, 12, 200),
        grantsRole: sanitize(body.grantsRole, 20) || "none",
        sortOrder: Math.min(999, Math.max(1, Number(body.sortOrder) || 100)),
        open: true,
      })
      .returning();

    return NextResponse.json({ ok: true, type: created });
  } catch {
    return NextResponse.json({ message: "تعذّر الإنشاء" }, { status: 500 });
  }
}

/** Open / close a position, or edit its closed note. */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { id?: string; open?: boolean; closedNote?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!body.id || !UUID_RE.test(body.id)) {
    return NextResponse.json({ message: "قسم غير صالح" }, { status: 400 });
  }

  const patch: Partial<{ open: boolean; closedNote: string | null }> = {};
  if (typeof body.open === "boolean") patch.open = body.open;
  if (typeof body.closedNote === "string") {
    patch.closedNote = sanitize(body.closedNote, 200) || null;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "لا يوجد تعديل" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(applicationTypes)
      .set(patch)
      .where(eq(applicationTypes.id, body.id))
      .returning();
    return NextResponse.json({ ok: true, type: updated });
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
    await db.delete(applicationTypes).where(eq(applicationTypes.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
