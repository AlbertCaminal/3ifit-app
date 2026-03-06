import { NextResponse } from "next/server";
import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTIVITY_REMINDER_HOUR = 14;

function getReminderPayload(title: string, body: string) {
  return { title, body, icon: "/icons/icon-192.png" };
}

async function handleCron() {
  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: "VAPID keys no configuradas" },
      { status: 500 }
    );
  }

  webPush.setVapidDetails(
    "mailto:3ifit@empresa.com",
    vapidPublic,
    vapidPrivate
  );

  const supabase = createAdminClient();
  const now = new Date();
  const currentHour = now.getHours();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (!subs?.length) {
    return NextResponse.json({ sent: 0, message: "Sin suscripciones" });
  }

  const userIds = subs.map((s) => s.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .in("id", userIds)
    .eq("notifications_enabled", true);

  const enabledIds = new Set((profiles ?? []).map((p) => p.id));
  let sent = 0;

  for (const sub of subs) {
    if (!enabledIds.has(sub.user_id)) continue;

    const { data } = await supabase.rpc("get_home_data", {
      p_user_id: sub.user_id,
    });

    if (!data || typeof data !== "object") continue;
    const obj = data as Record<string, unknown>;
    const daysTotal = (obj.days_total as number) ?? 3;
    const daysCompleted = (obj.days_completed as number) ?? 0;
    const daysRemaining = Math.max(0, daysTotal - daysCompleted);
    const hasActivityToday = ((obj.today_minutes as number) ?? 0) > 0;

    const payloads: Array<{ title: string; body: string; icon: string }> = [];

    if (daysRemaining > 0 && daysRemaining <= 3) {
      const daysText = daysRemaining === 1 ? "1 día" : `${daysRemaining} días`;
      payloads.push(
        getReminderPayload(
          "Plan semanal",
          `Te faltan ${daysText} para completar tu plan esta semana`
        )
      );
    }

    if (!hasActivityToday && currentHour >= ACTIVITY_REMINDER_HOUR) {
      payloads.push(
        getReminderPayload(
          "Actividad diaria",
          "Aún no has registrado actividad hoy, ¡no pierdas tu racha!"
        )
      );
    }

    for (const payload of payloads) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
          { TTL: 86400 }
        );
        sent++;
      } catch (err) {
        if (err && typeof err === "object" && "statusCode" in err) {
          const status = (err as { statusCode: number }).statusCode;
          if (status === 410 || status === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("user_id", sub.user_id);
          }
        }
      }
    }
  }

  return NextResponse.json({ sent });
}

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  return !!cronSecret && authHeader === `Bearer ${cronSecret}`;
}

/** Vercel Cron envía GET; también aceptamos POST para pruebas manuales */
export async function GET(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return handleCron();
}

export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return handleCron();
}
