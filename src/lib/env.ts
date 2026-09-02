/**
 * SERVER-SIDE ONLY configuration — never import this from client components.
 * Client-safe public values live in @/lib/utils (SITE_LOGO_URL, DISCORD_INVITE_URL).
 */

const isProd = process.env.NODE_ENV === "production";

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}

/**
 * Hosting dashboards (Vercel/Netlify) do NOT strip surrounding quotes —
 * a value pasted as "abc" would keep the quotes and break OAuth handshakes.
 * Clean every credential: trim whitespace + strip wrapping quotes.
 */
function clean(v: string | undefined): string {
  return (v ?? "")
    .trim()
    .replace(/^["'](.*)["']$/, "$1")
    .trim();
}

import { createHash } from "crypto";

let cachedSecret: string | null = null;

/**
 * Resilient secret resolution — the server must NEVER 500 because of a
 * missing SESSION_SECRET (notably on Netlify before the var is added):
 * 1. explicit SESSION_SECRET wins (recommended in production)
 * 2. otherwise derive a stable, non-public secret from DATABASE_URL so
 *    sessions keep working and survive restarts
 * 3. final fallback is a dev constant
 */
export function getSessionSecret(): string {
  if (cachedSecret) return cachedSecret;
  const v = process.env.SESSION_SECRET;
  if (v && v.length >= 16) {
    cachedSecret = v;
    return cachedSecret;
  }
  const seed = process.env.DATABASE_URL || (isProd ? "" : "bk-market-dev");
  cachedSecret =
    "bk-deriv-" + createHash("sha256").update(seed).digest("hex");
  return cachedSecret;
}

export const env = {
  isProd,

  get DATABASE_URL() {
    return required("DATABASE_URL");
  },

  // App URL (explicit base domain override for OAuth callback origin if needed)
  APP_URL: clean(process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL),

  // Discord OAuth
  DISCORD_CLIENT_ID: clean(process.env.DISCORD_CLIENT_ID),
  DISCORD_CLIENT_SECRET: clean(process.env.DISCORD_CLIENT_SECRET),

  // Discord admin / role check
  DISCORD_GUILD_ID: clean(process.env.DISCORD_GUILD_ID),
  DISCORD_BOT_TOKEN: clean(process.env.DISCORD_BOT_TOKEN),
  ADMIN_ROLE_ID: clean(process.env.ADMIN_ROLE_ID),
  SELLER_ROLE_ID: clean(process.env.SELLER_ROLE_ID),
  ADMIN_DISCORD_IDS: clean(process.env.ADMIN_DISCORD_IDS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  // Payments — Stripe (cards + Apple Pay + Google Pay)
  STRIPE_SECRET_KEY: clean(process.env.STRIPE_SECRET_KEY),
  STRIPE_WEBHOOK_SECRET: clean(process.env.STRIPE_WEBHOOK_SECRET),

  // Payments — PayPal
  PAYPAL_ME: clean(process.env.PAYPAL_ME),

  // Payments — Crypto wallets (address per network)
  CRYPTO_WALLETS: [
    {
      id: "usdt-trc20",
      label: "USDT",
      network: "TRON (TRC20)",
      address: clean(process.env.CRYPTO_USDT_TRC20),
      note: "أرخص رسوم — موصى به",
    },
    {
      id: "usdt-bep20",
      label: "USDT",
      network: "BNB Smart Chain (BEP20)",
      address: clean(process.env.CRYPTO_USDT_BEP20),
      note: "رسوم منخفضة",
    },
    {
      id: "usdt-erc20",
      label: "USDT",
      network: "Ethereum (ERC20)",
      address: clean(process.env.CRYPTO_USDT_ERC20),
      note: "رسوم مرتفعة",
    },
    {
      id: "btc",
      label: "Bitcoin",
      network: "Bitcoin",
      address: clean(process.env.CRYPTO_BTC),
      note: "",
    },
  ].filter((w) => w.address),

  // Discord order channel webhook (most reliable delivery)
  DISCORD_WEBHOOK_URL: clean(process.env.DISCORD_WEBHOOK_URL),

  // Integrations
  EXCHANGE_API_URL:
    clean(process.env.EXCHANGE_API_URL) ||
    "https://open.er-api.com/v6/latest/USD",

  // Cookies / transport
  COOKIE_SECURE: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "1"
    : isProd,

  // Rate limits (requests per window)
  RL_AUTH: { limit: 15, windowMs: 60_000 },
  RL_ORDERS: { limit: 8, windowMs: 60_000 },
  RL_ADMIN: { limit: 40, windowMs: 60_000 },
} as const;
