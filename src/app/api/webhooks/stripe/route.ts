import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, users } from "@/db/schema";
import { env } from "@/lib/env";
import { notifyAdminsNewOrder } from "@/lib/notify";
import { publicOrigin } from "@/lib/security";

/**
 * Stripe fulfilment webhook.
 * Configure in Stripe Dashboard → Developers → Webhooks:
 *   endpoint: https://YOUR-DOMAIN/api/webhooks/stripe
 *   event:    checkout.session.completed
 */
export async function POST(req: NextRequest) {
  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ received: true, skipped: "no-key" });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const raw = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    if (env.STRIPE_WEBHOOK_SECRET && signature) {
      event = stripe.webhooks.constructEvent(
        raw,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );
    } else {
      event = JSON.parse(raw) as Stripe.Event;
    }
  } catch (e) {
    console.error("[stripe] invalid webhook signature:", e);
    return NextResponse.json({ message: "invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const s = event.data.object as Stripe.Checkout.Session;
  const productId = s.metadata?.productId;
  const userId = s.metadata?.userId;
  const quantity = Math.max(1, Number(s.metadata?.quantity ?? 1));

  if (!productId || !userId) {
    return NextResponse.json({ received: true, skipped: "no-metadata" });
  }

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (!product) return NextResponse.json({ received: true });

    const total = (s.amount_total ?? 0) / 100;

    const [order] = await db
      .insert(orders)
      .values({
        userId,
        productId,
        quantity,
        unitPrice: Number(product.price).toFixed(2),
        discount: "0",
        total: total.toFixed(2),
        paymentMethod: "card",
        status: "processing",
      })
      .returning();

    await db
      .update(products)
      .set({
        stock: Math.max(0, product.stock - quantity),
        sales: product.sales + quantity,
      })
      .where(eq(products.id, productId));

    const [buyer] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await notifyAdminsNewOrder({
      code: `BK-${order.id.slice(0, 8).toUpperCase()}`,
      productName: product.name,
      productSlug: product.slug,
      quantity,
      total: total.toFixed(2),
      paymentMethod: "card",
      buyerUsername: buyer?.username ?? "unknown",
      buyerGlobalName: buyer?.globalName ?? null,
      buyerDiscordId: buyer?.discordId ?? "0",
      buyerAvatarHash: buyer?.avatar ?? null,
      origin: publicOrigin(req),
    }).catch((e) => console.error("[stripe] notify failed:", e));

    return NextResponse.json({ received: true, orderId: order.id });
  } catch (e) {
    console.error("[stripe] fulfilment failed:", e);
    return NextResponse.json({ received: true, error: true });
  }
}
