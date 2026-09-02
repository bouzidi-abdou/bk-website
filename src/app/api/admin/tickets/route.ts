import { NextResponse, type NextRequest } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  orders,
  products,
  ticketMessages,
  tickets,
  users,
} from "@/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { avatarUrl } from "@/lib/discord";
import { addTicketMessage } from "@/lib/tickets";
import { env } from "@/lib/env";
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
const STATUSES = new Set(["open", "pending", "closed"]);

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

/** ?id=... → full ticket | otherwise → list */
export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const id = req.nextUrl.searchParams.get("id");

  try {
    if (id && UUID_RE.test(id)) {
      const [row] = await db
        .select({
          ticket: tickets,
          user: {
            id: users.id,
            username: users.username,
            globalName: users.globalName,
            discordId: users.discordId,
            avatar: users.avatar,
            balance: users.balance,
            createdAt: users.createdAt,
          },
          order: {
            id: orders.id,
            total: orders.total,
            quantity: orders.quantity,
            status: orders.status,
            paymentMethod: orders.paymentMethod,
          },
          product: {
            name: products.name,
            slug: products.slug,
            icon: products.icon,
            tint: products.tint,
          },
        })
        .from(tickets)
        .innerJoin(users, eq(tickets.userId, users.id))
        .leftJoin(orders, eq(tickets.orderId, orders.id))
        .leftJoin(products, eq(orders.productId, products.id))
        .where(eq(tickets.id, id))
        .limit(1);

      if (!row) {
        return NextResponse.json({ message: "غير موجودة" }, { status: 404 });
      }

      const msgs = await db
        .select()
        .from(ticketMessages)
        .where(eq(ticketMessages.ticketId, id))
        .orderBy(asc(ticketMessages.createdAt))
        .limit(300);

      await db
        .update(tickets)
        .set({ unreadForAdmin: 0 })
        .where(eq(tickets.id, id));

      return NextResponse.json({
        ticket: row.ticket,
        user: { ...row.user, avatarUrl: avatarUrl(row.user.discordId, row.user.avatar) },
        order: row.order,
        product: row.product,
        messages: msgs,
      });
    }

    const rows = await db
      .select({
        id: tickets.id,
        code: tickets.code,
        subject: tickets.subject,
        status: tickets.status,
        lastMessageAt: tickets.lastMessageAt,
        unreadForAdmin: tickets.unreadForAdmin,
        createdAt: tickets.createdAt,
        username: users.username,
        globalName: users.globalName,
        discordId: users.discordId,
        avatar: users.avatar,
        orderTotal: orders.total,
        productName: products.name,
        productIcon: products.icon,
        productTint: products.tint,
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.userId, users.id))
      .leftJoin(orders, eq(tickets.orderId, orders.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .orderBy(desc(tickets.lastMessageAt))
      .limit(150);

    return NextResponse.json({
      tickets: rows.map((r) => ({
        ...r,
        avatarUrl: avatarUrl(r.discordId, r.avatar),
      })),
    });
  } catch (e) {
    console.error("[admin/tickets] list failed:", e);
    return NextResponse.json({ tickets: [] });
  }
}

/** Admin reply */
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { ticketId?: string; body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!body.ticketId || !UUID_RE.test(body.ticketId)) {
    return NextResponse.json({ message: "تذكرة غير صالحة" }, { status: 400 });
  }
  const text = sanitize(body.body, 1200);
  if (!text) {
    return NextResponse.json({ message: "الرسالة فارغة" }, { status: 400 });
  }

  try {
    const msg = await addTicketMessage({
      ticketId: body.ticketId,
      body: text,
      fromAdmin: true,
      authorName: g.globalName || g.username,
    });
    await db
      .update(tickets)
      .set({ unreadForAdmin: 0 })
      .where(eq(tickets.id, body.ticketId));
    return NextResponse.json({ ok: true, message: msg });
  } catch {
    return NextResponse.json({ message: "تعذّر الإرسال" }, { status: 500 });
  }
}

/** Change status (open / pending / closed) */
export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { id?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!body.id || !UUID_RE.test(body.id) || !STATUSES.has(body.status ?? "")) {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(tickets)
      .set({ status: body.status! })
      .where(eq(tickets.id, body.id))
      .returning();
    if (!updated) {
      return NextResponse.json({ message: "غير موجودة" }, { status: 404 });
    }

    await db.insert(ticketMessages).values({
      ticketId: body.id,
      system: true,
      fromAdmin: true,
      authorName: "النظام",
      body:
        body.status === "closed"
          ? `تم إغلاق التذكرة بواسطة ${g.globalName || g.username}.`
          : body.status === "pending"
            ? "التذكرة قيد المراجعة من الإدارة."
            : `تم إعادة فتح التذكرة بواسطة ${g.globalName || g.username}.`,
    });

    return NextResponse.json({ ok: true, status: updated.status });
  } catch {
    return NextResponse.json({ message: "تعذّر التحديث" }, { status: 500 });
  }
}
