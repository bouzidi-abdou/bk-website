import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { CATEGORIES as FALLBACK } from "./utils";

export type CategoryMeta = {
  key: string;
  ar: string;
  en: string;
  icon: string;
  tint: string;
};

/** Live category map from the database, falling back to the built-ins. */
export async function getCategories(): Promise<CategoryMeta[]> {
  try {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder));
    if (rows.length > 0) {
      return rows.map((r) => ({
        key: r.key,
        ar: r.nameAr,
        en: r.nameEn,
        icon: r.icon,
        tint: r.tint,
      }));
    }
  } catch {
    /* fall through */
  }
  return Object.entries(FALLBACK).map(([key, c]) => ({
    key,
    ar: c.ar,
    en: c.en,
    icon: c.icon,
    tint: c.tint,
  }));
}

export async function getCategoryMap(): Promise<Record<string, CategoryMeta>> {
  const list = await getCategories();
  return Object.fromEntries(list.map((c) => [c.key, c]));
}
