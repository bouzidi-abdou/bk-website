"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  LockKeyhole,
  Package,
  Search,
  Send,
  Ticket as TicketIcon,
  Unlock,
} from "lucide-react";
import DiscordIcon from "./discord-icon";
import IconTile from "./icon-tile";
import { cn } from "@/lib/utils";

type TicketRow = {
  id: string;
  code: string;
  subject: string;
  status: string;
  lastMessageAt: string;
  unreadForAdmin: number;
  createdAt: string;
  username: string;
  globalName: string | null;
  discordId: string;
  avatarUrl: string;
  orderTotal: string | null;
  productName: string | null;
  productIcon: string | null;
  productTint: string | null;
};

type Msg = {
  id: string;
  body: string;
  fromAdmin: boolean;
  authorName: string | null;
  system: boolean;
  createdAt: string;
};

type Detail = {
  ticket: TicketRow;
  user: {
    id: string;
    username: string;
    globalName: string | null;
    discordId: string;
    avatarUrl: string;
    balance: string;
    createdAt: string;
  };
  order: {
    id: string;
    total: string;
    quantity: number;
    status: string;
    paymentMethod: string;
  } | null;
  product: { name: string; slug: string; icon: string; tint: string } | null;
  messages: Msg[];
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: "مفتوحة", cls: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" },
  pending: { label: "قيد المراجعة", cls: "bg-amber-500/10 text-amber-500 ring-amber-500/20" },
  closed: { label: "مغلقة", cls: "bg-neutral-500/10 text-neutral-500 ring-neutral-500/20" },
};

const timeFmt = new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("ar", { dateStyle: "short" });

export default function AdminTickets() {
  const [list, setList] = useState<TicketRow[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");
  const [q, setQ] = useState("");
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const box = scrollBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, []);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tickets");
      const data = await res.json();
      setList(data.tickets ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string, silent = false) => {
    if (!silent) setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/tickets?id=${id}`);
      const data = await res.json();
      if (!data.message) setDetail(data);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
    const t = setInterval(loadList, 12000);
    return () => clearInterval(t);
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    void loadDetail(activeId);
    const t = setInterval(() => loadDetail(activeId, true), 7000);
    return () => clearInterval(t);
  }, [activeId, loadDetail]);

  useEffect(() => {
    scrollToBottom();
  }, [detail?.messages.length]);

  async function reply() {
    const body = text.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: activeId, body }),
      });
      const data = await res.json();
      if (res.ok) {
        setDetail((d) => (d ? { ...d, messages: [...d.messages, data.message] } : d));
        setText("");
        void loadList();
      }
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: string) {
    if (!activeId) return;
    await fetch("/api/admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: activeId, status }),
    });
    await Promise.all([loadDetail(activeId, true), loadList()]);
  }

  const filtered = list.filter((t) => {
    if (filter === "open" && t.status === "closed") return false;
    if (filter === "closed" && t.status !== "closed") return false;
    if (q.trim()) {
      const n = q.toLowerCase();
      return (
        t.username.toLowerCase().includes(n) ||
        t.code.toLowerCase().includes(n) ||
        t.subject.toLowerCase().includes(n)
      );
    }
    return true;
  });

  const openCount = list.filter((t) => t.status !== "closed").length;
  const unreadTotal = list.reduce((a, t) => a + t.unreadForAdmin, 0);

  return (
    <div className="space-y-5">
      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <TicketIcon className="size-5" />
          </span>
          <p className="font-display mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {openCount}
          </p>
          <p className="text-[11px] font-black text-neutral-500 dark:text-neutral-400">
            تذكرة مفتوحة
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200/70 p-5 dark:border-white/[0.07]">
          <p className="font-display text-2xl font-bold">{list.length}</p>
          <p className="text-[11px] font-black text-neutral-500 dark:text-neutral-400">
            إجمالي التذاكر
          </p>
        </div>
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.05] p-5">
          <p className="font-display text-2xl font-bold text-rose-500">{unreadTotal}</p>
          <p className="text-[11px] font-black text-neutral-500 dark:text-neutral-400">
            رسالة غير مقروءة
          </p>
        </div>
      </div>

      <div className="grid h-[620px] grid-cols-1 overflow-hidden rounded-2xl border border-neutral-200/70 md:grid-cols-[320px_1fr] dark:border-white/[0.07]">
        {/* list */}
        <aside
          className={cn(
            "flex flex-col border-e border-neutral-200/70 bg-neutral-50 dark:border-white/[0.07] dark:bg-neutral-950/40",
            activeId && "hidden md:flex"
          )}
        >
          <div className="space-y-2 border-b border-neutral-200/70 p-3 dark:border-white/[0.07]">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-neutral-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث برقم التذكرة أو الاسم…"
                className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 ps-9 pe-3 text-xs font-bold outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
              />
            </div>
            <div className="flex gap-1.5">
              {([
                { id: "all" as const, label: "الكل" },
                { id: "open" as const, label: "مفتوحة" },
                { id: "closed" as const, label: "مغلقة" },
              ]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-[10px] font-black transition",
                    filter === f.id
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                      : "bg-white text-neutral-400 dark:bg-neutral-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" data-lenis-prevent>
            {loading ? (
              <div className="grid h-40 place-items-center">
                <Loader2 className="size-5 animate-spin text-neutral-300" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-xs font-bold text-neutral-400">
                لا توجد تذاكر.
              </p>
            ) : (
              filtered.map((t) => {
                const st = STATUS_META[t.status] ?? STATUS_META.open;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className={cn(
                      "flex w-full items-start gap-3 border-b border-neutral-100 p-3 text-start transition dark:border-white/[0.04]",
                      activeId === t.id
                        ? "bg-accent/[0.08]"
                        : "hover:bg-white dark:hover:bg-white/[0.03]"
                    )}
                  >
                    <span className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.avatarUrl}
                        alt=""
                        loading="lazy"
                        className="size-10 rounded-full object-cover"
                      />
                      {t.unreadForAdmin > 0 && (
                        <span className="absolute -top-0.5 -end-0.5 grid size-4 place-items-center rounded-full bg-rose-500 text-[8px] font-black text-white ring-2 ring-neutral-50 dark:ring-neutral-950">
                          {t.unreadForAdmin > 9 ? "9+" : t.unreadForAdmin}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <b className="truncate text-xs font-black">
                          {t.globalName || t.username}
                        </b>
                        <span className="font-display shrink-0 text-[9px] font-bold text-neutral-400">
                          {t.code}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                        {t.subject}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[8px] font-black ring-1 ring-inset",
                            st.cls
                          )}
                        >
                          {st.label}
                        </span>
                        <span className="text-[8px] font-bold text-neutral-400">
                          {dayFmt.format(new Date(t.lastMessageAt))}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* detail */}
        <section className={cn("flex flex-col", !activeId && "hidden md:flex")}>
          {!activeId || !detail ? (
            <div className="grid flex-1 place-items-center text-center">
              {loadingDetail ? (
                <Loader2 className="size-6 animate-spin text-neutral-300" />
              ) : (
                <div>
                  <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <TicketIcon className="size-8" />
                  </span>
                  <p className="mt-4 text-sm font-black">اختر تذكرة لعرضها</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* header */}
              <div className="border-b border-neutral-200/70 bg-white p-4 dark:border-white/[0.07] dark:bg-neutral-900">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      setActiveId(null);
                      setDetail(null);
                    }}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 md:hidden dark:hover:bg-white/10"
                    aria-label="رجوع"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={detail.user.avatarUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-full object-cover ring-2 ring-accent/40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="truncate text-sm font-black">
                        {detail.user.globalName || detail.user.username}
                      </b>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-black ring-1 ring-inset",
                          (STATUS_META[detail.ticket.status] ?? STATUS_META.open).cls
                        )}
                      >
                        {(STATUS_META[detail.ticket.status] ?? STATUS_META.open).label}
                      </span>
                      <span className="font-display text-[9px] font-bold text-neutral-400">
                        {detail.ticket.code}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-neutral-400">
                      @{detail.user.username} · {detail.user.discordId} · رصيد{" "}
                      {Number(detail.user.balance).toFixed(2)} BK
                    </p>
                  </div>
                </div>

                {/* order summary + actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {detail.product && detail.order && (
                    <span className="flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-1.5 dark:border-white/10">
                      <IconTile
                        name={detail.product.icon}
                        tint={detail.product.tint}
                        size="sm"
                      />
                      <span className="text-[10px] font-black">
                        {detail.product.name}
                        <span className="block font-display text-emerald-500">
                          ${Number(detail.order.total).toFixed(2)} · ×
                          {detail.order.quantity}
                        </span>
                      </span>
                    </span>
                  )}
                  <a
                    href={`https://discord.com/users/${detail.user.discordId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-[10px] font-black text-white transition hover:bg-accent-dark"
                  >
                    <DiscordIcon className="size-3.5" />
                    حساب ديسكورد
                    <ExternalLink className="size-3" />
                  </a>
                  {detail.product && (
                    <Link
                      href={`/product/${detail.product.slug}`}
                      target="_blank"
                      className="flex items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-2 text-[10px] font-black text-neutral-500 transition hover:border-accent hover:text-accent dark:border-white/10"
                    >
                      <Package className="size-3.5" />
                      المنتج
                    </Link>
                  )}
                  {detail.ticket.status !== "closed" ? (
                    <>
                      <button
                        onClick={() => setStatus("pending")}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-400/40 px-3 py-2 text-[10px] font-black text-amber-500 transition hover:bg-amber-400/10"
                      >
                        <Clock className="size-3.5" />
                        قيد المراجعة
                      </button>
                      <button
                        onClick={() => setStatus("closed")}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2 text-[10px] font-black text-white transition hover:bg-rose-600"
                      >
                        <LockKeyhole className="size-3.5" />
                        إغلاق التذكرة
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setStatus("open")}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-[10px] font-black text-white transition hover:bg-emerald-600"
                    >
                      <Unlock className="size-3.5" />
                      إعادة الفتح
                    </button>
                  )}
                </div>
              </div>

              {/* messages */}
              <div
                ref={scrollBoxRef}
                className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-neutral-50 p-4 dark:bg-neutral-950/40"
                data-lenis-prevent
              >
                {detail.messages.map((m) =>
                  m.system ? (
                    <div key={m.id} className="flex justify-center">
                      <p className="max-w-[85%] whitespace-pre-line rounded-xl bg-neutral-200/60 px-3 py-2 text-center text-[10px] font-bold leading-5 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
                        {m.body}
                      </p>
                    </div>
                  ) : (
                    <div
                      key={m.id}
                      className={cn("flex", m.fromAdmin ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] leading-6 shadow-sm",
                          m.fromAdmin
                            ? "rounded-be-sm bg-accent font-bold text-white"
                            : "rounded-bs-sm bg-white font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                        )}
                      >
                        {m.body}
                        <p
                          className={cn(
                            "mt-1 text-[9px] font-bold",
                            m.fromAdmin ? "text-white/60" : "text-neutral-400"
                          )}
                        >
                          {m.authorName} · {timeFmt.format(new Date(m.createdAt))}
                        </p>
                      </div>
                    </div>
                  )
                )}
                </div>

              {/* composer */}
              {detail.ticket.status !== "closed" ? (
                <div className="flex items-end gap-2 border-t border-neutral-200/70 bg-white p-3 dark:border-white/[0.07] dark:bg-neutral-900">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void reply();
                      }
                    }}
                    rows={1}
                    placeholder="اكتب رداً للعميل…"
                    className="max-h-24 flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px] font-bold outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-800"
                  />
                  <button
                    onClick={reply}
                    disabled={sending || !text.trim()}
                    aria-label="إرسال"
                    className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-white transition hover:bg-accent-dark disabled:opacity-40"
                  >
                    {sending ? (
                      <Loader2 className="size-4.5 animate-spin" />
                    ) : (
                      <Send className="size-4.5 -scale-x-100" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="flex items-center justify-center gap-2 border-t border-neutral-200/70 bg-white py-4 text-[11px] font-black text-neutral-400 dark:border-white/[0.07] dark:bg-neutral-900">
                  <CheckCircle2 className="size-3.5" />
                  التذكرة مغلقة — أعد فتحها للرد
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
