import { env } from "./env";
import { isDiscordConfigured } from "./discord";

/**
 * Admin access is granted ONLY to Discord IDs listed in ADMIN_DISCORD_IDS.
 * Discord role checks were intentionally removed: a role can be handed out
 * inside the guild by mistake, while this list is controlled solely from the
 * hosting environment variables.
 */
export async function isAdminUser(discordId: string): Promise<boolean> {
  if (env.ADMIN_DISCORD_IDS.length > 0) {
    return env.ADMIN_DISCORD_IDS.includes(discordId);
  }
  // Local preview only: no OAuth and no admin list configured yet.
  return !isDiscordConfigured();
}
