import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { env } from "./env";
import { isAdminUser } from "./admin";

/** Commission the store keeps from each seller sale. */
export const SELLER_COMMISSION = 0.05;

/**
 * A member is a seller when either:
 * 1. the `seller` flag is set on their account (granted by an accepted
 *    application), or
 * 2. they hold SELLER_ROLE_ID inside the configured Discord guild, or
 * 3. they are an admin (admins can always use the seller tools).
 */
export async function isSellerUser(
  discordId: string,
  dbFlag?: boolean
): Promise<boolean> {
  if (dbFlag) return true;
  if (await isAdminUser(discordId)) return true;

  const roleId = env.SELLER_ROLE_ID;
  if (env.DISCORD_GUILD_ID && env.DISCORD_BOT_TOKEN && roleId) {
    try {
      const res = await fetch(
        `https://discord.com/api/guilds/${env.DISCORD_GUILD_ID}/members/${discordId}`,
        {
          headers: { Authorization: `Bot ${env.DISCORD_BOT_TOKEN}` },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const member = (await res.json()) as { roles?: string[] };
        return Boolean(member.roles?.includes(roleId));
      }
    } catch {
      return false;
    }
  }
  return false;
}

/** Resolves seller access for the current session (checks DB then Discord). */
export async function resolveSeller(session: {
  id: string;
  discordId: string;
}): Promise<{ seller: boolean; admin: boolean }> {
  const [row] = await db
    .select({ seller: users.seller })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  const admin = await isAdminUser(session.discordId);
  const seller = admin || (await isSellerUser(session.discordId, row?.seller));
  return { seller, admin };
}
