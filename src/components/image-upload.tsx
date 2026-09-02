"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Device image picker with client-side compression.
 * Downscales + re-encodes before upload so any phone photo fits the limit.
 */
async function compress(file: File, maxSide: number, quality = 0.82) {
  if (file.type === "image/gif") return file; // keep animation intact
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, "image/webp", quality)
  );
  if (!blob) return file;
  return new File([blob], "upload.webp", { type: "image/webp" });
}

export default function ImageUpload({
  value,
  onChange,
  label,
  hint,
  aspect = "square",
  maxSide = 640,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  hint?: string;
  aspect?: "square" | "wide";
  maxSide?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function pick(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const optimised = await compress(file, maxSide);
      const fd = new FormData();
      fd.append("file", optimised);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الرفع");
      onChange(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "تعذّر الرفع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400">
        {label}
      </label>

      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed transition",
          value
            ? "border-transparent"
            : "border-neutral-300 hover:border-accent dark:border-white/15",
          aspect === "wide" ? "aspect-[3/1]" : "aspect-square max-w-40"
        )}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="size-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-neutral-950/55 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl bg-white px-3 py-2 text-[10px] font-black text-neutral-900"
              >
                تغيير
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="grid size-8 place-items-center rounded-xl bg-rose-500 text-white"
                aria-label="حذف"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex size-full flex-col items-center justify-center gap-2 text-neutral-400 transition hover:text-accent"
          >
            {busy ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <ImagePlus className="size-6" />
            )}
            <span className="text-[10px] font-black">
              {busy ? "جاري الرفع…" : "اختر صورة من جهازك"}
            </span>
          </button>
        )}
      </div>

      {hint && !err && (
        <p className="mt-1.5 text-[9px] font-bold text-neutral-400">{hint}</p>
      )}
      {err && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[9px] font-black text-rose-500">
          <TriangleAlert className="size-3" />
          {err}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
