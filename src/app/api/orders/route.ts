import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coinTx, orders, products, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { notifyAdminsNewOrder } from "@/lib/notify";
import { formatCoins, usdToCoins } from "@/lib/coins";
import { planDiscount, planOf } from "@/lib/effects";
import { createOrderTicket } from "@/lib/tickets";
import {
  guardLimit,
  getClientIp,
  publicOrigin,
  rateLimit,
  sameOrigin,
  tooManyRequests,
} from "@/lib/security";

const PAYMENT_METHODS = new Set(["card", "balance"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: orders.id,
      quantity: orders.quantity,
      unitPrice: orders.unitPrice,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      status: orders.status,
      createdAt: orders.createdAt,
      productName: products.name,
      productSlug: products.slug,
      productIcon: products.icon,
      productTint: products.tint,
    })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.userId, session.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  return NextResponse.json({ orders: rows });
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { error: "unauthorized", message: "سجّل دخولك عبر ديسكورد أولاً لإتمام الشراء" },
      { status: 401 }
    );
  }
  const limited = guardLimit(req, "order", session.id);
  if (limited) return limited;

  let body: {
    productId?: string;
    quantity?: number;
    paymentMethod?: string;
    coupon?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  const quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 10);
  const paymentMethod = PAYMENT_METHODS.has(body.paymentMethod ?? "")
    ? body.paymentMethod!
    : "card";

  if (!body.productId || !UUID_RE.test(body.productId)) {
    return NextResponse.json({ message: "المنتج غير موجود" }, { status: 404 });
  }

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, body.productId))
      .limit(1);

    if (!product) {
      return NextResponse.json({ message: "المنتج غير موجود" }, { status: 404 });
    }
    if (product.stock < quantity) {
      return NextResponse.json(
        { message: "الكمية المطلوبة غير متوفرة حالياً" },
        { status: 409 }
      );
    }

    const unit = Number(product.price);
    const subtotal = unit * quantity;

    // buyer tier discount
    const [buyerRow] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    const tier = buyerRow ? planOf(buyerRow) : "free";
    let discountRate = planDiscount(tier);

    // per-product coupon
    const submitted = (body.coupon ?? "").trim().toUpperCase().slice(0, 24);
    if (
      submitted &&
      product.couponCode &&
      submitted === product.couponCode.toUpperCase() &&
      product.couponPercent
    ) {
      discountRate = Math.max(discountRate, product.couponPercent / 100);
    }

    const discountValue = subtotal * discountRate;
    const total = Math.max(0, subtotal - discountValue);

    // BK COIN wallet payment (1 BK COIN = 1 USD)
    if (paymentMethod === "balance") {
      const [buyer] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.id))
        .limit(1);
      const bal = Number(buyer?.balance ?? 0);
      const cost = usdToCoins(total);
      if (bal < cost) {
        return NextResponse.json(
          {
            message: `رصيد BK COIN غير كافٍ — رصيدك ${formatCoins(bal)} والمطلوب ${formatCoins(cost)}`,
          },
          { status: 409 }
        );
      }
      await db
        .update(users)
        .set({ balance: String(bal - cost) })
        .where(eq(users.id, session.id));
      await db.insert(coinTx).values({
        userId: session.id,
        amount: String(-cost),
        kind: "purchase",
        note: product.name,
      });
    }

    const [order] = await db
      .insert(orders)
      .values({
        userId: session.id,
        productId: product.id,
        quantity,
        unitPrice: unit.toFixed(2),
        discount: discountValue.toFixed(2),
        total: total.toFixed(2),
        paymentMethod,
        status: "processing",
      })
      .returning();

    await db
      .update(products)
      .set({
        stock: Math.max(0, product.stock - quantity),
        sales: product.sales + quantity,
      })
      .where(eq(products.id, product.id));

    const code = `BK-${order.id.slice(0, 8).toUpperCase()}`;

    // auto-open a support ticket for this order
    let ticketCodeStr: string | null = null;
    try {
      const t = await createOrderTicket({
        userId: session.id,
        orderId: order.id,
        orderCode: code,
        productName: product.name,
        quantity,
        total: total.toFixed(2),
        paymentMethod,
      });
      ticketCodeStr = t.code;
    } catch (e) {
      console.error("[orders] ticket creation failed:", e);
    }

    // must be awaited: serverless functions freeze right after responding
    await notifyAdminsNewOrder({
      code,
      productName: product.name,
      productSlug: product.slug,
      quantity,
      total: total.toFixed(2),
      paymentMethod,
      status: "processing",
      buyerUsername: session.username,
      buyerGlobalName: session.globalName,
      buyerDiscordId: session.discordId,
      ticketCode: ticketCodeStr,
      origin: publicOrigin(req),
    }).catch((e) => console.error("[orders] notify failed:", e));

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        code,
        ticketCode: ticketCodeStr,
        quantity,
        total: total.toFixed(2),
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "تعذّر إتمام الطلب حالياً — حاول بعد قليل" },
      { status: 500 }
    );
  }
}

/** Customer-side cancellation — only own orders that are still processing. */
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const limited = guardLimit(req, "orderCancel", session.id);
  if (limited) return limited;

  let body: { id?: string; action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!body.id || !UUID_RE.test(body.id) || body.action !== "cancel") {
    return NextResponse.json({ message: "طلب غير صالح" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, body.id), eq(orders.userId, session.id)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
    }
    if (existing.status !== "processing") {
      return NextResponse.json(
        { message: "لا يمكن إلغاء هذا الطلب — تمت معالجته بالفعل" },
        { status: 409 }
      );
    }

    const [updated] = await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, existing.id))
      .returning();

    // refund BK COIN if the order was paid from the wallet
    if (existing.paymentMethod === "balance") {
      const [buyer] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.id))
        .limit(1);
      if (buyer) {
        const back = usdToCoins(Number(existing.total));
        await db
          .update(users)
          .set({ balance: String(Number(buyer.balance) + back) })
          .where(eq(users.id, session.id));
        await db.insert(coinTx).values({
          userId: session.id,
          amount: String(back),
          kind: "refund",
          note: "إلغاء طلب",
        });
      }
    }

    // restore stock
    const [prod] = await db
      .select()
      .from(products)
      .where(eq(products.id, existing.productId))
      .limit(1);
    if (prod) {
      await db
        .update(products)
        .set({
          stock: prod.stock + existing.quantity,
          sales: Math.max(0, prod.sales - existing.quantity),
        })
        .where(eq(products.id, prod.id));
    }

    return NextResponse.json({ ok: true, status: updated.status });
  } catch {
    return NextResponse.json({ message: "تعذّر إلغاء الطلب" }, { status: 500 });
  }
}
