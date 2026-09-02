"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AtSign,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  MapPin,
  Palette,
  Save,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import VerifiedBadge from "./verified-badge";
import ImageUpload from "./image-upload";
import { ACCENTS } from "@/lib/coins";
import { cosmeticClass } from "@/lib/effects";
import { cn } from "@/lib/utils";

type Profile = {
  username: string;
  displayName: string | null;
  bio: string | null;
  bannerUrl: string | null;
  avatarUrl: string | null;
  accentColor: string;
  location: string | null;
  website: string | null;
  verified: boolean;
  verifiedUntil: string | null;
  profilePublic: boolean;
  balance: string;
};

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/15 dark:border-white/10 dark:bg-neutral-900";
const labelCls =
  "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function ProfileEditor({
  fallbackAvatar,
  activeFrame,
  activeEffect,
}: {
  fallbackAvatar: string;
  activeFrame?: string | null;
  activeEffect?: string | null;
}) {
  const [p, setP] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/profile").then((r) => r.json());
    if (res.profile) setP(res.profile);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) {
    setP((x) => (x ? { ...x, [k]: v } : x));
  }

  async function save() {
    if (!p) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "تعذّر الحفظ");
      setMsg({ ok: true, text: "تم حفظ ملفك الشخصي بنجاح" });
      setTimeout(() => setMsg(null), 3500);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "خطأ" });
    } finally {
      setBusy(false);
    }
  }

  if (!p) {
    return (
      <div className="grid h-32 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  const isVerified =
    p.verified && (!p.verifiedUntil || new Date(p.verifiedUntil) > new Date());
  const accent = ACCENTS[p.accentColor] ?? ACCENTS.violet;
  const avatar = p.avatarUrl || fallbackAvatar;
  const frameCls = cosmeticClass(activeFrame);
  const effectCls = cosmeticClass(activeEffect);
  const bioLen = (p.bio ?? "").length;

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      {/* ------------------- live preview ------------------- */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-white dark:border-white/[0.07] dark:bg-neutral-900/70">
          <div className="relative isolate z-0">
            <div
              className={cn(
                "relative h-24 overflow-hidden bg-gradient-to-br",
                accent.grad,
                effectCls
              )}
            >
              {p.bannerUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.bannerUrl}
                  alt=""
                  className="size-full object-cover"
                />
              )}
            </div>
          </div>

          <div className="relative z-10 px-5 pb-5">
            <div className="-mt-10">
              <span className="relative z-20 inline-block rounded-full bg-white p-1 shadow-lg dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt=""
                  className={cn(
                    "block size-20 rounded-full object-cover",
                    frameCls
                  )}
                />
              </span>
            </div>

            <p className="mt-3 flex items-center gap-1.5 text-base font-black">
              <span className="truncate">{p.displayName || p.username}</span>
              {isVerified && <VerifiedBadge className="size-4" tooltip={false} />}
            </p>
            <p className="text-[10px] font-bold text-neutral-400">
              @{p.username}
            </p>

            {p.bio && (
              <p className="mt-2.5 line-clamp-3 text-[11px] leading-6 text-neutral-500 dark:text-neutral-400">
                {p.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold text-neutral-400">
              {p.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  {p.location}
                </span>
              )}
              {p.website && (
                <span className="flex min-w-0 items-center gap-1">
                  <Globe className="size-3" />
                  <span className="truncate">
                    {p.website.replace(/^https?:\/\//, "")}
                  </span>
                </span>
              )}
            </div>

            <Link
              href={`/profile/${p.username}`}
              target="_blank"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-200 py-2.5 text-[10px] font-black text-neutral-500 transition hover:border-accent hover:text-accent dark:border-white/10"
            >
              عرض الملف العام
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        <p className="mt-2 text-center text-[9px] font-bold text-neutral-400">
          معاينة حيّة — تتحدث أثناء التعديل
        </p>
      </div>

      {/* ------------------- editor ------------------- */}
      <div className="space-y-5">
        {/* images */}
        <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
          <h4 className="text-sm font-black">الصور</h4>
          <p className="mt-1 text-[10px] font-bold text-neutral-400">
            ارفع صورك مباشرة من جهازك — نضغطها تلقائياً لتحميل أسرع
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-[auto_1fr]">
            <ImageUpload
              label="الصورة الشخصية"
              value={p.avatarUrl}
              onChange={(url) => set("avatarUrl", url)}
              hint="اتركها فارغة لاستخدام صورة ديسكورد"
              maxSide={512}
            />
            <ImageUpload
              label="غلاف الملف (بانر)"
              value={p.bannerUrl}
              onChange={(url) => set("bannerUrl", url)}
              aspect="wide"
              maxSide={1200}
              hint="يُفضّل صورة عريضة 3:1"
            />
          </div>
        </div>

        {/* identity */}
        <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
          <h4 className="flex items-center gap-2 text-sm font-black">
            <UserRound className="size-4 text-accent" />
            الهوية
          </h4>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>الاسم المعروض</label>
              <input
                className={inputCls}
                maxLength={40}
                placeholder={p.username}
                value={p.displayName ?? ""}
                onChange={(e) => set("displayName", e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>اسم المستخدم</label>
              <div className="relative">
                <AtSign className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  className={cn(inputCls, "ps-10 opacity-60")}
                  value={p.username}
                  disabled
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className={labelCls}>نبذة عنك</label>
              <textarea
                className={cn(inputCls, "min-h-24 resize-y leading-7")}
                maxLength={220}
                placeholder="عرّف بنفسك في سطرين…"
                value={p.bio ?? ""}
                onChange={(e) => set("bio", e.target.value)}
              />
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      bioLen > 200 ? "bg-amber-500" : "bg-accent"
                    )}
                    style={{ width: `${(bioLen / 220) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] font-black text-neutral-400">
                  {bioLen}/220
                </span>
              </div>
            </div>

            <div>
              <label className={labelCls}>الموقع / البلد</label>
              <div className="relative">
                <MapPin className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  className={cn(inputCls, "ps-10")}
                  maxLength={60}
                  placeholder="الجزائر"
                  value={p.location ?? ""}
                  onChange={(e) => set("location", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>رابط خارجي</label>
              <div className="relative">
                <Globe className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input
                  className={cn(inputCls, "ps-10")}
                  dir="ltr"
                  placeholder="https://example.com"
                  value={p.website ?? ""}
                  onChange={(e) => set("website", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* accent + privacy */}
        <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
          <h4 className="flex items-center gap-2 text-sm font-black">
            <Palette className="size-4 text-accent" />
            لون الهوية
          </h4>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Object.entries(ACCENTS).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => set("accentColor", k)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 transition",
                  p.accentColor === k
                    ? "border-accent bg-accent/[0.06]"
                    : "border-neutral-200 hover:border-neutral-300 dark:border-white/10"
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full",
                    v.bg
                  )}
                >
                  {p.accentColor === k && <Check className="size-4 text-white" />}
                </span>
                <span className="text-[9px] font-black text-neutral-500 dark:text-neutral-400">
                  {v.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => set("profilePublic", !p.profilePublic)}
            className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-neutral-200 p-4 text-start transition hover:border-accent/40 dark:border-white/10"
          >
            {p.profilePublic ? (
              <Eye className="size-4.5 text-emerald-500" />
            ) : (
              <EyeOff className="size-4.5 text-neutral-400" />
            )}
            <span className="flex-1">
              <b className="block text-xs font-black">
                {p.profilePublic ? "ملفي عام" : "ملفي خاص"}
              </b>
              <span className="text-[10px] font-bold text-neutral-400">
                {p.profilePublic
                  ? "يمكن لأي شخص زيارة ملفك"
                  : "لن يتمكن أحد من رؤية ملفك"}
              </span>
            </span>
            <span
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition",
                p.profilePublic
                  ? "bg-emerald-500"
                  : "bg-neutral-300 dark:bg-white/15"
              )}
            >
              <span
                className={cn(
                  "absolute top-1 size-4 rounded-full bg-white transition-all",
                  p.profilePublic ? "start-6" : "start-1"
                )}
              />
            </span>
          </button>
        </div>

        {msg && (
          <p
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-3 text-[11px] font-black",
              msg.ok
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-rose-500/10 text-rose-500"
            )}
          >
            {msg.ok ? (
              <Check className="size-4" />
            ) : (
              <TriangleAlert className="size-4" />
            )}
            {msg.text}
          </p>
        )}

        <button
          onClick={save}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-sm font-black text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          حفظ التغييرات
        </button>
      </div>
    </div>
  );
}
