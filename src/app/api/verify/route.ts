import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { coinTx, users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { formatCoins } from "@/lib/coins";
import { PLANS, planOf } from "@/lib/effects";
import {
  guardLimit,
  getClientIp,
  rateLimit,
  sameOrigin,
  tooManyRequests,
} from "@/lib/security";

export async function GET() {
  const session = await getSessionUser();
  let current: {
    verified: boolean;
    until: Date | null;
    balance: string;
    plan: string;
  } | null = null;
  if (session) {
    const [row] = await db
      .select({
        verified: users.verified,
        verifiedUntil: users.verifiedUntil,
        balance: users.balance,
        plan: users.plan,
      })
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    if (row) {
      const active =
        row.verified &&
        (!row.verifiedUntil || new Date(row.verifiedUntil) > new Date());
      current = {
        verified: active,
        until: row.verifiedUntil,
        balance: row.balance,
        plan: planOf(row),
      };
    }
  }
  return NextResponse.json({ plans: PLANS, current });
}

/** Subscribe / renew verification using BK COIN */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const limited = guardLimit(req, "verify", session.id);
  if (limited) return limited;

  let planId: "basic" | "premium" = "basic";
  try {
    const body = await req.json();
    if (body?.plan === "premium") planId = "premium";
  } catch {
    /* default basic */
  }
  const plan = PLANS[planId];

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    if (!user) {
      return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
    }

    const balance = Number(user.balance);
    if (balance < plan.priceCoins) {
      return NextResponse.json(
        {
          message: `رصيد غير كافٍ — تحتاج ${formatCoins(
            plan.priceCoins
          )} BK ورصيدك ${formatCoins(balance)} BK`,
        },
        { status: 409 }
      );
    }

    // extend from the current expiry if still active
    const now = new Date();
    const base =
      user.verifiedUntil && new Date(user.verifiedUntil) > now
        ? new Date(user.verifiedUntil)
        : now;
    const until = new Date(base.getTime() + plan.days * 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        balance: String(balance - plan.priceCoins),
        verified: true,
        verifiedUntil: until,
        plan: plan.id,
      })
      .where(eq(users.id, user.id));

    await db.insert(coinTx).values({
      userId: user.id,
      amount: String(-plan.priceCoins),
      kind: "purchase",
      note: `اشتراك ${plan.name} (${plan.days} يوم)`,
    });

    return NextResponse.json({ ok: true, verifiedUntil: until, plan: plan.id });
  } catch {
    return NextResponse.json({ message: "تعذّر إتمام الاشتراك" }, { status: 500 });
  }
}
