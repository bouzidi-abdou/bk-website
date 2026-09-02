import { env } from "./env";
import { avatarUrl } from "./discord";

const API = "https://discord.com/api/v10";

/* -------------------- Components V2 building blocks -------------------- */
const IS_COMPONENTS_V2 = 1 << 15; // 32768

const T = {
  ACTION_ROW: 1,
  BUTTON: 2,
  SECTION: 9,
  TEXT_DISPLAY: 10,
  THUMBNAIL: 11,
  SEPARATOR: 14,
  CONTAINER: 17,
} as const;

const BTN_LINK = 5;

/** Unified silver / grey accent for every container */
const SILVER = 0x9ca3af;

/** Discord role that must be pinged for every notification */
const ADMIN_ROLE_PING = "1543204183644045342";

const PAY_LABEL: Record<string, string> = {
  card: "بطاقة بنكية",
  balance: "BK COIN",
  paypal: "PayPal",
  crypto: "كريبتو",
};

const STATUS_LABEL: Record<string, string> = {
  processing: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
  refunded: "مسترجع",
};

function text(content: string) {
  return { type: T.TEXT_DISPLAY, content };
}

function separator(divider = true, spacing = 1) {
  return { type: T.SEPARATOR, divider, spacing };
}

function linkButton(label: string, url: string) {
  return { type: T.BUTTON, style: BTN_LINK, label, url };
}

/** key: value rows aligned as a clean bordered block */
function fieldBlock(rows: [string, string][]) {
  const width = Math.max(...rows.map(([k]) => k.length));
  const body = rows
    .map(([k, v]) => `${k.padEnd(width, " ")} : ${v}`)
    .join("\n");
  return text("```\n" + body + "\n```");
}

async function postWebhook(payload: Record<string, unknown>): Promise<boolean> {
  const url = env.DISCORD_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(`${url}?with_components=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[notify] webhook failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[notify] webhook error:", e);
    return false;
  }
}

/**
 * Sends the role ping as a plain message first (so admins get a real
 * notification), then the silver container right after it.
 */
async function send(container: Record<string, unknown>) {
  const url = env.DISCORD_WEBHOOK_URL;
  if (url) {
    await postWebhook({
      content: `<@&${ADMIN_ROLE_PING}>`,
      allowed_mentions: { parse: [], roles: [ADMIN_ROLE_PING] },
    });
    return postWebhook({ flags: IS_COMPONENTS_V2, components: [container] });
  }
  await dmAdmins({ flags: IS_COMPONENTS_V2, components: [container] });
  return true;
}

/* ------------------------------- DM fallback ---------------------------- */

async function openDm(botToken: string, userId: string): Promise<string | null> {
  const res = await fetch(`${API}/users/@me/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: userId }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ?? null;
}

async function dmAdmins(payload: unknown) {
  const botToken = env.DISCORD_BOT_TOKEN;
  const admins = env.ADMIN_DISCORD_IDS;
  if (!botToken || admins.length === 0) return;
  await Promise.allSettled(
    admins.map(async (id) => {
      const ch = await openDm(botToken, id);
      if (!ch) return;
      await fetch(`${API}/channels/${ch}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bot ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }).catch(() => {});
    })
  );
}

/* ------------------------------ new order ------------------------------- */

export type NewOrderPayload = {
  code: string;
  productName: string;
  productSlug: string;
  quantity: number;
  total: string;
  paymentMethod: string;
  status?: string;
  buyerUsername: string;
  buyerGlobalName?: string | null;
  buyerDiscordId: string;
  buyerAvatarHash?: string | null;
  ticketCode?: string | null;
  origin: string;
};

export async function notifyAdminsNewOrder(p: NewOrderPayload) {
  const site = p.origin.replace(/\/+$/, "");
  const avatar = avatarUrl(p.buyerDiscordId, p.buyerAvatarHash ?? null, 128);

  const container = {
    type: T.CONTAINER,
    accent_color: SILVER,
    components: [
      text("## طلب جديد"),
      text("-# BK MARKET — نظام الطلبات"),
      separator(),
      {
        type: T.SECTION,
        components: [
          text(
            [
              `**${p.buyerGlobalName || p.buyerUsername}**`,
              `<@${p.buyerDiscordId}>`,
              `-# @${p.buyerUsername} · ${p.buyerDiscordId}`,
            ].join("\n")
          ),
        ],
        accessory: {
          type: T.THUMBNAIL,
          media: { url: avatar },
          description: p.buyerUsername,
        },
      },
      separator(),
      text("**تفاصيل الطلب**"),
      fieldBlock([
        ["المنتج", p.productName],
        ["الكمية", String(p.quantity)],
        ["الإجمالي", `$${p.total}`],
        ["طريقة الدفع", PAY_LABEL[p.paymentMethod] ?? p.paymentMethod],
        ["الحالة", STATUS_LABEL[p.status ?? "processing"] ?? "قيد التنفيذ"],
        ["رقم الطلب", p.code],
        ...(p.ticketCode
          ? ([["التذكرة", p.ticketCode]] as [string, string][])
          : []),
      ]),
      separator(),
      text(`-# <t:${Math.floor(Date.now() / 1000)}:F>`),
      {
        type: T.ACTION_ROW,
        components: [
          linkButton("Go to Dashboard", `${site}/admin`),
          linkButton("Go to Product", `${site}/product/${p.productSlug}`),
        ],
      },
    ],
  };

  await send(container);
}

/* --------------------------- support message ---------------------------- */

type NewMessagePayload = {
  body: string;
  username: string;
  globalName?: string | null;
  discordId: string;
  avatarHash?: string | null;
  ticketCode?: string | null;
  origin: string;
};

export async function notifyAdminsNewMessage(p: NewMessagePayload) {
  const site = p.origin.replace(/\/+$/, "");
  const avatar = avatarUrl(p.discordId, p.avatarHash ?? null, 128);

  const container = {
    type: T.CONTAINER,
    accent_color: SILVER,
    components: [
      text(p.ticketCode ? "## رسالة في تذكرة" : "## رسالة جديدة"),
      text("-# BK MARKET — نظام الدعم"),
      separator(),
      {
        type: T.SECTION,
        components: [
          text(
            [
              `**${p.globalName || p.username}**`,
              `<@${p.discordId}>`,
              `-# @${p.username}${p.ticketCode ? ` · ${p.ticketCode}` : ""}`,
            ].join("\n")
          ),
        ],
        accessory: {
          type: T.THUMBNAIL,
          media: { url: avatar },
          description: p.username,
        },
      },
      separator(),
      text("**نص الرسالة**"),
      text(`> ${p.body.slice(0, 800).replace(/\n/g, "\n> ")}`),
      separator(),
      text(`-# <t:${Math.floor(Date.now() / 1000)}:F>`),
      {
        type: T.ACTION_ROW,
        components: [
          linkButton("Go to Dashboard", `${site}/admin`),
          linkButton("Open Tickets", `${site}/admin/tickets`),
        ],
      },
    ],
  };

  await send(container);
}

/* --------------------------- order status change ------------------------ */

export async function notifyOrderStatus(p: {
  code: string;
  productName: string;
  status: string;
  username: string;
  discordId: string;
  total: string;
  origin: string;
}) {
  const site = p.origin.replace(/\/+$/, "");

  const container = {
    type: T.CONTAINER,
    accent_color: SILVER,
    components: [
      text("## تحديث حالة طلب"),
      text("-# BK MARKET — نظام الطلبات"),
      separator(),
      fieldBlock([
        ["المنتج", p.productName],
        ["العميل", `@${p.username}`],
        ["القيمة", `$${p.total}`],
        ["الحالة", STATUS_LABEL[p.status] ?? p.status],
        ["رقم الطلب", p.code],
      ]),
      text(`<@${p.discordId}>`),
      separator(),
      {
        type: T.ACTION_ROW,
        components: [linkButton("Go to Dashboard", `${site}/admin`)],
      },
    ],
  };

  await send(container);
}

/* ------------------------------ test ping ------------------------------- */

export async function sendTestNotification(origin: string) {
  const site = origin.replace(/\/+$/, "");
  const container = {
    type: T.CONTAINER,
    accent_color: SILVER,
    components: [
      text("## اختبار الإشعارات"),
      text("-# BK MARKET — فحص النظام"),
      separator(),
      text(
        "إن وصلتك هذه الرسالة فنظام الإشعارات يعمل بشكل صحيح، وستستقبل كل الطلبات والرسائل الجديدة في هذه القناة تلقائياً."
      ),
      separator(),
      {
        type: T.ACTION_ROW,
        components: [
          linkButton("Go to Dashboard", `${site}/admin`),
          linkButton("Go to Store", `${site}/store`),
        ],
      },
    ],
  };
  await send(container);
  return true;
}

type NewApplicationPayload = {
  code: string;
  typeTitle: string;
  fullName: string;
  productTypes: string;
  username: string;
  globalName?: string | null;
  discordId: string;
  avatarHash?: string | null;
  origin: string;
};

/** Notifies the team when a member submits a recruitment application. */
export async function notifyAdminsNewApplication(p: NewApplicationPayload) {
  const site = p.origin.replace(/\/+$/, "");
  const avatar = avatarUrl(p.discordId, p.avatarHash ?? null, 128);

  const container = {
    type: T.CONTAINER,
    accent_color: SILVER,
    components: [
      text("## طلب تقديم جديد"),
      text("-# BK MARKET — نظام التوظيف"),
      separator(),
      {
        type: T.SECTION,
        components: [
          text(
            [
              `**${p.globalName || p.username}**`,
              `<@${p.discordId}>`,
              `-# @${p.username}`,
            ].join("\n")
          ),
        ],
        accessory: {
          type: T.THUMBNAIL,
          media: { url: avatar },
          description: p.username,
        },
      },
      separator(),
      fieldBlock([
        ["القسم", p.typeTitle],
        ["الاسم", p.fullName],
        ["المنتجات", p.productTypes.slice(0, 60)],
        ["رقم الطلب", p.code],
      ]),
      separator(),
      text(`-# <t:${Math.floor(Date.now() / 1000)}:F>`),
      {
        type: T.ACTION_ROW,
        components: [
          linkButton("Review Application", `${site}/admin`),
          linkButton("Go to Store", `${site}/store`),
        ],
      },
    ],
  };

  await send(container);
}
