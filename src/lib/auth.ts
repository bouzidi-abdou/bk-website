import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env, getSessionSecret } from "./env";

let secretKey: Uint8Array | null = null;
function secret(): Uint8Array {
  if (!secretKey) secretKey = new TextEncoder().encode(getSessionSecret());
  return secretKey;
}

const ISSUER = "bk-market";
const AUDIENCE = "bk-market-web";

export const SESSION_COOKIE = "bk_session";
export const STATE_COOKIE = "bk_oauth_state";
export const NEXT_COOKIE = "bk_next";

export type SessionUser = {
  id: string;
  discordId: string;
  username: string;
  globalName: string | null;
  avatar: string;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  let token: string | undefined;
  try {
    const store = await cookies();
    token = store.get(SESSION_COOKIE)?.value;
  } catch {
    return null;
  }
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return {
      id: payload.sub as string,
      discordId: payload.discordId as string,
      username: payload.username as string,
      globalName: (payload.globalName as string) ?? null,
      avatar: payload.avatar as string,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
