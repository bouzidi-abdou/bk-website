import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { coinTx, userEffects, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { formatCoins } from "@/lib/coins";
import { ALL_COSMETICS, getCosmetic, planOf } from "@/lib/effects";
import {
  guardLimit,
  getClientIp,
  rateLimit,
  sameOrigin,
  sanitize,
  tooManyRequests,
} from "@/lib/security";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ owned: [], guest: true });
  }
  try {
    const [me] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    const rows = await db
      .select({ effectId: userEffects.effectId })
      .from(userEffects)
      .where(eq(userEffects.userId, session.id));

    return NextResponse.json({
      guest: false,
      owned: rows.map((r) => r.effectId),
      balance: me?.balance ?? "0",
      plan: planOf(me ?? {}),
      activeEffect: me?.activeEffect ?? null,
      activeFrame: me?.activeFrame ?? null,
    });
  } catch {
    return NextResponse.json({ owned: [], guest: false });
  }
}

/** Buy a cosmetic with BK COIN */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const limited = guardLimit(req, "cosmeticBuy", session.id);
  if (limited) return limited;

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const item = getCosmetic(sanitize(body.id, 40));
  if (!item) {
    return NextResponse.json({ message: "العنصر غير موجود" }, { status: 404 });
  }

  try {
    const [me] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    if (!me) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }

    const [owned] = await db
      .select()
      .from(userEffects)
      .where(
        and(
          eq(userEffects.userId, session.id),
          eq(userEffects.effectId, item.id)
        )
      )
      .limit(1);
    if (owned || item.price === 0) {
      return NextResponse.json({ ok: true, alreadyOwned: true });
    }

    // PREMIUM members get every cosmetic for free
    const plan = planOf(me);
    const free = plan === "premium";
    const balance = Number(me.balance);

    if (!free && balance < item.price) {
      return NextResponse.json(
        {
          message: `رصيد غير كافٍ — السعر ${formatCoins(
            item.price
          )} BK ورصيدك ${formatCoins(balance)} BK`,
        },
        { status: 409 }
      );
    }

    if (!free) {
      await db
        .update(users)
        .set({ balance: String(balance - item.price) })
        .where(eq(users.id, me.id));
      await db.insert(coinTx).values({
        userId: me.id,
        amount: String(-item.price),
        kind: "purchase",
        note: `تأثير: ${item.name}`,
      });
    }

    await db.insert(userEffects).values({
      userId: me.id,
      effectId: item.id,
      kind: item.category,
    });

    return NextResponse.json({ ok: true, free });
  } catch {
    return NextResponse.json({ message: "تعذّر إتمام الشراء" }, { status: 500 });
  }
}

/** Equip / unequip owned cosmetics */
export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const limited = guardLimit(req, "cosmeticEquip", session.id);
  if (limited) return limited;

  let body: { effect?: string | null; frame?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  try {
    const [me] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    if (!me) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }

    const rows = await db
      .select({ effectId: userEffects.effectId })
      .from(userEffects)
      .where(eq(userEffects.userId, session.id));
    const owned = new Set(rows.map((r) => r.effectId));
    const premium = planOf(me) === "premium";

    const canUse = (id: string | null | undefined) => {
      if (!id) return true;
      const c = getCosmetic(id);
      // unknown / retired cosmetic → reject so stale ids cannot stick
      if (!c) return false;
      // PREMIUM unlocks the whole catalogue, free items are always allowed
      if (premium || c.price === 0) return true;
      return owned.has(id);
    };

    if (!canUse(body.effect) || !canUse(body.frame)) {
      return NextResponse.json(
        { message: "لا تملك هذا العنصر بعد" },
        { status: 403 }
      );
    }

    await db
      .update(users)
      .set({
        activeEffect: body.effect ?? null,
        activeFrame: body.frame ?? null,
      })
      .where(eq(users.id, me.id));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "تعذّر الحفظ" }, { status: 500 });
  }
}

export const CATALOG = ALL_COSMETICS;
