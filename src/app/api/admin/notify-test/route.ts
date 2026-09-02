import { NextResponse, type NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { env } from "@/lib/env";
import { publicOrigin, sameOrigin } from "@/lib/security";
import { sendTestNotification } from "@/lib/notify";

const API = "https://discord.com/api/v10";

/**
 * Diagnoses exactly why admin DMs are (or aren't) delivered,
 * and sends a live test message to every configured admin.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ message: "سجّل دخولك أولاً" }, { status: 401 });
  }
  if (!(await isAdminUser(session.discordId))) {
    return NextResponse.json({ message: "لا تملك صلاحيات الإدارة" }, { status: 403 });
  }
  if (!sameOrigin(req)) {
    return NextResponse.json({ message: "مصدر غير موثوق" }, { status: 403 });
  }

  const botToken = env.DISCORD_BOT_TOKEN;
  const admins = env.ADMIN_DISCORD_IDS;
  const site = publicOrigin(req).replace(/\/+$/, "");

  // Preferred path: channel webhook (no DM restrictions at all)
  if (env.DISCORD_WEBHOOK_URL) {
    const sent = await sendTestNotification(site);
    return NextResponse.json({
      ok: sent,
      transport: "webhook",
      webhookConfigured: true,
      message: sent
        ? "تم إرسال رسالة الاختبار إلى قناة الطلبات بنجاح ✅"
        : "فشل الإرسال — تحقق من صحة DISCORD_WEBHOOK_URL",
    });
  }

  const checks: Record<string, unknown> = {
    webhookConfigured: false,
    botTokenConfigured: Boolean(botToken),
    adminIdsConfigured: admins.length > 0,
    adminIds: admins,
    yourDiscordId: session.discordId,
    youAreInAdminList: admins.includes(session.discordId),
  };

  if (!botToken) {
    return NextResponse.json({
      ok: false,
      checks,
      problem: "DISCORD_BOT_TOKEN غير موجود",
      fix: "أنشئ بوت من Discord Developer Portal → Bot → Reset Token، وأضف القيمة في متغيرات البيئة باسم DISCORD_BOT_TOKEN ثم أعد النشر.",
    });
  }

  if (admins.length === 0) {
    return NextResponse.json({
      ok: false,
      checks,
      problem: "ADMIN_DISCORD_IDS فارغة",
      fix: "أضف معرّفات ديسكورد للمشرفين مفصولة بفواصل في ADMIN_DISCORD_IDS.",
    });
  }

  // 1) is the bot token valid?
  let botUser: { username?: string; id?: string } | null = null;
  try {
    const meRes = await fetch(`${API}/users/@me`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: "no-store",
    });
    if (!meRes.ok) {
      return NextResponse.json({
        ok: false,
        checks: { ...checks, botTokenValid: false, status: meRes.status },
        problem: "توكن البوت غير صالح",
        fix: "أعد إنشاء التوكن من Developer Portal → Bot → Reset Token وتأكد من نسخه بدون مسافات أو علامات اقتباس.",
      });
    }
    botUser = await meRes.json();
    checks.botTokenValid = true;
    checks.botUsername = botUser?.username;
  } catch (e) {
    return NextResponse.json({
      ok: false,
      checks,
      problem: "تعذّر الاتصال بواجهة ديسكورد",
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  // 2) try opening a DM + sending a test message to each admin
  const results = await Promise.all(
    admins.map(async (adminId) => {
      try {
        const dmRes = await fetch(`${API}/users/@me/channels`, {
          method: "POST",
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipient_id: adminId }),
          cache: "no-store",
        });

        if (!dmRes.ok) {
          const text = await dmRes.text();
          return {
            adminId,
            delivered: false,
            status: dmRes.status,
            error: text.slice(0, 200),
            hint:
              dmRes.status === 400
                ? "البوت لا يشارك أي سيرفر مع هذا الحساب — أضف البوت لسيرفرك وتأكد أن المشرف عضو فيه."
                : "تحقق من صحة معرّف ديسكورد.",
          };
        }

        const channel = (await dmRes.json()) as { id: string };
        const msgRes = await fetch(`${API}/channels/${channel.id}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            embeds: [
              {
                title: "✅ اختبار إشعارات BK MARKET",
                description:
                  "هذه رسالة تجريبية — إن وصلتك فنظام الإشعارات يعمل بشكل صحيح وستستقبل كل الطلبات والرسائل الجديدة هنا.",
                color: 0x5865f2,
                fields: [{ name: "🌐 الموقع", value: site }],
                timestamp: new Date().toISOString(),
              },
            ],
          }),
          cache: "no-store",
        });

        if (!msgRes.ok) {
          const text = await msgRes.text();
          return {
            adminId,
            delivered: false,
            status: msgRes.status,
            error: text.slice(0, 200),
            hint:
              "الرسائل الخاصة مغلقة — من إعدادات ديسكورد: Privacy & Safety → فعّل استقبال الرسائل الخاصة من أعضاء السيرفر.",
          };
        }

        return { adminId, delivered: true };
      } catch (e) {
        return {
          adminId,
          delivered: false,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    })
  );

  const okCount = results.filter((r) => r.delivered).length;

  return NextResponse.json({
    ok: okCount > 0,
    checks,
    results,
    summary: `تم إرسال ${okCount} من ${admins.length} رسالة اختبار بنجاح`,
  });
}
