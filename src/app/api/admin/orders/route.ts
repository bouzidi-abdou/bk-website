import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { env } from "@/lib/env";
import {
  guardLimit,
  getClientIp,
  rateLimit,
  sameOrigin,
  tooManyRequests,
} from "@/lib/security";

const STATUSES = new Set(["processing", "completed", "cancelled", "refunded"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function guard(req: NextRequest) {
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

export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!body.id || !UUID_RE.test(body.id)) {
    return NextResponse.json({ message: "معرّف الطلب غير صالح" }, { status: 400 });
  }
  if (!body.status || !STATUSES.has(body.status)) {
    return NextResponse.json({ message: "حالة غير معروفة" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(orders)
      .set({ status: body.status })
      .where(eq(orders.id, body.id))
      .returning();
    if (!updated) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, order: updated });
  } catch {
    return NextResponse.json({ message: "تعذّر التحديث" }, { status: 500 });
  }
}
