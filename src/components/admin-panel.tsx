"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Loader2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Trash2,
  TriangleAlert,
  Users,
  Coins,
  Ticket,
  Pencil,
  Store,
} from "lucide-react";
import IconTile from "./icon-tile";
import AdminShell, { type AdminSection } from "./admin-shell";
import AdminCategories from "./admin-categories";
import AdminNews from "./admin-news";
import AdminRoles from "./admin-roles";
import AdminApplications from "./admin-applications";
import ProductEditor, { type EditableProduct } from "./product-editor";
import ConfirmDialog from "./confirm-dialog";
import VerifiedBadge from "./verified-badge";
import AdminTickets from "./admin-tickets";
import AdminCoins from "./admin-coins";
import DiscordIcon from "./discord-icon";
import ProductIcon, { ICONS } from "./product-icon";
import { sfx } from "@/lib/sounds";
import { TINTS, cn } from "@/lib/utils";

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  icon: string;
  tint: string;
  stock: number;
  sales: number;
  featured: boolean;
  description?: string;
  badge?: string | null;
  deliveryTime?: string | null;
  imageUrl?: string | null;
  couponCode?: string | null;
  couponPercent?: number | null;
};

export type AdminOrder = {
  id: string;
  code: string;
  productName: string;
  icon: string;
  tint: string;
  quantity: number;
  total: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  buyer: string;
};

export type AdminUser = {
  id: string;
  seller?: boolean;
  plan?: string;
  verified?: boolean;
  username: string;
  globalName: string | null;
  discordId: string;
  avatar: string;
  createdAt: string;
  orderCount: number;
  spent: string;
};



const ICON_KEYS = Object.keys(ICONS);
const TINT_KEYS = Object.keys(TINTS);

const STATUS_META: Record<string, { label: string; cls: string }> = {
  processing: { label: "قيد التنفيذ", cls: "bg-amber-500/10 text-amber-500 ring-amber-500/20" },
  completed: { label: "مكتمل", cls: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" },
  cancelled: { label: "ملغي", cls: "bg-rose-500/10 text-rose-500 ring-rose-500/20" },
  refunded: { label: "مسترجع", cls: "bg-blue-500/10 text-blue-500 ring-blue-500/20" },
};

const inputCls =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-bold outline-none transition placeholder:font-semibold placeholder:text-neutral-400 focus:border-accent focus:ring-2 focus:ring-accent/20 dark:border-white/10 dark:bg-neutral-900";
const labelCls = "mb-2 block text-xs font-black text-neutral-500 dark:text-neutral-400";

export default function AdminPanel({
  initialProducts,
  initialOrders,
  initialUsers,
  categories,
  username,
  overview,
}: {
  initialProducts: AdminProduct[];
  initialOrders: AdminOrder[];
  initialUsers: AdminUser[];
  categories: { key: string; ar: string }[];
  username: string;
  overview: ReactNode;
}) {
  const categoriesDefault = categories[0]?.key ?? "cards";
  const [tab, setTab] = useState<AdminSection>("overview");
  const [items, setItems] = useState(initialProducts);
  const [orders, setOrders] = useState(initialOrders);
  const [members, setMembers] = useState(initialUsers);

  const [userAction, setUserAction] = useState<{
    user: AdminUser;
    kind: "seller" | "plan";
    value: boolean | string;
  } | null>(null);
  const [userBusy, setUserBusy] = useState(false);

  async function applyUserAction() {
    if (!userAction) return;
    setUserBusy(true);
    const { user, kind, value } = userAction;
    try {
      const payload =
        kind === "seller"
          ? { userId: user.id, seller: value as boolean }
          : { userId: user.id, plan: value as string, days: 30 };

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMembers((l) =>
          l.map((u) =>
            u.id === user.id
              ? kind === "seller"
                ? { ...u, seller: value as boolean }
                : {
                    ...u,
                    plan: value as string,
                    verified: value !== "free",
                  }
              : u
          )
        );
        router.refresh();
      }
    } finally {
      setUserBusy(false);
      setUserAction(null);
    }
  }
  const [search, setSearch] = useState("");
  const router = useRouter();

  /* ------------------------------ add form ------------------------------ */
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    nameEn: "",
    description: "",
    category: categoriesDefault,
    price: "",
    oldPrice: "",
    stock: "100",
    deliveryTime: "فوري",
    badge: "",
    tint: "violet",
    icon: "Package",
    imageUrl: "",
    featured: false,
    features: "",
  });
  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "حدث خطأ");
      sfx.success();
      setMsg({ ok: true, text: `تمت إضافة "${data.product.name}" بنجاح` });
      setForm((f) => ({
        ...f,
        name: "",
        nameEn: "",
        description: "",
        price: "",
        oldPrice: "",
        badge: "",
        imageUrl: "",
        features: "",
      }));
      router.refresh();
    } catch (e) {
      sfx.error();
      setMsg({ ok: false, text: e instanceof Error ? e.message : "حدث خطأ" });
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------- product actions -------------------------- */
  async function patchProduct(id: string, payload: { stock?: number; featured?: boolean }) {
    setItems((l) => l.map((p) => (p.id === id ? { ...p, ...payload } : p)));
    await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...payload }),
    });
  }

  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  async function remove(id: string) {
    if (confirmDelete !== id) {
      sfx.cancel();
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 2500);
      return;
    }
    sfx.cancel();
    setItems((l) => l.filter((p) => p.id !== id));
    setConfirmDelete(null);
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  /* ----------------------------- order actions --------------------------- */
  async function setOrderStatus(id: string, status: string) {
    setOrders((l) => l.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  /* -------------------------------- derived ------------------------------ */
  const filteredItems = useMemo(() => {
    const n = search.trim().toLowerCase();
    return n ? items.filter((p) => p.name.toLowerCase().includes(n)) : items;
  }, [items, search]);

  const lowStock = items.filter((p) => p.stock < 10).length;
  const pending = orders.filter((o) => o.status === "processing").length;

  return (
    <AdminShell
      active={tab}
      onChange={setTab}
      username={username}
      badges={{ orders: pending, tickets: 0, stock: lowStock }}
    >
      <div className="rounded-[1.75rem] border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-white/[0.07] dark:bg-neutral-900/70">
        {/* ========================= OVERVIEW ========================= */}
        {tab === "overview" && overview}

        {/* ========================= CATEGORIES ========================= */}
        {tab === "categories" && <AdminCategories />}


        {/* ========================= ADD PRODUCT ========================= */}
        {tab === "add" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label className={labelCls}>اسم المنتج (عربي) *</label>
              <input className={inputCls} placeholder="مثال: بطاقة فيزا افتراضية $100" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>الاسم بالإنجليزية</label>
              <input className={inputCls} dir="ltr" placeholder="Virtual Visa $100" value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>الوصف *</label>
              <textarea className={cn(inputCls, "min-h-24 resize-y leading-7")} placeholder="وصف تسويقي واضح يشرح المنتج وطريقة التسليم…" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>القسم *</label>
              <select className={cn(inputCls, "cursor-pointer appearance-none")} value={form.category} onChange={(e) => set("category", e.target.value)}>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>{c.ar}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>شارة مميزة (اختياري)</label>
              <input className={inputCls} placeholder="الأكثر مبيعاً / نادر / جديد" value={form.badge} onChange={(e) => set("badge", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>السعر $ *</label>
                <input className={inputCls} dir="ltr" inputMode="decimal" placeholder="9.99" value={form.price} onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
              <div>
                <label className={labelCls}>قبل الخصم $</label>
                <input className={inputCls} dir="ltr" inputMode="decimal" placeholder="19.99" value={form.oldPrice} onChange={(e) => set("oldPrice", e.target.value.replace(/[^\d.]/g, ""))} />
              </div>
              <div>
                <label className={labelCls}>العدد المتوفر *</label>
                <input className={inputCls} dir="ltr" inputMode="numeric" placeholder="100" value={form.stock} onChange={(e) => set("stock", e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
            <div>
              <label className={labelCls}>مدة التسليم</label>
              <input className={inputCls} placeholder="فوري — 5 دقائق" value={form.deliveryTime} onChange={(e) => set("deliveryTime", e.target.value)} />
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>رابط الصورة (اختياري — غلاف المنتج)</label>
              <div className="relative">
                <ImageIcon className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                <input className={cn(inputCls, "ps-10")} dir="ltr" placeholder="https://example.com/product.png" value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>اختر الأيقونة</label>
              <div className="grid max-h-44 grid-cols-6 gap-2 overflow-y-auto rounded-2xl border border-neutral-200 p-3 sm:grid-cols-9 dark:border-white/10" data-lenis-prevent>
                {ICON_KEYS.map((k) => (
                  <button key={k} type="button" onClick={() => { set("icon", k); }} title={k}
                    className={cn("grid aspect-square place-items-center rounded-xl border transition",
                      form.icon === k ? "border-accent bg-accent/10 text-accent" : "border-neutral-200 text-neutral-400 hover:border-neutral-400 dark:border-white/10")}>
                    <ProductIcon name={k} className="size-4.5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>لون المنتج</label>
              <div className="flex flex-wrap gap-2.5">
                {TINT_KEYS.map((k) => (
                  <button key={k} type="button" onClick={() => { set("tint", k); }} aria-label={k}
                    className={cn("grid size-10 place-items-center rounded-full transition", TINTS[k].solid,
                      form.tint === k ? "scale-110 ring-2 ring-neutral-900 ring-offset-2 dark:ring-white dark:ring-offset-neutral-900" : "opacity-50 hover:opacity-90")}>
                    {form.tint === k && <Check className="size-4.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <label className={labelCls}>المميزات (كل ميزة في سطر)</label>
              <textarea className={cn(inputCls, "min-h-24 resize-y leading-7")} placeholder={"تسليم فوري خلال دقائق\nضمان استبدال 30 يوم"} value={form.features} onChange={(e) => set("features", e.target.value)} />
            </div>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-neutral-200 p-4 transition hover:border-accent/40 dark:border-white/10 lg:col-span-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4.5 accent-accent" />
              <Star className={cn("size-4.5", form.featured ? "fill-amber-400 text-amber-400" : "text-neutral-300")} />
              <span className="text-sm font-black">منتج مميز — يظهر في مقدمة المتجر</span>
            </label>
            {msg && (
              <p className={cn("flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black lg:col-span-2",
                msg.ok ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                {msg.ok ? <Check className="size-4" /> : <TriangleAlert className="size-4" />}
                {msg.text}
              </p>
            )}
            <button onClick={submit} disabled={busy}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-neutral-900 py-4 text-sm font-black text-white transition hover:bg-neutral-700 disabled:opacity-60 dark:bg-white dark:text-neutral-900 lg:col-span-2">
              {busy ? <Loader2 className="size-4.5 animate-spin" /> : <Plus className="size-4.5" />}
              نشر المنتج في المتجر
            </button>
          </div>
        )}

        {/* ========================= PRODUCTS ========================= */}
        {tab === "products" && (
          <div>
            <div className="relative mb-5">
              <Search className="absolute start-4 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث في المنتجات…" className={cn(inputCls, "ps-11")} />
            </div>
            {lowStock > 0 && (
              <p className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-3 text-xs font-black text-amber-600 dark:text-amber-400">
                <TriangleAlert className="size-4" />
                {lowStock} منتج بمخزون منخفض (أقل من 10) — يُنصح بالتزويد
              </p>
            )}
            <div className="space-y-3">
              {filteredItems.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200/70 p-4 transition hover:border-neutral-300 dark:border-white/[0.07] dark:hover:border-white/15">
                  <IconTile name={p.icon} tint={p.tint} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-black">{p.name}</h4>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-neutral-400">
                      <span>{categories.find((c) => c.key === p.category)?.ar ?? p.category}</span>
                      <span>•</span>
                      <span className="font-display">${p.price.toFixed(2)}</span>
                      <span>•</span>
                      <span>{p.sales.toLocaleString("en")} مبيعة</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-2 py-1.5 dark:border-white/10">
                    <button onClick={() => patchProduct(p.id, { stock: Math.max(0, p.stock - 1) })} className="grid size-6 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-white/10" aria-label="إنقاص">
                      <Minus className="size-3.5" />
                    </button>
                    <span className={cn("min-w-10 text-center font-display text-xs font-bold", p.stock < 10 && "text-amber-500")}>{p.stock}</span>
                    <button onClick={() => patchProduct(p.id, { stock: p.stock + 1 })} className="grid size-6 place-items-center rounded-full text-neutral-400 transition hover:bg-neutral-100 dark:hover:bg-white/10" aria-label="زيادة">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-neutral-400">المخزون</span>
                  <button onClick={() => { patchProduct(p.id, { featured: !p.featured }); }} aria-label="تمييز"
                    className={cn("grid size-9 place-items-center rounded-full border transition",
                      p.featured ? "border-amber-400/50 bg-amber-400/10 text-amber-400" : "border-neutral-200 text-neutral-300 hover:text-amber-400 dark:border-white/10")}>
                    <Star className={cn("size-4", p.featured && "fill-amber-400")} />
                  </button>
                  <button
                    onClick={() => setEditing(p as EditableProduct)}
                    aria-label="تعديل"
                    className="grid size-9 place-items-center rounded-full border border-neutral-200 text-neutral-400 transition hover:border-accent hover:text-accent dark:border-white/10"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => remove(p.id)}
                    className={cn("grid h-9 place-items-center rounded-full border px-3 text-[10px] font-black transition",
                      confirmDelete === p.id ? "border-rose-500 bg-rose-500 text-white" : "border-neutral-200 text-neutral-400 hover:border-rose-300 hover:text-rose-500 dark:border-white/10")}>
                    {confirmDelete === p.id ? "تأكيد الحذف؟" : <Trash2 className="size-4" />}
                  </button>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <p className="py-12 text-center text-sm font-bold text-neutral-400">لا توجد منتجات مطابقة.</p>
              )}
            </div>
          </div>
        )}

        {/* ========================= ORDERS ========================= */}
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && (
              <p className="py-12 text-center text-sm font-bold text-neutral-400">لا توجد طلبات بعد.</p>
            )}
            {orders.map((o) => {
              const st = STATUS_META[o.status] ?? STATUS_META.processing;
              return (
                <div key={o.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200/70 p-4 dark:border-white/[0.07]">
                  <IconTile name={o.icon} tint={o.tint} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-black">{o.productName}</h4>
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-black ring-1 ring-inset", st.cls)}>{st.label}</span>
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-neutral-400">
                      <span className="font-display">{o.code}</span>
                      <span>•</span>
                      <span>@{o.buyer}</span>
                      <span>•</span>
                      <span>×{o.quantity}</span>
                      <span>•</span>
                      <span>{o.createdAt}</span>
                    </p>
                  </div>
                  <span className="font-display text-base font-bold text-emerald-500">${Number(o.total).toFixed(2)}</span>
                  <div className="relative">
                    <select value={o.status} onChange={(e) => setOrderStatus(o.id, e.target.value)} aria-label="تغيير الحالة"
                      className="cursor-pointer appearance-none rounded-full border border-neutral-200 bg-white py-2 ps-3 pe-8 text-[10px] font-black outline-none transition focus:border-accent dark:border-white/10 dark:bg-neutral-900">
                      {Object.entries(STATUS_META).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 size-3 -translate-y-1/2 text-neutral-400" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================= APPLICATIONS ========================= */}
        {tab === "applications" && <AdminApplications />}

        {/* ========================= ROLES ========================= */}
        {tab === "roles" && <AdminRoles />}

        {/* ========================= NEWS ========================= */}
        {tab === "news" && <AdminNews />}

        {/* ========================= TICKETS ========================= */}
        {tab === "tickets" && <AdminTickets />}

        {/* ========================= COINS ========================= */}
        {tab === "coins" && <AdminCoins />}

        {/* ========================= USERS ========================= */}
        {tab === "users" && (
          <div className="space-y-3">
            {members.length === 0 && (
              <p className="py-12 text-center text-sm font-bold text-neutral-400">لا يوجد أعضاء مسجلون بعد.</p>
            )}
            {members.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-neutral-200/70 p-4 transition hover:border-neutral-300 dark:border-white/[0.07] dark:hover:border-white/15">
                <span className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u.avatar}
                    alt={u.username}
                    loading="lazy"
                    className="size-12 rounded-full object-cover ring-2 ring-accent/40"
                  />
                  <span className="absolute -bottom-0.5 -end-0.5 grid size-4 place-items-center rounded-full bg-accent text-white ring-2 ring-white dark:ring-neutral-900">
                    <DiscordIcon className="size-2.5" />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-black">{u.globalName || u.username}</h4>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] font-bold text-neutral-400">
                    <span>@{u.username}</span>
                    <span>•</span>
                    <span className="font-display">{u.discordId}</span>
                    <span>•</span>
                    <span>انضم {u.createdAt}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() =>
                      setUserAction({ user: u, kind: "seller", value: !u.seller })
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black transition",
                      u.seller
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                        : "border-neutral-200 text-neutral-400 hover:border-emerald-300 hover:text-emerald-500 dark:border-white/10"
                    )}
                  >
                    <Store className="size-3" />
                    {u.seller ? "بائع معتمد" : "منح بائع"}
                  </button>

                  <div className="flex items-center gap-1 rounded-full border border-neutral-200 p-1 dark:border-white/10">
                    {(["basic", "premium", "free"] as const).map((pl) => (
                      <button
                        key={pl}
                        onClick={() =>
                          setUserAction({ user: u, kind: "plan", value: pl })
                        }
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[9px] font-black transition",
                          (u.plan ?? "free") === pl && u.verified !== false
                            ? pl === "premium"
                              ? "bg-amber-500 text-white"
                              : pl === "basic"
                                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                                : "bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
                            : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                        )}
                      >
                        {pl === "free" ? "إزالة" : pl.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="text-center">
                    <p className="font-display text-sm font-bold">{u.orderCount}</p>
                    <p className="text-[9px] font-bold text-neutral-400">طلب</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-sm font-bold text-emerald-500">${Number(u.spent).toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-neutral-400">أنفق</p>
                  </div>
                  <BarChart3 className="size-4 text-neutral-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {userAction && (
        <ConfirmDialog
          open
          busy={userBusy}
          onClose={() => setUserAction(null)}
          onConfirm={applyUserAction}
          tone={
            userAction.value === false || userAction.value === "free"
              ? "danger"
              : "success"
          }
          icon={
            userAction.kind === "seller" ? (
              <Store className="size-6" />
            ) : (
              <VerifiedBadge
                tier={userAction.value === "premium" ? "premium" : "basic"}
                className="size-7"
                tooltip={false}
              />
            )
          }
          title={
            userAction.kind === "seller"
              ? userAction.value
                ? "منح رتبة بائع معتمد"
                : "سحب رتبة البائع"
              : userAction.value === "free"
                ? "إزالة العضوية"
                : `منح عضوية ${String(userAction.value).toUpperCase()}`
          }
          description={
            userAction.kind === "seller"
              ? userAction.value
                ? `سيحصل ${userAction.user.username}@ على لوحة البائع وصلاحية نشر المنتجات وشارة بائع معتمد.`
                : `سيفقد ${userAction.user.username}@ الوصول للوحة البائع فوراً.`
              : userAction.value === "free"
                ? `سيتم إلغاء توثيق ${userAction.user.username}@ وإزالة مزايا العضوية.`
                : `سيتم تفعيل العضوية لمدة 30 يوماً لحساب ${userAction.user.username}@ مجاناً ودون خصم أي رصيد.`
          }
          confirmLabel="تأكيد"
        />
      )}

      {editing && (
        <ProductEditor
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={(np) => {
            setItems((l) =>
              l.map((x) =>
                x.id === np.id
                  ? {
                      ...x,
                      name: np.name,
                      category: np.category,
                      price: np.price,
                      oldPrice: np.oldPrice,
                      stock: np.stock,
                      icon: np.icon,
                      tint: np.tint,
                    }
                  : x
              )
            );
            router.refresh();
          }}
        />
      )}
    </AdminShell>
  );
}
