import { NextResponse } from "next/server";
import { getCategories } from "@/lib/categories";

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(
    { categories },
    { headers: { "Cache-Control": "no-store" } }
  );
}
