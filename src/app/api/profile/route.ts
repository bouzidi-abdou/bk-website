import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ACCENTS } from "@/lib/coins";
import {
  guardLimit,
  getClientIp,
  isValidHttpUrl,
  rateLimit,
  sameOrigin,
  sanitize,
  tooManyRequests,
} from "@/lib/security";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ profile: null }, { status: 401 });
  }
  try {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.id))
      .limit(1);
    if (!row) return NextResponse.json({ profile: null }, { status: 404 });
    return NextResponse.json({
      profile: {
        username: row.username,
        displayName: row.displayName,
        bio: row.bio,
        bannerUrl: row.bannerUrl,
        avatarUrl: row.avatarUrl,
        accentColor: row.accentColor,
        location: row.location,
        website: row.website,
        verified: row.verified,
        verifiedUntil: row.verifiedUntil,
        profilePublic: row.profilePublic,
        balance: row.balance,
      },
    });
  } catch {
    return NextResponse.json({ profile: null }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const limited = guardLimit(req, "profileUpdate", session.id);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  const displayName = sanitize(body.displayName, 40);
  const bio = sanitize(body.bio, 220);
  const location = sanitize(body.location, 60);
  const website = sanitize(body.website, 200);
  const bannerUrl = sanitize(body.bannerUrl, 500);
  const avatarUrl = sanitize(body.avatarUrl, 500);
  const accentColor = sanitize(body.accentColor, 20);

  if (website && !isValidHttpUrl(website, false)) {
    return NextResponse.json({ message: "رابط الموقع غير صالح" }, { status: 400 });
  }
  if (bannerUrl && !isValidHttpUrl(bannerUrl, true)) {
    return NextResponse.json(
      { message: "رابط الغلاف يجب أن يبدأ بـ https" },
      { status: 400 }
    );
  }
  if (avatarUrl && !isValidHttpUrl(avatarUrl, true)) {
    return NextResponse.json(
      { message: "رابط الصورة يجب أن يبدأ بـ https" },
      { status: 400 }
    );
  }

  try {
    const [updated] = await db
      .update(users)
      .set({
        displayName: displayName || null,
        bio: bio || null,
        location: location || null,
        website: website || null,
        bannerUrl: bannerUrl || null,
        avatarUrl: avatarUrl || null,
        accentColor: ACCENTS[accentColor] ? accentColor : "violet",
        profilePublic:
          typeof body.profilePublic === "boolean" ? body.profilePublic : true,
      })
      .where(eq(users.id, session.id))
      .returning();

    return NextResponse.json({ ok: true, profile: updated });
  } catch {
    return NextResponse.json({ message: "تعذّر الحفظ" }, { status: 500 });
  }
}
