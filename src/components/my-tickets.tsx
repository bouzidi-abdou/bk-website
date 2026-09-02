"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  LockKeyhole,
  Plus,
  Send,
  Ticket as TicketIcon,
} from "lucide-react";
import IconTile from "./icon-tile";
import { cn } from "@/lib/utils";

type TicketRow = {
  id: string;
  code: string;
  subject: string;
  status: string;
  lastMessageAt: string;
  unreadForUser: number;
  productName: string | null;
  productIcon: string | null;
  productTint: string | null;
  orderTotal: string | null;
};

type Msg = {
  id: string;
  body: string;
  fromAdmin: boolean;
  authorName: string | null;
  system: boolean;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: "مفتوحة", cls: "bg-emerald-500/10 text-emerald-500" },
  pending: { label: "قيد المراجعة", cls: "bg-amber-500/10 text-amber-500" },
  closed: { label: "مغلقة", cls: "bg-neutral-500/10 text-neutral-500" },
};

const timeFmt = new Intl.DateTimeFormat("ar", { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("ar", { dateStyle: "short" });

export default function MyTickets() {
  const [list, setList] = useState<TicketRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [status, setStatus] = useState("open");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const scrollBoxRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    const box = scrollBoxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, []);

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      const data = await res.json();
      setList(data.tickets ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    const res = await fetch(`/api/tickets?id=${id}`);
    const data = await res.json();
    if (data.messages) {
      setMsgs(data.messages);
      setStatus(data.ticket.status);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!activeId) return;
    void loadThread(activeId);
    const t = setInterval(() => loadThread(activeId), 8000);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  useEffect(() => {
    scrollToBottom();
  }, [msgs.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          activeId ? { ticketId: activeId, body } : { subject, body }
        ),
      });
      const data = await res.json();
      if (res.ok) {
        setText("");
        setSubject("");
        setCreating(false);
        if (!activeId) setActiveId(data.ticketId);
        else setMsgs((m) => [...m, data.message]);
        void loadList();
      }
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="grid h-40 place-items-center">
        <Loader2 className="size-6 animate-spin text-neutral-300" />
      </div>
    );
  }

  /* ---------------- thread view ---------------- */
  if (activeId) {
    return (
      <div className="overflow-hidden rounded-3xl border border-neutral-200/80 dark:border-white/[0.07]">
        <div className="flex items-center gap-3 border-b border-neutral-200/70 bg-white p-4 dark:border-white/[0.07] dark:bg-neutral-900">
          <button
            onClick={() => {
              setActiveId(null);
              setMsgs([]);
            }}
            className="grid size-9 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
            aria-label="رجوع"
          >
            <ArrowRight className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">
              {list.find((t) => t.id === activeId)?.subject ?? "تذكرة"}
            </p>
            <p className="font-display text-[10px] font-bold text-neutral-400">
              {list.find((t) => t.id === activeId)?.code}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[10px] font-black",
              (STATUS_META[status] ?? STATUS_META.open).cls
            )}
          >
            {(STATUS_META[status] ?? STATUS_META.open).label}
          </span>
        </div>

        <div
          ref={scrollBoxRef}
          className="max-h-[420px] min-h-[280px] space-y-3 overflow-y-auto overscroll-contain bg-neutral-50 p-4 dark:bg-neutral-950/40"
          data-lenis-prevent
        >
          {msgs.map((m) =>
            m.system ? (
              <div key={m.id} className="flex justify-center">
                <p className="max-w-[85%] whitespace-pre-line rounded-xl bg-neutral-200/60 px-3 py-2 text-center text-[10px] font-bold leading-5 text-neutral-500 dark:bg-white/[0.06] dark:text-neutral-400">
                  {m.body}
                </p>
              </div>
            ) : (
              <div
                key={m.id}
                className={cn("flex", m.fromAdmin ? "justify-start" : "justify-end")}
              >
                <div
                  className={cn(
                    "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13px] leading-6 shadow-sm",
                    m.fromAdmin
                      ? "rounded-bs-sm bg-white font-bold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                      : "rounded-be-sm bg-accent font-bold text-white"
                  )}
                >
                  {m.fromAdmin && (
                    <p className="mb-1 text-[10px] font-black text-accent">
                      {m.authorName || "فريق الدعم"}
                    </p>
                  )}
                  {m.body}
                  <p
                    className={cn(
                      "mt-1 text-[9px] font-bold",
                      m.fromAdmin ? "text-neutral-400" : "text-white/60"
                    )}
                  >
                    {timeFmt.format(new Date(m.createdAt))}
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {status !== "closed" ? (
          <div className="flex items-end gap-2 border-t border-neutral-200/70 bg-white p-3 dark:border-white/[0.07] dark:bg-neutral-900">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="اكتب رسالتك للإدارة…"
              className="max-h-24 flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px] font-bold outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-800"
            />
            <button
              onClick={send}
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
            <LockKeyhole className="size-3.5" />
            التذكرة مغلقة — افتح تذكرة جديدة لأي استفسار
          </p>
        )}
      </div>
    );
  }

  /* ---------------- list view ---------------- */
  return (
    <div>
      {creating ? (
        <div className="rounded-3xl border border-neutral-200/80 p-5 dark:border-white/[0.07]">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="موضوع التذكرة (مثال: استفسار عن طلب فيزا)"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="اشرح استفسارك بالتفصيل…"
            className="mt-3 w-full resize-y rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold leading-7 outline-none focus:border-accent dark:border-white/10 dark:bg-neutral-900"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent py-3 text-xs font-black text-white transition hover:bg-accent-dark disabled:opacity-50"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              إرسال التذكرة
            </button>
            <button
              onClick={() => setCreating(false)}
              className="rounded-2xl border border-neutral-200 px-5 text-xs font-black dark:border-white/10"
            >
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 py-4 text-xs font-black text-neutral-500 transition hover:border-accent hover:text-accent dark:border-white/15"
        >
          <Plus className="size-4" />
          فتح تذكرة جديدة
        </button>
      )}

      <div className="mt-4 space-y-3">
        {list.length === 0 && !creating && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-neutral-300 py-12 text-center dark:border-white/10">
            <span className="grid size-16 place-items-center rounded-2xl bg-neutral-100 text-neutral-300 dark:bg-white/5 dark:text-neutral-600">
              <TicketIcon className="size-8" />
            </span>
            <p className="mt-4 text-sm font-black">لا توجد تذاكر بعد</p>
            <p className="mt-1.5 max-w-xs text-xs leading-6 text-neutral-500 dark:text-neutral-400">
              عند إتمام أي طلب تُفتح تذكرة تلقائياً لمتابعته مع الإدارة.
            </p>
          </div>
        )}

        {list.map((t) => {
          const st = STATUS_META[t.status] ?? STATUS_META.open;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className="flex w-full items-center gap-4 rounded-2xl border border-neutral-200/80 p-4 text-start transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg dark:border-white/[0.07]"
            >
              {t.productIcon ? (
                <IconTile name={t.productIcon} tint={t.productTint ?? "violet"} size="md" />
              ) : (
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <TicketIcon className="size-6" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="truncate text-sm font-black">{t.subject}</b>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-black", st.cls)}>
                    {st.label}
                  </span>
                  {t.unreadForUser > 0 && (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[9px] font-black text-white">
                      {t.unreadForUser} جديد
                    </span>
                  )}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-neutral-400">
                  <span className="font-display">{t.code}</span>
                  {t.orderTotal && (
                    <>
                      <span>•</span>
                      <span className="font-display text-emerald-500">
                        ${Number(t.orderTotal).toFixed(2)}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{dayFmt.format(new Date(t.lastMessageAt))}</span>
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 rotate-180 text-neutral-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
