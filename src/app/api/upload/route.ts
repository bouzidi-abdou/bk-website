import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { guardLimit, sameOrigin } from "@/lib/security";

const MAX_BYTES = 700_000; // ~700 KB after client-side compression
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Stores an uploaded image as a data URL.
 * Keeps the project dependency-free (no external bucket needed) while still
 * letting members upload straight from their device.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر الطلب غير موثوق" }, { status: 403 });
  }
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  const limited = guardLimit(req, "profileUpdate", session.id);
  if (limited) return limited;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ message: "ملف غير صالح" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "لم يتم اختيار صورة" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { message: "الصيغة غير مدعومة — استخدم JPG أو PNG أو WEBP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { message: "حجم الصورة كبير — الحد الأقصى 700KB" },
      { status: 413 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = `data:${file.type};base64,${buffer.toString("base64")}`;
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ message: "تعذّر رفع الصورة" }, { status: 500 });
  }
}
