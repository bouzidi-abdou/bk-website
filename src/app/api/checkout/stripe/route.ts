import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import {
  guardLimit,
  getClientIp,
  publicOrigin,
  rateLimit,
  sameOrigin,
  tooManyRequests,
} from "@/lib/security";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Creates a Stripe Checkout Session.
 * Stripe automatically renders Apple Pay / Google Pay wallets alongside
 * the card form, so the customer never types card data into our site.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json(
      { message: "سجّل دخولك عبر ديسكورد أولاً" },
      { status: 401 }
    );
  }
  const limited = guardLimit(req, "checkout", session.id);
  if (limited) return limited;

  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        message:
          "بوابة الدفع بالبطاقة غير مفعّلة بعد — أضف STRIPE_SECRET_KEY في إعدادات الموقع.",
        notConfigured: true,
      },
      { status: 503 }
    );
  }

  let body: { productId?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!body.productId || !UUID_RE.test(body.productId)) {
    return NextResponse.json({ message: "المنتج غير موجود" }, { status: 404 });
  }
  const quantity = Math.min(Math.max(Number(body.quantity) || 1, 1), 10);

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

    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const origin = publicOrigin(req).replace(/\/+$/, "");

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      // card automatically surfaces Apple Pay / Google Pay on supported devices
      payment_method_types: ["card"],
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(Number(product.price) * 100),
            product_data: {
              name: product.name,
              description: product.description.slice(0, 300),
              ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
            },
          },
        },
      ],
      metadata: {
        productId: product.id,
        userId: session.id,
        discordId: session.discordId,
        quantity: String(quantity),
      },
      client_reference_id: session.id,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/product/${product.slug}?canceled=1`,
    });

    return NextResponse.json({ ok: true, url: checkout.url });
  } catch (e) {
    console.error("[stripe] checkout failed:", e);
    return NextResponse.json(
      { message: "تعذّر إنشاء جلسة الدفع — حاول مجدداً" },
      { status: 500 }
    );
  }
}
