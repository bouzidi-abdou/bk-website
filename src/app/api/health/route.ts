import { NextResponse, type NextRequest } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { getRedirectUri } from "@/lib/discord";
import { publicOrigin } from "@/lib/security";

/**
 * Diagnostics endpoint — open it on your deployed URL to see exactly what
 * is wrong (missing env vars / unreachable database / missing tables / Discord URI).
 */
export async function GET(req: NextRequest) {
  const origin = publicOrigin(req);
  const expectedRedirectUri = getRedirectUri(origin);

  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    DISCORD_OAUTH: Boolean(
      process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
    ),
    ADMIN_IDS: Boolean(process.env.ADMIN_DISCORD_IDS),
    APP_URL: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || null,
    DISCORD_BOT: Boolean(process.env.DISCORD_BOT_TOKEN),
  };

  const discordConfig = {
    configured: env.DISCORD_OAUTH,
    clientIdPresent: Boolean(process.env.DISCORD_CLIENT_ID),
    clientSecretPresent: Boolean(process.env.DISCORD_CLIENT_SECRET),
    exactRedirectUriToRegister: expectedRedirectUri,
  };

  let database: Record<string, unknown>;
  if (!env.DATABASE_URL) {
    database = {
      status: "missing-env",
      hint: "أضف DATABASE_URL في إعدادات الاستضافة (Vercel / Netlify → Environment variables)",
    };
  } else {
    try {
      await db.execute(sql`select 1`);
      const [row] = await db
        .select({ value: sql<number>`count(*)::int` })
        .from(products);
      database = {
        status: "connected",
        products: row?.value ?? 0,
        schemaInitialized: true,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      database = {
        status: "error",
        message: message.slice(0, 180),
        hint: message.includes("does not exist")
          ? "جاري التهيئة التلقائية..."
          : "تعذّر الاتصال — تحقق من صحة الرابط (انتبه للأحرف الخاصة في كلمة المرور)",
      };
    }
  }

  const healthy =
    database.status === ("connected" as string) && env.SESSION_SECRET;

  return NextResponse.json(
    { ok: Boolean(healthy), env, discordConfig, database },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
