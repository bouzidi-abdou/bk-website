"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BellRing,
  Heart,
  Loader2,
  Megaphone,
  Pin,
  RefreshCw,
  Tag,
  Trash2,
} from "lucide-react";
import VerifiedBadge from "./verified-badge";
import RoleBadge from "./role-badge";
import ProfilePreview from "./profile-preview";
import { cn } from "@/lib/utils";

type Post = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  kind: string;
  pinned: boolean;
  likeCount: number;
  liked: boolean;
  createdAt: string;
  sections?: { heading: string; content: string }[];
  author: {
    name: string;
    username: string | null;
    verified: boolean;
    tier?: "basic" | "premium";
    roles?: { key: string; name: string; icon: string; color: string }[];
    avatar: string | null;
  };
};

const KIND_META: Record<
  string,
  { label: string; cls: string; Icon: typeof Megaphone }
> = {
  news: { label: "خبر", cls: "bg-accent/10 text-accent", Icon: Megaphone },
  update: { label: "تحديث", cls: "bg-blue-500/10 text-blue-500", Icon: RefreshCw },
  offer: { label: "عرض", cls: "bg-rose-500/10 text-rose-500", Icon: Tag },
  alert: { label: "تنبيه", cls: "bg-amber-500/10 text-amber-500", Icon: BellRing },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} س`;
  const d = Math.floor(h / 24);
  if (d < 30) return `قبل ${d} يوم`;
  return new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(
    new Date(iso)
  );
}

export default function NewsFeed({ isAdmin = false }: { isAdmin?: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "news" | "update" | "offer" | "alert">("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      setPosts(data.posts ?? []);
      setGuest(Boolean(data.guest));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleLike(p: Post) {
    if (guest) {
      window.location.href = "/api/auth/discord?next=/news";
      return;
    }
    setBusyId(p.id);
    // optimistic
    setPosts((list) =>
      list.map((x) =>
        x.id === p.id
          ? {
              ...x,
              liked: !x.liked,
              likeCount: x.liked ? x.likeCount - 1 : x.likeCount + 1,
            }
          : x
      )
    );
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setPosts((list) =>
          list.map((x) =>
            x.id === p.id
              ? { ...x, liked: data.liked, likeCount: data.likeCount }
              : x
          )
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setPosts((l) => l.filter((p) => p.id !== id));
    await fetch(`/api/news?id=${id}`, { method: "DELETE" });
  }

  if (loading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 py-16 text-center dark:border-white/10">
        <span className="grid size-16 place-items-center rounded-2xl bg-neutral-100 text-neutral-300 dark:bg-white/5 dark:text-neutral-600">
          <Megaphone className="size-8" />
        </span>
        <h3 className="mt-5 text-base font-black">لا توجد أخبار بعد</h3>
        <p className="mt-2 max-w-xs text-xs leading-6 text-neutral-500 dark:text-neutral-400">
          سيتم نشر آخر التحديثات والعروض هنا — تابعنا باستمرار.
        </p>
      </div>
    );
  }

  const visible = filter === "all" ? posts : posts.filter((p) => p.kind === filter);
  const filters = [
    { id: "all" as const, label: "الكل" },
    { id: "news" as const, label: "الأخبار" },
    { id: "update" as const, label: "التحديثات" },
    { id: "offer" as const, label: "العروض" },
    { id: "alert" as const, label: "التنبيهات" },
  ];

  return (
    <div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {filters.map((item) => {
          const n = item.id === "all" ? posts.length : posts.filter((p) => p.kind === item.id).length;
          return (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black transition",
                filter === item.id
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900"
                  : "border-neutral-200 bg-white text-neutral-500 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-400"
              )}
            >
              {item.label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[8px]", filter === item.id ? "bg-white/20 dark:bg-black/10" : "bg-neutral-100 dark:bg-white/10")}>
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-neutral-300 py-12 text-center text-xs font-bold text-neutral-400 dark:border-white/10">
          لا توجد منشورات في هذا النوع بعد.
        </div>
      ) : (
        <div className="space-y-5">
      {visible.map((p) => {
        const meta = KIND_META[p.kind] ?? KIND_META.news;
        return (
          <article
            key={p.id}
            className={cn(
              "overflow-hidden rounded-[1.5rem] border bg-white transition dark:bg-neutral-900/70",
              p.pinned
                ? "border-accent/40 shadow-lg shadow-accent/[0.06]"
                : "border-neutral-200/80 dark:border-white/[0.07]"
            )}
          >
            {/* header */}
            <div className="flex items-start gap-3 p-4 pb-3">
              {p.author.username ? (
                <ProfilePreview username={p.author.username} className="shrink-0">
                  {p.author.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.author.avatar}
                      alt=""
                      loading="lazy"
                      className="size-11 rounded-full object-cover ring-2 ring-accent/30 transition hover:scale-105 hover:ring-accent/60"
                    />
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full bg-accent font-display text-xs font-bold text-white">
                      BK
                    </span>
                  )}
                </ProfilePreview>
              ) : p.author.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={p.author.avatar}
                  alt=""
                  loading="lazy"
                  className="size-11 shrink-0 rounded-full object-cover ring-2 ring-accent/30"
                />
              ) : (
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent font-display text-xs font-bold text-white">
                  BK
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {p.author.username ? (
                    <ProfilePreview username={p.author.username}>
                      <span className="inline-flex min-w-0 items-center gap-1 text-sm font-black transition hover:text-accent">
                        <span className="truncate">{p.author.name}</span>
                        {p.author.verified && (
                          <VerifiedBadge tier={p.author.tier ?? "basic"} className="size-4" />
                        )}
                      </span>
                    </ProfilePreview>
                  ) : (
                    <span className="inline-flex min-w-0 items-center gap-1 text-sm font-black">
                      <span className="truncate">{p.author.name}</span>
                      {p.author.verified && (
                        <VerifiedBadge tier={p.author.tier ?? "basic"} className="size-4" />
                      )}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-neutral-400">
                    · {timeAgo(p.createdAt)}
                  </span>
                </div>

                {(p.author.roles?.length ?? 0) > 0 && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {p.author.roles!.map((r) => (
                      <RoleBadge key={r.key} role={r} size="sm" />
                    ))}
                  </div>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black",
                      meta.cls
                    )}
                  >
                    <meta.Icon className="size-2.5" />
                    {meta.label}
                  </span>
                  {p.pinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[9px] font-black text-accent">
                      <Pin className="size-2.5" />
                      مثبّت
                    </span>
                  )}
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => remove(p.id)}
                  aria-label="حذف"
                  className="grid size-8 shrink-0 place-items-center rounded-full text-neutral-300 transition hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>

            {/* body */}
            <div className="px-4 pb-3">
              <h3 className="text-lg font-black leading-7">{p.title}</h3>
              <div className="mt-2 h-px w-full bg-gradient-to-l from-transparent via-neutral-200 to-transparent dark:via-white/15" />
              {p.body && (
                <p className="mt-3 whitespace-pre-line break-words text-[13px] leading-7 text-neutral-600 dark:text-neutral-300">
                  {p.body}
                </p>
              )}

              {(p.sections?.length ?? 0) > 0 && (
                <div className="mt-4 space-y-4">
                  {p.sections!.map((sec, i) => (
                    <div key={i}>
                      {sec.heading && (
                        <>
                          <h4 className="text-[15px] font-black leading-6">
                            {sec.heading}
                          </h4>
                          <div className="mt-1.5 h-px w-full bg-gradient-to-l from-transparent via-neutral-200 to-transparent dark:via-white/15" />
                        </>
                      )}
                      {sec.content && (
                        <p className="mt-2.5 whitespace-pre-line break-words text-[13px] leading-7 text-neutral-600 dark:text-neutral-300">
                          {sec.content}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {p.imageUrl && (
              <div className="px-4 pb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt=""
                  loading="lazy"
                  className="max-h-96 w-full rounded-2xl object-cover"
                />
              </div>
            )}

            {/* actions */}
            <div className="flex items-center gap-2 border-t border-neutral-100 px-4 py-3 dark:border-white/[0.06]">
              <button
                onClick={() => toggleLike(p)}
                disabled={busyId === p.id}
                className={cn(
                  "group flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-black transition",
                  p.liked
                    ? "bg-rose-500/10 text-rose-500"
                    : "text-neutral-400 hover:bg-rose-500/[0.07] hover:text-rose-500"
                )}
              >
                <Heart
                  className={cn(
                    "size-4 transition-transform group-active:scale-125",
                    p.liked && "fill-rose-500"
                  )}
                />
                {p.likeCount}
              </button>
              <span className="text-[10px] font-bold text-neutral-400">
                {p.liked ? "أعجبك هذا المنشور" : "أعجبني"}
              </span>
            </div>
          </article>
        );
      })}
        </div>
      )}
    </div>
  );
}
