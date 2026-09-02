"use client";

import { useState } from "react";
import {
  BellRing,
  Check,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Pin,
  Send,
  RefreshCw,
  Tag,
  TriangleAlert,
  Rows3,
  Plus,
  Trash2,
} from "lucide-react";
import NewsFeed from "./news-feed";
import { cn } from "@/lib/utils";

const KINDS = [
  { id: "news", label: "خبر", Icon: Megaphone },
  { id: "update", label: "تحديث", Icon: RefreshCw },
  { id: "offer", label: "عرض", Icon: Tag },
  { id: "alert", label: "تنبيه", Icon: BellRing },
];

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-900";
const labelCls = "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function AdminNews() {
  const [form, setForm] = useState({
    title: "",
    body: "",
    imageUrl: "",
    kind: "news",
    pinned: false,
  });
  const [sections, setSections] = useState<
    { heading: string; content: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [refresh, setRefresh] = useState(0);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function publish() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/news", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر النشر");
      setMsg({ ok: true, text: "تم نشر الإعلان بنجاح" });
      setForm({ title: "", body: "", imageUrl: "", kind: "news", pinned: false });
      setSections([]);
      setRefresh((n) => n + 1);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* composer */}
      <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
        <h4 className="flex items-center gap-2 text-sm font-black">
          <Megaphone className="size-4 text-accent" />
          إعلان جديد
        </h4>

        <div className="mt-4 space-y-3">
          <div>
            <label className={labelCls}>نوع المنشور</label>
            <div className="grid grid-cols-4 gap-1.5">
              {KINDS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => set("kind", id)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[9px] font-black transition",
                    form.kind === id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-neutral-200 text-neutral-400 dark:border-white/10"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>العنوان *</label>
            <input
              className={inputCls}
              maxLength={120}
              placeholder="مثال: عروض نهاية الأسبوع"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className={labelCls}>المقدمة</label>
            <textarea
              className={cn(inputCls, "min-h-32 resize-y leading-7")}
              maxLength={2000}
              placeholder="اكتب نص الإعلان الذي سيراه جميع الأعضاء…"
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
            />
          </div>

          {/* dynamic sections */}
          <div className="rounded-2xl border border-dashed border-neutral-300 p-4 dark:border-white/15">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-xs font-black">
                <Rows3 className="size-3.5 text-accent" />
                أقسام إضافية ({sections.length})
              </p>
              <button
                onClick={() =>
                  setSections((l) => [...l, { heading: "", content: "" }])
                }
                className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[10px] font-black text-white transition hover:bg-accent-dark"
              >
                <Plus className="size-3" />
                عنوان جديد
              </button>
            </div>

            {sections.length === 0 && (
              <p className="mt-2 text-[10px] leading-5 text-neutral-400">
                أضف عناوين متعددة داخل الإعلان — كل عنوان يظهر بخط عريض مع خط
                فاصل رفيع تحته.
              </p>
            )}

            <div className="mt-3 space-y-3">
              {sections.map((sec, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-neutral-200 p-3 dark:border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-neutral-900 text-[9px] font-black text-white dark:bg-white dark:text-neutral-900">
                      {i + 1}
                    </span>
                    <input
                      className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-black outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
                      placeholder="العنوان (مثال: نظام الاشتراكات)"
                      maxLength={100}
                      value={sec.heading}
                      onChange={(e) =>
                        setSections((l) =>
                          l.map((x, j) =>
                            j === i ? { ...x, heading: e.target.value } : x
                          )
                        )
                      }
                    />
                    <button
                      onClick={() =>
                        setSections((l) => l.filter((_, j) => j !== i))
                      }
                      aria-label="حذف"
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-neutral-300 transition hover:bg-rose-500/10 hover:text-rose-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <textarea
                    className="mt-2 min-h-16 w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold leading-6 outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
                    placeholder="محتوى هذا القسم…"
                    maxLength={1500}
                    value={sec.content}
                    onChange={(e) =>
                      setSections((l) =>
                        l.map((x, j) =>
                          j === i ? { ...x, content: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}>صورة (اختياري)</label>
            <div className="relative">
              <ImageIcon className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                className={cn(inputCls, "ps-10")}
                dir="ltr"
                placeholder="https://example.com/banner.png"
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => set("pinned", !form.pinned)}
            className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 p-3.5 text-start transition hover:border-accent/40 dark:border-white/10"
          >
            <Pin
              className={cn(
                "size-4",
                form.pinned ? "text-accent" : "text-neutral-300"
              )}
            />
            <span className="flex-1 text-xs font-black">تثبيت في الأعلى</span>
            <span
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition",
                form.pinned ? "bg-accent" : "bg-neutral-300 dark:bg-white/15"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 size-3 rounded-full bg-white transition-all",
                  form.pinned ? "start-5" : "start-1"
                )}
              />
            </span>
          </button>

          {msg && (
            <p
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black",
                msg.ok
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-rose-500/10 text-rose-500"
              )}
            >
              {msg.ok ? <Check className="size-3.5" /> : <TriangleAlert className="size-3.5" />}
              {msg.text}
            </p>
          )}

          <button
            onClick={publish}
            disabled={
              busy ||
              !form.title.trim() ||
              (!form.body.trim() && sections.length === 0)
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-3.5 text-xs font-black text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            نشر الإعلان
          </button>
        </div>
      </div>

      {/* live preview / management */}
      <div>
        <p className="mb-3 text-xs font-black text-neutral-400">
          المنشورات الحالية — يمكنك حذف أي منشور
        </p>
        <div className="max-h-[640px] overflow-y-auto pe-1" data-lenis-prevent>
          <NewsFeed key={refresh} isAdmin />
        </div>
      </div>
    </div>
  );
}
