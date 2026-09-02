import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isDiscordConfigured } from "@/lib/discord";
import { isAdminUser } from "@/lib/admin";

export async function GET() {
  const user = await getSessionUser();
  const isAdmin = user ? await isAdminUser(user.discordId) : false;

  let balance = "0";
  if (user) {
    try {
      const [row] = await db
        .select({ balance: users.balance })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      balance = row?.balance ?? "0";
    } catch {
      /* wallet unavailable */
    }
  }

  return NextResponse.json({
    user,
    configured: isDiscordConfigured(),
    isAdmin,
    balance,
  });
}
