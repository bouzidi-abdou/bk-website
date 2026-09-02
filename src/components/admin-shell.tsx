"use client";

import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Briefcase,
  Coins,
  FolderTree,
  LayoutDashboard,
  Megaphone,
  Menu,
  Shield,
  Package,
  Plus,
  ShoppingBag,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminSection =
  | "overview"
  | "products"
  | "add"
  | "categories"
  | "orders"
  | "tickets"
  | "coins"
  | "news"
  | "roles"
  | "applications"
  | "users";

const NAV: {
  group: string;
  items: {
    id: AdminSection;
    label: string;
    icon: typeof Package;
    badgeKey?: "orders" | "tickets" | "stock";
  }[];
}[] = [
  {
    group: "عام",
    items: [{ id: "overview", label: "نظرة عامة", icon: BarChart3 }],
  },
  {
    group: "المتجر",
    items: [
      { id: "products", label: "المنتجات", icon: Package, badgeKey: "stock" },
      { id: "add", label: "إضافة منتج", icon: Plus },
      { id: "categories", label: "الأقسام", icon: FolderTree },
    ],
  },
  {
    group: "المبيعات",
    items: [
      { id: "orders", label: "الطلبات", icon: ShoppingBag, badgeKey: "orders" },
      { id: "coins", label: "BK COIN", icon: Coins },
    ],
  },
  {
    group: "المحتوى",
    items: [{ id: "news", label: "الأخبار", icon: Megaphone }],
  },
  {
    group: "التوظيف",
    items: [{ id: "applications", label: "التقديمات", icon: Briefcase }],
  },
  {
    group: "الدعم",
    items: [
      { id: "tickets", label: "التذاكر", icon: Ticket, badgeKey: "tickets" },
      { id: "users", label: "الأعضاء", icon: Users },
      { id: "roles", label: "الرتب", icon: Shield },
    ],
  },
];

const TITLES: Record<AdminSection, { title: string; sub: string }> = {
  overview: { title: "نظرة عامة", sub: "إحصائيات المتجر الحية" },
  products: { title: "المنتجات", sub: "إدارة المخزون والتمييز والحذف" },
  add: { title: "إضافة منتج", sub: "أضف منتجاً جديداً للمتجر" },
  categories: { title: "الأقسام", sub: "إنشاء وتنظيم أقسام المتجر" },
  orders: { title: "الطلبات", sub: "متابعة الطلبات وتغيير حالاتها" },
  tickets: { title: "التذاكر", sub: "دعم العملاء عبر نظام التذاكر" },
  coins: { title: "BK COIN", sub: "شحن وخصم أرصدة الأعضاء" },
  news: { title: "الأخبار والإعلانات", sub: "انشر إعلانات يراها كل الأعضاء" },
  users: { title: "الأعضاء", sub: "قائمة المسجلين وإحصائياتهم" },
  roles: { title: "الرتب", sub: "أنشئ رتباً ومنحها للأعضاء" },
  applications: {
    title: "التقديمات",
    sub: "مراجعة طلبات الانضمام وإدارة أقسام التقديم",
  },
};

export default function AdminShell({
  active,
  onChange,
  badges,
  username,
  children,
}: {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
  badges: { orders: number; tickets: number; stock: number };
  username: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = TITLES[active];

  const Nav = (
    <nav className="flex h-full flex-col gap-6 p-4">
      <div className="flex items-center gap-3 rounded-2xl bg-neutral-900 p-3 text-white dark:bg-white/[0.06]">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent">
          <LayoutDashboard className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-neutral-400">
            Admin
          </p>
          <p className="truncate text-xs font-black">@{username}</p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto" data-lenis-prevent>
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">
              {group.group}
            </p>
            <div className="space-y-1">
              {group.items.map(({ id, label, icon: Icon, badgeKey }) => {
                const count = badgeKey ? badges[badgeKey] : 0;
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      onChange(id);
                      setMobileOpen(false);
                    }}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-black transition",
                      isActive
                        ? "bg-accent text-white shadow-lg shadow-accent/25"
                        : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1 text-start">{label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "grid min-w-5 place-items-center rounded-full px-1.5 py-0.5 text-[9px]",
                          isActive
                            ? "bg-white/25"
                            : "bg-rose-500 text-white"
                        )}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[248px_1fr]">
      {/* desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-24 h-[calc(100vh-8rem)] overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white dark:border-white/[0.07] dark:bg-neutral-900/70">
          {Nav}
        </div>
      </aside>

      {/* mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="flex items-center gap-2.5 rounded-2xl border border-neutral-200/80 bg-white px-4 py-3 text-xs font-black lg:hidden dark:border-white/[0.07] dark:bg-neutral-900/70"
      >
        <Menu className="size-4" />
        الأقسام
        <span className="ms-auto text-neutral-400">{meta.title}</span>
      </button>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden" data-lenis-prevent>
          <div
            className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 end-0 w-72 overflow-hidden border-s border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-neutral-900">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute end-3 top-3 z-10 grid size-8 place-items-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
            {Nav}
          </div>
        </div>
      )}

      {/* content */}
      <section className="min-w-0">
        <header className="mb-5 border-b border-neutral-200/70 pb-4 dark:border-white/[0.07]">
          <h2 className="text-xl font-black md:text-2xl">{meta.title}</h2>
          <p className="mt-1 text-xs font-bold text-neutral-400">{meta.sub}</p>
        </header>
        {children}
      </section>
    </div>
  );
}
