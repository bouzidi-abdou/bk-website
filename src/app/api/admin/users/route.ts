import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { guardLimit, sameOrigin } from "@/lib/security";

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

/** Grant / revoke the seller flag manually. */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { userId?: string; seller?: boolean; plan?: string; days?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!body.userId || !UUID_RE.test(body.userId)) {
    return NextResponse.json({ message: "عضو غير صالح" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (typeof body.seller === "boolean") {
    patch.seller = body.seller;
    patch.sellerSince = body.seller ? new Date() : null;
  }

  // membership: "free" removes it, "basic"/"premium" grants it
  if (typeof body.plan === "string") {
    if (body.plan === "free") {
      patch.plan = "free";
      patch.verified = false;
      patch.verifiedUntil = null;
    } else if (body.plan === "basic" || body.plan === "premium") {
      const days = Math.min(365, Math.max(1, Math.floor(Number(body.days) || 30)));
      patch.plan = body.plan;
      patch.verified = true;
      patch.verifiedUntil = new Date(Date.now() + days * 86_400_000);
    } else {
      return NextResponse.json({ message: "خطة غير معروفة" }, { status: 400 });
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "لا يوجد تعديل" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, body.userId))
      .returning({
        id: users.id,
        seller: users.seller,
        plan: users.plan,
        verified: users.verified,
        verifiedUntil: users.verifiedUntil,
      });

    if (!updated) {
      return NextResponse.json({ message: "العضو غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    console.error("[admin/users] update failed:", e);
    return NextResponse.json({ message: "تعذّر التحديث" }, { status: 500 });
  }
}
