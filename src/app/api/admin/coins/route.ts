import { NextResponse, type NextRequest } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { coinTx, users } from "@/db/schema";
import { getSessionUser, type SessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { avatarUrl } from "@/lib/discord";
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

async function guard(
  req: NextRequest
): Promise<NextResponse | SessionUser> {
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

/** Wallet list + recent ledger */
export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  try {
    const wallets = await db
      .select({
        id: users.id,
        username: users.username,
        globalName: users.globalName,
        discordId: users.discordId,
        avatar: users.avatar,
        balance: users.balance,
      })
      .from(users)
      .orderBy(desc(users.balance))
      .limit(100);

    const ledger = await db
      .select({
        id: coinTx.id,
        amount: coinTx.amount,
        kind: coinTx.kind,
        note: coinTx.note,
        byAdmin: coinTx.byAdmin,
        createdAt: coinTx.createdAt,
        username: users.username,
      })
      .from(coinTx)
      .innerJoin(users, eq(coinTx.userId, users.id))
      .orderBy(desc(coinTx.createdAt))
      .limit(40);

    return NextResponse.json({
      wallets: wallets.map((w) => ({
        ...w,
        avatar: avatarUrl(w.discordId, w.avatar),
      })),
      ledger,
    });
  } catch {
    return NextResponse.json({ wallets: [], ledger: [] });
  }
}

/** Credit or debit BK COIN for a member (1 BK COIN = 1 USD) */
export async function POST(req: NextRequest) {
  const g = await guard(req);
  if (g instanceof NextResponse) return g;

  let body: { userId?: string; amount?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!body.userId || !UUID_RE.test(body.userId)) {
    return NextResponse.json({ message: "المستخدم غير صالح" }, { status: 400 });
  }

  const amount = Math.round(Number(body.amount));
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 10000000) {
    return NextResponse.json({ message: "المبلغ غير صالح" }, { status: 400 });
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, body.userId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ message: "العضو غير موجود" }, { status: 404 });
    }

    const current = Number(user.balance);
    const next = current + amount;
    if (next < 0) {
      return NextResponse.json(
        { message: `الرصيد غير كافٍ — الرصيد الحالي ${current.toFixed(2)}` },
        { status: 409 }
      );
    }

    await db
      .update(users)
      .set({ balance: String(next) })
      .where(eq(users.id, user.id));

    await db.insert(coinTx).values({
      userId: user.id,
      amount: String(amount),
      kind: amount > 0 ? "topup" : "deduct",
      note: sanitize(body.note, 160) || null,
      byAdmin: g.username,
    });

    return NextResponse.json({ ok: true, balance: String(next) });
  } catch {
    return NextResponse.json({ message: "تعذّر تحديث الرصيد" }, { status: 500 });
  }
}
