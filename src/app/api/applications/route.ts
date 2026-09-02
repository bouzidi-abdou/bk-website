import { NextResponse, type NextRequest } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applicationTypes, applications, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { notifyAdminsNewApplication } from "@/lib/notify";
import {
  guardLimit,
  publicOrigin,
  sameOrigin,
  sanitize,
} from "@/lib/security";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Public: open positions + my previous applications */
export async function GET() {
  const session = await getSessionUser();
  try {
    const types = await db
      .select()
      .from(applicationTypes)
      .orderBy(asc(applicationTypes.sortOrder));

    let mine: {
      id: string;
      code: string;
      typeId: string;
      status: string;
      createdAt: Date;
    }[] = [];

    if (session) {
      mine = await db
        .select({
          id: applications.id,
          code: applications.code,
          typeId: applications.typeId,
          status: applications.status,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .where(eq(applications.userId, session.id))
        .orderBy(desc(applications.createdAt))
        .limit(20);
    }

    return NextResponse.json({ types, mine, guest: !session });
  } catch {
    return NextResponse.json({ types: [], mine: [], guest: !session });
  }
}

/** Submit an application */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { message: "سجّل دخولك عبر ديسكورد لتتمكن من التقديم" },
      { status: 401 }
    );
  }
  const limited = guardLimit(req, "ticketCreate", session.id);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const typeId = String(body.typeId ?? "");
  if (!UUID_RE.test(typeId)) {
    return NextResponse.json({ message: "نوع التقديم غير صالح" }, { status: 400 });
  }

  const fullName = sanitize(body.fullName, 80);
  const productTypes = sanitize(body.productTypes, 300);
  if (!fullName || fullName.length < 3) {
    return NextResponse.json({ message: "الاسم الكامل مطلوب" }, { status: 400 });
  }
  if (!body.agree) {
    return NextResponse.json(
      { message: "يجب الموافقة على الشروط قبل الإرسال" },
      { status: 400 }
    );
  }

  try {
    const [type] = await db
      .select()
      .from(applicationTypes)
      .where(eq(applicationTypes.id, typeId))
      .limit(1);

    if (!type) {
      return NextResponse.json({ message: "التقديم غير موجود" }, { status: 404 });
    }
    if (!type.open) {
      return NextResponse.json(
        { message: type.closedNote || "التقديم مغلق حالياً" },
        { status: 409 }
      );
    }

    const [pending] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eq(applications.userId, session.id),
          eq(applications.typeId, typeId),
          eq(applications.status, "pending")
        )
      )
      .limit(1);
    if (pending) {
      return NextResponse.json(
        { message: "لديك طلب قيد المراجعة على هذا القسم بالفعل" },
        { status: 409 }
      );
    }

    const code = `AP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [created] = await db
      .insert(applications)
      .values({
        code,
        typeId,
        userId: session.id,
        fullName,
        nickname: sanitize(body.nickname, 60) || null,
        location: sanitize(body.location, 80) || null,
        age: sanitize(body.age, 10) || null,
        hobbies: sanitize(body.hobbies, 300) || null,
        productTypes: productTypes || null,
        experience: sanitize(body.experience, 600) || null,
        contact: sanitize(body.contact, 120) || null,
        note: sanitize(body.note, 600) || null,
      })
      .returning();

    const [me] = await db
      .select({ avatar: users.avatar, globalName: users.globalName })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);

    await notifyAdminsNewApplication({
      code,
      typeTitle: type.title,
      fullName,
      productTypes: productTypes || "—",
      username: session.username,
      globalName: me?.globalName ?? session.globalName,
      discordId: session.discordId,
      avatarHash: me?.avatar ?? null,
      origin: publicOrigin(req),
    }).catch((err: unknown) => console.error("[applications] notify failed:", err));

    return NextResponse.json({ ok: true, application: created });
  } catch (e) {
    console.error("[applications] submit failed:", e);
    return NextResponse.json({ message: "تعذّر إرسال الطلب" }, { status: 500 });
  }
}
