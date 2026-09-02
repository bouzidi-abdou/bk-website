import { db } from "@/db";
import { visits } from "@/db/schema";

export async function trackVisit(path: string) {
  try {
    await db.insert(visits).values({ path });
  } catch {
    // never block rendering on analytics
  }
}
