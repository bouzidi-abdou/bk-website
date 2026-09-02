import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { env } from "@/lib/env";
import { TINTS } from "@/lib/utils";
import { getCategoryMap } from "@/lib/categories";
import { ICONS } from "@/components/product-icon";
import {
  guardLimit,
  getClientIp,
  isValidHttpUrl,
  rateLimit,
  sameOrigin,
  sanitize,
  sanitizeMultiline,
  tooManyRequests,
} from "@/lib/security";

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
  const ok = await isAdminUser(session.discordId);
  if (!ok) {
    return NextResponse.json({ message: "لا تملك صلاحيات الإدارة" }, { status: 403 });
  }
  return session;
}

function makeSlug(nameEn: string, name: string) {
  const base = (nameEn || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return `${base || "product"}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

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
  const price = Number(body.price);
  const oldPrice = body.oldPrice ? Number(body.oldPrice) : null;
  const stock = Math.max(0, Math.min(99999, Math.floor(Number(body.stock) || 0)));
  const imageUrl = sanitize(body.imageUrl, 600);

  if (!name || name.length < 3)
    return NextResponse.json({ message: "اسم المنتج مطلوب (3 أحرف فأكثر)" }, { status: 400 });
  if (!description || description.length < 10)
    return NextResponse.json({ message: "الوصف مطلوب (10 أحرف فأكثر)" }, { status: 400 });
  const catMap = await getCategoryMap();
  if (!catMap[category])
    return NextResponse.json({ message: "القسم غير صحيح" }, { status: 400 });
  if (!Number.isFinite(price) || price <= 0 || price > 99999)
    return NextResponse.json({ message: "السعر غير صالح" }, { status: 400 });
  if (imageUrl && !isValidHttpUrl(imageUrl, true))
    return NextResponse.json({ message: "رابط الصورة يجب أن يبدأ بـ https" }, { status: 400 });

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
        oldPrice:
          oldPrice && Number.isFinite(oldPrice) && oldPrice > price && oldPrice < 999999
            ? oldPrice.toFixed(2)
            : null,
        icon: ICONS[icon] ? icon : "Package",
        tint: TINTS[tint] ? tint : "violet",
        imageUrl: imageUrl || null,
        publisherId: g.id,
        badge: sanitize(body.badge, 40) || null,
        deliveryTime: sanitize(body.deliveryTime, 60) || "فوري",
        stock,
        rating: "5.0",
        sales: 0,
        features: sanitizeMultiline(body.features, 8, 140),
        featured: Boolean(body.featured),
      })
      .returning();

    return NextResponse.json({ ok: true, product: created });
  } catch {
    return NextResponse.json({ message: "تعذّر حفظ المنتج" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: Record<string, unknown> & { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!body.id || !UUID_RE.test(body.id)) {
    return NextResponse.json({ message: "معرّف المنتج غير صالح" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.stock === "number" && Number.isFinite(body.stock)) {
    patch.stock = Math.max(0, Math.min(99999, Math.floor(body.stock)));
  }
  if (typeof body.featured === "boolean") patch.featured = body.featured;

  if (typeof body.name === "string") {
    const v = sanitize(body.name, 120);
    if (v.length >= 3) patch.name = v;
  }
  if (typeof body.description === "string") {
    const v = sanitize(body.description, 1200);
    if (v.length >= 10) patch.description = v;
  }
  if (typeof body.price === "number" || typeof body.price === "string") {
    const v = Number(body.price);
    if (Number.isFinite(v) && v > 0 && v < 99999) patch.price = v.toFixed(2);
  }
  if (body.oldPrice === null || body.oldPrice === "") {
    patch.oldPrice = null;
  } else if (typeof body.oldPrice === "number" || typeof body.oldPrice === "string") {
    const v = Number(body.oldPrice);
    if (Number.isFinite(v) && v > 0 && v < 999999) patch.oldPrice = v.toFixed(2);
  }
  if (typeof body.badge === "string") {
    patch.badge = sanitize(body.badge, 40) || null;
  }
  if (typeof body.deliveryTime === "string") {
    patch.deliveryTime = sanitize(body.deliveryTime, 60) || "فوري";
  }
  if (typeof body.imageUrl === "string") {
    const v = sanitize(body.imageUrl, 600);
    if (!v || isValidHttpUrl(v, true)) patch.imageUrl = v || null;
  }
  if (typeof body.category === "string") {
    const v = sanitize(body.category, 24);
    const map = await getCategoryMap();
    if (map[v]) patch.category = v;
  }
  if (typeof body.icon === "string") {
    const v = sanitize(body.icon, 40);
    if (ICONS[v]) patch.icon = v;
  }
  if (typeof body.tint === "string") {
    const v = sanitize(body.tint, 24);
    if (TINTS[v]) patch.tint = v;
  }
  // per-product coupon
  if (body.couponCode === null || body.couponCode === "") {
    patch.couponCode = null;
    patch.couponPercent = null;
  } else if (typeof body.couponCode === "string") {
    const code = sanitize(body.couponCode, 24).toUpperCase();
    const pct = Math.round(Number(body.couponPercent));
    if (code && Number.isFinite(pct) && pct > 0 && pct <= 90) {
      patch.couponCode = code;
      patch.couponPercent = pct;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: "لا يوجد تعديل" }, { status: 400 });
  }

  try {
    const [updated] = await db
      .update(products)
      .set(patch)
      .where(eq(products.id, body.id))
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
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  const id = req.nextUrl.searchParams.get("id") ?? "";
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ message: "معرّف المنتج غير صالح" }, { status: 400 });
  }

  try {
    await db.delete(products).where(eq(products.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "تعذّر الحذف" }, { status: 500 });
  }
}
