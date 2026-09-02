import { NextResponse } from "next/server";
import { env } from "@/lib/env";

/** Only card (Stripe) and BK COIN wallet are offered. */
export async function GET() {
  return NextResponse.json({ stripe: Boolean(env.STRIPE_SECRET_KEY) });
}
