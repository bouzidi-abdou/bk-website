import { NextResponse, type NextRequest } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, ticketMessages, tickets } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { addTicketMessage, ticketCode } from "@/lib/tickets";
import { notifyAdminsNewMessage } from "@/lib/notify";
import {
  guardLimit,
  getClientIp,
  publicOrigin,
  rateLimit,
  sameOrigin,
  sanitize,
  tooManyRequests,
} from "@/lib/security";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ?id=... → thread | otherwise → my tickets */
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ tickets: [], guest: true });
  }

  const id = req.nextUrl.searchParams.get("id");

  try {
    if (id && UUID_RE.test(id)) {
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.id, id), eq(tickets.userId, session.id)))
        .limit(1);
      if (!ticket) {
        return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
      }

      const msgs = await db
        .select()
        .from(ticketMessages)
        .where(eq(ticketMessages.ticketId, ticket.id))
        .orderBy(asc(ticketMessages.createdAt))
        .limit(300);

      await db
        .update(tickets)
        .set({ unreadForUser: 0 })
        .where(eq(tickets.id, ticket.id));

      return NextResponse.json({ ticket, messages: msgs });
    }

    const rows = await db
      .select({
        id: tickets.id,
        code: tickets.code,
        subject: tickets.subject,
        status: tickets.status,
        lastMessageAt: tickets.lastMessageAt,
        unreadForUser: tickets.unreadForUser,
        createdAt: tickets.createdAt,
        productName: products.name,
        productIcon: products.icon,
        productTint: products.tint,
        orderTotal: orders.total,
      })
      .from(tickets)
      .leftJoin(orders, eq(tickets.orderId, orders.id))
      .leftJoin(products, eq(orders.productId, products.id))
      .where(eq(tickets.userId, session.id))
      .orderBy(desc(tickets.lastMessageAt))
      .limit(50);

    return NextResponse.json({ tickets: rows, guest: false });
  } catch {
    return NextResponse.json({ tickets: [], guest: false });
  }
}

/** Send a reply, or open a new general ticket. */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }

  let body: { ticketId?: string; body?: string; subject?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const text = sanitize(body.body, 1200);
  if (!text) {
    return NextResponse.json({ message: "الرسالة فارغة" }, { status: 400 });
  }

  try {
    let ticketId = body.ticketId;

    const limited = guardLimit(
      req,
      ticketId ? "ticketReply" : "ticketCreate",
      session.id
    );
    if (limited) return limited;

    // open a new general ticket
    if (!ticketId) {
      const [t] = await db
        .insert(tickets)
        .values({
          code: ticketCode(),
          userId: session.id,
          subject: sanitize(body.subject, 90) || "استفسار عام",
          status: "open",
        })
        .returning();
      ticketId = t.id;
    } else {
      if (!UUID_RE.test(ticketId)) {
        return NextResponse.json({ message: "تذكرة غير صالحة" }, { status: 400 });
      }
      const [owned] = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.id, ticketId), eq(tickets.userId, session.id)))
        .limit(1);
      if (!owned) {
        return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
      }
      if (owned.status === "closed") {
        return NextResponse.json(
          { message: "التذكرة مغلقة — افتح تذكرة جديدة" },
          { status: 409 }
        );
      }
    }

    const msg = await addTicketMessage({
      ticketId,
      body: text,
      fromAdmin: false,
      authorName: session.globalName || session.username,
    });

    const [t] = await db
      .select({ code: tickets.code })
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    await notifyAdminsNewMessage({
      body: text,
      username: session.username,
      globalName: session.globalName,
      discordId: session.discordId,
      ticketCode: t?.code ?? null,
      origin: publicOrigin(req),
    }).catch((e) => console.error("[tickets] notify failed:", e));

    return NextResponse.json({ ok: true, ticketId, message: msg });
  } catch (e) {
    console.error("[tickets] post failed:", e);
    return NextResponse.json({ message: "تعذّر الإرسال" }, { status: 500 });
  }
}
