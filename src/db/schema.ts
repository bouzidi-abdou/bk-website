import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    discordId: text("discord_id").notNull().unique(),
    username: text("username").notNull(),
    globalName: text("global_name"),
    avatar: text("avatar"),
    email: text("email"),
    balance: numeric("balance", { precision: 14, scale: 0 })
      .notNull()
      .default("0"),
    displayName: text("display_name"),
    bio: text("bio"),
    bannerUrl: text("banner_url"),
    avatarUrl: text("avatar_url"),
    accentColor: text("accent_color").notNull().default("violet"),
    location: text("location"),
    website: text("website"),
    verified: boolean("verified").notNull().default(false),
    verifiedUntil: timestamp("verified_until", { withTimezone: true }),
    plan: text("plan").notNull().default("free"),
    seller: boolean("seller").notNull().default(false),
    sellerSince: timestamp("seller_since", { withTimezone: true }),
    activeEffect: text("active_effect"),
    activeFrame: text("active_frame"),
    role: text("role").notNull().default("member"),
    profilePublic: boolean("profile_public").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("users_discord_id_idx").on(t.discordId)]
);

/** BK COIN ledger — 100 BK COIN = 1 USD */
export const coinTx = pgTable(
  "coin_tx",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 14, scale: 0 }).notNull(),
    kind: text("kind").notNull().default("topup"), // topup | deduct | purchase | refund
    note: text("note"),
    byAdmin: text("by_admin"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("coin_tx_user_idx").on(t.userId)]
);

/** Support chat between customers and the admin team */
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    fromAdmin: boolean("from_admin").notNull().default(false),
    authorName: text("author_name"),
    readByAdmin: boolean("read_by_admin").notNull().default(false),
    readByUser: boolean("read_by_user").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("messages_user_idx").on(t.userId, t.createdAt)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    nameEn: text("name_en"),
    description: text("description").notNull(),
    category: text("category").notNull(),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    oldPrice: numeric("old_price", { precision: 10, scale: 2 }),
    icon: text("icon").notNull().default("Package"),
    tint: text("tint").notNull().default("violet"),
    imageUrl: text("image_url"),
    publisherId: uuid("publisher_id"),
    couponCode: text("coupon_code"),
    couponPercent: integer("coupon_percent"),
    badge: text("badge"),
    deliveryTime: text("delivery_time").notNull().default("فوري"),
    stock: integer("stock").notNull().default(250),
    rating: numeric("rating", { precision: 2, scale: 1 })
      .notNull()
      .default("5.0"),
    sales: integer("sales").notNull().default(0),
    features: jsonb("features").$type<string[]>().notNull().default([]),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("products_category_idx").on(t.category),
    index("products_featured_idx").on(t.featured),
  ]
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(1),
    unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
    discount: numeric("discount", { precision: 10, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    coupon: text("coupon"),
    paymentMethod: text("payment_method").notNull().default("paypal"),
    status: text("status").notNull().default("processing"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("orders_user_idx").on(t.userId)]
);

export const visits = pgTable(
  "visits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    path: text("path").notNull().default("/"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("visits_created_idx").on(t.createdAt)]
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    name: text("name").notNull(),
    icon: text("icon").notNull().default("Shield"),
    color: text("color").notNull().default("violet"),
    sortOrder: integer("sort_order").notNull().default(100),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("roles_key_idx").on(t.key)]
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("user_roles_user_idx").on(t.userId)]
);

export const userEffects = pgTable(
  "user_effects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    effectId: text("effect_id").notNull(),
    kind: text("kind").notNull().default("effect"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("user_effects_user_idx").on(t.userId)]
);

export const news = pgTable(
  "news",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    sections: jsonb("sections")
      .$type<{ heading: string; content: string }[]>()
      .default([]),
    kind: text("kind").notNull().default("news"), // news | update | offer | alert
    pinned: boolean("pinned").notNull().default(false),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    authorName: text("author_name"),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("news_created_idx").on(t.createdAt)]
);

export const newsLikes = pgTable(
  "news_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    newsId: uuid("news_id")
      .notNull()
      .references(() => news.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("news_likes_uniq_idx").on(t.newsId, t.userId)]
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull(),
    icon: text("icon").notNull().default("Package"),
    tint: text("tint").notNull().default("violet"),
    sortOrder: integer("sort_order").notNull().default(100),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("categories_key_idx").on(t.key)]
);

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("open"), // open | pending | closed
    priority: text("priority").notNull().default("normal"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    unreadForAdmin: integer("unread_for_admin").notNull().default(0),
    unreadForUser: integer("unread_for_user").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("tickets_user_idx").on(t.userId),
    index("tickets_status_idx").on(t.status),
  ]
);

export const ticketMessages = pgTable(
  "ticket_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    fromAdmin: boolean("from_admin").notNull().default(false),
    authorName: text("author_name"),
    system: boolean("system").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("ticket_messages_ticket_idx").on(t.ticketId, t.createdAt)]
);

export const applicationTypes = pgTable(
  "application_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description").notNull().default(""),
    icon: text("icon").notNull().default("Briefcase"),
    tint: text("tint").notNull().default("violet"),
    terms: jsonb("terms").$type<string[]>().notNull().default([]),
    grantsRole: text("grants_role").notNull().default("seller"),
    open: boolean("open").notNull().default(true),
    closedNote: text("closed_note"),
    sortOrder: integer("sort_order").notNull().default(100),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("application_types_key_idx").on(t.key)]
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    typeId: uuid("type_id")
      .notNull()
      .references(() => applicationTypes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    nickname: text("nickname"),
    location: text("location"),
    age: text("age"),
    hobbies: text("hobbies"),
    productTypes: text("product_types"),
    experience: text("experience"),
    contact: text("contact"),
    note: text("note"),
    status: text("status").notNull().default("pending"),
    adminNote: text("admin_note"),
    reviewedBy: text("reviewed_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("applications_user_idx").on(t.userId),
    index("applications_status_idx").on(t.status),
  ]
);

export type ApplicationType = typeof applicationTypes.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type News = typeof news.$inferSelect;
export type UserEffect = typeof userEffects.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type CoinTx = typeof coinTx.$inferSelect;
export type Message = typeof messages.$inferSelect;
