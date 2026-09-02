import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ticketMessages, tickets } from "@/db/schema";

export function ticketCode() {
  return `TK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** Creates a support ticket for an order and posts the opening system note. */
export async function createOrderTicket(opts: {
  userId: string;
  orderId: string;
  orderCode: string;
  productName: string;
  quantity: number;
  total: string;
  paymentMethod: string;
}) {
  const code = ticketCode();
  const [ticket] = await db
    .insert(tickets)
    .values({
      code,
      userId: opts.userId,
      orderId: opts.orderId,
      subject: `طلب ${opts.productName}`,
      status: "open",
      unreadForAdmin: 1,
    })
    .returning();

  await db.insert(ticketMessages).values({
    ticketId: ticket.id,
    system: true,
    fromAdmin: true,
    authorName: "النظام",
    body: [
      `تم فتح تذكرة لمتابعة طلبك ${opts.orderCode}.`,
      `المنتج: ${opts.productName}`,
      `الكمية: ${opts.quantity} · الإجمالي: $${opts.total}`,
      `طريقة الدفع: ${opts.paymentMethod}`,
      "",
      "فريق BK MARKET سيتواصل معك هنا خلال دقائق — يمكنك كتابة أي استفسار مباشرة.",
    ].join("\n"),
  });

  return ticket;
}

export async function addTicketMessage(opts: {
  ticketId: string;
  body: string;
  fromAdmin: boolean;
  authorName: string;
}) {
  const [msg] = await db
    .insert(ticketMessages)
    .values({
      ticketId: opts.ticketId,
      body: opts.body,
      fromAdmin: opts.fromAdmin,
      authorName: opts.authorName,
    })
    .returning();

  await db
    .update(tickets)
    .set({
      lastMessageAt: new Date(),
      ...(opts.fromAdmin
        ? { unreadForUser: sql`${tickets.unreadForUser} + 1` }
        : { unreadForAdmin: sql`${tickets.unreadForAdmin} + 1` }),
      status: "open",
    })
    .where(eq(tickets.id, opts.ticketId));

  return msg;
}
