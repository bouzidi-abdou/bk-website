import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, STATE_COOKIE, NEXT_COOKIE } from "@/lib/auth";
import {
  exchangeCode,
  fetchDiscordUser,
  getRedirectUri,
  avatarUrl,
  type DiscordApiUser,
} from "@/lib/discord";
import { publicOrigin } from "@/lib/security";

function fail(origin: string, stage: string, e: unknown) {
  // Safe error codes surface in the URL for self-diagnosis;
  // full details land in the hosting function logs only.
  console.error(`[oauth][${stage}]`, e);
  return NextResponse.redirect(new URL(`/?error=${stage}`, origin));
}

export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = req.cookies.get(STATE_COOKIE)?.value;
  const next = req.cookies.get(NEXT_COOKIE)?.value || "/";

  if (!code || !state || !storedState || state !== storedState) {
    console.error("[oauth][state] mismatch or missing:", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      hasStored: Boolean(storedState),
      stateMatch: state === storedState,
      origin,
    });
    return NextResponse.redirect(new URL("/?error=oauth_state", origin));
  }

  // 1) token exchange — most common failure: wrong client secret
  let accessToken: string;
  try {
    const { access_token } = await exchangeCode(code, getRedirectUri(origin));
    accessToken = access_token;
  } catch (e) {
    return fail(origin, "exchange", e);
  }

  // 2) fetch profile
  let du: DiscordApiUser;
  try {
    du = await fetchDiscordUser(accessToken);
  } catch (e) {
    return fail(origin, "profile", e);
  }

  // 3) database upsert
  try {
    const [user] = await db
      .insert(users)
      .values({
        discordId: du.id,
        username: du.username,
        globalName: du.global_name,
        avatar: du.avatar,
        email: du.email ?? null,
      })
      .onConflictDoUpdate({
        target: users.discordId,
        set: {
          username: du.username,
          globalName: du.global_name,
          avatar: du.avatar,
          email: du.email ?? null,
          lastLoginAt: new Date(),
        },
      })
      .returning();

    await createSession({
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      globalName: user.globalName,
      avatar: avatarUrl(user.discordId, user.avatar),
    });

    const res = NextResponse.redirect(
      new URL(next.startsWith("/") ? next : "/", origin)
    );
    res.cookies.delete(STATE_COOKIE);
    res.cookies.delete(NEXT_COOKIE);
    return res;
  } catch (e) {
    return fail(origin, "db", e);
  }
}
