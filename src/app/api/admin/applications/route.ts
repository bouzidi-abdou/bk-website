import { NextResponse, type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationTypes, applications, users } from "@/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { avatarUrl } from "@/lib/discord";
import { guardLimit, sameOrigin, sanitize } from "@/lib/security";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set(["pending", "accepted", "rejected"]);

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
        id: applications.id,
        code: applications.code,
        status: applications.status,
        fullName: applications.fullName,
        nickname: applications.nickname,
        location: applications.location,
        age: applications.age,
        hobbies: applications.hobbies,
        productTypes: applications.productTypes,
        experience: applications.experience,
        contact: applications.contact,
        note: applications.note,
        adminNote: applications.adminNote,
        createdAt: applications.createdAt,
        typeTitle: applicationTypes.title,
        typeKey: applicationTypes.key,
        userId: users.id,
        username: users.username,
        globalName: users.globalName,
        displayName: users.displayName,
        discordId: users.discordId,
        avatar: users.avatar,
        avatarCustom: users.avatarUrl,
        seller: users.seller,
      })
      .from(applications)
      .innerJoin(applicationTypes, eq(applications.typeId, applicationTypes.id))
      .innerJoin(users, eq(applications.userId, users.id))
      .orderBy(desc(applications.createdAt))
      .limit(200);

    return NextResponse.json({
      applications: rows.map((r) => ({
        ...r,
        avatarUrl: r.avatarCustom || avatarUrl(r.discordId, r.avatar),
      })),
    });
  } catch {
    return NextResponse.json({ applications: [] });
  }
}

/** Accept / reject — accepting grants the seller flag. */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { id?: string; status?: string; adminNote?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!body.id || !UUID_RE.test(body.id) || !STATUSES.has(body.status ?? "")) {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  try {
    const [row] = await db
      .select({
        app: applications,
        grantsRole: applicationTypes.grantsRole,
      })
      .from(applications)
      .innerJoin(applicationTypes, eq(applications.typeId, applicationTypes.id))
      .where(eq(applications.id, body.id))
      .limit(1);

    if (!row) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }

    await db
      .update(applications)
      .set({
        status: body.status!,
        adminNote: sanitize(body.adminNote, 400) || null,
        reviewedBy: g.username,
      })
      .where(eq(applications.id, body.id));

    let granted: boolean | null = null;
    const grantsSeller = (row.grantsRole ?? "").toLowerCase() === "seller";

    if (grantsSeller) {
      try {
        const [u] = await db
          .update(users)
          .set(
            body.status === "accepted"
              ? { seller: true, sellerSince: new Date() }
              : { seller: false, sellerSince: null }
          )
          .where(eq(users.id, row.app.userId))
          .returning({ seller: users.seller });
        granted = u?.seller ?? null;
      } catch (e) {
        console.error("[admin/applications] seller grant failed:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      status: body.status,
      grantsSeller,
      granted,
    });
  } catch {
    return NextResponse.json({ message: "تعذّر التحديث" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }
  try {
    await db.delete(applications).where(eq(applications.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
