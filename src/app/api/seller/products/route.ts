import { NextResponse, type NextRequest } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, products } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { resolveSeller, SELLER_COMMISSION } from "@/lib/seller";
import { getCategoryMap } from "@/lib/categories";
import { TINTS } from "@/lib/utils";
import { ICONS } from "@/components/product-icon";
import {
  guardLimit,
  isValidHttpUrl,
  sameOrigin,
  sanitize,
  sanitizeMultiline,
} from "@/lib/security";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function makeSlug(nameEn: string, name: string) {
  const base = (nameEn || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return `${base || "product"}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Seller's own products + earnings summary */
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const { seller } = await resolveSeller(session);
  if (!seller) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }

  try {
    const mine = await db
      .select()
      .from(products)
      .where(eq(products.publisherId, session.id))
      .orderBy(desc(products.createdAt))
      .limit(100);

    const [sales] = await db
      .select({
        count: sql<number>`count(*)::int`,
        gross: sql<string>`coalesce(sum(${orders.total}), 0)`,
      })
      .from(orders)
      .innerJoin(products, eq(orders.productId, products.id))
      .where(
        and(
          eq(products.publisherId, session.id),
          sql`${orders.status} <> 'cancelled'`
        )
      );

    const gross = Number(sales?.gross ?? 0);
    return NextResponse.json({
      products: mine,
      stats: {
        listed: mine.length,
        sales: sales?.count ?? 0,
        gross: gross.toFixed(2),
        commission: (gross * SELLER_COMMISSION).toFixed(2),
        net: (gross * (1 - SELLER_COMMISSION)).toFixed(2),
        commissionRate: SELLER_COMMISSION,
      },
    });
  } catch {
    return NextResponse.json({ products: [], stats: null });
  }
}

/** Publish a new product as a seller */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const { seller } = await resolveSeller(session);
  if (!seller) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }
  const limited = guardLimit(req, "adminWrite", session.id);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const name = sanitize(body.name, 120);
  const description = sanitize(body.description, 1200);
  const category = sanitize(body.category, 24);
  const icon = sanitize(body.icon, 40);
  const tint = sanitize(body.tint, 24);
  const imageUrl = sanitize(body.imageUrl, 600);
  const price = Number(body.price);
  const stock = Math.max(0, Math.min(9999, Math.floor(Number(body.stock) || 0)));

  if (!name || name.length < 3) {
    return NextResponse.json({ message: "اسم المنتج مطلوب" }, { status: 400 });
  }
  if (!description || description.length < 10) {
    return NextResponse.json({ message: "الوصف مطلوب" }, { status: 400 });
  }
  const catMap = await getCategoryMap();
  if (!catMap[category]) {
    return NextResponse.json({ message: "القسم غير صحيح" }, { status: 400 });
  }
  if (!Number.isFinite(price) || price <= 0 || price > 9999) {
    return NextResponse.json({ message: "السعر غير صالح" }, { status: 400 });
  }
  if (imageUrl && !isValidHttpUrl(imageUrl, true)) {
    return NextResponse.json({ message: "رابط الصورة يجب أن يبدأ بـ https" }, { status: 400 });
  }

  try {
    const [created] = await db
      .insert(products)
      .values({
        slug: makeSlug(sanitize(body.nameEn, 80), name),
        name,
        nameEn: sanitize(body.nameEn, 120) || null,
        description,
        category,
        price: price.toFixed(2),
        icon: ICONS[icon] ? icon : "Package",
        tint: TINTS[tint] ? tint : "violet",
        imageUrl: imageUrl || null,
        publisherId: session.id,
        deliveryTime: sanitize(body.deliveryTime, 60) || "فوري",
        stock,
        rating: "5.0",
        sales: 0,
        features: sanitizeMultiline(body.features, 8, 140),
        featured: false,
      })
      .returning();

    return NextResponse.json({ ok: true, product: created });
  } catch {
    return NextResponse.json({ message: "تعذّر نشر المنتج" }, { status: 500 });
  }
}

/** Update stock / price of an own product */
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const { seller } = await resolveSeller(session);
  if (!seller) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }

  let body: { id?: string; stock?: number; price?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }
  if (!body.id || !UUID_RE.test(body.id)) {
    return NextResponse.json({ message: "منتج غير صالح" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.stock === "number" && Number.isFinite(body.stock)) {
    patch.stock = Math.max(0, Math.min(9999, Math.floor(body.stock)));
  }
  if (typeof body.price === "number" && Number.isFinite(body.price)) {
    if (body.price > 0 && body.price < 9999) patch.price = body.price.toFixed(2);
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "لا يوجد تعديل" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(products)
      .set(patch)
      .where(
        and(eq(products.id, body.id), eq(products.publisherId, session.id))
      )
      .returning();
    if (!updated) {
      return NextResponse.json({ message: "المنتج غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product: updated });
  } catch {
    return NextResponse.json({ message: "تعذّر التحديث" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const { seller } = await resolveSeller(session);
  if (!seller) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ message: "منتج غير صالح" }, { status: 400 });
  }
  try {
    await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.publisherId, session.id)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
